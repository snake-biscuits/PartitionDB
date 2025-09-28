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
  contructor(raw_matrix) {
    this.raw = raw_matrix;
    this.m = raw_matrix.length;
    this.n = raw_matrix[0].length;
  }

  index(row, column = 0) {
    return this.raw[row][column]
  }

  mul(lhs, rhs) {
    console.assert(
      lhs.s == rhs.m,
      `cannot multiply ${lhs.m}x${lhs.n} & ${rhs.m}x${rhs.n}`);
    let out = [];
    for (var j = 0; j < rhs.n; j++) {
      out.push([]);
      for (var i = 0; i < lhs.m; i++) {
        let vs = [...Array(lhs.n).keys()].map(
          (n) => lhs.index(n, i) * rhs.index(j, n));
        out[i].push(vs.reduce((a, b) => a + b, 0));
      }
    }
    console.assert(out.length == lhs.m);
    console.assert(out[0].length == rhs.n);
    return new Matrix(out);
  }

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
    out = ["#"];
    let [r, g, b, a] = [this.red, this.green, this.blue, this.alpha].map(
      (x) => Math.min(Math.floor(x * 255 + 0.1), 255));
    let pad = [r, g, b].some((x) => x > 15);
    let trans = (a < 255);
    if (trans && a > 15) { pad = true; }
    let pad_str = pad ? "" : "0";
    for (const c of [r, g, b]) {
      out.push(`${pad_str}${c.toString(16)}`)
    }
    if (trans) {
      out.push(`${pad_str}${a.toString(16)}`)
    }
    return out.join("");
  }

  as_OkLab() {
    return ColourOkLab.from_sRGB(this);
  }

  as_OkLCH() {
    return ColourOkLch.from_sRGB(this);
  }

  from_hex(hex_str) {
    let [r, g, b, a] = [0, 0, 0, 1];
    if (hex_str.startsWith("#") {
      hex_str = hex_str.slice(1);
    }
    if (hex_str.length == 3) {
      [r, g, b] = [0, 1, 2].map(
        (i) => parseInt(hex_str.slice(i, i + 1), 16));
    } else if (hex_str.length == 4) {
      [r, g, b, a] = [0, 1, 2, 3].map(
        (i) => parseInt(hex_str.slice(i, i + 1), 16));
    } else if (hex_str.length == 6) {
      [r, g, b] = [0, 2, 4].map(
        (i) => parseInt(hex_str.slice(i, i + 2), 16));
    } else if (hex_str.length == 8) {
      [r, g, b, a] = [0, 2, 4, 6].map(
        (i) => parseInt(hex_str.slice(i, i + 2), 16));
    } else
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

  as_OkLCH() {
    let chroma = Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
    let hue = Math.atan2(this.b, this.a);
    return new ColourOkLch(this.lightness, chroma, hue, this.alpha)
  }

  as_sRGB() {
    let m_lab = new Matrix([[this.lightness], [this.a], [this.b]]);
    let m_2 = new Matrix([
      [0.2104542553,  0.7936177850, -0.0040720468],
      [1.9779984951, -2.4285922050,  0.4505937099],
      [0.0259040371,  0.7827717662, -0.8086757660]]);
    let m_lmscr = Matrix.mul(m_2.inv(), m_lab);
    let m_lms = new Matrix([0, 1, 2].map(
      (i) => [Math.pow(m_lms.index(i), 3)])]);
    let m_2lm = new Matrix([
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005]]);
    let m_lin = Matrix.mul(m_2lm.inv(), m_lms);
    // https://en.wikipedia.org/wiki/SRGB
    let linear = [0, 1, 2].map((i) => m_rgb.index(0, i));
    let [red, green, blue] = linear.map(
      (x) =>
        x <= 0.00313066844250063 ? 12.92 * x :
        1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    return new ColourRGB(red, green, blue, this.alpha);
  }

  from_hex(hex_str) {
    return ColourRGB.from_hex(hex_str).as_OkLab();
  }

  from_OkLCH(oklch) {
    let a = oklch.chroma * Math.cos(oklch.h * (Math.PI / 180));
    let b = oklch.chroma * Math.sin(oklch.h * (Math.PI / 180));
    return new ColourOkLab(oklch.lightness, a, b, oklch.alpha);
  }

  from_sRGB(srgb) {
    let lightness, a, b;
    // -> linear RGB
    let linear = [srgb.red, srgb.green, srgb.blue].map(
      (x) =>
        x <= 0.0404482362771082 ? x / 12.92 :
        Math.pow((x + 0.055) / 1.055, 2.4));
    let m_lin = new Matrix([linear[0], linear[1], linear[2]]);
    /* // CIE XYZ -> OkLMS
    *  let m1 = new Matrix([
    *    [0.8189330101, 0.3618667424, -0.1288597137],
    *    [0.0329845436, 0.9293118715,  0.0361456387],
    *    [0.0482003018, 0.2643662691,  0.6338517070]]);
    */
    // -> CIE XYZ -> OkLMS (combined matrix)
    let m_2lm = new Matrix([
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005]]);
    let m_lms = Matrix.mul(m_2lm, m_lin);
    // -> cube root -> OkLab
    let m_lmscr = new Matrix([
      [Math.pow(m_lms.index(0), 1/3)],
      [Math.pow(m_lms.index(1), 1/3)],
      [Math.pow(m_lms.index(2), 1/3)]]);
    let m_2 = new Matrix([
      [0.2104542553,  0.7936177850, -0.0040720468],
      [1.9779984951, -2.4285922050,  0.4505937099],
      [0.0259040371,  0.7827717662, -0.8086757660]]);
    let m_lab = Matrix.mul(m_2, m_lmscr);
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
    return this.as_rgba().as_hex();
  }

  as_OkLab() {
    return ColourOkLab.from_OkLch(this);
  }

  as_sRGB() {
    return this.as_OkLab().as_sRGB();
  }

  from_hex(hex_str) {
    return this.from_rgba(ColourRGB.from_hex(hex_str));
  }

  from_OkLab(oklab) {
    return oklab.as_OkLCH();
  }

  from_sRGB(srgb) {
    return ColourOkLab.from_sRGB(srgb).as_OkLab();
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
