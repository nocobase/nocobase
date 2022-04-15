const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');

const generateASecret = () => crypto.randomBytes(256).toString('base64');

module.exports = (options) => {
  const { dbOptions } = options;
  const tmpl = fs.readFileSync(path.join(__dirname, 'env.template'));
  const compile = _.template(tmpl);

  const dbEnvs = Object.keys(dbOptions)
    .map((keyName) => [`DB_${keyName.toUpperCase()}`, dbOptions[keyName]])
    .map((item) => `${item[0]}=${item[1] || ''}`)
    .join('\n');

  const envContent = compile({
    jwtSecret: generateASecret(),
    dbEnvs,
  });

  return envContent;
};
