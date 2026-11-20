// The repository builds Default as a SQLite reference application. Generated projects run their own CLI directly.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const manifest = require('../package.json');
const referenceBuild = new URL(
  '../../../../scripts/build-default-reference.mjs',
  import.meta.url,
);
if (
  manifest.name === '@nocobase/app-template-default' &&
  manifest.devDependencies?.['@nocobase/db-sqlite']?.startsWith('workspace:') &&
  !Object.keys(manifest.dependencies ?? {}).some((name) =>
    name.startsWith('@nocobase/db-'),
  ) &&
  !process.env.DB_DIALECT &&
  !process.env.APP_CONFIG_FILE &&
  ![
    'config.yml',
    'config.yaml',
    'config.toml',
    'config.json',
    '.env',
    '.env.local',
  ].some((file) => existsSync(file)) &&
  existsSync(referenceBuild) &&
  !process.argv.slice(2).some((arg) => arg === '--help' || arg === '-h')
) {
  await import(referenceBuild);
} else {
  process.argv.splice(2, 0, 'build');
  await import(
    pathToFileURL(
      path.join(
        path.dirname(require.resolve('@nocobase/app-cli/package.json')),
        'bin/run.js',
      ),
    ).href
  );
}
