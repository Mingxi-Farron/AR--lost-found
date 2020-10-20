import * as THREE from '../threejs/three.module.js';
import { ARButton } from '../threejs/jsm/webxr/ARButton.js';
import { GLTFLoader } from '../threejs/jsm/loaders/GLTFLoader.js';

//define
let container;
let camera, scene, renderer;
let light;
let reticle;
let sphere;
let controller;
let spheres = [];
let cur_hit;

//workflow
init();
animate();

function init() {
    var init_data = standard_init(THREE,ARButton);
    container = init_data[0];
    scene = init_data[1];
    camera = init_data[2];
    renderer = init_data[3];
    light = init_data[4];
    controller = init_data[5];


    addReticleToScene();
    //customized 
    controller.addEventListener('select', select);
}

function select () {
    addTraceToScene( createImageWithMesh('../model/cat.jpg') );
}

function createImageWithMesh(url) {
    const texture_loader = new THREE.TextureLoader();
    const material = new THREE.MeshLambertMaterial({
        map: texture_loader.load(url),
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function addReticleToScene() {
    const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2);
    const material = new THREE.MeshBasicMaterial();

    reticle = new THREE.Mesh(geometry, material);

    // we will calculate the position and rotation of this reticle every frame manually
    // in the render() function so matrixAutoUpdate is set to false
    reticle.matrixAutoUpdate = false;
    reticle.visible = false; // we start with the reticle not visible
    scene.add(reticle);

    // optional axis helper you can add to an object
    reticle.add(new THREE.AxesHelper(1));
}


function addTraceToScene(input_model) {
    //critical
    input_model.matrixAutoUpdate = false;
    //give the sphere a matrix update
    input_model.matrix = input_model.matrix.copy(reticle.matrix);
    // sphere.matrix.elements[0] = sphere.matrix.elements[0]*0.1;
    // sphere.matrix.elements[5] = sphere.matrix.elements[5]*0.1;
    // sphere.matrix.elements[10] = sphere.matrix.elements[10]*0.1;
    //sphere.updateMatrix();
    scene.add(input_model);
    console.log(input_model);
    spheres.push(input_model);
}


function update(sphere) {
    // change '0.003' for more aggressive animation
    var time = performance.now() * 0.003;
    //console.log(time)

    //go through vertices here and reposition them
    
    // change 'k' value for more spikes
    var k = 3;
    for (var i = 0; i < sphere.geometry.vertices.length; i++) {
        var p = sphere.geometry.vertices[i];
        p.normalize().multiplyScalar(1 + 0.3 * noise.perlin3(p.x * k + time, p.y * k, p.z * k));
    }
    sphere.geometry.computeVertexNormals();
    sphere.geometry.normalsNeedUpdate = true;
    sphere.geometry.verticesNeedUpdate = true;
}



function animate() {
    if(spheres.length != 0){
        for(var i = 0; i < spheres.length ; i ++){
            update(spheres[i]);
        }   
    }
    
    renderer.setAnimationLoop(render);
    requestAnimationFrame(animate);
}

// read more about hit testing here:
// https://github.com/immersive-web/hit-test/blob/master/hit-testing-explainer.md

let hitTestSource = null;
let hitTestSourceInitialized = false;

// the callback from 'setAnimationLoop' can also return a timestamp
// and an XRFrame, which provides access to the information needed in 
// order to render a single frame of animation for an XRSession describing 
// a VR or AR sccene. 
function render(timestamp, frame) {
    if (frame) {
        const session = renderer.xr.getSession(); // XRSession

        // 1. create a hit test source once and keep it for all the frames
        // create a XRHitTestSource based on the viewer space
        if (hitTestSourceInitialized === false) {
            session.requestReferenceSpace('viewer').then((viewerSpace) => {
                session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                    hitTestSource = source; // XRHitTestSource
                });
            });

            session.addEventListener('end', () => {
                hitTestSourceInitialized = false;
                hitTestSource = null;
            });

            // set this to true so we don't request another hit source for the rest of the session
            hitTestSourceInitialized = true;
        }

        // 2. get hit test results
        if (hitTestSource !== null) {
            // we get the hit test results for a particular frame
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            // XRHitTestResults are ordered by distance along the XRRay used to perform the hit test
            // with the nearest in the 0th position
            if (hitTestResults.length) {
                // XRReferenceSpace describes a coordiante system of type 'local-floor'
                // read more here: https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace
                const referenceSpace = renderer.xr.getReferenceSpace();

                const hit = hitTestResults[0]; // XRHitResult

                // "getPose() returns the relative position and orientation—the pose—of one XRSpace 
                // to that of another space. With this, you can observe the motion of objects relative 
                // to each other and to fixed locations throughout the scene.
                // https://developer.mozilla.org/en-US/docs/Web/API/XRFrame/getPose
                const relativePose = hit.getPose(referenceSpace);

                // a transformation matrix contains relevant rotation and translation information 
                // about the hit test
                const transformationMatrix = relativePose.transform.matrix;

                // we apply that transformation information to our reticle shape
                //cur_hit = transformationMatrix;
                //reticle.visible = true; // make it visible

                //store the reticle
                reticle.matrix.fromArray(transformationMatrix);
            }
        }

        renderer.render(scene, camera);
    }
}
