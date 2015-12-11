print("fecha_inicio_year is NaN: " + db.contrato.find({fecha_inicio_year:NaN}).count());
var counter = 0;
var fourDigits = /[0-9]{4}/;
var bulkC = db.contrato.initializeUnorderedBulkOp();
db.contrato.find({fecha_inicio_year:NaN}).forEach(function(doc) {
  var match = doc.fecha_inicio.match(fourDigits);
  if (match) {
    var year = parseInt(match[0]);
    if (year) {
      counter++;
      bulkC.find({_id: doc._id}).update( { $set: { fecha_inicio_year : year } } );
    }
  }

  if (counter % 500 === 0 ) {
    bulkC.execute({ w: 0});
    bulkC = db.contrato.initializeUnorderedBulkOp();
  }
});
