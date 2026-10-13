import type { ImapFlow, MessageStructureObject } from 'imapflow';
import { describe, expect, it, vi } from 'vitest';
import {
  rawComparable,
  readRawSource,
} from '../../server/adapters/imap-smtp/content.js';
import { validateImapLocation } from '../../server/store/message-writes.js';

describe('IMAP MIME evidence', () => {
  it.each([
    undefined,
    { type: 'multipart/mixed' },
    { type: 'multipart/mixed', childNodes: [] },
    {
      type: 'multipart/mixed',
      disposition: 'attachment',
      childNodes: [{ type: 'text/plain' }],
    },
    {
      type: 'multipart/related',
      id: '<cid>',
      childNodes: [{ type: 'text/html' }],
    },
    { type: 'multipart/mixed', childNodes: [{ type: 'message/rfc822' }] },
    {
      type: 'multipart/mixed',
      childNodes: [{ type: 'text/plain' }, { type: 'application/pdf' }],
    },
    { type: 'text/html', id: '<cid>' },
    { type: 'text/plain', parameters: { name: 'file.txt' } },
    {
      type: 'multipart/mixed',
      dispositionParameters: { filename: 'file.eml' },
      childNodes: [{ type: 'text/plain' }],
    },
  ])(
    'rejects incomplete or attachment-bearing structures before raw reads: %j',
    (structure) => {
      expect(
        rawComparable(
          structure as MessageStructureObject | undefined,
          100,
          2 * 1024 * 1024,
        ),
      ).toBe(false);
    },
  );

  it('accepts a complete tree only within the single-message budget', () => {
    const structure = {
      type: 'multipart/alternative',
      childNodes: [{ type: 'text/plain' }, { type: 'text/html' }],
    } as MessageStructureObject;
    expect(rawComparable(structure, 2 * 1024 * 1024, 2 * 1024 * 1024)).toBe(
      true,
    );
    expect(rawComparable(structure, 2 * 1024 * 1024 + 1, 2 * 1024 * 1024)).toBe(
      false,
    );
  });

  it('reads exact windows and independently probes an empty end window', async () => {
    const raw = Buffer.alloc(1024 * 1024 + 3, 97);
    const fetchOne = vi.fn(async (_uid, query) => ({
      uid: _uid,
      partialOrigins: new Map([['', query.source.start]]),
      source: raw.subarray(
        query.source.start,
        query.source.start + query.source.maxLength,
      ),
    }));
    const result = await readRawSource(
      { fetchOne } as unknown as ImapFlow,
      1,
      raw.length,
    );
    expect(result?.equals(raw)).toBe(true);
    expect(fetchOne.mock.calls.map(([, query]) => query.source)).toEqual([
      { start: 0, maxLength: 1024 * 1024 },
      { start: 1024 * 1024, maxLength: 3 },
      { start: raw.length, maxLength: 1 },
    ]);
  });

  it.each([
    'short',
    'extra',
    'missing',
    'ignored-offset',
    'wrong-origin',
    'missing-origin',
    'wrong-uid',
  ])('rejects incomplete source responses: %s', async (failure) => {
    const fetchOne = vi.fn(async (_uid, query) => {
      const base = {
        uid: failure === 'wrong-uid' ? 2 : _uid,
        partialOrigins:
          failure === 'missing-origin'
            ? undefined
            : new Map([
                ['', failure === 'wrong-origin' ? 1 : query.source.start],
              ]),
      };
      if (failure === 'missing') return false;
      if (failure === 'short')
        return { ...base, source: Buffer.alloc(query.source.maxLength - 1) };
      if (failure === 'extra' && query.source.start === 4)
        return { ...base, source: Buffer.from('x') };
      if (failure === 'ignored-offset')
        return { ...base, source: Buffer.from('abcd') };
      return {
        ...base,
        source: Buffer.from('abcd').subarray(
          query.source.start,
          query.source.start + query.source.maxLength,
        ),
      };
    });
    expect(
      await readRawSource({ fetchOne } as unknown as ImapFlow, 1, 4),
    ).toBeUndefined();
  });
});

describe('IMAP application write boundary', () => {
  it.each([0, -1, 4294967296, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid UID %s',
    (uid) => {
      expect(() =>
        validateImapLocation(
          { folder: 'INBOX', uidValidity: '1', uid },
          'objectid',
        ),
      ).toThrow();
    },
  );
  it.each(['0', '01', '-1', '1.0', '4294967296', '1e2', ''])(
    'rejects noncanonical UIDVALIDITY %s',
    (uidValidity) => {
      expect(() =>
        validateImapLocation(
          { folder: 'INBOX', uidValidity, uid: 1 },
          'objectid',
        ),
      ).toThrow();
    },
  );
  it('accepts the uint32 upper bound and rejects invalid sources and oversized folders', () => {
    expect(() =>
      validateImapLocation(
        { folder: 'INBOX', uidValidity: '4294967295', uid: 4294967295 },
        'objectid',
      ),
    ).not.toThrow();
    expect(() =>
      validateImapLocation(
        { folder: 'INBOX', uidValidity: '1', uid: 1 },
        'invalid' as 'objectid',
      ),
    ).toThrow();
    expect(() =>
      validateImapLocation(
        { folder: 'x'.repeat(501), uidValidity: '1', uid: 1 },
        'objectid',
      ),
    ).toThrow();
  });
});
