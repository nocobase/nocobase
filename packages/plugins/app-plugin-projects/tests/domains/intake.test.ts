// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createAttachmentStorage,
  type FileDisks,
  type FileUploader,
} from '../../server/domains/attachments/index.js';
import {
  createIntakeFileStore,
  createIntakeService,
  type IntakeService,
} from '../../server/domains/intake/index.js';
import {
  outlineText,
  readIntakeTexts,
} from '../../server/domains/intake/intake.text.js';
import { createHarness, type Harness } from '../harness.js';

describe('intake file text', () => {
  it('writes an extracted outline back as headings and indented lists', () => {
    expect(
      outlineText([
        { type: 'heading', text: 'Plan', metadata: { level: 1 } },
        { type: 'list', text: 'One', metadata: { indentation: 0 } },
        { type: 'list', text: 'Two', metadata: { indentation: 1 } },
        { type: 'paragraph', text: 'Notes' },
        {
          type: 'sheet',
          children: [
            {
              type: 'row',
              children: [{ type: 'cell', text: 'title' }],
            },
            { type: 'row', children: [{ type: 'cell', text: 'Row a' }] },
          ],
        },
      ]),
    ).toBe('# Plan\n- One\n  - Two\n\nNotes\n\ntitle\nRow a');
  });

  it('reads text files, extracts office files and names the rest', async () => {
    const file = (id: string, ext: string, mimeType = '') => ({
      id,
      filename: `${id}.${ext}`,
      ext,
      mimeType,
    });
    const texts = await readIntakeTexts(
      [
        file('notes', 'md', 'text/markdown'),
        file('spec', 'docx'),
        file('photo', 'png', 'image/png'),
        file('old', 'doc'),
        file('broken', 'pdf'),
      ],
      {
        load: (source) =>
          Promise.resolve(new TextEncoder().encode(`# ${source.id}\n- item`)),
        extract: (bytes) => {
          const text = new TextDecoder().decode(bytes);
          return text.includes('broken')
            ? Promise.reject(new Error('bad'))
            : Promise.resolve(`${text} from docx`);
        },
        perFileChars: 100,
      },
    );
    expect(texts.documents.map((document) => document.text)).toEqual([
      '# notes\n- item',
      '# spec\n- item from docx',
    ]);
    expect(texts.reads.map((read) => read.state)).toEqual([
      'read',
      'read',
      'image',
      'legacy',
      'failed',
    ]);
  });

  it('cuts files at the character budget', async () => {
    const texts = await readIntakeTexts(
      [1, 2].map((n) => ({
        id: `f${n}`,
        filename: `f${n}.txt`,
        ext: 'txt',
        mimeType: 'text/plain',
      })),
      {
        load: () => Promise.resolve(new TextEncoder().encode('x'.repeat(30))),
        perFileChars: 20,
        totalChars: 20,
      },
    );
    expect(texts.reads.map((read) => [read.state, read.chars])).toEqual([
      ['truncated', 20],
      ['skipped', 0],
    ]);
  });
});

describe('rows from drafts', () => {});

describe('the intake service', () => {
  let h: Harness;
  let intake: IntakeService;
  const stored = new Map<string, Uint8Array>();
  const unreadable = new Set<string>();

  beforeEach(async () => {
    unreadable.clear();
    h = await createHarness();
    await h.addUser('alice');
    await h.addUser('bob');
    // The file plugin's upload, as far as this test needs it: the metadata row, and the bytes in memory.
    const uploader: FileUploader = {
      repository: (collection, options) => ({
        async uploadOne({ file }) {
          const id = crypto.randomUUID();
          const ext = file.name.split('.').pop() ?? '';
          const now = new Date().toISOString();
          stored.set(id, new Uint8Array(await file.arrayBuffer()));
          await h.database
            .connection()
            .repository(collection)
            .createOne({
              values: {
                id,
                disk: options.disk,
                key: id,
                filename: file.name,
                ext,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                ...options.policy.create.defaults,
                createdAt: now,
                updatedAt: now,
              },
            });
          return { record: { id } };
        },
      }),
    };
    const disks: FileDisks = {
      // Drive's own method name, not a hook.
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      use: () => ({
        getBytes: (key) =>
          unreadable.has(key)
            ? Promise.reject(new Error('File storage is unavailable.'))
            : Promise.resolve(stored.get(key) ?? new Uint8Array()),
        getStream: () => Promise.reject(new Error('Not read as a stream.')),
        delete: (key) => {
          stored.delete(key);
          return Promise.resolve();
        },
      }),
    };
    intake = createIntakeService({
      files: createIntakeFileStore({
        conn: () => h.database.connection(),
        storage: createAttachmentStorage({
          disk: () => 'local',
          uploader: () => uploader,
          disks: () => disks,
        }),
      }),
    });
  });
  afterEach(() => h.close());

  it('hands over the text of the caller’s own files without splitting', async () => {
    const file = await intake.upload(
      h.viewer('alice'),
      new File(['# 需求\n- 第一项'], 'notes.md', { type: 'text/markdown' }),
    );
    const image = await intake.upload(
      h.viewer('alice'),
      new File([new Uint8Array([1, 2])], 'shot.png', { type: 'image/png' }),
    );
    const result = await intake.texts(h.viewer('alice'), {
      fileIds: [file.id, image.id],
    });
    expect(result.documents).toEqual([
      { fileId: file.id, filename: 'notes.md', text: '# 需求\n- 第一项' },
    ]);
    expect(result.files.map((read) => read.state)).toEqual(['read', 'image']);
    await expect(
      intake.texts(h.viewer('bob'), { fileIds: [file.id] }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
  });

  it('extracts complete TXT bodies in selected order and excludes a removed upload', async () => {
    const files = [];
    for (const n of [1, 2, 3]) {
      files.push(
        await intake.upload(
          h.viewer('alice'),
          new File(
            [`PM307-CHECK-${n}: Filter tasks by owner ${n}.`],
            `notes-${n}.txt`,
            { type: 'text/plain' },
          ),
        ),
      );
    }
    await intake.removeFile(h.viewer('alice'), files[1]!.id);
    const selected = [files[2]!, files[0]!];
    const result = await intake.texts(h.viewer('alice'), {
      fileIds: selected.map((file) => file.id),
    });
    expect(result.documents.map((file) => file.text)).toEqual([
      'PM307-CHECK-3: Filter tasks by owner 3.',
      'PM307-CHECK-1: Filter tasks by owner 1.',
    ]);
    expect(result.files.map((file) => file.state)).toEqual(['read', 'read']);
    await expect(
      intake.texts(h.viewer('alice'), { fileIds: [files[1]!.id] }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
    expect(await intake.texts(h.viewer('alice'), { fileIds: [] })).toEqual({
      documents: [],
      files: [],
    });
  });

  it('reports truncation of an ordinary TXT upload before handing it to the browser', async () => {
    const file = await intake.upload(
      h.viewer('alice'),
      new File([`${'x'.repeat(20_000)}PM307-TAIL: Owner filter`], 'notes.txt', {
        type: 'text/plain',
      }),
    );
    const result = await intake.texts(h.viewer('alice'), {
      fileIds: [file.id],
    });
    expect(result.files).toMatchObject([
      { fileId: file.id, state: 'truncated', chars: 20_000 },
    ]);
    expect(result.documents[0]?.text).not.toContain('PM307-TAIL');
  });

  it('fully extracts three supported TXT uploads whose combined bodies exceed a chat message', async () => {
    const files = [];
    for (const n of [1, 2, 3]) {
      files.push(
        await intake.upload(
          h.viewer('alice'),
          new File([`${'x'.repeat(19_980)}PM307-END-${n}`], `notes-${n}.txt`, {
            type: 'text/plain',
          }),
        ),
      );
    }
    const result = await intake.texts(h.viewer('alice'), {
      fileIds: files.map((file) => file.id),
    });
    expect(result.files.map((file) => file.state)).toEqual([
      'read',
      'read',
      'read',
    ]);
    expect(result.documents.map((file) => file.text.slice(-11))).toEqual([
      'PM307-END-1',
      'PM307-END-2',
      'PM307-END-3',
    ]);
    expect(
      result.documents.reduce((sum, file) => sum + file.text.length, 0),
    ).toBeGreaterThan(50_000);
  });

  it('returns a failed reading outcome for a supported TXT whose stored bytes cannot be loaded', async () => {
    const file = await intake.upload(
      h.viewer('alice'),
      new File(['PM307-STORAGE: Owner filter'], 'notes.txt', {
        type: 'text/plain',
      }),
    );
    unreadable.add(file.id);
    const result = await intake.texts(h.viewer('alice'), {
      fileIds: [file.id],
    });
    expect(result.documents).toEqual([]);
    expect(result.files).toMatchObject([
      { fileId: file.id, filename: 'notes.txt', state: 'failed', chars: 0 },
    ]);
  });
});
