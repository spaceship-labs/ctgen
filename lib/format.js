'use strict';

var xls = require('pyspreadsheet').SpreadsheetReader,
  fs = require('fs-extra'),
  async = require('async'),
  moment = require('moment'),
  file = require('./file'),
  format = exports = module.exports = {};

var replaceEs1 = /"/g,
  replaceEs2 = /(\r\n|\n|\r)/gm;

format.xls2csv = function(file, opts, done) {
  if (!done) {
    done = opts;
  }
  var res = '',
    header = false;

  var dest;
  if (opts.fileName) {
    dest = fs.createOutputStream(opts.fileName);
  }
  if (format.verbose)
    console.log('xls2csv ', file);
  xls.read(file, function(err, book) {
    if (err) return done(err);
    var sheet = book.sheets[0]; //only one page
    sheet.rows.forEach(function(row, i) {
      if (!row[0].value && !row[1].value && !header)
        return;

      var rows = [];
      if (!header && opts.headCsv && opts.headCsv.length) {
        rows = opts.headCsv;
        header = true;
      } else {
        header = true;
        row.forEach(function(cell) {
          var val = cell.value; //cell.value? '"'+cell.value+'"' : null;
          if (val && val.replace) {
            val = val.replace(replaceEs1, '\'');
            val = val.replace(replaceEs2, "");;
            val = '"' + val + '"';
          } else if (val && val.getYear) {
            val = moment(val).format('DD/MM/YYYY');
          }
          rows.push(val);
        });
      }

      var string = rows.toString() + '\n';
      if (dest)
        dest.write(string);

      res += string;
    });
    if (dest) {
      dest.on('finish', function() {
        if (format.verbose)
          console.log('finish xls2csv ', file);
        done(null, res);
      });

      dest.end();
    } else {
      done(null, res);
    }
  });
};

format.xls2csv_stream = function(file, opts, done) {
  if (!done) {
    done = opts;
  }
  var header = false;

  var dest;
  if (opts.fileName) {
    dest = fs.createOutputStream(opts.fileName);
  }
  if (format.verbose)
    console.log('xls2csv ', file);

  var reader = new xls(file);
  reader.on('open', function(book) {

  }).on('data', function(data) {
    if (data.sheet.index == 0) { //only one sheet
      data.rows.forEach(function(row, i) {
        if (!row[0].value && !row[1].value && !header)
          return;

        var rows = [];
        if (!header && opts.headCsv && opts.headCsv.length) {
          rows = opts.headCsv;
          header = true;
        } else {
          header = true;
          row.forEach(function(cell) {
            var val = cell.value; //cell.value? '"'+cell.value+'"' : null;
            if (val && val.replace) {
              val = val.replace(replaceEs1, '\'');
              val = val.replace(replaceEs2, "");;
              val = '"' + val + '"';
            } else if (val && val.getYear) {
              val = moment(val).format('DD/MM/YYYY');
            }
            rows.push(val);
          });
        }

        var string = rows.toString() + '\n';
        if (dest)
          dest.write(string);
      });

    }

  }).on('close', function() {
    if (format.verbose)
      console.log('success', file);
    if (dest)
      dest.end();
    done();
  }).on('error', done);
};



var pwd = process.cwd();
format.getFiles = function(paths, done) {
  file.get(pwd, paths, done);
};

var onlyFileName = /(\w+).\w+$/i;
format.getName = function(name) {
  return name.match(onlyFileName)[1] || name;
};


format.xls2csv_r = function(sourceDatas, done) {
  // necesito las rutas completas al csv
  // separado por carpeta padre name
  var rootPath = process.cwd();
  async.concatSeries(sourceDatas, function(src, next) {
    format.getFiles(src.docs, function(err, files) {
      if (err) return next(err);
      var info = {
        name: src.name,
      };
      async.concatSeries(files, function(file, nextFile) {
        var name = 'csv/' + src.name + '/' + format.getName(file) + '.csv',
          opts = {
            fileName: name
          };

        if (src.headCsv) {
          opts.headCsv = src.headCsv;
        }
        format.xls2csv_stream(file, opts, function(err, csv) {
          if (err) return nextFile(err);
          nextFile(null, [rootPath + '/' + opts.fileName]);
          /*
          fs.outputFile(name, csv, function(err){
            if(err) return nextFile(err);
            console.log('finish file', name);
            nextFile(null, [rootPath + '/' + name]);
          });
          */
        });
      }, function(err, csvs) {
        if (err) return next(err);
        if (format.verbose)
          console.log('finish path', info.name);
        info.csvs = csvs;
        next(null, [info]);
      });
    });

  }, done);
};

/*/
var head = '"dependencia","nombre_de_la_uc","claveuc","numero_procedimiento","tipo_procedimiento","tipo_contratacion","caracter","codigo_contrato","titulo_contrato","fecha_inicio","importe_contrato","proveedor_contratista","anuncio"';
format.xls2csv_stream('download/cnet3/upcpfuncionpublicagobmxUCcontratos_cnet3LP2002.xlsx',{fileName: 'csvstream/test.csv', headCsv: head}, console.log)

format.xls2csv('download/cnet3/upcpfuncionpublicagobmxUCcontratos_cnet3LP2002.xlsx',{fileName: 'csvstream/testnoStream.csv', headCsv: head}, console.log)
*/
