module.exports = process.env.IS_DEV_CMD || process.env.VITEST ? require('./src/server.ts') : require('./lib/server');
