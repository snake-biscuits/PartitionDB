// TODO: global drive list (top-level DataAreas)
// TODO: load from & save to JSON


// TODO: mirror console.log etc. to <code id="log"></code>
// -- console.assert(cond, msg)
// -- if not cond: log.append(msg)


function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}


// https://en.wikipedia.org/wiki/Matrix_(mathematics)
class Matrix {
  constructor(raw_matrix) {
    this.raw = raw_matrix;
    this.m = raw_matrix.length;
    this.n = raw_matrix[0].length;
  }

  index(row, column = 0) {
    return this.raw[row][column];
  }

  mul(rhs) {
    console.assert(
      this.n == rhs.m,
      `cannot multiply ${this.m}x${this.n} & ${rhs.m}x${rhs.n}`);
    let out = [];
    for (var i = 0; i < this.m; i++) {
      out.push([]);
      for (var j = 0; j < rhs.n; j++) {
        let vs = [...Array(this.n).keys()].map(
          (n) => this.index(i, n) * rhs.index(n, j));
        out[i].push(vs.reduce((a, b) => a + b, 0));
      }
    }
    console.assert(out.length == this.m);
    console.assert(out[0].length == rhs.n);
    return new Matrix(out);
  }
  // test:
  // >> new Matrix([
  // ..    [2, 3, 4],
  // ..    [1, 0, 0]])
  // .. .mul(new Matrix([
  // ..    [0, 1000],
  // ..    [1, 100],
  // ..    [0, 10]]));
  // <- Matrix([
  // ..    [3, 2340],
  // ..    [0, 1000]]);

  // https://en.wikipedia.org/wiki/Invertible_matrix
  inv() {
    console.assert(this.m == 3 && this.n == 3, "3x3 determinant only!")
    let [a, b, c] = [0, 1, 2].map((i) => this.index(0, i));
    let [d, e, f] = [0, 1, 2].map((i) => this.index(1, i));
    let [g, h, i] = [0, 1, 2].map((i) => this.index(2, i));
    let [A, D, G] = [ (e*i - f*h), -(b*i - c*h),  (b*f - c*e)];
    let [B, E, H] = [-(d*i - f*g),  (a*i - c*g), -(a*f - c*d)];
    let [C, F, I] = [ (d*h - e*g), -(a*h - b*g),  (a*e - b*d)];
    let det = a * A + b * B + c * C;
    return new Matrix([
      [A * det, D * det, G * det],
      [B * det, E * det, H * det],
      [C * det, F * det, I * det]]);
  }

  trans() {
    return new Matrix(
      [...Array(this.n).keys()].map(
        (i) => [...Array(this.m).keys()].map(
          (j) => this.index(j, i))));
  }
}


// NOTE: colour spaces are wierd
// -- linear RGB maps the gamma curve of a mid-1990s CRT monitor
// -- LMS maps the long, medium & short wavelengths human cone cells are stimulated by
// -- D65 represents the white point of a 6504 Kelvin black body
// -- in other words, the colour of sunlight filtered through earth's atmosphere
// -- tl;dr: we're emulating a human looking at a CRT on a clear & sunny day

class ColourRGB {
  // sRGB + Alpha
  // 4x 0.0 -> 1.0 channels

  constructor(r = 0.0, g = 0.0, b = 0.0, a = 1.0) {
    [this.red, this.green, this.blue, this.alpha] = [r, g, b, a];
  }

  as_hex() {
    let out = ["#"];
    let [r, g, b, a] = [this.red, this.green, this.blue, this.alpha].map(
      (x) => Math.min(Math.floor(x * 255 + 0.1), 255));
    let pad = [r, g, b].some((x) => x > 15);
    let trans = (a < 255);
    if (trans && a > 15) { pad = true; }
    let pad_str = pad ? "" : "0";
    for (const c of [r, g, b]) {
      out.push(`${pad_str}${c.toString(16)}`);
    }
    if (trans) {
      out.push(`${pad_str}${a.toString(16)}`);
    }
    return out.join("");
  }

  as_OkLab() {
    return new ColourOkLab().from_sRGB(this);
  }

  as_OkLCH() {
    return new ColourOkLch().from_sRGB(this);
  }

  from_hex(hex_str) {
    let [r, g, b, a] = [0, 0, 0, 1];
    if (hex_str.startsWith("#")) {
      hex_str = hex_str.slice(1);
    }
    if (hex_str.length == 3) {
      [r, g, b] = [0, 1, 2].map(
        (i) => parseInt(hex_str.slice(i, i + 1), 16));
      [r, g, b] = [r, g, b].map(
        (x) => x << 4 | x);
    } else if (hex_str.length == 4) {
      [r, g, b, a] = [0, 1, 2, 3].map(
        (i) => parseInt(hex_str.slice(i, i + 1), 16));
      [r, g, b, a] = [r, g, b, a].map(
        (x) => x << 4 | x);
    } else if (hex_str.length == 6) {
      [r, g, b] = [0, 2, 4].map(
        (i) => parseInt(hex_str.slice(i, i + 2), 16));
    } else if (hex_str.length == 8) {
      [r, g, b, a] = [0, 2, 4, 6].map(
        (i) => parseInt(hex_str.slice(i, i + 2), 16));
    } else {
      console.error("invalid hex_str");
    }
    return new ColourRGB(r, g, b, a);
  }

  from_OkLab(oklab) {
    return oklab.as_sRGB();
  }

  from_OkLCH(oklch) {
    return oklch.as_sRGB();
  }
}


// https://en.wikipedia.org/wiki/Oklab_color_space
// https://bottosson.github.io/posts/oklab/
class ColourOkLab {
  // lightness | 0.0 -> 1.0
  // a | -0.4 -> +0.4 (green -> red)
  // b | -0.4 -> +0.4 (blue -> yellow)
  // alpha | 0.0 -> 1.0

  constructor(l = 0.0, a = 0.0, b = 0.0, o = 1.0) {
    [this.lightness, this.a, this.b, this.alpha] = [l, a, b, o];
  }

  as_hex() {
    return this.as_sRGB().as_hex();
  }
  // test: new ColourOkLab(0.5, -0.4, -0.4) -> "#0045FF"

  as_OkLCH() {
    let chroma = Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
    let hue = Math.atan2(this.b, this.a);
    return new ColourOkLch(this.lightness, chroma, hue, this.alpha);
  }

  as_sRGB() {
    let m_lab = new Matrix([[this.lightness, this.a, this.b]]).trans();
    console.log("m_lab=", m_lab.raw);
    let m_2 = new Matrix([
      [0.2104542553,  0.7936177850, -0.0040720468],
      [1.9779984951, -2.4285922050,  0.4505937099],
      [0.0259040371,  0.7827717662, -0.8086757660]]);
    let m_lmscr = m_2.inv().mul(m_lab);
    console.log("m_lmscr=", m_lmscr.raw);
    let m_lms = new Matrix([0, 1, 2].map(
      (i) => [Math.pow(m_lmscr.index(i), 3)]));
    console.log("m_lms=", m_lms.raw);
    // here be dragons
    let m_2lm = new Matrix([
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005]]);
    let m_lin = m_2lm.inv().mul(m_lms).trans();
    // https://en.wikipedia.org/wiki/SRGB
    console.log("m_lin=", m_lin.raw);
    let linear = m_lin.trans().raw[0];
    let [red, green, blue] = linear.map(
      (x) =>
        x < 0.0031308 ? 12.92 * x :
        1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    return new ColourRGB(red, green, blue, this.alpha);
  }

  from_hex(hex_str) {
    return new ColourRGB().from_hex(hex_str).as_OkLab();
  }

  from_OkLCH(oklch) {
    let a = oklch.chroma * Math.cos(oklch.h * (Math.PI / 180));
    let b = oklch.chroma * Math.sin(oklch.h * (Math.PI / 180));
    return new ColourOkLab(oklch.lightness, a, b, oklch.alpha);
  }

  from_sRGB(srgb) {
    // -> linear RGB
    let linear = [srgb.red, srgb.green, srgb.blue].map(
      (x) =>
        x < 0.04045 ? x / 12.92 :
        Math.pow((x + 0.055) / 1.055, 2.4));
    let m_lin = new Matrix([linear]).trans();
    console.log("m_lin", m_lin.trans().raw[0]);
    // -> CIE XYZ -> OkLMS (combined matrix)
    let m_2lm = new Matrix([
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005]]);
    let m_lms = m_2lm.mul(m_lin);
    console.log("m_lms", m_lms.trans().raw[0]);
    // -> cube root -> OkLab
    let m_lmscr = new Matrix([m_lms.trans().raw[0].map(
      (x) => Math.pow(x, 1/3))]).trans();
    console.log("m_lmscr", m_lmscr.trans().raw[0]);
    let m_2 = new Matrix([
      [0.2104542553,  0.7936177850, -0.0040720468],
      [1.9779984951, -2.4285922050,  0.4505937099],
      [0.0259040371,  0.7827717662, -0.8086757660]]);
    let m_lab = m_2.mul(m_lmscr);
    console.log("m_lab", m_lab.trans().raw[0]);
    // extract final values
    let [lightness, a, b] = [0, 1, 2].map((i) => m_lab.index(i, 0));
    return new ColourOkLab(lightness, a, b, srgb.alpha);
  }
}


class ColourOkLch {
  // OkLab's Polar Coords Counterpart
  // lightness | 0.0 -> 1.0
  // chroma | 0.0 -> 0.4 (saturation)
  // hue | hue | 0.0 -> 360.0
  // alpha | alpha | 0.0 -> 1.0
  constructor (l = 0.0, c = 0.0, h = 0.0, a = 1.0) {
    [this.lightness, this.chroma, this.hue, this.alpha] = [l, c, h, a];
  }

  as_hex() {
    return this.as_sRGB().as_hex();
  }

  as_OkLab() {
    return new ColourOkLab().from_OkLch(this);
  }

  as_sRGB() {
    return this.as_OkLab().as_sRGB();
  }

  from_hex(hex_str) {
    return this.from_sRGB(ColourRGB.from_hex(hex_str));
  }

  from_OkLab(oklab) {
    return oklab.as_OkLCH();
  }

  from_sRGB(srgb) {
    return new ColourOkLab().from_sRGB(srgb).as_OkLCH();
  }
}


function random_colour() {
  let hex = "0123456789ABCDEF";
  let out = ["#"];
  for (var i = 0; i < 3; i++) {
    out.push(hex[Math.floor(Math.random() * 16.5)])
  }
  return out.join("");
}


class DataArea {  // drive / file / folder
  constructor(label, size) {
    this.label = label;
    this.size = size;
    this.children = [];
  }

  // TODO: index children by label
  // TODO: child grid-column / row (might be irrelevant)
  // TODO: drive <div> rect area matching drive capacity

  get used_size() {
    let sizes = this.children.map((c) => c.size);
    return sizes.reduce((a, b) => a + b, 0);
  }

  get free_size() {  // unmapped by children
    return this.size - this.used_size;
  }

  alloc(label, size) {
    if (this.free_size >= size) {
      this.children.push(new DataArea(label, size));
    } else {
      console.error(`${size} > ${this.free_size}`)
    }
    return this;  // allow chaining
  }

  free(label) {
    this.children = this.children.filter((c) => c.label != label);
  }

  child(label) {
    for (const c of this.children) {
      if (c.label == label) {
        return c;
      }
    }
  }

  xpath(path) {
    let out = this;
    for (const label of path.split("/")) {
      out = out.child(label);
    }
    return out;
  }

  // TODO: tree view
  // TODO: on click "select" callback

  // WinDirStat visualiser
  style(depth = 0) {
    // grid layout
    let axes = ["row", "column"]
    let axis = axes[depth % 2]
    let out = [`grid-template-${axis}s:`];
    let sizes = this.children.map(({ size }) => size);
    sizes.push(this.free_size)
    for (const size of sizes) { out.push(`${size}fr`); }
    let colour;
    if (depth > 0) {
      colour = random_colour();
    } else {
      colour = "#DDD";
    }
    let background = [
      `linear-gradient(0deg in oklch, ${colour}, ${colour})`,
      "linear-gradient(to left,   #999, transparent 1.5rem)",
      "linear-gradient(to right,  #999, transparent 1.5rem)",
      "linear-gradient(to top,    #999, transparent 1.5rem)",
      "linear-gradient(to bottom, #999, transparent 1.5rem)"];
    return out.join(" ") + ";" + ` background: ${background.join(", ")};`;
  }

  as_html_wds(depth = 0) {
    /* WinDirStat blocks */
    let div = document.createElement("div");
    // TODO: xpath id
    div.setAttribute("class", "data-area");
    div.setAttribute("style", this.style(depth));
    for (const c of this.children) {
      div.appendChild(c.as_html_wds(depth + 1));
    }
    div.appendChild(document.createElement("div"));  // misc
    return div;
  }
}


// TODO: collapsible list tree of drive contents
// -- and controls to map sub-folders / files

// TODO: update UI based on drive selection
// TODO: user controls to map drive contents

// TODO: copy from.drive(path) -> to.drive(path)


function main() {
  // test data
  let drive_a = new DataArea("A:/", 200)
    .alloc("foo", 20)
    .alloc("bar", 10);
  drive_a.child("foo").alloc("rhubarb", 5);

  // TODO: wire up to <select>
  let drive_div = document.querySelector(".from > .drive");
  drive_div.appendChild(drive_a.as_html_wds());
}
