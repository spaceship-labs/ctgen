'use strict';

var sources = require('./sources'),
  format = require('./format'),
  runScript = require('./runScript'),
  async = require('async'),
  Path = require('path'),
  fs = require('fs'),
  shell = require('./runScript'),
  main = exports = module.exports = {},
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

function install(options) {
  if (options.csv) {
    if (options.verbose) console.log('use files from ', options.csv);

    file.getAllAndFormat('csv', options.csv, 'csvs', function(err, files){
      if(err) return console.log(err);
      runMongo(options, files);

    });
  } else if (options.xlsx) {
    if (options.verbose) console.log('xlsx files from ', options.xlsx);
    file.getAllAndFormatPath('xlsx', options.xlsx, 'docs', function(err, data){
      if(err) return console.log(err);
      format.xls2csv_r(data, function(err, files) {
        if (options.verbose) console.log('success parse to csv');

        if (err) return console.log(err);
        runMongo(options, files);
      });
    });

  } else {
    if (options.verbose) console.log('download files');
    return;
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

function runMongo(options, files){
  if (options.db && !options.noMongo) {
    if (options.verbose) console.log('mongo scripts');
    shell.runScriptsMongo(files, options, function(err) {
      if (err)  throw err;
      console.log('success');
    });
  }
}


