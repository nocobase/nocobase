/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface TypeScriptWorkerOwnerResource {
  dispose(): void;
}

export interface TypeScriptWorkerOwner {
  getResource<T extends TypeScriptWorkerOwnerResource>(create: () => T): T;
}

export class SharedTypeScriptWorkerOwner implements TypeScriptWorkerOwner {
  private disposed = false;
  private resource: TypeScriptWorkerOwnerResource | null = null;

  getResource<T extends TypeScriptWorkerOwnerResource>(create: () => T): T {
    if (this.disposed) throw new Error('TypeScript worker owner has been disposed.');
    this.resource ||= create();
    return this.resource as T;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resource?.dispose();
    this.resource = null;
  }
}
