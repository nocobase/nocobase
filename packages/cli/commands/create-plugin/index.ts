const createPlugin = require('./create-plugin');
export default ({ app, args }) => {
  const name = args[0];
  createPlugin(name);
};
