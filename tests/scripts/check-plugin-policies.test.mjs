import assert from 'node:assert/strict';
import test from 'node:test';
import { policyErrors } from '../../scripts/check-plugin-policies.mjs';

const name = '@nocobase/app-plugin-knowledge';
function check(policy, sections, registered = []) {
  const template = Object.fromEntries(
    sections.map((key) => [key, { [name]: 'workspace:*' }]),
  );
  const registrations = Object.fromEntries(
    ['server', 'client', 'cli'].map((side) => [
      side,
      new Set(registered.includes(side) ? [name] : []),
    ]),
  );
  return policyErrors(
    {
      name,
      exports: { './server': {}, './client': {} },
      nocobase: { pluginPolicy: policy },
    },
    template,
    registrations,
  );
}

test('only preinstalled plugins belong exclusively in devDependencies and have no registrations', () => {
  assert.deepEqual(check('preinstall-only', ['devDependencies']), []);
  assert.match(
    check('preinstall-only', ['dependencies'])[0],
    /expected devDependencies in Default, found dependencies/,
  );
  assert.equal(
    check('preinstall-only', ['dependencies', 'devDependencies']).length,
    1,
  );
  assert.match(
    check('preinstall-only', ['devDependencies'], ['client'])[0],
    /unexpected registration/,
  );
});

test('enabled plugins require their exported entry points and a runtime dependency', () => {
  assert.deepEqual(
    check('preinstall-and-enable', ['dependencies'], ['server', 'client']),
    [],
  );
  assert.match(
    check('preinstall-and-enable', ['dependencies'], ['server'])[0],
    /missing registration in Default client/,
  );
  assert.equal(
    check('preinstall-and-enable', [], ['server', 'client']).length,
    1,
  );
});

test('excluded and deprecated plugins are absent; missing and unknown policies fail', () => {
  for (const policy of ['do-not-preinstall', 'deprecated']) {
    assert.deepEqual(check(policy, []), []);
    assert.equal(check(policy, ['devDependencies'], ['server']).length, 2);
  }
  for (const policy of [undefined, 'unknown'])
    assert.match(check(policy, [])[0], /nocobase.pluginPolicy/);
});
