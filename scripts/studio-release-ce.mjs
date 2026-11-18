import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const publicRegistries = [
  'registry.cn-shanghai.aliyuncs.com',
  'docker.io',
];
const repository = 'nocobase/studio-ce';

function digestOf(reference, anonymous = false) {
  try {
    const manifest = execFileSync(
      'skopeo',
      [
        'inspect',
        '--raw',
        ...(anonymous ? ['--no-creds'] : []),
        'docker://' + reference,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return 'sha256:' + createHash('sha256').update(manifest).digest('hex');
  } catch (error) {
    if (/manifest unknown|name unknown/i.test(String(error.stderr)))
      return null;
    throw error;
  }
}

function copy(source, target) {
  execFileSync(
    'skopeo',
    [
      'copy',
      '--all',
      '--preserve-digests',
      'docker://' + source,
      'docker://' + target,
    ],
    { stdio: 'inherit' },
  );
}

export function publishCommunity(
  host,
  plan,
  digest,
  inspect = digestOf,
  publish = copy,
) {
  if (!publicRegistries.includes(host)) throw new Error('Unknown CE registry.');
  const image = plan.images.find((entry) => entry.edition === 'studio-ce');
  if (image?.repository !== repository || !/^sha256:[0-9a-f]{64}$/.test(digest))
    throw new Error('Missing Studio CE publication identity.');
  const source = 'pkg-v3.nocobase.com/' + repository + '@' + digest;
  const targets = [plan.version, ...Object.keys(image.aliases)].map((tag) => ({
    reference: host + '/' + repository + ':' + tag,
    prior: tag === plan.version ? null : image.aliases[tag],
  }));
  function check({ reference, prior }) {
    const current = inspect(reference);
    if (current && current !== digest && current !== prior)
      throw new Error('Conflicting public tag: ' + reference);
    return current;
  }
  targets.forEach(check);
  for (const target of targets) {
    if (check(target) !== digest) {
      // Blobs already exist in the destination once its version tag is published.
      const from =
        target === targets[0] ? source : host + '/' + repository + '@' + digest;
      publish(from, target.reference);
    }
    if (inspect(target.reference, true) !== digest)
      throw new Error(
        'Anonymous manifest digest mismatch: ' + target.reference,
      );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  publishCommunity(
    process.env.DESTINATION,
    JSON.parse(process.env.IMAGE_PLAN),
    process.env.CE_DIGEST,
  );
