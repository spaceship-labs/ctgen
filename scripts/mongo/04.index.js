// indexes
db.contrato.createIndex( { provedorContratista: 1 } );
db.contrato.createIndex( { dependencia2: 1 } );
db.contrato.createIndex( { unidadCompradora: 1 } );
db.contrato.createIndex( { importe_contrato: 1 } );
db.contrato.createIndex( { importe_contrato: 0 } );
db.contrato.createIndex( { mondeda: 1 } );
db.contrato.createIndex( { fecha_inicio_year: 1 } );

db.dependencia.createIndex( { dependencia : 'text' } );