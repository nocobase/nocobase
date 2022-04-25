const path = require('path');

module.exports = (opts) => {
  const { projectPath } = opts;
  const templateJsonPath = path.join(projectPath, 'packages/app/client/package.json');
  const templateJson = require(templateJsonPath);

  return {
    ...templateJson,
    name: 'client',
    version: '0.1.0',
    dependencies: {
      ...templateJson.dependencies,
    },
  };
};
