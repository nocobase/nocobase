export const getAutoDeletePluginsWarning = (plugins: Map<string, string>) => {
  const pluginNames = Array.from(plugins.keys()).map((name) => plugins.get(name) || name);
  return `The following plugins have been automatically removed from the database as they no longer exist and are not enabled: ${pluginNames.join(
    ',',
  )}. You can reinstall it using the plugin package at any time.`;
};

export const getNotExistsEnabledPluginsError = (plugins: Map<string, string>, proPlugins: string[]) => {
  const pluginNames = Array.from(plugins.keys()).map((name) => plugins.get(name) || name);
  const removeCmds = Array.from(plugins.keys())
    .map((name) => `yarn nocobase pm disable ${name}\nyarn nocobase pm remove ${name}`)
    .join('\n');
  let errMsg = `
The following plugins are enbaled but the plugin package does not exist: ${pluginNames.join(', ')}.
Please ensure that the plugin package exists or manually delete it from the "applicationPlugins" table. You can use the command:
${removeCmds}

以下插件已启用但插件包不存在: ${pluginNames.join(', ')}.
请确保插件包存在或者将这些插件记录从 "applicationPlugins" 表中删除。你可以使用命令：
${removeCmds}`;
  if (proPlugins.length) {
    const proPluginNames = proPlugins.map((name) => plugins.get(name) || name);
    errMsg += `

💎 Among them are commercial plugins: ${proPluginNames.join(', ')}.
If you are interested in purchasing, please visit: https://www.nocobase.com/commercial.html for more details

其中包含商业插件: ${proPluginNames.join(', ')}。
如果您有购买意向，请访问: https://www.nocobase.com/commercial.html 了解详情`;
  }
  return errMsg;
};
