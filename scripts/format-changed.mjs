import { spawnSync } from 'node:child_process';

const supportedExtension =
  /\.(?:[cm]?[jt]sx?|json5?|jsonc|mdx?|ya?ml|css|scss|less|html|astro)$/u;
const mode = process.argv[2];

if (mode !== '--check' && mode !== '--write') {
  console.error('Usage: node scripts/format-changed.mjs --check|--write');
  process.exitCode = 2;
} else {
  const tracked = readGitPaths([
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    '-z',
    'HEAD',
  ]);
  const untracked = readGitPaths([
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z',
  ]);
  const files = [...new Set([...tracked, ...untracked])].filter((file) =>
    supportedExtension.test(file),
  );

  if (files.length === 0) {
    console.log('No changed files require formatting.');
  } else {
    const prettierMode = mode === '--check' ? '--check' : '--write';
    const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const result = spawnSync(
      pnpmCommand,
      [
        'exec',
        'prettier',
        prettierMode,
        '--ignore-path',
        '.prettierignore',
        '--',
        ...files,
      ],
      { stdio: 'inherit' },
    );

    if (result.error) {
      throw result.error;
    }
    process.exitCode = result.status ?? 1;
  }
}

function readGitPaths(args) {
  const result = spawnSync('git', args, { encoding: 'buffer' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}
