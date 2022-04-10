## ThreeShaderCanvas

### What does this do?

It wraps three.js's renderer to make it easier to test Fragment Shaders in a similar way to [Shadertoy](https://www.shadertoy.com).

### How do I use it?

It's as simple as this snippet of code:
```JavaScript
import { ThreeShaderCanvas } from "./ThreeShaderCanvas.js";

const _FRAGMENT_SHADER = `
uniform int screenWidth;
uniform int screenHeight;
uniform float time;
uniform float deltaTime;
uniform int frame;

in vec2 fUv;

void main() {
    gl_FragColor = vec4(fUv.xyx, 1.0);
}
`;

window.addEventListener("load", () => {
    new ThreeShaderCanvas({
        "fragmentShader": _FRAGMENT_SHADER
    });
});
```

### Are there any projects that use this library?

Other than some [examples](./example) there are also some projects that use this library:
 - [Fractals](https://github.com/hds536jhmk/Fractals) (A Fractal Visualizer)
