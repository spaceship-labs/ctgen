// link dependencias - 295 x 1min
counter=0;
hashmap = {};
uchashmap = {};
var bulk = db.dependencia.initializeUnorderedBulkOp();
var bulk_uc = db.unidadcompradora.initializeUnorderedBulkOp();
var preCompiledAccentsRegex = /([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g;
var preCompiledComaRegex = /,/g;
var preCompiledDotRegex = /\./g;
var preCompiledSpaceRegex = / /g;
print("no timeout option");
db.uc.find({}).addOption(DBQuery.Option.noTimeout).forEach(function (doc){
  var dep_nombre = doc.DEPENDENCIA_ENTIDAD.toLowerCase();
  dep_nombre = dep_nombre.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
  dep_nombre = dep_nombre.replace(preCompiledComaRegex, "");
  dep_nombre = dep_nombre.replace(preCompiledDotRegex, "");
  dep_nombre = dep_nombre.replace(preCompiledSpaceRegex, "");
  id = new ObjectId();
  date = new Date().toISOString();
  obj = { siglas: doc.SIGLAS, _id: id, dependencia: doc.DEPENDENCIA_ENTIDAD, createdAt: date, updatedAt: date, slug: dep_nombre };
  bulk.find({ dependencia: doc.DEPENDENCIA_ENTIDAD }).upsert().update({ $setOnInsert: obj });

  var uc_nombre = doc.NOMBRE_UC.toLowerCase();
  uc_nombre = uc_nombre.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
  uc_nombre = uc_nombre.replace(preCompiledComaRegex, "");
  uc_nombre = uc_nombre.replace(preCompiledDotRegex, "");
  uc_nombre = uc_nombre.replace(preCompiledSpaceRegex, "");
  ucid = new ObjectId();
  obj = {claveuc: doc.CLAVE_UC, _id: ucid, nombre_de_la_uc: doc.NOMBRE_UC, dependencia: id, createdAt: date, updatedAt: date, slug: uc_nombre};
  bulk_uc.find({ claveuc: doc.CLAVE_UC }).upsert().update({ $setOnInsert: obj });
  //
  db.dependencia.find({ dependencia: doc.DEPENDENCIA_ENTIDAD }).forEach(function (dep){
    var unidades = [];
    db.unidadcompradora.find({ claveuc: doc.CLAVE_UC }).forEach(function (ucc){
      if(dep.unidades === undefined){
        unidades = [ucc._id];
      }else{
        var found = false;
        for(var i = 0; i < dep.unidades.length; i++){
          if(dep.unidades[i] == ucc._id){
            found = true;
            break;
          }
        }
        if(!found){
          dep.unidades.push(ucc._id);
        }
        unidades = dep.unidades;
      }
    });
    bulk.find({ _id: dep._id }).update({ $set: { unidades: unidades } });
  });
  counter++;
  if(counter % 1500 === 0 ) {
    print("ciclo " + counter);
  }
  if(counter % 500 === 0 ) {
    bulk.execute({ w: 0});
    bulk = db.dependencia.initializeUnorderedBulkOp();
    bulk_uc.execute({ w: 0});
    bulk_uc = db.unidadcompradora.initializeUnorderedBulkOp();
  }
});
print("insertando dependencias y unidades");
bulk.execute({ w: 0});
bulk_uc.execute({ w: 0});
print("insertando dependencias y unidades END");
