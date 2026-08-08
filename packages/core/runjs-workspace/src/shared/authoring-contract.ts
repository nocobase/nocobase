/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import manifest from './runjs-authoring-contract.v1.json';

export type RunJSInlineWorkspaceOwnerKind = 'js-block' | 'js-page' | 'js-field' | 'js-column' | 'js-action' | 'js-item';
export type RunJSInlineWorkspaceModelUse =
  | 'JSPageModel'
  | 'JSBlockModel'
  | 'JSFieldModel'
  | 'JSEditableFieldModel'
  | 'JSColumnModel'
  | 'JSItemModel'
  | 'JSItemActionModel'
  | 'JSActionModel'
  | 'JSRecordActionModel'
  | 'JSCollectionActionModel'
  | 'JSFormActionModel'
  | 'FilterFormJSActionModel';
export type RunJSExternalizationEntryKind = 'js-block' | 'js-page' | 'js-field' | 'js-action' | 'js-item';
export type RunJSExternalizationDestinationType = 'existing' | 'new';

export const RUNJS_AUTHORING_CONTRACT_VERSION = manifest.authoringContractVersion as '1';
export const RUNJS_INLINE_WORKSPACE_OWNER_KINDS = manifest.inlineWorkspace
  .ownerKinds as RunJSInlineWorkspaceOwnerKind[];
export const RUNJS_INLINE_WORKSPACE_MODEL_USES = manifest.inlineWorkspace.modelUses as RunJSInlineWorkspaceModelUse[];
export const RUNJS_EXTERNALIZATION_ENTRY_KINDS = manifest.externalization.entryKinds as RunJSExternalizationEntryKind[];
export const RUNJS_EXTERNALIZATION_DESTINATION_TYPES = manifest.externalization
  .destinationTypes as RunJSExternalizationDestinationType[];

export interface RunJSAuthoringCapabilities {
  authoringContractVersion: typeof RUNJS_AUTHORING_CONTRACT_VERSION;
  inlineWorkspace: {
    available: true;
    saveMode: 'delta';
    supportsMaterialize: true;
    ownerKinds: RunJSInlineWorkspaceOwnerKind[];
    modelUses: RunJSInlineWorkspaceModelUse[];
  };
  externalization: {
    available: boolean;
    entryKinds: RunJSExternalizationEntryKind[];
    destinationTypes: RunJSExternalizationDestinationType[];
    supportsIdempotency: boolean;
    supportsDetachToInline: boolean;
  };
}

export interface RunJSExternalizationCapabilityContribution {
  id: string;
  entryKinds: readonly RunJSExternalizationEntryKind[];
  destinationTypes: readonly RunJSExternalizationDestinationType[];
  supportsIdempotency: boolean;
  supportsDetachToInline: boolean;
}

export const runJSAuthoringContractV1 = manifest as RunJSAuthoringCapabilities;

export function createRunJSAuthoringCapabilities(
  externalization?: RunJSExternalizationCapabilityContribution,
): RunJSAuthoringCapabilities {
  const inlineWorkspace = runJSAuthoringContractV1.inlineWorkspace;
  return {
    authoringContractVersion: RUNJS_AUTHORING_CONTRACT_VERSION,
    inlineWorkspace: {
      available: true,
      saveMode: 'delta',
      supportsMaterialize: true,
      ownerKinds: [...inlineWorkspace.ownerKinds],
      modelUses: [...inlineWorkspace.modelUses],
    },
    externalization: externalization
      ? {
          available: true,
          entryKinds: [...externalization.entryKinds],
          destinationTypes: [...externalization.destinationTypes],
          supportsIdempotency: externalization.supportsIdempotency,
          supportsDetachToInline: externalization.supportsDetachToInline,
        }
      : {
          available: false,
          entryKinds: [],
          destinationTypes: [],
          supportsIdempotency: false,
          supportsDetachToInline: false,
        },
  };
}
