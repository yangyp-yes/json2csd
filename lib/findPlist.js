
let M ={
    FileInfoObj:null,
    name:"findPlist"
};

// 用相对路径
const fs = require('fs');
const glob = require('glob');
const SRC = `%s/**/[^~$]*.plist`;
const util = require('util');
let PATH = "sprites"
M.saveOneFile = function(element){
    let t = this.FileInfoObj;
    let data = fs.readFileSync("./"+element);
    let dataStr = data.toString();
    let pngNameArr = dataStr.match(/<key>(\S*).png</g);
    let pLen = pngNameArr.length
    for (let index = 0; index < pLen; index++) {
        let str = pngNameArr[index];
        str = str.replace(/<key>/g, "")
        str = str.replace(/</g, "")
        t[str] = element;
    }
}
M.createFilesInfo = function(path){
    let self = this;
    let usePath
    if(path){
        usePath = path;
    }else{
        usePath = PATH;
    }
    let src = util.format(SRC, usePath);
    let files = glob.sync(src);
    let InfoObj = {};
    self.FileInfoObj = InfoObj;
    files.forEach(function(element, index, array) {
        self.saveOneFile(element) 
     });
    console.log("PLIST POOL WRITE ok!");
    // glob(src, function(err, files) {
    //     if (err) {
    //       console.error("exportJson error:", err);
    //       throw err;
    //     }
    //     let InfoObj = {};
    //     self.FileInfoObj = InfoObj;
    //     files.forEach(function(element, index, array) {
    //        self.saveOneFile(element) 
    //     });
    //   });
    // 这里不能异步
}
// M.saveOneFile("sprites/form/form-hd.plist", {});
M.getPlistFilePath = function(pngName){
    let self = this;
    let p = self.FileInfoObj[pngName];
    if (typeof p==='string'){
        return p;
    }else{
        return "";
    }
}
module.exports = M;