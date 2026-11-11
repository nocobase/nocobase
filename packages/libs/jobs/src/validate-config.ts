import type { JobsConfig } from './config.js';

function plainObject(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    throw new TypeError(`${path} must be a plain object.`);
}

/** Validate the entire section before selection; never discard legacy or unknown fields. */
export function validateJobsConfig(
  value: unknown,
): asserts value is JobsConfig | undefined {
  if (value === undefined) return;
  plainObject(value, 'jobs');
  for (const key of Reflect.ownKeys(value)) {
    if (key === 'default' || key === 'backends') continue;
    const path =
      typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/u.test(key)
        ? `jobs.${key}`
        : 'jobs';
    const target =
      path === 'jobs'
        ? 'jobs.backends'
        : path.replace('jobs.', 'jobs.backends.');
    throw new Error(
      `${path} uses the old configuration format or an unknown top-level field. Move backend entries to ${target}. Keep jobs.default set to the selected backend name.`,
    );
  }
  const backends = value.backends;
  if (backends !== undefined) {
    plainObject(backends, 'jobs.backends');
    for (const key of Reflect.ownKeys(backends)) {
      if (typeof key !== 'string')
        throw new TypeError(
          'jobs.backends must use string configuration names.',
        );
      const entry = backends[key];
      const path = /^[A-Za-z][A-Za-z0-9_-]*$/u.test(key)
        ? `jobs.backends.${key}`
        : 'jobs.backends entry';
      plainObject(entry, path);
      if (typeof entry.adapter !== 'string' || entry.adapter.trim() === '')
        throw new TypeError(`${path}.adapter must be a non-empty string.`);
    }
  }
  if (value.default !== undefined) {
    if (typeof value.default !== 'string' || value.default.trim() === '')
      throw new TypeError('jobs.default must be a non-empty string.');
    if (
      value.default === 'default' ||
      !backends ||
      !Object.hasOwn(backends, value.default)
    )
      throw new Error(
        'jobs.default must name an existing configuration in jobs.backends.',
      );
  }
}
