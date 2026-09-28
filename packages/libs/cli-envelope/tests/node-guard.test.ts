import { describe, expect, it } from 'vitest';
import {
  MINIMUM_NODE_MAJOR_VERSION,
  commandFromArgv,
  formatUnsupportedNodeVersionMessage,
  getNodeMajorVersion,
  isSupportedNodeVersion,
  unsupportedNodeVersionEnvelope,
  unsupportedNodeVersionOutput,
} from '../node-guard.js';
import { commandFailureJson } from '../src/index.ts';

describe('getNodeMajorVersion', () => {
  it('reads the major version with or without a leading v', () => {
    expect(getNodeMajorVersion('v24.13.0')).toBe(24);
    expect(getNodeMajorVersion('24.13.0')).toBe(24);
  });

  it('returns NaN for something that is not a version', () => {
    expect(getNodeMajorVersion('')).toBeNaN();
    expect(getNodeMajorVersion('unknown')).toBeNaN();
  });
});

describe('isSupportedNodeVersion', () => {
  it('requires the Node version the packages declare in engines', () => {
    expect(MINIMUM_NODE_MAJOR_VERSION).toBe(24);
    expect(isSupportedNodeVersion('v23.11.0')).toBe(false);
    expect(isSupportedNodeVersion('v24.0.0')).toBe(true);
    expect(isSupportedNodeVersion('v25.0.0')).toBe(true);
    expect(isSupportedNodeVersion('v22.0.0', 22)).toBe(true);
  });

  it('treats an unreadable version as unsupported rather than assuming the best', () => {
    expect(isSupportedNodeVersion('unknown')).toBe(false);
  });

  it('accepts the Node running these tests', () => {
    expect(isSupportedNodeVersion()).toBe(true);
  });
});

describe('formatUnsupportedNodeVersionMessage', () => {
  it('names the tool, the required version and the one in use', () => {
    const message = formatUnsupportedNodeVersionMessage(
      'create-app',
      'v20.0.0',
    );
    expect(message).toBe(
      '[create-app]: Node.js 24 or later is required.\n[create-app]: Current version is v20.0.0. Install Node.js 24+ and try again.',
    );
  });

  it('says the version is unknown instead of printing an empty gap', () => {
    expect(formatUnsupportedNodeVersionMessage('nocobase', '')).toContain(
      'unknown',
    );
  });
});

describe('unsupportedNodeVersionEnvelope', () => {
  // The guard spells the document out because it cannot import the builder; this is what keeps the two the same.
  it('is the failure document commandFailureJson builds, member for member', () => {
    const guard = unsupportedNodeVersionEnvelope('install', 'v22.0.0');
    expect(JSON.stringify(guard)).toBe(
      JSON.stringify(commandFailureJson('install', guard.error, [])),
    );
    expect(guard).toEqual({
      schemaVersion: 1,
      ok: false,
      command: 'install',
      status: 'failure',
      error: {
        code: 'NODE_UNSUPPORTED',
        message:
          'Node.js 24 or later is required; the current version is v22.0.0.',
        suggestions: [
          {
            message: 'Install Node.js 24 or later, then run the command again.',
          },
        ],
      },
      warnings: [],
    });
  });

  it('reports an unreadable version as unknown', () => {
    expect(unsupportedNodeVersionEnvelope('install', '').error.message).toBe(
      'Node.js 24 or later is required; the current version is unknown.',
    );
  });
});

describe('commandFromArgv', () => {
  it('joins the arguments before the first flag, positionals included', () => {
    expect(commandFromArgv(['db', 'apply', '--json'])).toBe('db apply');
    expect(commandFromArgv(['install', '/srv/hub', '--json'])).toBe(
      'install /srv/hub',
    );
    expect(commandFromArgv(['status'])).toBe('status');
  });

  it('names nothing when a flag comes first, rather than taking its value', () => {
    expect(commandFromArgv(['--dir', '/srv/hub', 'status', '--json'])).toBe('');
    expect(commandFromArgv(['--version', '--json'])).toBe('');
    expect(commandFromArgv([])).toBe('');
  });
});

describe('unsupportedNodeVersionOutput', () => {
  it('names the command from argv unless the tool names one', () => {
    const output = (argv: readonly string[], command?: string) =>
      JSON.parse(
        unsupportedNodeVersionOutput({
          name: 'nocobase',
          argv,
          command,
          version: 'v22.0.0',
        }).text,
      ) as { command: string };
    expect(output(['db', 'apply', '--json']).command).toBe('db apply');
    expect(output(['--dir', '/srv/hub', 'status', '--json']).command).toBe('');
    expect(output(['crm', '--json'], 'create-app').command).toBe('create-app');
  });

  it('prints the document on stdout under --json, one line unless indented', () => {
    const options = {
      name: 'create-app',
      command: 'create-app',
      argv: ['crm', '--json'],
      version: 'v22.0.0',
    };
    expect(unsupportedNodeVersionOutput(options)).toEqual({
      stream: 'stdout',
      text: JSON.stringify(
        unsupportedNodeVersionEnvelope('create-app', 'v22.0.0'),
      ),
    });
    expect(unsupportedNodeVersionOutput({ ...options, indent: 2 }).text).toBe(
      JSON.stringify(
        unsupportedNodeVersionEnvelope('create-app', 'v22.0.0'),
        null,
        2,
      ),
    );
  });

  it('prints the message on stderr otherwise', () => {
    expect(
      unsupportedNodeVersionOutput({
        name: 'create-app',
        command: 'create-app',
        argv: ['crm'],
        version: 'v22.0.0',
      }),
    ).toEqual({
      stream: 'stderr',
      text: formatUnsupportedNodeVersionMessage('create-app', 'v22.0.0'),
    });
  });
});
