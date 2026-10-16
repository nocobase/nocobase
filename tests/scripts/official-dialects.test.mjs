import assert from 'node:assert/strict';
import test from 'node:test';

import { OFFICIAL_DIALECTS } from '../../packages/app/app-server/src/database/resolve-config.ts';
import { dialects as smokeDialects } from '../../scripts/smoke-database-config.mjs';
import { databases as integrationDatabases } from '../../scripts/select-db-integration-matrix.mjs';

// Runtime loading includes optional Pro drivers. OSS smoke and integration jobs
// exercise only driver packages owned by this repository.
const commercialDialects = ['dameng', 'kingbase', 'oceanbase'];
const expected = OFFICIAL_DIALECTS.filter(
  (dialect) => !commercialDialects.includes(dialect),
).sort();

test('the runtime retains automatic loading for all commercial dialects', () => {
  for (const dialect of commercialDialects)
    assert.ok(OFFICIAL_DIALECTS.includes(dialect));
});

test('the unreleased OSS smoke test offers every OSS runtime dialect', () => {
  assert.deepEqual([...smokeDialects].sort(), expected);
});

test('OSS database integration CI covers every OSS runtime dialect', () => {
  assert.deepEqual([...integrationDatabases].sort(), expected);
});
