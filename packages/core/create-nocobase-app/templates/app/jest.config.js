const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.paths.json');
const { resolve } = require('path');

module.exports = {
  rootDir: process.cwd(),
  collectCoverage: false,
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: [require.resolve('jest-dom/extend-expect'), resolve(__dirname, './jest.setup.ts')],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
  modulePathIgnorePatterns: ['/esm/', '/es/', '/dist/', '/lib/'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/esm/',
    '/lib/',
    'package.json',
    '/demo/',
    'package-lock.json',
  ],
};
