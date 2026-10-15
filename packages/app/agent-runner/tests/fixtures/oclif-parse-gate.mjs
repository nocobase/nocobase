import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context);
    if (url.endsWith('/@oclif/core/lib/parser/parse.js')) {
      const source = String(result.source).replace(
        'const readStdin = async () => {',
        "const readStdin = async () => {\n    if (process.env.NOCOBASE_RUNNER_TEST_PARSE_GATE === '1' && !globalThis.__nocobaseRunnerStdinGateUsed) {\n        globalThis.__nocobaseRunnerStdinGateUsed = true;\n        const fs = require('node:fs');\n        fs.writeSync(3, 'stdin-read-start');\n        fs.readSync(3, Buffer.alloc(1), 0, 1, null);\n    }",
      );
      return { ...result, source };
    }
    if (url.endsWith('/agent-runner/src/commands/env.ts')) {
      const source = String(result.source).replace(
        'async function readStdin(): Promise<string> {',
        "async function readStdin(): Promise<string> {\n  if (process.env.NOCOBASE_RUNNER_TEST_PARSE_GATE === '1' && !globalThis.__nocobaseRunnerStdinGateUsed) {\n    globalThis.__nocobaseRunnerStdinGateUsed = true;\n    const gateFs = await import('node:fs');\n    gateFs.writeSync(3, 'stdin-read-start');\n    gateFs.readSync(3, Buffer.alloc(1), 0, 1, null);\n  }",
      );
      return { ...result, source };
    }
    return result;
  },
});
