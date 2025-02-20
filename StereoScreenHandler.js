import * as THREE from "./three/three.module.js";

import StereoScreenCamera from "./StereoScreenCamera.js";


export default class StereoScreenHandler {
	#screen;
	#stereoScreenCamera;

	constructor ( ) {

	}

	#initialize ( ) {

	}

	setScreen ( screen ) {
		this.#screen = screen;
		this.#stereoScreenCamera = new StereoScreenCamera(screen);
	}

	update ( headMatrix ) {

	}

	start ( ) {

	}

	#render ( ) {

	}

	stop ( ) {
		
	}
}