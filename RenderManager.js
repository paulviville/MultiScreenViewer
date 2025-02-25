import * as THREE from "./three/three.module.js";
import CaveHelper from './CaveHelper.js';
import Screen from './Screen.js';
import Cave from './Cave.js';

const DEBUG_LAYER = 1;

export default class RenderManager {
    #scene;
    #debugCanvas;
    #debugCamera;
    #debugRenderer;

    #screens = [];
    #screenCanvas = [];
    #screenRenderers = [];
    #cave;
    #caveHelper;

    #trackedCamera;

    #eye = "left";


    #vrpnSocket;

    constructor ( ) {
        this.#initializeScene();

        self.addEventListener("message", this.#handleMessage.bind(this));
    }

    #connectSocket ( url = "ws://localhost:8080" ) {
        this.#vrpnSocket = new WebSocket(url);
        this.#vrpnSocket.addEventListener("message", this.#handleSocketMessage.bind(this));
    }

    #handleSocketMessage ( event ) {
        console.log("server message: ", event.data);

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

        this.#caveHelper = new CaveHelper(this.#cave);
        this.#scene.add(this.#caveHelper);


        const targetPoint = new THREE.Vector3(-1.5, 3*PDS, 1.2)
        const worldUp = new THREE.Vector3(0, 0, 1);

        this.#trackedCamera = new THREE.PerspectiveCamera( 50, 1, 0.1, 0.5 );
        this.#trackedCamera.up.copy(worldUp);
        this.#trackedCamera.position.set(0.5, -0.5, 1.3);
        this.#trackedCamera.lookAt(targetPoint)
        this.#trackedCamera.updateProjectionMatrix();
        this.#trackedCamera.updateWorldMatrix();

        this.#cave.updateStereoScreenCameras(this.#trackedCamera.matrixWorld.clone());
        this.#caveHelper.updateStereoScreenCameraHelpers();
        this.#caveHelper.setLayer(DEBUG_LAYER);
        const gridHelper2 = new THREE.GridHelper(1, 10);
        gridHelper2.lookAt(new THREE.Vector3(0, 1, 0));
        this.#scene.add(gridHelper2);
        gridHelper2.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);
        gridHelper2.position.set(0, PDS/2, 0)
    

    }

    #initializeCaveRenderer ( ) {
        console.log("initializeCaveRenderer")
        for(const screenCanvas of this.#screenCanvas) {
            this.#screenRenderers.push(new THREE.WebGLRenderer({canvas: screenCanvas, antialias: true}))
        }
    }

    #renderDebug ( ) {
        if(this.#debugRenderer) {
            this.#debugRenderer.render(this.#scene, this.#debugCamera);
        }
    }

    #renderScreens ( ) {
        const stereoScreenCameras = this.#cave.stereoScreenCameras;
        for(let id = 0; id < this.#screenRenderers.length; ++id) {
            this.#screenRenderers[id].render(this.#scene, stereoScreenCameras[id][this.#eye]);
        }
    }

    #setDebugCanvas ( canvas ) {
        this.#debugCanvas = canvas;
        this.#createDebugRenderer();
    }

    #createDebugRenderer ( ) {
        this.#debugRenderer = new THREE.WebGLRenderer({canvas: this.#debugCanvas, antialias: true});
    }

    #debugCanvasResize ( width, height ) {
        console.log("RenderManager.#debugCanvasResize", width, height);
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

    #addScreen ( id, screen, canvas ) {
        this.#screens[id] = new Screen(screen);
        this.#screenCanvas[id] = canvas
    }

    #buildCave ( ) {
        this.#cave = new Cave(this.#screens);
        this.#initalizeCaveHelper();
        this.#initializeCaveRenderer();
    }

    #flipEye ( ) {
        this.#eye = this.#eye === "left" ? "right" : "left";
    }

    #render ( ) {
        this.#renderDebug();
        this.#renderScreens();
        this.#flipEye();
        postMessage("frame")
        requestAnimationFrame(this.#render.bind(this));
    }

    #resizeScreenCanvas ( id, width, height ) {
        console.log("RenderManager.#resizeScreenCanvas", width, height);
        this.#screenCanvas[id].width = width;
        this.#screenCanvas[id].height = height;
        this.#screenRenderers[id].setSize( width, height, false );
    }

    #handleMessage ( message ) {
        const data = message.data;
        const type = data.type;
        switch(type) {
            case "debugCanvas":
                this.#setDebugCanvas(data.debugCanvas);
                break;
            case "debugCanvasResize":
                this.#debugCanvasResize(data.width, data.height);
                break;
            case "screenCanvasResize":
                this.#resizeScreenCanvas(data.id, data.width, data.height);
                break;
            case "updateDebugCamera":
                this.#updateDebugCamera(data.position, data.quaternion);
                break;
            case "start":
                this.#render();
                break;
            case "newScreen":
                this.#addScreen(data.id, data.screen, data.canvas);
                break;
            case "buildCave":
                this.#buildCave();
                break;
            case "flipEye":
                this.#flipEye();
                break;
            case "connectSocket":
                this.#connectSocket();
                break;
            default:
                console.log(message);
                break;
        }
    }
}