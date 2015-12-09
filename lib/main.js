'use strict';

var sources = require('./sources'),
  format = require('./format'),
  runScript = require('./runScript'),
  async = require('async'),
  Path = require('path'),
  sources = require('./sources'),
  shell = require('./runScript'),
  main = exports = module.exports = {},
  spawn = require('child_process').spawn,
  file = require('./file'),
  scriptPath = __dirname + '/../scripts/mongo/';

main.getCsv = getCsv;
main.install = install;
main.runDebug = runDebug;

function getCsv(options, done) {
  sources.verbose = options.verbose;
  if (options.verbose) console.log('download files in ', 'ctbook_files_xls/');
  sources.get('ctbook_files_xls/', function(err, data) {
    if (err) return done(err);
    if (!options.spawn) {
      if (options.verbose){
        console.log('format to csv');
      }
      format.xls2csv_r(data, done);
    } else {
      done && done();
    }

  });
}

function runCsv(options, done) {
  if (options.run) {
    if (options.verbose) console.log('use files from ', options.csv);
    file.getAllAndFormat('csv', options.csv, 'csvs', function(err, files){
      if (err) return console.log(err);

      runMongo(options, files, done);
    });
  } else {
    reparseOptions(options, function(){
      //delete options.csv;
      //options.onlyProcess = true;
      done && done();
      //reparseOptions(options, done);
    });
  }
}

function runXlsx(options, done) {
  if (options.run) {
    if (options.verbose) console.log('xlsx files from ', options.xlsx);
    file.getAllAndFormatPath('xlsx', options.xlsx, 'docs', function(err, files){
      if (err) return console.log(err);
      var data = sources.merge(files);
      format.xls2csv_r(data, function(err, files) {
        if (err) return console.log(err);
        if (options.verbose) console.log('success parse to csv');
        //reparseOptions(options, done)
        //console.log('sec pr', options);
        if (!options.spawn) {
          runMongo(options, files, done);
        } else {
          done && done();
        }
      });
    });
  } else {

    //console.log('one pr', options);
    options.run = true;
    reparseOptions(options, function() {
      delete options.xlsx;
      options.csv = 'csv';
      reparseOptions(options, done);
      //done();
    });
  }
}

function runOnlyProcess(options, done) {
  if (options.verbose) console.log('run mongo scripts... ');
  shell.options = options;
  if (options.run) {
    shell.processData(options.db, function(err){
      if (done) return done();
      console.log('success');
    });
  } else {
    options.run = true;
    reparseOptions(options, function(){
      if (done) return done();
    });
  }

}

function runAll(options, done) {
  if (options.run) {
    main.getCsv(options, function(err, files) {
      if (err) return console.log(err);
      if (options.verbose) console.log('download success');
      if (!options.spawn) {
        runMongo(options, files, done);
      } else {
        done && done();
      }
    });
  } else {
    reparseOptions(options, function(){
      delete options.run;
      options.xlsx = 'ctbook_files_xls';
      reparseOptions(options, function () {
        delete options.run;
        done && done();
      });
    });
  }
}

function install(options, done) {
  options.run = options.spawn ? options.run : true;
  if (options.csv) {
    runCsv(options, done);
  } else if (options.xlsx) {
    runXlsx(options, done);
  } else if (options.onlyProcess) {
    runOnlyProcess(options, done);
  } else {
    runAll(options, done)
  }

}

function runDebug(options) {
  shell.options = options;
  var res = shell.mongoScript(options.db, 'auth.js');
  if (res.code == 0)
    return console.log('auth success');
  console.log('auth error:', res.output);
}

function runMongo(options, files, done){
  if (options.db && !options.noMongo) {
    if (options.verbose) console.log('mongo scripts');
    shell.runScriptsMongo(files, options, function(err) {
      if (err)  throw err;
      if (done) return done();
      console.log('success');
    });
  } else {
    done && done();
  }

}

var valids = ['db', 'user', 'verbose', 'password', 'authdb', 'xlsx', 'csv', 'mongo', 'onlyProcess', 'run', 'spawn', 'verbose'],
    rewrite = ['-d', '-u', '-v', '-p', '--authdb', '--xlsx', '--csv', '--no-mongo', '--only-process', '--run', '--spawn', '--verbose'];

function reparseOptions (options, done) {
  var op = ['install'];
  Object.keys(options).sort().forEach(function(d) {
    var index = valids.indexOf(d),
        val = options[d];
    if (index != -1) {
      if (d == 'mongo') {
        if (val == false) op.push('--no-mongo');
        return;
      }

      op.push(rewrite[index]);
      if ([true, false, undefined].indexOf(val) == -1 ) op.push(val);
    }
  });

  //console.log('repareseop', op);
  var next = spawn(__dirname + '/../bin/ctgen.js', op);

  next.stdout.on('data', function (data) {
    console.log('spawn: ' + data);
  });

  next.stderr.on('data', function (data) {
    console.log('spawn:' + data);
  });

  next.on('close', function (data) {
    done && done();

  });
}

function runInstall(options, done) {
  if (options.csv) {
    if (options.verbose) console.log('use files from ', options.csv);
    file.getAllAndFormat('csv', options.csv, 'csvs', function(err, files){
      if (err) return console.log(err);
      //var data = sources.merge(files);
      runMongo(options, files, done);

    });
  } else if (options.xlsx) {
    if (options.verbose) console.log('xlsx files from ', options.xlsx);
    file.getAllAndFormatPath('xlsx', options.xlsx, 'docs', function(err, files){
      if (err) return console.log(err);
      var data = sources.merge(files);
      format.xls2csv_r(data, function(err, files) {
        if (err) return console.log(err);
        if (options.verbose) console.log('success parse to csv');
        //reparseOptions(options, done)
        runMongo(options, files, done);
      });
    });

  } else if (options.onlyProcess) {
    if (options.verbose) console.log('run mongo scripts... ');
    shell.options = options;
    shell.processData(options.db, function(err){
      console.log('success');
    });

  } else {
    if (options.verbose) console.log('download files');
    main.getCsv(options, function(err, files) {
      if (err) return console.log(err);
      if (options.verbose) console.log('download success');
      runMongo(options, files);
    });
  }

}
