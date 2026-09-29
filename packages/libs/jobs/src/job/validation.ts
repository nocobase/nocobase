import { Job, type JobClass } from './types.js';

export function assertJobName(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value || /[:\s]/u.test(value)) {
    throw new TypeError(
      'Job jobName must be a non-empty string without whitespace or colons.',
    );
  }
}

/** Registration never invokes a constructor. Arity checks cannot inspect dependencies hidden in its body. */
export function assertJobClass(value: unknown): asserts value is JobClass {
  if (typeof value !== 'function' || value === Job || !('prototype' in value)) {
    throw new TypeError('A job class must extend Job and accept only payload.');
  }
  const prototype: unknown = value.prototype;
  if (
    !(prototype instanceof Job) ||
    typeof prototype.execute !== 'function' ||
    value.length > 1
  ) {
    throw new TypeError(
      'A job class must extend Job, implement execute on its prototype, and require only payload.',
    );
  }
  if (!Object.hasOwn(value, 'jobName') || !('jobName' in value)) {
    throw new TypeError('A job class must declare its own static jobName.');
  }
  assertJobName(value.jobName);
}

export function assertJobProgress(value: unknown): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new RangeError('Job progress must be a number from 0 to 100.');
  }
}

/** Only JSON data is accepted; JSON.stringify must not silently erase or transform input. */
export function copyJobPayload(value: unknown): unknown {
  validateJson(value, new Set());
  const result: unknown = JSON.parse(JSON.stringify(value));
  return result;
}

function validateJson(value: unknown, parents: Set<object>): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Job payload must contain only finite JSON data.');
  }
  if (parents.has(value))
    throw new TypeError('Job payload must not contain cycles.');
  const prototype: unknown = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    throw new TypeError(
      'Job payload must not contain class instances or service objects.',
    );
  }
  parents.add(value);
  const keys = Reflect.ownKeys(value);
  if (Array.isArray(value) && keys.length !== value.length + 1) {
    throw new TypeError(
      'Job payload arrays must not have holes or extra properties.',
    );
  }
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      typeof key !== 'string' ||
      !descriptor?.enumerable ||
      !('value' in descriptor)
    ) {
      throw new TypeError(
        'Job payload must not contain symbols, accessors or hidden properties.',
      );
    }
    if (
      Array.isArray(value) &&
      (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length)
    ) {
      throw new TypeError(
        'Job payload arrays must contain only indexed values.',
      );
    }
    const child: unknown = descriptor.value;
    validateJson(child, parents);
  }
  parents.delete(value);
}
