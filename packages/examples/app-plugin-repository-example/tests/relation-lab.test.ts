import { afterEach, beforeEach, expect, it } from 'vitest';
import { createFixture } from './helpers.js';
import {
  prepareRelationLab,
  loadRelationLab,
  executeRelationLab,
  relationOperations,
  type LabInput,
} from '../client/relation-lab.js';
import { relationRepositories } from '../client/relation-mutations.js';
let f: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  f = await createFixture();
});
afterEach(async () => {
  await f.destroy();
});
const cases = relationOperations.flatMap((operation) =>
  (['profile', 'tasks', 'tags'] as const)
    .filter((relation) => operation !== 'set' || relation !== 'profile')
    .map((relation) => ({ operation, relation })),
);
it.each(cases)(
  '$operation on $relation keeps the documented target lifetime and scope',
  async ({ operation, relation }) => {
    const lab = await prepareRelationLab(f.api, operation, relation);
    const before = await loadRelationLab(f.api, lab);
    const initial = before.targets.filter((item) => item.linked);
    const target =
      operation === 'connect'
        ? before.targets.find((item) => !item.linked)!.id
        : operation === 'upsert'
          ? lab.nextId
          : (initial[0]?.id ?? '');
    const input: LabInput = {
      targetId: target,
      selectedIds: [lab.targetIds[1]!, lab.targetIds[2]!],
      content: `Edited ${lab.projectId}`,
      points: 12,
      status: 'open',
      role: 'primary',
    };
    const result = await executeRelationLab(f.api, lab, input);
    expect(result.call.options).toMatchObject({
      values: { [relation]: { [operation]: expect.anything() } },
    });
    const after = await loadRelationLab(f.api, result.lab);
    const changed = after.targets.find(
      (item) => item.id === (operation === 'create' ? lab.nextId : target),
    );
    if (
      operation === 'create' ||
      operation === 'connect' ||
      operation === 'upsert'
    )
      expect(changed).toMatchObject({ exists: true, linked: true });
    if (operation === 'disconnect')
      expect(
        after.targets.find((item) => item.id === initial[0]!.id),
      ).toMatchObject({ exists: true, linked: false });
    if (operation === 'delete')
      expect(
        after.targets.find((item) => item.id === initial[0]!.id),
      ).toMatchObject({ exists: false, linked: false });
    if (operation === 'update')
      expect(
        after.targets.find((item) => item.id === initial[0]!.id)?.record,
      ).toMatchObject({
        [relation === 'profile'
          ? 'summary'
          : relation === 'tags'
            ? 'label'
            : 'title']: input.content,
      });
    if (operation === 'set') {
      expect(
        after.targets.filter((item) => item.linked).map((item) => item.id),
      ).toEqual(input.selectedIds);
      expect(after.targets.every((item) => item.exists)).toBe(true);
      if (relation === 'tags')
        expect(
          after.project.through.every((edge) => edge.role === 'primary'),
        ).toBe(true);
      const cleared = await executeRelationLab(f.api, result.lab, {
        ...input,
        selectedIds: [],
      });
      expect(
        (await loadRelationLab(f.api, cleared.lab)).targets.every(
          (item) => item.exists && !item.linked,
        ),
      ).toBe(true);
    }
    if (operation === 'upsert') {
      const updated = await executeRelationLab(f.api, result.lab, {
        ...input,
        content: `Updated ${lab.projectId}`,
      });
      const snapshot = await loadRelationLab(f.api, updated.lab);
      expect(snapshot.targets.filter((item) => item.exists)).toHaveLength(5);
      expect(
        snapshot.targets.find((item) => item.id === target)?.record,
      ).toMatchObject({
        [relation === 'profile'
          ? 'summary'
          : relation === 'tags'
            ? 'label'
            : 'title']: `Updated ${lab.projectId}`,
      });
    }
  },
);
it('rejects targets outside relation scope and fields outside the server policy', async () => {
  const lab = await prepareRelationLab(f.api, 'update', 'tasks');
  const input = {
    targetId: lab.targetIds[3]!,
    selectedIds: [],
    content: 'Forbidden',
    points: 1,
    status: 'draft',
    role: '',
  };
  await expect(executeRelationLab(f.api, lab, input)).rejects.toMatchObject({
    code: 'RELATION_TARGET_NOT_FOUND',
  });
  await expect(
    f.api.repository(relationRepositories.projects).updateOne({
      filter: { id: lab.projectId },
      values: {
        profile: {
          create: {
            id: 'forbidden-profile',
            summary: 'Forbidden',
            projectId: 'another-project',
          },
        },
      },
    }),
  ).rejects.toMatchObject({ status: 403 });
});
