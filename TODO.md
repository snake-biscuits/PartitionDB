# TODOs

css grid layout & vingette gradients
WinDirStat inspired visualisation

web frontend, sql backend

`.js` hover funcs to highlight boundaries of each folder blob

bsp-like split to show heirarchy
alternate between `grid-template-columns` & `rows`
```python
misc_size = folder.size - sum(c.size for c in folder.children)
# NOTE: misc_size could just be a @property of Folder
" ".join([
    "grid-template-rows:"
    *[
        f"{child.size}fr"
        for child in folder.children],
    f"{misc_size}fr",
])
```
use grid position indices to match each folder div to it's sized grid segment


```sql
CREATE TABLE IF NOT EXISTS Drive (
  guid  VARCHAR  UNIQUE,
  size  INTEGER  -- in GB
);
  
CREATE TABLE IF NOT EXISTS Folder (
  name  VARCHAR  NOT UNIQUE,
  size  INTEGER  -- in GB
);

CREATE TABE IF NOT EXISTS DriveFolder (
  drive, folder  -- FKs
);

CREATE TABE IF NOT EXISTS ParentFolder (
  parent, child  -- Folder FKs
);
```


use functions & snapshots to calculate folder sizes
  * sum of child folders + misc (mappings are loose)
  * drive free space = capacity - (sum(folder.sizes) + misc)
  * simulate rearranging data, check against drive free space
  * trying to keep track of duplicate data
    - want to manage redundant storage
    - would also like to integrate w/ a `sources.md` database
    - (keeping track of what files have online archives)


## Tags
 * Personal Data (no online source) [**DO NOT DELETE**]
 * Online / Disk backup source [**RECOVERABLE w/ `sources.md`**]
   - Game Library (Steam, GoG, abandonware, console backups, etc.)
   - Media Library (Series, Movies, Music, YouTube etc.)
 * Misc.
   - `Mod/` (personal / online mix)
   - `Books/` (mostly Humble Bundle)
   - `Music/soundcloud` (soundclown archive w/ malformed metadata)
