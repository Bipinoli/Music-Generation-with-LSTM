/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Scene {
  constructor(container) {
    // set dom container
    this.onresize = this.onresize.bind(this);
    this.animate = this.animate.bind(this);
    const $container = $(container);
    const width = $container.width();
    const height = $container.height();

    // create scene
    const scene = new THREE.Scene();

    // create camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.001, 100000);
    camera.lookAt(new THREE.Vector3());
    scene.add(camera);

    // create renderer
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    renderer.autoClear = false;
    $container.append(renderer.domElement);

    // create lights
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(1, 2, 4).normalize();
    scene.add(mainLight);

    const auxLight = new THREE.DirectionalLight(0xffffff, 0.3);
    auxLight.position.set(-4, -1, -2).normalize();
    scene.add(auxLight);

    const controls = new THREE.OrbitControls(camera, container);
    controls.center.set(8.73, 0, 0);
    controls.autoRotateSpeed = 1.0;
    controls.autoRotate = false;
    camera.position.copy(controls.center).add(new THREE.Vector3(2, 6, 9));

    $(window).resize(this.onresize);
    $(container).resize(this.onresize);

    // set instance variables
    this.$container = $container;
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.controls = controls;
  }

  onresize() {
    const [width, height] = Array.from([this.$container.width(), this.$container.height()]);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    return this.renderer.setSize(width, height);
  }

  add(object) {
    return this.scene.add(object);
  }

  remove(object) {
    return this.scene.remove(object);
  }

  animate(callback) {
    requestAnimationFrame(() => this.animate(callback));
    if (typeof callback === 'function') {
      callback();
    }
    this.controls.update();
    this.renderer.clear();
    return this.renderer.render(this.scene, this.camera);
  }
}

// export Scene to global
this.Scene = Scene;
