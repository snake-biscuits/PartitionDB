import { DataArea } from "./modules/partition.js";


// TODO: ".drive" div height proportional to drive size

// TODO: copy planner
// -- list of copy operations
// -- size checks
// -- estimated time (@ XX MB/s)

// TODO: tree view
// -- collapsible nested lists
// -- label & size controls
// -- on hover: set style of "linked" tree / wds element

// TODO: duplicates
// -- identify duplicate DataAreas on different drives
// -- only consider childless DataAreas as potential duplicates
// -- parent labels matter (e.g. Steam > HL2 != Mod > HL2)


// index.html targets
const dropzone = document.getElementById("dropzone");
// TODO: lhs = { tree: ..., wds: ..., select: ..., button: ...};
// -- class DriveView? constructor sets up callbacks
const lhs_div = document.querySelector("#lhs > .drive");
const lhs_sel = document.querySelector("#lhs > div > select")
const lhs_btn = document.querySelector("#lhs > div > button")
const rhs_div = document.querySelector("#rhs > .drive");
const rhs_sel = document.querySelector("#rhs > div > select")
const rhs_btn = document.querySelector("#rhs > div > button")
const log = document.querySelector("#messages");


// globals
let drives = [  // test data
  DataArea.from_array([
    "A:/", 200, [
      ["foo", 20, [
        ["bar", 5],
        ["baz", 1],
        ["bag", 3],
        ["bad", 4],
        ["baa", 2]]],
      ["rhubarb", 5],
      ["1", 30],
      ["2", 60],
      ["3", 70],
      ["4", 15]]]),
  new DataArea("B:/", 512)];


function mirror_log(data, colour="#CDC") {
  log.appendChild(document.createElement("br"));
  let line = document.createElement("code");
  line.textContent = data;
  line.style.color = colour;
  log.appendChild(line);
  console.log(data);
}


function mirror_error(msg) {
  mirror_log(msg, "#C77");
  console.error(msg);
}


function notImplemented(msg=null) {
  msg = (msg !== null) ? `notImplemented: ${msg}` : "notImplemented";
  mirror_error(msg);
}


function set_drive(drive, index = -1) {
  mirror_log(`drive.label=${drive.label}, index=${index}`);
  // add drive to drives
  let lhs_option = document.createElement("option");
  lhs_option.textContent = drive.label;
  let rhs_option = document.createElement("option");
  rhs_option.textContent = drive.label;
  if (index == -1) {  // append
    index = drives.length;
    drives.push(drive);
    lhs_sel.appendChild(lhs_option);
    rhs_sel.appendChild(rhs_option);
  } else {  // override
    lhs_sel.children[index].replaceWith(lhs_option);
    rhs_sel.children[index].replaceWith(rhs_option);
  }
  return index;
}


function load_drives(text) {
  let json = JSON.parse(text);
  // TODO: mirror_log json loading errors
  drives = json.map((j) => DataArea.from_json(j));

  drives.forEach(
    (d, i) => {
      i += 1;
      let lhs_option = document.createElement("option");
      lhs_option.textContent = d.label;
      let rhs_option = document.createElement("option");
      rhs_option.textContent = d.label;
      if (lhs_sel.children[i] !== undefined) {  // override
        lhs_sel.children[i].replaceWith(lhs_option);
        rhs_sel.children[i].replaceWith(rhs_option);
      } else {  // append
        lhs_sel.appendChild(lhs_option);
        rhs_sel.appendChild(rhs_option);
      }
  });
  lhs_sel.selectedIndex = 0;
  rhs_sel.selectedIndex = 0;
  if (lhs_div.firstElementChild !== null) {
    lhs_div.removeChild(lhs_div.firstElementChild);
  }
  if (rhs_div.firstElementChild !== null) {
    rhs_div.removeChild(rhs_div.firstElementChild);
  }
}


function view_drive(div, index) {
  let drive_div = drives[index].as_html_wds();
  if (div.children.length === 0) {
    div.appendChild(drive_div);
  } else {
    div.firstElementChild.replaceWith(drive_div);
  }
}


function dropfunc(e) {
  e.preventDefault();
  [...e.dataTransfer.items].forEach(
    (item, i) => {
      // .json file
      if (item.kind === "file") {
        const file = item.getAsFile();
        mirror_log(`${item.type}: ${file.name}`);
        // load drives from file
        const reader = new FileReader();
        reader.onload = () => {
          load_drives(reader.result);
        };
        reader.onerror = () => {
          mirror_error(`Failed to load: ${file.name}`);
        }
        reader.readAsText(file);
      // raw .json text
      } else if (item.kind === "string") {
        item.getAsString((text) => {
          mirror_log(`${item.type}: ${text}`);
          if (item.type.match("^text/plain")) {
            load_drives(text);
          }
        });
      }
  });
}


// drag & drop
window.addEventListener("dragover", (e) => { e.preventDefault(); });
window.addEventListener("drop", (e) => { e.preventDefault(); });
dropzone.addEventListener("drop", dropfunc);

// NOTE: would be nice if we didn't have to duplicate so much code

// drive selection
lhs_sel.onchange = (e) => {
  e.preventDefault();
  let index = lhs_sel.selectedIndex - 1;
  if (index !== -1) {
    view_drive(lhs_div, index);
  } else {
    lhs_div.removeChild(lhs_div.firstElementChild);
  }
}

rhs_sel.onchange = (e) => {
  e.preventDefault();
  let index = rhs_sel.selectedIndex - 1;
  if (index !== -1) {
    view_drive(rhs_div, index);
  } else {
    rhs_div.removeChild(rhs_div.firstElementChild);
  }
}

// new drive
lhs_btn.onclick = (e) => {
  e.preventDefault();
  // TODO: input to set label & size of new drive
  let [label, size] = [null, null];
  let drive = new DataArea(label, size);
  let index = set_drive(drive);
  lhs_sel.selectedIndex = index + 1;
  view_drive(lhs_div, index);
  // DEBUG
  console.log(index);
  console.log(drives);
}

rhs_btn.onclick = (e) => {
  e.preventDefault();
  // TODO: input to set label & size of new drive
  let [label, size] = [null, null];
  let drive = new DataArea(label, size);
  let index = set_drive(drive);
  rhs_sel.selectedIndex = index + 1;
  view_drive(rhs_div, index);
}

if (lhs_sel.selectedIndex > 0) { view_drive(lhs_div, lhs_sel.selectedIndex - 1); }
if (rhs_sel.selectedIndex > 0) { view_drive(rhs_div, rhs_sel.selectedIndex - 1); }
