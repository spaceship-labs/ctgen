'use strict';

var xls = require('pyspreadsheet').SpreadsheetReader,
  fs = require('fs-extra'),
  async = require('async'),
  moment = require('moment'),
  format = exports = module.exports = {};

var replaceEs1 = /"/g,
  replaceEs2 = /(\r\n|\n|\r)/gm;

format.xls2csv = function(file, opts, done){
  if(!done){
    done = opts;
  }
  var res = '',
    header = false;

  var dest;
  if(opts.fileName){
    dest = fs.createOutputStream(opts.fileName);
  }
  if(format.verbose)
    console.log('xls2csv ', file);
  xls.read(file, function(err, book){
    if(err) return done(err);
    var sheet = book.sheets[0]; //only one page
    sheet.rows.forEach(function(row, i){
      if(!row[0].value && !row[1].value && !header)
        return;

      var rows = [];
      if(!header && opts.headCsv && opts.headCsv.length){
        rows = opts.headCsv;
        header = true;
      }else{
        header = true;
        row.forEach(function(cell){
          var val = cell.value; //cell.value? '"'+cell.value+'"' : null;
          if(val && val.replace){
            val = val.replace(replaceEs1, '\'');
            val = val.replace(replaceEs2, "");;
            val = '"'+val+'"';
          }else if(val && val.getYear){
            val = moment(val).format('DD/MM/YYYY');
          }
          rows.push(val);
        });
      }

      var string = rows.toString() + '\n';
      if(dest)
        dest.write(string);

      res += string;
    });
    if(dest){
      dest.on('finish', function(){
        if(format.verbose)
          console.log('finish xls2csv ', file);
        done(null, res);
      });

      dest.end();
    }else{
      done(null, res);
    }
  });
};

var pwd = process.cwd();
format.getFiles = function(paths, done){
  async.concat(paths, function(path, next){
    fs.stat(path, function(err, stat){
      if(err) return next(err);
      if(stat.isDirectory()){
        var absPath = fs.realpathSync(path);
        fs.readdir(path, function(err, files){
          if(err) return next(err);
          var absFiles = [];
          files.forEach(function(file){
            absFiles.push(absPath + '/' + file);
          });
          next(null, absFiles);
        });
      }else if(stat.isFile()){
        next(null, [pwd + '/' + path]);
      }else{
        next(null, []);
      }
    });

  }, done);
};

var onlyFileName = /(\w+).\w+$/i;
format.getName = function(name){
  return name.match(onlyFileName)[1] || name;
};


format.xls2csv_r = function(sourceDatas, done){
  // necesito las rutas completas al csv
  // separado por carpeta padre name
  var rootPath = process.cwd();
  async.concatSeries(sourceDatas, function(src, next){
    format.getFiles(src.docs, function(err, files){
      if(err) return next(err);
      var info = {
        name: src.name,
      };
      async.concatSeries(files, function(file, nextFile){
        var name = 'csv/'+ src.name + '/' + format.getName(file) + '.csv',
         opts = {
            fileName: name
          };

        if(src.headCsv){
          opts.headCsv = src.headCsv;
        }
        format.xls2csv(file, opts, function(err, csv){
          if(err) return nextFile(err);
          nextFile(null, [rootPath + '/' + opts.fileName]);
          /*
          fs.outputFile(name, csv, function(err){
            if(err) return nextFile(err);
            console.log('finish file', name);
            nextFile(null, [rootPath + '/' + name]);
          });
          */
        });
      }, function(err, csvs){
        if(err) return next(err);
        if(format.verbose)
          console.log('finish path', info.name);
        info.csvs = csvs;
        next(null, [info]);
      });
    });

  }, done);
};
