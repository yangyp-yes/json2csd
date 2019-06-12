const json2Csd = require('./lib/jsonToCsd.js');
const path = require('path');
const glob = require('glob');
const fs = require('fs');

const DEST_STR = "./Output";
const SRC = "./src/**/[^~$]*.json";

/**
 * all commands
 */
let commands = {
    "--help": {
        "alias": ["-h"],
        "desc": "show this help manual.",
        "action": showHelp
    },
    "--export": {
        "alias": ["-e"],
        "desc": "export json to csd. --export [files]",
        "action": exportJson,
        "default": true
    },
    "--exOne": {
        "alias": ["-eo"],
        "desc": "export a json to csd. --export [files]",
        "action": exportJson,
    }
};

let alias_map = {}; // mapping of alias_name -> name
let parsed_cmds = []; //cmds of parsed out.

// process.on('uncaughtException', function(err) {
//     console.log('error: ' + err);
// });

//cache of command's key ("--help"...) 
let keys = Object.keys(commands);

for (let key in commands) { // 作 -h -e 对应
    let alias_array = commands[key].alias;
    alias_array.forEach((e) => {
        alias_map[e] = key;
    });
}

parsed_cmds = parseCommandLine(process.argv); // 入口接收cmd 传入的参数

// console.log("%j", parsed_cmds, "=================", "parsed_cmds");

parsed_cmds.forEach(function (e) {
    exec(e);
});

var copyFile = function (srcPath, tarPath) {
    console.log('copyFile:----------- begin')
    console.log(tarPath);
    console.log(srcPath);
    console.log('-----------')
    var dirname = path.dirname(tarPath);
    console.log("test:",dirname);

    if (!fs.existsSync(dirname)) {
        console.log("fs.mkdirSync:",dirname);

        mkdirsSync(dirname);
    }


    fs.writeFileSync(tarPath, fs.readFileSync(srcPath));
}
//递归创建目录 同步方法
function mkdirsSync(dirname) {
    console.log("mkdirsSync:",dirname);
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
function moveRes() {
    glob('src/**/*', function (err, files) {
        if (err) {
            console.error("exportJson error:", err);
            throw err;
        }
        files.forEach(function (element, index, array) {
            const filename = path.join(__dirname, element);
            console.log("filename:",filename);

            if (!isDirectory(filename)) {
                if (filename.indexOf('.json') > -1) {
                    console.log("filename::;;;;;",filename)
                } else {
                    const outFile = filename.replace(__dirname + '/src', __dirname + '/output');

                    copyFile(filename, outFile)
                }
            }
        });
    });
};

/**
 * export json
 * args: --export [cmd_line_args] [.json files list].
 */
function exportJson(args) {
    if (typeof args === 'undefined' || args.length === 0) {
        // TODO 将资源（除了.json)移动到发布路径

        moveRes();

        glob(SRC, function (err, files) {
            if (err) {
                console.error("exportJson error:", err);
                throw err;
            }
            files.forEach(function (element, index, array) {
                const filename = path.join(__dirname, element);

                if(!isDirectory(filename)){
                    const outFile = filename.replace(__dirname + '/src', __dirname + '/output');

                    json2Csd.ConvertIng(filename, outFile);
                }
            });
        });
    } else {
        if (args instanceof Array) { // Array的实例对象
            args.forEach(function (element, index, array) {
                let src = element;
                if (src.indexOf(':') === 1) {
                } else {
                    src = path.join(__dirname, element)
                }
                json2Csd.ConvertIng(src, path.join(__dirname, DEST_STR))
            });
        } else if (typeof args === "string" || args.length !== 0) {
            json2Csd.ConvertIng(args, path.join(__dirname, DEST_STR))
        }
    }
}

function isDirectory(path) {
    return fs.lstatSync(path).isDirectory()
}

/**
 * show help
 */
function showHelp() {
    let usage = "usage: \n";
    for (let p in commands) {
        if (typeof commands[p] !== "function") {
            usage += "\t " + p + "\t " + commands[p].alias + "\t " + commands[p].desc + "\n ";
        }
    }

    usage += "\nexamples: ";
    usage += "\n\n $node index.js --export\n\tthis will export all files configed to json.";
    usage += "\n\n $node index.js --export ./excel/foo.json ./excel/bar.json\n\tthis will export foo and bar json files.";

    console.log(usage);
}


/**************************** parse command line *********************************/

/**
 * execute a command
 */
function exec(cmd) {
    if (typeof cmd.action === "function") {
        cmd.action(cmd.args);
    }
}


/**
 * parse command line args
 */
function parseCommandLine(args) {
    let parsed_cmds = [];

    if (args.length <= 2) {
        parsed_cmds.push(defaultCommand());
    } else {

        let cli = args.slice(2); // 从index 2开始
        let pos = 0;
        let cmd;

        cli.forEach(function (element, index, array) {

            //replace alias name with real name.
            if (element.indexOf('--') === -1 && element.indexOf('-') === 0) {
                cli[index] = alias_map[element];
            }

            //parse command and args
            if (cli[index].indexOf('--') === -1) {
                cmd.args.push(cli[index]);
            } else {

                if (keys[cli[index]] === "undefined") {
                    throw new Error("not support command:" + cli[index]);
                }

                pos = index;
                cmd = commands[cli[index]];
                if (typeof cmd.args === 'undefined') {
                    cmd.args = [];
                }
                parsed_cmds.push(cmd);
            }
        });
    }

    return parsed_cmds;
}

/**
 * default command when no command line argas provided.
 */
function defaultCommand() {
    if (keys.length <= 0) {
        throw new Error("Error: there is no command at all!");
    }

    for (let p in commands) {
        if (commands[p]["default"]) {
            return commands[p];
        }
    }

    if (keys["--help"]) {
        return commands["--help"];
    } else {
        return commands[keys[0]];
    }
}

/*************************************************************************/
