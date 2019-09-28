/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// The Euphony class provides interfaces to play MIDI files and do 3D visualization.
// The controller and playlist on the left of the screen is not part of it.
class Euphony {

  constructor() {
    this.start = this.start.bind(this);
    this.resume = this.resume.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.getEndTime = this.getEndTime.bind(this);
    this.setCurrentTime = this.setCurrentTime.bind(this);
    this.setProgress = this.setProgress.bind(this);
    this.design = new PianoKeyboardDesign();
    this.keyboard = new PianoKeyboard(this.design);
    this.rain = new NoteRain(this.design);
    this.particles = new NoteParticles(this.design);

    this.player = MIDI.Player;
    this.player.addListener(data => {
      const NOTE_OFF = 128;
      const NOTE_ON  = 144;
      const {note, message} = data;
      if (message === NOTE_ON) {
        this.keyboard.press(note);
        return this.particles.createParticles(note);
      } else if (message === NOTE_OFF) {
        return this.keyboard.release(note);
      }
    });
    this.player.setAnimation(
      data => {
        const {now, end} = data;
        if (typeof this.onprogress === 'function') {
          this.onprogress({
          current: now,
          total: end
        });
        }
        return this.rain.update(now * 1000);
      }
    );
  }

  initScene(container) {
    this.scene = new Scene(container);
    this.scene.add(this.keyboard.model);
    this.scene.add(this.rain.model);
    this.scene.add(this.particles.model);
    return this.scene.animate(() => {
      this.keyboard.update();
      return this.particles.update();
    });
  }

  initMidi(callback) {
    let instruments = [
      "acoustic_grand_piano", 
      // "acoustic_guitar_nylon", 
      // "acoustic_guitar_steel", 
      // "alto_sax", "baritone_sax", 
      // "brass_section",
      // "distortion_guitar",
      // "electric_bass_finger", 
      // "electric_bass_pick", 
      // "electric_guitar_jazz", 
      // "flute", 
      // "soprano_sax", 
      // "synth_drum", 
      // "tabla", 
      // "tenor_sax", 
      // "trumpet"
    ];
    return MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instruments: instruments,
      onsuccess: function() {
        // MIDI.channels[9].mute = true;
        return (typeof callback === 'function' ? callback() : undefined);
      }
    });
  }

  // load a base64 encoded or binary XML MIDI file
  loadMidiFile(midiFile, callback) {
    return this.player.loadFile(midiFile, () => {
      return this.rain.setMidiData(this.player.data, callback);
    });
  }

  start() {
    this.player.start();
    return this.playing = true;
  }

  resume() {
    this.player.currentTime += 1e-6; // bugfix for MIDI.js
    this.player.resume();
    return this.playing = true;
  }

  stop() {
    this.player.stop();
    return this.playing = false;
  }

  pause() {
    this.player.pause();
    return this.playing = false;
  }

  getEndTime() {
    return this.player.endTime;
  }

  setCurrentTime(currentTime) {
    this.player.pause();
    this.player.currentTime = currentTime;
    if (this.playing) { return this.player.resume(); }
  }

  setProgress(progress) {
    const currentTime = this.player.endTime * progress;
    return this.setCurrentTime(currentTime);
  }

  on(eventName, callback) {
    return this[`on${eventName}`] = callback;
  }

  resize() {
    this.scene.onresize();
  }

  pressKey(note) {
    this.keyboard.press(note);
  }

  releaseKey(note) {
    this.keyboard.release(note);
  }
}

// exports to global
this.Euphony = Euphony;
