import AJV from 'ajv';
import slash from 'slash2';
import { relative } from 'path';
import signale from 'signale';
import schema from './schema';
import { getExistFile } from './utils';
import { IBundleOptions } from './types';

function testDefault(obj) {
  return obj.default || obj;
}

export const CONFIG_FILES = [
  '.fatherrc.js',
  '.fatherrc.jsx',
  '.fatherrc.ts',
  '.fatherrc.tsx',
  '.umirc.library.js',
  '.umirc.library.jsx',
  '.umirc.library.ts',
  '.umirc.library.tsx',
];

export default function({ cwd }): IBundleOptions {
  const configFile = getExistFile({
    cwd,
    files: CONFIG_FILES,
    returnRelative: false,
  });

  if (configFile) {
    if (configFile.includes('.umirc.library.')) {
      signale.warn(`.umirc.library.js is deprecated, please use .fatherrc.js instead.`);
    }

    const userConfig = testDefault(require(configFile)); // eslint-disable-line
    const userConfigs = Array.isArray(userConfig) ? userConfig : [userConfig];
    userConfigs.forEach(userConfig => {
    const ajv = new AJV({ allErrors: true });
      const isValid = ajv.validate(schema, userConfig);
      if (!isValid) {
        const errors = ajv.errors.map(({ dataPath, message }, index) => {
          return `${index + 1}. ${dataPath}${dataPath ? ' ' : ''}${message}`;
        });
        throw new Error(
          `
Invalid options in ${slash(relative(cwd, configFile))}

${errors.join('\n')}
`.trim(),
        );
      }
    });
    return userConfig;
  } else {
    return {};
  }
}
