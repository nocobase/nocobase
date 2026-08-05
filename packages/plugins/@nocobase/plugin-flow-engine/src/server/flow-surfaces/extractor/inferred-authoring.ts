/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
  type FlowSurfaceAutoCapabilityCandidate,
  type FlowSurfaceAutoInferredAuthoring,
  type FlowSurfaceAutoInferredAuthoringCapability,
  type FlowSurfaceAutoSnapshot,
} from './types';

export function inferFlowSurfaceAutoSnapshotAuthoring(
  snapshot: FlowSurfaceAutoSnapshot,
  candidates: FlowSurfaceAutoCapabilityCandidate[],
): FlowSurfaceAutoInferredAuthoring | undefined {
  const capabilities = candidates.flatMap((candidate) => {
    const capability = inferGenericAuthoringCapability(snapshot, candidate);
    return capability ? [capability] : [];
  });
  return capabilities.length
    ? {
        contractVersion: FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
        capabilities,
      }
    : undefined;
}

function inferGenericAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
): FlowSurfaceAutoInferredAuthoringCapability | undefined {
  if (isHiddenModel(snapshot, candidate.modelUse)) {
    return undefined;
  }
  if (candidate.kind === 'block') {
    return inferGenericBlockAuthoringCapability(snapshot, candidate);
  }
  if (candidate.kind === 'action') {
    return inferGenericActionAuthoringCapability(snapshot, candidate);
  }
  if (candidate.kind === 'fieldComponent') {
    return inferGenericFieldAuthoringCapability(snapshot, candidate);
  }
  return undefined;
}

function inferGenericBlockAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
): FlowSurfaceAutoInferredAuthoringCapability {
  const collectionRequired = isCollectionBackedBlock(snapshot, candidate.modelUse);
  const settings = collectStaticModelSettings(snapshot, candidate.modelUse);
  const initParams = [
    {
      name: 'dataSourceKey',
      required: false,
      schema: {
        type: 'string',
      },
      internalLens: {
        domain: 'stepParams' as const,
        path: 'resourceSettings.init.dataSourceKey',
      },
    },
    {
      name: 'collectionName',
      required: collectionRequired,
      schema: {
        type: 'string',
      },
      internalLens: {
        domain: 'stepParams' as const,
        path: 'resourceSettings.init.collectionName',
      },
    },
  ];

  return {
    kind: 'block',
    publicType: candidate.publicType,
    ...getGenericCapabilityAliases(snapshot, candidate),
    ownerPlugin: snapshot.plugin,
    modelUse: candidate.modelUse,
    label: candidate.label,
    placement: {
      scenes: ['page', 'tab', 'popup'],
      slots: ['blocks'],
      ...(collectionRequired ? { collectionRequired: true } : {}),
    },
    confidence: {
      discovery: 'high',
      placement: 'high',
      tree: 'high',
      settings: 'high',
      write: 'high',
    },
    initParamsSchema: {
      type: 'object',
      additionalProperties: false,
      ...(collectionRequired ? { required: ['collectionName'] } : {}),
      properties: {
        dataSourceKey: {
          type: 'string',
          default: 'main',
        },
        collectionName: {
          type: 'string',
        },
      },
    },
    settingsSchema: settings.schema,
    ...(Object.keys(settings.configureOptions).length ? { configureOptions: settings.configureOptions } : {}),
    createRecipe: {
      nodeTemplate: getStaticNodeTemplate(snapshot, candidate.modelUse),
      initParams,
      ...(settings.bindings.length ? { settings: settings.bindings } : {}),
    },
    evidence: candidate.evidence,
  };
}

function inferGenericActionAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
): FlowSurfaceAutoInferredAuthoringCapability | undefined {
  const placement = getActionPlacement(snapshot, candidate.modelUse);
  if (!placement) {
    return undefined;
  }
  return buildZeroInitGenericCapability(snapshot, candidate, placement);
}

function inferGenericFieldAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
): FlowSurfaceAutoInferredAuthoringCapability | undefined {
  const bindings = snapshot.fieldBindings.filter((binding) => binding.modelUse === candidate.modelUse);
  if (
    !bindings.length &&
    !snapshot.menuItems.some((item) => item.modelUse === candidate.modelUse && item.slot === 'fields')
  ) {
    return undefined;
  }
  const scenes = Array.from(
    new Set(
      bindings.flatMap((binding) => {
        if (binding.role === 'display') {
          return ['details', 'table'] as const;
        }
        return ['form'] as const;
      }),
    ),
  );
  return buildZeroInitGenericCapability(snapshot, candidate, {
    scenes: scenes.length ? scenes : ['form', 'details', 'table'],
    slots: ['fields', 'fieldComponents'],
    fieldRequired: true,
  });
}

function buildZeroInitGenericCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
  placement: NonNullable<FlowSurfaceAutoInferredAuthoringCapability['placement']>,
): FlowSurfaceAutoInferredAuthoringCapability {
  const settings = collectStaticModelSettings(snapshot, candidate.modelUse);
  return {
    kind: candidate.kind,
    publicType: candidate.publicType,
    ...getGenericCapabilityAliases(snapshot, candidate),
    ownerPlugin: snapshot.plugin,
    modelUse: candidate.modelUse,
    label: candidate.label,
    placement,
    confidence: {
      discovery: 'high',
      placement: 'high',
      tree: 'high',
      settings: 'high',
      write: 'high',
    },
    initParamsSchema: emptyObjectSchema(),
    settingsSchema: settings.schema,
    ...(Object.keys(settings.configureOptions).length ? { configureOptions: settings.configureOptions } : {}),
    createRecipe: {
      nodeTemplate: getStaticNodeTemplate(snapshot, candidate.modelUse),
      ...(settings.bindings.length ? { settings: settings.bindings } : {}),
    },
    evidence: candidate.evidence,
  };
}

function getActionPlacement(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  const scope = snapshot.models.find((model) => model.modelUse === modelUse)?.actionScope;
  const slots = new Set(snapshot.menuItems.filter((item) => item.modelUse === modelUse).map((item) => item.slot));
  const record = scope ? scope === 'record' || scope === 'both' : slots.has('recordActions');
  const collection = scope ? scope === 'collection' || scope === 'both' : slots.has('actions');
  if (!record && !collection) {
    return undefined;
  }
  return {
    scenes: [...(collection ? (['actionPanel'] as const) : []), ...(record ? (['record'] as const) : [])],
    slots: [...(collection ? (['actions'] as const) : []), ...(record ? (['recordActions'] as const) : [])],
  };
}

function collectStaticModelSettings(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  const flows = snapshot.flows.filter((flow) => flow.modelUse === modelUse);
  const byKey = new Map(flows.flatMap((flow) => flow.settings || []).map((setting) => [setting.key, setting]));
  const configureOptions = Object.assign({}, ...flows.map((flow) => flow.configureOptions || {}));
  return {
    bindings: Array.from(byKey.values()),
    configureOptions,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(Array.from(byKey, ([key, setting]) => [key, setting.schema])),
    },
  };
}

function getStaticNodeTemplate(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  return (
    snapshot.menuItems.find((item) => item.modelUse === modelUse && item.createModelOptions?.use === modelUse)
      ?.createModelOptions || { use: modelUse }
  );
}

function getGenericCapabilityAliases(snapshot: FlowSurfaceAutoSnapshot, candidate: FlowSurfaceAutoCapabilityCandidate) {
  const acceptedAliases = Array.from(
    new Set(
      snapshot.menuItems
        .filter((item) => item.modelUse === candidate.modelUse)
        .map((item) => item.menuKey)
        .filter((value): value is string => !!value && value !== candidate.publicType),
    ),
  );
  return acceptedAliases.length ? { acceptedAliases } : {};
}

function isHiddenModel(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  return snapshot.menuItems.some((item) => item.modelUse === modelUse && item.hidden === true);
}

function emptyObjectSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {},
  };
}

function isCollectionBackedBlock(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  const baseClass = snapshot.models.find((model) => model.modelUse === modelUse)?.modelBaseClass;
  return (
    baseClass === 'CollectionBlockModel' ||
    baseClass === 'DataBlockModel' ||
    baseClass === 'TableBlockModel' ||
    snapshot.flows.some(
      (flow) => flow.modelUse === modelUse && String(flow.flowKey || '').startsWith('resourceSettings'),
    )
  );
}
