import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { assertSerializableDefinition } from './source-serialization.js';

interface EvaluationSuccess {
  readonly ok: true;
  readonly json: string;
}

interface EvaluationFailure {
  readonly ok: false;
  readonly message: string;
}

function reply(message: EvaluationSuccess | EvaluationFailure): void {
  if (!process.send)
    throw new Error('Workflow evaluator requires an IPC channel');
  process.send(message);
}

const filePath = process.argv[2];
if (!filePath) {
  reply({ ok: false, message: 'Workflow definition path is required' });
} else {
  try {
    const loaded = (await import(
      pathToFileURL(path.resolve(filePath)).href
    )) as {
      default?: unknown;
    };
    assertSerializableDefinition(loaded.default, 'workflow');
    reply({ ok: true, json: JSON.stringify(loaded.default) });
  } catch (error) {
    reply({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
