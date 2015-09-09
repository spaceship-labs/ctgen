#! /usr/bin/env node

var ctgen = require('../lib/main'),
  program = require('commander'),
  package = require('../package');

program
  .version(package.version)

program.command('install')
  .alias('i')
  .description('download and generate database')
  .option('-d, --db [database]', 'database name')
  .option('--v, --verbose', 'verbose')
  .action(function(options){
    program.runOnce = true;
    if(!options.db)
      options.help && options.help() || program.help();

    ctgen.verbose = options.verbose;

    if(ctgen.verbose)
      console.log("use db", options.db);

    ctgen.getCsv(function(err, files){
      if(err) return console.log(err);
      if(ctgen.verbose)
        console.log('mongo scripts');
      ctgen.runScriptsMongo(files, options.db, function(err){
        if(err) return console.log(err);
        console.log('success');
      });
    });
  });

program
  .parse(process.argv)


if(!program.runOnce){
  program.help();
}
