/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class NoteParticles {
  static initClass() {
  
    this.prototype.count = 30;
    this.prototype.size = 0.2;
    this.prototype.life = 10;
  }

  constructor(pianoDesign) {
    this.update = this.update.bind(this);
    this.createParticles = this.createParticles.bind(this);
    this.pianoDesign = pianoDesign;
    const {noteToColor, keyInfo} = pianoDesign;

    this.model = new THREE.Object3D();
    this.materials = [];

    for (let note = 0, end = keyInfo.length, asc = 0 <= end; asc ? note < end : note > end; asc ? note++ : note--) {
      const color = noteToColor(note);
      this.materials[note] = new THREE.PointCloudMaterial({
        size: this.size,
        map: this._generateTexture(color),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        color
      });
    }
  }

  _generateTexture(hexColor) {
    let width = 32;
    let height = 32;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    ({width, height} = canvas);

    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, (new THREE.Color(hexColor)).getStyle());
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const texture = new THREE.Texture(
      canvas,
      new THREE.UVMapping(),
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.LinearMipMapLinearFilter
    );
    texture.needsUpdate = true;
    return texture;
  }

  update() {
    return (() => {
      const result = [];
      for (let particleSystem of Array.from(this.model.children.slice(0))) {
        if (particleSystem.age++ > this.life) {
          result.push(this.model.remove(particleSystem));
        } else {
          for (let particle of Array.from(particleSystem.geometry.vertices)) {
            particle.add(particle.velocity);
          }
          result.push(particleSystem.geometry.verticesNeedUpdate = true);
        }
      }
      return result;
    })();
  }

  createParticles(note) {
    const {keyInfo, KeyType} = this.pianoDesign;
    const {Black} = KeyType;

    const {keyCenterPosX, keyType} = keyInfo[note];

    const posX = keyCenterPosX;
    const posY = keyType === Black ? 0.18 : 0.13;
    const posZ = -0.2;

    const geometry = new THREE.Geometry();
    for (let i = 0, end = this.count, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      const particle = new THREE.Vector3(
        posX,
        posY,
        posZ
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.3) * 0.01,
        (Math.random() - 0.5) * 0.04
      );
      geometry.vertices.push(particle);
    }

    const material = this.materials[note];

    const particleSystem = new THREE.PointCloud(geometry, material);
    particleSystem.age = 0;
    particleSystem.transparent = true;
    particleSystem.opacity = 0.8;

    return this.model.add(particleSystem);
  }
}
NoteParticles.initClass();

this.NoteParticles = NoteParticles;
