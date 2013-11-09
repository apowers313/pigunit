var Mocha = require('mocha');
var path = require('path');
var fs = require('fs');
var mocha = new Mocha();

// create a random /tmp directory to store our tests in
var randomTestDir = path.join ("/tmp", randomString());
function randomString() {
	var length = 32;
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';

	for (var i = length; i > 0; --i) {
		result += chars[Math.round(Math.random() * (chars.length - 1))];
	}

	return result;
}
//fs.mkdirSync (randomTestDir, 0755);

// read in the test file(s)
// fs.readdirSync (path)

// use the handlebars template to create the tests

// add test file(s) to mocha
var testFile = './node-pigunit.js';
// var testFile = '../mochaTest/maintest.js';
mocha.addFile (testFile);

// setup mocha options

// run mocha
mocha.reporter('spec').run(function(failures){
  process.on('exit', function () {
    process.exit(failures);
  });
});