const execa = require('execa');

function hasYarn() {
  return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}

function runYarn(path, args) {
  if (hasYarn()) {
    return execa('yarn', args, {
      cwd: path,
      stdin: 'ignore',
    });
  }

  return execa('npm', args, { cwd: path, stdin: 'ignore' });
}

function runInstall(path) {
  return runYarn(path, ['install']);
}

function runStart(path) {
  return runYarn(path, ['run', 'start']);
}

function runInit(path, args = []) {
  if (!hasYarn()) {
    args.unshift('--');
  }
  console.log('run init', args);
  return runYarn(path, ['run', 'nocobase', 'init', ...args]);
}

module.exports = {
  runInit,
  runStart,
  runInstall,
  hasYarn,
};
