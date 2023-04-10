const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');
const { defaults } = require('jest-config');

module.exports = {
  rootDir: process.cwd(),
  collectCoverage: false,
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: [require.resolve('jest-dom/extend-expect'), './jest.setupAfterEnv.ts'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    '@nocobase/evaluators/client': '<rootDir>/packages/core/evaluators/src/client',
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
  },
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
  modulePathIgnorePatterns: ['/esm/', '/es/', '/dist/', '/lib/'],
  // add .mjs .cjs for formula.js
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mjs', 'cjs'],
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
