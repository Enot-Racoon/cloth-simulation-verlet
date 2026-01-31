export interface CRTPass {
  render: (
    sourceCanvas: HTMLCanvasElement,
    timeSec: number,
    params: CRTPassRenderParams,
  ) => void;
}

export type CRTPassRenderParams = {
  curvature: number;
  rgbSplit: number;
  scanline: number;
  wobble: number;
  noise: number;
  vignette: number;
};

export const createCRTPass = (outputCanvas: HTMLCanvasElement) => {
  const gl = outputCanvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) throw new Error("WebGL not supported");

  const createShader = (type: number, source: string) => {
    const sh = gl.createShader(type);
    if (!sh) throw new Error("Shader creation failed");
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(err ?? "Unknown shader compilation error");
    }
    return sh;
  };

  const createProgram = (vs: string, fs: string) => {
    const p = gl.createProgram();
    gl.attachShader(p, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error(err ?? "Unknown shader linking error");
    }
    return p;
  };

  const vsSource = `
        attribute vec2 aPos;
        attribute vec2 aUv;
        varying vec2 vUv;
        void main() {
          vUv = aUv;
          gl_Position = vec4(aPos, 0.0, 1.0);
        }
      `;

  const fsSource = `
        precision mediump float;

        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform vec2 uRes;
        uniform float uTime;
        uniform float uCurvature;
        uniform float uRgbSplit;
        uniform float uScanline;
        uniform float uWobble;
        uniform float uNoise;
        uniform float uVignette;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec2 curve(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float r2 = dot(p, p);
          p *= 1.0 + r2 * uCurvature;
          return p * 0.5 + 0.5;
        }

        void main() {
          vec2 uv = vUv;
          vec2 cuv = curve(uv);

          if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          float y = cuv.y * uRes.y;
          float wobble = sin(y * 0.07 + uTime * 6.0) * uWobble;
          wobble += (hash(vec2(floor(y), uTime)) - 0.5) * uWobble * 1.33;
          cuv.x += wobble;

          vec2 off = vec2(uRgbSplit, 0.0);

          float r = texture2D(uTex, cuv + off).r;
          float g = texture2D(uTex, cuv).g;
          float b = texture2D(uTex, cuv - off).b;
          vec3 col = vec3(r, g, b);

          float scan = sin(cuv.y * uRes.y * 3.14159);
          col *= (1.0 - uScanline) + uScanline * scan;

          float px = cuv.x * uRes.x;
          float triad = mod(floor(px), 3.0);
          vec3 mask = vec3(0.92);
          if (triad < 1.0) mask = vec3(1.10, 0.88, 0.88);
          else if (triad < 2.0) mask = vec3(0.88, 1.10, 0.88);
          else mask = vec3(0.88, 0.88, 1.10);
          col *= mask;

          float n = hash(cuv * uRes + uTime);
          col += (n - 0.5) * uNoise;

          vec2 p = uv - 0.5;
          float vig = smoothstep(uVignette, 0.20, dot(p, p));
          col *= vig;

          col = pow(col, vec3(0.95));

          gl_FragColor = vec4(col, 1.0);
        }
      `;

  const program = createProgram(vsSource, fsSource);
  gl.useProgram(program);

  const quad = new Float32Array([
    -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, "aPos");
  const aUv = gl.getAttribLocation(program, "aUv");

  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uTex = gl.getUniformLocation(program, "uTex");
  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uCurvature = gl.getUniformLocation(program, "uCurvature");
  const uRgbSplit = gl.getUniformLocation(program, "uRgbSplit");
  const uScanline = gl.getUniformLocation(program, "uScanline");
  const uWobble = gl.getUniformLocation(program, "uWobble");
  const uNoise = gl.getUniformLocation(program, "uNoise");
  const uVignette = gl.getUniformLocation(program, "uVignette");

  gl.uniform1i(uTex, 0);

  const render = (
    sourceCanvas: HTMLCanvasElement,
    timeSec: number,
    params: CRTPassRenderParams,
  ) => {
    gl.viewport(0, 0, outputCanvas.width, outputCanvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceCanvas,
    );

    gl.uniform2f(uRes, outputCanvas.width, outputCanvas.height);
    gl.uniform1f(uTime, timeSec);
    gl.uniform1f(uCurvature, params.curvature);
    gl.uniform1f(uRgbSplit, params.rgbSplit);
    gl.uniform1f(uScanline, params.scanline);
    gl.uniform1f(uWobble, params.wobble);
    gl.uniform1f(uNoise, params.noise);
    gl.uniform1f(uVignette, params.vignette);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return { render };
};
