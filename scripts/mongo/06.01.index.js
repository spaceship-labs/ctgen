db.empresa.createIndex( { proveedor_contratista: "text" } );
db.empresa.createIndex( { importe_contrato: 1 } );
db.empresa.createIndex( { importe_contrato: 0 } );

db.dependencia.createIndex( { siglas: 1 } );
db.dependencia.createIndex( { siglas: 0 } );
db.dependencia.createIndex( { dependencia: "text" } )

db.unidadcompradora.createIndex( { nombre_de_la_uc: "text" } )