const fs = require('fs');
const util = require('util');
const FindPlist = require("./findPlist");
const path = require('path');


const HEAD_STR = `<GameFile>
<PropertyGroup Name="%s" Type="%s" ID="%s" Version="3.10.0.0" />
<Content ctype="GameProjectContent">
<Content>\n`
const END_STR = `    </Content>
</Content>
</GameFile>`
const PNG_MODE = {
    PLIST: 1, // plist
    SUB: 2, // studio 的合同 最后导出plist
    NORMAL: 3, // 普通单个图
}

let localMode = 3;
let NeedFindPlist = "sprites" // 开启查找plist 文件 创建 匹配库
if (NeedFindPlist) {
    FindPlist.createFilesInfo(NeedFindPlist);
}
function isDirectory(path) {
    return fs.lstatSync(path).isDirectory()
}
//递归创建目录 同步方法
function mkdirsSync(dirname) {
    //console.log(dirname);

    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
module.exports = {
    ConvertIng: function (fileName, outFileName) {
        // console.log(fileName, ouFileName);
        let arr = fileName.split(path.sep);
        let len = arr.length;
        let f = arr[len - 1];
        let potIdx = f.indexOf(".");
        let freal = f.substring(0, potIdx);

        var dirname = path.dirname(outFileName);
        if (!fs.existsSync(dirname)) {
            mkdirsSync(dirname);
        }

        let data = fs.readFileSync(fileName);
        let strJson = data.toString();
        // console.log('同步读取：' + strJson);
        let objJson = JSON.parse(strJson);
        let ID = objJson["ID"];
        let tp = objJson['Type'];
        let na = objJson['Name'];
        let HeadStr = util.format(HEAD_STR, freal, tp, ID);
        let str = ConvertAnimation(objJson['Content']['Content']['Animation'])
        // console.log(str)
        let strAnimalList = ConvertAnimationList(objJson['Content']['Content']['AnimationList'])
        // console.log("999999:",strAnimalList);

        let stro = ConvertObjectData(objJson['Content']['Content']['ObjectData'])
        // console.log(stro)
        // let a = parseFloat("1.0")
        // console.log(a.toString())
        let TotalStr = HeadStr + str + "\n" + strAnimalList + stro + END_STR;
        console.log("outPath:",outFileName);
        const csdFilename = outFileName.replace('.json', '.csd');

        WriteTOFile(TotalStr, csdFilename)
    }
}

let {keys} = Object;
const getObjKey = function (obj) {
    let okeys = null;
    for (let key of keys(obj)) {
        let val = obj[key]
        if (typeof (val) == "object") {
            if (!okeys) {
                okeys = [];
            }
            okeys.push(key);
        }
    }
    return okeys;
}
const getNoObjKey = function (obj, needCtype) {
    let nokeys = null;
    for (let key of keys(obj)) {
        let val = obj[key]
        if (typeof (val) !== "object") {
            if (!nokeys) {
                nokeys = [];
            }
            if (needCtype) {
                nokeys.push(key);
            } else if (key !== "ctype") {
                nokeys.push(key);
            }
        }
    }
    return nokeys;
}
const ConvertChildren = function (arr, spaceStr) {
    let len = arr.length;
    if (len == undefined || len < 1) {
        return "";
    }
    let begin = `${spaceStr}<Children>\n`;
    for (let i = 0; i < len; i++) {
        let child = arr[i];
        let mid = formatXml(child, "AbstractNodeData", spaceStr + "  ", true);
        begin = begin + mid;
    }
    let end = `${spaceStr}</Children>\n`;
    return begin + end
}

const ConvertPoints = function (arr, spaceStr) {
    let len = arr.length;
    let HeadStr = `${spaceStr}<Point `;
    let begin = ""
    for (let i = 0; i < len; i++) {
        let p = arr[i];
        begin = begin + HeadStr + `X="${p['X']}" Y="${p['Y']}" />\n`
    }
    return begin
}
const formatXml = function (obj, rootName, spaceStr, needCtype) {
    let nokeys = getNoObjKey(obj, needCtype);
    let okeys = getObjKey(obj);
    if ((rootName === "FileData" || rootName === "NormalFileData" || rootName === "PressedFileData" || rootName === "DisabledFileDa" || rootName == "PlistSubImage") && NeedFindPlist) {
        let t = obj['Type'];
        let p = obj['Plist']
        if (t === "PlistSubImage" && p === "") {
            obj['Plist'] = FindPlist.getPlistFilePath(obj['Path']);
        }
    }
    let begin = spaceStr + "<" + rootName;
    let beginEnd = '>\n'
    if (!okeys) {
        beginEnd = ' />\n'
    }
    if (!nokeys) {
        begin = begin + beginEnd
    } else {
        let noLen = nokeys.length
        let getStr = function (val) {
            if (typeof (val) == "boolean") {
                if (val) {
                    return "True"
                } else {
                    return "False"
                }
            }
            if (val === "MarkedSubImage" || val === "PlistSubImage") {
                // XXX 如果是有Cocos Studio 自带合图，（该模式会将小图自动打成大图，这里将不做还原，将模式改为普通合图模式
                if(val === "MarkedSubImage"){
                    return "PlistSubImage";
                }
                if (val === "PlistSubImage" && NeedFindPlist) {
                    return val.toString();
                }
                if (localMode == PNG_MODE.NORMAL) {
                    return "Normal"
                }
                if (localMode == PNG_MODE.PLIST) {
                    return "PlistSubImage"
                }
                // SUB 应该不会用到

            }
            let str = val.toString().replace(/([&])/g, "&amp;");
            str = str.replace(/(["])/g, "&quot;");

            return str;
        }
        for (let i = 0; i < noLen; i++) {
            let k = nokeys[i]
            begin = `${begin} ${k}="${getStr(obj[k])}"`
        }
        begin = begin + beginEnd
    }
    if (!okeys) {
        return begin
    } else {
        let oLen = okeys.length
        for (let i = 0; i < oLen; i++) {
            let k = okeys[i]
            if (k !== "Children") {
                if (k === "Points") {
                    begin += ConvertPoints(obj[k], spaceStr + "  ")
                } else {
                    let mid = formatXml(obj[k], k, spaceStr + "  ")
                    begin = begin + mid
                }
            } else {
                begin += ConvertChildren(obj[k], spaceStr + "  ")
            }
        }
        let end = `${spaceStr}</${rootName}>\n`
        return begin + end
    }
}
const FrameNames = {
    Position: "PointFrame",
    Scale: "ScaleFrame",
    RotationSkew: "ScaleFrame",
    FileData: "TextureFrame",
    BlendFunc: "BlendFuncFrame",
    VisibleForFrame: "BoolFrame",
    AnchorPoint: "ScaleFrame",
}

const ConvertFrames = function (arr, fName) {
    let spaceStr = "    "
    let len = arr.length
    let str = ""
    for (let i = 0; i < len; i++) {
        let aFrame = arr[i];
        let mid = formatXml(aFrame, fName, spaceStr)
        str = str + mid
    }
    return str
}

const ConvertTimelines = function (arr) {
    let spaceStr = "  "
    let len = arr.length
    let str = "";
    for (let i = 0; i < len; i++) {
        let aline = arr[i]
        let begin = `${spaceStr}<Timeline ActionTag="${aline['ActionTag']}" Property="${aline['Property']}">\n`
        let frames = aline['Frames']
        let pro = aline['Property']
        let fName = FrameNames[pro]
        if (fName) {
            let mid = ConvertFrames(frames, fName)
            begin = begin + mid
        } else {
            console.log(pro, "not isexit");
        }

        let end = spaceStr + "</Timeline>\n"
        str = str + begin + end
    }
    return str
}


const ConvertAnimation = function (obj) {
    if (!obj) {
        return `<Animation Duration="0" Speed="1.0000" />`;
    }
    let begin = `<Animation Duration="${obj['Duration']}" Speed="${obj['Speed']}">\n`
    let mid = ConvertTimelines(obj['Timelines'])
    let end = "</Animation>"
    let str = begin + mid + end
    return str
}

const ConvertObjectData = function (obj) {
    return formatXml(obj, "ObjectData", "", true)
}
const ConvertAnimationList = function (obj) {
    if (obj.length === 0) {
        return '';
    }
    var str = '';
    var colors = [
        '<RenderColor A="150" R="105" G="105" B="105" />',
        '<RenderColor A="150" R="105" G="0" B="105" />',
        '<RenderColor A="150" R="105" G="105" B="0" />',
        '<RenderColor A="150" R="0" G="105" B="105" />',
    ];


    for (let i = 0; i < obj.length; i++) {
        let aFrame = obj[i];

        let colorid = i % colors.length;
        let before =
            `  <AnimationInfo Name="${aFrame.Name}"\
 StartIndex="${aFrame.StartIndex}"\
 EndIndex="${aFrame.EndIndex}"\
> 
    ${colors[colorid]}
  </AnimationInfo>
`;
        str = str + before;
    }


    return `<AnimationList>\n  ${str}</AnimationList>`
}

const WriteTOFile = function (str, dest_file) {
    // 将嵌套的动画路径改为 csd 的路径
    if(str.indexOf('.json')){
        str = str.replace(/.json/g,'.csd');
    }
    console.log("dest_file:",dest_file)
    fs.writeFile(dest_file, str, 'utf-8', err => {
        if (err) {
            console.error("error：", err);
            throw err;
        }
        console.log('exported successfully  -->  ', dest_file);
    });
}