// TODO: global drive list (top-level DataAreas)
// TODO: load from & save to JSON


// TODO: mirror console.log etc. to <code id="log"></code>
// -- console.assert(cond, msg)
// -- if not cond: log.append(msg)

// TODO: use a polar colour space like Oklch
// TODO: hue shift a given base colour within a limited arc
// might need to use a class for hex -> rgb -> polar
// NOTE: stock JS has no int -> padded hex
// -- (123).toString(16) & parseInt("ABC", 16) only
// TODO: use python colorsys as reference
// -- /usr/lib/python3.13/colorsys.py
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
