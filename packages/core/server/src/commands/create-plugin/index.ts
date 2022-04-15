const createPlugin = require('./create-plugin');
export default ({ app, cliArgs }) => {
  const name = cliArgs[0];
  createPlugin(name);
};
