export default {
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'packages',
  // Match all test files in the e2e and __e2e__ directories.
  testMatch: /(.*\/e2e\/|.*\/__e2e__\/).+\.test\.[tj]sx*$/,
  reporter: [['markdown'], [['html', { outputFolder: `./e2e-report`, open: 'never' }]]]
};
