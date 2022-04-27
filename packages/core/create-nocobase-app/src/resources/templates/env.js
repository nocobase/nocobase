const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');

const generateASecret = () => crypto.randomBytes(256).toString('base64');

module.exports = (options) => {
  const { dbOptions, envs } = options;
  const tmpl = fs.readFileSync(path.join(__dirname, 'env.template'));
  const compile = _.template(tmpl);

  const dbEnvs = Object.keys(dbOptions)
    .map((keyName) => [`DB_${keyName.toUpperCase()}`, dbOptions[keyName]])
    .map((item) => `${item[0]}=${item[1] || ''}`)
    .join('\n');

  let envContent = compile({
    jwtSecret: generateASecret(),
    dbEnvs,
  });

  for (const env of Object.entries(envs)) {
    const [key, value] = env;
    const re = new RegExp(`^${key}=(.+)`, 'm');
    if (envContent.match(re)) {
      envContent = envContent.replace(re, `${key}=${value}`);
    } else {
      envContent = `${envContent}${key}=${value}\n`;
    }
  }

  return envContent;
};
