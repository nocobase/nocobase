import { describe, expect, it } from 'vitest';
import type { ModelMessage } from 'ai';
import { nativeInputParts } from '../server/online-agent/input.js';

describe('background SDK input normalization', () => {
  type FilePart = Extract<
    Exclude<Extract<ModelMessage, { role: 'user' }>['content'], string>[number],
    { type: 'file' }
  >;
  const file = (data: FilePart['data']) =>
    nativeInputParts({
      role: 'user',
      content: [{ type: 'file', mediaType: 'text/plain', data }],
    })[0];
  it.each<[string, FilePart['data'], string]>([
    ['bare base64', 'QUI=', 'data:text/plain;base64,QUI='],
    ['data URL', 'data:text/plain;base64,QUI=', 'data:text/plain;base64,QUI='],
    ['provider URI string', 'gs://bucket/file.txt', 'gs://bucket/file.txt'],
    [
      'provider URI object',
      new URL('gs://bucket/file.txt'),
      'gs://bucket/file.txt',
    ],
    [
      'HTTP string',
      'https://example.test/file.txt',
      'https://example.test/file.txt',
    ],
    [
      'URL object',
      new URL('https://example.test/file.txt'),
      'https://example.test/file.txt',
    ],
    ['bytes', new Uint8Array([65, 66]), 'data:text/plain;base64,QUI='],
    [
      'array buffer',
      new Uint8Array([65, 66]).buffer,
      'data:text/plain;base64,QUI=',
    ],
    [
      'tagged URL',
      { type: 'url', url: new URL('https://example.test/file.txt') },
      'https://example.test/file.txt',
    ],
    [
      'tagged base64',
      { type: 'data', data: 'QUI=' },
      'data:text/plain;base64,QUI=',
    ],
    [
      'tagged text',
      { type: 'text', text: 'AB' },
      'data:text/plain;base64,QUI=',
    ],
  ])('normalizes %s without corrupting its payload', (_name, data, url) => {
    expect(file(data)).toEqual({ type: 'file', mediaType: 'text/plain', url });
  });
  it('rejects a data URL inside explicitly tagged inline data like the SDK', () => {
    expect(() =>
      file({ type: 'data', data: 'data:text/plain;base64,QUI=' }),
    ).toThrow('Data URLs must use a URL input');
  });
  it('retains provider references privately instead of inventing a file URL', () => {
    expect(
      file({ type: 'reference', reference: { fixture: 'file-1' } }),
    ).toEqual({
      type: 'file',
      mediaType: 'text/plain',
      url: '',
      providerReference: { fixture: 'file-1' },
    });
  });
});
