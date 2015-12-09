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

  function runOn(options) {
    std = {
      on: function(){}
    };
    return {
      on: function(val, done){
        main.install(options, done);
        //done();
      },
      stdout: std,
      stderr: std
    }

  }

  beforeEach(function(){

      mainOptions = {
        xlsx:{
          xlsx: 'ctbook_files_xls',
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
          csv: 'csv',
          db: 'test',
          authString: '-u user -p pass'
        },
        all: {
          db: 'test',
          authString: '-u user -p pass'
        },
        csvRun: {
          csv: 'csv',
          db: 'test',
          run: true,
          spawn: true
        },
        xlsxRun: {
          db: 'test',
          run: true,
          xlsx: 'ctbook_files_xls',
          spawn: true
        },
        allRun: {
          db: 'test',
          run: true,
          spawn: true
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
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.csvRun).yieldsAsync(null);
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.xlsxRun).yieldsAsync(null);
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.xlsxRun).yieldsAsync(null);
    stubs.shell.runScriptsMongo.withArgs(mainOptions.xlsxCsvs, mainOptions.allRun).yieldsAsync(null);

    stubs.file.getAllAndFormatPath = sinon.stub(file, 'getAllAndFormatPath');
    stubs.file.getAllAndFormatPath.withArgs('xlsx', 'ctbook_files_xls', 'docs').yieldsAsync(null, mainOptions.xlsxDocs);

    stubs.file.getAllAndFormat = sinon.stub(file, 'getAllAndFormat');
    stubs.file.getAllAndFormat.withArgs('csv', 'csv', 'csvs').yieldsAsync(null, mainOptions.xlsxCsvs);

    stubs.sources.get = sinon.stub(sources, 'get');
    stubs.sources.get.withArgs('ctbook_files_xls/').yieldsAsync(null, mainOptions.xlsxDocs);

    stubs.child_process.spawn = sinon.stub(child_process, 'spawn');

    //stubs.child_process.spawn.withArgs(process.cwd() + '/lib/../bin/ctgen.js',['install', '--csv', 'csv', '-d', 'test']).returns({
    var options = {
      onlyProcess: ['install', '-d', 'test', '--only-process', '--run', '--spawn'],
      onlyProcessFormat: {
        db: 'test',
        onlyProcess: true,
        run: true,
        spawn: true
      },
      csv: ['install', '--csv', 'csv', '-d', 'test', '--run', '--spawn'],
      csvFormat: {
        csv: 'csv',
        db: 'test',
        run: true,
        spawn: true
      },
      xlsx: ['install', '-d', 'test', '--run', '--spawn', '--xlsx', 'ctbook_files_xls'],
      xlsxFormat: {
        db: 'test',
        run: true,
        xlsx: 'ctbook_files_xls',
        spawn: true
      },
      all: [ 'install', '-d', 'test', '--run', '--spawn' ],
      allFormat: {
        db: 'test',
        run: true,
        spawn: true
      },
      xlsxFromAll: ['install', '-d', 'test', '--spawn', '--xlsx', 'ctbook_files_xls'],
      xlsxFormatFromAll: {
        db: 'test',
        xlsx: 'ctbook_files_xls',
        spawn: true
      },
      script: process.cwd() + '/lib/../bin/ctgen.js'
    };
    stubs.child_process.spawn.withArgs(options.script, options.onlyProcess).returns(runOn(options.onlyProcessFormat));
    stubs.child_process.spawn.withArgs(options.script, options.csv).returns(runOn(options.csvFormat));
    stubs.child_process.spawn.withArgs(options.script, options.xlsx).returns(runOn(options.xlsxFormat));
    stubs.child_process.spawn.withArgs(options.script, options.all).returns(runOn(options.allFormat));
    stubs.child_process.spawn.withArgs(options.script, options.xlsxFromAll).returns(runOn(options.xlsxFormatFromAll));

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
        stubs.file.getAllAndFormat.calledWith('csv', 'csv', 'csvs').should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csv).should.equal(true)
        done();
      });
    });

    it('--xlsx', function(done){
      main.install(mainOptions.xlsx, function(){
        stubs.file.getAllAndFormatPath.calledOnce.should.equal(true);
        stubs.file.getAllAndFormatPath.calledWith('xlsx', 'ctbook_files_xls', 'docs').should.equal(true);
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
    this.timeout(9000);
    it('--only-procces', function(done){
      main.install({
        onlyProcess: true,
        db: 'test',
        authString: '-u user -p pass',
        spawn: true
      }, function () {
        stubs.shell.processData.calledOnce.should.equal(true);
        stubs.shell.processData.calledWith('test').should.equal(true);
        //shell.options.should.eql({ onlyProcess: true, db: 'test', authString: '-u user -p pass' });
        done();
      });
    });

    it('--csv', function (done) {
      mainOptions.csv.spawn = true;
      main.install(mainOptions.csv, function(){
        stubs.file.getAllAndFormat.calledOnce.should.equal(true);
        stubs.file.getAllAndFormat.calledWith('csv', 'csv', 'csvs').should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csvRun).should.equal(true)
        done();
      });
    });

    it('--xlsx', function(done){
      mainOptions.xlsx.spawn = true;
      main.install(mainOptions.xlsx, function(){
        stubs.file.getAllAndFormatPath.calledOnce.should.equal(true);
        stubs.file.getAllAndFormatPath.calledWith('xlsx', 'ctbook_files_xls', 'docs').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csvRun).should.equal(true);
        done();
      });
    });

    it('all process', function(done){
      mainOptions.all.spawn = true;
      main.install(mainOptions.all, function(){
        stubs.sources.get.calledOnce.should.equal(true);
        stubs.sources.get.calledWith('ctbook_files_xls/').should.equal(true);
        stubs.shell.runScriptsMongo.calledOnce.should.equal(true);
        stubs.shell.runScriptsMongo.calledWith(mainOptions.xlsxCsvs, mainOptions.csvRun).should.equal(true);
        done();
      });
    });
  });


});
