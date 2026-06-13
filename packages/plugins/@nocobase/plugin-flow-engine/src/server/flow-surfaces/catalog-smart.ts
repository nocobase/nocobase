/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getActionContainerScope } from './action-scope';
import type {
  FlowSurfaceCatalogActionContainerScenario,
  FlowSurfaceCatalogExpand,
  FlowSurfaceCatalogFieldContainerScenario,
  FlowSurfaceCatalogPopupScenario,
  FlowSurfaceCatalogScenario,
  FlowSurfaceCatalogSection,
} from './types';
import { throwBadRequest } from './errors';
import { normalizeFieldContainerKind } from './field-semantics';
import type {
  FlowSurfaceCatalogAnalyzeTargetInput,
  FlowSurfaceCatalogAnalyzeTargetResult,
  FlowSurfaceCatalogExpandFlags,
  FlowSurfaceCatalogScenarioInput,
  FlowSurfaceCatalogSelectedSectionsInput,
} from './catalog-smart.types';

export * from './catalog-smart.types';
export {
  buildCatalogItemOptionalFields,
  buildFieldCatalogLightCandidate,
  expandFieldCatalogCandidate,
  projectCatalogItem,
  projectCatalogNode,
} from './catalog-smart.projector';

const FLOW_SURFACE_CATALOG_SECTION_SET = new Set<FlowSurfaceCatalogSection>([
  'blocks',
  'fields',
  'actions',
  'recordActions',
  'node',
]);

const FLOW_SURFACE_CATALOG_EXPAND_SET = new Set<FlowSurfaceCatalogExpand>([
  'item.configureOptions',
  'item.contracts',
  'item.allowedContainerUses',
  'node.contracts',
]);

function resolveCatalogPopupScenario(
  input?: FlowSurfaceCatalogAnalyzeTargetInput['popupProfile'],
): FlowSurfaceCatalogPopupScenario | undefined {
  if (!input?.isPopupSurface) {
    return undefined;
  }

  return {
    kind: input.popupKind || 'plainPopup',
    scene: input.scene || 'generic',
    hasCurrentRecord: !!input.hasCurrentRecord,
    hasAssociationContext: !!input.hasAssociationContext,
  };
}

function resolveCatalogFieldContainerScenario(input: {
  ownerUse?: string | null;
  filterFormTargetCount?: number;
}): FlowSurfaceCatalogFieldContainerScenario | undefined {
  const kind = normalizeFieldContainerKind(input.ownerUse || undefined);
  if (!kind) {
    return undefined;
  }

  if (kind === 'filter-form') {
    return {
      kind,
      targetMode: (input.filterFormTargetCount || 0) > 1 ? 'multiple' : 'single',
    };
  }

  return { kind };
}

function resolveCatalogActionContainerScenario(input: {
  ownerUse?: string | null;
  recordActionContainerUse?: string | null;
}): FlowSurfaceCatalogActionContainerScenario | undefined {
  const ownerUse = input.ownerUse || undefined;
  const scope = getActionContainerScope(ownerUse);
  if (!scope) {
    return undefined;
  }

  return _.pickBy(
    {
      scope,
      ownerUse,
      recordActionContainerUse: input.recordActionContainerUse || undefined,
    },
    (value) => !_.isUndefined(value),
  ) as FlowSurfaceCatalogActionContainerScenario;
}

export function normalizeCatalogSections(actionName: string, input: any): FlowSurfaceCatalogSection[] {
  if (_.isUndefined(input)) {
    return [];
  }
  if (!Array.isArray(input)) {
    throwBadRequest(`flowSurfaces ${actionName} sections must be an array`);
  }

  const seen = new Set<FlowSurfaceCatalogSection>();
  return input
    .map((value, index) => {
      const normalized = String(value || '').trim() as FlowSurfaceCatalogSection;
      if (!FLOW_SURFACE_CATALOG_SECTION_SET.has(normalized)) {
        throwBadRequest(`flowSurfaces ${actionName} sections[${index}] '${String(value || '')}' is not supported`);
      }
      if (seen.has(normalized)) {
        return null;
      }
      seen.add(normalized);
      return normalized;
    })
    .filter(Boolean) as FlowSurfaceCatalogSection[];
}

export function normalizeCatalogExpand(actionName: string, input: any): FlowSurfaceCatalogExpand[] {
  if (_.isUndefined(input)) {
    return [];
  }
  if (!Array.isArray(input)) {
    throwBadRequest(`flowSurfaces ${actionName} expand must be an array`);
  }

  const seen = new Set<FlowSurfaceCatalogExpand>();
  return input
    .map((value, index) => {
      const normalized = String(value || '').trim() as FlowSurfaceCatalogExpand;
      if (!FLOW_SURFACE_CATALOG_EXPAND_SET.has(normalized)) {
        throwBadRequest(`flowSurfaces ${actionName} expand[${index}] '${String(value || '')}' is not supported`);
      }
      if (seen.has(normalized)) {
        return null;
      }
      seen.add(normalized);
      return normalized;
    })
    .filter(Boolean) as FlowSurfaceCatalogExpand[];
}

export function buildCatalogExpandFlags(expands: Iterable<FlowSurfaceCatalogExpand>): FlowSurfaceCatalogExpandFlags {
  const expandSet = new Set(expands);
  return {
    includeItemConfigureOptions: expandSet.has('item.configureOptions'),
    includeItemContracts: expandSet.has('item.contracts'),
    includeItemAllowedContainerUses: expandSet.has('item.allowedContainerUses'),
    includeNodeContracts: expandSet.has('node.contracts'),
  };
}

export function scenario(input: FlowSurfaceCatalogScenarioInput): FlowSurfaceCatalogScenario {
  return _.pickBy(
    {
      surfaceKind: input.surfaceKind,
      popup: input.popup,
      fieldContainer: input.fieldContainer,
      actionContainer: input.actionContainer,
    },
    (value) => !_.isUndefined(value),
  ) as FlowSurfaceCatalogScenario;
}

export function selectedSections(input: FlowSurfaceCatalogSelectedSectionsInput): FlowSurfaceCatalogSection[] {
  if (!_.isUndefined(input.requestedSections)) {
    return input.requestedSections;
  }
  if (!input.hasTarget) {
    return ['blocks', 'actions', 'recordActions'];
  }

  const sections: FlowSurfaceCatalogSection[] = [];
  if (input.hasBlockSurface) {
    sections.push('blocks');
  }
  if (input.hasFieldContainer) {
    sections.push('fields');
  }
  if (input.hasActionContainer) {
    sections.push('actions');
  }
  if (input.hasRecordActions) {
    sections.push('recordActions');
  }
  sections.push('node');
  return sections;
}

export function analyzeCatalogTarget(
  input: FlowSurfaceCatalogAnalyzeTargetInput,
): FlowSurfaceCatalogAnalyzeTargetResult {
  const recordActionContainerUse = input.recordActionContainerUse || null;
  const popup = resolveCatalogPopupScenario(input.popupProfile);
  const fieldContainer = resolveCatalogFieldContainerScenario({
    ownerUse: input.fieldContainer?.ownerUse,
    filterFormTargetCount: input.filterFormTargetCount,
  });
  const actionContainer = resolveCatalogActionContainerScenario({
    ownerUse: input.actionContainer?.ownerUse,
    recordActionContainerUse,
  });
  const hasRecordActions = _.isBoolean(input.hasRecordActions)
    ? input.hasRecordActions
    : !!recordActionContainerUse || !input.hasTarget;

  return {
    scenario: scenario({
      surfaceKind: input.surfaceKind || input.resolved?.kind || 'global',
      popup,
      fieldContainer,
      actionContainer,
    }),
    selectedSections: selectedSections({
      requestedSections: input.requestedSections,
      hasTarget: input.hasTarget,
      hasBlockSurface: input.hasBlockSurface,
      hasFieldContainer: !!fieldContainer,
      hasActionContainer: !!actionContainer,
      hasRecordActions,
    }),
    recordActionContainerUse,
  };
}
