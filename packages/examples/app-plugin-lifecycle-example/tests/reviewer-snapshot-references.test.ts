import { expect } from 'vitest';
import { reviewerServices } from '../server/configuration/reviewers.js';
import { test } from './fixtures.js';

for (const [type, referenceId, collection] of [
  ['department', 'finance-one', 'lifecycleExampleDepartments'],
  ['role', 'reviewer', 'lifecycleExampleRoles'],
  ['user', 'zhao', 'lifecycleExamplePeople'],
] as const) {
  test(`a fixed ${type} reference resolves no candidates after deletion`, async ({
    database,
  }) => {
    const selected = [{ group: 1, type, referenceId }];
    const service = reviewerServices(database, undefined);
    expect((await service.reviewers(selected, 'lin')).length).toBeGreaterThan(
      0,
    );
    await database
      .repository(collection)
      .deleteMany({ filter: { id: referenceId } });
    expect(await service.reviewers(selected, 'lin')).toEqual([]);
    expect(await service.reviewers([], 'lin')).toEqual([]);
  });
}
