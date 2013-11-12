#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var handlebars = require('handlebars');
var pkg = require('../package.json');
var program = require('commander')
    .version(pkg.version)
    .option('-t, --testdir <dir>', 'The directory where the .pu unit tests are held. If not specified, ./test will be assumed.')
    .option('-s, --scriptdir <dir>', 'The directory where the pig scripts are held. If not specified the current directory will be assumed.')
    .option('-R, --reporter <name>', 'specify the reporter to use', 'list')
    .option('-d, --debug', 'Turn on (very very verbose) debug messages')
    .option('-v, --verbose', 'Turn on verbose mode')
    .parse(process.argv);

var loglevel = "info";
if (program.verbose) loglevel = "debug";
if (program.debug) loglevel = "log";

colors = require('colors');
logger = require('tracer').colorConsole({
    level: loglevel,
    dateformat: "HH:MM:ss",
    format: "[[{{timestamp}}] {{file}}::{{line}} <{{title}}>] {{message}}",
    showHidden: true,
    depth: null,
    filters: {
        log: colors.grey,
        trace: colors.magenta,
        debug: colors.cyan,
        info: colors.green,
        warn: colors.yellow,
        error: [colors.red, colors.bold]
    },
});

// setup and check default values
program.testdir = path.resolve(program.testdir || "./test");
program.scriptdir = path.resolve(program.scriptdir || ".");
var mochaOpts = path.resolve(program.testdir, "mocha.opts");
if (fs.existsSync(mochaOpts)) {
    program.mochaopts = mochaOpts;
} else {
    mochaOpts = path.resolve("./mocha.opts");
    if (fs.existsSync(mochaOpts)) {
        program.mochaopts = mochaOpts;
    } else {
        program.mochaopts = null;
    }
}
program.bindir = __dirname;
program.moduledir = path.resolve(program.bindir, "..");
program.nodelibs = path.resolve(program.moduledir, "node_modules");
program.supportdir = path.resolve(program.bindir, "../support");
program.testtemplate = path.resolve(program.supportdir, "pigunit-template.js");
logger.debug("Reporter: %s", program.reporter);
logger.debug("Test Dir: %s", program.testdir);
logger.debug("Script Dir: %s", program.scriptdir);
logger.debug("Mocha Opts File: %s", program.mochaopts);
logger.debug("Module Dir: %s", program.bindir);
logger.debug("Support Dir: %s", program.supportdir);
logger.debug("Unit Test Template: %s", program.testtemplate);

if (!fs.existsSync(program.testdir)) {
    logger.error ("Test directory %s doesn't exist", program.testdir);
    process.exit(-1);
}
var testDirStats = fs.statSync(program.testdir);
if (!testDirStats.isDirectory()) {
    logger.error("%s must be a directory", program.testdir);
    process.exit(-1);
}

if (!fs.existsSync(program.scriptdir)) {
    logger.error ("Script directory %s doesn't exist", program.scriptdir);
    process.exit(-1);
}
var scriptDirStats = fs.statSync(program.scriptdir);
if (!scriptDirStats.isDirectory()) {
    logger.error("%s must be a directory", program.scriptdir);
    process.exit(-1);
}

// get file list from command line
var fileList = [];
var testDirList = fs.readdirSync(program.testdir);
for (var i = 0; i < testDirList.length; i++) {
    // make sure the file has a .pu extension
    if (!testDirList[i].match(/.pu$/)) continue;
    // add file .pu file to file list
    fileList.push(path.resolve(program.testdir, testDirList[i]));
}
logger.debug(fileList);

// read in mocha.opts, same as _mocha script
/* TODO: all the commmander logic is embedded in the mocha file, but so is the logic to add files
 * this leaves us the unslightly option of either copying all of _mocha to change one line or
 * finding some hack. Let's worry about that later and people can suffer without all the mocha
 * options for now.
 * */
var Mocha = require('mocha');
var mocha = new Mocha();

// create a random /tmp directory to store our tests in
var randomTestDir = path.join("/tmp", "pigtest." + randomString());
logger.log("random dir: %s", randomTestDir);

function randomString() {
    var length = 32;
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';

    for (i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return result;
}
fs.mkdirSync(randomTestDir, 0755);
// setup a link from the test dir to the pigunit node_modules directory, so that the dependencies in the template resolve correctly
fs.symlinkSync(program.nodelibs, path.resolve(randomTestDir, "node_modules"));

// handlebars helper for turning an array of strings into a comma separated list of strings
logger.log("file list is %j", fileList);
handlebars.registerHelper("strArray", function(items, options) {
    var buf = '';

    for (var i = 0; i < items.length; i++) {
        buf = buf + "\"" + items[i] + "\"";
        if (i !== (items.length - 1)) buf = buf + ", ";
    }

    return buf;
});

// use the handlebars template to create the tests
hTemplate = handlebars.compile(fs.readFileSync(program.testtemplate, {
    encoding: 'utf8'
}));

for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    logger.log("reading file %s", file);
    templateData = JSON.parse(fs.readFileSync(file, {
        encoding: 'utf8'
    }));
    //templateData.moduleDir = path.resolve("..");
    templateData.script = path.resolve(program.scriptdir, templateData.script);
    // TODO: verify data, esp. options & timeout option
    logger.log("template data is:");
    logger.log(templateData);
    // add the data to the template
    pigTestJs = hTemplate(templateData);
    logger.log("test data is %s", pigTestJs);
    // save the test to the random test directory with the same name as the test file, but a .js extension
    pigTestJsFile = path.resolve(randomTestDir, path.basename(file).replace(/\.pu$/, ".js"));
    logger.log("writing test file: %s", pigTestJsFile);
    fs.writeFileSync(pigTestJsFile, pigTestJs);
    // add the file to mocha
    mocha.addFile(pigTestJsFile);
}

// run mocha
mocha.reporter(program.reporter).run(function(failures) {
    process.on('exit', function() {
        process.exit(failures);
    });
});

// remove random test directory