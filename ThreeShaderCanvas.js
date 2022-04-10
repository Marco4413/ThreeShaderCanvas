import * as THREE from "https://cdn.skypack.dev/three@v0.138.0";

/**
 * @file A Wrapper for three.js to allow easy tinkering with WebGL Shaders
 * @author
 * hds536jhmk <{@link https://github.com/hds536jhmk}>
 * @license
 * Copyright (c) 2022 hds536jhmk ({@link https://github.com/hds536jhmk/ThreeShaderCanvas})
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

// The default Vertex Shader, this makes the UV start from the top-left of the screen
const _DEFAULT_VERTEX_SHADER = `
out vec2 fUv;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    fUv = vec2(abs(uv.x - 1.0), uv.y);
}
`;

const _DEFAULT_FRAGMENT_SHADER = `
in vec2 fUv;
void main() {
    gl_FragColor = vec4(fUv.x, 0.0f, fUv.y, 1.0f);
}
`;

/**
 * @typedef {Object} ThreeShaderCanvasConfig Configuration for ThreeShaderCanvas
 * @property {Object<String, Any>} [uniforms]
 * Initial uniforms for the shader.
 * 
 * Pre-defined uniforms:
 *  - screenWidth: int => The current Width of the Canvas
 *  - screenHeight: int => The current Height of the Canvas
 *  - time: float => The time since the first frame in seconds
 *  - deltaTime: float => The time since the last frame in seconds
 *  - frame: int => The current Frame Count
 * @property {String} [fragmentShader]
 * The fragment shader to run.
 * 
 * Outs of default Vertex Shader:
 *  - fUv: vec2 => The Pixel's UV which starts from the top-left corner of the Canvas
 * @property {String} [_vertexShader]
 * The Vertex Shader to run.
 * (NOTE: Set this only if you know what you're doing because the default Vertex Shader has custom outs)
 * @property {Boolean} [autoAppend] Whether or not the Canvas should appended to the document automatically (Defaults to true)
 * @property {Boolean} [autoResize] Whether or not the Canvas should resize automatically (Defaults to true)
 * @property {Boolean} [autoStart] Whether or not {@link ThreeShaderCanvas.startDrawing} should be called after construction (Defaults to true)
 * @property {Number} [clearColor] The starting background color for the Canvas (Hex, Defaults to 0x555555)
 */

/**
 * three.js Wrapper Class
 */
export class ThreeShaderCanvas {
    /**
     * @param {ThreeShaderCanvasConfig} config
     */
    constructor(config = { }) {
        this._renderer = new THREE.WebGLRenderer();
        this._renderer.setSize(1, 1);

        if (config.autoAppend ?? true)
            document.body.appendChild(this._renderer.domElement);
    
        this._scene = new THREE.Scene();
    
        this._camera = new THREE.OrthographicCamera(
            // Left, Right, Top, Bottom, Near, Far
            0, 1, 0, 1, 0.01, 1000
        );
    
        this._camera.position.set(0, 0, 100)
        this._camera.lookAt(0, 0, 0);
    
        const screenGeometry = new THREE.PlaneGeometry(1, 1);
        screenGeometry.rotateY(Math.PI);
    
        const material = new THREE.ShaderMaterial({
            "uniforms": {
                "screenWidth": { "value": 1 },
                "screenHeight": { "value": 1 },
                "time": { "value": 0 },
                "deltaTime": { "value": 0 },
                "frame": { "value": 0 }
            },
            "fragmentShader": config.fragmentShader ?? _DEFAULT_FRAGMENT_SHADER,
            "vertexShader": config._vertexShader ?? _DEFAULT_VERTEX_SHADER
        });

        if (config.uniforms != null) {
            for (const key of Object.keys(config.uniforms))
                material.uniforms[key] = config.uniforms[key];
        }
    
        this._screenMesh = new THREE.Mesh(screenGeometry, material);
        this._scene.add(this._screenMesh);

        this.resize(window.innerWidth, window.innerHeight);

        if (config.autoResize ?? true) {
            window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
        }

        this._clearColor = config.clearColor ?? 0x555555;
        this._isDrawing = false;
        if (config.autoStart ?? true) this.startDrawing();
    }

    /**
     * Returns the Canvas's Dom Element
     * @returns {HTMLCanvasElement}
     */
    getDomElement() {
        return this._renderer.domElement;
    }

    /**
     * Sets a uniform
     * @param {String} key The name of the uniform
     * @param {Any} value The new value of the uniform
     */
    setUniform(key, value) {
        const uniforms = this._screenMesh.material.uniforms;
        if (uniforms[key] == null)
            uniforms[key] = { value };
        else uniforms[key].value = value;
    }

    /**
     * Applies a function to the specified uniform
     * @param {String} key The name of the uniform
     * @param {(oldUniformValue: Any) => Any} func The function to apply to the uniform
     */
    applyToUniform(key, func) {
        this.setUniform(key, func(this.getUniform(key)));
    }

    /**
     * Gets the specified uniform
     * @param {String} key The name of the uniform
     * @returns {Any} The value of the uniform
     */
    getUniform(key) {
        return this._screenMesh.material.uniforms[key]?.value;
    }

    /**
     * Resizes the Canvas to the specified size
     * @param {Number} newWidth The new width of the Canvas
     * @param {Number} newHeight The new height of the Canvas
     */
    resize(newWidth, newHeight) {
        this._renderer.setSize(newWidth, newHeight);
        // Resizing Camera and Updating Projection Matrix
        this._camera.right = newWidth;
        this._camera.bottom = newHeight;
        this._camera.updateProjectionMatrix();
        // Updating Screen Size Uniforms
        this._screenMesh.material.uniforms.screenWidth.value = newWidth;
        this._screenMesh.material.uniforms.screenHeight.value = newHeight;
        // Updating Screen Position and Scale
        this._screenMesh.position.set(newWidth / 2, newHeight / 2, 0);
        this._screenMesh.scale.set(newWidth, newHeight, 1);
    }

    /**
     * Gets the Current Clear Color
     * @returns {Number} The Current Clear Color
     */
    getClearColor() {
        return this._clearColor;
    }

    /**
     * Sets the Clear Color to a new Color (Hex)
     * @param {Number} newColor The new Clear Color
     */
    setClearColor(newColor) {
        this._clearColor = newColor;
    }

    /**
     * Starts the Canvas's draw loop
     * @returns {Boolean} Whether or not the draw loop was started
     */
    startDrawing() {
        if (this._isDrawing) return false;
        this._isDrawing = true;

        const startTime = Date.now();
        let lastFrameTime = Date.now();

        const animate = () => {
            requestAnimationFrame(animate);
            this._renderer.setClearColor(this._clearColor);
            this._renderer.clear(true);

            const uniforms = this._screenMesh.material.uniforms;
            const now = Date.now();

            uniforms.deltaTime.value = (now - lastFrameTime) / 1000;
            uniforms.time.value = (now - startTime) / 1000;
            this._renderer.render(this._scene, this._camera);

            uniforms.frame.value++;
            lastFrameTime = now;
        }; animate();

        return true;
    }
}
