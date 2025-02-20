import * as THREE from "./three/three.module.js";
import CaveHelper from './CaveHelper.js';
import Screen from './Screen.js';
import Cave from './Cave.js';

const DEBUG_LAYER = 0;

export default class RenderManager {
    #scene;
    #debugCanvas;
    #debugCamera;
    #debugRenderer;

    constructor ( ) {
        this.#initializeScene();
        this.#initalizeCaveHelper();

        self.addEventListener("message", this.#handleMessage.bind(this));
    }

    #initializeScene ( ) {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xcccccc);
        
        const worldUp = new THREE.Vector3(0, 0, 1);
        
        this.#debugCamera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 100 );
        this.#debugCamera.up.copy(worldUp);
        this.#debugCamera.position.set( -2, -4, 3 );
        this.#debugCamera.lookAt(new THREE.Vector3(0, 0, 2));
        this.#debugCamera.updateMatrixWorld()
        this.#debugCamera.layers.enable(DEBUG_LAYER)
        
        
        const sceneGroup = new THREE.Group();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        sceneGroup.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 100);
        pointLight.position.set(0,0,5);
        sceneGroup.add(pointLight);
    
    
        const geometry = new THREE.SphereGeometry( 0.5, 32, 16 ); 
        const redMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } ); 
        const greenMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } ); 
        const blueMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff } ); 
    
        const redSphere = new THREE.Mesh( geometry, redMaterial ); 
        const greenSphere = new THREE.Mesh( geometry, greenMaterial ); 
        const blueSphere = new THREE.Mesh( geometry, blueMaterial ); 
    
        redSphere.position.set(2.5, 2.5, 1);
        blueSphere.position.set(-2.5, 2.5, 1);
        greenSphere.position.set(0, 0, -2.5);
    
        sceneGroup.add( redSphere, greenSphere, blueSphere );
    
    
    
        const gridHelper = new THREE.GridHelper(100, 20);
        gridHelper.lookAt(new THREE.Vector3(0, 1, 0));
        sceneGroup.add(gridHelper);
    
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxEdgeGeometry = new THREE.EdgesGeometry(boxGeometry);
        const whiteMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } ); 
        const blackLineMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } ); 
        const box = new THREE.Mesh(boxGeometry, whiteMaterial);
        box.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 4);
        box.position.set(0, 2.5, 0.25);
        sceneGroup.add(box);

        this.#scene.add(sceneGroup)
    }

    #initalizeCaveHelper ( ) {
        const PDS = Math.sqrt(2) * 1.8;
        // const t = new THREE.Vector3(1, 1, 0).normalize().multiplyScalar(2.25);
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

        const screen0 = new Screen(screenCorners0);
        const screen1 = new Screen(screenCorners1);
        const screen2 = new Screen(screenCorners2);
        const cave = new Cave([screen0, screen1, screen2]);
        const caveHelper = new CaveHelper(cave);
        this.#scene.add(caveHelper);


        const targetPoint = new THREE.Vector3(-1.5, 3*PDS, 1.2)
        const worldUp = new THREE.Vector3(0, 0, 1);

        const trackedCamera = new THREE.PerspectiveCamera( 50, 1, 0.1, 0.5 );
        trackedCamera.up.copy(worldUp);
        trackedCamera.position.set(0.5, -0.5, 1.3);
        trackedCamera.lookAt(targetPoint)
        trackedCamera.updateProjectionMatrix();
        trackedCamera.updateWorldMatrix();

        cave.updateStereoScreenCameras(trackedCamera.matrixWorld.clone());
        caveHelper.updateStereoScreenCameraHelpers();
        // caveHelper.layers.set(1);
        caveHelper.setLayer(DEBUG_LAYER);
        // caveHelper.layers.set(0);
        // console.log(caveHelper.layers)
        // caveHelper.layers.enable(16);
    }

    #renderDebug ( ) {
        if(this.#debugRenderer) {
            this.#debugRenderer.render(this.#scene, this.#debugCamera);
        }
        requestAnimationFrame(this.#renderDebug.bind(this));
    }

    #setDebugCanvas ( canvas ) {
        this.#debugCanvas = canvas;
        console.log(this.#debugCanvas);
        this.#createDebugRenderer();
    }

    #createDebugRenderer ( ) {
        this.#debugRenderer = new THREE.WebGLRenderer({canvas: this.#debugCanvas, antialias: true});
    }

    #debugCanvasResize ( width, height ) {
        console.log("this.#debugCanvasResize", width, height);
        this.#debugCamera.aspect = width / height;
        this.#debugCamera.updateProjectionMatrix();
        this.#debugCanvas.width = width;
        this.#debugCanvas.height = height;
        this.#debugRenderer.setSize( width, height, false );

    }

    #updateDebugCamera ( position, quaternion ) {
        this.#debugCamera.position.fromArray(position);
        this.#debugCamera.quaternion.fromArray(quaternion);
        this.#debugCamera.updateProjectionMatrix();
    }

    #handleMessage ( message ) {
        // console.log(message)
        const data = message.data;
        const type = data.type;
        // console.log(type, data);
        switch(type) {
            case "debugCanvas":
                this.#setDebugCanvas(data.debugCanvas);
                break;
            case "debugCanvasResize":
                this.#debugCanvasResize(data.width, data.height);
                break;
            case "updateDebugCamera":
                this.#updateDebugCamera(data.position, data.quaternion);
                break;
            case "start":
                this.#renderDebug();
        }
    }
}