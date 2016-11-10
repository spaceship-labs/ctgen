// extract empresas - 500,000 x 1min
counter=0;
hashmap = {};
hashmap_names = {};
importe_hashmap = {};
importe_hashmap_usd = {};
var today_date = new Date().toISOString();
var date, dateString, nombre_sin_acentos, nombre, money, value;
var preCompiledAccentsRegex = /([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g;
var preCompiledComaRegex = /,/g;
var preCompiledDotRegex = /\./g;
var preCompiledSpaceRegex = / /g;
var preCompiledMoneyRegex = /[^0-9-.]/g;
var preCompiledDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

var bulk = db.empresa.initializeUnorderedBulkOp();
var bulk_c = db.contrato.initializeUnorderedBulkOp();

db.contrato.find({}).forEach(function (doc) {
  //print(doc.proveedor_contratista);
  nombre_sin_acentos = doc.proveedor_contratista.toString().replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
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

  if(hashmap[nombre] === undefined) {
    id = new ObjectId();
    obj = {proveedor_contratista: nombre_sin_acentos, _id: id, createdAt: today_date, updatedAt: today_date};
    bulk.insert( obj );

    bulk_c.find( { _id: doc._id } ).update( { $set: { fecha_inicio_year: date, origProvedorContratista: doc.proveedor_contratista, provedorContratista: id, importe_contrato: money } } );

    hashmap[nombre] = id;
    hashmap_names[hashmap[nombre]] = doc.proveedor_contratista.toString();
  } else {
    bulk_c.find( { _id: doc._id } ).update( { $set: { fecha_inicio_year: date, origProvedorContratista: doc.proveedor_contratista, provedorContratista: hashmap[nombre], importe_contrato: money } } );
    if(hashmap_names[hashmap[nombre]] === undefined) {
      hashmap_names[hashmap[nombre]] = doc.proveedor_contratista.toString();
    } else {
      value = hashmap_names[hashmap[nombre]];
      if (!value.indexOf(doc.proveedor_contratista.toString()) > -1) {
        value += "|" + doc.proveedor_contratista.toString();
        hashmap_names[hashmap[nombre]] = value;
      }
    }
  }

  if(doc.moneda === undefined || doc.moneda.toUpperCase() == "MXN") {
    if(importe_hashmap[hashmap[nombre]] === undefined) {
      importe_hashmap[hashmap[nombre]] = parseFloat(doc.importe_contrato);
    } else {
      importe_hashmap[hashmap[nombre]] = parseFloat(importe_hashmap[hashmap[nombre]]) + parseFloat(doc.importe_contrato);
    }
  } else {
    if(importe_hashmap_usd[hashmap[nombre]] === undefined) {
      importe_hashmap_usd[hashmap[nombre]] = parseFloat(doc.importe_contrato);
    } else {
      importe_hashmap_usd[hashmap[nombre]] = parseFloat(importe_hashmap_usd[hashmap[nombre]]) + parseFloat(doc.importe_contrato);
    }
  }
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
});
print("insertando " + Object.keys(hashmap).length + " registros");
bulk.execute({ w: 0});
bulk_c.execute({ w: 0});

counter=0;
print("actualizando importes");
bulk = db.empresa.initializeUnorderedBulkOp();
db.empresa.find({}).forEach(function (doc) {
  bulk.find( { _id: doc._id } ).update( { $set: { nombres: hashmap_names[doc._id], importe_contrato: importe_hashmap[doc.proveedor_contratista], importe_contrato_usd: importe_hashmap_usd[doc.proveedor_contratista] } } );
  counter++;
  if(counter % 50000 === 0 ) {
    print("ciclo " + counter);
  }
  if(counter % 500 === 0 ) {
    bulk.execute({ w: 0});
    bulk = db.empresa.initializeUnorderedBulkOp();
  }
});
bulk.execute({ w: 0});
