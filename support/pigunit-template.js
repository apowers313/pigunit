// set java max heap size to 6GB. the default size (typically 128MB) dies on even the smallest test
/* TODO: don't overwrite previous _JAVA_OPTIONS */
require.paths = "{{moduleDir}}/node_modules";

process.env['_JAVA_OPTIONS'] = "-Xmx6144m -Dfile.encoding=UTF-8";
var pigHome = process.env.PIG_HOME;
var assert = require('assert');
assert.notStrictEqual (pigHome, undefined, "PIG_HOME environment variable does not seem to be set. It must point to your installation of Apache Pig.");
var scriptDirectory = "./";
var suiteName = "PigTest";

var fs = require('fs');
var path = require('path');
var java = require('java');

var pigJar = path.resolve(pigHome, 'pig.jar');
var pigunitJar = path.resolve(pigHome, 'pigunit.jar');

java.classpath.push(pigJar);
java.classpath.push(pigunitJar);

// setup arguments for PigTest
/* XXX: these intermediate variables are nice for debugging, but they can go away when validation is implemented */
var pigScript = "{{script}}";
var argsArray = [{{#strArray args}}{{/strArray}}];
var inputAlias = "{{inputAlias}}";
var inputArray = [{{#strArray input}}{{/strArray}}];
var outputAlias = "{{outputAlias}}";
var outputArray = [{{#strArray output}}{{/strArray}}];
var testName = "{{testDesc}}";
var timeoutOption = {{options.timeout}};

// convert args to Java arrays
var pigArgs = java.newArray("java.lang.String", argsArray);
var input = java.newArray("java.lang.String", inputArray);
var output = java.newArray("java.lang.String", outputArray);
var pigScript = path.resolve (scriptDirectory, pigScript);

// run test suite
describe(suiteName, function() {
    this.timeout(timeoutOption);

    // run test
    it(testName, function(done) {

        // verify that pig script exists
        fs.exists(pigScript, function(exists) {
            assert.strictEqual (exists, true, "couldn't find pig script");

            // create a new pig test object
            java.newInstance('org.apache.pig.pigunit.PigTest', pigScript, pigArgs, function(err, pigtest) {

                // make sure the object was created okay
                console.log (err);
                assert.strictEqual (err, undefined, "could not create PigTest object");
                assert.notStrictEqual (pigtest, null, "created PigTest object was null");

                // run the pig test
                pigtest.assertOutput(inputAlias, input, outputAlias, output, function(err, blah) {
                    assert.strictEqual (err, undefined, "PigTest assertOutput failed: actual output didn't match expected output");
                    done();
                });
            });
            /* TODO: catch Java exceptions? */
        });
    });
});
