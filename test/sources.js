var fs = require('fs'),
    should = require('should'),
    mockery = require('mockery'),
    sinon = require('sinon'),
    request = require('request'),
    htmlContratos = fs.readFileSync('test/html-stubs/contrataciones.html', 'utf-8');

describe('sources', function(){
  var sources,
      stubs = {},
      infoContratos = {
        url: 'https://sites.google.com/site/cnetuc/contrataciones',
        parent: '.sites-layout-tile table ',
        each: 'tr td a'
      };

  before(function(){
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    stubs.request = sinon.stub(request, 'get');
    stubs.request.withArgs({url: infoContratos.url}).yieldsAsync(null, {}, htmlContratos);

    mockery.registerMock('request', request);

    sources = require('../lib/sources');

  });

  describe('getDownloadLink', function(){
    it('should return links to zip or xls files by selectors', function(done){
      sources.getDownloadLink(infoContratos, function(err, data){
        data.should.containEql('http://upcp.funcionpublica.gob.mx/descargas/Contratos2015.zip')
        done()
      });
    });

    it('should return direct link [sugar]', function(done){
      sources.getDownloadLink({link: 'http://upcp.funcionpublica.gob.mx/descargas/UC.zip'}, function(err, data){
        data.should.containEql('http://upcp.funcionpublica.gob.mx/descargas/UC.zip')
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

  /*
  describe('downloadFiles', function(){
    it('should save the files in path', function(done){

    });
  });
  */

});
