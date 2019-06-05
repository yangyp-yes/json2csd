const json2Csd = require('./lib/jsonToCsb.js');
const path = require('path');
const glob = require('glob');
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
        "desc": "export json to csb. --export [files]",
        "action": exportJson,
        "default": true
    },
    "--exOne": {
        "alias": ["-eo"],
        "desc": "export a json to csb. --export [files]",
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


/**
 * export json
 * args: --export [cmd_line_args] [.json files list].
 */
function exportJson(args) {
    if (typeof args === 'undefined' || args.length === 0) {
        glob(SRC, function (err, files) {
            if (err) {
                console.error("exportJson error:", err);
                throw err;
            }
            files.forEach(function (element, index, array) {
                json2Csd.ConvertIng(path.join(__dirname, element), path.join(__dirname, DEST_STR))
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
