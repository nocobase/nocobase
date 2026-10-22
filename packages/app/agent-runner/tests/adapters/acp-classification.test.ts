import { RequestError } from '@agentclientprotocol/sdk';
import { expect, it } from 'vitest';
import {
  classifyHandshakeFailure,
  runFailureMessage,
  statusDetailOf,
} from '../../src/agent/adapters/acp.ts';

it('classifies an auth-required error as needing login', () => {
  const error = new RequestError(-32000, 'Authentication required');
  expect(classifyHandshakeFailure(error)).toEqual({
    status: 'needsLogin',
    reason: 'notLoggedIn',
  });
});

it('classifies an unsupported ACP protocol version as a tool too old for this integration', () => {
  const error = new Error(
    'The agent selected an unsupported ACP protocol version.',
  );
  expect(classifyHandshakeFailure(error)).toEqual({
    status: 'failed',
    reason: 'versionTooOld',
  });
});

it('classifies a handshake timeout as detection timing out', () => {
  const error = new Error('The agent did not answer within 30 seconds.');
  expect(classifyHandshakeFailure(error)).toEqual({
    status: 'failed',
    reason: 'timeout',
  });
});

it('classifies a missing-provider style message as not configured', () => {
  const error = new Error('No provider is set for this agent.');
  expect(classifyHandshakeFailure(error)).toEqual({
    status: 'failed',
    reason: 'notConfigured',
  });
});

it('falls back to a generic start failure for anything else, still bringing a reason', () => {
  const error = new Error('Something unexpected happened.');
  expect(classifyHandshakeFailure(error)).toEqual({
    status: 'failed',
    reason: 'startFailed',
  });
});

it('redacts and bounds a detection status detail, dropping an empty result', () => {
  expect(statusDetailOf('plain text')).toBe('plain text');
  expect(statusDetailOf('')).toBeUndefined();
  expect(statusDetailOf('a'.repeat(1000))!.length).toBe(300);
  expect(statusDetailOf('line one\nline two')).not.toContain('\n');
});

it('keeps a run failure’s own message, falling back only when there is nothing to keep', () => {
  expect(
    runFailureMessage(new Error('Provider returned 401'), 'fallback'),
  ).toBe('Provider returned 401');
  expect(runFailureMessage('not an Error object', 'fallback')).toBe(
    'not an Error object',
  );
  expect(runFailureMessage(new Error(''), 'fallback')).toBe('fallback');
});
