import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { API_BASE_URL, AI_API_URL } from '../constants';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatSidenav, MatDialog, MatSnackBar } from '@angular/material';
import { PlayerStatus } from '../player-status';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { APIService } from '../api.service';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { tap, catchError } from 'rxjs/operators';
import { MusicGenerationService } from '../music-generation.service';

export const MILLISECONDS_IN_SECOND = 1000;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('canvas') canvasRef: ElementRef;
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild(AudioPlayerComponent) audioPlayer: AudioPlayerComponent;

  /* ----------- Constants -------- */
  private SNACK_BAR_DURATION = 5 * 1000;

  public opened = true;
  public musicLength: number = 0;
  public instruments = {
    "acoustic_grand_piano": 0,
    "acoustic_guitar_nylon": 24,
    "acoustic_guitar_steel": 25,
    "alto_sax": 65,
    "baritone_sax": 67,
    // "bassoon": 70,
    "brass_section": 61,
    // "clarinet": 71,
    "distortion_guitar": 30,
    "electric_bass_finger": 33,
    "electric_bass_pick": 34,
    "electric_guitar_jazz": 26,
    "flute": 73,
    "soprano_sax": 64,
    "synth_drum": 118,
    "tabla": 118,
    "tenor_sax": 66,
    "trumpet": 56,
  };

  public get instrumentsList(): string[] {
    return Object.keys(this.instruments);
  }

  public app: any;
  public models = ['empty'];
  public musicFiles = ['empty'];
  public channelsInstruments: any;
  public channelsInstrumentsList:any;

  /* For ControlPanel */
  public genreList: {id: number, name: string}[];
  public instrumentList: {id: number, name: string}[];
  public keyList: {id: number, name:string}[];
  public octaveTypes = ["lower", "higher"];
  // control panel inputs
  public genreSelected: number = 0;
  public instrumentSelected: number = 0;
  public keySelected: string = "C";
  public numBars: number = 4;
  public bpm: number = 100;
  public seedLength: number = 4;
  public chordTemperature: number = 1;
  public noteCap: number = 2;
  public whichOctave: number = 1;
  public octaveType: "lower" | "higher" = "lower";
  // state of control panel
  public musicIsGenerated = false;
  public controlPanelLoading: number = 0;
  // download music link
  public DOWNLOAD_MUSIC_URL = Location.joinWithSlash(AI_API_URL, "/api/v1/music_mp3");
  public VIEW_PDF_URL = Location.joinWithSlash(AI_API_URL, "/api/v1/sheet_music/pdf");

  /* For visualizer */
  // state of visualizer
  public pianoInputEnabled: boolean = false;
  public keyIsPressed: any = {};
  public octaveKeyUpEventListener: EventListener;
  public noteKeyDownEventListener: EventListener;
  public noteKeyUpEventListener: EventListener;
  
  public parseChannelsInstruments(): any{
    let list:any = [];
    for (let channel in this.channelsInstruments) {
      if (this.channelsInstruments.hasOwnProperty(channel)) {
        list.push({
          channel: channel,
          instrument: this.channelsInstruments[channel],
        });
      }
    }
    return list;
  }

  private MIDI: any = (window as any).MIDI;

  constructor(
    private appService: AppService, 
    private authService: AuthService,
    private apiService: APIService,
    private musicGenerationService: MusicGenerationService,
    private http: HttpClient, 
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    if(!this.authService.isLoggedIn) {
      this.router.navigateByUrl('/login');
    }

    let global: any = window;
    this.app = new global.Euphony();
    this.app.initMidi(() => {
      this.app.initScene(this.canvasRef.nativeElement);
      this.MIDI.programChange(1, 24);
    });

    this.loadControlPanelInfo();
  }

  public loadControlPanelInfo() {
    this.loadCurrentlyPlayingPanelInfo();
    this.loadGenerationPanelInfo();
  }

  public loadCurrentlyPlayingPanelInfo() {
    this.controlPanelLoading--;
    this.appService.getMidiFiles()
      .pipe(
        tap(() => this.controlPanelLoading++)
      )
      .subscribe(
        (midiFiles: string[]) => {
          this.musicFiles = midiFiles;
        },
        error => {
          this.controlPanelLoading++;
          this.snackBar.open("Could not load song list from Spring Boot backend", "Dismiss", { duration:  this.SNACK_BAR_DURATION});
        }
      );
  }

  public loadGenerationPanelInfo() {
    this.controlPanelLoading--;
    this.apiService.getAllInformation()
      .pipe(
        tap(() => this.controlPanelLoading++)
      )
      .subscribe(
        ({ genre, instruments, keys }: any) => {
          this.genreList = genre;
          this.instrumentList = instruments;
          this.keyList = keys;
        },
        error => {
          this.controlPanelLoading++;
          this.snackBar.open("Could not load control panel options from Flask AI Server", "Dismiss", { duration: this.SNACK_BAR_DURATION });
        }
      );
  }

  public uploadMidiFile(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files && files[0]) {
      this.appService.uploadMidiFile(files[0])
        .subscribe(
          (response: any) => {
            if (response.filename) {
              const filename = response.filename;
              this.snackBar.open("File uploaded successfully", "Dismiss", { duration: this.SNACK_BAR_DURATION });
              this.loadCurrentlyPlayingPanelInfo();
              this.changeMidiFile(filename);
            }
            if (response.error) {
              this.snackBar.open(response.error, "Dismiss", { duration: this.SNACK_BAR_DURATION });
            }
          }
        );
    }
  }

  public togglePianoInput() {
    if (this.pianoInputEnabled) {
      this.unregisterKeyboardEventsForPianoInputs();
      this.pianoInputEnabled = false;
    } else {
      this.registerKeyboardEventsForPianoInputs();
      this.pianoInputEnabled = true;
    }
  }

  public registerKeyboardEventsForPianoInputs() {
    this.registerForPianoKeyPresses(true);
    this.registerForOctaveChangeEvents(true);    
  }

  public unregisterKeyboardEventsForPianoInputs() {
    this.registerForPianoKeyPresses(false);
    this.registerForOctaveChangeEvents(false);    
  }

  public registerForOctaveChangeEvents(register: boolean) {
    if (!this.octaveKeyUpEventListener)
      this.octaveKeyUpEventListener = (event: KeyboardEvent) => {
        const keyCode = event.keyCode;
        const SHIFT_KEY = 16;
        const CTRL_KEY = 17;
        if (keyCode === SHIFT_KEY) {
          this.musicGenerationService.increaseOctave();
        } else if (keyCode === CTRL_KEY) {
          this.musicGenerationService.decreseOctave();
        }
      };
    if (register) {
      window.addEventListener("keyup", this.octaveKeyUpEventListener);
    } else {
      window.removeEventListener("keyup", this.octaveKeyUpEventListener);
    }
  }

  public registerForPianoKeyPresses(register: boolean) {
    const handleKeyboardEvent = (event: KeyboardEvent, keyStatus: "up" | "down") => {
      const note = this.musicGenerationService.keyCodeToNote(event.keyCode);
      if (note === -1)
        return;
      if (keyStatus === "down") {
        if (!this.keyIsPressed[note]) {
          this.keyIsPressed[note] = true;
          this.musicGenerationService.playNoteOn(note);
          this.app.pressKey(note);
        }
      } else if (keyStatus === "up") {
        this.keyIsPressed[note] = false;
        this.musicGenerationService.playNoteOff(note);
        this.app.releaseKey(note);
      }
    };

    this.noteKeyDownEventListener = this.noteKeyDownEventListener ? this.noteKeyDownEventListener : (event: KeyboardEvent) => handleKeyboardEvent(event, "down");
    this.noteKeyUpEventListener = this.noteKeyUpEventListener ? this.noteKeyUpEventListener : (event: KeyboardEvent) => handleKeyboardEvent(event, "up")

    if (register) {
      window.addEventListener('keydown', this.noteKeyDownEventListener);
      window.addEventListener('keyup', this.noteKeyUpEventListener);
    } else {
      window.removeEventListener('keydown', this.noteKeyDownEventListener);
      window.removeEventListener('keyup', this.noteKeyUpEventListener);
    }
  }

  public generateMusic() {
    const generateOptions = {
      "genre_id": this.genreSelected,
      "instrument_id": this.instrumentSelected,
      "num_bars": this.numBars,
      "BPM": this.bpm,
      "chord_temperature": this.chordTemperature,
      "seed_length": this.seedLength,

      "note_cap": this.noteCap,

      "key": this.keySelected,
      "octave_type": this.octaveType,
      "which_octave": this.whichOctave,
    };
    this.controlPanelLoading--;
    this.apiService.generateMusic(generateOptions)
      .pipe(
        tap(() => this.musicIsGenerated = true),
        tap(() => this.controlPanelLoading++)
      )
      .subscribe(
        (response: any) => {
          this.reloadPdfAndDownloadUrl();
          const midiPath = response.link;
          const midiUrl = Location.joinWithSlash(AI_API_URL, Location.joinWithSlash("/api/v1/file/", midiPath));
          this.changeMidiTrack(`${midiUrl}?random=${Math.random()}`);
        },
        error => {
          this.controlPanelLoading++;
          this.snackBar.open("Some error occurred. Could not generate music", "Dismiss", { duration: this.SNACK_BAR_DURATION });
        }
      );
  }

  public modifyMusic() {
    const modifyOptions = {
      "key": this.keySelected,
      "octave_type": this.octaveType,
      "whichOctave": this.whichOctave,
    };
    this.controlPanelLoading--;
    this.apiService.modifyMusic(modifyOptions)
      .pipe(
        tap(() => this.controlPanelLoading++)
      )
      .subscribe(
        (response: any) => {
          this.reloadPdfAndDownloadUrl();
          const midiPath = response.link;
          const midiUrl = Location.joinWithSlash(AI_API_URL, Location.joinWithSlash("/api/v1/file/", midiPath));
          this.changeMidiTrack(`${midiUrl}?random=${Math.random()}`);
        },
        error => {
          this.controlPanelLoading++;
          this.snackBar.open("Some error occurred. Could not modify music", "Dismiss", { duration: this.SNACK_BAR_DURATION });
        }
      );
  }

  private reloadPdfAndDownloadUrl() {
    this.VIEW_PDF_URL = Location.joinWithSlash(AI_API_URL, `/api/v1/sheet_music/pdf?random=${Math.random()}`)
    this.DOWNLOAD_MUSIC_URL = Location.joinWithSlash(AI_API_URL, `/api/v1/music_mp3?random=${Math.random()}`)
  }

  // ------------------ This is not needed, not until we solve problem with displaying pdf ----------------
  public viewMusicSheet() {
    const pdfUrl = Location.joinWithSlash(AI_API_URL, "/api/v1/sheet_music/pdf");
    const dialogRef = this.dialog.open(PdfViewerComponent, {
      width: '90%',
      height: '90%',
      data: {pdfUrl: pdfUrl}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log("The dialog was closed");
    })
  }

  public shouldDisableDownloadAsMp3Button() {
    const disabledInstrumentIdList: Array<number> = [6, 8, 10, 11, 13, 25, 26, 27];
    const predicate = (instrumentId: number) => instrumentId === this.instrumentSelected;
    if (disabledInstrumentIdList.findIndex(predicate) === -1) {
      return false;
    }
    return true;
  }

  public logoutClick() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  public toggleSideNav() {
    this.sidenav.toggle();
    this.app.resize();
  }

  public midiFileChange(event: any) {
    this.changeMidiFile(event.value);
  }

  public soundFontChange(event: any, channel: number) {
    const wasPlaying = this.audioPlayer.isPlaying;
    this.audioPlayer.pause();
    const prevChannel = channel;
    const nextInstrument = event.value;
    const nextChannel = this.instruments[event.value];

    this.controlPanelLoading--;
    this.MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instruments: [ nextInstrument ],
      onsuccess: () => {
        this.controlPanelLoading++;
        this.MIDI.programChange(prevChannel, nextChannel);
        if (wasPlaying)
          this.audioPlayer.resume();
      }
    })
  }

  public handlePlayerStatusChange({isPlaying, timePosition}: PlayerStatus) {
    if (isPlaying) {
      if (!this.app.playing) {
        this.app.resume();
      }
    } else {
      if (this.app.playing) {
        this.app.stop();
      }
    }

    this.app.setCurrentTime(timePosition * MILLISECONDS_IN_SECOND);
  }

  private changeMidiFile(filename: string) {
    this.changeMidiTrack(API_BASE_URL + "api/midi/file/" + filename);
  }

  private changeMidiTrack(file: string) {
    this.app.loadMidiFile(file, () => {
      // as there is a play controller, disable auto start
      /* setTimeout(() => {
        this.app.start();
      }, 1000); */
      // reset music player
      this.audioPlayer.stop();

      // update time length
      this.musicLength = this.app.getEndTime() / MILLISECONDS_IN_SECOND;

      this.channelsInstruments = this.getChannelsInstruments();

      for (let channel in this.channelsInstruments) {
        if (this.channelsInstruments.hasOwnProperty(channel)) {
          let instrument = this.channelsInstruments[channel];

          if (this.instruments[instrument] === undefined) {
            instrument = "acoustic_grand_piano";
          }
          this.channelsInstruments[channel] = instrument;
          const respectiveChannel = this.instruments[instrument];
          this.MIDI.programChange(channel, respectiveChannel);
        }
      }

      this.channelsInstrumentsList = this.parseChannelsInstruments();
    });
  }

  private getChannelsInstruments() {
    const midi = this.MIDI.Player;
    const MIDI = this.MIDI;
    let channels = {};
    let programs = {};
    for (let n = 0; n < midi.data.length; n++) {
      let event = midi.data[n][0].event;
      if (event.type !== 'channel') {
        continue;
      }
      let channel = event.channel;
      switch (event.subtype) {
        case 'controller':
          //				console.log(event.channel, MIDI.defineControl[event.controllerType], event.value);
          break;
        case 'programChange':
          programs[channel] = event.programNumber;
          break;
        case 'noteOn':
          let program = programs[channel];
          let gm = MIDI.GM.byId[isFinite(program) ? program : channel];
          channels[channel] = gm.id;
          break;
      }
    }

    return channels;
    
  }
}
