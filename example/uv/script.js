import { ThreeShaderCanvas } from "../../ThreeShaderCanvas.js";

const _UV_FRAGMENT_SHADER = `
uniform int screenWidth;
uniform int screenHeight;
uniform float time;
uniform float deltaTime;
uniform int frame;

in vec2 fUv;

void main() {
    // Taken from https://www.shadertoy.com/new
    gl_FragColor = vec4(vec3(
        0.5 + 0.5 * cos(time + fUv.xyx + vec3(0, 2, 4))
    ), 1.0);
}
`;

window.addEventListener("load", () => {
    new ThreeShaderCanvas({
        "fragmentShader": _UV_FRAGMENT_SHADER
    });
});
