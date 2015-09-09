'use strict';

var sources = require('./sources'),
  format = require('./format'),
  async = require('async'),
  fs = require('fs'),
  shell = require('shelljs'),
  main = exports = module.exports = {};

main.getCsv = function(done){
  sources.verbose = !!main.verbose;
  sources.format = sources.verbose;
  sources.get('ctbook_files_xls/', function(err, data){
    if(err) return done(err);
    if(main.verbose)
      console.log('process csvs');
    format.xls2csv_r(data, done);
  });
};



var runScript = {},
  scriptPath = __dirname + '/../scripts/mongo/';

runScript.mongoScript = function(db, script){
  if(main.verbose)
    console.log('mongo ' + db + ' ' + scriptPath + script);
  return shell.exec('mongo ' + db + ' ' + scriptPath + script);
};

runScript.contractCnetucAfter = function(db, done){
  /*
  mongo pgp "$repo_path/deploy/database/00.rename.js" in format.
  mongo pgp "$repo_path/deploy/database/01.cnetuc.js"
  */
  var res = runScript.mongoScript(db, '01.cnetuc.js');
  if(res.code != 0)
    return done(new Error(res.output));
  done();
};

runScript.contractCnet3After = function(db, done){
  /*
    mongo pgp "$repo_path/deploy/database/02.cnet3.js"
  */
  var res = runScript.mongoScript(db, '02.cnet3.js');
  if(res.code != 0)
    return done(new Error(res.output));
  done();
};

runScript.processData = function(db, done){
  /*
    mongo pgp "$repo_path/deploy/database/04.index.js"
    mongo pgp "$repo_path/deploy/database/05.empresas.js"
    mongo pgp "$repo_path/deploy/database/06.00.dependencias.js"
    mongo pgp "$repo_path/deploy/database/06.01.index.js"
    mongo pgp "$repo_path/deploy/database/07.link_uc.js"
    mongo pgp "$repo_path/deploy/database/08.extract_duplicated.js"
  */
  var scripts = ['04.index.js','05.empresas.js', '06.00.dependencias.js', '06.01.index.js', '07.link_uc.js', '08.extract_duplicated.js']

  async.eachSeries(scripts, function(script, next){
    var res = runScript.mongoScript(db, script);
    if(res.code != 0)
      return next(new Error(res.output));
    next();
  }, done);

};

runScript.importScv = function(files, db, collection, done){
  /*
  mongoimport -d pgp -c contrato --file "$dataset_path/cnet/cnetuc/Contratos2010_2012_150428084608.csv" --type csv --headerline
  */
  async.eachSeries(files, function(file, next){
    console.log('mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --type csv --headerline');
    var res = shell.exec('mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --type csv --headerline');
    console.log(res.output);
    if(res.code == 0)
      return next();
    next(new Error(res.output));
  }, done);
};

main.runScriptsMongo = function(datas, db, done){
  if(!shell.which('mongo'))
    return done(new Error("Mongodb is required"));
  console.log(shell.mongo);
  async.eachSeries(datas, function(data, next){
    if(data.name == 'contrataciones'){
      console.log('contractaciones');
      runScript.importScv(data.csvs, db, 'contrato', function(err){
        if(err) return done(err);
        runScript.contractCnetucAfter(db, next)
      });
    }else if(data.name == 'cnet3'){
      runScript.importScv(data.csvs, db, 'contrato', function(err){
        if(err) return done(err);
        runScript.contractCnet3After(db, next)

      });
    }else if(data.name == 'uc'){
      runScript.importScv(data.csvs, db, 'uc', next);
    }else{
      next(new Error('no found type'));
    }
  }, function(err){
    if(err) return done(err);
    runScript.processData(db, done);
  });
};
