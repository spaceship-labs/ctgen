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
  .option('-u, --user [user]', 'user')
  .option('-p, --password [pwd]', 'password')
  .action(function(options){
    program.runOnce = true;
    if(!options.db)
      options.help && options.help() || program.help();

    ctgen.verbose = options.verbose;

    if(ctgen.verbose)
      console.log("use db", options.db);

    if(options.user && options.password){
      ctgen.authString = '-u ' + options.user + ' -p "' + options.password + '" --authenticationDatabase ' + options.db;
    }else{
      ctgen.authString = '';
    }

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

program.
  command('debug')
  .description('debug auth')
  .option('-u, --user [user]', 'user')
  .option('-p, --password [pwd]', 'password')
  .option('-d, --db [database]', 'database name')
  .action(function(options){
    program.runOnce = true;
    ctgen.verbose = true;
    console.log(options.user, options.password);
    if(options.user && options.password){
      ctgen.authString = '-u ' + options.user + ' -p "' + options.password + '" --authenticationDatabase ' + options.db;
    }else{
      ctgen.authString = '';
    }
    ctgen.runDebug(options.db);
  });

program
  .parse(process.argv)


if(!program.runOnce){
  program.help();
}
