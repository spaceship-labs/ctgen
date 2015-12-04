// link dependencias - 295 x 1min
counter=0;
hashmap = {};
uchashmap = {};
var bulk = db.dependencia.initializeUnorderedBulkOp();
var bulk_uc = db.unidadcompradora.initializeUnorderedBulkOp();
db.uc.find({}).forEach(function (doc) {
  if(hashmap[doc.DEPENDENCIA_ENTIDAD] === undefined) {
    hashmap[doc.DEPENDENCIA_ENTIDAD] = counter;
    id = new ObjectId();
    date = new Date().toISOString();
    obj = {siglas: doc.SIGLAS, _id: id, dependencia: doc.DEPENDENCIA_ENTIDAD, createdAt: date, updatedAt: date};
    bulk.insert( obj );
   
    if(uchashmap[doc.CLAVE_UC] === undefined) {
      uchashmap[doc.CLAVE_UC] = counter;
    
      ucid = new ObjectId();
      obj = {claveuc: doc.CLAVE_UC, _id: ucid, nombre_de_la_uc: doc.NOMBRE_UC, dependencia: id, createdAt: date, updatedAt: date};
      bulk_uc.insert( obj );

      db.dependencia.find({_id: id }).forEach(function (dep) {
        var unidades = [];
        if (dep.unidades === undefined) {
          unidades = [ucid];
        } else {
          var found = false;
          for(var i = 0; i < dep.unidades.length; i++) {
            if (dep.unidades[i] == ucid) {
              found = true;
              break;
            }
          }
          if (!found) {
            dep.unidades.push(ucid);
          }
          unidades = dep.unidades;
        }
        bulk.find( { _id: id } ).update( { $set: { unidades: unidades } } );
      });
    } 
  } else {
    db.dependencia.find({dependencia: doc.DEPENDENCIA_ENTIDAD }).forEach(function (dep) {
      if(uchashmap[doc.CLAVE_UC] === undefined) {
        uchashmap[doc.CLAVE_UC] = counter;
      
        ucid = new ObjectId();
        obj = {claveuc: doc.CLAVE_UC, _id: ucid, nombre_de_la_uc: doc.NOMBRE_UC, dependencia: dep._id, createdAt: date, updatedAt: date};
        bulk_uc.insert( obj );

        var unidades = [];
        if (dep.unidades === undefined) {
          unidades = [ucid];
        } else {
          var found = false;
          for(var i = 0; i < dep.unidades.length; i++) {
            if (dep.unidades[i] == ucid) {
              found = true;
              break;
            }
          }
          if (!found) {
            dep.unidades.push(ucid);
          }
          unidades = dep.unidades;
        }
        bulk.find( { _id: id } ).update( { $set: { unidades: unidades } } );
      }
    });
  }

  counter++;
  if(counter % 500 === 0 ) {
    bulk.execute({ w: 0});
    bulk = db.dependencia.initializeUnorderedBulkOp();
    bulk_uc.execute({ w: 0});
    bulk_uc = db.unidadcompradora.initializeUnorderedBulkOp();
  }
});
print("insertando " + Object.keys(hashmap).length + " dependencias");
print("insertando " + Object.keys(uchashmap).length + " unidades");
bulk.execute({ w: 0});
bulk_uc.execute({ w: 0});
