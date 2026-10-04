// @vitest-environment node
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  loadRelationProjectState,
  relationProjectSelect,
  relationRepositories,
  runRelationMutationScenario,
  type RelationProject,
  type RelationTask,
} from '../client/relation-mutations.js';
import { createFixture } from './helpers.js';

describe('Relationship writes through Repository HTTP', () => {
  let f: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    f = await createFixture();
    await f.database
      .createSeeder({
        directory: path.resolve(import.meta.dirname, '../database/seeds'),
        packageName: '@nocobase/app-plugin-repository-example',
      })
      .run();
  });

  afterEach(async () => {
    await f.destroy();
  });

  it('creates, patches and replaces all relation cardinalities', async () => {
    const baseline = await loadRelationProjectState(f.api, 'project-1');
    expect(baseline).toMatchObject({
      project: {
        owner: { name: 'Ada' },
        profile: { summary: 'Current project profile' },
        tasks: expect.arrayContaining([
          expect.objectContaining({ id: 'task-edit' }),
          expect.objectContaining({ id: 'task-detached' }),
          expect.objectContaining({ id: 'task-obsolete' }),
        ]),
        tags: [{ id: 'tag-docs' }],
      },
      through: [{ tagId: 'tag-docs', role: 'secondary' }],
    });

    const scenario = await runRelationMutationScenario(f.api, 'http-test');
    expect(scenario.state.project).toMatchObject({
      id: 'relation-project-http-test',
      owner: { id: 'user-2', name: 'Bob' },
      profile: { summary: 'Profile updated in place' },
      tasks: expect.arrayContaining([
        expect.objectContaining({
          id: 'relation-connect-http-test',
          projectId: 'relation-project-http-test',
        }),
        expect.objectContaining({
          id: 'relation-edit-http-test',
          title: 'Task updated in relation scope',
          points: 3,
        }),
        expect.objectContaining({ id: 'relation-created-http-test' }),
        expect.objectContaining({ id: 'relation-imported-http-test' }),
      ]),
      tags: expect.arrayContaining([
        expect.objectContaining({ id: 'tag-db' }),
        expect.objectContaining({ id: 'tag-docs' }),
      ]),
    });
    expect(scenario.state.project?.tasks).toHaveLength(4);
    expect(scenario.state.project?.tags).toHaveLength(2);
    expect(scenario.state.through).toEqual([
      {
        projectId: 'relation-project-http-test',
        tagId: 'tag-db',
        role: 'primary',
      },
      {
        projectId: 'relation-project-http-test',
        tagId: 'tag-docs',
        role: 'secondary',
      },
    ]);
    expect(scenario).toMatchObject({
      disconnectedTaskExists: true,
      disconnectedTaskProjectId: null,
      deletedTaskExists: false,
      disconnectedTagExists: true,
    });
    expect(scenario.calls.map((call) => call.action)).toEqual([
      'createOne',
      'createOne',
      'updateOne',
      'updateOne',
    ]);
    expect(scenario.calls[2]?.options).toMatchObject({
      values: {
        tasks: {
          create: expect.any(Object),
          connect: expect.any(Object),
          disconnect: expect.any(Object),
          update: expect.any(Object),
          upsert: expect.any(Object),
          delete: expect.any(Object),
        },
        tags: {
          connect: expect.any(Object),
          create: expect.any(Object),
        },
      },
    });
  });

  it('rejects operations outside the example server allowlist without changing records', async () => {
    const projects = f.api.repository(relationRepositories.projects);
    const before = await loadRelationProjectState(f.api, 'project-1');
    await expect(
      projects.updateOne({
        filter: { id: 'project-1' },
        values: {
          name: 'Must not change',
          owner: { update: { values: { name: 'Must not change owner' } } },
        },
      }),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'RELATION_WRITE_FORBIDDEN',
    });
    await expect(
      projects.updateOne({
        filter: { id: 'project-1' },
        values: {
          tasks: {
            update: {
              filter: { id: 'task-edit' },
              values: { assignee: { connect: { id: 'user-2' } } },
            },
          },
        },
      }),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'RELATION_WRITE_FORBIDDEN',
    });
    expect(await loadRelationProjectState(f.api, 'project-1')).toEqual(before);
  });

  it('keeps relation scope and root mutation rollback guarantees over HTTP', async () => {
    const projects = f.api.repository<
      RelationProject,
      Record<string, unknown>,
      Record<string, unknown>
    >(relationRepositories.projects);
    await expect(
      projects.updateOne({
        filter: { id: 'project-1' },
        values: {
          tasks: {
            update: {
              filter: { id: 'task-outside' },
              values: { title: 'Must not cross relation scope' },
            },
          },
        },
      }),
    ).rejects.toMatchObject({
      reason: 'RELATION_TARGET_NOT_FOUND',
      status: 400,
    });

    const tasks = f.api.repository<
      RelationTask,
      Record<string, unknown>,
      Record<string, unknown>
    >(relationRepositories.tasks);
    expect(
      await tasks.findOne({ filter: { id: 'task-outside' } }),
    ).toMatchObject({
      title: 'Task owned by another project',
      projectId: 'project-other',
    });

    await expect(
      projects.createOne({
        values: {
          id: 'rollback-project',
          name: 'Rollback example',
          tasks: {
            create: {
              id: 'rollback-task',
              title: 'Must roll back',
              status: 'draft',
            },
          },
          tags: { connect: { id: 'missing-tag' } },
        },
        select: relationProjectSelect,
      }),
    ).rejects.toMatchObject({ reason: 'RECORD_NOT_FOUND', status: 404 });
    expect(
      await projects.findOne({
        filter: { id: 'rollback-project' },
        select: relationProjectSelect,
      }),
    ).toBeUndefined();
    expect(
      await tasks.findOne({ filter: { id: 'rollback-task' } }),
    ).toBeUndefined();
  });
});
