import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';

import { createDriveManager } from '../../src/index.ts';

const require = createRequire(import.meta.url);
const sdkRequire = createRequire(require.resolve('ali-oss'));
let uploads = 0;
sdkRequire('urllib').request = async () => {
  uploads++;
  throw new Error('Failed streams must not reach OSS.');
};

let now = Date.now();
Date.now = () => now;

// No uncaughtException or input error handler: an unhandled stream error must
// terminate this child and fail the parent test.
for (const sourceKind of ['file', 'upstream']) {
  const credentialsFail = process.argv[2] === 'credentials-fail';
  const metadataStarted = Promise.withResolvers();
  const metadataResponse = Promise.withResolvers();
  let blocked = false;
  let reads = 0;
  globalThis.fetch = async (_url, options) => {
    if (credentialsFail) return new Response('', { status: 403 });
    if (options.method === 'PUT') return new Response('test-metadata-token');
    reads++;
    if (blocked) {
      metadataStarted.resolve();
      await metadataResponse.promise;
    }
    return Response.json({
      Code: 'Success',
      AccessKeyId: `test-key-${reads}`,
      AccessKeySecret: `test-secret-${reads}`,
      SecurityToken: `test-token-${reads}`,
      Expiration: new Date(now + 3600000).toISOString(),
    });
  };
  const storage = createDriveManager({
    default: 'oss',
    disks: {
      oss: {
        driver: 'oss',
        region: 'oss-cn-hangzhou',
        bucket: 'test-bucket',
        visibility: 'private',
        credentials: { provider: 'aliyun-ecs-ram-role', roleName: 'test-role' },
      },
    },
  }).use();
  const refreshing = process.argv[2] === 'refresh';
  if (refreshing) {
    await storage.getSignedUrl('file');
    now += 56 * 60000;
  }
  blocked = true;
  const source =
    sourceKind === 'file'
      ? createReadStream(new URL('./missing-test-secret.txt', import.meta.url))
      : new Readable({
          construct(callback) {
            if (credentialsFail)
              setImmediate(() => callback(new Error('test-secret')));
            else callback();
          },
          read() {},
        });
  const closed = new Promise((resolve) => source.once('close', resolve));
  const rejection = assert.rejects(
    storage.putStream('file', source),
    (error) => {
      assert.equal(error.code, 'E_CANNOT_WRITE_FILE');
      assert.doesNotMatch(
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
        /test-secret|test-token|test-key|ENOENT/,
      );
      return true;
    },
  );
  if (!credentialsFail) {
    await metadataStarted.promise;
    if (sourceKind === 'upstream') source.destroy(new Error('test-secret'));
    // Refresh can finish in the same turn while the source error is still queued.
    if (refreshing && sourceKind === 'upstream') metadataResponse.resolve();
  }
  await closed;
  metadataResponse.resolve();
  await rejection;
  assert.equal(reads, credentialsFail ? 0 : refreshing ? 2 : 1);
  assert.equal(uploads, 0);
  assert.equal(source.listenerCount('error'), 0);
  assert.equal(source.listenerCount('close'), 0);
}
console.log(
  'Process survived; failed uploads rejected, redacted and never sent.',
);
