import assert from 'node:assert/strict';
import test from 'node:test';

import {
  commandFailureJson,
  commandSuccessJson,
} from '../../packages/libs/cli-envelope/src/index.ts';
import {
  CommandError,
  describeCommandError,
} from '../../packages/app/app-cli/src/command/errors.ts';
import { unsupportedNodeVersionEnvelope } from '../../packages/libs/cli-envelope/node-guard.js';
import { InstallerError } from '../../packages/tools/app-installer/src/lib/errors.ts';
import * as installer from '../../packages/tools/app-installer/src/lib/output.ts';
import * as createApp from '../../packages/tools/create-app/src/lib/output.ts';
import * as createPlugin from '../../packages/tools/create-plugin/src/lib/output.ts';

// Every tool this repository publishes answers `--json` in the application CLI's envelope, so an agent reads
// `pnpm create @nocobase/app`, `pnpm plugin:create`, app-installer and `pnpm nocobase …` the same way. The standalone
// tools run before any application exists and cannot depend on `@nocobase/app-cli`; they and app-cli build the
// document with `@nocobase/cli-envelope`, and each keeps a thin wrapper that names its command and turns its own error
// into the envelope's. Those wrappers used to be copies, and the copies drifted. This builds the same outcomes through
// each wrapper and through the application CLI, and compares what a caller actually reads: the serialized document,
// member order included. A new standalone tool that takes `--json` belongs in `tools` below.

const printed = (envelope) => JSON.stringify(envelope);

/** One failure, raised the way each CLI raises it. */
const failure = {
  code: 'PORT_IN_USE',
  message: 'Port 13000 is already in use.',
  suggestions: [
    {
      message: 'See what holds it:',
      run: { command: 'lsof', args: ['-i', ':13000'] },
    },
    { message: 'Or choose another port with --port.' },
  ],
  details: { freePort: 13001 },
};

const tools = [
  {
    name: 'app-installer',
    command: 'install',
    statuses: ['success', 'success-noop'],
    warnings: ['a warning'],
    success: (result, status, warnings) =>
      installer.successEnvelope('install', result, warnings, status),
    failure: ({ code, message, suggestions, details }, warnings) =>
      installer.errorEnvelope(
        'install',
        new InstallerError(code, message, { suggestions, details }),
        warnings,
      ),
  },
  {
    name: 'create-app',
    command: 'create-app',
    statuses: ['success'],
    warnings: ['a warning'],
    success: (result, _status, warnings) =>
      createApp.successEnvelope(result, warnings),
    failure: (error, warnings) => createApp.failureEnvelope(error, warnings),
  },
  {
    name: 'create-plugin',
    command: 'create-plugin',
    statuses: ['success', 'success-noop'],
    // create-plugin has nothing to warn about, so its envelopes always carry an empty list.
    warnings: [],
    success: (result, status) => createPlugin.successEnvelope(result, status),
    failure: (error) => createPlugin.failureEnvelope(error),
  },
];

function appCliFailure(command, error, warnings) {
  return commandFailureJson(
    command,
    describeCommandError(
      new CommandError(error.message, {
        code: error.code,
        suggestions: error.suggestions,
        details: error.details,
      }),
    ).json,
    warnings,
  );
}

for (const tool of tools) {
  test(`${tool.name}: a success prints the application CLI's document`, () => {
    for (const status of tool.statuses) {
      assert.equal(
        printed(tool.success({ current: '1.0.0' }, status, tool.warnings)),
        printed(
          commandSuccessJson(
            tool.command,
            status,
            { current: '1.0.0' },
            tool.warnings,
          ),
        ),
      );
    }
  });

  test(`${tool.name}: a success with no result prints \`result: null\``, () => {
    assert.equal(
      printed(tool.success(undefined, 'success', tool.warnings)),
      printed(
        commandSuccessJson(tool.command, 'success', undefined, tool.warnings),
      ),
    );
  });

  test(`${tool.name}: a failure prints the application CLI's document, suggestions and details included`, () => {
    const envelope = tool.failure(failure, tool.warnings);
    assert.equal(
      printed(envelope),
      printed(appCliFailure(tool.command, failure, tool.warnings)),
    );
    assert.equal(envelope.status, 'failure');
  });

  test(`${tool.name}: a failure without details leaves \`details\` out`, () => {
    const withoutDetails = { ...failure, details: undefined };
    assert.equal(
      printed(tool.failure(withoutDetails, tool.warnings)),
      printed(appCliFailure(tool.command, withoutDetails, tool.warnings)),
    );
  });
}

// Every tool's `bin/run.js` runs the same guard, which spells its document out because it cannot import the builder;
// the one comparison that matters is with the application CLI's failure document, and one is enough.
test("the Node.js guard answers in the application CLI's failure envelope", () => {
  const guard = unsupportedNodeVersionEnvelope('install', 'v22.0.0');
  assert.equal(
    printed(guard),
    printed(appCliFailure('install', guard.error, [])),
  );
  assert.equal(guard.error.code, 'NODE_UNSUPPORTED');
});

test("app-installer: an unexpected error prints the application CLI's document", () => {
  const error = new Error('Something broke.');
  assert.equal(
    printed(installer.errorEnvelope('status', error, [])),
    printed(commandFailureJson('status', describeCommandError(error).json, [])),
  );
});
