// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { IssueCreateParams } from '../../shared/plans.js';
import {
  createAttachmentStorage,
  type FileDisks,
  type FileUploader,
} from '../../server/domains/attachments/index.js';
import {
  createIntakeFileStore,
  createIntakeService,
  type IntakeService,
} from '../../server/domains/plans/intake/index.js';
import {
  extractMarkers,
  parseIntake,
} from '../../server/domains/plans/intake/intake.parser.js';
import { rowsFromDrafts } from '../../server/domains/plans/intake/intake.service.js';
import {
  outlineText,
  readIntakeTexts,
} from '../../server/domains/plans/intake/intake.text.js';
import { createHarness, type Harness } from '../harness.js';

describe('the intake rule parser', () => {
  it('makes headings parents, list items their children and nested items grandchildren', () => {
    const drafts = parseIntake(
      [
        '# 登录改版',
        '- 设计表单 [high] #frontend',
        '  - 校验邮箱 @stage2',
        '- 限制尝试次数 !',
        '',
        '## 报表',
        '1. 导出 CSV',
      ].join('\n'),
    );
    expect(
      drafts.map((draft) => [
        draft.position,
        draft.parentPosition,
        draft.title,
      ]),
    ).toEqual([
      [1, null, '登录改版'],
      [2, 1, '设计表单'],
      [3, 2, '校验邮箱'],
      [4, 1, '限制尝试次数'],
      [5, null, '报表'],
      [6, 5, '导出 CSV'],
    ]);
    expect(drafts[1]).toMatchObject({ priority: 'high', labels: ['frontend'] });
    expect(drafts[2]).toMatchObject({ stage: 2 });
    expect(drafts[3]).toMatchObject({ priority: 'high' });
  });

  it('reads markers out of a title', () => {
    expect(extractMarkers('[x] Fix it !! #bug #ui (stage 3)')).toEqual({
      title: 'Fix it',
      priority: 'urgent',
      labels: ['bug', 'ui'],
      stage: 3,
    });
    expect(extractMarkers('a '.repeat(150)).overflow).toBeDefined();
  });

  it('keeps a stage only on sub-issues and continues descriptions', () => {
    const drafts = parseIntake(
      ['- Top @stage2', '  more about top', '', 'Para title', 'para body'].join(
        '\n',
      ),
    );
    expect(drafts[0]).toEqual({
      position: 1,
      parentPosition: null,
      title: 'Top',
      labels: [],
      description: 'more about top',
    });
    expect(drafts[1]).toMatchObject({
      title: 'Para title',
      description: 'para body',
    });
  });

  it('reads CSV by column, with Chinese headers and parents by title', () => {
    const drafts = parseIntake(
      [
        '标题,描述,优先级,标签,父任务,阶段',
        'Parent,the parent,高,a;b,,',
        '"Child, one",,low,,parent,2',
      ].join('\n'),
    );
    expect(drafts).toEqual([
      {
        position: 1,
        parentPosition: null,
        title: 'Parent',
        description: 'the parent',
        priority: 'high',
        labels: ['a', 'b'],
      },
      {
        position: 2,
        parentPosition: 1,
        title: 'Child, one',
        priority: 'low',
        labels: [],
        stage: 2,
      },
    ]);
  });
});

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

describe('rows from drafts', () => {
  it('joins sources, points parents at earlier rows and maps existing labels', () => {
    const result = rowsFromDrafts(
      [
        { drafts: parseIntake('# A #Bug\n- B #nope') },
        { drafts: parseIntake('- C') },
      ],
      {
        projectId: 'p1',
        labels: [{ id: 'l1', name: 'bug', color: 'red' }],
      },
    );
    expect(result.rows).toEqual([
      {
        op: 'issue.create',
        ref: 'r1',
        params: { title: 'A', projectId: 'p1', labelIds: ['l1'] },
      },
      {
        op: 'issue.create',
        ref: 'r2',
        params: { title: 'B', projectId: 'p1', parentIssueId: { ref: 'r1' } },
      },
      {
        op: 'issue.create',
        ref: 'r3',
        params: { title: 'C', projectId: 'p1' },
      },
    ]);
    expect(result.unknownLabels).toEqual(['nope']);
  });

  it('keeps at most 50 rows and counts the rest', () => {
    const text = Array.from({ length: 60 }, (_, n) => `- item ${n}`).join('\n');
    const result = rowsFromDrafts([{ drafts: parseIntake(text) }], {
      projectId: null,
      labels: [],
    });
    expect(result.rows).toHaveLength(50);
    expect(result.dropped).toBe(10);
  });
});

describe('the intake service', () => {
  let h: Harness;
  let intake: IntakeService;
  const stored = new Map<string, Uint8Array>();

  beforeEach(async () => {
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
        getBytes: (key) => Promise.resolve(stored.get(key) ?? new Uint8Array()),
        getStream: () => Promise.reject(new Error('Not read as a stream.')),
        delete: (key) => {
          stored.delete(key);
          return Promise.resolve();
        },
      }),
    };
    intake = createIntakeService({
      plans: h.services.plans,
      labels: () => h.services.labels.list(),
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

  it('stores a pending plan of the split issues, decided by the caller', async () => {
    const result = await intake.split(h.viewer('alice'), {
      text: '# Release\n- Write notes !\n- Tag it',
    });
    expect(result.plan).toMatchObject({
      status: 'pending',
      title: 'Release',
      deciderUserId: 'alice',
      source: { kind: 'intake', data: { fileIds: [], projectId: null } },
    });
    expect(result.plan?.rows.map((row) => row.op)).toEqual([
      'issue.create',
      'issue.create',
      'issue.create',
    ]);
    const executed = await h.services.plans.execute(
      h.viewer('alice'),
      result.plan?.id ?? '',
      { revision: result.plan?.revision ?? 0 },
    );
    expect(executed.status).toBe('executed');
  });

  it('reads the caller’s own files, and refuses anyone else’s', async () => {
    const file = await intake.upload(
      h.viewer('alice'),
      new File(['# From file\n- Child'], 'notes.md', { type: 'text/markdown' }),
    );
    const image = await intake.upload(
      h.viewer('alice'),
      new File([new Uint8Array([1, 2])], 'shot.png', { type: 'image/png' }),
    );
    const result = await intake.split(h.viewer('alice'), {
      fileIds: [file.id, image.id],
    });
    expect(
      result.plan?.rows.map((row) => (row.params as IssueCreateParams).title),
    ).toEqual(['From file', 'Child']);
    expect(result.files.map((read) => read.state)).toEqual(['read', 'image']);
    await expect(
      intake.split(h.viewer('bob'), { fileIds: [file.id] }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
    await expect(
      intake.removeFile(h.viewer('bob'), file.id),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await intake.removeFile(h.viewer('alice'), file.id);
    expect(stored.has(file.id)).toBe(false);
    expect(stored.has(image.id)).toBe(true);
  });

  it('gives the files to the issues the executed plan created', async () => {
    const notes = await intake.upload(
      h.viewer('alice'),
      new File(['- From file'], 'notes.md', { type: 'text/markdown' }),
    );
    const image = await intake.upload(
      h.viewer('alice'),
      new File([new Uint8Array([1, 2])], 'shot.png', { type: 'image/png' }),
    );
    const result = await intake.split(h.viewer('alice'), {
      text: '- Typed first',
      fileIds: [notes.id, image.id],
    });
    expect(result.plan?.source.data).toMatchObject({
      fileIds: [notes.id, image.id],
      fileRefs: { [notes.id]: 'r2' },
    });
    const executed = await h.services.plans.execute(
      h.viewer('alice'),
      result.plan?.id ?? '',
      { revision: result.plan?.revision ?? 0 },
    );
    const [typed, fromFile] = executed.rows.map(
      (row) => row.result?.created?.id ?? '',
    );
    const filesOf = async (issueId: string) =>
      (await h.services.attachments.list(h.viewer('alice'), issueId)).map(
        (file) => file.filename,
      );
    // The image gave no issue of its own: it goes to the first one.
    expect(await filesOf(typed ?? '')).toEqual(['shot.png']);
    expect(await filesOf(fromFile ?? '')).toEqual(['notes.md']);
  });

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
    const plans = await h.services.plans.list(h.viewer('alice'), {});
    expect(plans.data).toHaveLength(0);
  });

  it('names an issue after a file that gives no text', async () => {
    const image = await intake.upload(
      h.viewer('alice'),
      new File([new Uint8Array([1])], 'whiteboard.jpg', { type: 'image/jpeg' }),
    );
    const result = await intake.split(h.viewer('alice'), {
      fileIds: [image.id],
    });
    expect((result.plan?.rows[0]?.params as IssueCreateParams).title).toBe(
      'whiteboard.jpg',
    );
  });

  it('answers the rows and their checks when a row fails its rehearsal', async () => {
    const result = await intake.split(h.viewer('alice'), {
      text: '- One\n- Two',
      projectId: 'no-such-project',
    });
    expect(result.plan).toBeNull();
    expect(result.rehearsal?.ok).toBe(false);
    expect(result.rehearsal?.rows).toHaveLength(2);
    expect(result.request.rows).toHaveLength(2);
  });

  it('refuses empty and oversized input', async () => {
    await expect(
      intake.split(h.viewer('alice'), { text: '  ' }),
    ).rejects.toMatchObject({ code: 'INVALID_INTAKE' });
    await expect(
      intake.split(h.viewer('alice'), { text: 'x'.repeat(50_001) }),
    ).rejects.toMatchObject({ code: 'INVALID_INTAKE' });
  });
});
