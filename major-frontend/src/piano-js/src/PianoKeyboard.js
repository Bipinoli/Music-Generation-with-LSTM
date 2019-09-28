/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// design(specification) of piano key
// based on MIDITrail(http://en.sourceforge.jp/projects/miditrail/)
class PianoKeyboardDesign {
  static initClass() {
  
    this.prototype.KeyType = {
      WhiteC : 0,
      WhiteD : 1,
      WhiteE : 2,
      WhiteF : 3,
      WhiteG : 4,
      WhiteA : 5,
      WhiteB : 6,
      Black  : 7
    };
  
    this.prototype.whiteKeyStep           = 0.236;
    this.prototype.whiteKeyWidth          = 0.226;
    this.prototype.whiteKeyHeight         = 0.22;
    this.prototype.whiteKeyLength         = 1.50;
    this.prototype.blackKeyWidth          = 0.10;
    this.prototype.blackKeyHeight         = 0.24;
    this.prototype.blackKeyLength         = 1.00;
    this.prototype.blackKeyShiftCDE       = 0.0216;
    this.prototype.blackKeyShiftFGAB      = 0.0340;
    this.prototype.blackKeyPosY           = 0.10;
    this.prototype.blackKeyPosZ           = -0.24;
    this.prototype.noteDropPosZ4WhiteKey  = 0.25;
    this.prototype.noteDropPosZ4BlackKey  = 0.75;
    this.prototype.whiteKeyColor          = 0xffffff;
    this.prototype.blackKeyColor          = 0x111111;
    this.prototype.keyDip                 = 0.08;
    this.prototype.keyUpSpeed             = 0.03;
    this.prototype.keyInfo                = []; // an array holding each key's type and position
  
    // function to convert a note to the corresponding color(synesthesia)
    this.prototype.noteToColor = (function() {
      const map = MusicTheory.Synesthesia.map('August Aeppli (1940)');
      // const offset = MIDI.pianoKeyOffset;
      return function(note) {
        // if (map[note - offset] == null) { return 0x000000; }
        if (map[note] == null) { return 0x000000; }
        return parseInt(map[note].hex, 16);
      };
    })();
  }

  constructor() {
    for (let i = 0; i < 128; i++) { this.keyInfo[i] = {}; }
    this._initKeyType();
    this._initKeyPos();
  }

  _initKeyType() {
    let noteNo;
    const {keyInfo, KeyType} = this;
    const {WhiteC, WhiteD, WhiteE, WhiteF, WhiteG, WhiteA, WhiteB, Black} = KeyType;

    for (let i = 0; i < 10; i++) {
      noteNo = i * 12;                          //  ________
      keyInfo[noteNo +  0].keyType = WhiteC;    // |        |C
      keyInfo[noteNo +  1].keyType = Black;     // |----####|
      keyInfo[noteNo +  2].keyType = WhiteD;    // |        |D
      keyInfo[noteNo +  3].keyType = Black;     // |----####|
      keyInfo[noteNo +  4].keyType = WhiteE;    // |________|E
      keyInfo[noteNo +  5].keyType = WhiteF;    // |        |F
      keyInfo[noteNo +  6].keyType = Black;     // |----####|
      keyInfo[noteNo +  7].keyType = WhiteG;    // |        |G
      keyInfo[noteNo +  8].keyType = Black;     // |----####|
      keyInfo[noteNo +  9].keyType = WhiteA;    // |        |A
      keyInfo[noteNo + 10].keyType = Black;     // |----####|
      keyInfo[noteNo + 11].keyType = WhiteB;
    }    // |________|B

    noteNo = 120;                               //  ________
    keyInfo[noteNo + 0].keyType = WhiteC;       // |        |C
    keyInfo[noteNo + 1].keyType = Black;        // |----####|
    keyInfo[noteNo + 2].keyType = WhiteD;       // |        |D
    keyInfo[noteNo + 3].keyType = Black;        // |----####|
    keyInfo[noteNo + 4].keyType = WhiteE;       // |________|E
    keyInfo[noteNo + 5].keyType = WhiteF;       // |        |F
    keyInfo[noteNo + 6].keyType = Black;        // |----####|
    return keyInfo[noteNo + 7].keyType = WhiteB;       // |________|G <= shape is B
  }
    
  _initKeyPos() {
    // save references of instance variables
    const {KeyType, keyInfo, whiteKeyStep, blackKeyShiftCDE, blackKeyShiftFGAB} = this;
    const {WhiteC, WhiteD, WhiteE, WhiteF, WhiteG, WhiteA, WhiteB, Black} = KeyType;

    let noteNo = 0;
    let prevKeyType = WhiteB;
    let posX = 0.0;
    let shift = 0.0;

    // position of the first note
    keyInfo[noteNo].keyCenterPosX = posX;
    prevKeyType = keyInfo[noteNo].keyType;

    // position of the second and subsequent notes
    for (noteNo = 1; noteNo < 128; noteNo++) {
      if (prevKeyType === Black) {
        if (keyInfo[noteNo].keyType === Black) {
          // it's impossible to have two adjacent black keys
        } else {
          // place the black key between two white keys
          posX += whiteKeyStep / 2.0;
        }
      } else { // previous key is white
        if (keyInfo[noteNo].keyType === Black) {
          posX += whiteKeyStep / 2.0;
        } else {
          posX += whiteKeyStep;
        }
      }
      keyInfo[noteNo].keyCenterPosX = posX;
      prevKeyType = keyInfo[noteNo].keyType;
    }

    // fix the position of black keys
    prevKeyType = WhiteC;

    return (() => {
      const result = [];
      for (noteNo = 0; noteNo < 128; noteNo++) {
        if (keyInfo[noteNo].keyType === Black) {

          // get shift amount of black key
          switch (prevKeyType) {
            case WhiteC: shift = -blackKeyShiftCDE; break;
            case WhiteD: shift = +blackKeyShiftCDE; break;
            case WhiteF: shift = -blackKeyShiftFGAB; break;
            case WhiteG: shift = 0.0; break;
            case WhiteA: shift = +blackKeyShiftFGAB; break;
            default:             shift = 0.0;
          }

          // set the center position of last black key
          if (noteNo === 126) {
            shift = 0.0;
          }

          // fix the position
          keyInfo[noteNo].keyCenterPosX += shift;
        }

        result.push(prevKeyType = keyInfo[noteNo].keyType);
      }
      return result;
    })();
  }
}
PianoKeyboardDesign.initClass();


// model of a single piano key
// usage:
//   key = new PianoKey(desing, note)
//   # key.model is an instance of THREE.Mesh and can be added into scenes
//   key.press()
//   key.release()
//   setInterval((-> key.update()), 1000 / 60)
class PianoKey {
  constructor(design, note) {
    let geometry, material, position;
    const {
      blackKeyWidth, blackKeyHeight, blackKeyLength, blackKeyColor,
      whiteKeyWidth, whiteKeyHeight, whiteKeyLength, whiteKeyColor,
      blackKeyPosY, blackKeyPosZ, keyDip, keyInfo, keyUpSpeed, KeyType
    } = design;
    const {Black} = KeyType;

    const {keyType, keyCenterPosX} = keyInfo[note];

    if (keyType === Black) {
      geometry = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
      material = new THREE.MeshPhongMaterial({color: blackKeyColor});
      position = new THREE.Vector3(keyCenterPosX, blackKeyPosY, blackKeyPosZ);
    } else {
      geometry = new THREE.BoxGeometry(whiteKeyWidth, whiteKeyHeight, whiteKeyLength);
      material = new THREE.MeshPhongMaterial({color: whiteKeyColor, emissive: 0x111111});
      position = new THREE.Vector3(keyCenterPosX, 0, 0);
    }

    // create key mesh
    this.model = new THREE.Mesh(geometry, material);
    this.model.position.copy(position);

    this.keyUpSpeed = keyUpSpeed;

    // set original and pressed y coordinate
    this.originalY = position.y;
    this.pressedY = this.originalY - keyDip;
  }

  press() {
    this.model.position.y = this.pressedY;
    return this.isPressed = true;
  }

  release() {
    return this.isPressed = false;
  }

  update() {
    if ((this.model.position.y < this.originalY) && !this.isPressed) {
      const offset = this.originalY - this.model.position.y;
      return this.model.position.y += Math.min(offset, this.keyUpSpeed);
    }
  }
}


// model of piano keyboard
// usage:
//   keyboard = new PianoKeyboard(new PianoKeyboardDesign)
//   scene.add(keyboard.model) # scene is an instance of THREE.Scene
//   setInterval(keyboard.update, 1000 / 60) 
//   keyboard.press(30)   # press the key of note 30(G1)
//   keyboard.release(60) # release the key of note 60(C4)
class PianoKeyboard {
  constructor(design, noteToColor) {
    this.update = this.update.bind(this);
    this.model = new THREE.Object3D();
    this.keys = [];

    // create piano keys
    for (let note = 0, end = design.keyInfo.length, asc = 0 <= end; asc ? note < end : note > end; asc ? note++ : note--) {
      const key = new PianoKey(design, note);
      this.keys.push(key);
      if (20 < note && note < 109) { // strip to 88 keys
        this.model.add(key.model);
      }
    }

    this.model.y -= design.whiteKeyHeight / 2;
  }

  press(note) {
    return this.keys[note].press();
  }

  release(note) {
    return this.keys[note].release();
  }

  update() {
    return Array.from(this.keys).map((key) => key.update());
  }
}


// export to global
this.PianoKeyboardDesign = PianoKeyboardDesign;
this.PianoKeyboard = PianoKeyboard;
