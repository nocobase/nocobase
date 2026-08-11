/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class PortalRegistryError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.status = options.status;
    this.code = options.code;
  }
}

export class InvalidPortalIdError extends PortalRegistryError {
  constructor(id: string) {
    super(
      `Invalid portal id "${id}". Use letters, numbers, underscores, hyphens, or one appName:portalName separator.`,
      {
        status: 400,
        code: 'PORTAL_INVALID_ID',
      },
    );
  }
}

export class PortalAlreadyExistsError extends PortalRegistryError {
  constructor(id: string) {
    super(`Portal "${id}" already exists`, {
      status: 409,
      code: 'PORTAL_ALREADY_EXISTS',
    });
  }
}

export class PortalNotFoundError extends PortalRegistryError {
  constructor(id: string) {
    super(`Portal "${id}" does not exist`, {
      status: 404,
      code: 'PORTAL_NOT_FOUND',
    });
  }
}

export class PortalCreateFailedError extends PortalRegistryError {
  constructor(id: string, cause: unknown) {
    super(`Portal "${id}" failed to initialize`, {
      status: 500,
      code: 'PORTAL_CREATE_FAILED',
      cause,
    });
  }
}

export class PortalReloadFailedError extends PortalRegistryError {
  constructor(id: string, cause: unknown) {
    super(`Portal "${id}" failed to reload`, {
      status: 500,
      code: 'PORTAL_RELOAD_FAILED',
      cause,
    });
  }
}

export class PortalCapacityExceededError extends PortalRegistryError {
  constructor(maxActivePortals: number) {
    super(`Active portal capacity exceeded and no idle portal can be evicted. maxActivePortals=${maxActivePortals}`, {
      status: 503,
      code: 'PORTAL_CAPACITY_EXCEEDED',
    });
  }
}
