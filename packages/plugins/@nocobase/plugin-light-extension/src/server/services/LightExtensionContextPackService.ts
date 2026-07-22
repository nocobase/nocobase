/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import sdkPackageJson from '@nocobase/light-extension-sdk/package.json';
import type { Database, Model } from '@nocobase/database';
import { sha256Hex, stableSerialize } from '@nocobase/runjs';

import type { LightExtensionKind } from '../../constants';
import {
  LIGHT_EXTENSION_CONTEXT_PACK_VERSION,
  type LightExtensionContextCollection,
  type LightExtensionContextField,
  type LightExtensionContextPack,
  type LightExtensionContextPackInput,
  type LightExtensionContextReferenceSummary,
} from '../../shared/context-pack';
import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionReferenceRecord } from '../../shared/types';
import { entryFromModel } from './LightExtensionEntryService';
import type { LightExtensionCanFunction } from './LightExtensionPermissionService';
import { hashReferenceOwnerLocator, ReferenceOwnerAuthoringContextResolverRegistry } from './ReferenceOwnerRegistry';
import { ReferenceService } from './ReferenceService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LIGHT_EXTENSION_VALIDATOR_VERSION } from './LightExtensionValidator';

const SUPPORTED_IMPORTS = [
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
  'react',
  'react-dom/client',
  'antd',
  '@ant-design/icons',
  'dayjs',
  'lodash',
  'mathjs',
  '@formulajs/formulajs',
];
const MAX_CONTEXT_FIELDS = 512;
const MAX_CONTEXT_REFERENCES = 128;
const MAX_CONTEXT_ENUM_VALUES = 128;
const MAX_CONTEXT_SETTINGS_SCHEMA_BYTES = 64 * 1024;
const MAX_CONTEXT_PACK_BYTES = 256 * 1024;

export interface LightExtensionContextCollectionFieldLike {
  name?: string;
  options?: Record<string, unknown>;
  isRelationField?: () => boolean;
}

export interface LightExtensionContextCollectionLike {
  name?: string;
  options?: Record<string, unknown>;
  getFields(): LightExtensionContextCollectionFieldLike[];
}

export interface LightExtensionContextCollectionProvider {
  getCollection(dataSourceKey: string, collectionName: string): LightExtensionContextCollectionLike | null | undefined;
  getPermission?(
    dataSourceKey: string,
    collectionName: string,
    action: 'list' | 'update',
    ctx: ContextServiceContext,
  ): unknown | Promise<unknown>;
}

export type ContextServiceContext = LightExtensionServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
};

type NormalizedPermission = {
  allowed: boolean;
  fields: Set<string> | null;
  excludedFields: Set<string>;
};

export class LightExtensionContextPackService {
  constructor(
    private readonly db: Database,
    private readonly referenceService: ReferenceService,
    private readonly ownerContextResolvers: ReferenceOwnerAuthoringContextResolverRegistry,
    private readonly collectionProvider: LightExtensionContextCollectionProvider,
  ) {}

  async getContextPack(
    input: LightExtensionContextPackInput,
    ctx: ContextServiceContext = {},
  ): Promise<LightExtensionContextPack> {
    const references = await this.referenceService.readReferences(
      { repoId: input.repoId, entryId: input.entryId },
      ctx,
    );
    const entry = await this.getEntry(input.repoId, input.entryId, ctx);
    const referenceSummaries = references.slice(0, MAX_CONTEXT_REFERENCES).map(toReferenceSummary);
    const settingsSchema = isJsonWithinByteLimit(entry.settingsSchema, MAX_CONTEXT_SETTINGS_SCHEMA_BYTES)
      ? entry.settingsSchema
      : null;
    const base: Pick<
      LightExtensionContextPack,
      'contextPackVersion' | 'repoId' | 'entry' | 'references' | 'supportedImports' | 'versions'
    > = {
      contextPackVersion: LIGHT_EXTENSION_CONTEXT_PACK_VERSION,
      repoId: input.repoId,
      entry: {
        id: entry.id,
        kind: entry.kind as LightExtensionKind,
        entryName: entry.entryName,
        entryPath: entry.entryPath,
        settingsSchema,
      },
      references: referenceSummaries,
      supportedImports: [...SUPPORTED_IMPORTS],
      versions: {
        sdk: sdkPackageJson.version,
        validator: LIGHT_EXTENSION_VALIDATOR_VERSION,
      },
    };

    if (entry.settingsSchema && !settingsSchema) {
      return finalizeContextPack({ ...base, contextMode: 'generic', reason: 'settings_schema_limit_exceeded' });
    }

    if (!isSupportedContextKind(entry.kind)) {
      return finalizeContextPack({ ...base, contextMode: 'generic', reason: 'entry_kind_unsupported' });
    }

    const selectedReference = selectReference(input, references);
    if (!input.referenceId && !input.ownerLocator) {
      if (references.length > MAX_CONTEXT_REFERENCES) {
        return finalizeContextPack({ ...base, contextMode: 'generic', reason: 'reference_limit_exceeded' });
      }
      return finalizeContextPack({
        ...base,
        contextMode: references.length > 1 ? 'multiple' : 'generic',
        reason:
          references.length > 1 ? 'multiple_bindings' : references.length ? 'binding_not_selected' : 'binding_missing',
      });
    }
    if (!selectedReference) {
      return finalizeContextPack({ ...base, contextMode: 'generic', reason: 'binding_not_visible_or_missing' });
    }
    const selectedBase = { ...base, references: [toReferenceSummary(selectedReference)] };
    if (selectedReference.kind !== entry.kind) {
      return finalizeContextPack({ ...selectedBase, contextMode: 'generic', reason: 'binding_kind_mismatch' });
    }
    if (selectedReference.resolvedStatus !== 'active') {
      return finalizeContextPack({ ...selectedBase, contextMode: 'generic', reason: 'binding_not_active' });
    }

    const owner = await this.referenceService.readVisibleReferenceOwner(selectedReference.ownerLocator, ctx);
    if (!owner) {
      return finalizeContextPack({ ...selectedBase, contextMode: 'generic', reason: 'owner_missing_or_denied' });
    }
    const ownerContext = this.ownerContextResolvers.describe(selectedReference.ownerKind, {
      reference: {
        ...toReferenceSummary(selectedReference),
        kind: selectedReference.kind,
        repoId: selectedReference.repoId,
        entryId: selectedReference.entryId,
      },
      owner,
    });
    if (!ownerContext) {
      return finalizeContextPack({ ...selectedBase, contextMode: 'generic', reason: 'owner_context_unsupported' });
    }

    const binding = {
      referenceId: selectedReference.id,
      ownerLocatorHash: selectedReference.ownerLocatorHash,
      owner: ownerContext,
    };
    if (!ownerContext.collectionName) {
      return finalizeContextPack({
        ...selectedBase,
        contextMode: 'precise',
        reason: 'precise_binding_no_collection',
        binding,
      });
    }

    const collectionResult = await this.buildCollectionContext(
      ownerContext.dataSourceKey || 'main',
      ownerContext.collectionName,
      ctx,
    );
    if (!collectionResult.collection) {
      return finalizeContextPack({
        ...selectedBase,
        contextMode: 'generic',
        reason: collectionResult.reason,
      });
    }

    return finalizeContextPack({
      ...selectedBase,
      contextMode: 'precise',
      reason: 'precise_binding',
      binding,
      collection: collectionResult.collection,
    });
  }

  private async getEntry(repoId: string, entryId: string, ctx: ContextServiceContext) {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filter: { id: repoId },
      fields: ['id'],
      transaction: ctx.transaction,
    });
    if (!repo) {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_NOT_FOUND', `Light extension repo "${repoId}" was not found`);
    }
    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filter: { id: entryId, repoId },
      transaction: ctx.transaction,
    });
    if (!entry) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${entryId}" was not found in repository "${repoId}"`,
      );
    }
    return entryFromModel(entry as Model);
  }

  private async buildCollectionContext(
    dataSourceKey: string,
    collectionName: string,
    ctx: ContextServiceContext,
  ): Promise<{ collection?: LightExtensionContextCollection; reason: string }> {
    const collection = this.collectionProvider.getCollection(dataSourceKey, collectionName);
    if (!collection) {
      return { reason: 'collection_missing' };
    }
    const readPermission = await resolveCollectionPermission(
      this.collectionProvider,
      ctx,
      dataSourceKey,
      collectionName,
      'list',
    );
    if (!readPermission.allowed) {
      return { reason: 'collection_read_denied' };
    }
    const writePermission = await resolveCollectionPermission(
      this.collectionProvider,
      ctx,
      dataSourceKey,
      collectionName,
      'update',
    );
    const targetReadPermissions = new Map<string, Promise<NormalizedPermission>>();
    const fields: LightExtensionContextField[] = [];
    for (const field of collection.getFields()) {
      const fieldName = normalizeString(field.name) || normalizeString(field.options?.name);
      if (!fieldName || !isFieldAllowed(readPermission, fieldName)) {
        continue;
      }
      const options = field.options || {};
      const associationTarget = normalizeString(options.target);
      if (associationTarget) {
        if (!this.collectionProvider.getCollection(dataSourceKey, associationTarget)) {
          continue;
        }
        let targetPermission = targetReadPermissions.get(associationTarget);
        if (!targetPermission) {
          targetPermission = resolveCollectionPermission(
            this.collectionProvider,
            ctx,
            dataSourceKey,
            associationTarget,
            'list',
          );
          targetReadPermissions.set(associationTarget, targetPermission);
        }
        if (!(await targetPermission).allowed) {
          continue;
        }
      }
      fields.push(toContextField(fieldName, options, associationTarget, isFieldAllowed(writePermission, fieldName)));
      if (fields.length > MAX_CONTEXT_FIELDS) {
        return { reason: 'collection_field_limit_exceeded' };
      }
    }

    return {
      reason: 'precise_binding',
      collection: {
        dataSourceKey,
        name: collectionName,
        ...(normalizeString(collection.options?.title) ? { title: normalizeString(collection.options?.title) } : {}),
        fields: fields.sort((left, right) => left.name.localeCompare(right.name)),
      },
    };
  }
}

function selectReference(
  input: LightExtensionContextPackInput,
  references: LightExtensionReferenceRecord[],
): LightExtensionReferenceRecord | undefined {
  if (input.referenceId) {
    return references.find((reference) => reference.id === input.referenceId);
  }
  if (input.ownerLocator) {
    const ownerLocatorHash = hashReferenceOwnerLocator(input.ownerLocator);
    return references.find((reference) => reference.ownerLocatorHash === ownerLocatorHash);
  }
  return undefined;
}

function toReferenceSummary(reference: LightExtensionReferenceRecord): LightExtensionContextReferenceSummary {
  return {
    id: reference.id,
    ownerKind: reference.ownerKind,
    ownerLocator: reference.ownerLocator,
    ownerLocatorHash: reference.ownerLocatorHash,
    resolvedStatus: reference.resolvedStatus,
  };
}

function isSupportedContextKind(kind: string): kind is 'js-block' | 'js-page' {
  return kind === 'js-block' || kind === 'js-page';
}

function finalizeContextPack(input: Omit<LightExtensionContextPack, 'contextHash'>): LightExtensionContextPack {
  const serialized = stableSerialize(input);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_CONTEXT_PACK_BYTES) {
    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension Context Pack is too large', {
      details: {
        reasonCode: 'context_pack_too_large',
        maxBytes: MAX_CONTEXT_PACK_BYTES,
      },
    });
  }
  return {
    ...input,
    contextHash: sha256Hex(serialized),
  };
}

async function resolveCollectionPermission(
  provider: LightExtensionContextCollectionProvider,
  ctx: ContextServiceContext,
  dataSourceKey: string,
  collectionName: string,
  action: 'list' | 'update',
): Promise<NormalizedPermission> {
  if (!provider.getPermission && !ctx.can) {
    return { allowed: true, fields: null, excludedFields: new Set() };
  }
  const result = provider.getPermission
    ? await provider.getPermission(dataSourceKey, collectionName, action, ctx)
    : await resolveFallbackPermission(ctx.can, dataSourceKey, collectionName, action);
  if (!result) {
    return { allowed: false, fields: new Set(), excludedFields: new Set() };
  }
  if (result === true) {
    return { allowed: true, fields: null, excludedFields: new Set() };
  }
  if (!isRecord(result)) {
    return { allowed: true, fields: null, excludedFields: new Set() };
  }
  const params = isRecord(result.params) ? result.params : {};
  const allowlists = [params.fields, params.whitelist]
    .filter(Array.isArray)
    .map((values) => new Set(values.map(normalizeString).filter(Boolean)));
  const fields = allowlists.length
    ? allowlists.slice(1).reduce((current, values) => {
        return new Set(Array.from(current).filter((field) => values.has(field)));
      }, allowlists[0])
    : null;
  const excludedFields = new Set(
    [params.except, params.blacklist]
      .filter(Array.isArray)
      .flatMap((values) => values.map(normalizeString).filter(Boolean)),
  );
  return {
    allowed: true,
    fields,
    excludedFields,
  };
}

function resolveFallbackPermission(
  can: LightExtensionCanFunction | undefined,
  dataSourceKey: string,
  collectionName: string,
  action: 'list' | 'update',
): unknown | Promise<unknown> {
  if (!can) {
    return false;
  }
  const resource = dataSourceKey === 'main' ? collectionName : `${dataSourceKey}.${collectionName}`;
  return can({ resource, action });
}

function isFieldAllowed(permission: NormalizedPermission, fieldName: string): boolean {
  return (
    permission.allowed &&
    !permission.excludedFields.has(fieldName) &&
    (!permission.fields || permission.fields.has(fieldName))
  );
}

function toContextField(
  name: string,
  options: Record<string, unknown>,
  associationTarget: string,
  writable: boolean,
): LightExtensionContextField {
  const enumValues = normalizeEnumValues(options.enum) || normalizeEnumValues(options.values);
  return {
    name,
    ...(normalizeString(options.interface) ? { interface: normalizeString(options.interface) } : {}),
    ...(normalizeString(options.type) ? { type: normalizeString(options.type) } : {}),
    nullable: options.allowNull !== false && options.required !== true,
    ...(enumValues?.length ? { enum: enumValues } : {}),
    ...(associationTarget ? { associationTarget } : {}),
    readable: true,
    writable,
  };
}

function normalizeEnumValues(value: unknown): Array<string | number | boolean> | undefined {
  const values = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.values) ? value.values : null;
  if (!values) {
    return undefined;
  }
  const normalized = values.flatMap((item) => {
    const enumValue = isRecord(item) ? item.value : item;
    return typeof enumValue === 'string' || typeof enumValue === 'number' || typeof enumValue === 'boolean'
      ? [enumValue]
      : [];
  });
  return normalized.length <= MAX_CONTEXT_ENUM_VALUES ? normalized : undefined;
}

function isJsonWithinByteLimit(value: unknown, maxBytes: number): boolean {
  return value === null || Buffer.byteLength(stableSerialize(value), 'utf8') <= maxBytes;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
