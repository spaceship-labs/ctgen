'use strict';

var ctgen = require('./main'),
  async = require('async'),
  shell = require('shelljs'),
  runScript = exports = module.exports = {},
  scriptPath = __dirname + '/../scripts/mongo/';

runScript.contractCnetucAfter = contractCnetucAfter;
runScript.contractCnet3After = contractCnet3After;
runScript.importCsv = importCsv;
runScript.mongoScript = mongoScript;
runScript.processData = processData;

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
    if(ctgen.verbose)
      console.log('mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --type csv --headerline '+ctgen.authString);
    var res = shell.exec('mongoimport -d '+ db +' -c ' + collection +' --file ' + '"'+ file  +'" --type csv --headerline '+ctgen.authString);
    if(ctgen.verbose)
      console.log(res.output);
    if(res.code == 0)
      return next();
    next(new Error(res.output));
  }, done);
}

function mongoScript(db, script){
  if(ctgen.verbose)
    console.log('mongo ' + db + ' ' + scriptPath + script + ' ' + ctgen.authString);
  return shell.exec('mongo ' + db + ' ' + scriptPath + script + ' ' + ctgen.authString);
}

function processData(db, done){
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
}

