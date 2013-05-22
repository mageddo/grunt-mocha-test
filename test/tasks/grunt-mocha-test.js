/*jshint loopfunc: true */

var expect = require('chai').expect;
var exec = require('child_process').exec;

var mergeCoverageData = function(data) {
  // we have to reconstruct the the _$jscoverage data
  // format as it cannot be stringified to JSON with
  // the additional source property added to arrays
  var jscoverage = global._$jscoverage;
  var sourceArrays = data.sourceArrays;
  var callCounts = data.callCounts;
  if (jscoverage) {
    for (var filename in sourceArrays) {
      var dest = jscoverage[filename];
      var src = callCounts[filename];
      src.source = sourceArrays[filename];
      if (typeof dest === 'undefined') {
        jscoverage[filename] = src;
      } else {
        src.forEach(function(count, index) {
          if (count !== null) {
            dest[index] += count;
          }
        });
      }
    }
  }
};

var execScenario = function(scenario, callback) {
  var child = exec('node ../grunt.js', {cwd: __dirname + '/../scenarios/' + scenario}, function(error, stdout, stderr) {
    // collect coverage data from stdout if it exists
    // this is because the coverage tool does not
    // really work with child processes so we are
    // giving it a helping hand
    var jscoverage = stdout.match(/##jscoverage##(.+)/);
    if (jscoverage) {
      mergeCoverageData(JSON.parse(jscoverage[1]));
    }
    callback(error, stdout, stderr);
  });
};

describe('grunt-mocha-test', function() {
  it('should run tests from the supplied files', function(done) {
    execScenario('tests', function(error, stdout, stderr) {
      expect(stdout).to.match(/test1/);
      expect(stdout).to.match(/test2/);
      expect(stdout).to.match(/2 tests complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should report the number of test failures and exit grunt with an error on failed tests', function(done) {
    execScenario('testFailure', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.match(/1 of 1 test failed/);
      done();
    });
  });

  it('should cleanly catch asynchronous test failures so that grunt does not exit early', function(done) {
    execScenario('asyncTestFailure', function(error, stdout, stderr) {
      expect(stdout).to.match(/Asynchronous test/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.match(/1 of 1 test failed/);
      done();
    });
  });

  it('should cleanly catch and log require exceptions thrown synchronously by Mocha so that grunt does not exit early', function(done) {
    execScenario('requireFailure', function(error, stdout, stderr) {
      expect(stdout).to.match(/Cannot find module 'doesNotExist/);
      expect(stdout).to.match(/test.js/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should cleanly catch and log require exceptions thrown asynchronously by Mocha so that grunt does not exit early', function(done) {
    execScenario('asyncRequireFailure', function(error, stdout, stderr) {
      expect(stdout).to.match(/Cannot find module 'doesNotExist/);
      expect(stdout).to.match(/test.js/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the require option', function(done) {
    execScenario('requireOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/1 test complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the grep option', function(done) {
    execScenario('grepOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/tests that match grep/);
      expect(stdout).to.match(/1 test complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the invert option', function(done) {
    execScenario('invertOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/tests that don't match grep/);
      expect(stdout).to.match(/1 test complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the ignoreLeaks option', function(done) {
    execScenario('ignoreLeaksOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.match(/1 of 1 test failed/);
      expect(stderr).to.match(/Error: global leak detected: leak/);
      done();
    });
  });

  it('should support the globals option', function(done) {
    execScenario('globalsOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/1 test complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the asyncOnly option', function(done) {
    execScenario('asyncOnlyOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.match(/1 of 1 test failed/);
      expect(stderr).to.match(/Error: --async-only option in use without declaring/);
      done();
    });
  });

  it('should support the reporter option', function(done) {
    execScenario('reporterOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/<section class="suite">/);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the ui option', function(done) {
    execScenario('uiOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test1/);
      expect(stdout).to.match(/test2/);
      expect(stdout).to.match(/2 tests complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support the timeout option', function(done) {
    execScenario('timeoutOption', function(error, stdout, stderr) {
      expect(stdout).to.match(/test/);
      expect(stdout).to.match(/Aborted due to warnings./);
      expect(stderr).to.match(/1 of 1 test failed/);
      expect(stderr).to.match(/Error: timeout of 500ms exceeded/);
      done();
    });
  });

  it('should support the growl option', function(done) {
    execScenario('growlOption', function(error, stdout, stderr) { 
      // TODO: Let's just test that everything completed successfully
      // as there's no way of knowing if growl was actually called for now.
      // A possible option would be to mock the growl binaries in the 
      // growlOption scenario directory and have them do something that
      // the test can detect (HTTP server/request?). This would have to
      // be done for each platform though.
      expect(stdout).to.match(/test1/);
      expect(stdout).to.match(/test2/);
      expect(stdout).to.match(/2 tests complete/);
      expect(stdout).to.match(/Done, without errors./);
      expect(stderr).to.equal('');
      done();
    });
  });

  it('should support a destination file to write output');
});