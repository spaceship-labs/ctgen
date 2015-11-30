'use strict';

var sources = require('./sources'),
  format = require('./format'),
  runScript = require('./runScript'),
  async = require('async'),
  fs = require('fs'),
  shell = require('shelljs'),
  main = exports = module.exports = {},
  scriptPath = __dirname + '/../scripts/mongo/';

main.getCsv = getCsv;
main.install = install;
main.runDebug = runDebug;
main.runScriptsMongo = runScriptsMongo;

function getCsv(done) {
  sources.verbose = !!main.verbose;
  sources.format = sources.verbose;
  sources.get('ctbook_files_xls/', function(err, data) {
    if (err) return done(err);
    if (main.verbose){
      console.log('format to csv');
    }
    format.xls2csv_r(data, done);
  });
}

function install() {
  //var functions = [
  main.getCsv(function(err, files) {
    if (err) return console.log(err);
    if(!main.noMongo){
      main.runScriptsMongo(files, options.db, function(err) {
        if (err) return console.log(err);
        console.log('success');
      });
    }
  });
}

function runDebug(db) {
  var res = runScript.mongoScript(db, 'auth.js');
  console.log(res);
}

function runScriptsMongo(datas, db, done) {
  if (!shell.which('mongo'))
    return done(new Error("Mongodb is required"));
  async.eachSeries(datas, function(data, next) {
    if (data.name == 'contrataciones') {
      console.log('contractaciones');
      runScript.importCsv(data.csvs, db, 'contrato', function(err) {
        if (err) return done(err);
        runScript.contractCnetucAfter(db, next)
      });
    } else if (data.name == 'cnet3') {
      runScript.importCsv(data.csvs, db, 'contrato', function(err) {
        if (err) return done(err);
        runScript.contractCnet3After(db, next)

      });
    } else if (data.name == 'uc') {
      runScript.importCsv(data.csvs, db, 'uc', next);
    } else {
      next(new Error('no found type'));
    }
  }, function(err) {
    if (err) return done(err);
    runScript.processData(db, done);
  });
}
