import fs from 'node:fs';
import { createRequire } from 'node:module';

// create-app owns the YAML format used by the generated configuration.
const { parseDocument, isMap } = createRequire(
  new URL('../packages/tools/create-app/package.json', import.meta.url),
)('yaml');
export const dialects = ['sqlite', 'postgres', 'mysql', 'mssql', 'oracle'];

export function readMainConfig(file, dialect) {
  const doc = parseDocument(fs.readFileSync(file, 'utf8'));
  if (doc.errors.length)
    throw new Error('The test configuration is not valid YAML.');
  const main = doc.getIn(['database', 'connections', 'main'], true);
  if (!isMap(main) || main.get('dialect') !== dialect)
    throw new Error(
      'The test configuration must contain database.connections.main with the selected dialect.',
    );
  return main;
}

export function mergeMainConfig(target, source, dialect) {
  const main = readMainConfig(source, dialect);
  const doc = parseDocument(fs.readFileSync(target, 'utf8'));
  if (doc.errors.length)
    throw new Error('The generated configuration is not valid YAML.');
  for (const pair of main.items)
    doc.setIn(['database', 'connections', 'main', pair.key.value], pair.value);
  fs.writeFileSync(target, doc.toString(), { mode: 0o600 });
  fs.chmodSync(target, 0o600);
}

if (import.meta.main) {
  try {
    mergeMainConfig(...process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
