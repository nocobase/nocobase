/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { buildPortalRegistries } = require('../portal-registry/build');
const { initializePortalRegistry } = require('../portal-registry/init');
const { testPortalRegistries } = require('../portal-registry/test');
const { startPortalRegistryDevelopment } = require('../portal-registry/workspace');

module.exports = (cli) => {
  const command = cli.command('portal-registry').description('Develop and build plugin-owned Portal Registry items');

  command
    .command('init')
    .description('initialize Portal Registry sources for an editable plugin')
    .argument('<plugin>', 'plugin package name or short name')
    .action(async (plugin) => {
      const result = await initializePortalRegistry(plugin);
      console.log(`Initialized Portal Registry '${result.registryName}' for ${result.packageName}.`);
      console.log(`Source: ${result.registryRoot}`);
      console.log('Run yarn portal-registry dev to preview it.');
    });

  command
    .command('build')
    .description('build Portal Registry items into their owning plugin packages')
    .action(async () => {
      const result = await buildPortalRegistries();
      console.log(`Built ${result.itemCount} Portal Registry items for ${result.pluginCount} plugins.`);
    });

  command
    .command('dev')
    .description('start NocoBase and the Portal Template development workspace')
    .action(async () => {
      await startPortalRegistryDevelopment();
    });

  command
    .command('test')
    .description('install Registry items into a clean Portal Template and run its production build')
    .action(async () => {
      const result = await testPortalRegistries();
      console.log(`Tested ${result.itemCount} Portal Registry items for ${result.pluginCount} plugins.`);
    });
};
