const cds = require('@sap/cds');

// Mount the custom REST API under /rest. This coexists with the OData V4
// services and the @cap-js-community/odata-v2-adapter cds-plugin (/odata/v2).
cds.on('bootstrap', (app) => {
  app.use('/rest', require('./rest')());
});

module.exports = cds.server;
