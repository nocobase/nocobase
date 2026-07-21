/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionKind,
  LightExtensionReferenceOwnerKind,
  LightExtensionReferenceOwnerLocator,
} from './types';

export const LIGHT_EXTENSION_CONTEXT_PACK_VERSION = 'light-extension.context-pack.v1';

export type LightExtensionContextMode = 'generic' | 'multiple' | 'precise';

export interface LightExtensionContextPackInput {
  repoId: string;
  entryId: string;
  referenceId?: string;
  ownerLocator?: LightExtensionReferenceOwnerLocator;
}

export interface LightExtensionContextReferenceSummary {
  id: string;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  ownerLocatorHash: string;
  resolvedStatus: string;
}

export interface LightExtensionOwnerAuthoringContextDescriptor {
  ownerKind: LightExtensionReferenceOwnerKind;
  modelUid: string;
  modelUse: string;
  surface: string;
  dataSourceKey?: string;
  collectionName?: string;
}

export interface LightExtensionContextField {
  name: string;
  interface?: string;
  type?: string;
  nullable: boolean;
  enum?: Array<string | number | boolean>;
  associationTarget?: string;
  readable: boolean;
  writable: boolean;
}

export interface LightExtensionContextCollection {
  dataSourceKey: string;
  name: string;
  title?: string;
  fields: LightExtensionContextField[];
}

export interface LightExtensionContextPack {
  contextPackVersion: typeof LIGHT_EXTENSION_CONTEXT_PACK_VERSION;
  contextMode: LightExtensionContextMode;
  reason: string;
  repoId: string;
  entry: {
    id: string;
    kind: LightExtensionKind;
    entryName: string;
    entryPath: string;
    settingsSchema: Record<string, unknown> | null;
  };
  references: LightExtensionContextReferenceSummary[];
  binding?: {
    referenceId: string;
    ownerLocatorHash: string;
    owner: LightExtensionOwnerAuthoringContextDescriptor;
  };
  collection?: LightExtensionContextCollection;
  supportedImports: string[];
  versions: {
    sdk: string;
    validator: string;
  };
  contextHash: string;
}

export interface LightExtensionOwnerAuthoringContextResolverInput {
  reference: LightExtensionContextReferenceSummary & {
    kind: LightExtensionKind;
    repoId: string;
    entryId: string;
  };
  owner: Record<string, unknown>;
}

export interface LightExtensionOwnerAuthoringContextResolver {
  ownerKinds: readonly LightExtensionReferenceOwnerKind[];
  describe(
    input: LightExtensionOwnerAuthoringContextResolverInput,
  ): LightExtensionOwnerAuthoringContextDescriptor | null;
}
