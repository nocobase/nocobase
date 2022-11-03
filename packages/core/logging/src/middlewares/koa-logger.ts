import logger from 'koa-pino-logger';
const { randomUUID } = require('node:crypto');

function KoaLogger(options) {
  return logger({
    ...options,

    genReqId: function (req, res) {
      if (req.id) return req.id;
      let id = req.headers['X-Request-Id'];
      if (!id) id = randomUUID();
      return id;
    },

    customReceivedMessage: function (req, res) {
      return 'request received: ' + req.method;
    },
  });
}

export default KoaLogger;
