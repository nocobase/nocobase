export default {
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'packages',
  reporter: [['markdown'], ['html', { outputFolder: `../../e2e-html-report`, open: 'never' }]]
};
