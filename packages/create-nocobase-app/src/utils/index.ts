import execa from "execa";

export function hasYarn() {
  try {
    const { exitCode } = execa.sync('yarn --version', { shell: true });

    if (exitCode === 0) return true;
    return false;
  } catch (err) {
    return false;
  }
}

export function runInstall(path) {
  if (hasYarn()) {
    return execa('yarn', ['install'], {
      cwd: path,
      stdin: 'ignore',
    });
  }

  return execa('npm', ['install'], { cwd: path, stdin: 'ignore' });
}

export function runStart(path) {
  if (hasYarn()) {
    return execa('yarn', ['start'], {
      cwd: path,
      stdin: 'ignore',
    });
  }

  return execa('npm', ['start'], { cwd: path, stdin: 'ignore' });
}

export function runInit(path) {
  if (hasYarn()) {
    return execa('yarn', ['nocobase', 'init'], {
      cwd: path,
      stdin: 'ignore',
    });
  }

  return execa('npm', ['nocobase', 'init'], { cwd: path, stdin: 'ignore' });
}
