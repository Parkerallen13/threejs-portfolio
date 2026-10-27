import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export const lens = { k: 0.38 }

// Fisheye lens + a hand-painted storybook finish (think Snow White backgrounds): soft
// watercolor bleed, pigment pooling at edges, warm glow, paper grain, line boil on twos,
// and an oval vignette.
export function createLensPass() {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uK: { value: lens.k },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uEdge: { value: new THREE.Color('#2a1d14') },
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
        vec2 boil = (vec2(noise(px * 0.015 + frame * 7.13), noise(px * 0.015 + frame * 3.71 + 19.0)) - 0.5) * 1.5 / uResolution;
        vec2 uv = fisheye(vUv) + boil;

        // Watercolor softness: blend in a small blur so edges bleed a little
        vec2 texel = 1.5 / uResolution;
        vec3 c = texture2D(tDiffuse, uv).rgb;
        vec3 n1 = texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb;
        vec3 n2 = texture2D(tDiffuse, uv - vec2(texel.x, 0.0)).rgb;
        vec3 n3 = texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb;
        vec3 n4 = texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb;
        vec3 color = mix(c, (c * 2.0 + n1 + n2 + n3 + n4) / 6.0, 0.5);

        // Pigment pools darker where colors meet, like paint drying on paper
        float edge = length(n1 - n2) + length(n3 - n4);
        color *= 1.0 - smoothstep(0.08, 0.5, edge) * 0.16;

        // Storybook palette: a touch muted and warm, with a soft glow on highlights
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(vec3(lum), color, 0.86) * vec3(1.03, 1.0, 0.94);
        color += smoothstep(0.55, 1.0, lum) * vec3(1.0, 0.85, 0.6) * 0.12;

        // Per-stop color wash
        vec3 duo = mix(uTint * 0.32, mix(uTint, vec3(1.0, 0.96, 0.88), 0.55), smoothstep(0.02, 0.75, lum));
        color = mix(color, duo, uGrade);

        // Watercolor paper: blotchy pigment and fine grain
        float blotch = noise(px * 0.004) * 0.5 + noise(px * 0.02) * 0.3 + noise(px * 0.09) * 0.2;
        color *= 0.9 + blotch * 0.16;
        color *= 0.96 + hash(floor(px * 0.5)) * 0.05;

        // Soft oval storybook vignette
        float d = length((vUv - 0.5) * vec2(1.0, 1.15)) * 1.45;
        color = mix(color, uEdge, smoothstep(0.8, 1.15, d) * 0.7);
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
