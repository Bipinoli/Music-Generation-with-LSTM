import { Injectable } from '@angular/core';

const KEYS_IN_OCTAVE = 12;

@Injectable({
  providedIn: 'root'
})
export class MusicGenerationService {

  private _octave: number = 3;
  private set octave(octave: number) {
    this._octave = Math.min(Math.max(0, octave), 10);
  }
  private get octave() {
    return this._octave;
  }

  constructor() { }

  public increaseOctave(): void {
    this.octave++;
  }

  public decreseOctave(): void {
    this.octave--;
  }

  public playNoteOn(note: number) {
    this.playNote(note, "on");
  }

  public playNoteOff(note: number) {
    this.playNote(note, "off");
  }

  private playNote(note: number, noteStatus: "on" | "off") {
    if (note === -1)
      return;
    const MIDI = (window as any).MIDI;
    const velocity = 127;
    const delay = 0;
    MIDI.setVolume(0, 127);
    if (noteStatus === "on") {
      MIDI.noteOn(0, note, velocity, delay);
    } else if (noteStatus === "off") {
      MIDI.noteOff(0, note, velocity, delay);
    }
  }

  public keyCodeToNote(keyCode: number) {
    var note = -1;
    //-----------------------------------
    if (keyCode == 90) note = 0; // C 0
    if (keyCode == 83) note = 1; // C#0
    if (keyCode == 88) note = 2; // D 0
    if (keyCode == 68) note = 3; // D#0
    if (keyCode == 67) note = 4; // E 0
    if (keyCode == 86) note = 5; // F 0
    if (keyCode == 71) note = 6; // F#0
    if (keyCode == 66) note = 7; // G 0
    if (keyCode == 72) note = 8; // G#0
    if (keyCode == 78) note = 9; // A 0
    if (keyCode == 74) note = 10; // A#0
    if (keyCode == 77) note = 11; // B 0
    if (keyCode == 188) note = 12; // C 0

    //-----------------------------------
    if (keyCode == 81) note = 12; // C 1
    if (keyCode == 50) note = 13; // C#1
    if (keyCode == 87) note = 14; // D 1
    if (keyCode == 51) note = 15; // D#1
    if (keyCode == 69) note = 16; // E 1
    if (keyCode == 82) note = 17; // F 1
    if (keyCode == 53) note = 18; // F#1
    if (keyCode == 84) note = 19; // G 1
    if (keyCode == 54) note = 20; // G#1
    if (keyCode == 89) note = 21; // A 1
    if (keyCode == 55) note = 22; // A#1
    if (keyCode == 85) note = 23; // B 1
    //-----------------------------------
    if (keyCode == 73) note = 24; // C 2
    if (keyCode == 57) note = 25; // C#2
    if (keyCode == 79) note = 26; // D 2
    if (keyCode == 48) note = 27; // D#2
    if (keyCode == 80) note = 28; // E 2
    if (keyCode == 219) note = 29; // F 2
    if (keyCode == 187) note = 30; // F#2
    if (keyCode == 221) note = 31; // G 2
    //-----------------------------------

    if (note === -1)
      return -1;
    else
      return note + this.octave * KEYS_IN_OCTAVE;
  }
}
