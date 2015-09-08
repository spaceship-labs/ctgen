'use strict';

var xls = require('pyspreadsheet').SpreadsheetReader,
  format = exports = module.exports = {};

format.xls2csv = function(file, done){
  var res = '',
    header = false;
  xls.read(file, function(err, book){
    var sheet = book.sheets[0]; //only one page
    sheet.rows.forEach(function(row, i){
      if(!row[0].value && !row[1].value && !header)
        return;
      header = true;
      var rows = [];
      row.forEach(function(cell){
        var val = cell.value? '"'+cell.value+'"' : null;
        rows.push(val);
      });
       res += rows.toString() + '\n';
    });

    done(null, res);
  });
};
