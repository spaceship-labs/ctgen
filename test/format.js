var should = require('should'),
    mockery = require('mockery'),
    fs = require('fs-extra'),
    sinon = require('sinon');

describe('format', function(){
  var data,
    format,
    stubs = {},
    expectCsv;

  before(function(){

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    expectCsv = '"nameField1","nameField2","nameField3"\n' +
              '"field1","field2","field3"\n'+
              ',"field2.1","field3.1"\n' +
              ',,"field3.2 with comm\'"\n'+
              ',,"field4.2 a"\n';

    //testfile.xls
    var testfile = {
      sheet: {
        index: 0,
        name: 'hoja1',
        },
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
        {address: 'c4',value: 'field3.2 with comm"'}],
        [{address: 'a4',},
        {address: 'b4',},
        {address: 'c4',value: 'field4.2 \na'}]
      ]
    };

    var testfileNewFields = {
      sheet: {
        index: 0,
        name: 'hoja1',

        },
      //rows: testfile.sheet.rows
      rows: [
        [{address:'a0', value: null},
        {address:'b0', value: null },
        {address:'c0', value: null },
        {address:'d0', value: null }],
        [{address: 'a1', value: 'nameField1'},
        {address: 'b1', value: 'new field'},
        {address: 'c1', value: 'nameField2'},
        {address: 'd1', value: 'nameField3'}],
        [{address: 'a2', value: 'Field1'},
        {address: 'b2', value: 'NewField1'},
        {address: 'c2', value: 'Field2'},
        {address: 'd2', value: 'Field3'}],
        [{address: 'a3'},
        {address: 'b3',value: 'newfielD2.1'},
        {address: 'c3',value: 'fielD2.1'},
        {address: 'd3',value: 'fielD3.1'}],
        [{address: 'a4',},
        {address: 'b4',},
        {address: 'c4',},
        {address: 'd4',value: 'field3.2 with comm"'}],
        [{address: 'a5',},
        {address: 'b5',},
        {address: 'c5',},
        {address: 'd5',value: 'field4.2 \na'}]
      ]
    };

    stubs.fs = {};
    stubs.xlsObj = function (file) {
      console.log('file', file);
      var self = this;
      self.events = {};
      self.on = function(event, fn) {
        console.log('event!', event);
        self.events[event] = fn;
        if (event == 'data') {
          if (file == 'testfile.xls') {
            fn(testfile);
          } else {
            fn(testfileNewFields);
          }
        } else if (event == 'close') {
          fn();

        }
        //console.log('asddddddddd-------------');
        return self;
      };

    };

    stubs.xlsObj.read = function() {};
    stubs.xls = sinon.stub(stubs.xlsObj, 'read');
    stubs.fs.createOutputStream = sinon.stub(fs, 'createOutputStream');
    /*
    stubs.xlsObj.returns({
      end: function () {
        stubs.xlsObj.events.close();
      },
      on: function (ev, done) {
        console.log('run!')
        stubs.xlsObj.events[ev] = done;
      },
    });
    */
    stubs.xls.withArgs(sinon.match.string).yieldsAsync(null, testfile);

    stubs.fs.createOutputStreamWriteRaw = '';
    stubs.fs.createOutputStreamWrite = sinon.spy(function(text) {
      stubs.fs.createOutputStreamWriteRaw += text;
    });
    stubs.fs.createOutputStreamEnd = sinon.spy();
    stubs.fs.events = {};

    var returnsForCreateOutputStream = {
      write: stubs.fs.createOutputStreamWrite,
      end: function(){
        stubs.fs.createOutputStreamEnd();
        if (stubs.fs.events.finish)
          stubs.fs.events.finish();
      },
      on: function(ev, done){
        stubs.fs.events[ev] = done;
      }
    };

    stubs.fs.createOutputStream.withArgs('csv/output.csv').returns(returnsForCreateOutputStream);

    mockery.registerMock('pyspreadsheet', {SpreadsheetReader: stubs.xlsObj});
    mockery.registerMock('fs-extra', fs);

    format = require('../lib/format');
  });

  beforeEach(function(){
    stubs.fs.createOutputStream.reset();
    stubs.fs.createOutputStreamWrite.reset();
    stubs.fs.createOutputStreamEnd.reset();
    stubs.fs.createOutputStreamWriteRaw = '';
  });

  describe('xlsx2csv', function(){
    it('should format csv', function(done){
      format.xls2csv_stream('testfile.xls', function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(false);
        csv.should.be.equal(expectCsv);
        done();
      });
    });

    it('should format csv, if head is defined replace this', function(done){
      var expectCsvHead = '"namefieldhead1","namefieldhead2","namefieldhead3"\n' +
              '"field1","field2","field3"\n'+
              ',"field2.1","field3.1"\n' +
              ',,"field3.2 with comm\'"\n' +
              ',,"field4.2 a"\n';
      format.xls2csv_stream('testfile.xls', {headCsv: '"namefieldhead1","namefieldhead2","namefieldhead3"'}, function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(false);
        csv.should.be.equal(expectCsvHead);
        done();
      });
    });

    it('should format csv, use header for csv in lower case', function(done) {
      var expectCsvHead = '"namefield1","new field","namefield2","namefield3"\n' +
              '"Field1","NewField1","Field2","Field3"\n'+
              ',"newfielD2.1","fielD2.1","fielD3.1"\n' +
              ',,,"field3.2 with comm\'"\n' +
              ',,,"field4.2 a"\n';

      format.xls2csv_stream('testfileNewFields.xls', {headCsvLowerCase: true}, function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(false);
        console.log('return', csv);
        csv.should.be.equal(expectCsvHead);
        done();
      });
    });

    it('should format csv, if exist nameFile save with streams', function(done){
      format.xls2csv_stream('testfile.xls', {fileName: 'csv/output.csv'}, function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(true);
        var lines = expectCsv.split('\n');
        stubs.fs.createOutputStreamWrite.getCall(0).args[0].should.be.equal(lines[0]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(1).args[0].should.be.equal(lines[1]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(2).args[0].should.be.equal(lines[2]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(3).args[0].should.be.equal(lines[3]+'\n');
        stubs.fs.createOutputStreamEnd.calledOnce.should.be.equal(true);
        stubs.fs.createOutputStreamWriteRaw.should.be.equal(expectCsv);
        done();
      });
    });


  });

  describe('getFiles', function(){
    it('should return the absolute path files', function(done){
      var absRoot = process.cwd();
      format.getFiles(['lib/', 'test/',  'package.json'], function(err, data){
        data.should.containDeep([
          absRoot + '/lib/main.js',
          absRoot + '/lib/format.js',
          absRoot + '/lib/sources.js',
          absRoot + '/test/format.js',
          absRoot + '/test/sources.js',
          absRoot + '/package.json',
        ]);
        done();
      });
    });
  });

  describe('getName', function(){
    it('should return the name of file', function(){
      format.getName('/home/user/ctgen/dowloads/testfile.xls').should.be.equal('testfile');
      format.getName('/home/user/ctgen/dowloads/testfile.xlsx').should.be.equal('testfile');
    });
  });

  describe.skip('xlsx2csv_r', function(){
    it('should parse file o directory to csv and get obj', function(done){
      format.xlsx2csv_r(['testfile.xls', 'lib/'], function(err, data){
        console.log(data);
      });
    });
  });

  after(function(){
    mockery.deregisterAll();
    mockery.disable();
    stubs.fs.createOutputStream.restore();
  });

});
