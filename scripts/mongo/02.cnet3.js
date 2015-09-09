db.contrato.update({source: {$exists: false}},{ $set: { source: 'https://sites.google.com/site/cnetuc/contratos_cnet_3' } }, {multi: true });

db.contrato.update({moneda : {$exists: false}},{$set:{moneda:'MXN'}},{multi:true});