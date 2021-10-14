import execa from 'execa';

export function hasYarn() {
  return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}

function runYarn(path: string, args: string[]) {
  if (hasYarn()) {
    return execa('yarn', args, {
      cwd: path,
      stdin: 'ignore',
    });
  }

  return execa('npm', args, { cwd: path, stdin: 'ignore' });
}

export function runInstall(path) {
  return runYarn(path, ['install']);
}

export function runStart(path) {
  return runYarn(path, ['start']);
}

export function runInit(path) {
  return runYarn(path, ['nocobase', 'init']);
}
