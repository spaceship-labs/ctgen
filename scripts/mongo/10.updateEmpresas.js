// extract empresas - 500,000 x 1min
counter=0;
var today_date = new Date().toISOString();
var date, dateString, nombre_sin_acentos, nombre, money;
var preCompiledAccentsRegex = /([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g;
var preCompiledComaRegex = /,/g;
var preCompiledDotRegex = /\./g;
var preCompiledSpaceRegex = / /g;
var preCompiledMoneyRegex = /[^0-9-.]/g;
var preCompiledDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

var bulk = db.empresa.initializeUnorderedBulkOp();
var bulk_c = db.contrato.initializeUnorderedBulkOp();

print('start update empresa');

//agregamos la condición para buscar contratos sin, null funciona para cuando tiene el valor null o cuando no existe el campo
db.contrato.find({ provedorContratista : null }).addOption(DBQuery.Option.noTimeout).forEach(function (doc){
  if( doc.proveedor_contratista ){
    nombre_sin_acentos = doc.proveedor_contratista.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
    nombre = nombre_sin_acentos.toUpperCase();
    nombre = nombre.replace(preCompiledComaRegex, "");
    nombre = nombre.replace(preCompiledDotRegex, "");
    nombre = nombre.replace(preCompiledSpaceRegex, "");
    money = doc.importe_contrato;
    if (isNaN(doc.importe_contrato)) {
      money = parseFloat(doc.importe_contrato.replace(preCompiledMoneyRegex, ''));
    }
    if (doc.source == "https://sites.google.com/site/cnetuc/contratos_cnet_3") {
      dateString = doc.fecha_inicio.match(preCompiledDateRegex);
      date = new Date( dateString[3], dateString[2]-1, dateString[1] ).getFullYear();
    } else {
      date = new Date(doc.fecha_inicio).getFullYear();
    }

    //update or insert
    var id = new ObjectId();
    var obj = { _id: id, proveedor_contratista: nombre_sin_acentos, createdAt: today_date, updatedAt: today_date, slug : nombre, importe_contrato : 0, importe_contrato_usd : 0 };
    bulk.find({ slug: nombre }).upsert().update({ $setOnInsert: obj });
    if(doc.moneda === undefined || doc.moneda.toUpperCase() == "MXN")
      bulk.find({ slug: nombre }).upsert().update({ $setOnInsert: { $inc: { importe_contrato : money } } });
    else
      bulk.find({ slug: nombre }).upsert().update({ $setOnInsert: { $inc: { importe_contrato_usd : money } } });

    //update contract
    bulk_c.find({ _id: doc._id }).update({ $set: { codigoContratoProcedimiento : doc.codigo_contrato + '-' + doc.numero_procedimiento  ,fecha_inicio_year: date, origProvedorContratista: doc.proveedor_contratista, importe_contrato: money, slugProvedorContratista : nombre } });
    
    counter++;
    if(counter % 50000 === 0 ) {
      print("ciclo " + counter);
    }
    if(counter % 500 === 0 ) {
      bulk.execute({ w: 0});
      bulk = db.empresa.initializeUnorderedBulkOp();
      bulk_c.execute({ w: 0});
      bulk_c = db.contrato.initializeUnorderedBulkOp();
    }
  }
});
print("insertando registros");
bulk.execute({ w: 0});
bulk_c.execute({ w: 0});


counter=0;
print("actualizando contratos -> relación empresas");
bulk_c = db.contrato.initializeUnorderedBulkOp();
db.empresa.find({ }).addOption(DBQuery.Option.noTimeout).forEach(function (doc) {
  //print(doc.slug); // , provedorContratista : null
  bulk_c.find({ slugProvedorContratista : { $eq : doc.slug }, provedorContratista:null  }).update({ $set : {provedorContratista : doc._id} });//provedorContratista
  counter++;
  if(counter % 1500 === 0 ) {
    print("ciclo " + counter);
  }
  if(counter % 100 === 0 ) {
    bulk_c.execute({ w: 0});
    bulk_c = db.contrato.initializeUnorderedBulkOp();
  }
});
print('EXEC ' + counter);
bulk_c.execute({ w: 0});
print("actualizando contratos -> relación empresas END");