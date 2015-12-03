var async = require('async'),
    fs = require('fs-extra'),
    Path = require('path'),
    file = exports = module.exports = {};

file.get = function(base, paths, done) {
  async.concat(paths, function(path, next) {
    fs.stat(path, function(err, stat) {
      if (err) return next(err);
      if (stat.isDirectory()) {
        var absPath = fs.realpathSync(path);

        fs.readdir(path, function(err, files) {
          if (err) return next(err);
          var absFiles = [];

           files.forEach(function(file) {
            absFiles.push(Path.join(absPath, file));
          });
          next(null, absFiles);
        });
      } else if (stat.isFile()) {
        next(null, Path.join(base, path));
      } else {
        next(null, []);
      }
    });

  }, done);
};

file.getFromAbsolute = function(path, done) {
  file.get(path, [path], done);
};

file.getFromRelative = function(path, done) {
  var root = process.cwd();
  file.get(root, [path], done);
};



file.getAllOf = function(ext, path, done) {
  file.getAllPaths(path, function(err, dirnames) {
    async.concat(dirnames, file.getFromAbsolute, function(err, files) {
      if (err) return done(err);
      var onlyExt = files.filter(function(f) {
        return Path.extname(f) == '.' + ext;
      });
      done(null, onlyExt);
    });

  });
};

file.format = function(root, fileNames, files) {
  var objs = [],
      objsName = [];
  files.sort().forEach(function(f) {
    var list = Path.dirname(f).split(Path.sep),
        indexRoot = list.indexOf(Path.parse(root).base),
        name = indexRoot == -1 || indexRoot + 1  == list.length ? list[indexRoot] : list[indexRoot + 1],
        index = objsName.indexOf(name);

    if (index == -1) {
      var obj = {
        name: name
      };
      obj[fileNames] = [f];
      objsName.push(name);
      objs.push(obj);
    } else {
      objs[index][fileNames].push(f);
    }
  });
  return objs;
}

file.getAllAndFormat = function(ext, path, objName, done) {
  file.getAllOf(ext, path, function(err, files) {
    if (err) return done(err);
    if (!files.length) return done(new Error('Not a valid path'));
    done(null, file.format(path, objName, files))
  });
}

file.getAllAndFormatPath = function(ext, path, objName, done) {
  file.getAllOf(ext, path, function(err, files) {
    if (err) return done(err);
    if (!files.length) return done(new Error('Not a valid path'));
    var format = file.format(path, objName, files);
        dirnames = format.forEach( function(f) {
          var exist = {};
          f[objName] = f[objName].map( function(p) {
            var dir = Path.dirname(p);
            if (exist[dir]) return;
            exist[dir] = true;
            return dir;

          }).filter(function (p) {
            return p
          });
        });
    done(null, format)
  });
}

file.getAllPaths = function(root, done) {
  if (Path.isAbsolute(root)) {
    return file.getFromAbsolute(root, recursivePaths);
  }
  file.getFromRelative(root, recursivePaths);

  function recursivePaths(err, paths, acc) {
    acc = acc || [];
    async.map(paths, getStats, function(err, stats) {
      async.filter(stats, isDirectory, function(directorieStat) {
        if (directorieStat && directorieStat.length) {
          var directories = directorieStat.map(getName),
              dirname = Path.dirname(directories[0]);

          acc = acc.concat(directories);
          file.get(dirname, directories, function(err, paths) {
            recursivePaths(err, paths, acc);
          });
        } else {
          done(null, acc);
        }
     });
   });
  }
}


function isDirectory(stat, next) {
  next(stat.isDirectory());
}

function getStats(path, next) {
  fs.stat(path, function(err, stat) {
    if (err) return done(err);
    stat.name = path;
    next(null, stat);
  })
}

function getName(stat) {
  return stat.name;
}
