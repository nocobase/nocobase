// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'lead', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

describe('projects', () => {
  it('makes the creator lead and member unless another lead is named', async () => {
    const own = await h.services.projects.create(h.viewer('alice'), {
      name: 'Own',
    });
    expect(own).toMatchObject({
      leadUserId: 'alice',
      lead: { id: 'alice', name: 'alice' },
      visibility: 'everyone',
      status: 'planned',
      memberCount: 1,
    });
    const led = await h.services.projects.create(h.viewer('alice'), {
      name: 'Led',
      leadUserId: 'lead',
    });
    expect(led.members.map((member) => member.id).sort()).toEqual([
      'alice',
      'lead',
    ]);
  });

  it('hides a private project from those who did not join it', async () => {
    const secret = await h.services.projects.create(h.viewer('lead'), {
      name: 'Secret',
      visibility: 'members',
    });
    await h.services.projects.create(h.viewer('lead'), { name: 'Open' });
    const names = async (userId: string, role: 'admin' | 'member' = 'member') =>
      (await h.services.projects.list(h.viewer(userId, role))).map(
        (p) => p.name,
      );
    expect(await names('alice')).toEqual(['Open']);
    expect(await names('lead')).toEqual(['Open', 'Secret']);
    expect(await names('admin', 'admin')).toEqual(['Open', 'Secret']);
    await expect(
      h.services.projects.get(h.viewer('alice'), secret.id),
    ).rejects.toMatchObject({
      kind: 'notFound',
    });
    await h.services.projects.addMember(h.viewer('lead'), secret.id, {
      userId: 'alice',
    });
    expect(await names('alice')).toEqual(['Open', 'Secret']);
  });

  it('reaches the projects of every user in the set the application resolves, such as a department', async () => {
    const secret = await h.services.projects.create(h.viewer('lead'), {
      name: 'Secret',
      visibility: 'members',
    });
    const base = h.viewer('alice');
    // The application widened alice's view and manage to the users of her department: herself and the lead.
    const team = { users: ['alice', 'lead'] };
    const alice = {
      ...base,
      permissions: {
        ...base.permissions,
        scopes: {
          ...base.permissions.scopes,
          'pm.projects/view': team,
          'pm.projects/manage': team,
          'pm.issues/view': team,
        },
      },
    };
    expect((await h.services.projects.list(alice)).map((p) => p.name)).toEqual([
      'Secret',
    ]);
    await expect(
      h.services.projects.update(alice, secret.id, { name: 'Shared' }),
    ).resolves.toMatchObject({ name: 'Shared' });
    await expect(
      h.services.projects.update(h.viewer('alice'), secret.id, { name: 'X' }),
    ).rejects.toMatchObject({ kind: 'notFound' });
  });

  it('lets only the lead or an administrator change a project', async () => {
    const project = await h.services.projects.create(h.viewer('lead'), {
      name: 'P',
    });
    await expect(
      h.services.projects.update(h.viewer('alice'), project.id, { name: 'Q' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.projects.update(h.viewer('admin', 'admin'), project.id, {
        status: 'paused',
      }),
    ).resolves.toMatchObject({ status: 'paused' });
  });

  it('has one lead, who stays a member', async () => {
    const project = await h.services.projects.create(h.viewer('lead'), {
      name: 'P',
    });
    const updated = await h.services.projects.update(
      h.viewer('lead'),
      project.id,
      {
        leadUserId: 'bob',
      },
    );
    expect(updated.leadUserId).toBe('bob');
    await expect(
      h.services.projects.update(h.viewer('lead'), project.id, { name: 'Q' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.projects.removeMember(h.viewer('bob'), project.id, 'bob'),
    ).rejects.toMatchObject({ code: 'LEAD_MEMBER' });
  });

  it('validates its fields', async () => {
    const alice = h.viewer('alice');
    await expect(
      h.services.projects.create(alice, { name: ' ' }),
    ).rejects.toMatchObject({
      code: 'INVALID_NAME',
    });
    await expect(
      h.services.projects.create(alice, { name: 'P', dueDate: '2026-02-30' }),
    ).rejects.toMatchObject({ code: 'INVALID_DATE' });
    await expect(
      h.services.projects.create(alice, { name: 'P', leadUserId: 'nobody' }),
    ).rejects.toMatchObject({ code: 'INVALID_LEAD' });
  });

  it('keeps repositories in order and accepts only git remotes', async () => {
    const lead = h.viewer('lead');
    const project = await h.services.projects.create(lead, { name: 'P' });
    const a = await h.services.projects.addResource(lead, project.id, {
      type: 'gitRepo',
      url: 'git@github.com:acme/a.git',
    });
    const b = await h.services.projects.addResource(lead, project.id, {
      type: 'gitRepo',
      url: 'https://github.com/acme/b.git',
      defaultRef: 'main',
    });
    expect([a.position, b.position]).toEqual([0, 1]);
    await expect(
      h.services.projects.addResource(lead, project.id, {
        type: 'gitRepo',
        url: 'ftp://x',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_URL' });
    await h.services.projects.updateResource(lead, project.id, a.id, {
      position: 5,
    });
    const detail = await h.services.projects.get(lead, project.id);
    expect(detail.resources.map((resource) => resource.url)).toEqual([
      'https://github.com/acme/b.git',
      'git@github.com:acme/a.git',
    ]);
  });

  it('keeps directories on a runner with their initialization prompts', async () => {
    const lead = h.viewer('lead');
    const project = await h.services.projects.create(lead, { name: 'P' });
    const dir = await h.services.projects.addResource(lead, project.id, {
      type: 'directory',
      runnerId: 'runner-1',
      path: '/srv/app',
      label: 'App',
      initPrompt: '  Run pnpm install.  ',
    });
    expect(dir).toMatchObject({
      type: 'directory',
      url: null,
      runnerId: 'runner-1',
      path: '/srv/app',
      initPrompt: 'Run pnpm install.',
    });
    await expect(
      h.services.projects.addResource(lead, project.id, {
        type: 'directory',
        runnerId: 'runner-1',
        path: 'relative/dir',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
    await expect(
      h.services.projects.addResource(lead, project.id, {
        type: 'directory',
        path: '/srv/app',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_RUNNER' });
    await expect(
      h.services.projects.updateResource(lead, project.id, dir.id, {
        url: 'https://github.com/acme/a.git',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_RESOURCE' });
    const updated = await h.services.projects.updateResource(
      lead,
      project.id,
      dir.id,
      { path: '/srv/other', initPrompt: '' },
    );
    expect(updated).toMatchObject({ path: '/srv/other', initPrompt: null });

    expect(
      await h.services.projects.accessTo(lead, { resourceId: dir.id }),
    ).toEqual({ projectId: project.id, visible: true, manage: true });
    expect(
      await h.services.projects.accessTo(h.viewer('someone'), {
        projectId: project.id,
      }),
    ).toMatchObject({ manage: false });
    expect(
      await h.services.projects.accessTo(lead, { resourceId: 'missing' }),
    ).toBeNull();
  });

  it('is deleted by administrators only, keeping its issues detached', async () => {
    const admin = h.viewer('admin', 'admin');
    const project = await h.services.projects.create(h.viewer('lead'), {
      name: 'P',
    });
    const issue = await h.services.issues.create(h.viewer('lead'), {
      title: 'Work',
      projectId: project.id,
    });
    await expect(
      h.services.projects.remove(h.viewer('lead'), project.id),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await h.services.projects.remove(admin, project.id);
    const detail = await h.services.issueQueries.detail(admin, issue.id);
    expect(detail.projectId).toBeNull();
    expect(detail.activities.map((activity) => activity.action)).toContain(
      'project_changed',
    );
  });

  it('counts the issues of each project by status', async () => {
    const lead = h.viewer('lead');
    const project = await h.services.projects.create(lead, { name: 'P' });
    await h.services.issues.create(lead, { title: 'A', projectId: project.id });
    const b = await h.services.issues.create(lead, {
      title: 'B',
      projectId: project.id,
    });
    await h.services.issues.update(lead, b.id, {
      revision: b.revision,
      statusKey: 'done',
    });
    const [item] = await h.services.projects.list(lead);
    expect(item?.issueCounts).toEqual({
      total: 2,
      done: 1,
      byStatus: { todo: 1, done: 1 },
    });
  });
});
