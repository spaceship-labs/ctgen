var should = require('should'),
    mockery = require('mockery');

describe('format', function(){
  var data,
    stubs = {},
    format;
  before(function(){

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    var pyspreadsheet = {
      SpreadsheetReader:{
        read: function(file, done){
          done(null, {
            sheets: [{
              name: 'hoja1',
              rows: [
                [{address:'a0', value: null},
                {address:'b0', value: null },
                {address:'c0', value: null },
                {address:'d0', value: null }],
                [{address: 'a1', value: 'nameField1'},
                {address: 'b1', value: 'nameField2'},
                {address: 'c1', value: 'nameField3'}],
                [{address: 'a2', value: 'field1'},
                {address: 'b2', value: 'field2'},
                {address: 'c2', value: 'field3'}],
                [{address: 'a3'},
                {address: 'b3',value: 'field2.1'},
                {address: 'c3',value: 'field3.1'}],
                [{address: 'a4',},
                {address: 'b4',},
                {address: 'c4',value: 'field3.2'}]
              ]
            }]
          });
        }
      }
    };

    mockery.registerMock('pyspreadsheet', pyspreadsheet);

    format = require('../lib/format');
  });

  describe('xlsx2csv', function(){
    it('should format csv', function(done){
      var expectCsv = '"nameField1","nameField2","nameField3"\n' +
                    '"field1","field2","field3"\n'+
                    ',"field2.1","field3.1"\n' +
                    ',,"field3.2"\n';

      format.xls2csv('testfile.xls', function(err, csv){
        csv.should.be.equal(expectCsv);
        done();
      });
    });
  });
});
