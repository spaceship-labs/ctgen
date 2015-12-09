var should = require('should'),
    sinon = require('sinon'),
    mockery = require('mockery'),
    file = require('../lib/file'),
    sources = require('../lib/sources'),
    shell = require('../lib/runScript'),
    child_process = require('child_process');


describe('main', function(){

  var stubs = {},
      main,
      mainOptions;

  beforeEach(function(){

      mainOptions = {
        xlsx:{
          xlsx: 'dir_xlsx',
          db: 'test',
          authString: '-u user -p pass',
        },
        xlsxDocs: [{
          name: 'uc',
          docs: []
        }],
        xlsxCsvs: [{
          name: 'uc',
          csvs: []
        }],
        csv: {
          csv: 'dir_csv',
          db: 'test',
          authString: '-u user -p pass'
        },
        all: {
          db: 'test',
          authString: '-u user -p pass'
        }
      };

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    stubs.shell = {};
    stubs.file = {};
    stubs.sources = {};
    stubs.child_process = {};

    stubs.shell.processData = sinon.stub(shell, 'processData');
    stubs.shell.processData.withArgs('test').yieldsAsync(null);

    stubs.shell.runScriptsMongo = sinon.stub(shell, 'runScriptsMongo');
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.xlsx).yieldsAsync(null);
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.csv).yieldsAsync(null);
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.all).yieldsAsync(null);

    stubs.file.getAllAndFormatPath = sinon.stub(file, 'getAllAndFormatPath');
    stubs.file.getAllAndFormatPath.withArgs('xlsx', 'dir_xlsx', 'docs').yieldsAsync(null, mainOptions.xlsxDocs);

    stubs.file.getAllAndFormat = sinon.stub(file, 'getAllAndFormat');
    stubs.file.getAllAndFormat.withArgs('csv', 'dir_csv', 'csvs').yieldsAsync(null, mainOptions.xlsxCsvs);

    stubs.sources.get = sinon.stub(sources, 'get');
    stubs.sources.get.withArgs('ctbook_files_xls/').yieldsAsync(null, mainOptions.xlsxDocs);

    stubs.child_process.spawn = sinon.stub(child_process, 'spawn');

    //stubs.child_process.spawn.withArgs(process.cwd() + '/lib/../bin/ctgen.js',['install', '--csv', 'csv', '-d', 'test']).returns({
    stubs.child_process.spawn.withArgs(process.cwd() + '/lib/../bin/ctgen.js', sinon.match.array).returns({
      on: function(val, done){
        //main.install(mainOptions.csv, done);
        done();
      }
    })

    mockery.registerMock('./sources', sources);
    mockery.registerMock('./file', file);
    mockery.registerMock('./runScript', shell);
    main = require('../lib/main');

  });

  afterEach(function(){
    mockery.deregisterAll();
    mockery.disable();
    stubs.file.getAllAndFormatPath.restore();
    stubs.shell.runScriptsMongo.restore();
    stubs.shell.processData.restore();
    stubs.child_process.spawn.restore();
    stubs.file.getAllAndFormat.restore();
    stubs.sources.get.restore();
  });

  describe('install', function(){
    it('--only-procces', function(done){
      main.install({
        onlyProcess: true,
        db: 'test',
        authString: '-u user -p pass'
      }, function () {
        stubs.shell.processData.calledOnce.should.equal(true);
        stubs.shell.processData.calledWith('test').should.equal(true);
        //shell.options.should.eql({ onlyProcess: true, db: 'test', authString: '-u user -p pass' });
        done();
      });
    });

    it('--csv', function (done) {
      main.install(mainOptions.csv, function(){
        stubs.file.getAllAndFormat.calledOnce.should.equal(true);
        stubs.file.getAllAndFormat.calledWith('csv', 'dir_csv', 'csvs').should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csv).should.equal(true)
        done();
      });
    });

    it('--xlsx', function(done){
      main.install(mainOptions.xlsx, function(){
        stubs.file.getAllAndFormatPath.calledOnce.should.equal(true);
        stubs.file.getAllAndFormatPath.calledWith('xlsx', 'dir_xlsx', 'docs').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.xlsx).should.equal(true);
        done();
      });
    });

    it('all process', function(done){
      main.install(mainOptions.all, function(){
        stubs.sources.get.calledOnce.should.equal(true);
        stubs.sources.get.calledWith('ctbook_files_xls/').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.all).should.equal(true);
        done();
      });
    });
  });

  describe('install --spawn', function(){
    it('--only-procces', function(done){
      main.install({
        onlyProcess: true,
        db: 'test',
        authString: '-u user -p pass'
      }, function () {
        stubs.shell.processData.calledOnce.should.equal(true);
        stubs.shell.processData.calledWith('test').should.equal(true);
        //shell.options.should.eql({ onlyProcess: true, db: 'test', authString: '-u user -p pass' });
        done();
      });
    });

    it('--csv', function (done) {
      main.install(mainOptions.csv, function(){
        stubs.file.getAllAndFormat.calledOnce.should.equal(true);
        stubs.file.getAllAndFormat.calledWith('csv', 'dir_csv', 'csvs').should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csv).should.equal(true)
        done();
      });
    });

    it('--xlsx', function(done){
      main.install(mainOptions.xlsx, function(){
        stubs.file.getAllAndFormatPath.calledOnce.should.equal(true);
        stubs.file.getAllAndFormatPath.calledWith('xlsx', 'dir_xlsx', 'docs').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.xlsx).should.equal(true);
        done();
      });
    });

    it('all process', function(done){
      main.install(mainOptions.all, function(){
        stubs.sources.get.calledOnce.should.equal(true);
        stubs.sources.get.calledWith('ctbook_files_xls/').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.all).should.equal(true);
        done();
      });
    });
  });


});
