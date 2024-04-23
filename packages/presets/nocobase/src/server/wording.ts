export const getAutoDeletePluginsWarning = (plugins: string[]) =>
  `The following plugins have been automatically removed from the database as they no longer exist and are not enabled: ${plugins.join(
    ',',
  )}. You can reinstall it using the plugin package at any time.`;

export const getNotExistsEnabledPluginsError = (plugins: Map<string, string>, proPlugins: string[]) => {
  let errMsg = `
The following plugins are enbaled but the plugin package does not exist: ${Array.from(plugins.values()).join(', ')}.
Please ensure that the plugin package exists or manually delete it from the "applicationPlugins" table. You can use the command:
yarn nocobase remove [packageName]

以下插件已启用但插件包不存在: ${Array.from(plugins.values()).join(', ')}.
请确保插件包存在或者将这些插件记录从 "applicationPlugins" 表中删除。你可以使用命令：
yarn nocobase remove [packageName]`;
  if (proPlugins.length) {
    errMsg += `

💎 Among them are commercial plugins: ${proPlugins.map((name) => plugins.get(name)).join(', ')}.
If you are interested in purchasing, please visit: https://www.nocobase.com/commercial.html for more details

其中包含商业插件: ${proPlugins.map((name) => plugins.get(name)).join(', ')}。
如果您有购买意向，请访问: https://www.nocobase.com/commercial.html 了解详情`;
  }
  return errMsg;
};
