'use strict';

var ctgen = require('./main'),
  async = require('async'),
  shell = require('shelljs'),
  runScript = module.exports = {},
  scriptPath = __dirname + '/../scripts/mongo/';

runScript.contractCnetucAfter = contractCnetucAfter;
runScript.contractCnet3After = contractCnet3After;
runScript.importCsv = importCsv;
runScript.importCsvUpsert = importCsvUpsert;
runScript.mongoScript = mongoScript;
runScript.processData = processData;
runScript.processDataUpdate = processDataUpdate;
runScript.runScriptsMongo = runScriptsMongo;
runScript.runUpdateScriptsMongo = runUpdateScriptsMongo;

function contractCnetucAfter(db, done){
  /*
  mongo pgp "$repo_path/deploy/database/00.rename.js" in format.
  mongo pgp "$repo_path/deploy/database/01.cnetuc.js"
  */
  var res = runScript.mongoScript(db, '01.cnetuc.js');
  if(res.code != 0)
    return done(new Error(res.output));
  done();
}

function contractCnet3After(db, done){
  /*
    mongo pgp "$repo_path/deploy/database/02.cnet3.js"
  */
  var res = runScript.mongoScript(db, '02.cnet3.js');
  if(res.code != 0)
    return done(new Error(res.output));
  done();
}

function importCsv(files, db, collection, done){
  /*
  mongoimport -d pgp -c contrato --file "$dataset_path/cnet/cnetuc/Contratos2010_2012_150428084608.csv" --type csv --headerline
  */
  async.eachSeries(files, function(file, next){
    var cmd = 'mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --type csv --headerline '+ runScript.options.authString;
    if(runScript.options.verbose)
      console.log(cmd);
    var res = shell.exec(cmd);
    if(runScript.options.verbose)
      console.log(res.output);
    if(res.code == 0)
      return next();
    next(new Error(res.output));
  }, done);
}

function mongoScript(db, script){
  console.log('mongo ' + db + ' ' + scriptPath + script + ' ' + runScript.options.authString);
  return shell.exec('mongo ' + db + ' ' + scriptPath + script + ' ' + runScript.options.authString);
}

function processData(db, done){
  /*
    mongo pgp "$repo_path/deploy/database/04.index.js"
    mongo pgp "$repo_path/deploy/database/05.empresas.js"
    mongo pgp "$repo_path/deploy/database/06.00.dependencias.js"
    mongo pgp "$repo_path/deploy/database/06.01.link.js"
    mongo pgp "$repo_path/deploy/database/06.02.index.js"
    mongo pgp "$repo_path/deploy/database/08.extract_duplicated.js"
  */
  var scripts = ['04.index.js','05.empresas.js', '05.01.fecha_inicio.js', '06.00.dependencias.js', '06.01.link.js', '06.02.index.js', '08.extract_duplicated.js']

  async.eachSeries(scripts, function(script, next){
    console.log('run script:', script);
    var res = runScript.mongoScript(db, script);
    if(res.code != 0)
      return next(new Error(res.output));
    next();
  }, done);
}

function runScriptsMongo(datas, options, done) {
  var db = options.db;
  runScript.options = options;
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
function runUpdateScriptsMongo(datas, options, done) {
  var db = options.db;
  runScript.options = options;
  if (!shell.which('mongo'))
    return done(new Error("Mongodb is required"));
  async.eachSeries(datas, function(data, next) {
    if (data.name == 'contrataciones') {
      console.log('contractaciones');
      runScript.importCsvUpsert(data.csvs, db, 'contrato', 'codigo_contrato', function(err) {
        if (err) return done(err);
        runScript.contractCnetucAfter(db, next);
      });
    } else if (data.name == 'uc') {
      runScript.importCsvUpsert(data.csvs, db, 'uc', 'CLAVE_UC', next);
    } else {
      next(null);
      //next(new Error('no found type'));
    }
  }, function(err) {
    if (err) return done(err);
    runScript.processDataUpdate(db, options, ['10.updateEmpresas.js','11.00.updateDependencias.js'], done);
  });
}
function processDataUpdate(db, options, scripts, done){
  runScript.options = options;
  async.eachSeries(scripts, function(script, next){
    console.log('run script:', script);
    var res = runScript.mongoScript(db, script);
    if(res.code != 0)
      return next(new Error(res.output));
    next();
  }, done);
}
function importCsvUpsert(files, db, collection, key, done){
  async.eachSeries(files, function(file, next){
    var cmd = 'mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --upsert --upsertFields '+key+' --type csv --headerline '+ runScript.options.authString;
    if(runScript.options.verbose)
      console.log(cmd);
    var res = shell.exec(cmd);
    if(runScript.options.verbose)
      console.log(res.output);
    if(res.code == 0)
      return next();
    next(new Error(res.output));
  }, done);
}