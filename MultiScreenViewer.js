import ScreenWindow from "./ScreenWindow.js";
import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";

export default class MultiScreenViewer {
    #debugWindow;
    #debugCanvas;
    #screenWindows = [];
    #screenCanvas = [];


    #scene;
    #camera;
    #debugRenderer;

    constructor ( ) {
        console.log("new MultiScreenViewer");

        window.addEventListener("beforeunload", this.#cleanUp.bind(this));

        this.#initializeScene();
        
    }

    openDebugWindow ( ) {
        this.#debugWindow = new ScreenWindow("debug");
        this.#debugWindow.open(() => {
            console.log(this.#debugWindow.canvas)
            this.#createDebugRenderer();
            this.#setOrbitControls();
            this.#debugWindow.setOnResize(this.#onDebugWindowResize.bind(this));
        });

    }

    #createDebugRenderer ( ) {
        this.#debugCanvas = this.#debugWindow.canvas.transferControlToOffscreen();
        this.#debugRenderer = new THREE.WebGLRenderer({canvas: this.#debugCanvas, antialias: true});
        this.#debugRenderer.setSize( this.#debugWindow.width, this.#debugWindow.height, false );
    }

    #setOrbitControls ( ) {
        const orbitControls = new OrbitControls(this.#camera, this.#debugWindow.canvas);

    }

    #onDebugWindowResize ( ) {
        const height = this.#debugWindow.height;
        const width = this.#debugWindow.width;
        this.#camera.aspect = width / height;
        this.#camera.updateProjectionMatrix();
        this.#debugCanvas.width = width;
        this.#debugCanvas.height = height;
        this.#debugRenderer.setSize( this.#debugWindow.width, this.#debugWindow.height, false );

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


    #initializeScene ( ) {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xcccccc);
        
        const worldUp = new THREE.Vector3(0, 0, 1);
        
        
        this.#camera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 100 );
        this.#camera.up.copy(worldUp);
        this.#camera.position.set( -2, -4, 3 );
        this.#camera.lookAt(new THREE.Vector3(0, 0, 2));
        this.#camera.updateMatrixWorld()
        
        
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

    start ( ) { 
        console.log("MultiScreenViewer.start");
        requestAnimationFrame(this.#renderDebug.bind(this));
    }

    #renderDebug ( ) {
        if(this.#debugRenderer) {
            this.#debugRenderer.render(this.#scene, this.#camera);
        }
        requestAnimationFrame(this.#renderDebug.bind(this));
    }
}



// const screenWindow = window.open("./screen.html?id=0", "", "width=800, height=600");

// window.addEventListener("beforeunload", () => {
//     screenWindow.close();
// })