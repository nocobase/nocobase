/**
 * Spaces exported as files (`KnowledgeSnapshots`): when asked, which version of which document goes where (a snapshot,
 * `kbSnapshots`, recorded under a key the application chooses, such as a run's id); later, the files themselves,
 * rebuilt from the recorded versions:
 *
 * ```text
 * INDEX.md            what is here, space by space, with each document's title, summary, version and path
 * .manifest.json      [{ path, hash, docId, version, slug }]: what a changed copy is compared against
 * <dir>/…             each space under the directory the application names (`project/`, `system/`…)
 * ```
 *
 * An article with live children is a directory with a `README.md`; one without is `<slug>.md`. A folder is a directory
 * only (listed in `INDEX.md`). A file is its extracted text, `<file name>.md` (`report.pdf.md`), its front matter naming
 * the file; the original bytes are not exported (`Knowledge.files.content` reads them). Every file starts with front
 * matter naming the entry, its version and where people read it. A version's content never changes once its text is
 * extracted, and the snapshot keeps everything else a file shows (a file's text as it stood: one not extracted yet stays
 * a note), so the files served later are exactly what the snapshot hashed: a consumer caches them by that hash and
 * fetches nothing while no entry changes.
 *
 * Beyond `maxDocs` documents or `maxBytes` of text, the rest are listed in `INDEX.md` as not written (the nearest space
 * first), to read some other way. The wording an application adds (what the reader should do with the files, how to
 * read one not written, the link of a document) is its `SnapshotLayout`.
 *
 * Only what the reader reads is exported (`Knowledge.readable`, decided before the caller's transaction): the spaces,
 * and in each the entries their gates let through.
 */
import { createHash } from 'node:crypto';

import type { DatabaseConnection } from '@nocobase/db';

import type { KnowledgeParseStatus, SpaceRef } from '../../shared/knowledge.js';
import type { SpaceGates } from './permissions.js';
import { readableDocs, type ReadableSpaces } from './readable.js';
import {
  currentVersionsOf,
  docsOf,
  filesOf as fileRecordsOf,
  findSpace,
  findVersion,
  iso,
  isoOrNull,
  json,
  num,
  snapshotsRepo,
  type DocRecord,
  type SnapshotDoc,
} from './store.js';

export const MANIFEST_FILE = '.manifest.json';
export const INDEX_FILE = 'INDEX.md';
/** Bumped when the layout changes, so caches by hash do not mix layouts. */
const FORMAT = 2;

export const DEFAULT_LIMITS: {
  readonly maxDocs: number;
  readonly maxBytes: number;
} = { maxDocs: 1000, maxBytes: 5 * 1024 * 1024 };

/** A space as the files show it. */
export interface SnapshotSpace {
  readonly ref: SpaceRef;
  readonly title: string | null;
  readonly inherited: boolean;
}

/** How an application words and places the files; give the same layout to `take` and `files`. */
export interface SnapshotLayout {
  /** The directory of a space's documents (`project`, `system`). */
  dir(space: SpaceRef): string;
  /** The heading of a space's part of `INDEX.md`, without `## `. */
  heading(space: SnapshotSpace, dir: string): string;
  /** The paragraphs of `INDEX.md` between its title and the spaces. */
  readonly preamble: readonly string[];
  /** What `INDEX.md` says of a document listed but not written (`not written here: …`). */
  unwritten(slug: string): string;
  /** The link people read a document at, for its front matter. */
  url(space: SpaceRef, docId: string): string;
  /** How a reader gets a file's original bytes (`download it with …`), for `INDEX.md`; nothing said when absent. */
  original?(slug: string): string;
}

/** A plain layout: each space under its kind, no instructions, no links. */
export const DEFAULT_LAYOUT: SnapshotLayout = {
  dir: (space) => space.scope,
  heading: (space, dir) =>
    `${space.title ?? space.ref.scope} (\`${dir}/\`${space.inherited ? ', inherited' : ''})`,
  preamble: [
    'The knowledge base as it was when this snapshot was taken. Each file starts with front matter naming its document and version.',
  ],
  unwritten: () => 'not written here',
  url: () => '',
};

export interface TakeSnapshotRequest {
  /** What the snapshot is recorded under (a run's id); `files` serves the latest under it. */
  readonly key: string;
  /** Consecutive snapshots of one series (a session) say what changed since the previous one. */
  readonly seriesKey: string;
  readonly layout: SnapshotLayout;
  readonly limits?: { readonly maxDocs?: number; readonly maxBytes?: number };
}

/** A document new or changed since the previous snapshot of the series. */
export interface SnapshotChange {
  readonly docId: string;
  readonly slug: string;
  readonly title: string;
  /** The version the previous snapshot held; null for a new document. */
  readonly from: number | null;
  readonly to: number;
}

export interface KnowledgeSnapshot {
  readonly hash: string;
  readonly docs: readonly SnapshotDoc[];
  /** Documents listed in `INDEX.md` but not written. */
  readonly omitted: number;
  /** For a later snapshot of the series: what changed since the previous one; null for the first, or when none did. */
  readonly changed: readonly SnapshotChange[] | null;
}

/** The files of a snapshot, in a stable order, with the manifest last. */
export interface SnapshotFiles {
  readonly hash: string;
  readonly files: readonly {
    readonly path: string;
    readonly content: string;
  }[];
}

/** What a snapshot keeps of a file entry: the file, and where its text stood. */
interface StoredFile {
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
  readonly parse: KnowledgeParseStatus;
}

/** What a snapshot keeps of each document, beyond `SnapshotDoc`: what its file and the index show. */
interface StoredDoc extends SnapshotDoc {
  readonly file?: StoredFile;
  readonly scopeId: string;
  readonly spaceTitle: string | null;
  readonly inherited: boolean;
  readonly summary: string;
  readonly depth: number;
  readonly parentId: string | null;
  readonly children: number;
  readonly updatedAt: string;
  readonly verifiedAt: string | null;
}

export interface KnowledgeSnapshots {
  /** In the caller's transaction: a snapshot of the readable spaces, recorded under `key`; null with nothing to give. */
  take(
    conn: DatabaseConnection,
    readable: ReadableSpaces,
    request: TakeSnapshotRequest,
  ): Promise<KnowledgeSnapshot | null>;
  /** The files of the latest snapshot under `key`; null without one. */
  files(
    conn: DatabaseConnection,
    key: string,
    layout: SnapshotLayout,
  ): Promise<SnapshotFiles | null>;
  /** What the latest snapshot under `key` holds of each document: its version and file. */
  docs(conn: DatabaseConnection, key: string): Promise<readonly SnapshotDoc[]>;
}

const sha256 = (text: string) =>
  createHash('sha256').update(text).digest('hex');

/** A YAML scalar that reads back as the same string. */
const yaml = (value: string) => JSON.stringify(value);

const refOf = (doc: StoredDoc): SpaceRef => ({
  scope: doc.scope,
  scopeId: doc.scopeId,
});

function frontMatter(doc: StoredDoc, layout: SnapshotLayout): string {
  return [
    '---',
    `id: ${yaml(doc.docId)}`,
    `slug: ${yaml(doc.slug)}`,
    `title: ${yaml(doc.title)}`,
    `version: ${doc.version}`,
    ...(doc.file
      ? [
          'kind: file',
          `filename: ${yaml(doc.file.filename)}`,
          `mimeType: ${yaml(doc.file.mimeType)}`,
          `size: ${doc.file.size}`,
          `text: ${doc.file.parse}`,
        ]
      : []),
    `space: ${doc.scope}${doc.spaceTitle ? ` # ${doc.spaceTitle.replace(/\n/gu, ' ')}` : ''}`,
    `updatedAt: ${yaml(doc.updatedAt)}`,
    `verifiedAt: ${doc.verifiedAt ? yaml(doc.verifiedAt) : 'null'}`,
    `url: ${yaml(layout.url(refOf(doc), doc.docId))}`,
    '---',
    '',
  ].join('\n');
}

/** What a file's snapshot says when its text was not extracted. */
const NO_TEXT: Readonly<Record<KnowledgeParseStatus, string>> = {
  ready: '',
  parsing:
    '_The text of this file was still being extracted when this snapshot was taken._',
  failed: '_The text of this file could not be extracted._',
  unsupported: '_Text is not extracted from files of this type._',
};

/** What a document's file holds: an article's content, a file's text as it stood. */
function bodyOf(doc: StoredDoc, content: string): string {
  return doc.file && doc.file.parse !== 'ready'
    ? NO_TEXT[doc.file.parse]
    : content;
}

function documentFile(
  doc: StoredDoc,
  content: string,
  layout: SnapshotLayout,
): string {
  const body = bodyOf(doc, content);
  return `${frontMatter(doc, layout)}${body.endsWith('\n') ? body : `${body}\n`}`;
}

/** Content without the front matter an exported file starts with, and what that front matter names. */
export function readDocumentFile(text: string): {
  readonly content: string;
  readonly version: number | null;
  readonly id: string | null;
  readonly title: string | null;
} {
  const normalized = text.replace(/\r\n/gu, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?/u.exec(normalized);
  if (!match)
    return { content: normalized, version: null, id: null, title: null };
  const fields = new Map<string, string>();
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':');
    if (at > 0) fields.set(line.slice(0, at).trim(), line.slice(at + 1).trim());
  }
  const unquote = (value: string | undefined) => {
    if (value === undefined || value === 'null') return null;
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : String(parsed);
    } catch {
      return value;
    }
  };
  const version = Number(fields.get('version'));
  return {
    content: normalized.slice(match[0].length).replace(/^\n/u, ''),
    version: Number.isInteger(version) && version > 0 ? version : null,
    id: unquote(fields.get('id')),
    title: unquote(fields.get('title')),
  };
}

function indexOf(docs: readonly StoredDoc[], layout: SnapshotLayout): string {
  const lines = ['# Knowledge', ''];
  for (const paragraph of layout.preamble) lines.push(paragraph, '');
  const groups = new Map<string, StoredDoc[]>();
  for (const doc of docs) {
    const key = `${doc.scope}:${doc.scopeId}`;
    groups.set(key, [...(groups.get(key) ?? []), doc]);
  }
  for (const group of groups.values()) {
    const first = group[0];
    const ref = refOf(first);
    lines.push(
      `## ${layout.heading(
        { ref, title: first.spaceTitle, inherited: first.inherited },
        layout.dir(ref),
      )}`,
      '',
    );
    for (const doc of group) {
      const indent = '  '.repeat(Math.max(0, doc.depth - 1));
      const summary = doc.summary.replace(/\s+/gu, ' ').trim();
      if (doc.kind === 'folder') {
        lines.push(`${indent}- ${doc.title}/ \`${doc.slug}\` (folder)`);
        continue;
      }
      const facts = [
        `v${doc.version}`,
        ...(doc.file
          ? [
              `file ${doc.file.filename}`,
              ...(layout.original ? [layout.original(doc.slug)] : []),
            ]
          : []),
        ...(doc.verifiedAt ? [`verified ${doc.verifiedAt.slice(0, 10)}`] : []),
      ].join(', ');
      lines.push(
        doc.path
          ? `${indent}- [${doc.title}](${doc.path}) \`${doc.slug}\` (${facts})${summary ? `: ${summary}` : ''}`
          : `${indent}- ${doc.title} \`${doc.slug}\` (${facts}, ${layout.unwritten(doc.slug)})${summary ? `: ${summary}` : ''}`,
      );
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function filesOf(
  docs: readonly StoredDoc[],
  contents: ReadonlyMap<string, string>,
  layout: SnapshotLayout,
): { path: string; content: string }[] {
  const files = docs
    .filter((doc) => doc.path)
    .map((doc) => ({
      path: doc.path,
      content: documentFile(doc, contents.get(doc.docId) ?? '', layout),
    }));
  const manifest = files.map((file) => {
    const doc = docs.find((item) => item.path === file.path)!;
    return {
      path: file.path,
      hash: sha256(file.content),
      docId: doc.docId,
      version: doc.version,
      slug: doc.slug,
    };
  });
  return [
    { path: INDEX_FILE, content: indexOf(docs, layout) },
    ...files,
    { path: MANIFEST_FILE, content: `${JSON.stringify(manifest, null, 2)}\n` },
  ];
}

const hashOf = (files: readonly { path: string; content: string }[]) =>
  sha256(
    JSON.stringify([
      FORMAT,
      files.map((file) => [file.path, sha256(file.content)]),
    ]),
  );

/** A space being exported, with its id and directory. */
interface ExportedSpace extends SnapshotSpace {
  readonly id: string;
  readonly dir: string;
  readonly gates?: SpaceGates | null;
}

/** A file's name as a path segment: no separators, control characters or leading dots. */
function segmentOf(filename: string): string {
  return (
    [...filename]
      .map((char) => {
        const code = char.charCodeAt(0);
        return code < 32 || code === 127 || char === '/' || char === '\\'
          ? '_'
          : char;
      })
      .join('')
      .replace(/^\.+/u, '_')
      .trim()
      .slice(0, 200) || 'file'
  );
}

/** The documents of the spaces in tree order, each with its depth and path. */
function arrange(
  spaces: readonly ExportedSpace[],
  bySpace: ReadonlyMap<string, readonly DocRecord[]>,
  files: ReadonlyMap<string, StoredFile>,
): StoredDoc[] {
  const ordered: StoredDoc[] = [];
  const taken = new Set<string>();
  /** The first of `candidates` no other file has, or the slug numbered. */
  const free = (candidates: readonly string[], dir: string, slug: string) => {
    for (const candidate of candidates)
      if (!taken.has(candidate)) {
        taken.add(candidate);
        return candidate;
      }
    for (let attempt = 2; ; attempt += 1) {
      const candidate = `${dir}/${slug}-${attempt}.md`;
      if (!taken.has(candidate)) {
        taken.add(candidate);
        return candidate;
      }
    }
  };
  for (const space of spaces) {
    const docs = bySpace.get(space.id) ?? [];
    const children = new Map<string | null, DocRecord[]>();
    const ids = new Set(docs.map((doc) => doc.id));
    for (const doc of docs) {
      // A document whose parent is not here (archived) is a root of what is given.
      const parent =
        doc.parentId && ids.has(doc.parentId) ? doc.parentId : null;
      children.set(parent, [...(children.get(parent) ?? []), doc]);
    }
    const walk = (parentId: string | null, dir: string, depth: number) => {
      for (const doc of children.get(parentId) ?? []) {
        const below = children.get(doc.id)?.length ?? 0;
        const file = files.get(doc.id);
        const path =
          doc.kind === 'folder'
            ? ''
            : file
              ? free(
                  [
                    `${dir}/${segmentOf(file.filename)}.md`,
                    `${dir}/${doc.slug}.md`,
                  ],
                  dir,
                  doc.slug,
                )
              : free(
                  [
                    below > 0
                      ? `${dir}/${doc.slug}/README.md`
                      : `${dir}/${doc.slug}.md`,
                  ],
                  dir,
                  doc.slug,
                );
        ordered.push({
          docId: doc.id,
          kind: doc.kind,
          ...(file ? { file } : {}),
          version: num(doc.currentVersion),
          path,
          hash: '',
          slug: doc.slug,
          title: doc.title,
          scope: space.ref.scope,
          scopeId: space.ref.scopeId,
          spaceTitle: space.title,
          inherited: space.inherited,
          summary: doc.summary,
          depth,
          parentId: doc.parentId,
          children: below,
          updatedAt: iso(doc.updatedAt),
          verifiedAt: isoOrNull(doc.verifiedAt),
        });
        if (below > 0) walk(doc.id, `${dir}/${doc.slug}`, depth + 1);
      }
    };
    walk(null, space.dir, 1);
  }
  return ordered;
}

async function contentsOf(
  conn: DatabaseConnection,
  docs: readonly StoredDoc[],
): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  for (const doc of docs)
    if (doc.path && !(doc.file && doc.file.parse !== 'ready'))
      contents.set(
        doc.docId,
        (await findVersion(conn, doc.docId, doc.version))?.content ?? '',
      );
  return contents;
}

/** The file entries' files, and where their text stands, by document id. */
async function storedFiles(
  conn: DatabaseConnection,
  docs: readonly DocRecord[],
): Promise<Map<string, StoredFile>> {
  const versions = await currentVersionsOf(
    conn,
    docs.filter((doc) => doc.kind === 'file'),
  );
  const records = await fileRecordsOf(
    conn,
    [...versions.values()].map((version) => version.fileId),
  );
  const found = new Map<string, StoredFile>();
  for (const [docId, version] of versions) {
    const record = version.fileId ? records.get(version.fileId) : undefined;
    if (record)
      found.set(docId, {
        filename: record.filename,
        mimeType: record.mimeType,
        size: num(record.size),
        parse: version.parseStatus ?? 'unsupported',
      });
  }
  return found;
}

export function createSnapshots(deps: {
  readonly newId: () => string;
  readonly now: () => Date;
}): KnowledgeSnapshots {
  async function latest(conn: DatabaseConnection, key: string) {
    return (
      (
        await snapshotsRepo(conn).findMany({
          filter: { snapshotKey: key },
          sort: (sort) => [
            sort.field('createdAt').desc(),
            sort.field('id').desc(),
          ],
          limit: 1,
        })
      )[0] ?? null
    );
  }

  return {
    async take(conn, readable, request) {
      const spaces: ExportedSpace[] = [];
      for (const space of readable.spaces) {
        const record = await findSpace(conn, space.ref);
        if (record)
          spaces.push({
            ...space,
            id: record.id,
            dir: request.layout.dir(space.ref),
          });
      }
      if (spaces.length === 0) return null;
      const limits = { ...DEFAULT_LIMITS, ...request.limits };
      const bySpace = new Map<string, DocRecord[]>();
      // Only what the reader reads, each under its nearest readable ancestor.
      for (const space of spaces)
        bySpace.set(
          space.id,
          space.gates?.spaceId === space.id
            ? readableDocs(await docsOf(conn, [space.id]), space.gates)
            : [],
        );
      const arranged = arrange(
        spaces,
        bySpace,
        await storedFiles(conn, [...bySpace.values()].flat()),
      );
      if (arranged.length === 0) return null;

      // Within the limits, in order: the nearest space first, then what it inherits.
      let bytes = 0;
      let written = 0;
      const sized: StoredDoc[] = [];
      const contents = new Map<string, string>();
      for (const doc of arranged) {
        if (doc.kind === 'folder') {
          sized.push(doc);
          continue;
        }
        const content = bodyOf(
          doc,
          (await findVersion(conn, doc.docId, doc.version))?.content ?? '',
        );
        const size = Buffer.byteLength(content);
        if (written >= limits.maxDocs || bytes + size > limits.maxBytes) {
          sized.push({ ...doc, path: '' });
          continue;
        }
        written += 1;
        bytes += size;
        contents.set(doc.docId, content);
        sized.push(doc);
      }
      const files = filesOf(sized, contents, request.layout);
      const hashes = new Map(
        files.map((file) => [file.path, sha256(file.content)]),
      );
      const docs = sized.map((doc) => ({
        ...doc,
        hash: doc.path ? (hashes.get(doc.path) ?? '') : '',
      }));
      const hash = hashOf(files);
      const seriesKey = sha256(request.seriesKey);
      const previous = (
        await snapshotsRepo(conn).findMany({
          filter: { seriesKey },
          sort: (sort) => [
            sort.field('createdAt').desc(),
            sort.field('id').desc(),
          ],
          limit: 1,
        })
      )[0];
      const omitted = sized.filter(
        (doc) => !doc.path && doc.kind !== 'folder',
      ).length;
      await snapshotsRepo(conn).createOne({
        values: {
          id: deps.newId(),
          snapshotKey: request.key,
          seriesKey,
          hash,
          docs,
          omitted,
          createdAt: deps.now().toISOString(),
        },
      });
      // Keep the last few per series: enough to tell a later one what changed.
      const older = await snapshotsRepo(conn).findMany({
        filter: { seriesKey },
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
      });
      for (const stale of older.slice(5))
        await snapshotsRepo(conn).deleteMany({ filter: { id: stale.id } });

      return {
        hash,
        docs,
        omitted,
        changed: previous
          ? changedSince(json<StoredDoc[]>(previous.docs, []), docs)
          : null,
      };
    },

    async files(conn, key, layout) {
      const snapshot = await latest(conn, key);
      if (!snapshot) return null;
      const docs = json<StoredDoc[]>(snapshot.docs, []);
      const files = filesOf(docs, await contentsOf(conn, docs), layout);
      return { hash: snapshot.hash, files };
    },

    async docs(conn, key) {
      const snapshot = await latest(conn, key);
      return snapshot ? json<StoredDoc[]>(snapshot.docs, []) : [];
    },
  };
}

/** The documents new or changed since the previous snapshot; null when none. */
function changedSince(
  before: readonly StoredDoc[],
  now: readonly StoredDoc[],
): SnapshotChange[] | null {
  const was = new Map(before.map((doc) => [doc.docId, doc.version]));
  const changed = now.filter(
    (doc) => doc.kind !== 'folder' && (was.get(doc.docId) ?? 0) < doc.version,
  );
  if (changed.length === 0) return null;
  return changed.map((doc) => ({
    docId: doc.docId,
    slug: doc.slug,
    title: doc.title,
    from: was.get(doc.docId) ?? null,
    to: doc.version,
  }));
}
