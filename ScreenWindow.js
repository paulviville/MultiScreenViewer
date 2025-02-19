export default class ScreenWindow {
    #window;
    #id;
    #canvas;

    constructor ( id = null ) {
        this.#id = id;

    }

    #onLoad ( onLoad ) {
        this.#canvas = this.#window.document.createElement('canvas');
        this.#window.document.body.appendChild(this.#canvas);
        this.#canvas.width = this.#window.innerWidth;
        this.#canvas.height = this.#window.innerHeight;

        onLoad();
    }   

    #onResize ( ) {

    }

    open ( onLoad ) {
        this.#window = window.open(`./screen.html?id=${this.#id}`, "", "width=800, height=600");
        this.#window.addEventListener("load", this.#onLoad.bind(this, onLoad));
    }

    setOnResize ( onResize ) {
        this.#window.addEventListener("resize", onResize);
    } 



    close ( ) {
        this.#window.close();
    }

    get canvas ( ) {
        return this.#canvas;
    }

    get width ( ) {
        return this.#window.innerWidth;
    }

    get height ( ) {
        return this.#window.innerHeight;
    }
}