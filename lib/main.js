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

function getCsv(done) {
  sources.verbose = !!main.verbose;
  sources.format = sources.verbose;
  if (main.verbose) console.log('download files in ', 'ctbook_files_xls/');
  sources.get('ctbook_files_xls/', function(err, data) {
    if (err) return done(err);
    if (main.verbose){
      console.log('format to csv');
    }
    format.xls2csv_r(data, done);
  });
}

function install(options, done) {
  if (options.csv) {
    if (options.verbose) console.log('use files from ', options.csv);
    file.getAllAndFormat('csv', options.csv, 'csvs', function(err, files){
      if(err) return console.log(err);
      //var data = sources.merge(files);
      runMongo(options, files, done);

    });
  } else if (options.xlsx) {
    if (options.verbose) console.log('xlsx files from ', options.xlsx);
    file.getAllAndFormatPath('xlsx', options.xlsx, 'docs', function(err, files){
      if(err) return console.log(err);
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
    main.getCsv(function(err, files) {
      if (err) return console.log(err);
      if (options.verbose) console.log('download success');
      runMongo(options, files);
    });
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
      if(done) return done();
      console.log('success');
    });
  } else {
    done && done();
  }

}

var valids = ['db', 'user', 'verbose', 'password', 'authdb', 'xlsx', 'csv', 'mongo', 'onlyProcess'],
    rewrite = ['-d', '-u', '-v', '-p', '--authdb', '--xlsx', '--csv', '--no-mongo', '--only-process'];

function reparseOptions (options, done) {
  var op = ['install'];
  Object.keys(options).sort().forEach(function(d){
    var index = valids.indexOf(d);
    if (index != -1) {
      op.push(rewrite[index]);
      var val = options[d];
      op.push(val);
    }
  });
  console.log('op', op);
  var next = spawn(__dirname + '/../bin/ctgen.js', op);

  next.on('close', function (data) {
    done();
  });
}
