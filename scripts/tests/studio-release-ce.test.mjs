import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { publicRegistries, publishCommunity } from '../studio-release-ce.mjs';

const version = '1.0.0-beta.82';
const repository = 'nocobase/studio-ce';
const old = 'sha256:' + 'a'.repeat(64);
const digest = 'sha256:' + 'b'.repeat(64);
const plan = {
  version,
  images: [{ edition: 'studio-ce', repository, aliases: { beta: old } }],
};

for (const host of publicRegistries) {
  test(
    host + ' copies only CE, resumes a partial run and protects existing tags',
    () => {
      const ref = (tag) => host + '/' + repository + ':' + tag;
      const tags = new Map([[ref('beta'), old]]);
      const writes = [];
      const inspect = (name) => tags.get(name);
      let fail = true;
      function publish(source, target) {
        assert.equal(
          source,
          (target === ref(version) ? 'pkg-v3.nocobase.com' : host) +
            '/' +
            repository +
            '@' +
            digest,
        );
        if (target === ref('beta') && fail) throw new Error('interrupted');
        writes.push(target);
        tags.set(target, digest);
      }
      const run = () => publishCommunity(host, plan, digest, inspect, publish);
      assert.throws(run, /interrupted/);
      fail = false;
      run();
      run();
      assert.deepEqual(writes, [ref(version), ref('beta')]);
      tags.set(ref(version), old);
      assert.throws(run, /Conflicting/);
      tags.delete(ref(version));
      tags.set(ref('beta'), 'changed');
      assert.throws(run, /Conflicting/);
      assert.equal(tags.has(ref(version)), false);
    },
  );
}
test('both public jobs gate the release and are skipped in a dry run', () => {
  const yaml = readFileSync(
    new URL('../../.github/workflows/v3-studio-release.yml', import.meta.url),
    'utf8',
  );
  const job = yaml.split('\n  public-ce:\n')[1].split('\n  release:\n')[0];
  assert.ok(job.includes('registry: [' + publicRegistries.join(', ') + ']'));
  assert.ok(job.includes('fail-fast: false'));
  assert.ok(job.includes('if: ${{ !inputs.dry_run }}'));
  assert.ok(
    yaml
      .split('\n  release:\n')[1]
      .includes('needs: [prepare, manifest, public-ce]'),
  );
});
