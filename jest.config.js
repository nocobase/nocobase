const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');
const { defaults } = require('jest-config');

module.exports = {
  rootDir: process.cwd(),
  collectCoverage: false,
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.[jt]s'],
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: [require.resolve('jest-dom/extend-expect'), './jest.setupAfterEnv.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
  modulePathIgnorePatterns: ['/esm/', '/es/', '/dist/', '/lib/', '/client/', '/sdk/', '\\.test\\.tsx$'],
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
