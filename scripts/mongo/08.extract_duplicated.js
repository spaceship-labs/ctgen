// extract inicio fecha - 500,000 x 11min
counter=0;
//var bulk = db.contrato.initializeUnorderedBulkOp();
//db.contrato.find({}).forEach(function (doc) {
//  var date;
//  if (doc.source == "https://sites.google.com/site/cnetuc/contratos_cnet_3") {
//    var dateString = doc.fecha_inicio.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
//    date = new Date( dateString[3], dateString[2]-1, dateString[1] ).getFullYear();
//  } else {
//    date = new Date(doc.fecha_inicio).getFullYear();
//  }
//  bulk.find( { _id: doc._id } ).update( { $set: { fecha_inicio_year: date } } );
//  counter++;
//  if(counter % 1000 === 0 ) {
//    print("bulk execute: " + counter);
//    bulk.execute({ w: 0});
//    bulk = db.contrato.initializeUnorderedBulkOp();
//  }
//});
//bulk.execute({ w: 0});

// primero todas las empresas que sean identicas y lo unico diferente sea case
var eliminated = [];
var counter=0;
//var bulk = db.contrato.initializeUnorderedBulkOp();
//var bulk_remove = db.empresa.initializeUnorderedBulkOp();
db.empresa.find({}).limit(1).forEach(function (company) {
  db.empresa.find({}).forEach(function (company2) {
    if (company._id.toString() != company2._id.toString() && company.proveedor_contratista.length == company2.proveedor_contratista.length && eliminated.indexOf(company2._id) == -1) {
      var distance = hamming(company.proveedor_contratista.toUpperCase(), company2.proveedor_contratista.toUpperCase());
      var length = company.proveedor_contratista.length;
      if (distance < 3) {
        eliminated.push(company._id);
        //"inStr".replace(/([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
        //bulk.find( { provedorContratista: company2._id } ).update( { $set: { provedorContratista: company._id } } );
        //bulk.find( { _id: company2._id } ).remove();

        //print(company.proveedor_contratista);
        //print(company2.proveedor_contratista);
        //print("-------------");
      }
    }
  });
  counter++;
  if(counter % 1000 === 0 ) {
    print("bulk execute: " + counter);
    //bulk.execute({ w: 0});
    //bulk_remove.execute({ w: 0});
    //bulk = db.empresa.initializeUnorderedBulkOp();
    //bulk_remove = db.empresa.initializeUnorderedBulkOp();
  }

});
//bulk.execute({ w: 0});
//bulk_remove.execute({ w: 0});
print(eliminated.length);

function hamming( a, b, clbk ) {
  var len, d, i;
  len = a.length;
  if ( len !== b.length ) {
    throw new Error( 'hamming()::invalid input arguments. Sequences must be the same length.' );
  }
  d = 0;
  if ( clbk ) {
    for ( i = 0; i < len; i++ ) {
      if ( clbk( a[i], i, 0 ) !== clbk( b[i], i, 1 ) ) {
        d += 1;
      }
    }
  } else {
    for ( i = 0; i < len; i++ ) {
      if ( a[ i ] !== b[ i ] ) {
        d += 1;
      }
    }
  }
  return d;
}
