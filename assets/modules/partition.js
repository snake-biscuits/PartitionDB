import { YCH } from "./colour.js";


// high contrast looping pattern
function polyrythym(seed, big, small) {
  return (big * seed) % small;
}


// pseudo-random colour
function colour_for(depth, index) {
  let luma = 0.8;
  let chroma = 0.075 + polyrythym(index, 11, 3) / 10;
  let hue = 120 + polyrythym(depth, 130, 360);
  return new YCH(luma, chroma, hue).as_hex();
}


// drive / file / folder
class DataArea {
  constructor(label, size) {
    [this.label, this.size] = [label, size];
    this.children = [];
  }

  static from_array(array) {
    let [label, size, children] = [null, null, []];
    if (array.length == 2) {
      [label, size] = array;
    } else if (array.length == 3) {
      [label, size, children] = array;
    } else {
      console.error("invalid array");
    }
    let out = new DataArea(label, size);
    out.children = children.map((a) => DataArea.from_array(a));
    return out;
  }

  static from_json(json) {
    let out = new DataArea(json.label, json.size);
    let children = [];  // optional
    if (Object.hasOwn(json, "children")) {
      children = json.children;
    }
    out.children = children.map((j) => DataArea.from_json(j));
    return out;
  }

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
  style(depth = 0, index = 0) {
    // grid layout
    let axes = ["row", "column"]
    let axis = axes[depth % 2]
    let out = [`grid-template-${axis}s:`];
    let sizes = this.children.map(({ size }) => size);
    sizes.push(this.free_size)
    for (const size of sizes) { out.push(`${size}fr`); }
    // base colour + vingette
    let colour = colour_for(depth, index);
    let background = [
      `linear-gradient(0deg, ${colour}, ${colour})`,
      "linear-gradient(to left,   #999, transparent 25%)",
      "linear-gradient(to right,  #999, transparent 25%)",
      "linear-gradient(to top,    #999, transparent 25%)",
      "linear-gradient(to bottom, #999, transparent 25%)"];
    // let background = [`radial-gradient(${colour}, #222)`]
    return out.join(" ") + ";" + ` background: ${background.join(", ")};`;
  }

  as_html_wds(depth = 0, index = 0) {
    /* WinDirStat blocks */
    let div = document.createElement("div");
    // TODO: xpath id
    div.setAttribute("class", "data-area");
    div.setAttribute("style", this.style(depth, index));
    let i = 1;
    for (const c of this.children) {
      div.appendChild(c.as_html_wds(depth + 1, i));
      i++;
    }
    // extra div to fill grid, if needed
    if (this.children.length > 0 && this.free_size > 0) {
      div.appendChild(document.createElement("div"));
    }
    return div;
  }
}


export { DataArea };
