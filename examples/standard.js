

function standard_init (THREE, ARButton) {
    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    
    controller = renderer.xr.getController(0);

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'], // notice a new required feature
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
    }));
    renderer.domElement.style.display = 'none';

    window.addEventListener('resize', onWindowResize, false);

    return [container, scene, camera, renderer, light, controller];
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}