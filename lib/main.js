'use strict';

var sources = require('./sources'),
  format = require('./format'),
  async = require('async'),
  fs = require('fs'),
  shell = require('shelljs'),
  main = exports = module.exports = {};

main.getCsv = function(done){
  sources.get('ctbook_files_xls/', function(err, data){
    console.log('down', data);
    if(err) return done(err);
    format.xls2csv_r(data, done);
  });
};



var runScript = {},
  scriptPath = __dirname + '/../scripts/mongo/';

runScript.contractCnetucAfter = function(db, done){
  /*
  mongo pgp "$repo_path/deploy/database/00.rename.js" in format.
  mongo pgp "$repo_path/deploy/database/01.cnetuc.js"
  */
  var res = shell.exec('mongo ' + db + ' ' + scriptPath + '01.cnetuc.js');
  if(res.code != 0)
    return done(new Error(res.output));
  done();
};

runScript.contract = function(files, db, done){
  /*
  mongoimport -d pgp -c contrato --file "$dataset_path/cnet/cnetuc/Contratos2010_2012_150428084608.csv" --type csv --headerline
  */
  async.eachSeries(files, function(file, next){
    var res = shell.exec('mongoimport -d'+ db +'-c contrato --file ' + '"'+ file  +'" --type csv --headerline');
    console.log(res);
    if(res.code == 0)
      return next();
    next(new Error(res.output));
  }, done);
};

main.runScriptsMongo = function(datas, db, done){
  if(!shell.which('mongo'))
    return done(new Error("Mongodb is required"));
  console.log(shell.mongo);
  return;
  async.eachSeries(datas, function(data, next){
    if(data.name == 'contrataciones'){
      console.log('contractaciones');
      runScript.contract(data.csvs, db, function(err){
        if(err) return done(err);
        runScriptsMongo.contractCnetucAfter(db, next)
      });
    }else if(data.name == 'cnet3'){
      runScript.contract(data.csvs, db, next);
    }else{
      next(new Error('no found type'));
    }
  }, function(err){
    if(err) return done(err);
    console.log('linea 35...');
  });
};

//main.runScriptsMongo([], 'testdbpgp' , console.log);
