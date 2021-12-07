const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.jest.json');

module.exports = {
  collectCoverage: false,
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: [
    require.resolve('jest-dom/extend-expect'),
    './jest.setup.ts',
  ],
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
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/esm/',
    '/lib/',
    'package.json',
    '/demo/',
    'package-lock.json',
  ],
}
