import MultiScreenViewer from "./MultiScreenViewer.js";
import * as THREE from "./three/three.module.js";

const PDS = Math.sqrt(2) * 1.8;
const t = new THREE.Vector3(1, 1, 0).normalize().multiplyScalar(2.25);
const screenCorners0 = [
    new THREE.Vector3(-PDS, 0, 0),
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(-PDS, 0, 2.25),
    new THREE.Vector3(0, PDS, 2.25),
];

const screenCorners1 = [
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(PDS, 0, 0),
    new THREE.Vector3( 0, PDS, 2.25),
    new THREE.Vector3( PDS, 0, 2.25),
];

// const screenCorners2 = [
//   new THREE.Vector3(-t.x, PDS - t.y, 0),
//   new THREE.Vector3(PDS - t.x, -t.y, 0),
//   new THREE.Vector3(0, PDS, 0),
//   new THREE.Vector3(PDS, 0, 0),
// ];

const screenCorners2 = [
    new THREE.Vector3(-PDS + 1.34, 1.34, 0),
    new THREE.Vector3(-PDS +3.31, -0.63, 0),
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(1.97, PDS - 1.97, 0),
];

const screens = [
    screenCorners0,
    screenCorners1,
    screenCorners2,
]


const multiScreenViewer = new MultiScreenViewer();


await multiScreenViewer.loadScreens(screens);
multiScreenViewer.openDebugWindow();

multiScreenViewer.start();
