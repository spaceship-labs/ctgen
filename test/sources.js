var fs = require('fs-extra'),
    should = require('should'),
    mockery = require('mockery'),
    sinon = require('sinon'),
    request = require('request'),
    unzip = require('node-unzip-2'),
    htmlContratos = fs.readFileSync('test/html-stubs/contrataciones.html', 'utf-8');

describe('sources', function(){
  var sources,
      stubs = {},
      infoContratos,
      contratosUrl = 'https://sites.google.com/site/cnetuc/contrataciones',
      streamPipe = {
        pipe: function(dest){//simulate streams
          dest.run('finish')
        }
      },
      streamResponse = function(name){
        var events = {};
        return {
          on: function(event, done){
            events[event] = done;
          },
          run: function(event){
            events[event] && events[event]();
          },
          pipe: streamPipe.pipe
        }
      };

  beforeEach(function(){
    infoContratos = {
        url: contratosUrl,
        parent: '.sites-layout-tile table ',
        each: 'tr td a',
        name: 'contracts'
    };

  });

  before(function(){
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    stubs.fs = {};

    stubs.fs.createOutputStream = sinon.stub(fs, 'createOutputStream', streamResponse);
    stubs.fs.createReadStream = sinon.stub(fs, 'createReadStream', streamResponse);

    stubs.request = sinon.stub(request, 'get');
    stubs.request.withArgs({url: contratosUrl}).yieldsAsync(null, {}, htmlContratos);
    stubs.request.withArgs('http://upcp.funcionpublica.gob.mx/descargas/Contratos2010_2012.zip').returns(streamPipe);

    stubs.unzip = sinon.stub(unzip, 'Extract');
    stubs.unzip.withArgs({path: 'unzip/'+'downloadtestupcpfuncionpublicagobmxdescargasContratos2010_2012'}).returns(streamResponse());

    mockery.registerMock('fs-extra', fs);
    mockery.registerMock('request', request);
    mockery.registerMock('node-unzip-2', unzip);

    sources = require('../lib/sources');
  });

  describe('getDownloadLink', function(){
    it('should return links to zip or xls files by selectors', function(done){
      sources.getDownloadLink(infoContratos, function(err, data){
        var exp = [{
                    url: contratosUrl,
                    parent: '.sites-layout-tile table ',
                    each: 'tr td a',
                    name: 'contracts',
                    links: [ 'http://upcp.funcionpublica.gob.mx/descargas/Contratos2015.zip',
                      'http://upcp.funcionpublica.gob.mx/descargas/Contratos2014.zip',
                      'http://upcp.funcionpublica.gob.mx/descargas/Contratos2013.zip',
                      'http://upcp.funcionpublica.gob.mx/descargas/Contratos2010_2012.zip' ]
                    }];

        data.should.be.eql(exp);
        done();
      });
    });

    it('should return links to zip or xls files by selectors only once', function(done){
      infoContratos.once = true;
      sources.getDownloadLink(infoContratos, function(err, data){
        var exp = [{
                    url: contratosUrl,
                    once: true,
                    parent: '.sites-layout-tile table ',
                    each: 'tr td a',
                    name: 'contracts',
                    links: [ 'http://upcp.funcionpublica.gob.mx/descargas/Contratos2015.zip',]
                  }];

        data.should.be.eql(exp);
        done();
      });
    });

    it('should exclude urls', function(done){
      var contratos = {
        url: 'https://sites.google.com/site/cnetuc/contrataciones',
        parent: '.sites-layout-tile table ',
        each: 'tr td a',
        name: 'contracts',
        exclude: /2015/
      },
      exp = [{
        url: 'https://sites.google.com/site/cnetuc/contrataciones',
        parent: '.sites-layout-tile table ',
        each: 'tr td a',
        name: 'contracts',
        exclude: /2015/,
        links: [ 'http://upcp.funcionpublica.gob.mx/descargas/Contratos2014.zip',
          'http://upcp.funcionpublica.gob.mx/descargas/Contratos2013.zip',
          'http://upcp.funcionpublica.gob.mx/descargas/Contratos2010_2012.zip' ]
        }];

      sources.getDownloadLink(contratos, function(err, data){
        data.should.be.eql(exp);
        done();
      });
    });

    it('should return direct link [sugar]', function(done){
      sources.getDownloadLink({name: 'contract', link: 'http://upcp.funcionpublica.gob.mx/descargas/UC.zip'}, function(err, data){
        var exp = [{
          name: 'contract',
          links: ['http://upcp.funcionpublica.gob.mx/descargas/UC.zip'],
          link: 'http://upcp.funcionpublica.gob.mx/descargas/UC.zip'
        }];
        data.should.be.eql(exp)
        done()
      });
    });
  });

  describe('getName', function(){
    it('should return format name', function(){
      var name = sources.getName('http://upcp.funcionpublica.gob.mx/descargas/UC.zip');
      name.should.be.equal('upcpfuncionpublicagobmxdescargasUC.zip');
    });

    it('should return format name no ext', function(){
      var name = sources.getName('http://upcp.funcionpublica.gob.mx/descargas/UC.zip', true);
      name.should.be.equal('upcpfuncionpublicagobmxdescargasUC');
    });
  });

  describe('downloadFiles', function(){
    it('should download files', function(done){
      sources.downloadFiles('http://upcp.funcionpublica.gob.mx/descargas/Contratos2010_2012.zip', 'downloadtest/', function(err, data){
        data.should.be.eql(['downloadtest/upcpfuncionpublicagobmxdescargasContratos2010_2012.zip']);
        done();
      });
    });
  });

  describe('unZipFiles', function(){

    beforeEach(function(){
      stubs.unzip.reset();
      stubs.fs.createReadStream.reset();
    });

    it('should unzip files', function(done){
      sources.unZipFiles('downloadtest/upcpfuncionpublicagobmxdescargasContratos2010_2012.zip', 'unzip/', function(err, data){
        data.should.be.eql([ 'unzip/downloadtestupcpfuncionpublicagobmxdescargasContratos2010_2012' ])
        done();
      })
    });

    it('should work with .zip extension', function(done){
      sources.unZipFiles('downloadtest/upcpfuncionpublicagobmxdescargasContratos2010_2012.csv', 'unzip/', function(err, data){
        stubs.fs.createReadStream.called.should.be.equal(false);
        stubs.unzip.called.should.be.equal(false);
        data.should.be.eql(['downloadtest/upcpfuncionpublicagobmxdescargasContratos2010_2012.csv'])
        done();
      })
    });
  });

  describe('merge', function(){
    it('should merge sources data with obj argument', function(){
      var data = sources.merge([
        {
          name: 'uc',
          docs: ['paths']
        }
      ]);
      data[0].name.should.equal('uc');
      data[0].link.should.equal('http://upcp.funcionpublica.gob.mx/descargas/UC.zip');
      data[0].docs.should.eql(['paths'])
    });
  });

  after(function(){
    mockery.deregisterAll();
    mockery.disable();
    stubs.fs.createOutputStream.restore();
  });
});
