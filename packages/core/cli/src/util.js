const { spawn } = require('child_process');
const BufferList = require('bl');

exports.isDev = function isDev() {
  return process.env.NOCOBASE_ENV !== 'production';
}

function spawnAsync(...args) {
  const child = spawn(...args);
  const stdout = child.stdout ? new BufferList() : '';
  const stderr = child.stderr ? new BufferList() : '';

  if (child.stdout) {
    child.stdout.on('data', (data) => {
      stdout.append(data);
    });
  }

  if (child.stderr) {
    child.stderr.on('data', (data) => {
      stderr.append(data);
    });
  }

  const promise = new Promise((resolve, reject) => {
    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const err = new Error(`child exited with code ${code}`);
        err.code = code;
        err.stderr = stderr;
        err.stdout = stdout;
        reject(err);
      }
    });
  });

  promise.child = child;

  return promise;
};

function runAsync(command, argv, options = {}) {
  return spawnAsync(command, argv, {
    shell: true,
    stdio: 'inherit',
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
  });
};

function run(command, argv, options = {}) {
  return spawn(command, argv, {
    shell: true,
    stdio: 'inherit',
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
  });
};

exports.spawnAsync = spawnAsync;
exports.run = run;
exports.runAsync = runAsync;
