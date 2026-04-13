/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceCatalogActionContainerScenario,
  FlowSurfaceCatalogFieldContainerScenario,
  FlowSurfaceCatalogItem,
  FlowSurfaceCatalogNodeInfo,
  FlowSurfaceCatalogPopupScenario,
  FlowSurfaceCatalogScenario,
  FlowSurfaceCatalogSection,
  FlowSurfaceNodeContract,
  FlowSurfaceNodeDomain,
  FlowSurfaceResolvedTarget,
} from './types';

export type FlowSurfaceCatalogExpandFlags = {
  includeItemConfigureOptions: boolean;
  includeItemContracts: boolean;
  includeItemAllowedContainerUses: boolean;
  includeNodeContracts: boolean;
};

export type FlowSurfaceCatalogPopupLike = {
  isPopupSurface?: boolean;
  popupKind?: FlowSurfaceCatalogPopupScenario['kind'] | null;
  scene?: FlowSurfaceCatalogPopupScenario['scene'];
  hasCurrentRecord?: boolean;
  hasAssociationContext?: boolean;
};

export type FlowSurfaceCatalogFieldContainerLike = {
  ownerUse?: string | null;
};

export type FlowSurfaceCatalogActionContainerLike = {
  ownerUse?: string | null;
};

export type FlowSurfaceCatalogAnalyzeTargetInput = {
  hasTarget: boolean;
  hasBlockSurface: boolean;
  resolved?: Pick<FlowSurfaceResolvedTarget, 'kind'> | null;
  surfaceKind?: FlowSurfaceCatalogScenario['surfaceKind'];
  requestedSections?: FlowSurfaceCatalogSection[];
  popupProfile?: FlowSurfaceCatalogPopupLike | null;
  fieldContainer?: FlowSurfaceCatalogFieldContainerLike | null;
  filterFormTargetCount?: number;
  actionContainer?: FlowSurfaceCatalogActionContainerLike | null;
  recordActionContainerUse?: string | null;
  hasRecordActions?: boolean;
};

export type FlowSurfaceCatalogAnalyzeTargetResult = {
  scenario: FlowSurfaceCatalogScenario;
  selectedSections: FlowSurfaceCatalogSection[];
  recordActionContainerUse: string | null;
};

export type FlowSurfaceCatalogScenarioInput = {
  surfaceKind: FlowSurfaceCatalogScenario['surfaceKind'];
  popup?: FlowSurfaceCatalogPopupScenario;
  fieldContainer?: FlowSurfaceCatalogFieldContainerScenario;
  actionContainer?: FlowSurfaceCatalogActionContainerScenario;
};

export type FlowSurfaceCatalogSelectedSectionsInput = {
  requestedSections?: FlowSurfaceCatalogSection[];
  hasTarget: boolean;
  hasBlockSurface: boolean;
  hasFieldContainer: boolean;
  hasActionContainer: boolean;
  hasRecordActions: boolean;
};

export type FlowSurfaceCatalogProjectedItem = FlowSurfaceCatalogItem & {
  renderer?: string;
  type?: string;
};

export type FlowSurfaceCatalogProjectableItem = Pick<FlowSurfaceCatalogItem, 'key' | 'label' | 'use' | 'kind'> &
  Partial<FlowSurfaceCatalogItem> &
  Record<string, any>;

export type FlowSurfaceFieldCatalogProjectableItem = Pick<FlowSurfaceCatalogItem, 'key' | 'label' | 'use'> &
  Partial<Omit<FlowSurfaceCatalogItem, 'kind'>> &
  Record<string, any>;

export type FlowSurfaceFieldCatalogLightCandidate = FlowSurfaceCatalogProjectedItem;

export type FlowSurfaceCatalogProjectItemOptions = {
  getEditableDomains: (use?: string) => FlowSurfaceNodeDomain[];
  getConfigureOptions: (item?: Pick<FlowSurfaceCatalogItem, 'kind' | 'use'> | null) => Record<string, any>;
  getSettingsSchema: (use?: string) => Record<string, any>;
  getNodeContract: (use?: string) => FlowSurfaceNodeContract;
};

export type FlowSurfaceCatalogItemOptionalFieldsOptions = {
  includeConfigureOptions?: boolean;
  includeContracts?: boolean;
};

export type FlowSurfaceCatalogItemOptionalFieldsProviders = {
  getEditableDomains: (use?: string) => FlowSurfaceNodeDomain[];
  getConfigureOptions: (use?: string) => Record<string, any>;
  getSettingsSchema: (use?: string) => Record<string, any>;
  getNodeContract: (use?: string) => FlowSurfaceNodeContract;
};

export type FlowSurfaceCatalogNodeProjectOptions = {
  getEditableDomains: (use?: string) => FlowSurfaceNodeDomain[];
  getConfigureOptionsForResolvedNode: (input: { kind?: string; use?: string }) => Record<string, any>;
  getSettingsSchema: (use?: string) => Record<string, any>;
  getNodeContract: (use?: string) => FlowSurfaceNodeContract;
};

export type FlowSurfaceCatalogNodeProjectInput = {
  node: any;
  resolved: Pick<FlowSurfaceResolvedTarget, 'kind'> | null;
  expand: FlowSurfaceCatalogExpandFlags;
  options: FlowSurfaceCatalogNodeProjectOptions;
};

export type FlowSurfaceCatalogNodeProjectResult = FlowSurfaceCatalogNodeInfo;
