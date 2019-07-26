# json2csd

> The.json file exported by CocosStudio goes back to the source.csd file for easy re-editing to fix UI engineering files that have lost source files


## STEP

1. npm i

2. Create the `src` directory,Copy the published json project files to this directory

3. node index.js

4. After success, it will generate in the current `output` directory, create a new CocosStudio project file, delete the files in the project, and drag all files generated in the directory to the resource path


## TODO

The specified path has not been tested

## Known issues

If you use CocosStudio's built-in SpriteSheet function, that is, small pictures are included in the project, and then the pictures will be automatically merged after release. When restoring, the pictures are not restored, but converted into plist merging pictures
