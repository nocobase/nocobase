/**
 * Names and labels. Everything the backend creates carries `org.nocobase.app-host.*` labels, which is how it finds its
 * containers, images, volumes and networks again after a restart; names only have to be unique and readable.
 */
import { createHash } from 'node:crypto';

import type { DockerSettings } from './config.js';

export const LABEL: {
  readonly managed: 'org.nocobase.app-host.managed';
  readonly scope: 'org.nocobase.app-host.scope';
  readonly app: 'org.nocobase.app-host.app';
  readonly deployment: 'org.nocobase.app-host.deployment';
  readonly generation: 'org.nocobase.app-host.generation';
  readonly version: 'org.nocobase.app-host.version';
  readonly checksum: 'org.nocobase.app-host.checksum';
  readonly image: 'org.nocobase.app-host.image';
  readonly role: 'org.nocobase.app-host.role';
} = {
  managed: 'org.nocobase.app-host.managed',
  scope: 'org.nocobase.app-host.scope',
  app: 'org.nocobase.app-host.app',
  deployment: 'org.nocobase.app-host.deployment',
  generation: 'org.nocobase.app-host.generation',
  version: 'org.nocobase.app-host.version',
  checksum: 'org.nocobase.app-host.checksum',
  image: 'org.nocobase.app-host.image',
  role: 'org.nocobase.app-host.role',
} as const;

export type ResourceRole = 'app';

export const APP_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+$/;

/**
 * An App ID as a Docker image repository and DNS label component: lowercase, separators collapsed. When that changes
 * the ID (case, underscores), a short hash keeps two IDs from mapping to the same name.
 */
export function appSlug(appId: string): string {
  const slug = appId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{3,}/g, '--')
    .replace(/^-+|-+$/g, '');
  const base = slug.slice(0, 48) || 'app';
  if (base === appId) return base;
  return `${base}-${createHash('sha256').update(appId).digest('hex').slice(0, 6)}`;
}

export class Names {
  public constructor(
    private readonly config: DockerSettings,
    private readonly scopeId: string,
  ) {}

  public get prefix(): string {
    return this.config.namePrefix;
  }

  public imageRepository(appId: string): string {
    return `${this.prefix}${appSlug(appId)}`;
  }

  /**
   * The local tag of a release image pulled from a registry by digest: `d-` and the first 12 hex of the digest.
   */
  public pulledImage(appId: string, digest: string): string {
    return `${this.imageRepository(appId)}:d-${digest
      .replace(/^sha256:/u, '')
      .slice(0, 12)
      .toLowerCase()}`;
  }

  /**
   * A container per App definition: its deployment and a short hash of everything the container is created from
   * (`generation`), so a definition that changed gets a new container beside the running one, and the same definition
   * after a Host restart finds its container again.
   */
  public container(
    appId: string,
    deploymentId: string,
    generation: string = '',
  ): string {
    return `${this.prefix}${appSlug(appId)}-${deploymentId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toLowerCase()}${generation ? `-${generation.slice(0, 6)}` : ''}`;
  }

  public volume(appId: string): string {
    return `${this.prefix}${appSlug(appId)}-storage`;
  }

  /** The environment's network, which its Apps share. */
  public network(): string {
    return `${this.prefix}apps`;
  }

  public labels(
    role: ResourceRole,
    extra: Readonly<Record<string, string>> = {},
  ): Record<string, string> {
    return {
      [LABEL.managed]: 'true',
      [LABEL.scope]: this.scopeId,
      [LABEL.role]: role,
      ...extra,
    };
  }

  /** Selects this scope's resources of one role (and App). */
  public selector(role: ResourceRole, appId?: string): Record<string, string> {
    return {
      [LABEL.scope]: this.scopeId,
      [LABEL.role]: role,
      ...(appId ? { [LABEL.app]: appId } : {}),
    };
  }
}
