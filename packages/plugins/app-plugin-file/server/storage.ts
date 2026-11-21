import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type {
  AppDriveConfig,
  AppDriveDiskDefinition,
  NocoBaseDriveDisk,
} from '@nocobase/drive';

/**
 * The file storage settings: what the application's `drive` configuration says about each disk, and a check that a
 * disk can really be written, read and deleted.
 *
 * Everything returned here is built field by field from an allowlist. No configuration object is ever copied, so
 * credentials, secrets and absolute paths on this machine cannot reach a response. A failure is reported as a fixed
 * code plus the error's own `name` or `code`, never its message, which a storage SDK may fill with request details.
 */

export type DiskDriver = 'fs' | 's3' | 'oss' | 'custom';
export type DiskVisibility = 'public' | 'private';
/** Where a setting's current value comes from. */
export type SettingSource = 'code' | 'config' | 'default';
/** How files on the disk are downloaded. */
export type DiskUrls = 'application' | 'public' | 'signed';

/** Why a disk cannot be used as configured. */
export type DiskProblem =
  | 'LOCATION_MISSING'
  | 'BUCKET_MISSING'
  | 'REGION_MISSING'
  | 'CREDENTIALS_MISSING'
  | 'NOT_LOADED';

export interface DiskLocation {
  /** fs: the directory relative to the application directory; null when it lies outside it. */
  readonly path: string | null;
  /** fs: whether the directory lies outside the application directory. */
  readonly outsideApp: boolean;
  /** s3 and oss: the bucket; null when it is empty. */
  readonly bucket: string | null;
  readonly region: string | null;
  /** s3: the host of a custom endpoint, without any user information. */
  readonly endpointHost: string | null;
}

export interface DiskDescription {
  readonly name: string;
  readonly driver: DiskDriver;
  readonly location: DiskLocation;
  readonly visibility: DiskVisibility | null;
  readonly maxFileSizeMb: number;
  readonly urls: DiskUrls;
  readonly isDefault: boolean;
  readonly complete: boolean;
  readonly problems: readonly DiskProblem[];
  readonly sources: {
    readonly driver: SettingSource;
    readonly location: SettingSource;
    readonly visibility: SettingSource;
    readonly maxFileSizeMb: SettingSource;
  };
}

export type CheckStepName = 'write' | 'read' | 'url' | 'delete';
export type CheckStepStatus = 'passed' | 'failed' | 'skipped';

export interface CheckStep {
  readonly step: CheckStepName;
  readonly status: CheckStepStatus;
  /**
   * What the step found. `write`: the temporary file's key; `read`: the bytes compared; `url`: `APPLICATION` (the
   * application serves the file), `PUBLIC` or `SIGNED`; `delete`: nothing.
   */
  readonly detail: string | null;
  /** A fixed code naming what failed, such as `WRITE_FAILED` or `CONFIG_INCOMPLETE`. */
  readonly reason: string | null;
  /** The failing error's own `name` or `code`, such as `AccessDenied`, when it is a plain identifier. */
  readonly errorName: string | null;
}

export interface CheckResult {
  readonly disk: string;
  readonly ok: boolean;
  readonly checkedAt: string;
  readonly steps: readonly CheckStep[];
}

export interface DescribeDisksInput {
  /** The merged `drive` section, before the application drops incomplete disks. */
  readonly drive: AppDriveConfig | undefined;
  /** The configuration layers, to tell code defaults from configured values. */
  readonly layers?: {
    readonly defaults: Record<string, unknown>;
    readonly overrides: Record<string, unknown>;
  };
  /** The application directory, which fs locations are shown relative to. */
  readonly rootDir: string;
  /** The disks Drive actually loaded. */
  readonly loaded: readonly string[];
}

const DEFAULT_MAX_FILE_SIZE_MB = 20;

/** The directory the check writes in, on every disk. */
export const CHECK_DIRECTORY = '.nocobase-check';
const CHECK_CONTENT = 'nocobase-ok\n';

export function describeDisks(input: DescribeDisksInput): DiskDescription[] {
  const disks = input.drive?.disks ?? {};
  return Object.entries(disks).map(([name, definition]) =>
    describeDisk(name, definition, input),
  );
}

function describeDisk(
  name: string,
  definition: AppDriveDiskDefinition,
  input: DescribeDisksInput,
): DiskDescription {
  const isDefault = input.drive?.default === name;
  const sourceOf = (...keys: string[]): SettingSource => {
    if (!input.layers) return 'config';
    const paths = keys.map((key) => ['drive', 'disks', name, key]);
    if (paths.some((item) => valueAt(input.layers!.overrides, item) !== undefined))
      return 'config';
    if (paths.some((item) => valueAt(input.layers!.defaults, item) !== undefined))
      return 'code';
    return 'default';
  };
  const maxFileSizeMb =
    readPositiveInteger(definition.maxFileSizeMb) ?? DEFAULT_MAX_FILE_SIZE_MB;
  const emptyLocation: DiskLocation = {
    path: null,
    outsideApp: false,
    bucket: null,
    region: null,
    endpointHost: null,
  };
  if (typeof definition === 'function') {
    return {
      name,
      driver: 'custom',
      location: emptyLocation,
      visibility: null,
      maxFileSizeMb,
      urls: 'application',
      isDefault,
      complete: input.loaded.includes(name),
      problems: input.loaded.includes(name) ? [] : ['NOT_LOADED'],
      sources: {
        driver: 'code',
        location: 'code',
        visibility: 'code',
        maxFileSizeMb: sourceOf('maxFileSizeMb'),
      },
    };
  }
  const problems: DiskProblem[] = [];
  let location = emptyLocation;
  const visibility: DiskVisibility | null =
    definition.visibility === 'public' || definition.visibility === 'private'
      ? definition.visibility
      : null;
  let urls: DiskUrls;
  if (definition.driver === 'fs') {
    const configured = nonEmpty(definition.location);
    if (!configured) problems.push('LOCATION_MISSING');
    location = { ...emptyLocation, ...relativeLocation(configured, input.rootDir) };
    urls = visibility === 'public' && nonEmpty(definition.url) ? 'public' : 'application';
  } else {
    const bucket = nonEmpty(definition.bucket);
    const region = nonEmpty(definition.region);
    if (!bucket) problems.push('BUCKET_MISSING');
    if (!region) problems.push('REGION_MISSING');
    if (definition.driver === 'oss') {
      const credentials = definition.credentials as
        Record<string, unknown> | undefined;
      if (
        !credentials ||
        (!credentials.provider &&
          !(nonEmpty(credentials.accessKeyId) && nonEmpty(credentials.accessKeySecret)))
      )
        problems.push('CREDENTIALS_MISSING');
    }
    location = {
      ...emptyLocation,
      bucket,
      region,
      endpointHost:
        definition.driver === 's3' ? hostOf(definition.endpoint) : null,
    };
    urls = visibility === 'public' ? 'public' : 'signed';
  }
  if (problems.length === 0 && !input.loaded.includes(name))
    problems.push('NOT_LOADED');
  return {
    name,
    driver: definition.driver === 'fs' || definition.driver === 's3' || definition.driver === 'oss'
      ? definition.driver
      : 'custom',
    location,
    visibility,
    maxFileSizeMb,
    urls,
    isDefault,
    complete: problems.length === 0,
    problems,
    sources: {
      driver: sourceOf('driver'),
      location: sourceOf('location', 'bucket', 'region', 'endpoint'),
      visibility: sourceOf('visibility'),
      maxFileSizeMb: sourceOf('maxFileSizeMb'),
    },
  };
}

export interface RunCheckInput {
  readonly disk: DiskDescription;
  readonly drive: { use(disk: string): NocoBaseDriveDisk };
  /** Where the raw error goes; never into the response. */
  readonly log?: (message: string, error: unknown) => void;
  readonly now?: () => Date;
}

/**
 * Writes a temporary file under `.nocobase-check/`, reads it back and compares it, asks for its URL, and deletes it.
 * Only that file is touched. A disk whose configuration is incomplete is not contacted.
 */
export async function runCheck(input: RunCheckInput): Promise<CheckResult> {
  const { disk } = input;
  const now = input.now ?? (() => new Date());
  const steps: CheckStep[] = [];
  const step = (
    name: CheckStepName,
    status: CheckStepStatus,
    detail: string | null = null,
    reason: string | null = null,
    error?: unknown,
  ): void => {
    steps.push({
      step: name,
      status,
      detail,
      reason,
      errorName: error === undefined ? null : errorNameOf(error),
    });
    if (error !== undefined)
      input.log?.(`File storage check of disk "${disk.name}" failed at ${name}.`, error);
  };
  const finish = (): CheckResult => ({
    disk: disk.name,
    ok: steps.every((item) => item.status === 'passed'),
    checkedAt: now().toISOString(),
    steps,
  });
  if (!disk.complete) {
    step('write', 'failed', disk.problems.join(','), 'CONFIG_INCOMPLETE');
    for (const name of ['read', 'url', 'delete'] as const) step(name, 'skipped');
    return finish();
  }
  const key = `${CHECK_DIRECTORY}/${randomUUID()}.txt`;
  let driver: NocoBaseDriveDisk;
  try {
    driver = input.drive.use(disk.name);
  } catch (error) {
    step('write', 'failed', null, 'DISK_UNAVAILABLE', error);
    for (const name of ['read', 'url', 'delete'] as const) step(name, 'skipped');
    return finish();
  }
  let written = false;
  try {
    await driver.put(key, CHECK_CONTENT);
    written = true;
    step('write', 'passed', key);
  } catch (error) {
    step('write', 'failed', key, 'WRITE_FAILED', error);
  }
  if (written) {
    try {
      const content = await driver.get(key);
      if (content === CHECK_CONTENT)
        step('read', 'passed', String(Buffer.byteLength(CHECK_CONTENT)));
      else step('read', 'failed', null, 'CONTENT_MISMATCH');
    } catch (error) {
      step('read', 'failed', null, 'READ_FAILED', error);
    }
    if (disk.urls === 'application') step('url', 'passed', 'APPLICATION');
    else {
      try {
        // The URL itself is never returned: a signed one carries an access key id and a signature.
        if (disk.urls === 'signed')
          await driver.getSignedUrl(key, { expiresIn: '1m' });
        else await driver.getUrl(key);
        step('url', 'passed', disk.urls === 'signed' ? 'SIGNED' : 'PUBLIC');
      } catch (error) {
        step('url', 'failed', null, 'URL_FAILED', error);
      }
    }
  } else {
    step('read', 'skipped');
    step('url', 'skipped');
  }
  // Always try to remove the file, even after a failed write, which may have left part of it behind.
  try {
    await driver.delete(key);
    step('delete', written ? 'passed' : 'skipped');
  } catch (error) {
    if (written) step('delete', 'failed', null, 'DELETE_FAILED', error);
    else step('delete', 'skipped');
  }
  return finish();
}

/** A storage SDK's error class or code, such as `AccessDenied` or `ENOENT`, never its message. */
function errorNameOf(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const identifier = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/;
  for (const key of ['code', 'Code', 'name'] as const) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === 'string' && identifier.test(value) && value !== 'Error')
      return value;
  }
  return null;
}

function relativeLocation(
  location: string | null,
  rootDir: string,
): Pick<DiskLocation, 'path' | 'outsideApp'> {
  if (!location) return { path: null, outsideApp: false };
  const relative = path.relative(rootDir, path.resolve(rootDir, location));
  if (relative.startsWith('..') || path.isAbsolute(relative))
    return { path: null, outsideApp: true };
  return {
    path: relative ? `${relative.split(path.sep).join('/')}/` : './',
    outsideApp: false,
  };
}

function hostOf(endpoint: unknown): string | null {
  if (typeof endpoint !== 'string' || !endpoint) return null;
  try {
    // `host` leaves out user information and the path, which may carry credentials or tokens.
    return new URL(endpoint).host || null;
  } catch {
    return null;
  }
}

function nonEmpty(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readPositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function valueAt(source: unknown, segments: readonly string[]): unknown {
  let current = source;
  for (const segment of segments) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
