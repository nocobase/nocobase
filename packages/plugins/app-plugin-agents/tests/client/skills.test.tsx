// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SkillInput, SkillSave, SkillView } from '../../shared/skills.js';
import {
  draftOf,
  entryProblem,
  removeEntry,
  renameEntry,
  treeOf,
} from '../../client/pages/skills/workbench/model.js';
import { callsTo, clientMocks, FakeApiError, resetApi } from './fake-client.js';
import { skill, skillDetail } from './fixtures.js';
import { renderPage, renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: SkillsPage } =
  await import('../../client/pages/skills/index.js');
const { default: SkillDetailPage } =
  await import('../../client/pages/skills/detail/index.js');
const { default: NewSkillPage } =
  await import('../../client/pages/skills/new.js');

const AT = '2026-10-01T08:00:00.000Z';
const CONTENT =
  '---\nname: pr-etiquette\ndescription: When to use it\n---\n# Pull requests\n\nKeep them small.';

describe('skill workbench model', () => {
  const draft = draftOf({
    content: CONTENT,
    files: [
      {
        path: 'scripts/check.sh',
        hash: 'b'.repeat(64),
        size: 7,
        executable: false,
        content: 'echo ok',
      },
      {
        path: 'notes.md',
        hash: 'c'.repeat(64),
        size: 1,
        executable: false,
        content: 'n',
      },
    ],
  });

  it('builds the tree with folders first and checks names against what is there', () => {
    expect(
      treeOf(draft).map((node) => [node.kind, node.path, node.children.length]),
    ).toEqual([
      ['folder', 'scripts', 1],
      ['file', 'notes.md', 0],
    ]);
    expect(entryProblem(draft, '', 'notes.md', 'file')).toBe('taken');
    expect(entryProblem(draft, '', 'scripts', 'file')).toBe('taken');
    expect(entryProblem(draft, '', 'SKILL.md', 'file')).toBe('reserved');
    expect(entryProblem(draft, 'scripts', 'a/b', 'file')).toBe('invalid');
    expect(entryProblem(draft, 'scripts', ' ', 'file')).toBe('required');
    expect(entryProblem(draft, 'references', 'guide.md', 'file')).toBeNull();
    // Renaming an entry to its own name is no change.
    expect(entryProblem(draft, '', 'notes.md', 'file', 'notes.md')).toBeNull();
  });

  it('renames and removes a folder with everything in it', () => {
    const renamed = renameEntry(draft, 'scripts', 'bin');
    expect(renamed.files.map((file) => file.path)).toEqual([
      'bin/check.sh',
      'notes.md',
    ]);
    expect(removeEntry(renamed, 'bin').files.map((file) => file.path)).toEqual([
      'notes.md',
    ]);
  });
});

describe('skill pages', () => {
  let current: SkillView;
  beforeEach(() => {
    current = skillDetail('s1', {
      name: 'pr-etiquette',
      slug: 'pr-etiquette',
      version: 2,
      scriptCount: 1,
      scripts: ['scripts/check.sh'],
      compatibility: 'Needs git',
      content: CONTENT,
      files: [
        {
          path: 'logo.png',
          hash: 'a'.repeat(64),
          size: 2048,
          executable: false,
          content: null,
        },
        {
          path: 'scripts/check.sh',
          hash: 'b'.repeat(64),
          size: 7,
          executable: false,
          content: 'echo ok',
        },
      ],
      attachments: [
        { scope: 'agent', scopeId: 'a1', name: 'Coder' },
        { scope: 'project', scopeId: 'p1', name: null },
      ],
    });
    resetApi(
      {
        'agents/skills': () => [
          skill('s1', {
            name: 'pr-etiquette',
            version: 2,
            fileCount: 2,
            agentCount: 1,
            scriptCount: 1,
            scripts: ['scripts/check.sh'],
            compatibility: 'Needs git',
          }),
        ],
        'agents/skills/s1': () => current,
        'agents/skills/s1/versions': () => [
          {
            version: 2,
            name: 'pr-etiquette',
            description: 'When to use it',
            note: 'Shorter',
            createdById: 'u1',
            createdByName: 'Alice',
            createdAt: AT,
          },
          {
            version: 1,
            name: 'pr-etiquette',
            description: 'When to use it',
            note: null,
            createdById: 'u1',
            createdByName: 'Alice',
            createdAt: AT,
          },
        ],
        'agents/skills/s1/versions/1': () => ({
          version: 1,
          name: 'pr-etiquette',
          description: 'When to use it',
          note: null,
          createdById: 'u1',
          createdByName: 'Alice',
          createdAt: AT,
          content: CONTENT.replace('small', 'tiny'),
          files: [],
        }),
        'PATCH agents/skills/s1': (request) => {
          const save = request.json as SkillSave;
          current = { ...current, ...save, version: 3 };
          return current;
        },
        'POST agents/skills/uploads': () => ({
          id: 'd'.repeat(64),
          size: 5,
          text: true,
        }),
        'POST agents/skills/s1/versions/1/restore': () => ({
          ...current,
          version: 3,
        }),
      },
      ['agents.agents/read', 'agents.agents/manage'],
    );
  });

  it('lists skills with their scripts, compatibility, version and agents', async () => {
    renderPage(<SkillsPage />);
    const row = await screen.findByTestId('skill-s1');
    expect(within(row).getByText('pr-etiquette')).toBeInTheDocument();
    expect(within(row).getByText('v2')).toBeInTheDocument();
    expect(within(row).getByText('skills.scriptsNote')).toBeInTheDocument();
    expect(
      within(row).getByText('skills.compatibility(value=Needs git)'),
    ).toBeInTheDocument();
  });

  it('shows a skill as a tree of files beside the one selected', async () => {
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    expect(await screen.findByText('Pull requests')).toBeInTheDocument();
    expect(screen.queryByText(/name: pr-etiquette/u)).toBeNull();
    expect(screen.getByText('Coder')).toBeInTheDocument();
    expect(screen.getByTestId('skill-scripts-note')).toHaveTextContent(
      'skills.scriptsNote',
    );
    const tree = screen.getByTestId('skill-tree');
    expect(within(tree).getByText('scripts')).toBeInTheDocument();
    expect(within(tree).getByText('check.sh')).toBeInTheDocument();
    expect(within(tree).getByTestId('skill-script-badge')).toHaveTextContent(
      'skills.scriptBadge',
    );
    // Read-only: no tree actions.
    expect(
      within(tree).queryByRole('button', { name: 'skills.tree.newFile' }),
    ).toBeNull();
    fireEvent.click(within(tree).getByText('check.sh'));
    expect(screen.getByText('echo ok')).toBeInTheDocument();
    fireEvent.click(within(tree).getByText('logo.png'));
    expect(
      screen.getByText('skills.binaryFile(size=2.0 KB)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'skills.tree.download' }),
    ).toBeInTheDocument();
  });

  it('checks the front matter as it is typed, adds files from the tree and saves a new version', async () => {
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    fireEvent.click(await screen.findByRole('button', { name: 'skills.edit' }));
    const save = () =>
      screen.getByRole('button', { name: 'skills.saveVersion' });

    fireEvent.change(screen.getByLabelText('skills.content'), {
      target: { value: '---\nname: PR Etiquette\n---\n# Pull requests' },
    });
    const problems = screen.getByTestId('skill-front-matter-problems');
    expect(
      within(problems).getByText(
        'skills.frontMatter.reasons.pattern(field=name)',
      ),
    ).toBeInTheDocument();
    expect(
      within(problems).getByText(
        'skills.frontMatter.reasons.required(field=description)',
      ),
    ).toBeInTheDocument();
    expect(save()).toBeDisabled();
    const content =
      '---\nname: pull-requests\ndescription: How we write PRs\ncompatibility: Needs git\n---\n# Pull requests\n\nKeep them very small.';
    fireEvent.change(screen.getByLabelText('skills.content'), {
      target: { value: content },
    });
    expect(screen.queryByTestId('skill-front-matter-problems')).toBeNull();

    // A new file, named against what is already there.
    const tree = screen.getByTestId('skill-tree');
    fireEvent.click(
      within(tree).getByRole('button', { name: 'skills.tree.newFile' }),
    );
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('skills.entry.name'), {
      target: { value: 'logo.png' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'common.create' }),
    );
    expect(
      within(dialog).getByText('skills.entry.problems.taken'),
    ).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('skills.entry.name'), {
      target: { value: 'guide.md' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'common.create' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.change(
      screen.getByLabelText('skills.fileContent(path=guide.md)'),
      { target: { value: '# Guide' } },
    );

    // A file dropped on a folder is uploaded into it.
    const folder = within(tree).getByText('scripts').closest('div')!;
    fireEvent.drop(folder, {
      dataTransfer: {
        types: ['Files'],
        files: [new File(['ls -l'], 'list.sh')],
      },
    });
    expect(await within(tree).findByText('list.sh')).toBeInTheDocument();
    expect(callsTo('POST', 'agents/skills/uploads')).toHaveLength(1);

    // Marking a file executable.
    fireEvent.click(within(tree).getByText('check.sh'));
    fireEvent.click(screen.getByRole('switch', { name: 'skills.executable' }));

    fireEvent.change(screen.getByLabelText('skills.note'), {
      target: { value: 'Tighter' },
    });
    await waitFor(() => expect(save()).toBeEnabled());
    fireEvent.click(save());
    await waitFor(() =>
      expect(callsTo('PATCH', 'agents/skills/s1')).toHaveLength(1),
    );
    expect(callsTo('PATCH', 'agents/skills/s1')[0]?.json).toEqual({
      content,
      files: [
        { path: 'logo.png', hash: 'a'.repeat(64) },
        { path: 'scripts/check.sh', content: 'echo ok', executable: true },
        { path: 'guide.md', content: '# Guide' },
        { path: 'scripts/list.sh', content: 'ls -l' },
      ],
      note: 'Tighter',
      expectedRevision: 2,
    });
    dialog = screen.queryByRole('dialog')!;
    expect(dialog).toBeNull();
  });

  it('lists what the server refuses in the front matter above the source', async () => {
    resetApi(
      {
        'agents/skills': () => [],
        'agents/skills/s1': () => current,
        'agents/skills/s1/versions': () => [],
        'PATCH agents/skills/s1': () => {
          throw new FakeApiError(400, 'INVALID_REQUEST', {
            error: {
              metadata: {
                problems: [
                  { field: 'name', reason: 'taken', message: 'Taken.' },
                ],
              },
            },
          });
        },
      },
      ['agents.agents/read', 'agents.agents/manage'],
    );
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    fireEvent.click(await screen.findByRole('button', { name: 'skills.edit' }));
    fireEvent.change(screen.getByLabelText('skills.content'), {
      target: { value: CONTENT.replace('pr-etiquette', 'deploy') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'skills.saveVersion' }));
    expect(
      await screen.findByText('skills.frontMatter.reasons.taken(field=name)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'skills.saveVersion' }),
    ).toBeDisabled();
    // Changing the name lets it be saved again.
    fireEvent.change(screen.getByLabelText('skills.content'), {
      target: { value: CONTENT.replace('pr-etiquette', 'deploy-2') },
    });
    expect(
      screen.queryByText('skills.frontMatter.reasons.taken(field=name)'),
    ).toBeNull();
  });

  it('keeps the draft when someone saved a version meanwhile, and loads the latest on request', async () => {
    resetApi(
      {
        'agents/skills': () => [],
        'agents/skills/s1': () => current,
        'agents/skills/s1/versions': () => [],
        'PATCH agents/skills/s1': () => {
          throw new FakeApiError(409, 'REVISION_CONFLICT');
        },
      },
      ['agents.agents/read'],
    );
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    fireEvent.click(await screen.findByRole('button', { name: 'skills.edit' }));
    // A creator who does not manage agents edits but does not delete.
    expect(screen.queryByRole('button', { name: 'skills.delete' })).toBeNull();
    const mine = `${CONTENT}\n\nMine`;
    fireEvent.change(screen.getByLabelText('skills.content'), {
      target: { value: mine },
    });
    fireEvent.click(screen.getByRole('button', { name: 'skills.saveVersion' }));
    expect(await screen.findByText('skills.conflictTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('skills.content')).toHaveValue(mine);
    expect(
      screen.getByRole('button', { name: 'skills.saveVersion' }),
    ).toBeDisabled();
    current = { ...current, version: 3, content: CONTENT };
    fireEvent.click(screen.getByRole('button', { name: 'skills.loadLatest' }));
    expect(await screen.findByText('v3')).toBeInTheDocument();
    expect(screen.queryByLabelText('skills.content')).toBeNull();
  });

  it('shows a skill read-only to those the server says may not edit it', async () => {
    current = { ...current, canEdit: false };
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    expect(await screen.findByText('Pull requests')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'skills.edit' })).toBeNull();
    expect(screen.getByText('skills.readOnly')).toBeInTheDocument();
  });

  it('compares an older version with the current one and restores it', async () => {
    renderRoute(<SkillDetailPage />, '/skills/:skillId', '/skills/s1');
    const old = await screen.findByTestId('skill-version-1');
    fireEvent.click(
      within(old).getByRole('button', { name: 'skills.versions.compare' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('- Keep them tiny.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('+ Keep them small.')).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });

    fireEvent.click(
      within(old).getByRole('button', { name: 'skills.versions.restore' }),
    );
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: 'skills.versions.restore' }),
    );
    await waitFor(() =>
      expect(
        callsTo('POST', 'agents/skills/s1/versions/1/restore'),
      ).toHaveLength(1),
    );
    expect(
      callsTo('POST', 'agents/skills/s1/versions/1/restore')[0]?.json,
    ).toEqual({
      expectedRevision: 2,
    });
  });

  it('starts a new skill from a template and creates it from its SKILL.md', async () => {
    resetApi(
      {
        'POST agents/skills': (request) => ({
          ...current,
          id: 's9',
          name: 'release-notes',
          content: (request.json as SkillInput).content,
        }),
      },
      ['agents.agents/read', 'agents.agents/manage'],
    );
    renderRoute(<NewSkillPage />, '/skills/new', '/skills/new');
    const source = screen.getByLabelText('skills.content');
    expect((source as HTMLTextAreaElement).value).toContain('name: new-skill');
    expect((source as HTMLTextAreaElement).value).toContain(
      '## skills.template.whenToUse',
    );
    const content = (source as HTMLTextAreaElement).value.replace(
      'new-skill',
      'release-notes',
    );
    fireEvent.change(source, { target: { value: content } });
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));
    await waitFor(() =>
      expect(callsTo('POST', 'agents/skills')).toHaveLength(1),
    );
    expect(callsTo('POST', 'agents/skills')[0]?.json).toEqual({
      content,
      files: [],
    });
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
  });
});
