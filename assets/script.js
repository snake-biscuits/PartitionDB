import { DataArea } from "./partition.js";

// inline definition
/* let drive_a = new DataArea("A:/", 200);
*  drive_a.alloc("foo", 20);
*  drive_a.child("foo").alloc("rhubarb", 5);
*  drive.alloc("bar", 10);
*/

// from_json
/* let json = {
*    label: "A:/", size: 200, children: [
*      { label: "foo", size: 20, children: [
*        { label: "bar", size: 10},
*        { label: "rhubarb", size: 5}]}]};
*  let drive_a = DataArea.from_json(json);
*/

// from_array
let drive_a = DataArea.from_array([
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
    ["4", 15]]]);

// TODO: wait for stylesheet to finish loading before setting data
let drive_div = document.querySelector(".from > .drive");
drive_div.appendChild(drive_a.as_html_wds());

// TODO:
// -- wire up list of drives to <select>
// -- collapsible list tree of drive contents
// --- and controls to map sub-folders / files
// -- update UI based on drive selection
// -- user controls to map drive contents
// -- copy from.drive(path) -> to.drive(path)
// -- global drive list (top-level DataAreas)
// -- json from file (Drag & Drop?) / browser storage
// -- drive <div> rect area matching drive capacity
// -- mirror console.log etc. to <code id="log"></code>
// --- console.assert(cond, msg)
// --- if not cond: log.append(msg)
