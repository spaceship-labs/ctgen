// link uc - 5,000 x 1min
counter=0;
var bulk = db.contrato.initializeUnorderedBulkOp();
db.unidadcompradora.find({}).forEach(function (doc) {
  bulk.find( { claveuc: doc.claveuc } ).update( { $set: { unidadCompradora: doc._id } } );
  if(counter % 100 === 0 ) {
    print("ciclo " + counter);
    bulk.execute({ w: 0});
    bulk = db.contrato.initializeUnorderedBulkOp();
  }
  counter++;
});
bulk.execute({ w: 0});