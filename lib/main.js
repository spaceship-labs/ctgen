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
  //var functions = [
  if (options.csv) {
    if (main.verbose) console.log('use files from ', options.csv);

    file.getAllAndFormat('csv', options.csv, 'csvs', function(err, files){
      if(err) return console.log(err);
      runMongo(options, files);

    });
  } else {
    return console.log('download files');
    main.getCsv(function(err, files) {
      if (err) return console.log(err);
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
  if (options.db) {
    shell.runScriptsMongo(files, options, function(err) {
      if (err)  throw err;
      console.log('success');
    });
  } else {
    console.log('download sucess');
  }

}


