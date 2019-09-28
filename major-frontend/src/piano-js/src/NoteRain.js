/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class NoteRain {
  static initClass() {
  
    this.prototype.lengthScale = 0.001;
  }

  constructor(pianoDesign) {
    this.update = this.update.bind(this);
    this.pianoDesign = pianoDesign;
    this.model = new THREE.Object3D();
  }

  // midiData is acquired from MIDI.Player.data
  setMidiData(midiData, callback) {
    this.clear();
    const noteInfos = this._getNoteInfos(midiData);
    return this._buildNoteMeshes(noteInfos, callback);
  }

  // clear all existing note rains
  clear() {
    return Array.from(this.model.children.slice(0)).map((child) =>
      this.model.remove(child));
  }

  // the raw midiData uses delta time between events to represent the flow
  // and it's quite unintuitive
  // here we calculates the start and end time of each notebox
  _getNoteInfos(midiData) {
    let currentTime = 0;
    const noteInfos = [];
    const noteTimes = [];

    for (let [{event}, interval] of Array.from(midiData)) {
      currentTime += interval;
      const {subtype, noteNumber, channel} = event;

      // In General MIDI, channel 10 is reserved for percussion instruments only.
      // It doesn't make any sense to convert it into piano notes. So just skip it.
      if (channel === 9) { continue; } // off by 1

      if (subtype === 'noteOn') {
        // if note is on, record its start time
        noteTimes[noteNumber] = currentTime;

      } else if (subtype === 'noteOff') {
        // if note if off, calculate its duration and build the model
        const startTime = noteTimes[noteNumber];
        const duration = currentTime - startTime;
        noteInfos.push({
          noteNumber,
          startTime,
          duration
        });
      }
    }
    return noteInfos;
  }


  // given a list of note info, build their meshes
  // the callback is called on finishing this task
  _buildNoteMeshes(noteInfos, callback) {
    const {blackKeyWidth, blackKeyHeight, keyInfo, KeyType, noteToColor} = this.pianoDesign;
    const {Black} = KeyType;

    // function to split an array into groups
    const splitToGroups = function(items, sizeOfEachGroup) {
      const groups = [];
      const numGroups = Math.ceil(items.length / sizeOfEachGroup);
      let start = 0;
      for (let i = 0, end = numGroups, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        groups[i] = items.slice(start, (start + sizeOfEachGroup));
        start += sizeOfEachGroup;
      }
      return groups;
    };

    // the sleep tasks will be inserted into the mesh-building procedure
    // in order to not to block the rendering of the browser UI
    const sleepTask = done =>
      setTimeout((() => done(null)), 0)
    ;

    // tasks to build the meshes
    // all the tasks are asynchronous
    const tasks = [];

    // split the note infos into groups
    // for each group, generate a task that will build the notes' meshes
    const SIZE_OF_EACH_GROUP = 100;
    const groups = splitToGroups(noteInfos, SIZE_OF_EACH_GROUP);
    for (let group of Array.from(groups)) {
      // insert an sleep task between every two mesh-building tasks
      tasks.push(sleepTask);

      // insert the mesh-building task
      // note that we are now in a loop. so use of the `do` keyword. it prevents the generated functions
      // to share the final values of the `group` variable.
      tasks.push((group => {
        // every task will be an asynchronous function. the `done` callback will be
        // called on finishing the task
        return done => {
          for (let noteInfo of Array.from(group)) {
            const {noteNumber, startTime, duration} = noteInfo;

            // scale the length of the note
            const length = duration * this.lengthScale;

            // calculate the note's position
            const x = keyInfo[noteNumber].keyCenterPosX;
            let y = (startTime * this.lengthScale) + (length / 2);
            const z = -0.2;

            // because the black key is higher than the white key,
            // so we have to add an offset onto the note's y coordinate
            if (keyInfo[noteNumber].keyType === Black) {
              y += blackKeyHeight / 2;
            }

            const color = noteToColor(noteNumber);
            const geometry = new THREE.BoxGeometry(blackKeyWidth, length, blackKeyWidth);
            const material = new THREE.MeshPhongMaterial({
              color,
              emissive: color,
              opacity: 0.7,
              transparent: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            this.model.add(mesh);
          }
          return done(null);
        };
      }
      )(group));
    }

    // use the `async` library to execute the tasks in series
    return async.series(tasks, () => typeof callback === 'function' ? callback() : undefined);
  }

  update(playerCurrentTime) {
    return this.model.position.y = -playerCurrentTime * this.lengthScale;
  }
}
NoteRain.initClass();

// export to global
this.NoteRain = NoteRain;
