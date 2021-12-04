const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.jest.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    path.resolve(__dirname, 'dotenv.js'),
  ],
  testMatch: [
    // '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  modulePathIgnorePatterns: [
    "<rootDir>/.dumi/",
    "<rootDir>/packages/father-build/",
    "<rootDir>/packages/client/lib/"
  ],
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: 'tsconfig.jest.json',
      diagnostics: false,
    },
  },
};