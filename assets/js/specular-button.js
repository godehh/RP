/**
 * SpecularButton (Vanilla JS + WebGL2 runtime)
 * Origin: React Bits (https://reactbits.dev)
 */
(function(window, document) {
  'use strict';

  var PAD = 24;
  var TAU = Math.PI * 2;

  var VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

  var FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

  var UNIFORMS = [
    'uCenter',
    'uHalf',
    'uRadius',
    'uPx',
    'uSpot',
    'uEntry',
    'uLineColor',
    'uBaseColor',
    'uIntensity',
    'uWindow',
    'uThickness',
    'uGlow'
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wrap(value) {
    return value - Math.floor(value);
  }

  function loopPosition(x, y, halfX, halfY, r) {
    var innerX = halfX - r;
    var innerY = halfY - r;
    var arc = (Math.PI / 2) * r;
    var quarter = innerX + innerY + arc;
    var ax = Math.abs(x);
    var ay = Math.abs(y);
    var qx = ax - innerX;
    var qy = ay - innerY;
    var s;
    if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
    else if (qx > qy) s = Math.min(ay, innerY);
    else s = innerY + arc + innerX - Math.min(ax, innerX);
    if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
    else if (y < 0) s = 4 * quarter - s;
    return wrap(s / Math.max(4 * quarter, 0.0001));
  }

  function rimPoint(position, halfX, halfY, r) {
    var innerX = halfX - r;
    var innerY = halfY - r;
    var arc = (Math.PI / 2) * r;
    var quarter = innerX + innerY + arc;
    var s = wrap(position) * 4 * quarter;
    var signX = 1;
    var signY = 1;
    if (s > 3 * quarter) {
      s = 4 * quarter - s;
      signY = -1;
    } else if (s > 2 * quarter) {
      s -= 2 * quarter;
      signX = -1;
      signY = -1;
    } else if (s > quarter) {
      s = 2 * quarter - s;
      signX = -1;
    }
    var x = innerX - (s - innerY - arc);
    var y = halfY;
    if (s <= innerY) {
      x = halfX;
      y = s;
    } else if (s <= innerY + arc) {
      var angle = (s - innerY) / Math.max(r, 0.0001);
      x = innerX + Math.cos(angle) * r;
      y = innerY + Math.sin(angle) * r;
    }
    return [x * signX, y * signY];
  }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  function link(gl) {
    var vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    var program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    gl.deleteProgram(program);
    return null;
  }

  function initSpecularButton(button, options) {
    if (!button || button._specularInitialized) return;
    button._specularInitialized = true;

    options = options || {};

    var ds = button.dataset || {};
    var settings = {
      radius: options.radius !== undefined ? options.radius : (ds.radius ? parseFloat(ds.radius) : 18),
      lineColor: options.lineColor || ds.lineColor || '#ffffff',
      baseColor: options.baseColor || ds.baseColor || '#525252',
      intensity: options.intensity !== undefined ? options.intensity : (ds.intensity ? parseFloat(ds.intensity) : 1),
      idleIntensity: options.idleIntensity !== undefined ? options.idleIntensity : (ds.idleIntensity ? parseFloat(ds.idleIntensity) : 0.35),
      shineSize: options.shineSize !== undefined ? options.shineSize : (ds.shineSize ? parseFloat(ds.shineSize) : 10),
      shineFade: options.shineFade !== undefined ? options.shineFade : (ds.shineFade ? parseFloat(ds.shineFade) : 34),
      thickness: options.thickness !== undefined ? options.thickness : (ds.thickness ? parseFloat(ds.thickness) : 1.2),
      glow: options.glow !== undefined ? options.glow : (ds.glow ? parseFloat(ds.glow) : 1),
      speed: options.speed !== undefined ? options.speed : (ds.speed ? parseFloat(ds.speed) : 0.35),
      followMouse: options.followMouse !== undefined ? options.followMouse : (ds.followMouse !== 'false'),
      proximity: options.proximity !== undefined ? options.proximity : (ds.proximity ? parseFloat(ds.proximity) : 250),
      autoAnimate: options.autoAnimate !== undefined ? options.autoAnimate : (ds.autoAnimate === 'true'),
      disabled: button.disabled || ds.disabled === 'true'
    };

    var canvas = button.querySelector('.specular-button__light');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'specular-button__light';
      canvas.setAttribute('aria-hidden', 'true');
      button.insertBefore(canvas, button.firstChild);
    }

    var label = button.querySelector('.specular-button__label');
    if (!label) {
      var wrapper = document.createElement('span');
      wrapper.className = 'specular-button__label';
      while (button.childNodes.length > 1) {
        if (button.childNodes[1] !== canvas) {
          wrapper.appendChild(button.childNodes[1]);
        }
      }
      button.appendChild(wrapper);
    }

    var gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!gl) return;

    var program = link(gl);
    if (!program) return;

    var uniforms = {};
    for (var i = 0; i < UNIFORMS.length; i++) {
      var name = UNIFORMS[i];
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    var buffer = gl.createBuffer();
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    var probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var colors = new Map();
    var view = { width: 1, height: 1, ratio: 1 };
    var pointer = { x: 0, y: 0, known: false };
    var state = { spot: 0, level: 0, press: 0, ready: false };
    var raf = 0;
    var last = 0;
    var visible = true;

    function toRgb(value) {
      if (colors.has(value)) return colors.get(value);
      var rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        var data = probe.getImageData(0, 0, 1, 1).data;
        rgb = [data[0] / 255, data[1] / 255, data[2] / 255];
      }
      colors.set(value, rgb);
      return rgb;
    }

    function cornerRadius(s) {
      return Math.min(s.radius, view.width / 2, view.height / 2);
    }

    function restSpot(s) {
      var r = cornerRadius(s);
      var inset = r * (1 - Math.SQRT1_2);
      return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, r);
    }

    function aim(s) {
      if (!s.followMouse || s.disabled || !pointer.known) return null;
      var rect = button.getBoundingClientRect();
      var scale = rect.width / view.width || 1;
      var halfX = view.width / 2;
      var halfY = view.height / 2;
      var x = (pointer.x - rect.left - rect.width / 2) / scale;
      var y = (rect.top + rect.height / 2 - pointer.y) / scale;
      var distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
      var t = clamp(1 - distance / s.proximity, 0, 1);
      var near = t * t * (3 - 2 * t);
      var nearest = loopPosition(x, y, halfX, halfY, cornerRadius(s));
      if (distance > 0) return { spot: nearest, near: near };
      var depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
      var sway = restSpot(s) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
      var offset = sway - nearest - Math.round(sway - nearest);
      return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near: near };
    }

    function draw(s) {
      var width = view.width;
      var height = view.height;
      var scaleX = canvas.width / (width + PAD * 2);
      var scaleY = canvas.height / (height + PAD * 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uCenter, (PAD + width / 2) * scaleX, (PAD + height / 2) * scaleY);
      gl.uniform2f(uniforms.uHalf, (width / 2) * scaleX, (height / 2) * scaleY);
      gl.uniform1f(uniforms.uRadius, Math.min(s.radius, width / 2, height / 2) * scaleX);
      gl.uniform1f(uniforms.uPx, view.ratio);
      var r = Math.min(s.radius, width / 2, height / 2);
      var rim = rimPoint(state.spot, width / 2, height / 2, r);
      var rimX = rim[0];
      var rimY = rim[1];
      var pull = 1 - Math.min(0.35 * (height / 2), Math.hypot(rimX, rimY)) / Math.max(Math.hypot(rimX, rimY), 0.0001);
      gl.uniform1f(uniforms.uSpot, state.spot);
      gl.uniform2f(uniforms.uEntry, rimX * pull * scaleX, rimY * pull * scaleY);
      gl.uniform3fv(uniforms.uLineColor, toRgb(s.lineColor));
      gl.uniform3fv(uniforms.uBaseColor, toRgb(s.baseColor));
      gl.uniform1f(uniforms.uIntensity, s.intensity * (state.level + state.press * 0.8));
      gl.uniform2f(uniforms.uWindow, s.shineSize / 360 + state.press * 0.06, s.shineFade / 360 + 0.0001);
      gl.uniform1f(uniforms.uThickness, s.thickness);
      gl.uniform1f(uniforms.uGlow, s.glow);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;
      var s = settings;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      var target = aim(s);
      var spinning = s.autoAnimate && !reduce;
      var steering = !!target && target.near > 0;
      if (!state.ready) {
        state.spot = restSpot(s);
        state.level = s.autoAnimate ? 1 : s.idleIntensity;
        state.ready = true;
      }
      var diff = 0;
      if (spinning && !steering) state.spot = wrap(state.spot + (s.speed / TAU) * dt);
      else {
        diff = (steering ? target.spot : restSpot(s)) - state.spot;
        diff -= Math.round(diff);
        state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));
      }
      var level = s.autoAnimate ? 1 : s.idleIntensity + (1 - s.idleIntensity) * (target ? target.near : 0);
      state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
      state.press *= Math.exp(-dt * 5);
      draw(s);
      var settling = Math.abs(diff) > 0.0002 || Math.abs(level - state.level) > 0.001 || state.press > 0.002;
      if (settling || (spinning && !steering)) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    }

    function measure(entry) {
      var box = entry && entry.borderBoxSize ? entry.borderBoxSize[0] : null;
      view.width = Math.max(1, box ? box.inlineSize : button.offsetWidth);
      view.height = Math.max(1, box ? box.blockSize : button.offsetHeight);
      view.ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round((view.width + PAD * 2) * view.ratio));
      canvas.height = Math.max(1, Math.round((view.height + PAD * 2) * view.ratio));
      if (state.ready) draw(settings);
      wake();
    }

    function onPointerMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      wake();
    }

    function onPointerDown(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      if (!settings.disabled) state.press = 1;
      wake();
    }

    function onPointerEnd(event) {
      if (event.pointerType === 'mouse') return;
      pointer.known = false;
      wake();
    }

    function onPointerLeave() {
      pointer.known = false;
      wake();
    }

    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(function(entries) {
        measure(entries[entries.length - 1]);
      });
      resizeObserver.observe(button);
    }

    if (window.IntersectionObserver) {
      var intersection = new IntersectionObserver(function(entries) {
        visible = entries.some(function(entry) { return entry.isIntersecting; });
        if (visible) {
          last = 0;
          wake();
        }
      });
      intersection.observe(button);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    button.addEventListener('pointerdown', onPointerDown);

    measure();
    wake();

    return {
      wake: wake,
      updateSettings: function(newSettings) {
        Object.assign(settings, newSettings);
        wake();
      }
    };
  }

  // Auto-initialize any buttons with class .specular-button or data-specular-button
  function autoInit() {
    var buttons = document.querySelectorAll('.specular-button, [data-specular-button]');
    for (var i = 0; i < buttons.length; i++) {
      initSpecularButton(buttons[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.SpecularButton = {
    init: initSpecularButton,
    autoInit: autoInit
  };

})(window, document);
