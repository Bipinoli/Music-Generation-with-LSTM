import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { PlayerStatus } from '../player-status';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.css']
})
export class AudioPlayerComponent implements OnInit {

  @Input() totalTime: number = 0;
  @Input() skipInterval: number = 10;
  @Output() statusChange = new EventEmitter<PlayerStatus>();

  // public timePosition: number = 0;
  // public isPlaying: boolean = false;

  @ViewChild('sliderBackground') sliderDivRef: ElementRef;

  private timer: any;
  private _timePosition: number = 0;
  private _isPlaying: boolean = false;

  public get timePosition():number {
    return this._timePosition;
  }

  public set timePosition(newTimePosition: number) {
    this._timePosition = Math.max(Math.min(newTimePosition, this.totalTime), 0);
    this.emitStatusChangeEvent();
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public set isPlaying(newStatus: boolean) {
    this._isPlaying = newStatus;
    this.emitStatusChangeEvent();
  }
    
  constructor() { 
  }

  ngOnInit() {
  }

  public startPlaying(): void {
    this.resume();
  }

  public pause(): void {
    this.isPlaying = false;
    clearInterval(this.timer);
  }

  public resume(): void {
    if (this._timePosition >= this.totalTime) {
      this._timePosition = 0;
    }
    this.isPlaying = true;
    this.timer = setInterval(() => {
      if (this._timePosition < this.totalTime) {
        this._timePosition = Math.max(0, Math.min(this._timePosition + 1, this.totalTime));
      } else {
        this.pause();
      }
    }, 1000);
  }

  public stop(): void {
    this.pause();
    this.timePosition = 0;
  }

  public fastForward(): void {
    this.timePosition += this.skipInterval;
  }

  public fastRewind(): void {
    this.timePosition -= this.skipInterval;
  }

  public seek(newTimePosition: number): void {
    this.timePosition = newTimePosition;
  }

  public playPauseClick() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public handleSeek(event: MouseEvent): void {
    const sliderDivRef: HTMLDivElement = this.sliderDivRef.nativeElement;
    const seekPosition = event.offsetX / sliderDivRef.offsetWidth;
    this.timePosition = seekPosition * this.totalTime;
  }

  public handleCursorMouseDown(event: MouseEvent): void {
    const sliderDivRef: HTMLDivElement = this.sliderDivRef.nativeElement;

    const windowMouseMoveListener = (event: MouseEvent) => {
      const relativeMousePosition = event.pageX - sliderDivRef.getBoundingClientRect().left;
      const seekPosition = Math.min(Math.max(relativeMousePosition / sliderDivRef.offsetWidth, 0), 1);
      this.timePosition = seekPosition * this.totalTime;
    };
    window.addEventListener('mousemove', windowMouseMoveListener);

    const windowMouseUpListener = (event: MouseEvent) => {
      window.removeEventListener('mousemove', windowMouseMoveListener);
      window.removeEventListener('mouseup', windowMouseUpListener);
    };
    window.addEventListener('mouseup', windowMouseUpListener);
  }

  public convertIntoTimeFormat(timeInSeconds: number) {
    const SECONDS_IN_MINUTE = 60;
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;
    const DAYS_IN_YEAR = 365;

    const convertFactory = moment().startOf('day').seconds(timeInSeconds);
    if (this.totalTime < SECONDS_IN_MINUTE * MINUTES_IN_HOUR) {
      return convertFactory.format('mm:ss');
    } else if (this.totalTime < SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY) {
      return convertFactory.format('H:mm:ss');
    } else if (this.totalTime < SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_YEAR) {
      return convertFactory.format('DDD HH:mm:ss');
    } else {
      return convertFactory.format('YYYY DDD HH:mm:ss');
    }
  }

  public emitStatusChangeEvent() {
    this.statusChange.emit({
      isPlaying: this.isPlaying,
      timePosition: this.timePosition
    });
  }

}
