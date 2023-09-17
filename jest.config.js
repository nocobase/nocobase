const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.paths.json');
const { defaults } = require('jest-config');

module.exports = {
  rootDir: process.cwd(),
  collectCoverage: false,
  verbose: true,
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.[jt]s'],
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: ['./jest.setupAfterEnv.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
  },
  transform: {
    '^.+\\.{ts|tsx}?$': [
      'ts-jest',
      {
        babelConfig: false,
        tsconfig: './tsconfig.jest.json',
        diagnostics: false,
      },
    ],
  },
  modulePathIgnorePatterns: ['/esm/', '/es/', '/dist/', '/lib/', '/client/', '/sdk/', '\\.test\\.tsx$'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/esm/',
    '/lib/',
    'package.json',
    '/demo/',
    'package-lock.json',
    '/storage/',
  ],
};
