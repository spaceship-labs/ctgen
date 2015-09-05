'use strict';

var request = require('request'),
    cheerio = require('cheerio'),
    async = require('async'),
    fs = require('fs-extra'),
    unzip = require('node-unzip-2'),
    sources = exports = module.exports = {};

sources.getDownloadLink = function(data, done){
  if(data.link)
    return done(null, [data.link]);

  request.get({url: data.url}, function(err, res, body){
    if(err) return done(err);
    var $ = cheerio.load(body),
      parent = data.parent ? $(data.parent) : $('body'),
      list = [];

    parent.find(data.each).each(function(i, child){
      list.push($(child).attr('href'))
    });

    done(null, list);
  });
};

sources.srcs = [{
    url: 'https://sites.google.com/site/cnetuc/contrataciones',
    parent: '.sites-layout-tile table ',
    each: 'tr td a'
  },{
    url: 'https://sites.google.com/site/cnetuc/contratos_cnet_3',
    parent: '.sites-layout-tile table ',
    each: 'tr td a'
  },{
    link: 'http://upcp.funcionpublica.gob.mx/descargas/UC.zip'
  }

];

var replaceLink =  /http:\/\/|https:\/\/|\/|\./g;
sources.getName = function(link, noExt){
  var split = link.split('.'),
    ext = '.' + split.pop(),
    name = link.replace(ext, '').replace(replaceLink,'');

  if(noExt)
    return name;

  return name + ext;
};

sources.downloadFiles = function(links, path, done){
  var names = [];
  async.each(links, function(link, next){
    var name = sources.getName(link),
    file = fs.createOutputStream(path + name);

    names.push(path + name);

    file.on('finish', next);

    request.get(link)
      .pipe(file)

  }, function(err){
    if(err) return done(err);
    done(null, names);
  });
};

sources.unZipFiles = function(files, path, done){
  var paths = [];
  async.each(files, function(file, next){
    var name = sources.getName(file, true),
      from = fs.createReadStream(file);

    paths.push(path + name);

    var dest = unzip.Extract({ path: path + name });
    dest.on('finish', next);

    from.pipe(dest);

  }, function(err){
    done(err, paths);
  });

};
