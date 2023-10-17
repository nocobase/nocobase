const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.paths.json');

const swcrc = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: false,
      decorators: true,
      dynamicImport: false,
    },
  },
};

((swcrc.jsc ??= {}).experimental ??= {}).plugins = [['jest_workaround', {}]];

const config = {
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
    '^.+\\.(t|j)sx?$': ['@swc/jest', swcrc],
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

module.exports = config;
