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

    redact: {
      paths: ['req.headers.cookie', 'req.headers.accept', 'req.headers.authorization'],
    },
  });
}

export default KoaLogger;
