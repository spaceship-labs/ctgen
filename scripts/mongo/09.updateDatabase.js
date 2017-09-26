/* Empresas : Add slug, remove nombres */
var bulk = db.empresa.initializeUnorderedBulkOp();
var nombre_sin_acentos, nombre,counter=0;
var preCompiledAccentsRegex = /([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g;
var preCompiledComaRegex = /,/g;
var preCompiledDotRegex = /\./g;
var preCompiledSpaceRegex = / /g;
var preCompiledMoneyRegex = /[^0-9-.]/g;
var preCompiledDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
print("guardando empresa SLUG");
db.empresa.find({ slug : null }).addOption(DBQuery.Option.noTimeout).forEach(function (doc){
	var nombre = doc.proveedor_contratista.toLowerCase();
	nombre = nombre.replace(preCompiledComaRegex, "");
	nombre = nombre.replace(preCompiledDotRegex, "");
	nombre = nombre.replace(preCompiledSpaceRegex, "");
	//importe_contrato
	//importe_contrato_usd
	var ic = doc.importe_contrato === undefined || doc.importe_contrato === null?0:doc.importe_contrato;
	var icu = doc.importe_contrato_usd === undefined || doc.importe_contrato_usd === null?0:doc.importe_contrato_usd;
	bulk.find({ _id: doc._id }).update({ $set: { slug: nombre, importe_contrato : ic, importe_contrato_usd : icu }, $unset : { nombres : "" } });
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
print("guardando empresa SLUG fin");

print("guardando contrato codigo");
var bulk_c = db.contrato.initializeUnorderedBulkOp();
db.contrato.find({ codigoContratoProcedimiento : null }).addOption(DBQuery.Option.noTimeout).forEach(function (doc){
	nombre_sin_acentos = doc.proveedor_contratista.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
	nombre = nombre_sin_acentos.toUpperCase();
	nombre = nombre.replace(preCompiledComaRegex, "");
	nombre = nombre.replace(preCompiledDotRegex, "");
	nombre = nombre.replace(preCompiledSpaceRegex, "");
	bulk_c.find({ _id: doc._id }).update({ $set: { codigoContratoProcedimiento : doc.codigo_contrato + '-' + doc.numero_procedimiento, slugProvedorContratista : nombre } });

	counter++;
	if(counter % 50000 === 0 ) {
		print("ciclo " + counter);
	}
	if(counter % 500 === 0 ) {
		bulk_c.execute({ w: 0});
		bulk_c = db.contrato.initializeUnorderedBulkOp();
	}
});
bulk_c.execute({ w: 0});
print("guardando contrato codigo fin");

print("Actualizando unidades compradoras/dependencias");
var bulk = db.dependencia.initializeUnorderedBulkOp();
var bulk_uc = db.unidadcompradora.initializeUnorderedBulkOp();
db.uc.find({}).addOption(DBQuery.Option.noTimeout).forEach(function (doc){
  var dep_nombre = doc.DEPENDENCIA_ENTIDAD.toLowerCase();
  dep_nombre = dep_nombre.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
  dep_nombre = dep_nombre.replace(preCompiledComaRegex, "");
  dep_nombre = dep_nombre.replace(preCompiledDotRegex, "");
  dep_nombre = dep_nombre.replace(preCompiledSpaceRegex, "");
  bulk.find({ dependencia: doc.DEPENDENCIA_ENTIDAD }).update({ $set: { slug: dep_nombre } });

  var uc_nombre = doc.NOMBRE_UC.toLowerCase();
  uc_nombre = uc_nombre.replace(preCompiledAccentsRegex, function(str,a,c,e,i,n,o,s,u,y,ae) { if(a) return 'a'; else if(c) return 'c'; else if(e) return 'e'; else if(i) return 'i'; else if(n) return 'n'; else if(o) return 'o'; else if(s) return 's'; else if(u) return 'u'; else if(y) return 'y'; else if(ae) return 'ae'; });
  uc_nombre = uc_nombre.replace(preCompiledComaRegex, "");
  uc_nombre = uc_nombre.replace(preCompiledDotRegex, "");
  uc_nombre = uc_nombre.replace(preCompiledSpaceRegex, "");
  bulk_uc.find({ claveuc: doc.CLAVE_UC }).update({ $set: { slug: uc_nombre } });
  //
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
bulk.execute({ w: 0});
bulk_uc.execute({ w: 0});
print("Actualizando unidades compradoras/dependencias END");