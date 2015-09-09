var should = require('should'),
    mockery = require('mockery'),
    fs = require('fs-extra'),
    xls = require('pyspreadsheet').SpreadsheetReader,
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
              ',,"field3.2"\n';

    //testfile.xls
    var testfile = {
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
    };

    stubs.fs = {};
    stubs.xls = sinon.stub(xls, 'read');
    stubs.fs.createOutputStream = sinon.stub(fs, 'createOutputStream');
    stubs.xls.withArgs(sinon.match.string).yieldsAsync(null, testfile);

    stubs.fs.createOutputStreamWrite = sinon.spy();
    stubs.fs.createOutputStreamEnd = sinon.spy();
    stubs.fs.events = {};
    stubs.fs.createOutputStream.withArgs('csv/output.csv').returns({
      write: stubs.fs.createOutputStreamWrite,
      end: function(){
        stubs.fs.createOutputStreamEnd();
        stubs.fs.events.finish();
      },
      on: function(ev, done){
        stubs.fs.events[ev] = done;
      }
    })

    mockery.registerMock('pyspreadsheet', {SpreadsheetReader: xls});
    mockery.registerMock('fs-extra', fs);

    format = require('../lib/format');
  });

  beforeEach(function(){
    stubs.fs.createOutputStream.reset();
    stubs.fs.createOutputStreamWrite.reset();
    stubs.fs.createOutputStreamEnd.reset();
  });

  describe('xlsx2csv', function(){
    it('should format csv', function(done){
      format.xls2csv('testfile.xls', function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(false);
        csv.should.be.equal(expectCsv);
        done();
      });
    });

    it('should format csv, if head is nefined replace this', function(done){
      var expectCsvHead = '"namefieldhead1","namefieldhead2","namefieldhead3"\n' +
              '"field1","field2","field3"\n'+
              ',"field2.1","field3.1"\n' +
              ',,"field3.2"\n';
      format.xls2csv('testfile.xls', {headCsv: ['"namefieldhead1","namefieldhead2","namefieldhead3"']}, function(err, csv){
        stubs.fs.createOutputStream.called.should.be.equal(false);
        csv.should.be.equal(expectCsvHead);
        done();
      });
    });

    it('should format csv, if nameFile is nefined save with streams', function(done){
      format.xls2csv('testfile.xls', {fileName: 'csv/output.csv'}, function(err, csv){
        console.log('called', stubs.fs.createOutputStream.called)
        stubs.fs.createOutputStream.called.should.be.equal(true);
        console.log('call', stubs.fs.createOutputStreamWrite.getCall(1).args[0]);
        var lines = expectCsv.split('\n');
        stubs.fs.createOutputStreamWrite.getCall(0).args[0].should.be.equal(lines[0]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(1).args[0].should.be.equal(lines[1]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(2).args[0].should.be.equal(lines[2]+'\n');
        stubs.fs.createOutputStreamWrite.getCall(3).args[0].should.be.equal(lines[3]+'\n');
        stubs.fs.createOutputStreamEnd.calledOnce.should.be.equal(true);
        //stubs.fs.createOutputStreamWrite.calledOnce.should.be.equal(4);
        csv.should.be.equal(expectCsv);
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
