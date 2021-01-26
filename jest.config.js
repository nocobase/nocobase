const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.resolve(__dirname, 'dotenv.js')],
  testMatch: [
    // '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/packages/father-build/"
  ],
};