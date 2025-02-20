import ScreenWindow from "./ScreenWindow.js";
import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";

export default class MultiScreenViewer {
    #renderWorker;
    #debugWindow;
    #debugCanvas;
    #screenWindows = [];
    #screenCanvas = [];

    #camera;

    constructor ( ) {
        console.log("new MultiScreenViewer");

        window.addEventListener("beforeunload", this.#cleanUp.bind(this));

        this.#renderWorker = new Worker("./renderWorker.js", {type: "module"});
        this.#renderWorker.addEventListener("error", (event) => {
            console.log("worker error", event);
        });
    }

    openDebugWindow ( ) {
        this.#debugWindow = new ScreenWindow("debug");
        this.#debugWindow.open(() => {
            this.#createDebugRenderer();
            this.#setOrbitControls();
            this.#debugWindow.setOnResize(this.#onDebugWindowResize.bind(this));
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

    // loadScreens ( screens = [0] ) {
    //     for(const screen of screens) {
    //         this.#openScreenWindow(screen);
    //     }
    // }

    // #openScreenWindow ( screen ) {
    //     const screenWindow = window.open(`./screen.html?id=${this.#screenWindows.length}`, "", "width=800, height=600");
    //     this.#screenWindows.push(screenWindow);
    // }

    #cleanUp ( ) {
        if(this.#debugWindow) {
            this.#debugWindow.close();
        }

        // for(const screenWindow of this.#screenWindows) {
        //     screenWindow.close();
        // }
    }

    start ( ) { 
        console.log("MultiScreenViewer.start");
        this.#renderWorker.postMessage({type : "start"});
    }
}