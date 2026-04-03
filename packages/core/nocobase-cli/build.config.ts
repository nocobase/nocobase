import { defineConfig } from '@nocobase/build';
import path from 'node:path';
import fs from 'fs-extra';
import { buildSwaggerCommands } from './src/lib/build-swagger-commands';

export default defineConfig({
  beforeBuild: async (log) => {
    const projectRoot = __dirname;
    await fs.remove(path.join(projectRoot, 'lib'));
    log('generate swagger commands');
    const sourceRoot = path.resolve(projectRoot, '../../..');
    const result = await buildSwaggerCommands({
      sourceRoot,
      outputRoot: path.join(projectRoot, 'src/generated/commands'),
      manualCommandsRoot: path.join(projectRoot, 'src/commands'),
      commandRegistryFile: path.join(projectRoot, 'src/generated/command-registry.ts'),
      manualTopicsFile: path.join(projectRoot, 'src/manual-topics.json'),
      manifestFile: path.join(projectRoot, '.nocobase-cli/generated-manifest.json'),
      configFile: path.join(projectRoot, 'nocobase-cli.config.json'),
      packageJsonFile: path.join(projectRoot, 'package.json'),
      full: false,
    });
    log(`generated ${result.commands} commands from ${result.sources} swagger sources`);
  },
});
