print("link dependencias y unidades compradoras");


//update dependencia y unidad compradora via unidad compradora
print("update dependencia y unidad compradora via unidad compradora");
counter=0;
var bulk = db.contrato.initializeUnorderedBulkOp();
db.unidadcompradora.find().forEach(function (doc) {
    bulk.find( { $and: [{ claveuc: doc.claveuc },{ dependencia2: null }] } ).update( { $set: { dependencia2: doc.dependencia, unidadCompradora : doc._id  } } );

    counter++;
    if(counter % 100 === 0 ) {
        print("ciclo " + counter);
        bulk.execute({ w: 0});
        bulk = db.contrato.initializeUnorderedBulkOp();
    }
});
bulk.execute({ w: 0});

print("update dependencia via nombre");
counter=0;
//update dependencia via nombre
bulk = db.contrato.initializeUnorderedBulkOp();
db.dependencia.find().forEach(function (doc) {
  bulk.find(  { $and: [ { dependencia2: null }, { dependencia: { $regex : new RegExp(["^", doc.dependencia, "$"].join(""), "i") } }  ] }).update( { $set: { dependencia2: doc._id } } );

  counter++;
  if(counter % 100 === 0 ) {
    print("ciclo " + counter);
    bulk.execute({ w: 0});
    bulk = db.contrato.initializeUnorderedBulkOp();
  }
});
bulk.execute({ w: 0});

//inserta y asocia a contratos las dependencias no encontradas
print("inserta y asocia a contratos las dependencias no encontradas");
counter=0;
var bulkD = db.dependencia.initializeUnorderedBulkOp();
var bulkC = db.contrato.initializeUnorderedBulkOp();
db.contrato.group({
    key : { dependencia : 1 },
    cond : { dependencia2 : null },
    reduce : function(curr,result) {result += 1 },
    initial : { result : 1  }})
    .forEach(function (doc) {
        var _id = new ObjectId();
        bulkD.insert({ dependencia : doc.dependencia ,_id : _id ,createdByScript : true });
        bulkC.find({ $and : [ { dependencia2: null },{ dependencia : doc.dependencia } ]}).update( { $set: { dependencia2: _id } } );
        counter++;
        if(counter % 100 === 0 ) {
            print("ciclo " + counter);
            bulkD.execute({ w: 0});
            bulkD = db.dependencia.initializeUnorderedBulkOp();
            bulkC.execute({ w: 0});
            bulkC = db.contrato.initializeUnorderedBulkOp();
        }
});
bulkD.execute({ w: 0});
bulkC.execute({ w: 0});

//inserta y actualiza los contratos con las unidades compradoras no encontradas
print("inserta y actualiza los contratos con las unidades compradoras no encontradas");
counter=0;
var bulkUC = db.unidadcompradora.initializeUnorderedBulkOp();
bulkC = db.contrato.initializeUnorderedBulkOp();
bulkD = db.dependencia.initializeUnorderedBulkOp();
db.contrato.group({
    key : { claveuc : 1,nombre_de_la_uc : 1,dependencia2 : 1 },
    cond : { unidadCompradora : null },
    reduce : function(curr,result) {result += 1 },
    initial : { result : 1  }})
    .forEach(function (doc) {
        var _id = new ObjectId();
        bulkUC.insert({ _id : _id,dependencia : doc.dependencia2, claveuc : doc.claveuc, nombre_de_la_uc : doc.nombre_de_la_uc ,createdByScript : true });
        bulkC.find({ claveuc : doc.claveuc }).update({ $set: { unidadCompradora : _id } });
        bulkD.find({ _id : doc.dependencia2 }).update({ $push : { unidades : _id } });
        counter++;
        if(counter % 33 === 0 ) {
            print("ciclo " + counter);
            bulkUC.execute({ w: 0});
            bulkUC = db.unidadcompradora.initializeUnorderedBulkOp();
            bulkC.execute({ w: 0});
            bulkC = db.contrato.initializeUnorderedBulkOp();
            bulkD.execute({ w: 0});
            bulkD = db.dependencia.initializeUnorderedBulkOp();
        }
    });
bulkUC.execute({ w: 0});
bulkC.execute({ w: 0});
bulkD.execute({ w: 0});
