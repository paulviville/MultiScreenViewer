import ScreenWindow from "./ScreenWindow.js";
import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";
import { GUI } from './three/libs/lil-gui.module.min.js'; 
import Stats from './three/libs/stats.module.js';

export default class MultiScreenViewer {
    #renderWorker;
    #debugWindow;
    #debugCanvas;

    #screenWindows = [];

    #camera;

    #gui;
    #stats;

    constructor ( ) {
        console.log("new MultiScreenViewer");

        window.addEventListener("beforeunload", this.#cleanUp.bind(this));

        this.#renderWorker = new Worker("./renderWorker.js", {type: "module"});
        this.#renderWorker.addEventListener("error", (event) => {
            console.log("worker error", event);
        });

        this.#stats = new Stats();
        // document.body.appendChild(this.#stats.dom)

        this.#renderWorker.addEventListener("message", (event) => {
            if(event.data === "frame")
                this.#stats.update();
        });
    }

    openDebugWindow ( ) {
        this.#debugWindow = new ScreenWindow("debug");
        this.#debugWindow.open(() => {
            this.#createDebugRenderer();
            this.#createDebugGui();
            this.#setOrbitControls();
            this.#debugWindow.setOnResize(this.#onDebugWindowResize.bind(this));
            this.#debugWindow.setOnMouseDown(this.#debugOnMouseDown.bind(this));
        });

    }

    #createDebugRenderer ( ) {
        this.#debugCanvas = this.#debugWindow.canvas.transferControlToOffscreen();
        this.#renderWorker.postMessage({type: "debugCanvas", debugCanvas: this.#debugCanvas}, [this.#debugCanvas]);
    }

    #setOrbitControls ( ) {
        const worldUp = new THREE.Vector3(0, 0, 1);
        
        this.#camera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 100 );
        this.#camera.up.copy(worldUp);
        this.#camera.position.set( -2, -4, 3 );
        this.#camera.lookAt(new THREE.Vector3(0, 0, 2));
        this.#camera.updateMatrixWorld()
        

        const orbitControls = new OrbitControls(this.#camera, this.#debugWindow.canvas);
        orbitControls.addEventListener("change", () => {
            this.#renderWorker.postMessage({
                type: "updateDebugCamera",
                position: this.#camera.position.toArray(),
                quaternion: this.#camera.quaternion.toArray(),
            });

        })
    }

    #onDebugWindowResize ( ) {
        const height = this.#debugWindow.height;
        const width = this.#debugWindow.width;
        this.#renderWorker.postMessage({type: "debugCanvasResize", width: width, height: height});
    }
    
    #debugOnMouseDown ( x, y, buttons ) {
        console.log("MultiScreenViewer.#debugOnMouseDown");
        this.#renderWorker.postMessage({type : "debugMouseDown", x: x, y: y, buttons: buttons});
    }

    #onScreenWindowResize ( id ) {
        this.#renderWorker.postMessage({type : "screenCanvasResize", id: id, width: this.#screenWindows[id].width, height: this.#screenWindows[id].height});
    }

    async loadScreens ( screens ) {
        console.log("MultiScreenViewer.loadScreens");
        for(const screen of screens) {
            console.log(screen)
            await this.#openScreenWindow(screen);
        }
        this.#renderWorker.postMessage({type: "buildCave"});
        this.#screenWindows[0].body.appendChild(this.#stats.dom)
        
    }

    async #openScreenWindow ( screen ) {
        const id = this.#screenWindows.length;
        const screenWindow = new ScreenWindow(`${id}`);
        this.#screenWindows.push(screenWindow);

        return new Promise( resolve => {
            screenWindow.open(() => {
                const screenCanvas = screenWindow.canvas.transferControlToOffscreen();
                this.#renderWorker.postMessage({type: "newScreen", id: id, screen, canvas: screenCanvas},  [screenCanvas]);
                screenWindow.setOnResize(this.#onScreenWindowResize.bind(this, id));

                resolve(screenCanvas);
            });
        })
       
    }

    #cleanUp ( ) {
        if(this.#debugWindow) {
            this.#debugWindow.close();
        }

        for(const screenWindow of this.#screenWindows) {
            screenWindow.close();
        }
    }

    flipEye ( ) {
        this.#renderWorker.postMessage({type : "flipEye"});
    }

    connectSocket ( ) {
        this.#renderWorker.postMessage({type : "connectSocket"});
    }

    start ( ) { 
        console.log("MultiScreenViewer.start");
        this.#renderWorker.postMessage({type : "start"});
    }

    guiFunc ( ) {

    }

    #createDebugGui ( ) {
        this.#gui = new GUI();
        this.#gui.add(this, "flipEye").name("Flip Eyes");
        this.#gui.add(this, "connectSocket").name("Connect Socket");
    }
}