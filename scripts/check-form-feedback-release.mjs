import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const repo = path.resolve(import.meta.dirname, '..');
const values = ['FormFeedback', 'formFeedbackErrors'];
const types = [
  'FormFeedbackAttempt',
  'FormFeedbackField',
  'FormFeedbackOptions',
];

function exportedNames(file) {
  const program = ts.createProgram([file], {
    allowJs: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    noEmit: true,
  });
  const source = program.getSourceFile(file);
  const checker = program.getTypeChecker();
  const symbol = source && checker.getSymbolAtLocation(source);
  return new Set(
    symbol ? checker.getExportsOfModule(symbol).map((entry) => entry.name) : [],
  );
}

export function checkFormFeedbackPackage(directory) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
  );
  const entry = manifest.exports?.['.'];
  const runtime = entry?.import ?? manifest.main;
  const declarations = entry?.types ?? manifest.types;
  if (!runtime || !declarations)
    throw new Error(
      'The runtime package must publish JavaScript and declarations.',
    );
  for (const [file, required] of [
    [runtime, values],
    [declarations, [...values, ...types]],
  ]) {
    const exported = exportedNames(path.resolve(directory, file));
    const missing = required.filter((name) => !exported.has(name));
    if (missing.length)
      throw new Error(
        `${manifest.name}@${manifest.version} lacks ${missing.join(', ')} in ${file}.`,
      );
  }
  return manifest.version;
}

export function runtimeFloor(registry) {
  const item = registry.items.find((entry) => entry.name === 'feedback-form');
  const spec = item?.dependencies?.find((value) =>
    value.startsWith('@nocobase/app-client@'),
  );
  const range = spec?.slice('@nocobase/app-client@'.length);
  // Fail closed for unions or ranges whose minimum has not been explicitly checked.
  const floor = range?.match(
    /^(?:\^|~)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/,
  )?.[1];
  if (!floor)
    throw new Error(
      'feedback-form must declare a single exact, caret or tilde app-client version floor.',
    );
  return floor;
}

export function checkFormFeedbackPeer(registry, manifest) {
  const item = registry.items.find((entry) => entry.name === 'feedback-form');
  const spec = item?.dependencies?.find((value) =>
    value.startsWith('@nocobase/i18n@'),
  );
  const range = spec?.slice('@nocobase/i18n@'.length);
  const peer = manifest.peerDependencies?.['@nocobase/i18n'];
  // Use the runtime's declared contract verbatim, so installing the item cannot downgrade its translation context.
  if (!peer || range !== peer)
    throw new Error(
      `feedback-form must declare @nocobase/i18n@${peer ?? 'the runtime peer range'}, matching the published runtime.`,
    );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0 || result.error)
    throw new Error(
      `${command} failed while checking the published form runtime.`,
    );
  return result.stdout;
}

export function checkRelease(registryUrl = 'https://registry.npmjs.org') {
  const floor = runtimeFloor(
    JSON.parse(
      fs.readFileSync(
        path.join(repo, 'ui-library/registry/components/registry.json'),
        'utf8',
      ),
    ),
  );
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'form-feedback-release-'));
  try {
    const [packed] = JSON.parse(
      run('npm', [
        'pack',
        `@nocobase/app-client@${floor}`,
        `--registry=${registryUrl}`,
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        work,
        '--cache',
        path.join(work, 'npm-cache'),
      ]),
    );
    run('tar', ['-xzf', path.join(work, packed.filename), '-C', work]);
    const directory = path.join(work, 'package');
    checkFormFeedbackPeer(
      JSON.parse(
        fs.readFileSync(
          path.join(repo, 'ui-library/registry/components/registry.json'),
          'utf8',
        ),
      ),
      JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')),
    );
    const version = checkFormFeedbackPackage(directory);
    if (version !== floor)
      throw new Error(
        'The downloaded runtime does not match the declared floor.',
      );
    console.log(
      `Form registry release allowed: @nocobase/app-client@${version} (${packed.integrity}).`,
    );
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    checkRelease();
  } catch (error) {
    console.error(
      `Form registry release blocked: ${error.message} Publish the runtime first, then raise the feedback-form runtime dependency floor to that obtainable release before retrying.`,
    );
    process.exitCode = 1;
  }
}
