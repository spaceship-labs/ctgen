var should = require('should'),
    mockery = require('mockery'),
    fs = require('fs-extra'),
    sinon = require('sinon'),
    file = require('../lib/file');

describe('file', function(){
  describe('get', function(){
    it('should return the absolute path files', function(done){
      var absRoot = process.cwd();
      file.get(absRoot, ['lib/', 'test/',  'package.json'], function(err, data){
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

    it('should return the absolute path, work with relative path', function(done){
      var absRoot = process.cwd();
      file.getFromRelative('lib/', function(err, data){
        data.should.containDeep([
          absRoot + '/lib/main.js',
          absRoot + '/lib/format.js',
          absRoot + '/lib/sources.js',
        ]);
        done();
      });
    });

    it('should return the absolute path, work with absolute path', function(done){
      var absRoot = process.cwd() + '/lib';
      file.getFromAbsolute(absRoot, function(err, data){
        data.should.containDeep([
          absRoot + '/main.js',
          absRoot + '/format.js',
          absRoot + '/sources.js',
        ]);
        done();
      });
    });

    it('should return all paths recursive', function(done){
      var pwd = process.cwd();
      file.getAllPaths('scripts/', function(err, data){
        data.should.containDeep([
          pwd + '/scripts/mongo',
        ]);
        done();
      });
    });

    it('should return the absolute path recursive of file type', function(done){
      var pwd = process.cwd();

      file.getAllOf('js', 'scripts/', function(err, data){
        data.should.containDeep([
          pwd + '/scripts/mongo/04.index.js',
          pwd + '/scripts/mongo/auth.js',
          pwd + '/scripts/mongo/test.js',
        ]);
        done();
      });
    });

    it('should return object with format', function(done){
      var pwd = process.cwd();
      file.getAllAndFormat('js', 'scripts/', 'jss', function(err, obj){
        obj[0].name.should.equal('mongo')
        obj[0].jss.should.containDeep([
           pwd + '/scripts/mongo/04.index.js'
        ]);

        done();
      });
    });

    it('should return object with format but only the dirname', function(done){
      var pwd = process.cwd();
      //file.getAllAndFormatPath('xlsx', 'ctbook_files_xls/', 'docs', function(err, obj){
      file.getAllAndFormatPath('js', 'scripts/', 'jss', function(err, obj){
        obj[0].name.should.equal('mongo')
        obj[0].jss.should.containDeep([
           pwd + '/scripts/mongo'
        ]);
        done();
      });
    });
  });

});
