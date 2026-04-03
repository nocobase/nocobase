import path from 'node:path';
import { buildSwaggerCommands } from '../src/lib/build-swagger-commands.js';

const projectRoot = path.resolve(__dirname, '..');
const defaultSourceRoot = path.resolve(projectRoot, '../../..');
const argv = process.argv.slice(2);

function readOption(name: string) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

async function main() {
  const sourceRootOption = readOption('--source-root');
  const sourceRoot = sourceRootOption ?? process.env.NOCOBASE_SOURCE_ROOT ?? defaultSourceRoot;

  const result = await buildSwaggerCommands({
    sourceRoot: path.resolve(projectRoot, sourceRoot),
    outputRoot: path.join(projectRoot, 'src/generated/commands'),
    manualCommandsRoot: path.join(projectRoot, 'src/commands'),
    commandRegistryFile: path.join(projectRoot, 'src/generated/command-registry.ts'),
    manualTopicsFile: path.join(projectRoot, 'src/manual-topics.json'),
    manifestFile: path.join(projectRoot, '.nocobase-cli/generated-manifest.json'),
    configFile: path.join(projectRoot, 'nocobase-cli.config.json'),
    packageJsonFile: path.join(projectRoot, 'package.json'),
    full: process.argv.includes('--full'),
  });

  console.log(
    `Generated ${result.commands} commands from ${result.sources} swagger sources` +
      (result.removed ? `, removed ${result.removed} stale files` : ''),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
