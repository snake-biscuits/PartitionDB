// Colour Space Tools
// math utils
function clamp(min, x, max) {
  return Math.min(Math.max(x, min), max);
}

function radians(a) {
  return a * (Math.PI / 180);
}

function degrees(a) {
  return a * (180 / Math.PI);
}

function polar(x, y) {
  return {
    radius: Math.sqrt(x * x + y * y),
    angle: degrees(Math.atan2(y, x))};
}

function cartesian(r, a) {
  return {
    x: r * Math.cos(radians(a)),
    y: r * Math.sin(radians(a))};
}


// Standard RGB
class RGB {
  constructor(r, g, b, a = 1) {
    [this.red, this.green, this.blue, this.alpha] = [r, g, b, a];
  }

  as_hex() {
    let out = ["#"];
    let [r, g, b, a] = [this.red, this.green, this.blue, this.alpha].map(
      (c) => Math.min(Math.floor(c * 255 + 0.1), 255));
    // padding
    let pad_all = [r, g, b].some((c) => c > 15);
    if (a > 15 && a < 255) { pad_all = true; }
    let pad_str = "";
    for (const c of [r, g, b]) {
      pad_str = (c < 16 && pad_all) ? "0": "";
      out.push(`${pad_str}${c.toString(16)}`);
    }
    if (a < 255) {  // skip alpha if opaque
      pad_str = (a < 16 && pad_all) ? "0": "";
      out.push(`${pad_str}${a.toString(16)}`);
    }
    return out.join("");
  }

  static from_hex(hex) {
    let [r, g, b, a] = [0, 0, 0, 255];
    if (hex.startsWith("#")) {
      hex = hex.slice(1);
    }
    if (hex.length == 3) {
      [r, g, b] = [0, 1, 2].map((i) => parseInt(hex.slice(i, i + 1), 16));
      [r, g, b] = [r, g, b].map((c) => c << 4 | c);
    } else if (hex.length == 4) {
      [r, g, b, a] = [0, 1, 2, 3].map((i) => parseInt(hex.slice(i, i + 1), 16));
      [r, g, b, a] = [r, g, b, a].map((c) => c << 4 | c);
    } else if (hex.length == 6) {
      [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    } else if (hex.length == 8) {
      [r, g, b, a] = [0, 2, 4, 6].map((i) => parseInt(hex.slice(i, i + 2), 16));
    } else {
      console.error("invalid hex");
    }
    [r, g, b, a] = [r, g, b, a].map((c) => c / 255);
    return new RGB(r, g, b, a);
  }
}


// Y'UV (formulae from Wikipedia)
class YUV {
  // u [-Umax..Umax]
  // v [-Vmax..Vmax]

  constructor(y, u, v, a = 1.0) {
    [this.y, this.u, this.v, this.alpha] = [y, u, v, a];
  }

  as_hex() {
    return this.as_RGB().as_hex();
  }

  as_RGB() {
    // NOTE: constants are derived from Wr/g/b & U/Vmax
    let [Y, U, V] = [this.y, this.u, this.v];
    let R = Y + 1.140*V;
    let G = Y - 0.395*U - 0.581*V;
    let B = Y + 2.033*U;
    [R, G, B] = [R, G, B].map((c) => clamp(0, c, 1))
    return new RGB(R, G, B, this.alpha);
  }

  static from_hex(hex) {
    return YUV.from_RGB(RGB.from_hex(hex));
  }

  static from_RGB(rgb) {
    // NOTE: Wr + Wg + Wb = 1
    const [Wr, Wg, Wb] = [0.299, 0.587, 0.114];  // white point
    const [Umax, Vmax] = [0.436, 0.615];
    let [R, G, B] = [rgb.red, rgb.green, rgb.blue];
    let Y = Wr*R + Wg*G + Wb*B;  // grayscale
    let U = Umax*((B-Y)/(1 - Wb));  // blueness
    let V = Vmax*((R-Y)/(1 - Wr));  // redness
    return new YUV(Y, U, V, rgb.alpha);
  }
}


// Polar YUV
class YCH {
  // hue [0..360] degrees
  // chroma [0..Umax/Vmax] ~0.5

  constructor(y, c, h, a = 1.0) {
    [this.y, this.chroma, this.hue, this.alpha] = [y, c, h % 360, a];
  }

  as_hex() {
    return this.as_RGB().as_hex();
  }

  as_RGB() {
    return this.as_YUV().as_RGB();
  }

  as_YUV() {
    let xy = cartesian(this.chroma, this.hue);
    return new YUV(this.y, xy.x, xy.y, this.alpha);
  }

  static from_hex(hex) {
    return YCH.from_RGB(RGB.from_hex(hex));
  }

  static from_RGB(rgb) {
    return YCH.from_YUV(YUV.from_RGB(rgb));
  }

  static from_YUV(yuv) {
    let ra = polar(yuv.u, yuv.v);
    return new YCH(yuv.y, ra.radius, ra.angle, yuv.alpha);
  }
}


RGB.prototype.as_YUV = function as_YUV() { return YUV.from_RGB(this); }
RGB.prototype.as_YCH = function as_YCH() { return YCH.from_RGB(this); }
YUV.prototype.as_YCH = function as_YCH() { return YCH.from_YUV(this); }
RGB.prototype.from_YUV = function from_YUV(yuv) { return yuv.as_RGB(); }
RGB.prototype.from_YCH = function from_YCH(ych) { return ych.as_RGB(); }
YUV.prototype.from_YCH = function from_YCH(ych) { return ych.as_YUV(); }

export { RGB, YUV, YCH };
