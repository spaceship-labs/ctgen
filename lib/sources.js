'use strict';

var request = require('request'),
  cheerio = require('cheerio'),
  async = require('async'),
  fs = require('fs-extra'),
  unzip = require('node-unzip-2'),
  nodePath = require('path'),
  sources = exports = module.exports = {};

sources.srcs = [{
    url: 'https://sites.google.com/site/cnetuc/contrataciones',
    parent: '.sites-layout-tile table ',
    onlyFirstParent: true,
    each: 'tr td a',
    //once: true,
    name: 'contrataciones', //cnetuc
    headCsvLowerCase: true
    //headCsv: '"gobierno","siglas", "dependencia","claveuc","nombre_de_la_uc","responsable","numero_expediente","titulo_expediente","plantilla_expediente","numero_procedimiento","exp_f_fallo","proc_f_publicacion","fecha_apertura_proposiciones","caracter","tipo_contratacion","tipo_procedimiento","forma_procedimiento","codigo_contrato","titulo_contrato","fecha_inicio","fecha_fin","importe_contrato","moneda","estatus_contrato","archivado","ramo","clave_programa","aportacion_federal","fecha_celebracion","contrato_marco","compra_consolidada","plurianual","clave_cartera_shcp","estratificacion_muc","folio_rupc","proveedor_contratista","estratificacion_mpc","estatus_empresa","cuenta_administrada_por","anuncio"'
  }, {
    url: 'https://sites.google.com/site/cnetuc/contratos_cnet_3',
    parent: '.sites-layout-tile table ',
    each: 'tr td a',
    name: 'cnet3',
    //exclude: /EX/,
    //once: true,
    headCsv: '"dependencia","nombre_de_la_uc","claveuc","numero_procedimiento","tipo_procedimiento","tipo_contratacion","caracter","codigo_contrato","titulo_contrato","fecha_inicio","importe_contrato","proveedor_contratista","anuncio"'
  }, {
    link: 'http://upcp.funcionpublica.gob.mx/descargas/UC.zip',
    name: 'uc',
  }

];

sources.getDownloadLink = function(datas, done) {
  datas = datas.push ? datas : [datas]
  async.concat(datas, function(data, next) {
    if (data.link) {
      data.links = [data.link];
      return next(null, data);
    }

    request.get({
      url: data.url
    }, function(err, res, body) {
      if (err) return done(err);
      var $ = cheerio.load(body),
        parent = data.parent ? $(data.parent) : $('body'),
        list = [];

      if (data.onlyFirstParent) {
        parent = parent.first();
      }

      parent.find(data.each).each(function(i, child) {
        var href = $(child).attr('href'),
          exclude = data.exclude && data.exclude.test && data.exclude.test(href) || false;
        exclude = exclude || data.once && list.length == 1 || false
        if (!exclude) {
          list.push(href);
        }
      });

      data.links = list;
      next(null, data);
    });


  }, done);

};

var replaceLink = /http:\/\/|https:\/\/|\/|\./g;
sources.getName = function(link, noExt) {
  var split = link.split('.'),
    ext = '.' + split.pop(),
    name = link.replace(ext, '').replace(replaceLink, '');

  if (noExt)
    return name;

  return name + ext;
};

sources.downloadFiles = function(links, path, done) {
  links = links.push ? links : [links]
  var names = [];
  async.eachSeries(links, function(link, next) {
    var name = sources.getName(link),
      file = fs.createOutputStream(path + name);

    names.push(path + name);

    file.on('finish', next);

    request.get({url: link, rejectUnauthorized: false})
      .pipe(file)


  }, function(err) {
    if (err) return done(err);
    done(null, names);
  });
};

sources.unZipFiles = function(files, path, done) {
  files = files.push ? files : [files]
  var paths = [];
  async.each(files, function(file, next) {
    if (nodePath.extname(file) != '.zip') {
      paths.push(file);
      return next();
    }

    var name = sources.getName(file, true),
      from = fs.createReadStream(file);

    paths.push(path + name);


    var dest = unzip.Extract({
      path: path + name
    });
    dest.on('finish', next);

    from.pipe(dest);

  }, function(err) {
    done(err, paths);
  });
};

sources.get = function(downloadPath, done) {
  //var downloadPath = 'download/';
  async.waterfall([
    function(next) {
      if (sources.verbose)
        console.log('Search Links');
      sources.getDownloadLink(sources.srcs, next);
    },
    function(links, next) {
      async.concat(links, function(info, nextEach) {
        var subPath = info.name ? info.name + '/' : '';
        if (sources.verbose)
          console.log('GET ', info.links.toString());
        sources.downloadFiles(info.links, downloadPath + subPath, function(err, files) {
          if (err) return nextEach(err);
          if (sources.verbose)
            console.log('success ', files.toString());
          info.files = files;
          nextEach(null, info);
        });
      }, next);
    },
    function(files, next) {
      async.concat(files, function(info, nextEach) {
        var unzipPath = info.name ? info.name + '/' : '';
        sources.unZipFiles(info.files, downloadPath + unzipPath + 'unzip/', function(err, docs) {
          if (err) return nextEach(err);
          if (sources.verbose)
            console.log('Unzip', docs.toString());
          info.docs = docs;
          nextEach(null, info);
        })

      }, next);
    }
  ], done);
};

sources.merge = function(datas) {
  var byNames = {};
  sources.srcs.forEach(function(s) {
    byNames[s.name] = s;
  });

  datas.forEach(function(d) {
    var base = byNames[d.name];
    if (base) {
      for (var key in base) {
        d[key] = base[key];
      }
    }
  });

  return datas;
};

/*
sources.get('downloadtest/', function(err, data){
  console.log('err', err)
  console.log('data', data);
});
*/
