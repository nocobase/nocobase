const { parentPort, workerData } = require('node:worker_threads');
const { Script } = require('node:vm');
const Path = require('node:path');

let timer = null;

function customRequire(m) {
  const configuredModules = (process.env.WORKFLOW_SCRIPT_MODULES?.split(',') ?? []).filter(Boolean);
  let mainName;
  if (m.startsWith('/')) {
    // absolute path
    mainName = m;
  } else if (m.startsWith('.')) {
    // relative path
    mainName = m;
    m = Path.resolve(process.cwd(), m);
  } else {
    mainName = m
      .split('/')
      .slice(0, m.startsWith('@') ? 2 : 1)
      .join('/');
  }
  if (configuredModules.includes(mainName)) {
    return require(m);
  }
  throw new Error(`module "${m}" not supported`);
}
customRequire.constructor = null;

function createSafeConsole(originalConsole) {
  const safe = Object.create(null);
  Object.defineProperty(safe, 'constructor', {
    value: null,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  const allKeys = Reflect.ownKeys(originalConsole);
  for (const key of allKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(originalConsole, key);
    if (!descriptor) {
      continue;
    }

    const wrap = (fn) => {
      const bound = fn.bind(originalConsole);
      Object.defineProperty(bound, 'constructor', {
        value: null,
        writable: false,
        enumerable: false,
        configurable: false,
      });
      return bound;
    };

    if (typeof descriptor.value === 'function') {
      descriptor.value = wrap(descriptor.value);
    }
    if (typeof descriptor.get === 'function') {
      descriptor.get = wrap(descriptor.get);
    }
    if (typeof descriptor.set === 'function') {
      descriptor.set = wrap(descriptor.set);
    }

    descriptor.configurable = false;

    Object.defineProperty(safe, key, descriptor);
  }

  return Object.freeze(safe);
}

async function main() {
  const { source, args = {}, options = {} } = workerData;
  const code = `
    this.constructor = null;
    async function __main() {
      ${source}
    }
    __main();
  `;
  const script = new Script(code);
  const context = {
    ...args,
    require: customRequire,
    console: createSafeConsole(console),
  };

  if (options.timeout) {
    timer = setTimeout(() => {
      throw new Error(`Script execution timed out after ${options.timeout}ms`);
    }, options.timeout);
  }

  const result = script.runInNewContext(context, { timeout: options.timeout });

  return result;
}

// eslint-disable-next-line promise/catch-or-return
main()
  .then((result) => {
    parentPort.postMessage({ type: 'result', result });
    // NOTE: due to `process.exit()` will break stdout, it should not be called
    // see: https://nodejs.org/api/process.html#processexitcode
  })
  .catch((error) => {
    throw error;
  })
  .finally(() => {
    clearTimeout(timer);
    timer = null;
  });
