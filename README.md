PigUnit
=======

Node.js based unit testing for Pig scripts (and an easy way to try out Hadoop).

## Overview
This module uses node.js and Mocha as a unit testing framework for [Pig](http://pig.apache.org/). Pig unit tests are defined as .pu files that describe the input strings and expected output strings for a specific pig script. Since Pig is both a simple language for programming Hadoop and it (typically) has a built-in Hadoop cluster, this is potentially an easy way to get up and running in learning Hadoop.

## Installation

First install this module:
`npm install -g --user 0 pigunit`

You must also have Pig and PigUnit installed. I would recommend downloading the source and compiling it yourself. You can find your [local Apache mirror for Pig here](http://www.apache.org/dyn/closer.cgi/pig). This has been tested against Pig 0.12.0, but the API for PigUnit is so simple that I don't expect there to be any version dependencies. After you download, untar and change to the source directory build both Pig and PigUnit:
`ant && ant pigunit-jar`

(As a side note, you can also download pig.jar and pigunit.jar from the [Pig Maven Repository](http://mvnrepository.com/artifact/org.apache.pig); however, I personally had problems with missing dependencies, such as log4j.)

Now make sure that your JAVA_HOME environment variable points towards your Java installation and your PIG_HOME environment variable points toward the directory containing pig.jar and pigunit.jar.

## Running

The commandline for pigunit is fairly simple. 

The `-t` or `--testdir` option can be used to specify where the .pu files are held. All the .pu files in the testdir will be loaded and run. If this option isn't specified, the "./test" directory is assumed.

The `-s` or `--scriptdir` option can be used to point to where the Pig scripts live. If this option isn't specified, the current directory is assumed.

Finally, the `-R` or `--reporter` option can be used to specify the Mocha reporter. If this option isn't specified, the "list" reporter is used (note that this is different than Mocha, which defaults to the "dot" reporter).

## PigUnit Files
A PigUnit file is a JSON file that describes the parameters for the unit test. A sample PigUnit (.pu) file is included in the test directory of the pigunit module. It mirrors the format of the Java program describe in the [PigUnit Homepage](http://pig.apache.org/docs/r0.8.1/pigunit.html).

Here's an example of PigUnit file:

    {
        "testDesc": "ensure that only the two highest frequencies are reported",
        "script": "top_queries.pig",
        "args": ["n=2"],
        "inputAlias": "data",
        "input": [
            "yahoo",
            "yahoo",
            "yahoo",
            "twitter",
            "facebook",
            "facebook",
            "linkedin"
        ],
        "outputAlias": "queries_limit",
        "output": [
            "(yahoo,3)",
            "(facebook,2)"
        ],
        "options": {
            "timeout": 60000
        }
    }

The properties in the PigUnit file are:

* *testDesc* : An arbitrary string that you think describes the test best. When the test passes or fails, this string will show up next to it.
* *script* : The Pig script that is being tested. May include a relative path from the scriptdir specified on the commandline.
* *args* : An array of arguments to pass the Pig script.
* *inputAlias* : The Pig variable in the `script` that is used for input.
* *input* : The strings to assign to the variable specified by `inputAlias`.
* *outputAlias* : The Pig variable in the `script` that is used for output.
* *output* : The strings that are expected to be in the `outputAlias` variable upon the completion of the test.
* *options.timeout* : The time expected for the test to complete, in milliseconds. Even the simplest of tests seems to take ~30 seconds, so make sure that this is 30000 or higher. The Mocha default is 2 seconds, after which the test will fail.

Note that PigUnit files aren't currently validated, so any errors are going to probably trigger an exception somewhere.

## Wishlist
* Validate PigUnit files to ensure that they are syntactically correct.
* Pass through Mocha options using the mocha.opts file. While this would give some great flexibility, it is currently hard because the Mocha module uses the _mocha program to parse the commandline and setup lots of options. Recreating this would be a hack.
* Redirect output from node-java or PigUnits log4j into a per-test log file. Great for debugging if something goes wrong, and cleans up the output for clearer Mocha reporting.