import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export const lens = { k: 0.38 }

// Fisheye lens + the hand-made bits of a 60s cartoon: line boil on twos,
// dry-brush mottling, paper grain, and a round lens vignette.
export function createLensPass() {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uK: { value: lens.k },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uEdge: { value: new THREE.Color('#1d1a16') },
      uTint: { value: new THREE.Color('#f2b632') },
      uGrade: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uK;
      uniform vec2 uResolution;
      uniform vec3 uEdge;
      uniform vec3 uTint;
      uniform float uGrade;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      vec2 fisheye(vec2 uv) {
        float aspect = uResolution.x / uResolution.y;
        vec2 p = uv - 0.5;
        vec2 halfSize = vec2(aspect * 0.5, 0.5);
        vec2 pa = p * vec2(aspect, 1.0);
        float r2 = dot(pa, pa) / dot(halfSize, halfSize);
        return 0.5 + p * (1.0 + uK * r2) / (1.0 + uK);
      }

      void main() {
        float frame = floor(uTime * 8.0);
        vec2 px = vUv * uResolution;
        vec2 boil = (vec2(noise(px * 0.015 + frame * 7.13), noise(px * 0.015 + frame * 3.71 + 19.0)) - 0.5) * 2.0 / uResolution;
        vec3 color = texture2D(tDiffuse, fisheye(vUv) + boil).rgb;

        // Limited-palette wash: map brightness onto dark-tint -> light-tint, like a two-color print
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 duo = mix(uTint * 0.32, mix(uTint, vec3(1.0, 0.96, 0.88), 0.55), smoothstep(0.02, 0.75, lum));
        color = mix(color, duo, uGrade);

        float blotch = noise(px * 0.006) * 0.6 + noise(px * 0.025) * 0.4;
        color *= 0.92 + blotch * 0.14;
        color *= 0.95 + hash(floor(px * 0.5)) * 0.07;

        float aspect = uResolution.x / uResolution.y;
        float d = length((vUv - 0.5) * vec2(aspect, 1.0)) / length(vec2(aspect, 1.0) * 0.5);
        color = mix(color, uEdge, smoothstep(0.72, 1.02, d) * 0.9);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
}

// Same mapping as the shader, for pointer picking: screen uv -> rendered uv
export function lensDistort(uv, aspect) {
  const px = (uv.x - 0.5) * aspect
  const py = uv.y - 0.5
  const r2 = (px * px + py * py) / ((aspect * 0.5) ** 2 + 0.25)
  const s = (1 + lens.k * r2) / (1 + lens.k)
  return new THREE.Vector2(0.5 + (uv.x - 0.5) * s, 0.5 + (uv.y - 0.5) * s)
}

// Inverse, for placing HTML bubbles over 3D points: rendered uv -> screen uv
export function lensUndistort(uv, aspect) {
  const out = uv.clone()
  for (let i = 0; i < 6; i++) {
    const d = lensDistort(out, aspect)
    out.x += uv.x - d.x
    out.y += uv.y - d.y
  }
  return out
}
