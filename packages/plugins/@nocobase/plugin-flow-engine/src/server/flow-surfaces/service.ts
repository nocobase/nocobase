/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import type { Plugin } from '@nocobase/server';
import { transformSQL, uid } from '@nocobase/utils';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import {
  BLOCK_KEY_BY_USE,
  filterAvailableCatalogItems,
  getEditableDomainsForUse,
  getAvailableActionCatalogItems,
  getNodeContract,
  getSettingsSchemaForUse,
  resolveSupportedFieldCapability,
  resolveSupportedActionCatalogItem,
  resolveSupportedBlockCatalogItem,
} from './catalog';
import { assertRequestedActionScope, getActionContainerScope, normalizeActionScope } from './action-scope';
import {
  buildActionTree,
  buildBlockTree,
  buildCanonicalTableActionsColumnNode,
  buildFieldTree,
  buildStandaloneFieldNode,
  buildPersistedRootPageModel,
  buildPopupPageTree,
} from './builder';
import { compileApplySpec } from './apply/compiler';
import { buildAutoLayout } from './apply/layout';
import { FlowSurfaceContractGuard } from './contract-guard';
import {
  FlowSurfaceBadRequestError,
  isFlowSurfaceError,
  throwBadRequest,
  throwConflict,
  throwForbidden,
  throwInternalError,
} from './errors';
import { executeMutateOps } from './executor';
import { assertNoFlowSurfaceLegacyRef } from './reference-guards';
import {
  buildSurfaceFingerprintKeysObject as buildPlanningSurfaceFingerprintKeysObject,
  FLOW_SURFACE_INTERNAL_META_KEY,
  getDeclaredKeyFromNode as getPlanningDeclaredKeyFromNode,
} from './planning/key-registry';
import {
  compileFlowSurfaceApplyBlueprintRequest,
  prepareFlowSurfaceApplyBlueprintDocument,
  resolveApplyBlueprintPageLocator,
  type FlowSurfaceApplyBlueprintDocument,
  type FlowSurfaceApplyBlueprintProgram,
  type FlowSurfaceApplyBlueprintReplaceTargetInfo,
} from './blueprint';
import { APPLY_BLUEPRINT_CREATE_MENU_GROUP_METADATA_KEYS } from './blueprint/private-utils';
import type { FlowSurfacePlanOnlyActionName } from './planning/action-specs';
import { describeSurface as describePlanningSurface, executeInternalPlan } from './planning/runtime';
import { collectFlowSurfaceCreatedKeys, collectPersistableFlowSurfaceCreatedKeys } from './planning/created-keys';
import { persistDeclaredKeyForNode as persistPlanningDeclaredKeyForNode } from './planning/key-persistence';
import { validateFlowSurfacePayloadShape } from './payload-shape';
import type { FlowSurfacePlanSurfaceContext } from './planning/types';
import {
  MULTI_VALUE_ASSOCIATION_INTERFACES,
  normalizeFieldContainerKind,
  shouldUseAssociationTitleTextDisplay,
} from './field-semantics';
import { resolveRegisteredFieldBinding } from './field-binding-registry';
import {
  ACTION_BUTTON_USES,
  COLLECTION_BLOCK_USES,
  FIELD_WRAPPER_USES,
  JS_BLOCK_USES,
  STANDALONE_FIELD_NODE_USES,
} from './node-use-sets';
import {
  buildChartConfigureFromSemanticChanges,
  canonicalizeChartConfigure,
  deriveChartSemanticState,
  getChartBuilderQueryAliases,
  getChartBuilderQueryOutputs,
  getChartBuilderResourceInit,
  getChartRiskyPatternHints,
  getChartSafeDefaultHints,
  getChartSupportedMappingsByType,
  getChartSupportedStylesByType,
  getChartSupportedVisualTypes,
  getChartUnsupportedPatternHints,
  getChartVisualMappingAliases,
} from './chart-config';
import {
  analyzeCatalogTarget as analyzeSmartCatalogTarget,
  buildCatalogExpandFlags,
  normalizeCatalogExpand as normalizeSmartCatalogExpand,
  normalizeCatalogSections as normalizeSmartCatalogSections,
  projectCatalogItem as projectSmartCatalogItem,
  projectCatalogNode as projectSmartCatalogNode,
  type FlowSurfaceCatalogProjectableItem,
} from './catalog-smart';
import { compileComposeExecutionPlan } from './compose-compiler';
import { executeComposeRuntime } from './compose-runtime';
import { SurfaceLocator } from './locator';
import { isPageModelUse, isPopupHostUse } from './placement';
import { FlowSurfaceRouteSync } from './route-sync';
import { FlowSurfaceContextResolver } from './surface-context';
import { buildFlowSurfaceContextResponse, isBareFlowContextPath, type FlowSurfaceContextSemantic } from './context';
import {
  getConfigureOptionKeysForResolvedNode,
  getConfigureOptionKeysForUse,
  getConfigureOptionsForCatalogItem,
  getConfigureOptionsForResolvedNode,
  getConfigureOptionsForUse,
} from './configure-options';
import {
  buildCatalogCollectionCycleKey,
  buildFilterFieldMeta,
  dedupeVisibleFieldCandidates,
  getAssociationFilterTargetKey,
  getCollectionFields,
  getCollectionName,
  getCollectionTitle,
  getFieldFilterable,
  getFieldInterface,
  getFieldName,
  getFieldTarget,
  getFieldTitle,
  getFieldType,
  hasConfiguredFlowContextValue,
  inferAssociationLeafDisplayFieldUse,
  inferFieldMenuEditableFieldUse,
  inferFlowContextTypeFromField,
  isAssociationField,
  normalizeFieldPath,
  normalizeTemplatePage,
  normalizeTemplatePageSize,
  resolveAssociationNameFromField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
  toTemplatePlainRow,
} from './service-helpers';
import {
  FLOW_SURFACE_REACTION_FINGERPRINT_CONFLICT,
  FLOW_SURFACE_REACTION_UNKNOWN_TARGET_KEY,
} from './reaction/errors';
import { buildFieldValueWriteResult, normalizeFieldValueRules } from './reaction/field-value';
import { buildReactionFingerprint } from './reaction/fingerprint';
import {
  compileActionLinkageCanonicalRules,
  compileBlockLinkageCanonicalRules,
  compileFieldLinkageCanonicalRules,
  normalizeActionLinkageRules,
  normalizeBlockLinkageRules,
  normalizeFieldLinkageRules,
  validateActionLinkageRulesAgainstCapability,
  validateBlockLinkageRulesAgainstCapability,
  validateFieldLinkageRulesAgainstCapability,
} from './reaction/linkage';
import { buildGetReactionMetaResult, buildReactionMetaCapabilities } from './reaction/meta';
import { resolveReactionCapability, resolveReactionStorageNode, resolveReactionTarget } from './reaction/resolver';
import type {
  FlowSurfaceActionLinkageRule,
  FlowSurfaceBlockLinkageRule,
  FlowSurfaceFieldLinkageRule,
  FlowSurfaceLinkageCapability,
  FlowSurfaceFieldLinkageScene,
  FlowSurfaceFieldValueRule,
  FlowSurfaceGetReactionMetaResult,
  FlowSurfaceGetReactionMetaValues,
  FlowSurfaceReactionKind,
  FlowSurfaceReactionRuleNormalizers,
  FlowSurfaceReactionScene,
  FlowSurfaceReactionSlot,
  FlowSurfaceReactionWriteResult,
  FlowSurfaceReactionWriteValues,
  FlowSurfaceResolvedReactionTarget,
} from './reaction/types';
import {
  assertCollectionTitleFieldExists,
  resolveAssociationSafeTitleField,
  resolveAssociationTitleFieldTargetCollection,
} from './association-title-field';
import {
  buildFlowSurfaceDefaultActionPopupBlocks,
  getFlowSurfaceDefaultActionPopupConfigByUse,
  hasFlowSurfaceInlinePopupBlocks,
  hasFlowSurfaceInlinePopupTemplate,
  isFlowSurfaceDefaultActionPopupUse,
  pickFlowSurfaceDefaultActionPopupFieldPaths,
  resolveFlowSurfaceDefaultActionPopupTabTitle,
} from './default-action-popup';
import {
  assertFlowSurfaceComposeUniqueKeys,
  assertSupportedSimpleChanges,
  buildChartCardSettingsFromSemanticChanges,
  buildDefaultFieldState,
  buildDefinedPayload,
  buildPopupTabTree,
  ensureNoDirectActionScopeKey,
  ensureNoRawDirectAddKeys,
  ensureNoRawSimpleChangeKeys,
  flattenModel,
  getCatalogRecordActionContainerUse,
  getFieldBindingDefaultProps,
  getNodeSubModelList,
  getSingleNodeSubModel,
  hasDefinedValue,
  hasLegacyLocatorFields,
  hasMeaningfulChartSemanticPatch,
  hasOwnDefined,
  isFieldNodeUse,
  isMissingRequiredResourceInitValue,
  joinRequiredFieldPaths,
  normalizeChartCardSettings,
  normalizeChartCardHeightModeForWrite,
  normalizeFlowSurfaceComposeKey,
  normalizeComposeActionSpec,
  normalizeComposeFieldSpec,
  normalizeGridCardColumns,
  normalizePublicBlockHeightMode,
  normalizeRowSpans,
  normalizeSimpleConfirm,
  normalizeSimpleLayoutValue,
  normalizeSimpleResourceInit,
  normalizeStoredChartCardHeightMode,
  rethrowInlineConfigurationError,
  splitComposeFieldChanges,
  toFlowSurfaceBatchItemError,
} from './service-utils';
import {
  areFlowTemplateRootUsesCompatible,
  buildTemplateMissingContextReason,
  getTemplateResourceCompatibilityDisabledReason,
  resolveBlockTemplateExpectedResourceInfo,
  resolveTemplateResourceInfo,
  type FlowSurfaceTemplateResourceInfo,
} from './template-compatibility';
import {
  buildFlowTemplateReferenceBlockStepParams,
  buildTemplateListFilter,
  collectFlowTemplateModelUids,
  collectFlowTemplateUsageMapFromModelOptions,
  findFieldsTemplateReferenceGrid,
  findFlowTemplateOpenViewStep,
  FLOW_TEMPLATE_BLOCK_USAGES,
  FLOW_TEMPLATE_SUPPORTED_MODES,
  FLOW_TEMPLATE_SUPPORTED_TYPES,
  FLOW_TEMPLATE_UNSUPPORTED_BLOCK_TEMPLATE_SOURCE_USES,
  normalizeRequiredTemplateString,
  normalizeTemplateSaveMode,
  normalizeTemplateUidValue,
  POPUP_HOST_STEP_PARAM_PATHS,
  replaceFlowModelTreeUids,
  stripTemplateInternalOpenViewFields,
  stripTemplateInternalReferenceSettings,
  type FlowSurfaceTemplateListPopupActionContext,
  type FlowSurfaceTemplateListValues,
  type FlowSurfaceTemplateRow,
} from './template-service-utils';
import type {
  FlowSurfaceApplyMode,
  FlowSurfaceApplySpec,
  FlowSurfaceApplyValues,
  FlowSurfaceAtomicFlag,
  FlowSurfaceBindKey,
  FlowSurfaceCatalogItem,
  FlowSurfaceCatalogResponse,
  FlowSurfaceCatalogScenario,
  FlowSurfaceCatalogSection,
  FlowSurfaceCatalogValues,
  FlowSurfaceComposeMode,
  FlowSurfaceComposeValues,
  FlowSurfaceConfigureValues,
  FlowSurfaceContextValues,
  FlowSurfaceDescribeValues,
  FlowSurfaceExecutorContext,
  FlowSurfaceMutateOp,
  FlowSurfaceMutateValues,
  FlowSurfaceNodeDomain,
  FlowSurfaceNodeSpec,
  FlowSurfacePlanSelector,
  FlowSurfacePlanStep,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceResourceBindingAssociationField,
  FlowSurfaceResourceBindingOption,
  FlowSurfaceResourceBindingKey,
  FlowSurfaceSemanticResourceInput,
  FlowSurfaceWriteTarget,
} from './types';

type FlowSurfaceChartHint = {
  key: string;
  title: string;
  description: string;
};

type FlowSurfaceSqlChartQueryOutput = {
  alias: string;
  source: 'sql';
  type?: string;
};

type FlowSurfaceSqlChartPreview = {
  queryOutputs?: FlowSurfaceSqlChartQueryOutput[];
  riskyHints?: FlowSurfaceChartHint[];
};

const FORM_BLOCK_USES = new Set(['FormBlockModel', 'CreateFormModel', 'EditFormModel']);
const DETAILS_BLOCK_USES = new Set(['DetailsBlockModel']);
const SIMPLE_FORM_BLOCK_USES = new Set(['FormBlockModel', 'CreateFormModel', 'EditFormModel']);
const LIST_BLOCK_USES = new Set(['ListBlockModel']);
const GRID_CARD_BLOCK_USES = new Set(['GridCardBlockModel']);
const LIST_LIKE_COMPOSE_BLOCK_TYPES = new Set(['list', 'gridCard']);
const GRID_SETTINGS_FLOW_KEY = 'gridSettings';
const GRID_SETTINGS_LAYOUT_STEP_KEY = 'grid';
const OPEN_VIEW_MODE_ALIASES = {
  modal: 'dialog',
  page: 'embed',
} as const;
const OPEN_VIEW_SUPPORTED_MODES = new Set(['drawer', 'dialog', 'embed']);
const FILTER_TARGET_BLOCK_USES = new Set([
  'TableBlockModel',
  'DetailsBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'ChartBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);
const EDITABLE_FIELD_WRAPPER_USES = new Set(['FormItemModel', 'FilterFormItemModel']);
const DISPLAY_FIELD_WRAPPER_USES = new Set(['DetailsItemModel', 'TableColumnModel']);
const DISPLAY_COMPONENT_FIELD_WRAPPER_USES = new Set([
  'DetailsItemModel',
  'FormAssociationItemModel',
  'TableColumnModel',
]);
const TITLE_FIELD_SUPPORTED_WRAPPER_USES = new Set([
  'FormItemModel',
  'FormAssociationItemModel',
  'DetailsItemModel',
  'TableColumnModel',
]);
const AUTO_TITLE_FIELD_BINDING_WRAPPER_USES = new Set([
  'FormItemModel',
  'FormAssociationItemModel',
  'DetailsItemModel',
  'TableColumnModel',
  'FilterFormItemModel',
]);
const UI_FIELD_MENU_TABLE_OWNER_USES = new Set(['TableBlockModel']);
const UI_FIELD_MENU_DETAILS_OWNER_USES = new Set(['DetailsBlockModel', 'GridCardBlockModel', 'GridCardItemModel']);
const UI_FIELD_MENU_FORM_OWNER_USES = new Set([
  'FormBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'AssignFormModel',
  'FormGridModel',
  'AssignFormGridModel',
]);
const JS_ACTION_USES = new Set([
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'JSItemActionModel',
  'FilterFormJSActionModel',
  'JSActionModel',
]);
const POPUP_ACTION_USES = new Set([
  'AddNewActionModel',
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'DuplicateActionModel',
  'AddChildActionModel',
  'MailSendActionModel',
]);
const POPUP_HOST_DEFAULT_RECORD_CONTEXT_ACTION_USES = new Set([
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'AddChildActionModel',
  'DuplicateActionModel',
]);
const DELETE_ACTION_USES = new Set(['DeleteActionModel', 'BulkDeleteActionModel']);
const CONFIRMABLE_SUBMIT_ACTION_USES = new Set(['FormSubmitActionModel']);
const ITEM_CONTEXT_OWNER_USES = new Set([
  'SubFormFieldModel',
  'SubFormListFieldModel',
  'SubTableFieldModel',
  'PopupSubTableFieldModel',
  'RecordPickerFieldModel',
]);
const RECORD_CONTEXT_OWNER_USES = new Set(['DetailsBlockModel', 'QuickEditFormModel', 'AssignFormModel']);
const POPUP_RECORD_ACTION_CONTAINER_USES = new Set([
  'TableActionsColumnModel',
  'DetailsBlockModel',
  'ListItemModel',
  'GridCardItemModel',
]);
const POPUP_UNSUPPORTED_COLLECTION_SCENES = new Set<FlowSurfacePopupScene>(['select', 'subForm', 'bulkEditForm']);
const POPUP_COLLECTION_BLOCK_SCENES: Partial<Record<string, FlowSurfaceCollectionBlockScene[]>> = {
  CreateFormModel: ['new'],
  EditFormModel: ['one', 'many'],
  DetailsBlockModel: ['one', 'many'],
  CommentsBlockModel: ['one', 'many'],
  TableBlockModel: ['many'],
  ListBlockModel: ['many'],
  GridCardBlockModel: ['many'],
  MapBlockModel: ['many'],
  FilterFormBlockModel: ['filter'],
  FormBlockModel: [],
};
type FlowSurfaceStepParamMirror = {
  domain: 'props' | 'decoratorProps';
  key: string;
  stepParamsPath: string[];
};

const TABLE_COLUMN_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'props', key: 'title', stepParamsPath: ['tableColumnSettings', 'title', 'title'] },
  { domain: 'props', key: 'tooltip', stepParamsPath: ['tableColumnSettings', 'tooltip', 'tooltip'] },
  { domain: 'props', key: 'width', stepParamsPath: ['tableColumnSettings', 'width', 'width'] },
  { domain: 'props', key: 'fixed', stepParamsPath: ['tableColumnSettings', 'fixed', 'fixed'] },
];

const TABLE_FIELD_WRAPPER_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  ...TABLE_COLUMN_STEP_PARAM_MIRRORS,
  { domain: 'props', key: 'sorter', stepParamsPath: ['tableColumnSettings', 'sorter', 'sorter'] },
  { domain: 'props', key: 'editable', stepParamsPath: ['tableColumnSettings', 'quickEdit', 'editable'] },
  { domain: 'props', key: 'titleField', stepParamsPath: ['tableColumnSettings', 'fieldNames', 'label'] },
];

const FORM_ITEM_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'props', key: 'showLabel', stepParamsPath: ['editItemSettings', 'showLabel', 'showLabel'] },
  { domain: 'props', key: 'label', stepParamsPath: ['editItemSettings', 'label', 'label'] },
  { domain: 'props', key: 'tooltip', stepParamsPath: ['editItemSettings', 'tooltip', 'tooltip'] },
  { domain: 'props', key: 'extra', stepParamsPath: ['editItemSettings', 'description', 'description'] },
  { domain: 'props', key: 'initialValue', stepParamsPath: ['editItemSettings', 'initialValue', 'defaultValue'] },
  { domain: 'props', key: 'required', stepParamsPath: ['editItemSettings', 'required', 'required'] },
  { domain: 'props', key: 'pattern', stepParamsPath: ['editItemSettings', 'pattern', 'pattern'] },
  { domain: 'props', key: 'titleField', stepParamsPath: ['editItemSettings', 'titleField', 'label'] },
];

const DETAIL_ITEM_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'props', key: 'showLabel', stepParamsPath: ['detailItemSettings', 'showLabel', 'showLabel'] },
  { domain: 'props', key: 'label', stepParamsPath: ['detailItemSettings', 'label', 'title'] },
  { domain: 'props', key: 'tooltip', stepParamsPath: ['detailItemSettings', 'tooltip', 'tooltip'] },
  { domain: 'props', key: 'extra', stepParamsPath: ['detailItemSettings', 'description', 'description'] },
  { domain: 'props', key: 'titleField', stepParamsPath: ['detailItemSettings', 'fieldNames', 'label'] },
];

const FILTER_FORM_ITEM_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'props', key: 'label', stepParamsPath: ['filterFormItemSettings', 'label', 'label'] },
  { domain: 'props', key: 'showLabel', stepParamsPath: ['filterFormItemSettings', 'showLabel', 'showLabel'] },
  { domain: 'props', key: 'tooltip', stepParamsPath: ['filterFormItemSettings', 'tooltip', 'tooltip'] },
  { domain: 'props', key: 'extra', stepParamsPath: ['filterFormItemSettings', 'description', 'description'] },
  {
    domain: 'props',
    key: 'initialValue',
    stepParamsPath: ['filterFormItemSettings', 'initialValue', 'defaultValue'],
  },
];

const FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'decoratorProps', key: 'labelWidth', stepParamsPath: ['formModelSettings', 'layout', 'labelWidth'] },
  { domain: 'decoratorProps', key: 'labelWrap', stepParamsPath: ['formModelSettings', 'layout', 'labelWrap'] },
  { domain: 'props', key: 'labelWidth', stepParamsPath: ['formModelSettings', 'layout', 'labelWidth'] },
  { domain: 'props', key: 'labelWrap', stepParamsPath: ['formModelSettings', 'layout', 'labelWrap'] },
];

const DETAILS_BLOCK_LAYOUT_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  { domain: 'decoratorProps', key: 'labelWidth', stepParamsPath: ['detailsSettings', 'layout', 'labelWidth'] },
  { domain: 'decoratorProps', key: 'labelWrap', stepParamsPath: ['detailsSettings', 'layout', 'labelWrap'] },
  { domain: 'props', key: 'labelWidth', stepParamsPath: ['detailsSettings', 'layout', 'labelWidth'] },
  { domain: 'props', key: 'labelWrap', stepParamsPath: ['detailsSettings', 'layout', 'labelWrap'] },
];

const FILTER_FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS: FlowSurfaceStepParamMirror[] = [
  {
    domain: 'decoratorProps',
    key: 'labelWidth',
    stepParamsPath: ['formFilterBlockModelSettings', 'layout', 'labelWidth'],
  },
  {
    domain: 'decoratorProps',
    key: 'labelWrap',
    stepParamsPath: ['formFilterBlockModelSettings', 'layout', 'labelWrap'],
  },
  { domain: 'props', key: 'labelWidth', stepParamsPath: ['formFilterBlockModelSettings', 'layout', 'labelWidth'] },
  { domain: 'props', key: 'labelWrap', stepParamsPath: ['formFilterBlockModelSettings', 'layout', 'labelWrap'] },
];

const UPDATE_SETTINGS_STEP_PARAM_MIRRORS_BY_USE: Partial<Record<string, FlowSurfaceStepParamMirror[]>> = {
  TableActionsColumnModel: TABLE_COLUMN_STEP_PARAM_MIRRORS,
  JSColumnModel: TABLE_COLUMN_STEP_PARAM_MIRRORS,
  TableColumnModel: TABLE_FIELD_WRAPPER_STEP_PARAM_MIRRORS,
  FormItemModel: FORM_ITEM_STEP_PARAM_MIRRORS,
  DetailsItemModel: DETAIL_ITEM_STEP_PARAM_MIRRORS,
  FormAssociationItemModel: DETAIL_ITEM_STEP_PARAM_MIRRORS,
  FilterFormItemModel: FILTER_FORM_ITEM_STEP_PARAM_MIRRORS,
  FormBlockModel: FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS,
  CreateFormModel: FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS,
  EditFormModel: FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS,
  DetailsBlockModel: DETAILS_BLOCK_LAYOUT_STEP_PARAM_MIRRORS,
  FilterFormBlockModel: FILTER_FORM_BLOCK_LAYOUT_STEP_PARAM_MIRRORS,
};

type FlowSurfaceAddFieldResult = {
  uid?: string;
  parentUid?: string;
  subKey?: string;
  fieldUse?: string;
  type?: string;
  renderer?: string;
  defaultTargetUid?: string;
  associationPathName?: string;
  fieldPath?: string;
  wrapperUid?: string;
  fieldUid?: string;
  innerFieldUid?: string;
  popupPageUid?: string;
  popupTabUid?: string;
  popupGridUid?: string;
};

type FlowSurfaceFieldMenuCandidate = {
  field: any;
  fieldPath: string;
  associationPathName?: string;
  label: string;
  supportsJs: boolean;
  explicitWrapperUse?: string;
  explicitFieldUse?: string;
  defaultTitleField?: string;
};

type FlowSurfacePopupScene = 'new' | 'one' | 'many' | 'select' | 'subForm' | 'bulkEditForm' | 'generic';
type FlowSurfaceCollectionBlockScene = 'new' | 'one' | 'many' | 'select' | 'filter' | 'subForm' | 'bulkEditForm';

type FlowSurfacePopupBlockProfile = {
  isPopupSurface: boolean;
  popupKind?: 'associationPopup' | 'recordPopup' | 'plainPopup';
  hostUid?: string;
  popupHostUse?: string;
  dataSourceKey?: string;
  collectionName?: string;
  currentCollection?: any;
  filterByTk?: any;
  associationName?: string;
  sourceId?: any;
  hasCurrentRecord: boolean;
  hasAssociationContext: boolean;
  scene: FlowSurfacePopupScene;
};

type FlowSurfaceNormalizedResourceInput =
  | {
      kind: 'semantic';
      value: FlowSurfaceSemanticResourceInput;
    }
  | {
      kind: 'raw';
      value: Record<string, any>;
    }
  | undefined;

type FlowSurfaceTemplateListTargetContext = {
  target: FlowSurfaceWriteTarget;
  resolved: FlowSurfaceResolvedTarget;
  node: any;
  resourceContext?: {
    resourceInit?: Record<string, any>;
  } | null;
  fieldContainer?: {
    ownerUid: string;
    ownerUse?: string;
  } | null;
  fieldHostBlock?: any;
  popupProfile?: FlowSurfacePopupBlockProfile | null;
};

const FLOW_SURFACE_MENU_BINDABLE_OPTION_KEY = 'flowSurfaceMenuBindable';

export class FlowSurfacesService {
  constructor(private readonly plugin: Plugin) {}

  get db() {
    return this.plugin.db;
  }

  get repository() {
    return this.db.getCollection('flowModels').repository as FlowModelRepository;
  }

  get locator() {
    return new SurfaceLocator(this.db, this.repository);
  }

  private get routeSync() {
    return new FlowSurfaceRouteSync(this.db, this.repository);
  }

  private getFlowTemplateRepository(actionName: string) {
    try {
      return this.db.getRepository('flowModelTemplates');
    } catch (error) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires '@nocobase/plugin-ui-templates' to be enabled`,
        'FLOW_SURFACE_TEMPLATE_FEATURE_UNAVAILABLE',
      );
    }
  }

  private getFlowTemplateUsageRepository(actionName: string) {
    try {
      return this.db.getRepository('flowModelTemplateUsages');
    } catch (error) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires '@nocobase/plugin-ui-templates' to be enabled`,
        'FLOW_SURFACE_TEMPLATE_FEATURE_UNAVAILABLE',
      );
    }
  }

  private getFlowTemplateUsageModel(actionName: string) {
    try {
      return this.db.getModel('flowModelTemplateUsages');
    } catch (error) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires '@nocobase/plugin-ui-templates' to be enabled`,
        'FLOW_SURFACE_TEMPLATE_FEATURE_UNAVAILABLE',
      );
    }
  }

  private getFlowTemplateUsageRepositorySafe() {
    try {
      return this.db.getRepository('flowModelTemplateUsages');
    } catch (error) {
      return null;
    }
  }

  private get contractGuard() {
    return new FlowSurfaceContractGuard();
  }

  private get surfaceContext() {
    return new FlowSurfaceContextResolver(this.repository, this.locator, {
      hydrateRoute: (routeLike, transaction) => this.routeSync.hydrateRoute(routeLike, transaction),
      ensureGridChild: (parentUid, use, transaction) => this.ensureGridChild(parentUid, use, transaction),
      ensurePopupSurface: (parentUid, transaction) => this.ensurePopupSurface(parentUid, transaction),
      getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
    });
  }

  private async loadEnabledPluginPackages(transaction?: any): Promise<ReadonlySet<string>> {
    if (!this.db.getCollection('applicationPlugins')) {
      return new Set<string>();
    }
    const plugins = await this.db.getRepository('applicationPlugins').find({
      fields: ['packageName'],
      filter: {
        enabled: true,
      },
      transaction,
    });
    const packageNames = plugins
      .map((plugin: any) => plugin?.get?.('packageName') || plugin?.packageName)
      .filter((packageName: any): packageName is string => typeof packageName === 'string' && !!packageName.trim())
      .map((packageName) => packageName.trim());
    return new Set<string>(packageNames);
  }

  private async resolveEnabledPluginPackages(
    options: { transaction?: any; enabledPackages?: ReadonlySet<string> } = {},
  ): Promise<ReadonlySet<string>> {
    return options.enabledPackages ?? (await this.loadEnabledPluginPackages(options.transaction));
  }

  private allocateRouteSortValue(offset = 0) {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000) + offset;
  }

  private readRouteField<T = any>(route: any, key: string): T | undefined {
    return route?.get?.(key) ?? route?.[key];
  }

  private readRouteOptions(route: any) {
    const options = this.readRouteField<Record<string, any>>(route, 'options');
    return _.isPlainObject(options) ? options : {};
  }

  private async findMenuRouteById(menuRouteId: string | number, transaction?: any) {
    return this.db.getRepository('desktopRoutes').findOne({
      filterByTk: String(menuRouteId),
      appends: ['children'],
      transaction,
    });
  }

  private async findMenuGroupRoutesByTitle(title: string, transaction?: any) {
    const normalizedTitle = String(title || '').trim();
    if (!normalizedTitle) {
      return [];
    }
    return _.castArray(
      await this.db.getRepository('desktopRoutes').find({
        filter: {
          type: 'group',
          title: normalizedTitle,
        },
        transaction,
      }),
    );
  }

  private async assertMenuParentIsGroup(parentMenuRouteId: string | number | null | undefined, transaction?: any) {
    if (_.isNil(parentMenuRouteId)) {
      return null;
    }
    const route = await this.findMenuRouteById(parentMenuRouteId, transaction);
    if (!route) {
      throwBadRequest(`flowSurfaces menu parent route '${parentMenuRouteId}' not found`);
    }
    if (this.readRouteField(route, 'type') !== 'group') {
      throwBadRequest(`flowSurfaces menu parent route '${parentMenuRouteId}' must be a group route`);
    }
    return route;
  }

  private async assertMenuRouteBindable(menuRouteId: string | number, transaction?: any) {
    const route = await this.findMenuRouteById(menuRouteId, transaction);
    if (!route) {
      throwBadRequest(`flowSurfaces menu route '${menuRouteId}' not found`);
    }
    if (this.readRouteField(route, 'type') !== 'flowPage') {
      throwBadRequest(`flowSurfaces createPage only accepts a flowPage menu route`);
    }
    return route;
  }

  private async assertMenuRouteUpdatable(menuRouteId: string | number, transaction?: any) {
    const route = await this.findMenuRouteById(menuRouteId, transaction);
    if (!route) {
      throwBadRequest(`flowSurfaces menu route '${menuRouteId}' not found`);
    }
    const type = this.readRouteField(route, 'type');
    if (type !== 'group' && type !== 'flowPage') {
      throwBadRequest(`flowSurfaces updateMenu only supports group and flowPage routes`);
    }
    return route;
  }

  private async assertMenuParentNotSelfOrDescendant(
    route: any,
    parentMenuRouteId: string | number | null | undefined,
    transaction?: any,
  ) {
    if (_.isNil(parentMenuRouteId)) {
      return;
    }
    const routeId = String(this.readRouteField(route, 'id'));
    const parentId = String(parentMenuRouteId);
    if (routeId === parentId) {
      throwBadRequest(`flowSurfaces updateMenu cannot move a menu route into itself`);
    }

    let current = await this.findMenuRouteById(parentMenuRouteId, transaction);
    while (current) {
      const currentId = String(this.readRouteField(current, 'id'));
      if (currentId === routeId) {
        throwBadRequest(`flowSurfaces updateMenu cannot move a menu route into its descendant`);
      }
      const nextParentId = this.readRouteField(current, 'parentId');
      if (_.isNil(nextParentId)) {
        break;
      }
      current = await this.findMenuRouteById(nextParentId, transaction);
    }
  }

  private buildMenuResult(route: any, extras: Record<string, any> = {}) {
    return {
      routeId: this.readRouteField(route, 'id'),
      type: this.readRouteField(route, 'type'),
      parentMenuRouteId: this.readRouteField(route, 'parentId') ?? null,
      ...extras,
    };
  }

  private async createFlowMenuGroup(values: Record<string, any>, transaction?: any) {
    const parentRoute = await this.assertMenuParentIsGroup(values.parentMenuRouteId, transaction);
    const schemaUid = values.schemaUid || uid();
    const desktopRoutes = this.db.getRepository('desktopRoutes');
    await desktopRoutes.create({
      values: {
        type: 'group',
        sort: this.allocateRouteSortValue(),
        title: values.title,
        icon: values.icon,
        tooltip: values.tooltip,
        schemaUid,
        hideInMenu: !!values.hideInMenu,
        parentId: this.readRouteField(parentRoute, 'id') ?? null,
      },
      transaction,
    });
    const route = await desktopRoutes.findOne({
      filter: { schemaUid },
      transaction,
    });
    return this.buildMenuResult(route);
  }

  private async createFlowMenuItem(values: Record<string, any>, transaction?: any) {
    const parentRoute = await this.assertMenuParentIsGroup(values.parentMenuRouteId, transaction);
    const pageSchemaUid = values.pageSchemaUid || uid();
    const pageUid = values.pageUid || uid();
    const tabSchemaUid = values.tabSchemaUid || uid();
    const tabSchemaName = values.tabSchemaName || uid();
    const title = values.title || pageSchemaUid;
    const tabTitle = values.tabTitle || 'Untitled';
    const desktopRoutes = this.db.getRepository('desktopRoutes');

    await desktopRoutes.create({
      values: {
        type: 'flowPage',
        sort: this.allocateRouteSortValue(),
        title,
        icon: values.icon,
        tooltip: values.tooltip,
        schemaUid: pageSchemaUid,
        hideInMenu: !!values.hideInMenu,
        enableTabs: false,
        displayTitle: values.displayTitle !== false,
        parentId: this.readRouteField(parentRoute, 'id') ?? null,
        options: {
          [FLOW_SURFACE_MENU_BINDABLE_OPTION_KEY]: true,
        },
        children: [
          {
            type: 'tabs',
            sort: this.allocateRouteSortValue(1),
            title: tabTitle,
            icon: values.tabIcon,
            schemaUid: tabSchemaUid,
            tabSchemaName,
            hidden: true,
            parentId: null,
            options: {
              documentTitle: values.tabDocumentTitle,
              flowRegistry: values.tabFlowRegistry || {},
            },
          },
        ],
      },
      transaction,
    });

    const route = await desktopRoutes.findOne({
      filter: { schemaUid: pageSchemaUid },
      appends: ['children'],
      transaction,
    });
    const tabRoute = _.sortBy(_.castArray(route?.get?.('children') || []), 'sort')[0];

    await this.ensureFlowRoutePageSchemaShell(pageSchemaUid, transaction);
    const pageTree = buildPersistedRootPageModel({
      pageUid,
      pageTitle: title,
      routeId: this.readRouteField(route, 'id'),
      enableTabs: false,
      displayTitle: values.displayTitle !== false,
      pageDocumentTitle: values.documentTitle,
    });
    await this.repository.upsertModel(
      {
        parentId: pageSchemaUid,
        subKey: 'page',
        subType: 'object',
        ...pageTree,
      },
      { transaction },
    );

    return this.buildMenuResult(route, {
      pageSchemaUid,
      pageUid,
      tabRouteId: this.readRouteField(tabRoute, 'id'),
      tabSchemaUid,
      tabSchemaName,
    });
  }

  private sanitizePublicCreateMenuValues(values: Record<string, any>) {
    return _.pick(values, ['title', 'type', 'icon', 'tooltip', 'hideInMenu', 'parentMenuRouteId']);
  }

  private async loadRouteBackedPageStructure(route: any, transaction?: any) {
    const routeId = this.readRouteField(route, 'id');
    const routeWithChildren =
      _.isUndefined(this.readRouteField(route, 'children')) && !_.isNil(routeId)
        ? (await this.db.getRepository('desktopRoutes').findOne({
            filterByTk: String(routeId),
            appends: ['children'],
            transaction,
          })) || route
        : route;
    const pageSchemaUid = this.readRouteField(routeWithChildren, 'schemaUid');
    const pageModel = pageSchemaUid
      ? await this.repository.findModelByParentId(pageSchemaUid, {
          transaction,
          subKey: 'page',
          includeAsyncNode: true,
        })
      : null;
    const tabRoutes = _.sortBy(
      _.castArray(this.readRouteField(routeWithChildren, 'children') || []).filter(
        (item: any) => this.readRouteField(item, 'type') === 'tabs',
      ),
      (item: any) => this.readRouteField(item, 'sort') ?? 0,
    );
    const tabGrids = await Promise.all(
      tabRoutes.map(async (tabRoute: any) => {
        const tabSchemaUid = this.readRouteField(tabRoute, 'schemaUid');
        const grid = tabSchemaUid
          ? await this.repository.findModelByParentId(tabSchemaUid, {
              transaction,
              subKey: 'grid',
              includeAsyncNode: true,
            })
          : null;
        return {
          tabRoute,
          grid,
        };
      }),
    );
    return {
      pageSchemaUid,
      pageModel,
      tabRoutes,
      tabGrids,
    };
  }

  private isBindableMenuRoutePendingInitialization(
    route: any,
    structure: Awaited<ReturnType<FlowSurfacesService['loadRouteBackedPageStructure']>>,
  ) {
    if (this.readRouteField(route, 'type') !== 'flowPage') {
      return false;
    }
    const routeOptions = this.readRouteOptions(route);
    if (!routeOptions[FLOW_SURFACE_MENU_BINDABLE_OPTION_KEY]) {
      return false;
    }
    if (structure.pageModel?.use !== 'RootPageModel') {
      return false;
    }
    if (!structure.tabRoutes.length) {
      return false;
    }
    return structure.tabGrids.every((item) => !item.grid?.uid);
  }

  private isRouteBackedPageInitialized(
    route: any,
    structure: Awaited<ReturnType<FlowSurfacesService['loadRouteBackedPageStructure']>>,
  ) {
    if (this.readRouteField(route, 'type') !== 'flowPage') {
      return false;
    }
    if (structure.pageModel?.use !== 'RootPageModel') {
      return false;
    }
    if (!structure.tabRoutes.length) {
      return false;
    }
    return structure.tabGrids.some((item) => !!item.grid?.uid);
  }

  async catalog(
    input: FlowSurfaceCatalogValues,
    options: { transaction?: any; enabledPackages?: ReadonlySet<string> } = {},
  ): Promise<FlowSurfaceCatalogResponse> {
    if (
      _.isUndefined(input?.target) &&
      hasLegacyLocatorFields(input || {}, {
        allowRootUid: true,
      })
    ) {
      throwBadRequest(
        `flowSurfaces catalog only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const target = _.isUndefined(input?.target)
      ? undefined
      : this.normalizeWriteTarget('catalog', input?.target, input);
    const resolved = target ? await this.locator.resolve(target, options) : null;
    const node = resolved ? await this.loadResolvedNode(resolved, options.transaction) : null;
    const popupProfile = target
      ? await this.resolvePopupBlockProfile(target.uid, resolved, node, options.transaction)
      : null;
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const expand = new Set(normalizeSmartCatalogExpand('catalog', input?.expand));
    const expandFlags = buildCatalogExpandFlags(expand);
    const requestedSections = _.isUndefined(input?.sections)
      ? undefined
      : normalizeSmartCatalogSections('catalog', input?.sections);
    const catalogAnalysis = await this.analyzeCatalogTarget({
      target,
      resolved,
      node,
      popupProfile,
      requestedSections,
      transaction: options.transaction,
    });

    const response: FlowSurfaceCatalogResponse = {
      target: resolved || null,
      scenario: catalogAnalysis.scenario,
      selectedSections: catalogAnalysis.selectedSections,
    };

    if (catalogAnalysis.selectedSections.includes('blocks')) {
      const availableBlocks = filterAvailableCatalogItems(
        this.surfaceContext.filterBlocksByTarget(node, resolved),
        enabledPackages,
      );
      response.blocks = availableBlocks
        .filter((item) => this.isCatalogBlockVisibleForPopupProfile(item.use, popupProfile))
        .map((item) => this.projectCatalogItem(this.buildCatalogBlockItem(item, popupProfile), expandFlags));
    }

    if (catalogAnalysis.selectedSections.includes('fields')) {
      const fieldCatalog = target
        ? await this.buildFieldCatalog(target, {
            transaction: options.transaction,
            includeConfigureOptions: expand.has('item.configureOptions'),
            includeContracts: expand.has('item.contracts'),
            enabledPackages,
          })
        : [];
      response.fields = fieldCatalog.map((item) => this.projectCatalogItem(item, expandFlags));
    }

    if (catalogAnalysis.selectedSections.includes('actions')) {
      const availableActions = node
        ? getAvailableActionCatalogItems(node?.use, undefined, enabledPackages).filter(
            (item) => item.scope !== 'record',
          )
        : getAvailableActionCatalogItems(undefined, undefined, enabledPackages).filter(
            (item) => item.scope !== 'record',
          );
      response.actions = availableActions.map((item) => this.projectCatalogItem(item, expandFlags));
    }

    if (catalogAnalysis.selectedSections.includes('recordActions')) {
      const availableRecordActions = node
        ? catalogAnalysis.recordActionContainerUse
          ? getAvailableActionCatalogItems(catalogAnalysis.recordActionContainerUse, 'record', enabledPackages)
          : []
        : getAvailableActionCatalogItems(undefined, 'record', enabledPackages);
      response.recordActions = availableRecordActions.map((item) => this.projectCatalogItem(item, expandFlags));
    }

    if (catalogAnalysis.selectedSections.includes('node')) {
      response.node = this.projectCatalogNode(node, resolved, expandFlags);
    }

    return response;
  }

  private async analyzeCatalogTarget(input: {
    target?: FlowSurfaceWriteTarget;
    resolved: FlowSurfaceResolvedTarget | null;
    node: any;
    popupProfile: FlowSurfacePopupBlockProfile | null;
    requestedSections?: FlowSurfaceCatalogSection[];
    transaction?: any;
  }): Promise<{
    scenario: FlowSurfaceCatalogScenario;
    selectedSections: FlowSurfaceCatalogSection[];
    recordActionContainerUse: string | null;
  }> {
    const targetSummary =
      input.target && input.resolved ? this.buildReadTargetSummary(input.target, input.resolved) : null;
    const resolvedUid = input.resolved?.uid;
    const fieldContainer =
      input.target && resolvedUid
        ? await this.surfaceContext.resolveFieldContainer(resolvedUid, input.transaction).catch(() => null)
        : null;
    const actionContainer = input.target
      ? await this.surfaceContext.resolveActionContainer(input.target, input.transaction).catch(() => null)
      : null;
    const recordActionContainerUse = getCatalogRecordActionContainerUse(input.node?.use);
    let filterFormTargetCount: number | undefined;

    if (fieldContainer?.ownerUid && normalizeFieldContainerKind(fieldContainer.ownerUse) === 'filter-form') {
      const targets = await this.surfaceContext.collectFilterFormTargets(fieldContainer.ownerUid, input.transaction);
      filterFormTargetCount = targets.length;
    }
    const hasBlockSurface = !!filterAvailableCatalogItems(
      this.surfaceContext.filterBlocksByTarget(input.node, input.resolved),
      undefined,
    ).length;

    const { scenario, selectedSections } = analyzeSmartCatalogTarget({
      hasTarget: !!input.target,
      hasBlockSurface,
      surfaceKind: targetSummary?.kind || 'global',
      requestedSections: input.requestedSections,
      popupProfile: input.popupProfile,
      fieldContainer: fieldContainer?.ownerUse
        ? {
            ownerUse: fieldContainer.ownerUse,
          }
        : null,
      filterFormTargetCount,
      actionContainer: actionContainer?.ownerUse
        ? {
            ownerUse: actionContainer.ownerUse,
          }
        : null,
      recordActionContainerUse,
      hasRecordActions: !!recordActionContainerUse || !input.target,
    });

    return {
      scenario,
      selectedSections,
      recordActionContainerUse,
    };
  }

  private projectCatalogNode(
    node: any,
    resolved: FlowSurfaceResolvedTarget | null,
    expand: ReturnType<typeof buildCatalogExpandFlags>,
  ) {
    return projectSmartCatalogNode(node, resolved, expand, {
      getEditableDomains: this.getEditableDomains.bind(this),
      getConfigureOptionsForResolvedNode,
      getSettingsSchema: getSettingsSchemaForUse,
      getNodeContract,
    });
  }

  private projectCatalogItem(
    item: FlowSurfaceCatalogProjectableItem,
    expand: ReturnType<typeof buildCatalogExpandFlags>,
  ) {
    return projectSmartCatalogItem(item, expand, {
      getEditableDomains: this.getEditableDomains.bind(this),
      getConfigureOptions: getConfigureOptionsForCatalogItem,
      getSettingsSchema: getSettingsSchemaForUse,
      getNodeContract,
    });
  }

  private buildCatalogBlockItem(item: any, popupProfile: FlowSurfacePopupBlockProfile | null) {
    const resourceBindings =
      this.isCollectionBlockUse(item.use) && popupProfile?.isPopupSurface
        ? this.buildPopupBlockResourceBindings(item.use, popupProfile, { forCatalog: true })
        : undefined;
    return {
      ...item,
      ...(resourceBindings?.length ? { resourceBindings } : {}),
    };
  }

  private isCollectionBlockUse(use?: string) {
    return COLLECTION_BLOCK_USES.has(use || '');
  }

  private isPopupFieldHostUse(use?: string) {
    return isPopupHostUse(use) && !POPUP_ACTION_USES.has(use || '');
  }

  private formatPopupSupportedBindings(resourceBindings: FlowSurfaceResourceBindingOption[]) {
    return resourceBindings.length ? resourceBindings.map((item) => item.key).join(', ') : '(none)';
  }

  private isCatalogBlockVisibleForPopupProfile(use: string, popupProfile: FlowSurfacePopupBlockProfile | null) {
    if (!this.isCollectionBlockUse(use) || !popupProfile?.isPopupSurface) {
      return true;
    }
    return this.buildPopupBlockResourceBindings(use, popupProfile, { forCatalog: true }).length > 0;
  }

  private getPopupCollectionBlockScenes(blockUse: string): FlowSurfaceCollectionBlockScene[] {
    return POPUP_COLLECTION_BLOCK_SCENES[blockUse] || [];
  }

  private isPopupCollectionBlockSceneUnsupported(scene: FlowSurfacePopupScene) {
    return POPUP_UNSUPPORTED_COLLECTION_SCENES.has(scene);
  }

  private isPopupCollectionBlockVisibleForScene(blockUse: string, popupProfile: FlowSurfacePopupBlockProfile) {
    const blockScenes = this.getPopupCollectionBlockScenes(blockUse);
    if (this.isPopupCollectionBlockSceneUnsupported(popupProfile.scene)) {
      return false;
    }
    if (popupProfile.scene === 'new') {
      return blockScenes.includes('new');
    }
    return !blockScenes.some((scene) => this.isPopupCollectionBlockSceneUnsupported(scene as FlowSurfacePopupScene));
  }

  private resolveFieldAssociationContextFromBinding(input: {
    collection: any;
    fieldPath: string;
    associationPathName?: string;
    dataSourceKey: string;
    collectionName: string;
  }) {
    const parsed = this.parseFieldPath(
      input.collection,
      input.fieldPath,
      input.associationPathName,
      input.dataSourceKey,
      input.collectionName,
    );
    const leafField = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    const associationField = isAssociationField(leafField)
      ? leafField
      : isAssociationField(parsed.associationField)
        ? parsed.associationField
        : null;
    const resolveTargetCollection = (field: any) =>
      resolveFieldTargetCollection(field, parsed.dataSourceKey, (resolvedDsKey, targetCollectionName) =>
        this.getCollection(resolvedDsKey, targetCollectionName),
      );
    const targetCollection =
      (associationField ? resolveTargetCollection(associationField) || associationField?.targetCollection : null) ||
      resolveTargetCollection(leafField) ||
      leafField?.targetCollection ||
      null;
    const targetCollectionName =
      getCollectionName(targetCollection) ||
      (associationField ? getFieldTarget(associationField) : undefined) ||
      parsed.collectionName ||
      input.collectionName;
    const associationName = parsed.associationPathName
      ? `${parsed.collectionName}.${parsed.associationPathName}`
      : associationField
        ? resolveAssociationNameFromField(associationField, input.collection)
        : undefined;

    return {
      associationField,
      targetCollection,
      dataSourceKey:
        targetCollection?.dataSourceKey ||
        targetCollection?.options?.dataSourceKey ||
        parsed.dataSourceKey ||
        input.dataSourceKey,
      collectionName: targetCollectionName,
      associationName,
    };
  }

  private async resolvePopupHostFieldAssociationContext(hostNode: any, transaction?: any) {
    const ancestors = await this.loadContextAncestorChain(
      hostNode?.uid,
      {
        uid: hostNode?.uid,
        target: { uid: hostNode?.uid },
        kind: 'node',
      },
      transaction,
    );
    const fieldNode = ancestors.find((node) => _.get(node, ['stepParams', 'fieldSettings', 'init', 'fieldPath']));
    if (!fieldNode?.uid) {
      return null;
    }

    const fieldInit = _.get(fieldNode, ['stepParams', 'fieldSettings', 'init']) || {};
    const resourceContext = await this.locator.resolveCollectionContext(fieldNode.uid, transaction).catch(() => null);
    const dataSourceKey = fieldInit.dataSourceKey || resourceContext?.resourceInit?.dataSourceKey || 'main';
    const collectionName = fieldInit.collectionName || resourceContext?.resourceInit?.collectionName;
    if (!collectionName || !fieldInit.fieldPath) {
      return null;
    }

    const collection = this.getCollection(dataSourceKey, collectionName);
    if (!collection) {
      return null;
    }

    const associationContext = this.resolveFieldAssociationContextFromBinding({
      collection,
      fieldPath: fieldInit.fieldPath,
      associationPathName: fieldInit.associationPathName,
      dataSourceKey,
      collectionName,
    });
    if (
      !associationContext.associationField ||
      !associationContext.targetCollection ||
      !associationContext.associationName
    ) {
      return null;
    }

    return {
      associationField: associationContext.associationField,
      targetCollection: associationContext.targetCollection,
      dataSourceKey: associationContext.dataSourceKey,
      collectionName: associationContext.collectionName,
      associationName: associationContext.associationName,
    };
  }

  private normalizePopupScene(scene?: any): FlowSurfacePopupScene | undefined {
    const normalized = String(scene || '').trim() as FlowSurfacePopupScene;
    if (!normalized) {
      return undefined;
    }
    if (['new', 'one', 'many', 'select', 'subForm', 'bulkEditForm', 'generic'].includes(normalized)) {
      return normalized;
    }
    return undefined;
  }

  private resolvePopupScene(input: {
    explicitScene?: FlowSurfacePopupScene;
    collectionName?: string;
    hasCurrentRecord: boolean;
  }): FlowSurfacePopupScene {
    if (input.explicitScene && ['select', 'subForm', 'bulkEditForm', 'new'].includes(input.explicitScene)) {
      return input.explicitScene;
    }
    if (input.collectionName && !input.hasCurrentRecord) {
      return 'new';
    }
    if (input.explicitScene === 'many') {
      return 'many';
    }
    if (input.explicitScene === 'one') {
      return 'one';
    }
    if (input.collectionName && input.hasCurrentRecord) {
      return 'one';
    }
    return input.explicitScene || 'generic';
  }

  private async resolvePopupHostProfileContext(hostNode: any, transaction?: any) {
    const parentUid = hostNode?.uid
      ? await this.locator.findParentUid(hostNode.uid, transaction).catch(() => null)
      : null;
    const parentNode = parentUid
      ? await this.repository.findModelById(parentUid, { transaction, includeAsyncNode: true }).catch(() => null)
      : null;
    const resourceContext = hostNode?.uid
      ? await this.locator.resolveCollectionContext(hostNode.uid, transaction).catch(() => null)
      : null;
    const associationContext = hostNode?.uid
      ? await this.resolvePopupHostFieldAssociationContext(hostNode, transaction).catch(() => null)
      : null;
    return {
      parentNode,
      resourceContext,
      associationContext,
      recordActionContainerUse:
        parentNode?.use && POPUP_RECORD_ACTION_CONTAINER_USES.has(parentNode.use) ? parentNode.use : null,
    };
  }

  private buildPopupBlockResourceBindings(
    blockUse: string,
    popupProfile: FlowSurfacePopupBlockProfile,
    options: {
      forCatalog?: boolean;
    } = {},
  ): FlowSurfaceResourceBindingOption[] {
    if (
      !this.isCollectionBlockUse(blockUse) ||
      (options.forCatalog && !this.isPopupCollectionBlockVisibleForScene(blockUse, popupProfile))
    ) {
      return [];
    }

    if (this.isPopupCollectionBlockSceneUnsupported(popupProfile.scene)) {
      return [];
    }

    const bindings: FlowSurfaceResourceBindingOption[] = [];
    const currentCollectionName = popupProfile.currentCollection
      ? popupProfile.collectionName || getCollectionTitle(popupProfile.currentCollection)
      : undefined;
    const blockScenes = this.getPopupCollectionBlockScenes(blockUse);
    const supportsCurrentCollection =
      blockScenes.includes('new') || (!popupProfile.hasCurrentRecord && blockScenes.includes('many'));
    const supportsCurrentRecord = blockScenes.includes('one');
    const associationFields = this.listPopupAssociatedRecordFields(popupProfile, blockUse);

    if (!popupProfile.currentCollection) {
      bindings.push({
        key: 'otherRecords',
        label: 'Other records',
        description: 'Bind this block to another collection explicitly.',
        requires: ['collectionName'],
        dataSourceKey: popupProfile.dataSourceKey || 'main',
      });
      return bindings;
    }

    if (supportsCurrentCollection) {
      bindings.push({
        key: 'currentCollection',
        label: 'Current collection',
        description:
          popupProfile.popupKind === 'associationPopup'
            ? 'Use the popup current collection and keep the current association context.'
            : 'Use the popup current collection.',
        dataSourceKey: popupProfile.dataSourceKey,
        collectionName: popupProfile.collectionName,
      });
    }

    if (supportsCurrentRecord && popupProfile.hasCurrentRecord) {
      bindings.push({
        key: 'currentRecord',
        label: 'Current record',
        description: `Bind this block to the popup current record in '${
          currentCollectionName || 'current collection'
        }'.`,
        dataSourceKey: popupProfile.dataSourceKey,
        collectionName: popupProfile.collectionName,
      });
    }

    if (popupProfile.hasCurrentRecord && associationFields.length) {
      bindings.push({
        key: 'associatedRecords',
        label: 'Associated records',
        description: 'Bind this block to records associated with the popup current record.',
        requires: ['associationField'],
        associationFields,
      });
    }

    bindings.push({
      key: 'otherRecords',
      label: 'Other records',
      description: 'Bind this block to another collection explicitly.',
      requires: ['collectionName'],
      dataSourceKey: popupProfile.dataSourceKey || 'main',
    });

    return bindings;
  }

  private listPopupAssociatedRecordFields(
    popupProfile: FlowSurfacePopupBlockProfile,
    blockUse: string,
  ): FlowSurfaceResourceBindingAssociationField[] {
    const associationFields = this.resolvePopupAssociationFields(popupProfile, blockUse);
    if (!associationFields.length) {
      return [];
    }

    return associationFields
      .map((field) => {
        try {
          const targetCollection = resolveFieldTargetCollection(
            field,
            popupProfile.dataSourceKey || 'main',
            (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
          );
          if (!targetCollection?.filterTargetKey) {
            return null;
          }
          const associationName = resolveAssociationNameFromField(field, popupProfile.currentCollection);
          if (!associationName) {
            return null;
          }
          return {
            key: getFieldName(field),
            label: getFieldTitle(field),
            collectionName: getFieldTarget(field) || targetCollection?.name || targetCollection?.options?.name,
            associationName,
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean) as FlowSurfaceResourceBindingAssociationField[];
  }

  private async resolvePopupBlockProfile(
    uid: string,
    resolved?: FlowSurfaceResolvedTarget | null,
    resolvedNode?: any,
    transaction?: any,
  ): Promise<FlowSurfacePopupBlockProfile | null> {
    const node = resolvedNode || (resolved ? await this.loadResolvedNode(resolved, transaction) : null);
    const hostNode = await this.findPopupHostNode(uid, resolved, node, transaction);
    if (!hostNode?.uid) {
      return null;
    }

    const openView = this.resolvePopupHostOpenView(hostNode);
    const hostContext = await this.resolvePopupHostProfileContext(hostNode, transaction);
    const ownerResourceInit = hostContext.resourceContext?.resourceInit || {};
    const dataSourceKey =
      openView?.dataSourceKey ||
      hostContext.associationContext?.dataSourceKey ||
      ownerResourceInit.dataSourceKey ||
      'main';
    const collectionName =
      String(openView?.collectionName || '').trim() ||
      String(hostContext.associationContext?.collectionName || '').trim() ||
      String(ownerResourceInit.collectionName || '').trim() ||
      undefined;
    let filterByTk = openView?.filterByTk;
    let hasCurrentRecord = hasConfiguredFlowContextValue(filterByTk);
    if (
      !hasCurrentRecord &&
      POPUP_HOST_DEFAULT_RECORD_CONTEXT_ACTION_USES.has(hostNode?.use || '') &&
      hostContext.recordActionContainerUse
    ) {
      filterByTk = '{{ctx.view.inputArgs.filterByTk}}';
      hasCurrentRecord = true;
    }
    if (!hasCurrentRecord && collectionName && this.isPopupFieldHostUse(hostNode?.use)) {
      filterByTk = '{{ctx.view.inputArgs.filterByTk}}';
      hasCurrentRecord = true;
    }
    const associationName =
      String(openView?.associationName || '').trim() ||
      String(hostContext.associationContext?.associationName || '').trim() ||
      String(ownerResourceInit.associationName || '').trim() ||
      undefined;
    let sourceId = openView?.sourceId;
    // Nested association popups must keep the runtime source id from popup inputArgs.
    // Reusing an inherited '{{ctx.view.inputArgs.filterByTk}}' template here would
    // rebind it to the child popup current record instead of the association source record.
    if (!hasConfiguredFlowContextValue(sourceId) && associationName) {
      sourceId = '{{ctx.view.inputArgs.sourceId}}';
    }
    if (!hasConfiguredFlowContextValue(sourceId) && hasConfiguredFlowContextValue(ownerResourceInit.sourceId)) {
      sourceId = ownerResourceInit.sourceId;
    }
    const currentCollection = collectionName ? this.getCollection(dataSourceKey, collectionName) : null;
    const hasAssociationContext = !!associationName && hasConfiguredFlowContextValue(sourceId);
    const scene = this.resolvePopupScene({
      explicitScene: this.normalizePopupScene(openView?.scene),
      collectionName,
      hasCurrentRecord,
    });

    return {
      isPopupSurface: true,
      popupKind: hasAssociationContext ? 'associationPopup' : hasCurrentRecord ? 'recordPopup' : 'plainPopup',
      hostUid: hostNode.uid,
      popupHostUse: hostNode.use,
      dataSourceKey,
      collectionName,
      currentCollection,
      filterByTk,
      associationName,
      sourceId,
      hasCurrentRecord,
      hasAssociationContext,
      scene,
    };
  }

  private resolvePopupAssociationFields(popupProfile: FlowSurfacePopupBlockProfile, blockUse: string) {
    if (!popupProfile.currentCollection || !popupProfile.hasCurrentRecord) {
      return [];
    }
    const blockScenes = this.getPopupCollectionBlockScenes(blockUse);
    let fields;
    try {
      fields =
        typeof popupProfile.currentCollection?.getAssociationFields === 'function'
          ? popupProfile.currentCollection.getAssociationFields(blockScenes)
          : getCollectionFields(popupProfile.currentCollection).filter((field) => isAssociationField(field));
    } catch (error) {
      fields = getCollectionFields(popupProfile.currentCollection).filter((field) => isAssociationField(field));
    }
    return _.castArray(fields).filter((field) => {
      try {
        if (!isAssociationField(field) || getFieldType(field) === 'belongsToArray') {
          return false;
        }
        const targetCollection = resolveFieldTargetCollection(
          field,
          popupProfile.dataSourceKey || 'main',
          (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
        );
        return !!targetCollection?.filterTargetKey;
      } catch (error) {
        return false;
      }
    });
  }

  private async findPopupHostNode(
    uid: string,
    resolved?: FlowSurfaceResolvedTarget | null,
    resolvedNode?: any,
    transaction?: any,
  ) {
    const currentNode =
      resolvedNode ||
      resolved?.node ||
      (resolved ? await this.loadResolvedNode(resolved, transaction) : null) ||
      (await this.repository.findModelById(uid, {
        transaction,
        includeAsyncNode: true,
      }));

    if (isPopupHostUse(currentNode?.use)) {
      return currentNode;
    }

    const ancestors = await this.loadContextAncestorChain(
      uid,
      resolved || { uid, target: { uid }, kind: 'node' },
      transaction,
    );
    const childPageIndex = ancestors.findIndex((item) => item?.use === 'ChildPageModel');
    if (childPageIndex >= 0) {
      return ancestors[childPageIndex + 1] || null;
    }

    return null;
  }

  private getBlockKeyByUse(use?: string) {
    return BLOCK_KEY_BY_USE.get(use || '') || use || 'block';
  }

  private describePopupKind(popupProfile: FlowSurfacePopupBlockProfile | null | undefined) {
    if (!popupProfile?.isPopupSurface) {
      return 'current surface';
    }
    if (popupProfile.popupKind === 'associationPopup') {
      return 'association-field popup';
    }
    if (popupProfile.popupKind === 'recordPopup') {
      return 'non-association-field popup';
    }
    return 'plain popup';
  }

  private normalizeResourceInput(input: any): FlowSurfaceNormalizedResourceInput {
    if (_.isUndefined(input) || _.isNil(input)) {
      return undefined;
    }
    if (!_.isPlainObject(input)) {
      throwBadRequest('flowSurfaces resource must be an object');
    }

    if (Object.prototype.hasOwnProperty.call(input, 'binding')) {
      const binding = String(input.binding || '').trim() as FlowSurfaceResourceBindingKey;
      if (!['currentCollection', 'currentRecord', 'associatedRecords', 'otherRecords'].includes(binding)) {
        throwBadRequest(`flowSurfaces resource binding '${binding}' is not supported`);
      }
      return {
        kind: 'semantic',
        value: buildDefinedPayload({
          binding,
          dataSourceKey: input.dataSourceKey,
          collectionName: input.collectionName,
          associationField: input.associationField,
        }) as FlowSurfaceSemanticResourceInput,
      };
    }

    return {
      kind: 'raw',
      value: normalizeSimpleResourceInit(input) || {},
    };
  }

  private assertRequiredBlockResourceInit(input: {
    actionName: string;
    blockCatalogItem: FlowSurfaceCatalogItem;
    resourceInit?: Record<string, any>;
    resourceField?: 'resource' | 'resourceInit';
    blockDescriptor?: string;
  }) {
    const requiredInitParams = _.castArray(input.blockCatalogItem.requiredInitParams || []).filter(Boolean);
    if (!requiredInitParams.length) {
      return;
    }

    const missingPaths = requiredInitParams
      .filter((param) => isMissingRequiredResourceInitValue(input.resourceInit?.[param]))
      .map((param) => `${input.resourceField || 'resourceInit'}.${param}`);

    if (!missingPaths.length) {
      return;
    }

    const blockDescriptor = input.blockDescriptor || `block '${input.blockCatalogItem.key}'`;
    if (input.resourceField) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} ${blockDescriptor} requires ${joinRequiredFieldPaths(missingPaths)}`,
      );
    }

    throwBadRequest(
      `flowSurfaces ${
        input.actionName
      } ${blockDescriptor} requires resource or resourceInit with ${joinRequiredFieldPaths(requiredInitParams)}`,
    );
  }

  private describeComposeBlock(blockSpec: { index?: number; key?: string; type?: string }) {
    const index = Number(blockSpec.index || 0);
    const quotedKey = JSON.stringify(String((blockSpec as any).key || ''));
    const quotedType = JSON.stringify(String(blockSpec.type || ''));
    return `block #${index} (${quotedKey}, type=${quotedType})`;
  }

  private async resolvePopupCollectionBlockResourceInit(input: {
    actionName: string;
    blockUse: string;
    popupProfile: FlowSurfacePopupBlockProfile | null;
    semanticResource?: FlowSurfaceSemanticResourceInput;
    resourceInit?: Record<string, any>;
  }) {
    if (!this.isCollectionBlockUse(input.blockUse)) {
      if (input.semanticResource) {
        throwBadRequest(
          `flowSurfaces ${input.actionName} only supports semantic resource binding on collection blocks`,
        );
      }
      return input.resourceInit;
    }

    if (!input.popupProfile?.isPopupSurface) {
      if (input.semanticResource) {
        throwBadRequest(
          `flowSurfaces ${input.actionName} resource.binding only works on popup collection blocks; use resourceInit elsewhere`,
        );
      }
      return input.resourceInit;
    }

    const blockKey = this.getBlockKeyByUse(input.blockUse);
    if (this.isPopupCollectionBlockSceneUnsupported(input.popupProfile.scene)) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} popup scene '${input.popupProfile.scene}' does not support popup collection block creation`,
      );
    }

    const resourceBindings = this.buildPopupBlockResourceBindings(input.blockUse, input.popupProfile);
    const requestedBinding =
      input.semanticResource?.binding ||
      this.classifyPopupRawResourceInit(input.popupProfile, input.resourceInit || {});
    if (
      !this.isCatalogBlockVisibleForPopupProfile(input.blockUse, input.popupProfile) &&
      requestedBinding &&
      !['currentCollection', 'otherRecords'].includes(requestedBinding)
    ) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} block '${blockKey}' is not available in ${this.describePopupKind(
          input.popupProfile,
        )}; inspect catalog.blocks first`,
      );
    }
    if (!input.semanticResource && !input.resourceInit) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} popup collection block '${blockKey}' requires resource or resourceInit; inspect catalog.blocks[].resourceBindings first`,
      );
    }

    if (input.semanticResource) {
      return this.compilePopupSemanticResourceInit({
        actionName: input.actionName,
        blockUse: input.blockUse,
        popupProfile: input.popupProfile,
        resourceBindings,
        resource: input.semanticResource,
      });
    }

    return this.assertPopupRawResourceInit({
      actionName: input.actionName,
      blockUse: input.blockUse,
      popupProfile: input.popupProfile,
      resourceBindings,
      resourceInit: input.resourceInit || {},
    });
  }

  private compilePopupSemanticResourceInit(input: {
    actionName: string;
    blockUse: string;
    popupProfile: FlowSurfacePopupBlockProfile;
    resourceBindings: FlowSurfaceResourceBindingOption[];
    resource: FlowSurfaceSemanticResourceInput;
  }) {
    const binding = input.resource.binding;
    const supportedBinding = input.resourceBindings.find((item) => item.key === binding);
    if (!supportedBinding) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} block '${this.getBlockKeyByUse(
          input.blockUse,
        )}' does not support resource.binding='${binding}' in ${this.describePopupKind(
          input.popupProfile,
        )}; supported bindings: ${this.formatPopupSupportedBindings(input.resourceBindings)}`,
      );
    }
    const preserveAssociationContext = input.popupProfile.hasAssociationContext;

    if (binding === 'currentCollection') {
      return buildDefinedPayload({
        dataSourceKey: input.popupProfile.dataSourceKey || 'main',
        collectionName: input.popupProfile.collectionName,
        ...(preserveAssociationContext
          ? {
              associationName: input.popupProfile.associationName,
              sourceId: input.popupProfile.sourceId,
            }
          : {}),
      });
    }

    if (binding === 'currentRecord') {
      return buildDefinedPayload({
        dataSourceKey: input.popupProfile.dataSourceKey || 'main',
        collectionName: input.popupProfile.collectionName,
        filterByTk: input.popupProfile.filterByTk,
        ...(preserveAssociationContext
          ? {
              associationName: input.popupProfile.associationName,
              sourceId: input.popupProfile.sourceId,
            }
          : {}),
      });
    }

    if (binding === 'associatedRecords') {
      const associationFieldName = String(input.resource.associationField || '').trim();
      if (!associationFieldName) {
        throwBadRequest(
          `flowSurfaces ${input.actionName} resource.binding='associatedRecords' requires associationField`,
        );
      }
      const associationField = this.resolvePopupAssociationField(
        input.popupProfile,
        input.blockUse,
        associationFieldName,
      );
      if (!associationField) {
        throwBadRequest(
          `flowSurfaces ${
            input.actionName
          } associationField '${associationFieldName}' is not available in ${this.describePopupKind(
            input.popupProfile,
          )}`,
        );
      }
      return this.buildAssociatedRecordsResourceInit(input.popupProfile, associationField);
    }

    if (binding === 'otherRecords') {
      const dataSourceKey =
        String(input.resource.dataSourceKey || input.popupProfile.dataSourceKey || 'main').trim() || 'main';
      const collectionName = String(input.resource.collectionName || '').trim();
      if (!collectionName) {
        throwBadRequest(`flowSurfaces ${input.actionName} resource.binding='otherRecords' requires collectionName`);
      }
      const collection = this.getCollection(dataSourceKey, collectionName);
      if (!collection) {
        throwBadRequest(`flowSurfaces ${input.actionName} collection '${collectionName}' not found`);
      }
      return {
        dataSourceKey,
        collectionName,
      };
    }

    throwBadRequest(`flowSurfaces ${input.actionName} resource.binding='${binding}' is not supported`);
  }

  private assertPopupRawResourceInit(input: {
    actionName: string;
    blockUse: string;
    popupProfile: FlowSurfacePopupBlockProfile;
    resourceBindings: FlowSurfaceResourceBindingOption[];
    resourceInit: Record<string, any>;
  }) {
    const binding = this.classifyPopupRawResourceInit(input.popupProfile, input.resourceInit);
    if (!binding) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} resourceInit is not a valid popup binding for block '${this.getBlockKeyByUse(
          input.blockUse,
        )}'. Use catalog.blocks[].resourceBindings or semantic resource.binding instead`,
      );
    }

    const supportedBinding = input.resourceBindings.find((item) => item.key === binding);
    if (!supportedBinding) {
      throwBadRequest(
        `flowSurfaces ${input.actionName} block '${this.getBlockKeyByUse(
          input.blockUse,
        )}' does not support resourceInit binding '${binding}' in ${this.describePopupKind(
          input.popupProfile,
        )}; supported bindings: ${this.formatPopupSupportedBindings(input.resourceBindings)}`,
      );
    }

    if (
      !this.validatePopupRawResourceInit({
        binding,
        blockUse: input.blockUse,
        popupProfile: input.popupProfile,
        resourceBinding: supportedBinding,
        resourceInit: input.resourceInit,
      })
    ) {
      throwBadRequest(
        `flowSurfaces ${
          input.actionName
        } resourceInit does not match popup binding '${binding}' for ${this.describePopupKind(
          input.popupProfile,
        )}; inspect catalog.blocks[].resourceBindings and prefer semantic resource.binding`,
      );
    }

    return input.resourceInit;
  }

  private validatePopupRawResourceInit(input: {
    binding: FlowSurfaceResourceBindingKey;
    blockUse: string;
    popupProfile: FlowSurfacePopupBlockProfile;
    resourceBinding: FlowSurfaceResourceBindingOption;
    resourceInit: Record<string, any>;
  }) {
    const normalized = normalizeSimpleResourceInit(input.resourceInit) || {};
    const popupDataSourceKey = input.popupProfile.dataSourceKey || 'main';
    const resourceDataSourceKey = normalized.dataSourceKey || 'main';
    const sameCurrentCollection =
      !!input.popupProfile.collectionName &&
      resourceDataSourceKey === popupDataSourceKey &&
      normalized.collectionName === input.popupProfile.collectionName;

    if (input.binding === 'currentCollection') {
      if (!sameCurrentCollection || hasConfiguredFlowContextValue(normalized.filterByTk)) {
        return false;
      }
      if (input.popupProfile.hasAssociationContext) {
        return (
          normalized.associationName === input.popupProfile.associationName &&
          this.isSameConfiguredFlowContextValue(normalized.sourceId, input.popupProfile.sourceId)
        );
      }
      return (
        !hasConfiguredFlowContextValue(normalized.associationName) &&
        !hasConfiguredFlowContextValue(normalized.sourceId)
      );
    }

    if (input.binding === 'currentRecord') {
      if (!sameCurrentCollection || !hasConfiguredFlowContextValue(normalized.filterByTk)) {
        return false;
      }
      if (input.popupProfile.hasAssociationContext) {
        return (
          this.isSameConfiguredFlowContextValue(normalized.filterByTk, input.popupProfile.filterByTk) &&
          normalized.associationName === input.popupProfile.associationName &&
          this.isSameConfiguredFlowContextValue(normalized.sourceId, input.popupProfile.sourceId)
        );
      }
      return (
        this.isSameConfiguredFlowContextValue(normalized.filterByTk, input.popupProfile.filterByTk) &&
        !hasConfiguredFlowContextValue(normalized.associationName) &&
        !hasConfiguredFlowContextValue(normalized.sourceId)
      );
    }

    if (input.binding === 'associatedRecords') {
      if (
        !hasConfiguredFlowContextValue(normalized.collectionName) ||
        !hasConfiguredFlowContextValue(normalized.associationName) ||
        !hasConfiguredFlowContextValue(normalized.sourceId) ||
        hasConfiguredFlowContextValue(normalized.filterByTk)
      ) {
        return false;
      }
      return _.castArray(input.resourceBinding.associationFields || []).some((field) => {
        const associationField = this.resolvePopupAssociationField(input.popupProfile, input.blockUse, field.key);
        if (!associationField) {
          return false;
        }
        return (
          field.collectionName === normalized.collectionName &&
          field.associationName === normalized.associationName &&
          resourceDataSourceKey === popupDataSourceKey &&
          this.isPopupAssociatedRecordsSourceIdMatch(input.popupProfile, associationField, normalized.sourceId)
        );
      });
    }

    if (input.binding === 'otherRecords') {
      if (
        !hasConfiguredFlowContextValue(normalized.collectionName) ||
        hasConfiguredFlowContextValue(normalized.associationName) ||
        hasConfiguredFlowContextValue(normalized.sourceId) ||
        hasConfiguredFlowContextValue(normalized.filterByTk)
      ) {
        return false;
      }
      return !!this.getCollection(resourceDataSourceKey, normalized.collectionName);
    }

    return false;
  }

  private getCollectionFilterTargetKey(collection: any) {
    return (
      (Array.isArray(collection?.filterTargetKey) ? collection?.filterTargetKey?.[0] : collection?.filterTargetKey) ||
      (Array.isArray(collection?.options?.filterTargetKey)
        ? collection?.options?.filterTargetKey?.[0]
        : collection?.options?.filterTargetKey) ||
      'id'
    );
  }

  private normalizeFlowContextTemplateValue(value: any) {
    if (!_.isString(value)) {
      return value;
    }
    const trimmed = value.trim();
    const match = trimmed.match(/^\{\{\s*(.+?)\s*\}\}$/);
    if (!match) {
      return trimmed;
    }
    return `{{${match[1].replace(/\s+/g, '')}}}`;
  }

  private isSameConfiguredFlowContextValue(left: any, right: any) {
    if (!hasConfiguredFlowContextValue(left) || !hasConfiguredFlowContextValue(right)) {
      return false;
    }
    return _.isEqual(this.normalizeFlowContextTemplateValue(left), this.normalizeFlowContextTemplateValue(right));
  }

  private isPopupAssociatedRecordsSourceIdMatch(
    popupProfile: FlowSurfacePopupBlockProfile,
    associationField: any,
    sourceId: any,
  ) {
    if (!hasConfiguredFlowContextValue(sourceId)) {
      return false;
    }
    const normalizedSourceId = this.normalizeFlowContextTemplateValue(sourceId);
    const fieldType = getFieldType(associationField);
    const sourceKey =
      fieldType === 'belongsTo'
        ? associationField?.foreignKey || associationField?.options?.foreignKey
        : associationField?.sourceKey || associationField?.options?.sourceKey;
    const currentCollectionFilterTargetKey = this.getCollectionFilterTargetKey(popupProfile.currentCollection);
    const allowedValues = new Set<string>();

    if (sourceKey) {
      allowedValues.add(`{{ctx.popup.record.${sourceKey}}}`);
      if (sourceKey === currentCollectionFilterTargetKey) {
        allowedValues.add('{{ctx.view.inputArgs.filterByTk}}');
      }
    } else {
      allowedValues.add('{{ctx.view.inputArgs.filterByTk}}');
    }

    return allowedValues.has(normalizedSourceId);
  }

  private classifyPopupRawResourceInit(
    popupProfile: FlowSurfacePopupBlockProfile,
    resourceInit?: Record<string, any>,
  ): FlowSurfaceResourceBindingKey | null {
    if (!resourceInit?.collectionName) {
      return null;
    }

    const sameCurrentCollection =
      !!popupProfile.collectionName &&
      (resourceInit.dataSourceKey || 'main') === (popupProfile.dataSourceKey || 'main') &&
      resourceInit.collectionName === popupProfile.collectionName;

    if (sameCurrentCollection && hasConfiguredFlowContextValue(resourceInit.filterByTk)) {
      return 'currentRecord';
    }

    if (sameCurrentCollection && !hasConfiguredFlowContextValue(resourceInit.filterByTk)) {
      return 'currentCollection';
    }

    if (
      hasConfiguredFlowContextValue(resourceInit.associationName) &&
      hasConfiguredFlowContextValue(resourceInit.sourceId)
    ) {
      return 'associatedRecords';
    }

    if (
      hasConfiguredFlowContextValue(resourceInit.collectionName) &&
      !hasConfiguredFlowContextValue(resourceInit.associationName) &&
      !hasConfiguredFlowContextValue(resourceInit.sourceId) &&
      !hasConfiguredFlowContextValue(resourceInit.filterByTk)
    ) {
      return 'otherRecords';
    }

    return null;
  }

  private resolvePopupAssociationField(
    popupProfile: FlowSurfacePopupBlockProfile,
    blockUse: string,
    associationFieldName: string,
  ) {
    return this.resolvePopupAssociationFields(popupProfile, blockUse)
      .filter((field) => getFieldName(field) === associationFieldName)
      .find(Boolean);
  }

  private buildAssociatedRecordsResourceInit(popupProfile: FlowSurfacePopupBlockProfile, associationField: any) {
    let targetCollection = null;
    try {
      targetCollection = resolveFieldTargetCollection(
        associationField,
        popupProfile.dataSourceKey || 'main',
        (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
      );
    } catch (error) {
      targetCollection = null;
    }
    if (!targetCollection) {
      throwBadRequest(
        `flowSurfaces associatedRecords field '${getFieldName(associationField)}' target collection is not available`,
      );
    }

    const fieldType = getFieldType(associationField);
    const sourceKey =
      fieldType === 'belongsTo'
        ? associationField?.foreignKey || associationField?.options?.foreignKey
        : associationField?.sourceKey || associationField?.options?.sourceKey;
    const currentCollectionFilterTargetKey = this.getCollectionFilterTargetKey(popupProfile.currentCollection);
    const sourceId =
      sourceKey && sourceKey !== currentCollectionFilterTargetKey
        ? `{{ctx.popup.record.${sourceKey}}}`
        : '{{ctx.view.inputArgs.filterByTk}}';
    const associationName = resolveAssociationNameFromField(associationField, popupProfile.currentCollection);
    if (!associationName) {
      throwBadRequest(
        `flowSurfaces associatedRecords field '${getFieldName(associationField)}' associationName cannot be resolved`,
      );
    }

    return buildDefinedPayload({
      dataSourceKey: popupProfile.dataSourceKey || 'main',
      collectionName: getFieldTarget(associationField) || targetCollection?.name || targetCollection?.options?.name,
      associationName,
      sourceId,
    });
  }

  async context(values: FlowSurfaceContextValues, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('context', values?.target, values);
    const path = this.normalizeContextPath(values?.path);
    const maxDepth = this.normalizeContextMaxDepth(values?.maxDepth);
    const resolved = await this.locator.resolve(target, options);
    const semantic = await this.resolveContextSemantic(
      resolved?.node?.uid || target.uid,
      resolved,
      options.transaction,
    );
    return buildFlowSurfaceContextResponse({
      semantic,
      path,
      maxDepth,
    });
  }

  private extractReactionCanonicalRules(node: any, slot: FlowSurfaceReactionSlot) {
    const stepRoot = _.get(node, ['stepParams', slot.flowKey, slot.stepKey]);
    const rawValue = slot.valuePath == null ? stepRoot : _.get(stepRoot, slot.valuePath);
    return Array.isArray(rawValue) ? _.cloneDeep(rawValue) : [];
  }

  private buildReactionFieldPathMaps(node: any, scene: FlowSurfaceReactionScene) {
    const pathToUid = new Map<string, string>();
    const uidToPath = new Map<string, string>();

    const visit = (current: any, depth: number) => {
      if (!current || typeof current !== 'object') {
        return;
      }

      const isSubFormHostRoot =
        scene === 'subForm' &&
        depth === 0 &&
        ['SubFormFieldModel', 'SubFormListFieldModel'].includes(String(current.use || '').trim());

      if (!isSubFormHostRoot) {
        const fieldInit =
          current?.stepParams?.fieldSettings?.init || current?.subModels?.field?.stepParams?.fieldSettings?.init;
        const fieldPath = String(fieldInit?.fieldPath || '').trim();
        if (current?.uid && fieldPath) {
          const normalizedPath = normalizeFieldPath(fieldPath, fieldInit?.associationPathName);
          if (normalizedPath) {
            if (!pathToUid.has(normalizedPath)) {
              pathToUid.set(normalizedPath, current.uid);
            }
            if (!uidToPath.has(current.uid)) {
              uidToPath.set(current.uid, normalizedPath);
            }
          }
        }
      }

      for (const child of Object.values(current.subModels || {})) {
        for (const item of Array.isArray(child) ? child : [child]) {
          visit(item, depth + 1);
        }
      }
    };

    visit(node, 0);
    return {
      pathToUid,
      uidToPath,
    };
  }

  private requireReactionFieldUid(pathToUid: Map<string, string>, fieldPath: string, actionName: string) {
    const normalizedPath = String(fieldPath || '').trim();
    const uid = pathToUid.get(normalizedPath);
    if (uid) {
      return uid;
    }
    throwBadRequest(
      `flowSurfaces ${actionName} field path '${normalizedPath}' is not available on the current target`,
      FLOW_SURFACE_REACTION_UNKNOWN_TARGET_KEY,
    );
  }

  private buildReactionRuleNormalizers(node: any): FlowSurfaceReactionRuleNormalizers {
    return {
      fieldValue: ({ canonicalRules }) => normalizeFieldValueRules(canonicalRules),
      blockLinkage: ({ canonicalRules }) => normalizeBlockLinkageRules(canonicalRules),
      actionLinkage: ({ canonicalRules }) => normalizeActionLinkageRules(canonicalRules),
      fieldLinkage: ({ canonicalRules, resolvedScene }) => {
        const { uidToPath } = this.buildReactionFieldPathMaps(node, resolvedScene as FlowSurfaceFieldLinkageScene);
        return normalizeFieldLinkageRules(canonicalRules, {
          scene: resolvedScene as FlowSurfaceFieldLinkageScene,
          resolveFieldPath: (fieldUid) => uidToPath.get(String(fieldUid || '').trim()),
        });
      },
    };
  }

  private buildReactionFingerprintForSlot(params: {
    kind: FlowSurfaceReactionKind;
    scene: FlowSurfaceReactionScene;
    slot: FlowSurfaceReactionSlot;
    canonicalRules: any[];
  }) {
    return buildReactionFingerprint({
      kind: params.kind,
      scene: params.scene,
      slot: params.slot,
      canonicalRules: params.canonicalRules,
    });
  }

  private assertReactionFingerprint(
    actionName: string,
    expectedFingerprint: string | undefined,
    currentFingerprint: string,
  ) {
    const normalizedExpectedFingerprint = String(expectedFingerprint || '').trim();
    if (!normalizedExpectedFingerprint) {
      return;
    }
    if (normalizedExpectedFingerprint === currentFingerprint) {
      return;
    }
    throwConflict(
      `flowSurfaces ${actionName} expectedFingerprint does not match the current reaction slot fingerprint`,
      FLOW_SURFACE_REACTION_FINGERPRINT_CONFLICT,
    );
  }

  private async resolveReactionRequest(
    actionName: string,
    targetInput: FlowSurfaceWriteTarget | undefined,
    options: { transaction?: any } = {},
  ): Promise<{
    writeTarget: FlowSurfaceWriteTarget;
    resolved: FlowSurfaceResolvedTarget;
    node: any;
    resolvedTarget: FlowSurfaceResolvedReactionTarget;
  }> {
    const writeTarget = this.normalizeWriteTarget(actionName, targetInput, {
      target: targetInput,
    });
    const resolved = await this.locator.resolve(writeTarget, options);
    const rawNode = await this.loadResolvedNode(resolved, options.transaction);
    const node = this.stripInternalSurfaceMetaFromNodeTree(_.cloneDeep(rawNode));
    const resolvedTarget = resolveReactionTarget({
      target: writeTarget,
      node,
      use: node?.use,
    });
    return {
      writeTarget,
      resolved,
      node,
      resolvedTarget,
    };
  }

  private async persistReactionSlot(
    node: any,
    slot: FlowSurfaceReactionSlot,
    canonicalRules: any[],
    options: { transaction?: any } = {},
  ) {
    const targetUid = String(node?.uid || '').trim();
    if (!targetUid) {
      throwBadRequest(`flowSurfaces reaction target '${node?.use || 'unknown'}' is missing uid`);
    }

    const stepParamsPatch: Record<string, any> = {};
    if (slot.valuePath == null) {
      _.set(stepParamsPatch, [slot.flowKey, slot.stepKey], _.cloneDeep(canonicalRules));
    } else {
      _.set(stepParamsPatch, [slot.flowKey, slot.stepKey, slot.valuePath], _.cloneDeep(canonicalRules));
    }

    const contract = getNodeContract(node?.use);
    const domainContract = contract.domains.stepParams;
    if (!domainContract) {
      throwBadRequest(`flowSurfaces reaction target '${node?.use || node?.uid}' does not support stepParams writes`);
    }

    // Reaction slot writes use full-replace semantics on the target slot.
    // Validate only the slot patch against the contract, then replace that slot directly.
    this.contractGuard.mergeDomainValue('stepParams', {}, stepParamsPatch, domainContract, node?.use);

    const nextStepParams =
      this.stripInternalSurfaceMetaFromNodeTree({
        stepParams: _.cloneDeep(node?.stepParams || {}),
      })?.stepParams || {};
    if (slot.valuePath == null) {
      _.set(nextStepParams, [slot.flowKey, slot.stepKey], _.cloneDeep(canonicalRules));
    } else {
      _.set(nextStepParams, [slot.flowKey, slot.stepKey, slot.valuePath], _.cloneDeep(canonicalRules));
    }

    await this.repository.patch(
      {
        uid: targetUid,
        stepParams: nextStepParams,
      },
      { transaction: options.transaction },
    );
  }

  private buildLinkageWriteResult<T>(params: {
    kind: Exclude<FlowSurfaceReactionKind, 'fieldValue'>;
    resolvedTarget: FlowSurfaceResolvedReactionTarget;
    resolvedScene: FlowSurfaceReactionScene;
    resolvedSlot: FlowSurfaceReactionSlot;
    normalizedRules: T[];
    canonicalRules: any[];
  }): FlowSurfaceReactionWriteResult<T> {
    return {
      target: params.resolvedTarget.target,
      resolvedScene: params.resolvedScene,
      resolvedSlot: params.resolvedSlot,
      fingerprint: this.buildReactionFingerprintForSlot({
        kind: params.kind,
        scene: params.resolvedScene,
        slot: params.resolvedSlot,
        canonicalRules: params.canonicalRules,
      }),
      normalizedRules: params.normalizedRules,
      canonicalRules: params.canonicalRules,
    };
  }

  private async getLiveLinkageCapability(
    kind: Exclude<FlowSurfaceReactionKind, 'fieldValue'>,
    writeTarget: FlowSurfaceWriteTarget,
    resolvedTarget: FlowSurfaceResolvedReactionTarget,
    node: any,
    options: { transaction?: any } = {},
  ): Promise<FlowSurfaceLinkageCapability> {
    const context = await this.context(
      {
        target: writeTarget,
      },
      options,
    );
    const { capabilities } = buildReactionMetaCapabilities({
      resolvedTarget: {
        ...resolvedTarget,
        node,
      },
      context,
    });
    const capability = capabilities.find((item): item is FlowSurfaceLinkageCapability => item.kind === kind);
    if (!capability) {
      throwBadRequest(
        `flowSurfaces reaction target '${resolvedTarget.use || resolvedTarget.target.uid}' does not support ${kind}`,
      );
    }
    return capability;
  }

  async getReactionMeta(
    values: FlowSurfaceGetReactionMetaValues,
    options: { transaction?: any } = {},
  ): Promise<FlowSurfaceGetReactionMetaResult> {
    validateFlowSurfacePayloadShape('getReactionMeta', values, 'values');
    const { writeTarget, node, resolvedTarget } = await this.resolveReactionRequest(
      'getReactionMeta',
      values?.target,
      options,
    );
    const context = await this.context(
      {
        target: writeTarget,
      },
      options,
    );
    return buildGetReactionMetaResult({
      resolvedTarget: {
        ...resolvedTarget,
        node,
      },
      context,
      normalizeRules: this.buildReactionRuleNormalizers(node),
    });
  }

  async setFieldValueRules(
    values: FlowSurfaceReactionWriteValues<FlowSurfaceFieldValueRule>,
    options: { transaction?: any } = {},
  ) {
    validateFlowSurfacePayloadShape('setFieldValueRules', values, 'values');
    const { writeTarget, node, resolvedTarget } = await this.resolveReactionRequest(
      'setFieldValueRules',
      values?.target,
      options,
    );
    const capability = resolveReactionCapability(resolvedTarget, 'fieldValue');
    const storageNode = resolveReactionStorageNode(resolvedTarget, capability);
    const currentCanonicalRules = this.extractReactionCanonicalRules(storageNode, capability.resolvedSlot);
    const currentFingerprint = this.buildReactionFingerprintForSlot({
      kind: 'fieldValue',
      scene: capability.resolvedScene,
      slot: capability.resolvedSlot,
      canonicalRules: currentCanonicalRules,
    });
    this.assertReactionFingerprint('setFieldValueRules', values?.expectedFingerprint, currentFingerprint);

    const result = buildFieldValueWriteResult({
      target: {
        ...resolvedTarget.target,
        use: node?.use,
      },
      rules: Array.isArray(values?.rules) ? values.rules : [],
    });

    await this.persistReactionSlot(storageNode, capability.resolvedSlot, result.canonicalRules, options);

    return result;
  }

  async setBlockLinkageRules(
    values: FlowSurfaceReactionWriteValues<FlowSurfaceBlockLinkageRule>,
    options: { transaction?: any } = {},
  ) {
    validateFlowSurfacePayloadShape('setBlockLinkageRules', values, 'values');
    const { writeTarget, node, resolvedTarget } = await this.resolveReactionRequest(
      'setBlockLinkageRules',
      values?.target,
      options,
    );
    const capability = resolveReactionCapability(resolvedTarget, 'blockLinkage');
    const storageNode = resolveReactionStorageNode(resolvedTarget, capability);
    const currentCanonicalRules = this.extractReactionCanonicalRules(storageNode, capability.resolvedSlot);
    const currentFingerprint = this.buildReactionFingerprintForSlot({
      kind: 'blockLinkage',
      scene: capability.resolvedScene,
      slot: capability.resolvedSlot,
      canonicalRules: currentCanonicalRules,
    });
    this.assertReactionFingerprint('setBlockLinkageRules', values?.expectedFingerprint, currentFingerprint);

    const normalizedRules = normalizeBlockLinkageRules(Array.isArray(values?.rules) ? values.rules : []);
    const liveCapability = await this.getLiveLinkageCapability(
      'blockLinkage',
      writeTarget,
      resolvedTarget,
      node,
      options,
    );
    validateBlockLinkageRulesAgainstCapability(normalizedRules, liveCapability);
    const canonicalRules = compileBlockLinkageCanonicalRules(normalizedRules);
    const result = this.buildLinkageWriteResult({
      kind: 'blockLinkage',
      resolvedTarget,
      resolvedScene: capability.resolvedScene,
      resolvedSlot: capability.resolvedSlot,
      normalizedRules,
      canonicalRules,
    });

    await this.persistReactionSlot(storageNode, capability.resolvedSlot, canonicalRules, options);

    return result;
  }

  async setFieldLinkageRules(
    values: FlowSurfaceReactionWriteValues<FlowSurfaceFieldLinkageRule>,
    options: { transaction?: any } = {},
  ) {
    validateFlowSurfacePayloadShape('setFieldLinkageRules', values, 'values');
    const { writeTarget, node, resolvedTarget } = await this.resolveReactionRequest(
      'setFieldLinkageRules',
      values?.target,
      options,
    );
    const capability = resolveReactionCapability(resolvedTarget, 'fieldLinkage');
    const storageNode = resolveReactionStorageNode(resolvedTarget, capability);
    const currentCanonicalRules = this.extractReactionCanonicalRules(storageNode, capability.resolvedSlot);
    const currentFingerprint = this.buildReactionFingerprintForSlot({
      kind: 'fieldLinkage',
      scene: capability.resolvedScene,
      slot: capability.resolvedSlot,
      canonicalRules: currentCanonicalRules,
    });
    this.assertReactionFingerprint('setFieldLinkageRules', values?.expectedFingerprint, currentFingerprint);

    const scene = capability.resolvedScene as FlowSurfaceFieldLinkageScene;
    const { pathToUid } = this.buildReactionFieldPathMaps(node, scene);
    const normalizedRules = normalizeFieldLinkageRules(Array.isArray(values?.rules) ? values.rules : [], {
      scene,
    });
    const liveCapability = await this.getLiveLinkageCapability(
      'fieldLinkage',
      writeTarget,
      resolvedTarget,
      node,
      options,
    );
    if (liveCapability.kind !== 'fieldLinkage') {
      throwBadRequest(
        `flowSurfaces reaction target '${
          resolvedTarget.use || resolvedTarget.target.uid
        }' does not support fieldLinkage`,
      );
    }
    validateFieldLinkageRulesAgainstCapability(normalizedRules, liveCapability);
    const canonicalRules = compileFieldLinkageCanonicalRules(normalizedRules, {
      scene,
      resolveFieldUid: (fieldPath) => this.requireReactionFieldUid(pathToUid, fieldPath, 'setFieldLinkageRules'),
    });
    const result = this.buildLinkageWriteResult({
      kind: 'fieldLinkage',
      resolvedTarget,
      resolvedScene: capability.resolvedScene,
      resolvedSlot: capability.resolvedSlot,
      normalizedRules,
      canonicalRules,
    });

    await this.persistReactionSlot(storageNode, capability.resolvedSlot, canonicalRules, options);

    return result;
  }

  async setActionLinkageRules(
    values: FlowSurfaceReactionWriteValues<FlowSurfaceActionLinkageRule>,
    options: { transaction?: any } = {},
  ) {
    validateFlowSurfacePayloadShape('setActionLinkageRules', values, 'values');
    const { writeTarget, node, resolvedTarget } = await this.resolveReactionRequest(
      'setActionLinkageRules',
      values?.target,
      options,
    );
    const capability = resolveReactionCapability(resolvedTarget, 'actionLinkage');
    const storageNode = resolveReactionStorageNode(resolvedTarget, capability);
    const currentCanonicalRules = this.extractReactionCanonicalRules(storageNode, capability.resolvedSlot);
    const currentFingerprint = this.buildReactionFingerprintForSlot({
      kind: 'actionLinkage',
      scene: capability.resolvedScene,
      slot: capability.resolvedSlot,
      canonicalRules: currentCanonicalRules,
    });
    this.assertReactionFingerprint('setActionLinkageRules', values?.expectedFingerprint, currentFingerprint);

    const normalizedRules = normalizeActionLinkageRules(Array.isArray(values?.rules) ? values.rules : []);
    const liveCapability = await this.getLiveLinkageCapability(
      'actionLinkage',
      writeTarget,
      resolvedTarget,
      node,
      options,
    );
    validateActionLinkageRulesAgainstCapability(normalizedRules, liveCapability);
    const canonicalRules = compileActionLinkageCanonicalRules(normalizedRules);
    const result = this.buildLinkageWriteResult({
      kind: 'actionLinkage',
      resolvedTarget,
      resolvedScene: capability.resolvedScene,
      resolvedSlot: capability.resolvedSlot,
      normalizedRules,
      canonicalRules,
    });

    await this.persistReactionSlot(storageNode, capability.resolvedSlot, canonicalRules, options);

    return result;
  }

  private buildStableFingerprintString(value: any): string {
    if (_.isNil(value)) {
      return 'null';
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.buildStableFingerprintString(item)).join(',')}]`;
    }
    if (_.isPlainObject(value)) {
      const entries = Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${this.buildStableFingerprintString(value[key])}`);
      return `{${entries.join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private buildSurfaceFingerprint(value: any) {
    return createHash('sha1').update(this.buildStableFingerprintString(value)).digest('hex');
  }

  private getDeclaredKeyFromNode(node: any) {
    return getPlanningDeclaredKeyFromNode(node);
  }

  private stripInternalSurfaceMetaFromNodeTree<T = any>(node: T): T {
    const visit = (current: any) => {
      if (!current || typeof current !== 'object') {
        return current;
      }
      if (_.isPlainObject(current.stepParams)) {
        _.unset(current.stepParams, [FLOW_SURFACE_INTERNAL_META_KEY]);
        if (!Object.keys(current.stepParams).length) {
          delete current.stepParams;
        }
      }
      for (const value of Object.values(current.subModels || {})) {
        _.castArray(value as any).forEach((child) => visit(child));
      }
      return current;
    };
    return visit(node);
  }

  private async buildSurfaceReadPayload(
    target: FlowSurfaceReadLocator,
    resolved: FlowSurfaceResolvedTarget,
    node: any,
    options: { transaction?: any } = {},
  ) {
    const nodeMap = flattenModel(node);
    const result: Record<string, any> = {
      target: this.buildReadTargetSummary(target, resolved),
      tree: node,
      nodeMap,
    };

    if (resolved.pageRoute) {
      result.pageRoute = await this.routeSync.hydrateRoute(resolved.pageRoute, options.transaction);
    } else if (resolved.route) {
      result.route = await this.routeSync.hydrateRoute(resolved.route, options.transaction);
    }

    return result;
  }

  private buildSurfaceContextFingerprint(
    context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'keyMap'>,
  ) {
    return this.buildSurfaceFingerprint({
      surface: {
        uid: context.surfaceResolved.uid,
      },
      keys: buildPlanningSurfaceFingerprintKeysObject(context.keyMap),
      tree: context.publicTree,
    });
  }

  async get(input: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeGetTarget(input);
    const resolved = await this.locator.resolve(target, options);
    const rawNode = await this.decorateTemplateReadbackTree(
      this.normalizePopupTreeShape(await this.loadResolvedNode(resolved, options.transaction)),
      options.transaction,
    );
    const publicNode = this.stripInternalSurfaceMetaFromNodeTree(_.cloneDeep(rawNode));
    return this.buildSurfaceReadPayload(target, resolved, publicNode, options);
  }

  private getDeclaredKeyPersistenceDeps() {
    return {
      findModelById: (uid: string, findOptions?: { transaction?: any; includeAsyncNode?: boolean }) =>
        this.repository.findModelById(uid, findOptions),
      patchModel: (values: Record<string, any>, patchOptions?: { transaction?: any }) =>
        this.patchDeclaredKeyModel(values, patchOptions),
      getDeclaredKeyFromNode: (node: any) => this.getDeclaredKeyFromNode(node),
    };
  }

  private async patchDeclaredKeyModel(values: Record<string, any>, options?: { transaction?: any }) {
    const normalizedUid = String(values?.uid || '').trim();
    if (!normalizedUid) {
      return this.repository.patch(values, options);
    }

    const persisted = await this.repository.model.findByPk(normalizedUid, {
      transaction: options?.transaction,
    });
    if (persisted) {
      return this.repository.patch(values, options);
    }

    const currentNode = await this.repository
      .findModelById(normalizedUid, {
        transaction: options?.transaction,
        includeAsyncNode: true,
      })
      .catch(() => null);
    const tabRoute = await this.locator.findRouteBySchemaUid(normalizedUid, options?.transaction).catch(() => null);
    const shouldCreateTabAnchor = currentNode?.use === 'RootPageTabModel' || (!!tabRoute && !currentNode?.use);

    if (shouldCreateTabAnchor) {
      await this.repository.upsertModel(
        buildDefinedPayload({
          uid: normalizedUid,
          use: 'RootPageTabModel',
          props: _.omit(_.cloneDeep(currentNode?.props || {}), ['route']),
          decoratorProps: _.cloneDeep(currentNode?.decoratorProps || {}),
          flowRegistry: _.cloneDeep(currentNode?.flowRegistry || {}),
          stepParams: _.cloneDeep(values?.stepParams || currentNode?.stepParams || {}),
        }),
        { transaction: options?.transaction },
      );
      return;
    }

    return this.repository.patch(values, options);
  }

  private async persistCreatedKeysForAction(
    actionName: 'createPage' | 'addTab' | 'addPopupTab' | 'addBlock' | 'addField' | 'addAction' | 'addRecordAction',
    values: Record<string, any>,
    result: Record<string, any>,
    transaction?: any,
  ) {
    const keyPersistenceDeps = this.getDeclaredKeyPersistenceDeps();
    const createdKeys = collectFlowSurfaceCreatedKeys(actionName, values);
    for (const createdKey of collectPersistableFlowSurfaceCreatedKeys(result, createdKeys)) {
      await persistPlanningDeclaredKeyForNode(
        {
          key: createdKey.key,
          uid: createdKey.uid,
          source: 'declared',
          kind: 'node',
          locator: {
            uid: createdKey.uid,
          },
        },
        keyPersistenceDeps,
        transaction,
      );
    }
  }

  private buildPlanningRuntimeDeps() {
    return {
      normalizeGetTarget: (value: any) => this.normalizeGetTarget(value),
      resolveLocator: (target: FlowSurfaceReadLocator, resolveOptions?: { transaction?: any }) =>
        this.locator.resolve(target, resolveOptions),
      loadResolvedSurfaceTree: async (resolved: FlowSurfaceResolvedTarget, transaction?: any) =>
        this.decorateTemplateReadbackTree(
          this.normalizePopupTreeShape(await this.loadResolvedNode(resolved, transaction)),
          transaction,
        ),
      stripInternalSurfaceMetaFromNodeTree: (node: any) => this.stripInternalSurfaceMetaFromNodeTree(node),
      buildReadTargetSummary: (target: FlowSurfaceReadLocator, resolved: FlowSurfaceResolvedTarget) =>
        this.buildReadTargetSummary(target, resolved),
      buildSurfaceContextFingerprint: (
        context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'keyMap'>,
      ) => this.buildSurfaceContextFingerprint(context),
      buildSurfaceReadPayload: (
        target: FlowSurfaceReadLocator,
        resolved: FlowSurfaceResolvedTarget,
        node: any,
        readOptions?: { transaction?: any },
      ) => this.buildSurfaceReadPayload(target, resolved, node, readOptions),
      dispatchPlanOnlyAction: (
        action: FlowSurfacePlanOnlyActionName,
        payload: Record<string, any>,
        transaction?: any,
      ) => this.dispatchPlanOnlyAction(action, payload, transaction),
      dispatchOp: (
        op: FlowSurfaceMutateOp,
        resolvedValues: Record<string, any>,
        currentCtx: FlowSurfaceExecutorContext,
      ) => this.dispatchOp(op, resolvedValues, currentCtx),
    };
  }

  async describeSurface(values: FlowSurfaceDescribeValues, options: { transaction?: any } = {}) {
    return describePlanningSurface(values, this.buildPlanningRuntimeDeps(), options);
  }

  private async dispatchPlanOnlyAction(
    action: FlowSurfacePlanOnlyActionName,
    payload: Record<string, any>,
    transaction?: any,
  ) {
    const options = { transaction };
    switch (action) {
      case 'compose':
        return this.compose(payload as FlowSurfaceComposeValues, options);
      case 'configure':
        return this.configure(payload as FlowSurfaceConfigureValues, options);
      case 'setFieldValueRules':
        return this.setFieldValueRules(payload as FlowSurfaceReactionWriteValues<FlowSurfaceFieldValueRule>, options);
      case 'setBlockLinkageRules':
        return this.setBlockLinkageRules(
          payload as FlowSurfaceReactionWriteValues<FlowSurfaceBlockLinkageRule>,
          options,
        );
      case 'setFieldLinkageRules':
        return this.setFieldLinkageRules(
          payload as FlowSurfaceReactionWriteValues<FlowSurfaceFieldLinkageRule>,
          options,
        );
      case 'setActionLinkageRules':
        return this.setActionLinkageRules(
          payload as FlowSurfaceReactionWriteValues<FlowSurfaceActionLinkageRule>,
          options,
        );
      case 'convertTemplateToCopy':
        return this.convertTemplateToCopy(payload, options);
    }

    const unsupportedAction: never = action;
    throwInternalError(`flowSurfaces plan-only action '${unsupportedAction}' is not supported`);
  }

  private async resolveApplyBlueprintReplaceTargetInfo(
    pageSchemaUid: string,
    transaction?: any,
  ): Promise<FlowSurfaceApplyBlueprintReplaceTargetInfo> {
    const readback = await this.get(
      {
        pageSchemaUid,
      },
      { transaction },
    );
    const pageUid = readback?.target?.uid || readback?.tree?.uid;
    if (typeof pageUid !== 'string' || !pageUid.trim()) {
      throwBadRequest(`flowSurfaces applyBlueprint replace target page is missing page uid`);
    }
    const structure = readback?.pageRoute
      ? await this.loadRouteBackedPageStructure(readback.pageRoute, transaction)
      : { tabRoutes: _.castArray(readback?.tree?.subModels?.tabs || []) };
    const tabs = _.castArray(structure.tabRoutes || []).map((tab: any, index: number) => {
      const uid = String(this.readRouteField(tab, 'schemaUid') || tab?.uid || '').trim();
      if (!uid) {
        throwBadRequest(`flowSurfaces applyBlueprint replace target tab #${index + 1} is missing uid`);
      }
      return {
        uid,
      };
    });
    if (!tabs.length) {
      throwBadRequest(`flowSurfaces applyBlueprint replace target page must contain at least one tab`);
    }
    const pageEnableTabs =
      typeof readback?.pageRoute?.enableTabs === 'boolean' ? readback.pageRoute.enableTabs : undefined;
    return {
      locator: {
        pageSchemaUid,
      },
      pageUid: pageUid.trim(),
      pageEnableTabs,
      tabs,
    };
  }

  private async resolveApplyBlueprintCreateNavigationGroup(
    document: FlowSurfaceApplyBlueprintDocument,
    transaction?: any,
  ): Promise<FlowSurfaceApplyBlueprintDocument> {
    if (document.mode !== 'create' || !_.isPlainObject(document.navigation?.group)) {
      return document;
    }

    if (!_.isUndefined(document.navigation.group.routeId)) {
      return document;
    }

    const groupTitle = String(document.navigation.group.title || '').trim();
    if (!groupTitle) {
      return document;
    }

    const matchedRoutes = await this.findMenuGroupRoutesByTitle(groupTitle, transaction);
    if (!matchedRoutes.length) {
      return document;
    }
    if (matchedRoutes.length > 1) {
      throwBadRequest(
        `flowSurfaces applyBlueprint navigation.group.title '${groupTitle}' matches ${matchedRoutes.length} existing menu groups; pass navigation.group.routeId explicitly`,
      );
    }

    const reusedMetadataFields = APPLY_BLUEPRINT_CREATE_MENU_GROUP_METADATA_KEYS.filter(
      (key) => !_.isUndefined(document.navigation?.group?.[key]),
    );
    if (reusedMetadataFields.length) {
      throwBadRequest(
        `flowSurfaces applyBlueprint navigation.group.title '${groupTitle}' matched an existing menu group; do not also pass ${reusedMetadataFields
          .map((key) => `navigation.group.${key}`)
          .join(
            ', ',
          )} when reusing by title. Same-title reuse is title-only. Keep only navigation.group.title or use navigation.group.routeId for exact targeting, and call flowSurfaces:updateMenu separately if existing group metadata must change`,
      );
    }

    const routeId = this.readRouteField(matchedRoutes[0], 'id');
    if (_.isNil(routeId) || routeId === '') {
      throwBadRequest(
        `flowSurfaces applyBlueprint matched navigation group '${groupTitle}' is missing route id; pass navigation.group.routeId explicitly`,
      );
    }

    return {
      ...document,
      navigation: {
        ...document.navigation,
        group: {
          routeId,
        },
      },
    };
  }

  private async prepareApplyBlueprintRequest(
    values: Record<string, any>,
    transaction?: any,
  ): Promise<FlowSurfaceApplyBlueprintProgram> {
    const initialDocument = prepareFlowSurfaceApplyBlueprintDocument(values);
    const document = await this.resolveApplyBlueprintCreateNavigationGroup(initialDocument, transaction);
    const replaceTarget =
      document.mode === 'replace' && document.target
        ? await this.resolveApplyBlueprintReplaceTargetInfo(document.target.pageSchemaUid, transaction)
        : undefined;
    if (
      document.mode === 'replace' &&
      document.tabs.length > 1 &&
      typeof document.page?.enableTabs === 'undefined' &&
      replaceTarget?.pageEnableTabs === false
    ) {
      throwBadRequest(
        `flowSurfaces applyBlueprint replace mode requires page.enableTabs=true when tabs.length > 1 and the current page has enableTabs=false`,
      );
    }
    return compileFlowSurfaceApplyBlueprintRequest(document, {
      replaceTarget,
    });
  }

  async applyBlueprint(values: Record<string, any>, options: { transaction?: any } = {}) {
    const prepared = await this.prepareApplyBlueprintRequest(values, options.transaction);
    const result = await executeInternalPlan(
      {
        surface: prepared.surface,
        plan: {
          steps: prepared.steps,
        },
      },
      this.buildPlanningRuntimeDeps(),
      options,
    );
    const pageLocator = resolveApplyBlueprintPageLocator(prepared, result);
    const surface = await this.get(pageLocator, options);

    return {
      version: '1',
      mode: prepared.document.mode,
      target: buildDefinedPayload({
        pageSchemaUid: pageLocator.pageSchemaUid,
        pageUid: surface?.target?.uid,
      }),
      surface,
    };
  }

  private resolveTemplateResourceInfo(input: FlowSurfaceTemplateResourceInfo): FlowSurfaceTemplateResourceInfo {
    return resolveTemplateResourceInfo(input, {
      getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
    });
  }

  private resolveBlockTemplateExpectedResourceInfo(node: any): FlowSurfaceTemplateResourceInfo {
    return resolveBlockTemplateExpectedResourceInfo(node, {
      resolveTemplateResourceInfo: (input) => this.resolveTemplateResourceInfo(input),
    });
  }

  private getTemplateResourceCompatibilityDisabledReason(
    template: FlowSurfaceTemplateRow,
    expected: FlowSurfaceTemplateResourceInfo,
    options: {
      associationMatch?: 'none' | 'exactIfTemplateHasAssociationName' | 'associationResourceOnly';
      checkResource?: boolean;
    } = {},
  ) {
    return getTemplateResourceCompatibilityDisabledReason(template, expected, {
      ...options,
      resolveTemplateResourceInfo: (input) => this.resolveTemplateResourceInfo(input),
    });
  }

  private getFieldsTemplateDisabledReason(hostBlock: any, template: FlowSurfaceTemplateRow) {
    if (!areFlowTemplateRootUsesCompatible(hostBlock?.use, template?.useModel)) {
      return `requires root use compatible with '${template?.useModel || 'unknown'}', got '${
        hostBlock?.use || 'unknown'
      }'`;
    }
    return this.getTemplateResourceCompatibilityDisabledReason(
      template,
      this.resolveBlockTemplateExpectedResourceInfo(hostBlock),
    );
  }

  private async assertFieldsTemplateCompatibility(
    actionName: string,
    hostBlock: any,
    template: FlowSurfaceTemplateRow,
  ) {
    const disabledReason = this.getFieldsTemplateDisabledReason(hostBlock, template);
    if (!disabledReason) {
      return;
    }
    throwBadRequest(
      `flowSurfaces ${actionName} fields template '${template.uid}' ${disabledReason}`,
      disabledReason.startsWith('requires root use compatible')
        ? 'FLOW_SURFACE_TEMPLATE_FIELDS_USE_MISMATCH'
        : 'FLOW_SURFACE_TEMPLATE_FIELDS_RESOURCE_MISMATCH',
    );
  }

  private async loadTemplateListTargetContext(
    target: FlowSurfaceWriteTarget,
    transaction?: any,
  ): Promise<FlowSurfaceTemplateListTargetContext> {
    const resolved = await this.locator.resolve(target, { transaction });
    const node = await this.loadResolvedNode(resolved, transaction);
    const resourceContext = await this.locator.resolveCollectionContext(node.uid, transaction).catch(() => null);
    const fieldContainer = await this.surfaceContext.resolveFieldContainer(node.uid, transaction).catch(() => null);
    const fieldHostBlock =
      fieldContainer?.ownerUid && fieldContainer.ownerUid !== node.uid
        ? await this.repository
            .findModelById(fieldContainer.ownerUid, {
              transaction,
              includeAsyncNode: true,
            })
            .catch(() => null)
        : fieldContainer?.ownerUid === node.uid
          ? node
          : null;
    const popupProfile =
      node?.uid && (POPUP_ACTION_USES.has(node.use) || this.isPopupFieldHostUse(node.use))
        ? await this.resolvePopupBlockProfile(node.uid, resolved, node, transaction).catch(() => null)
        : null;

    return {
      target,
      resolved,
      node,
      resourceContext,
      fieldContainer,
      fieldHostBlock,
      popupProfile,
    };
  }

  private inferTemplateListCurrentRecordCapability(node: any): boolean | undefined {
    const use = String(node?.use || '').trim();
    if (!use) {
      return undefined;
    }
    if (DETAILS_BLOCK_USES.has(use) || RECORD_CONTEXT_OWNER_USES.has(use)) {
      return true;
    }
    if (['ListItemModel', 'GridCardItemModel'].includes(use)) {
      return true;
    }
    if (['FilterFormBlockModel', 'ActionPanelBlockModel'].includes(use)) {
      return false;
    }
    return undefined;
  }

  private normalizeOptionalTemplateListActionType(actionType: any) {
    if (_.isUndefined(actionType) || _.isNull(actionType) || String(actionType).trim() === '') {
      return undefined;
    }
    return String(actionType).trim();
  }

  private normalizeOptionalTemplateListActionScope(actionScope: any) {
    const normalized = normalizeActionScope(actionScope);
    if (!normalized) {
      return undefined;
    }
    if (normalized !== 'block' && normalized !== 'record') {
      throwBadRequest(
        `flowSurfaces listTemplates actionScope only supports 'block' or 'record'`,
        'FLOW_SURFACE_TEMPLATE_ACTION_SCOPE_UNSUPPORTED',
      );
    }
    return normalized;
  }

  private assertTemplateListPopupActionScopeSupported(
    targetContext: FlowSurfaceTemplateListTargetContext | undefined,
    actionScope: 'block' | 'record',
  ) {
    const targetUse = String(targetContext?.node?.use || '').trim();
    if (!targetUse) {
      return;
    }
    const targetContainerScope = getActionContainerScope(targetUse);
    if (actionScope === 'record') {
      if (targetContainerScope === 'record' || getCatalogRecordActionContainerUse(targetUse)) {
        return;
      }
      throwBadRequest(
        `flowSurfaces listTemplates actionScope 'record' is not supported under '${targetUse}'`,
        'FLOW_SURFACE_TEMPLATE_ACTION_SCOPE_UNSUPPORTED',
      );
    }
    if (targetContainerScope === 'record') {
      throwBadRequest(
        `flowSurfaces listTemplates actionScope 'block' is not supported under '${targetUse}', use 'record'`,
        'FLOW_SURFACE_TEMPLATE_ACTION_SCOPE_UNSUPPORTED',
      );
    }
  }

  private resolveTemplateListPopupActionItem(
    targetContext: FlowSurfaceTemplateListTargetContext | undefined,
    actionType: string | undefined,
    actionScope?: 'block' | 'record',
  ) {
    const normalizedActionType = String(actionType || '').trim();
    const targetUse = String(targetContext?.node?.use || '').trim();
    if (!normalizedActionType || !targetUse) {
      return null;
    }
    if (actionScope) {
      this.assertTemplateListPopupActionScopeSupported(targetContext, actionScope);
    }

    const targetContainerScope = getActionContainerScope(targetUse);
    const recordContainerUse =
      targetContainerScope === 'record' ? targetUse : getCatalogRecordActionContainerUse(targetUse);
    const tryResolve = (containerUse?: string | null) =>
      containerUse
        ? this.tryResolveActionCatalogItem(
            {
              type: normalizedActionType,
              containerUse,
            },
            {
              context: 'listTemplates',
              requireCreateSupported: true,
            },
          )
        : null;

    let item =
      actionScope === 'record'
        ? tryResolve(recordContainerUse)
        : actionScope === 'block'
          ? tryResolve(targetUse)
          : tryResolve(targetUse) ||
            (recordContainerUse && recordContainerUse !== targetUse ? tryResolve(recordContainerUse) : null);

    if (!item) {
      if (actionScope === 'record') {
        if (!recordContainerUse) {
          throwBadRequest(
            `flowSurfaces listTemplates actionScope 'record' is not supported under '${targetUse}'`,
            'FLOW_SURFACE_TEMPLATE_ACTION_SCOPE_UNSUPPORTED',
          );
        }
        item = this.resolveAddRecordActionCatalogItem(
          {
            type: normalizedActionType,
            containerUse: recordContainerUse,
            ownerUse: targetUse,
          },
          undefined,
        );
      } else if (recordContainerUse && recordContainerUse !== targetUse) {
        item =
          this.tryResolveActionCatalogItem(
            {
              type: normalizedActionType,
              containerUse: recordContainerUse,
            },
            {
              context: 'listTemplates',
              requireCreateSupported: true,
            },
          ) ||
          this.resolveAddActionCatalogItem(
            {
              type: normalizedActionType,
              containerUse: targetUse,
            },
            undefined,
          );
      } else {
        item = this.resolveAddActionCatalogItem(
          {
            type: normalizedActionType,
            containerUse: targetUse,
          },
          undefined,
        );
      }
    }

    if (!POPUP_ACTION_USES.has(item.use)) {
      throwBadRequest(
        `flowSurfaces listTemplates actionType '${item.key}' does not support popup templates`,
        'FLOW_SURFACE_TEMPLATE_POPUP_ACTION_UNSUPPORTED',
      );
    }
    return item;
  }

  private resolveTemplateListPopupActionContext(values: {
    targetContext?: FlowSurfaceTemplateListTargetContext;
    actionType?: string;
    actionScope?: 'block' | 'record';
  }): FlowSurfaceTemplateListPopupActionContext | undefined {
    if (!values.actionType && !values.actionScope) {
      return undefined;
    }
    if (values.actionType) {
      const actionCatalogItem = this.resolveTemplateListPopupActionItem(
        values.targetContext,
        values.actionType,
        values.actionScope,
      );
      if (!actionCatalogItem) {
        return undefined;
      }
      return {
        hasCurrentRecord: actionCatalogItem.scope === 'record' || actionCatalogItem.scene === 'record',
      };
    }
    if (values.actionScope) {
      this.assertTemplateListPopupActionScopeSupported(values.targetContext, values.actionScope);
      return {
        hasCurrentRecord: values.actionScope === 'record',
      };
    }
    return undefined;
  }

  private getBlockTemplateDisabledReason(
    template: FlowSurfaceTemplateRow,
    targetContext?: FlowSurfaceTemplateListTargetContext,
  ) {
    const expectedAssociationName =
      String(targetContext?.resourceContext?.resourceInit?.associationName || '').trim() || undefined;
    return this.getTemplateResourceCompatibilityDisabledReason(
      template,
      {
        associationName: expectedAssociationName,
      },
      {
        checkResource: false,
        associationMatch: 'associationResourceOnly',
      },
    );
  }

  private async assertBlockTemplateCompatibility(
    actionName: string,
    target: FlowSurfaceWriteTarget,
    template: FlowSurfaceTemplateRow,
    transaction?: any,
  ) {
    const disabledReason = this.getBlockTemplateDisabledReason(
      template,
      await this.loadTemplateListTargetContext(target, transaction),
    );
    if (disabledReason) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${template.uid}' ${disabledReason}`,
        'FLOW_SURFACE_TEMPLATE_BLOCK_RESOURCE_MISMATCH',
      );
    }
  }

  private async getPopupTemplateDisabledReason(
    template: FlowSurfaceTemplateRow,
    targetContext?: FlowSurfaceTemplateListTargetContext,
    popupActionContext?: FlowSurfaceTemplateListPopupActionContext,
  ) {
    if (!targetContext?.node?.uid) {
      return undefined;
    }

    const popupProfile = targetContext.popupProfile;
    if (popupProfile?.isPopupSurface) {
      const resourceReason = this.getTemplateResourceCompatibilityDisabledReason(
        template,
        {
          dataSourceKey: popupProfile.dataSourceKey,
          collectionName: popupProfile.collectionName,
          associationName: popupProfile.associationName,
        },
        {
          associationMatch: 'exactIfTemplateHasAssociationName',
        },
      );
      if (resourceReason) {
        return resourceReason;
      }
      if (String(template.filterByTk || '').trim() && !popupProfile.hasCurrentRecord) {
        return buildTemplateMissingContextReason('filterByTk');
      }
      return undefined;
    }

    const expectedResourceInit = targetContext.resourceContext?.resourceInit || {};
    const resourceReason = this.getTemplateResourceCompatibilityDisabledReason(
      template,
      {
        dataSourceKey: String(expectedResourceInit.dataSourceKey || '').trim() || undefined,
        collectionName: String(expectedResourceInit.collectionName || '').trim() || undefined,
        associationName: String(expectedResourceInit.associationName || '').trim() || undefined,
      },
      {
        associationMatch: 'exactIfTemplateHasAssociationName',
      },
    );
    if (resourceReason) {
      return resourceReason;
    }
    const hasCurrentRecord =
      popupActionContext?.hasCurrentRecord ?? this.inferTemplateListCurrentRecordCapability(targetContext.node);
    if (String(template.filterByTk || '').trim() && hasCurrentRecord === false) {
      return buildTemplateMissingContextReason('filterByTk');
    }
    return undefined;
  }

  private async getTemplateListDisabledReason(
    template: FlowSurfaceTemplateRow,
    values: {
      requestedType?: 'block' | 'popup';
      requestedUsage?: 'block' | 'fields';
      targetContext?: FlowSurfaceTemplateListTargetContext;
      popupActionContext?: FlowSurfaceTemplateListPopupActionContext;
    },
  ) {
    const normalizedType = String(template?.type || '').trim() || 'block';
    if (values.requestedType === 'popup' || normalizedType === 'popup') {
      return this.getPopupTemplateDisabledReason(template, values.targetContext, values.popupActionContext);
    }
    if (values.requestedUsage === 'fields') {
      const hostBlock =
        values.targetContext?.fieldHostBlock ||
        (values.targetContext?.node?.uid && BLOCK_KEY_BY_USE.has(values.targetContext.node.use)
          ? values.targetContext.node
          : null);
      if (!hostBlock?.uid) {
        return undefined;
      }
      return this.getFieldsTemplateDisabledReason(hostBlock, template);
    }
    return this.getBlockTemplateDisabledReason(template, values.targetContext);
  }

  private async withTemplateAvailability(
    rows: FlowSurfaceTemplateRow[],
    values: {
      requestedType?: 'block' | 'popup';
      requestedUsage?: 'block' | 'fields';
      targetContext?: FlowSurfaceTemplateListTargetContext;
      popupActionContext?: FlowSurfaceTemplateListPopupActionContext;
    },
  ) {
    const shouldAnnotate = !!values.requestedType || !!values.requestedUsage || !!values.targetContext?.target?.uid;
    if (!shouldAnnotate) {
      return rows;
    }
    return Promise.all(
      rows.map(async (row) => {
        const disabledReason = await this.getTemplateListDisabledReason(row, values);
        return {
          ...row,
          available: !disabledReason,
          ...(disabledReason ? { disabledReason } : {}),
        } satisfies FlowSurfaceTemplateRow;
      }),
    );
  }

  private async assertPopupTemplateCompatibility(
    actionName: string,
    hostUid: string | undefined,
    template: FlowSurfaceTemplateRow,
    transaction?: any,
  ) {
    const normalizedHostUid = String(hostUid || '').trim();
    if (!normalizedHostUid) {
      return;
    }
    const hostNode = await this.repository.findModelById(normalizedHostUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!hostNode?.uid) {
      return;
    }

    const popupProfile = await this.resolvePopupBlockProfile(normalizedHostUid, null, hostNode, transaction).catch(
      () => null,
    );
    if (!popupProfile?.isPopupSurface) {
      return;
    }

    const disabledReason = await this.getPopupTemplateDisabledReason(template, {
      target: { uid: normalizedHostUid },
      resolved: {
        uid: normalizedHostUid,
        target: { uid: normalizedHostUid },
        kind: 'node',
      } as FlowSurfaceResolvedTarget,
      node: hostNode,
      popupProfile,
    });
    if (!disabledReason) {
      return;
    }
    throwBadRequest(
      `flowSurfaces ${actionName} popup template '${template.uid}' ${disabledReason}`,
      disabledReason.includes("parameter 'filterByTk'")
        ? 'FLOW_SURFACE_TEMPLATE_POPUP_CONTEXT_MISMATCH'
        : 'FLOW_SURFACE_TEMPLATE_POPUP_RESOURCE_MISMATCH',
    );
  }

  private normalizeOptionalFlowTemplateType(actionName: string, type: any) {
    if (_.isUndefined(type) || _.isNull(type) || String(type).trim() === '') {
      return undefined;
    }
    const normalizedType = String(type).trim();
    if (!FLOW_TEMPLATE_SUPPORTED_TYPES.has(normalizedType)) {
      throwBadRequest(
        `flowSurfaces ${actionName} type only supports 'block' or 'popup'`,
        'FLOW_SURFACE_TEMPLATE_TYPE_UNSUPPORTED',
      );
    }
    return normalizedType as 'block' | 'popup';
  }

  private async withFlowTemplateUsageCounts(
    rows: any[],
    actionName: string,
    options: { transaction?: any } = {},
  ): Promise<FlowSurfaceTemplateRow[]> {
    const data = rows.map((row) => toTemplatePlainRow(row)).filter(Boolean);
    const templateUids = data.map((row) => String(row?.uid || '').trim()).filter(Boolean);
    if (!templateUids.length) {
      return data;
    }
    const UsageModel = this.getFlowTemplateUsageModel(actionName);
    const usageRows = await UsageModel.findAll({
      attributes: ['templateUid', [UsageModel.sequelize.fn('COUNT', '*'), 'count']],
      where: {
        templateUid: templateUids,
      },
      group: ['templateUid'],
      raw: true,
      transaction: options.transaction,
    });
    const usageMap = new Map<string, number>();
    for (const row of usageRows as any[]) {
      usageMap.set(String(row.templateUid), Number(row.count) || 0);
    }
    return data.map((row) => ({
      ...row,
      usageCount: usageMap.get(String(row.uid || '')) || 0,
    }));
  }

  async listTemplates(
    values: FlowSurfaceTemplateListValues = {},
    options: { transaction?: any } = {},
  ): Promise<{
    rows: FlowSurfaceTemplateRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPage: number;
  }> {
    const repo = this.getFlowTemplateRepository('listTemplates');
    const requestedType =
      this.normalizeOptionalFlowTemplateType('listTemplates', values?.type) ||
      (!_.isUndefined(values?.usage) ? 'block' : undefined);
    const requestedUsage =
      _.isUndefined(values?.usage) || _.isNull(values?.usage) || String(values?.usage).trim() === ''
        ? undefined
        : this.normalizeFlowTemplateUsage('listTemplates', values?.usage);
    const requestedActionType = this.normalizeOptionalTemplateListActionType(values?.actionType);
    const requestedActionScope = this.normalizeOptionalTemplateListActionScope(values?.actionScope);
    if (requestedType === 'popup' && requestedUsage) {
      throwBadRequest(
        `flowSurfaces listTemplates usage is only supported when type='block'`,
        'FLOW_SURFACE_TEMPLATE_USAGE_UNSUPPORTED',
      );
    }
    if ((requestedActionType || requestedActionScope) && requestedType !== 'popup') {
      throwBadRequest(
        `flowSurfaces listTemplates actionType/actionScope are only supported when type='popup'`,
        'FLOW_SURFACE_TEMPLATE_POPUP_ACTION_UNSUPPORTED',
      );
    }
    const target = _.isUndefined(values?.target)
      ? undefined
      : this.normalizeWriteTarget('listTemplates', values?.target, values);
    const targetContext = target ? await this.loadTemplateListTargetContext(target, options.transaction) : undefined;
    const popupActionContext =
      requestedType === 'popup'
        ? this.resolveTemplateListPopupActionContext({
            targetContext,
            actionType: requestedActionType,
            actionScope: requestedActionScope,
          })
        : undefined;
    const filter = buildTemplateListFilter(values?.filter, values?.search, requestedType);
    const page = normalizeTemplatePage(values?.page);
    const pageSize = normalizeTemplatePageSize(values?.pageSize);
    const [rows, count] = await repo.findAndCount({
      filter,
      sort: values?.sort,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      transaction: options.transaction,
    });
    return {
      rows: await this.withTemplateAvailability(
        await this.withFlowTemplateUsageCounts(rows, 'listTemplates', options),
        {
          requestedType,
          requestedUsage,
          targetContext,
          popupActionContext,
        },
      ),
      count,
      page,
      pageSize,
      totalPage: Math.ceil(count / pageSize),
    };
  }

  async getTemplate(values: Record<string, any>, options: { transaction?: any } = {}) {
    const templateUid = normalizeTemplateUidValue('getTemplate', values || {});
    const template = await this.getFlowTemplateOrThrow('getTemplate', templateUid, {
      transaction: options.transaction,
    });
    const [row] = await this.withFlowTemplateUsageCounts([template], 'getTemplate', options);
    return row;
  }

  private async inferSaveTemplateTarget(actionName: string, node: any, transaction?: any) {
    const openViewStep = findFlowTemplateOpenViewStep(node);
    const openView = openViewStep?.openView || {};
    const popupTargetUid = String(openView.uid || '').trim();
    const popupPageUid = String(node?.subModels?.page?.uid || '').trim();
    const popupTemplateUid = String(openView.popupTemplateUid || '').trim();
    if (popupTargetUid || popupPageUid) {
      const sourceUse = String(node?.use || '').trim();
      if (!POPUP_ACTION_USES.has(sourceUse) && !this.isPopupFieldHostUse(sourceUse)) {
        throwBadRequest(
          `flowSurfaces ${actionName} target '${
            node?.uid || 'unknown'
          }' is not a supported popup action or field template source`,
          'FLOW_SURFACE_TEMPLATE_POPUP_SOURCE_UNSUPPORTED',
        );
      }
      if (popupTemplateUid) {
        throwBadRequest(
          `flowSurfaces ${actionName} target '${node.uid}' already uses a popup template; convert it to copy first`,
          'FLOW_SURFACE_TEMPLATE_SOURCE_ALREADY_TEMPLATED',
        );
      }
      const popupProfile = await this.resolvePopupBlockProfile(node.uid, null, node, transaction).catch(() => null);
      return {
        templateType: 'popup' as const,
        sourceUid: popupTargetUid || String(node.uid || '').trim(),
        useModel: String(node.use || '').trim() || undefined,
        dataSourceKey:
          String(openView.dataSourceKey || '').trim() || String(popupProfile?.dataSourceKey || '').trim() || undefined,
        collectionName:
          String(openView.collectionName || '').trim() ||
          String(popupProfile?.collectionName || '').trim() ||
          undefined,
        associationName:
          String(openView.associationName || '').trim() ||
          String(popupProfile?.associationName || '').trim() ||
          undefined,
        filterByTk:
          String(openView.filterByTk || '').trim() || String(popupProfile?.filterByTk || '').trim() || undefined,
        sourceId: String(openView.sourceId || '').trim() || String(popupProfile?.sourceId || '').trim() || undefined,
        openViewStep,
      };
    }

    const use = String(node?.use || '').trim();
    const parentUid = String(node?.parentId || '').trim();
    if (parentUid) {
      const parentNode = await this.repository.findModelById(parentUid, {
        transaction,
        includeAsyncNode: true,
      });
      if (parentNode?.use === 'ReferenceBlockModel') {
        throwBadRequest(
          `flowSurfaces ${actionName} target '${node.uid}' belongs to a referenced block; convert it to copy first`,
          'FLOW_SURFACE_TEMPLATE_SOURCE_ALREADY_TEMPLATED',
        );
      }
    }

    const referenceGrid = findFieldsTemplateReferenceGrid(node);
    const fieldsTemplateUid = String(
      _.get(referenceGrid, ['stepParams', 'referenceSettings', 'useTemplate', 'templateUid']) || '',
    ).trim();
    if (fieldsTemplateUid) {
      throwBadRequest(
        `flowSurfaces ${actionName} target '${node.uid}' already uses a fields template; convert it to copy first`,
        'FLOW_SURFACE_TEMPLATE_SOURCE_ALREADY_TEMPLATED',
      );
    }

    if (
      !BLOCK_KEY_BY_USE.has(use) ||
      use === 'ReferenceBlockModel' ||
      use === 'ReferenceFormGridModel' ||
      FLOW_TEMPLATE_UNSUPPORTED_BLOCK_TEMPLATE_SOURCE_USES.has(use)
    ) {
      throwBadRequest(
        `flowSurfaces ${actionName} target '${
          use || node?.uid || 'unknown'
        }' is not a supported block or popup template source`,
        'FLOW_SURFACE_TEMPLATE_SOURCE_UNSUPPORTED',
      );
    }

    const init = _.get(node, ['stepParams', 'resourceSettings', 'init']) || {};
    return {
      templateType: 'block' as const,
      sourceUid: String(node.uid || '').trim(),
      useModel: use || undefined,
      dataSourceKey: String(init.dataSourceKey || '').trim() || undefined,
      collectionName: String(init.collectionName || '').trim() || undefined,
      associationName: String(init.associationName || '').trim() || undefined,
      filterByTk: String(init.filterByTk || '').trim() || undefined,
      sourceId: String(init.sourceId || '').trim() || undefined,
      openViewStep: null,
    };
  }

  private createFlowTemplateReferenceBlockModel(
    currentNode: any,
    template: FlowSurfaceTemplateRow,
    templateTargetUid: string,
  ) {
    const init = buildDefinedPayload(_.get(currentNode, ['stepParams', 'resourceSettings', 'init']) || {});
    return {
      uid: currentNode.uid,
      use: 'ReferenceBlockModel',
      parentId: currentNode.parentId,
      subKey: currentNode.subKey,
      subType: currentNode.subType,
      stepParams: buildFlowTemplateReferenceBlockStepParams(template, templateTargetUid, init),
    };
  }

  private buildPopupTemplateReferenceOpenView(template: FlowSurfaceTemplateRow, templateTargetUid: string) {
    return this.buildPopupTemplateOpenView(template, 'reference', templateTargetUid);
  }

  private async clearFlowTemplateUsagesByModelUids(modelUids: Iterable<string>, transaction?: any) {
    const usageRepo = this.getFlowTemplateUsageRepositorySafe();
    if (!usageRepo) {
      return;
    }
    for (const modelUid of modelUids) {
      const normalizedModelUid = String(modelUid || '').trim();
      if (!normalizedModelUid) {
        continue;
      }
      await usageRepo.destroy({
        filter: { modelUid: normalizedModelUid },
        transaction,
      });
    }
  }

  private async clearFlowTemplateUsagesForNodeTree(nodeOrUid: any, transaction?: any) {
    const usageRepo = this.getFlowTemplateUsageRepositorySafe();
    if (!usageRepo) {
      return;
    }
    const modelUids =
      typeof nodeOrUid === 'string'
        ? new Set<string>(
            (
              await this.repository.findNodesById(nodeOrUid, {
                transaction,
                includeAsyncNode: true,
              })
            )
              .map((row: any) => String(row?.uid || '').trim())
              .filter(Boolean),
          )
        : collectFlowTemplateModelUids(nodeOrUid);
    if (!modelUids.size) {
      return;
    }
    await this.clearFlowTemplateUsagesByModelUids(modelUids, transaction);
  }

  private async syncFlowTemplateUsagesForNodeTree(rootUid: string, transaction?: any) {
    const usageRepo = this.getFlowTemplateUsageRepositorySafe();
    if (!usageRepo) {
      return;
    }
    const persistedNodes = await this.repository.findNodesById(rootUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!persistedNodes?.length) {
      return;
    }

    const usageMap = new Map<string, Set<string>>();
    const modelUids = new Set<string>();
    for (const row of persistedNodes as any[]) {
      const modelUid = String(row?.uid || '').trim();
      if (!modelUid) {
        continue;
      }
      modelUids.add(modelUid);
      collectFlowTemplateUsageMapFromModelOptions(modelUid, row?.options, usageMap);
    }
    await this.clearFlowTemplateUsagesByModelUids(modelUids, transaction);

    for (const [modelUid, templateUids] of usageMap.entries()) {
      for (const templateUid of templateUids) {
        await usageRepo.updateOrCreate({
          filterKeys: ['templateUid', 'modelUid'],
          values: {
            uid: uid(),
            templateUid,
            modelUid,
          },
          transaction,
          context: {
            disableAfterDestroy: true,
          },
        });
      }
    }
  }

  private async clearFlowTemplateUsagesForRouteSchemaUid(schemaUid: string, transaction?: any) {
    const normalizedSchemaUid = String(schemaUid || '').trim();
    if (!normalizedSchemaUid) {
      return;
    }
    const anchorNode = await this.repository.findModelById(normalizedSchemaUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (anchorNode?.uid) {
      await this.clearFlowTemplateUsagesForNodeTree(anchorNode, transaction);
    }
    const asyncGridChild = await this.repository.findModelByParentId(normalizedSchemaUid, {
      transaction,
      subKey: 'grid',
      includeAsyncNode: true,
    });
    if (asyncGridChild?.uid) {
      await this.clearFlowTemplateUsagesForNodeTree(asyncGridChild, transaction);
    }
  }

  private async syncTemplateMetaToReferencedModels(template: FlowSurfaceTemplateRow, transaction?: any) {
    const usageRepo = this.getFlowTemplateUsageRepositorySafe();
    if (!usageRepo || !template?.uid) {
      return;
    }
    const usageRows = await usageRepo.find({
      filter: { templateUid: template.uid },
      fields: ['modelUid'],
      transaction,
    });
    const modelUids = _.uniq(
      usageRows.map((row: any) => String(row?.get?.('modelUid') || row?.modelUid || '').trim()).filter(Boolean),
    ) as string[];

    for (const modelUid of modelUids) {
      const model = await this.repository.findOne({
        filter: { uid: modelUid },
        transaction,
      });
      if (!model) {
        continue;
      }
      const options = FlowModelRepository.optionsToJson(model.get('options') || model.options || {});
      const useTemplate = _.get(options, ['stepParams', 'referenceSettings', 'useTemplate']);
      if (!useTemplate || String(useTemplate.templateUid || '').trim() !== template.uid) {
        continue;
      }
      const nextOptions = _.cloneDeep(options);
      _.set(nextOptions, ['stepParams', 'referenceSettings', 'useTemplate'], {
        ...useTemplate,
        templateName: template.name,
        templateDescription: template.description,
        targetUid: template.targetUid || useTemplate.targetUid,
      });
      await this.db.getRepository('flowModels').update({
        filterByTk: modelUid,
        values: {
          options: nextOptions,
        },
        transaction,
      });
    }
  }

  private resolveFlowModelAttachPosition(node: any, parentNode: any) {
    if (!node?.uid || !parentNode?.uid || node?.subType !== 'array' || !node?.subKey) {
      return undefined;
    }
    const siblings = _.castArray(parentNode?.subModels?.[node.subKey] || []).filter((item: any) => item?.uid);
    const currentIndex = siblings.findIndex((item: any) => item.uid === node.uid);
    if (currentIndex < 0) {
      return undefined;
    }
    const nextSibling = siblings.slice(currentIndex + 1).find((item: any) => item?.uid);
    if (nextSibling?.uid) {
      return {
        type: 'before' as const,
        target: nextSibling.uid,
      };
    }
    const previousSibling = siblings
      .slice(0, currentIndex)
      .reverse()
      .find((item: any) => item?.uid);
    if (previousSibling?.uid) {
      return {
        type: 'after' as const,
        target: previousSibling.uid,
      };
    }
    return undefined;
  }

  private async repositionFlowModelInParent(node: any, parentNode: any, transaction?: any) {
    const position = this.resolveFlowModelAttachPosition(node, parentNode);
    if (!position || !node?.uid || !node?.parentId || !node?.subKey || !node?.subType) {
      return;
    }
    await this.repository.attach(
      node.uid,
      {
        parentId: node.parentId,
        subKey: node.subKey,
        subType: node.subType,
        position,
      },
      { transaction },
    );
  }

  private async convertBlockSourceToTemplateReference(
    sourceNode: any,
    template: FlowSurfaceTemplateRow,
    templateTargetUid: string,
    transaction?: any,
  ) {
    if (!sourceNode?.uid || !sourceNode?.parentId || !sourceNode?.subKey || !sourceNode?.subType) {
      throwBadRequest(
        `flowSurfaces saveTemplate target '${sourceNode?.uid || 'unknown'}' cannot be converted in place`,
        'FLOW_SURFACE_TEMPLATE_CONVERT_TARGET_INVALID',
      );
    }
    const parentNode = await this.repository.findModelById(sourceNode.parentId, {
      transaction,
      includeAsyncNode: true,
    });
    await this.clearFlowTemplateUsagesForNodeTree(sourceNode, transaction);
    await this.repository.remove(sourceNode.uid, { transaction });
    await this.repository.upsertModel(
      this.createFlowTemplateReferenceBlockModel(sourceNode, template, templateTargetUid),
      {
        transaction,
      },
    );
    await this.repositionFlowModelInParent(sourceNode, parentNode, transaction);
    await this.syncFlowTemplateUsagesForNodeTree(sourceNode.uid, transaction);
    return {
      uid: sourceNode.uid,
      type: 'block' as const,
    };
  }

  private async convertPopupSourceToTemplateReference(
    sourceNode: any,
    openViewStep: { flowKey: string; stepKey: string; openView: Record<string, any> },
    template: FlowSurfaceTemplateRow,
    templateTargetUid: string,
    transaction?: any,
  ) {
    if (!sourceNode?.uid || !openViewStep) {
      throwBadRequest(
        `flowSurfaces saveTemplate target '${
          sourceNode?.uid || 'unknown'
        }' cannot be converted to popup template reference`,
        'FLOW_SURFACE_TEMPLATE_CONVERT_TARGET_INVALID',
      );
    }
    const nextStepParams = _.cloneDeep(sourceNode.stepParams || {});
    const currentGroup = _.isPlainObject(nextStepParams[openViewStep.flowKey])
      ? _.cloneDeep(nextStepParams[openViewStep.flowKey])
      : {};
    currentGroup[openViewStep.stepKey] = {
      ..._.omit(openViewStep.openView || {}, [
        'popupTemplateUid',
        'popupTemplateMode',
        'popupTemplateContext',
        'popupTemplateHasFilterByTk',
        'popupTemplateHasSourceId',
      ]),
      ...this.buildPopupTemplateReferenceOpenView(template, templateTargetUid),
    };
    nextStepParams[openViewStep.flowKey] = currentGroup;
    await this.cleanupLocalPopupSurfaceForHost(sourceNode.uid, transaction, sourceNode);
    await this.repository.patch(
      {
        uid: sourceNode.uid,
        stepParams: nextStepParams,
      },
      { transaction },
    );
    await this.syncFlowTemplateUsagesForNodeTree(sourceNode.uid, transaction);
    return {
      uid: sourceNode.uid,
      type: 'popup' as const,
    };
  }

  async saveTemplate(values: Record<string, any>, options: { transaction?: any } = {}) {
    const templateRepo = this.getFlowTemplateRepository('saveTemplate');
    const name = normalizeRequiredTemplateString('saveTemplate', values?.name, 'name');
    const description = normalizeRequiredTemplateString('saveTemplate', values?.description, 'description');
    const saveMode = normalizeTemplateSaveMode('saveTemplate', values?.saveMode);
    const target = this.normalizeWriteTarget('saveTemplate', values?.target, values);
    const sourceNode = await this.repository.findModelById(target.uid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!sourceNode?.uid) {
      throwBadRequest(
        `flowSurfaces saveTemplate target '${target.uid}' does not exist`,
        'FLOW_SURFACE_TEMPLATE_SOURCE_NOT_FOUND',
      );
    }

    const inferred = await this.inferSaveTemplateTarget('saveTemplate', sourceNode, options.transaction);
    const duplicatedTarget = await this.duplicateDetachedFlowModelTree(
      'saveTemplate',
      inferred.sourceUid,
      options.transaction,
    );
    const templateTargetUid = String(duplicatedTarget?.uid || '').trim();
    if (!templateTargetUid) {
      throwConflict(
        `flowSurfaces saveTemplate failed to duplicate target '${inferred.sourceUid}'`,
        'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
      );
    }
    if (inferred.templateType === 'popup') {
      await this.ensurePopupSurface(templateTargetUid, options.transaction);
    }

    const templateUid = String(values?.uid || uid()).trim() || uid();
    await templateRepo.create({
      values: buildDefinedPayload({
        uid: templateUid,
        name,
        description,
        targetUid: templateTargetUid,
        useModel: inferred.useModel,
        type: inferred.templateType,
        dataSourceKey: inferred.dataSourceKey,
        collectionName: inferred.collectionName,
        associationName: inferred.associationName,
        filterByTk: inferred.filterByTk,
        sourceId: inferred.sourceId,
      }),
      transaction: options.transaction,
    });
    await this.syncFlowTemplateUsagesForNodeTree(templateTargetUid, options.transaction);

    if (saveMode === 'convert') {
      const template = {
        uid: templateUid,
        name,
        description,
        targetUid: templateTargetUid,
        useModel: inferred.useModel,
        type: inferred.templateType,
        dataSourceKey: inferred.dataSourceKey,
        collectionName: inferred.collectionName,
        associationName: inferred.associationName,
        filterByTk: inferred.filterByTk,
        sourceId: inferred.sourceId,
      } satisfies FlowSurfaceTemplateRow;

      if (inferred.templateType === 'popup') {
        await this.convertPopupSourceToTemplateReference(
          sourceNode,
          inferred.openViewStep,
          template,
          templateTargetUid,
          options.transaction,
        );
      } else {
        await this.convertBlockSourceToTemplateReference(sourceNode, template, templateTargetUid, options.transaction);
      }
    }

    return this.getTemplate(
      {
        filterByTk: templateUid,
      },
      options,
    );
  }

  async updateTemplate(values: Record<string, any>, options: { transaction?: any } = {}) {
    const templateRepo = this.getFlowTemplateRepository('updateTemplate');
    const templateUid = normalizeTemplateUidValue('updateTemplate', values || {});
    const name = normalizeRequiredTemplateString('updateTemplate', values?.name, 'name');
    const description = normalizeRequiredTemplateString('updateTemplate', values?.description, 'description');

    await templateRepo.update({
      filterByTk: templateUid,
      values: {
        name,
        description,
      },
      transaction: options.transaction,
    });

    const template = await this.getTemplate(
      {
        filterByTk: templateUid,
      },
      options,
    );
    await this.syncTemplateMetaToReferencedModels(template as FlowSurfaceTemplateRow, options.transaction);
    return template;
  }

  async destroyTemplate(values: Record<string, any>, options: { transaction?: any } = {}) {
    const templateRepo = this.getFlowTemplateRepository('destroyTemplate');
    const usageRepo = this.getFlowTemplateUsageRepository('destroyTemplate');
    const templateUid = normalizeTemplateUidValue('destroyTemplate', values || {});
    const template = await this.getFlowTemplateOrThrow('destroyTemplate', templateUid, {
      transaction: options.transaction,
    });
    const usageCount = await usageRepo.count({
      filter: { templateUid },
      transaction: options.transaction,
    });
    if (usageCount > 0) {
      throwBadRequest(
        `flowSurfaces destroyTemplate template '${templateUid}' is still in use (${usageCount})`,
        'FLOW_SURFACE_TEMPLATE_IN_USE',
      );
    }
    if (template.targetUid) {
      await this.removeNodeTreeWithBindings(template.targetUid, options.transaction);
    }
    await templateRepo.destroy({
      filterByTk: templateUid,
      transaction: options.transaction,
    });
    await usageRepo.destroy({
      filter: { templateUid },
      transaction: options.transaction,
    });
    return {
      uid: templateUid,
    };
  }

  private async resolveTemplateCopySource(
    actionName: string,
    node: any,
    transaction?: any,
  ): Promise<
    | {
        type: 'block';
        template: FlowSurfaceTemplateRow;
        targetUid: string;
      }
    | {
        type: 'fields';
        template: FlowSurfaceTemplateRow;
        blockUid: string;
      }
    | {
        type: 'popup';
        template: FlowSurfaceTemplateRow;
        openViewStep: { flowKey: string; stepKey: string; openView: Record<string, any> };
      }
  > {
    const useTemplate = _.get(node, ['stepParams', 'referenceSettings', 'useTemplate']);
    const templateUid = String(useTemplate?.templateUid || '').trim();

    if (node?.use === 'ReferenceBlockModel' && templateUid) {
      const template = await this.getFlowTemplateOrThrow(actionName, templateUid, {
        transaction,
        expectedType: 'block',
      });
      const targetUid = String(useTemplate?.targetUid || template.targetUid || '').trim();
      if (!targetUid) {
        throwBadRequest(
          `flowSurfaces ${actionName} target '${node.uid}' is missing template targetUid`,
          'FLOW_SURFACE_TEMPLATE_TARGET_MISSING',
        );
      }
      return {
        type: 'block',
        template,
        targetUid,
      };
    }

    if (node?.use === 'ReferenceFormGridModel' && templateUid) {
      const template = await this.getFlowTemplateOrThrow(actionName, templateUid, {
        transaction,
        expectedType: 'block',
      });
      return {
        type: 'fields',
        template,
        blockUid: String(node.parentId || '').trim(),
      };
    }

    const referenceGrid = findFieldsTemplateReferenceGrid(node);
    const referenceGridTemplateUid = String(
      _.get(referenceGrid, ['stepParams', 'referenceSettings', 'useTemplate', 'templateUid']) || '',
    ).trim();
    if (referenceGrid?.use === 'ReferenceFormGridModel' && referenceGridTemplateUid) {
      const template = await this.getFlowTemplateOrThrow(actionName, referenceGridTemplateUid, {
        transaction,
        expectedType: 'block',
      });
      return {
        type: 'fields',
        template,
        blockUid: String(node.uid || '').trim(),
      };
    }

    const openViewStep = findFlowTemplateOpenViewStep(node);
    const popupTemplateUid = String(openViewStep?.openView?.popupTemplateUid || '').trim();
    if (popupTemplateUid) {
      const template = await this.getFlowTemplateOrThrow(actionName, popupTemplateUid, {
        transaction,
        expectedType: 'popup',
      });
      return {
        type: 'popup',
        template,
        openViewStep,
      };
    }

    throwBadRequest(
      `flowSurfaces ${actionName} target '${node?.uid || 'unknown'}' is not using a template reference`,
      'FLOW_SURFACE_TEMPLATE_REFERENCE_REQUIRED',
    );
  }

  private async duplicateDetachedFlowModelTree(actionName: string, rootUid: string, transaction?: any) {
    const duplicatedTree = await this.cloneFlowModelTree(actionName, rootUid, { transaction });
    await this.repository.upsertModel(duplicatedTree, {
      transaction,
    });
    return this.repository.findModelById(String(duplicatedTree.uid || '').trim(), {
      transaction,
      includeAsyncNode: true,
    });
  }

  private async cloneFlowModelTree(
    actionName: string,
    rootUid: string,
    options: {
      transaction?: any;
      uidMap?: Record<string, string>;
    } = {},
  ) {
    const sourceNode = await this.repository.findModelById(rootUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!sourceNode?.uid) {
      throwBadRequest(
        `flowSurfaces ${actionName} source '${rootUid}' does not exist`,
        'FLOW_SURFACE_TEMPLATE_SOURCE_NOT_FOUND',
      );
    }
    const uidMap = {
      ...Object.fromEntries(Array.from(collectFlowTemplateModelUids(sourceNode)).map((modelUid) => [modelUid, uid()])),
      ...(options.uidMap || {}),
    } as Record<string, string>;
    const duplicatedTree = replaceFlowModelTreeUids(sourceNode, uidMap);
    this.stripInternalSurfaceMetaFromNodeTree(duplicatedTree);
    delete duplicatedTree.parent;
    delete duplicatedTree.parentId;
    delete duplicatedTree.subKey;
    delete duplicatedTree.subType;
    return duplicatedTree;
  }

  async convertTemplateToCopy(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('convertTemplateToCopy', values?.target, values);
    const node = await this.repository.findModelById(target.uid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!node?.uid) {
      throwBadRequest(
        `flowSurfaces convertTemplateToCopy target '${target.uid}' does not exist`,
        'FLOW_SURFACE_TEMPLATE_REFERENCE_REQUIRED',
      );
    }

    const resolved = await this.resolveTemplateCopySource('convertTemplateToCopy', node, options.transaction);

    if (resolved.type === 'popup') {
      const duplicatedPopup = await this.duplicateDetachedFlowModelTree(
        'convertTemplateToCopy',
        resolved.template.targetUid || '',
        options.transaction,
      );
      const popupUid = String(duplicatedPopup?.uid || '').trim();
      if (!popupUid) {
        throwConflict(
          `flowSurfaces convertTemplateToCopy failed to duplicate popup template '${resolved.template.uid}'`,
          'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
        );
      }
      await this.ensurePopupSurface(popupUid, options.transaction);
      const nextStepParams = _.cloneDeep(node.stepParams || {});
      const currentGroup = _.isPlainObject(nextStepParams[resolved.openViewStep.flowKey])
        ? _.cloneDeep(nextStepParams[resolved.openViewStep.flowKey])
        : {};
      currentGroup[resolved.openViewStep.stepKey] = {
        ..._.omit(resolved.openViewStep.openView || {}, [
          'popupTemplateUid',
          'popupTemplateMode',
          'popupTemplateContext',
          'popupTemplateHasFilterByTk',
          'popupTemplateHasSourceId',
        ]),
        ...this.buildPopupTemplateOpenView(resolved.template, 'copy', popupUid),
      };
      nextStepParams[resolved.openViewStep.flowKey] = currentGroup;
      await this.cleanupLocalPopupSurfaceForHost(node.uid, options.transaction, node);
      await this.repository.patch(
        {
          uid: node.uid,
          stepParams: nextStepParams,
        },
        { transaction: options.transaction },
      );
      await this.syncFlowTemplateUsagesForNodeTree(node.uid, options.transaction);
      return {
        uid: node.uid,
        type: 'popup',
        popupUid,
      };
    }

    if (resolved.type === 'fields') {
      const result = await this.applyTemplateFieldsToBlock(
        'convertTemplateToCopy',
        resolved.blockUid,
        resolved.template,
        'copy',
        options,
      );
      return {
        uid: resolved.blockUid,
        type: 'fields',
        ...result,
      };
    }

    const clonedBlock = await this.cloneFlowModelTree('convertTemplateToCopy', resolved.targetUid, {
      transaction: options.transaction,
      uidMap: {
        [resolved.targetUid]: node.uid,
      },
    });
    if (!clonedBlock?.uid) {
      throwConflict(
        `flowSurfaces convertTemplateToCopy failed to duplicate template '${resolved.template.uid}'`,
        'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
      );
    }
    const parentNode = node.parentId
      ? await this.repository.findModelById(node.parentId, {
          transaction: options.transaction,
          includeAsyncNode: true,
        })
      : null;
    await this.clearFlowTemplateUsagesForNodeTree(node, options.transaction);
    await this.repository.remove(node.uid, { transaction: options.transaction });
    await this.repository.upsertModel(
      {
        ...clonedBlock,
        parentId: node.parentId,
        subKey: node.subKey,
        subType: node.subType,
      },
      { transaction: options.transaction },
    );
    await this.repositionFlowModelInParent(node, parentNode, options.transaction);
    await this.syncFlowTemplateUsagesForNodeTree(node.uid, options.transaction);
    return {
      uid: node.uid,
      type: 'block',
    };
  }

  private async buildPopupSurfaceSummaryFromHost(
    hostNode: any,
    mode: 'local' | 'copy' | 'reference' = 'local',
    transaction?: any,
  ) {
    if (!hostNode?.uid) {
      return undefined;
    }
    const popupPage =
      hostNode?.subModels?.page ||
      (await this.repository.findModelByParentId(hostNode.uid, {
        transaction,
        subKey: 'page',
        includeAsyncNode: true,
      }));
    const popupTab =
      _.castArray(popupPage?.subModels?.tabs || [])[0] ||
      (popupPage?.uid
        ? await this.repository.findModelByParentId(popupPage.uid, {
            transaction,
            subKey: 'tabs',
            includeAsyncNode: true,
          })
        : undefined);
    const popupGrid =
      popupTab?.subModels?.grid ||
      (popupTab?.uid
        ? await this.repository.findModelByParentId(popupTab.uid, {
            transaction,
            subKey: 'grid',
            includeAsyncNode: true,
          })
        : undefined);
    const summary = buildDefinedPayload({
      mode,
      pageUid: popupPage?.uid,
      tabUid: popupTab?.uid,
      gridUid: popupGrid?.uid,
    });
    return Object.keys(summary).length ? summary : undefined;
  }

  private async decorateTemplateReadbackTree(node: any, transaction?: any): Promise<any> {
    if (!node || typeof node !== 'object') {
      return node;
    }

    const blockTemplate = _.get(node, ['stepParams', 'referenceSettings', 'useTemplate']);
    const blockTemplateUid = String(blockTemplate?.templateUid || '').trim();
    const blockTemplateMode = String(blockTemplate?.mode || 'reference').trim() || 'reference';
    if (blockTemplateUid && blockTemplateMode !== 'copy') {
      node.template = {
        uid: blockTemplateUid,
        mode: blockTemplateMode,
      };
      stripTemplateInternalReferenceSettings(node);
    }

    const gridNode = findFieldsTemplateReferenceGrid(node);
    const fieldsTemplate = _.get(gridNode, ['stepParams', 'referenceSettings', 'useTemplate']);
    const fieldsTemplateUid = String(fieldsTemplate?.templateUid || '').trim();
    const fieldsTemplateMode = String(fieldsTemplate?.mode || 'reference').trim() || 'reference';
    if (fieldsTemplateUid && gridNode?.use === 'ReferenceFormGridModel' && fieldsTemplateMode !== 'copy') {
      node.fieldsTemplate = {
        uid: fieldsTemplateUid,
        mode: fieldsTemplateMode,
      };
      stripTemplateInternalReferenceSettings(gridNode);
    }

    const popupGroups: Array<[string, any]> = [
      ['popupSettings', _.get(node, ['stepParams', 'popupSettings'])],
      ['selectExitRecordSettings', _.get(node, ['stepParams', 'selectExitRecordSettings'])],
    ];
    let popupSummary = await this.buildPopupSurfaceSummaryFromHost(node, 'local', transaction);
    for (const [groupKey, popupSettings] of popupGroups) {
      if (!popupSettings || typeof popupSettings !== 'object') {
        continue;
      }
      for (const [openViewKey, value] of Object.entries(popupSettings)) {
        const popupTemplateUid = String((value as any)?.popupTemplateUid || '').trim();
        const popupTemplateMode = String((value as any)?.popupTemplateMode || 'reference').trim() || 'reference';
        const popupTemplateContext = !!(value as any)?.popupTemplateContext;
        const externalPopupHostUid = this.resolveExternalPopupHostUid(node.uid, value);
        if (popupTemplateUid && popupTemplateMode !== 'copy') {
          popupSummary = {
            template: {
              uid: popupTemplateUid,
              mode: popupTemplateMode as 'reference' | 'copy',
            },
          };
        } else if (popupTemplateContext && externalPopupHostUid) {
          const copiedPopupHost = await this.repository.findModelById(externalPopupHostUid, {
            transaction,
            includeAsyncNode: true,
          });
          popupSummary = (await this.buildPopupSurfaceSummaryFromHost(copiedPopupHost, 'copy', transaction)) || {
            mode: 'copy',
          };
        }
        popupSettings[openViewKey] = stripTemplateInternalOpenViewFields(value);
      }
      if (_.isPlainObject(node?.stepParams?.[groupKey]) && !Object.keys(node.stepParams[groupKey]).length) {
        delete node.stepParams[groupKey];
      }
    }
    if (_.isPlainObject(node.stepParams) && !Object.keys(node.stepParams).length) {
      delete node.stepParams;
    }
    if (popupSummary && Object.keys(popupSummary).length) {
      node.popup = popupSummary;
    }

    for (const value of Object.values(node.subModels || {})) {
      for (const child of _.castArray(value as any)) {
        await this.decorateTemplateReadbackTree(child, transaction);
      }
    }

    return node;
  }

  async compose(
    values: FlowSurfaceComposeValues,
    options: { transaction?: any; enabledPackages?: ReadonlySet<string> } = {},
  ) {
    const target = this.normalizeWriteTarget('compose', values?.target, values);
    const mode = this.assertComposeMode(values?.mode);
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const normalizedBlocks = this.normalizeComposeBlocks(values?.blocks, enabledPackages);
    const blockParent = await this.surfaceContext.resolveBlockParent(target, options.transaction);
    const gridUid = blockParent.parentUid;
    const initialGrid = await this.repository.findModelById(gridUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const existingItems = _.castArray(initialGrid?.subModels?.items || []).filter((item: any) => item?.uid);

    for (const blockSpec of normalizedBlocks) {
      if (!blockSpec.template && blockSpec.resource?.kind !== 'semantic') {
        this.assertRequiredBlockResourceInit({
          actionName: 'compose',
          blockCatalogItem: blockSpec.catalogItem,
          resourceInit: blockSpec.resource?.kind === 'raw' ? blockSpec.resource.value : {},
          resourceField: 'resource',
          blockDescriptor: this.describeComposeBlock(blockSpec),
        });
      }
    }

    const plan = compileComposeExecutionPlan({
      gridUid,
      mode,
      normalizedBlocks,
      existingItemUids: existingItems.map((item: any) => item.uid),
      layout: values.layout,
    });

    return executeComposeRuntime(plan, {
      removeExistingItem: async (uid) => this.removeNodeTreeWithBindings(uid, options.transaction),
      createBlock: async (payload) =>
        this.addBlock(payload, {
          ...options,
          deferAutoLayout: true,
          enabledPackages,
        }),
      applyNodeSettings: async (actionName, targetUid, settings) => {
        if (!targetUid) {
          return;
        }
        await this.applyInlineNodeSettings(actionName, targetUid, settings, options);
      },
      createField: async (payload) => this.addField(payload, options),
      applyFieldSettings: async (actionName, fieldResult, settings) =>
        this.applyInlineFieldSettings(actionName, fieldResult, settings, options),
      createAction: async (payload) =>
        this.addAction(payload, {
          ...options,
          enabledPackages,
          autoCompleteDefaultPopup: false,
        }),
      createRecordAction: async (payload) =>
        this.addRecordAction(payload, {
          ...options,
          enabledPackages,
          autoCompleteDefaultPopup: false,
        }),
      applyActionPopup: async (actionName, actionUid, popup) =>
        this.applyInlineActionPopup(actionName, actionUid, popup, options),
      collectActionKeys: async (actionUid) => this.collectComposeActionKeys(actionUid, options.transaction),
      buildExplicitLayoutPayload: async (input) => {
        const finalGrid = await this.repository.findModelById(input.gridUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        });
        const finalItems = _.castArray(finalGrid?.subModels?.items || []).filter((item: any) => item?.uid);
        return this.buildComposeLayoutPayload({
          layout: input.layout,
          createdByKey: input.createdByKey,
          finalItems,
        });
      },
      buildAppendLayoutPayload: async (input) => {
        const finalGrid = await this.repository.findModelById(input.gridUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        });
        return this.buildAppendGridLayoutPayload({
          initialGrid,
          finalGrid,
          appendedItemUids: input.appendedItemUids,
        });
      },
      setLayout: async (payload) => this.setLayout(payload, options),
    });
  }

  async configure(values: FlowSurfaceConfigureValues, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('configure', values?.target, values);
    if (!_.isPlainObject(values.changes) || !Object.keys(values.changes).length) {
      throwBadRequest('flowSurfaces configure requires a non-empty changes object');
    }
    ensureNoRawSimpleChangeKeys(values.changes);

    const resolved = await this.locator.resolve(target, options);
    const current = await this.loadResolvedNode(resolved, options.transaction);

    if (resolved.kind === 'page' && resolved.pageRoute) {
      return this.configurePage(target, values.changes, options);
    }
    if (resolved.kind === 'tab' && resolved.tabRoute) {
      return this.configureTab(target, values.changes, options);
    }
    if (current?.use === 'TableBlockModel') {
      return this.configureTableBlock(target, values.changes, options);
    }
    if (SIMPLE_FORM_BLOCK_USES.has(current?.use || '')) {
      return this.configureFormBlock(target, current.use, values.changes, options);
    }
    if (current?.use === 'DetailsBlockModel') {
      return this.configureDetailsBlock(target, values.changes, options);
    }
    if (current?.use === 'FilterFormBlockModel') {
      return this.configureFilterFormBlock(target, values.changes, options);
    }
    if (LIST_BLOCK_USES.has(current?.use || '')) {
      return this.configureListBlock(target, values.changes, options);
    }
    if (GRID_CARD_BLOCK_USES.has(current?.use || '')) {
      return this.configureGridCardBlock(target, values.changes, options);
    }
    if (JS_BLOCK_USES.has(current?.use || '')) {
      return this.configureJSBlock(target, values.changes, options);
    }
    if (current?.use === 'MarkdownBlockModel') {
      return this.configureMarkdownBlock(target, values.changes, options);
    }
    if (current?.use === 'IframeBlockModel') {
      return this.configureIframeBlock(target, values.changes, options);
    }
    if (current?.use === 'ChartBlockModel') {
      return this.configureChartBlock(target, values.changes, options);
    }
    if (current?.use === 'ActionPanelBlockModel') {
      return this.configureActionPanelBlock(target, values.changes, options);
    }
    if (current?.use === 'TableActionsColumnModel') {
      return this.configureActionColumn(target, values.changes, options);
    }
    if (FIELD_WRAPPER_USES.has(current?.use || '')) {
      return this.configureFieldWrapper(target, current, values.changes, options);
    }
    if (STANDALONE_FIELD_NODE_USES.has(current?.use || '')) {
      return current?.use === 'JSColumnModel'
        ? this.configureJSColumn(target, values.changes, options)
        : this.configureJSItem(target, values.changes, options);
    }
    if (isFieldNodeUse(current?.use)) {
      return this.configureFieldNode(target, values.changes, options);
    }
    if (ACTION_BUTTON_USES.has(current?.use || '')) {
      return this.configureActionNode(target, current.use, values.changes, options);
    }

    throwBadRequest(`flowSurfaces configure does not support configureOptions on '${current?.use || resolved.uid}'`);
  }

  async createMenu(values: Record<string, any>, options: { transaction?: any } = {}) {
    const publicValues = this.sanitizePublicCreateMenuValues(values || {});
    const type = publicValues.type === 'group' ? 'group' : 'item';
    if (!publicValues.title) {
      throwBadRequest('flowSurfaces createMenu requires title');
    }
    if (type === 'group') {
      return this.createFlowMenuGroup(publicValues, options.transaction);
    }
    return this.createFlowMenuItem(publicValues, options.transaction);
  }

  async updateMenu(values: Record<string, any>, options: { transaction?: any } = {}) {
    const menuRouteId = values.menuRouteId;
    if (_.isNil(menuRouteId) || menuRouteId === '') {
      throwBadRequest('flowSurfaces updateMenu requires menuRouteId');
    }
    const route = await this.assertMenuRouteUpdatable(menuRouteId, options.transaction);
    await this.assertMenuParentIsGroup(values.parentMenuRouteId, options.transaction);
    await this.assertMenuParentNotSelfOrDescendant(route, values.parentMenuRouteId, options.transaction);

    const nextOptions = { ...this.readRouteOptions(route) };
    const updateValues: Record<string, any> = {};
    if (Object.prototype.hasOwnProperty.call(values, 'title')) {
      updateValues.title = values.title;
    }
    if (Object.prototype.hasOwnProperty.call(values, 'icon')) {
      updateValues.icon = values.icon;
    }
    if (Object.prototype.hasOwnProperty.call(values, 'tooltip')) {
      updateValues.tooltip = values.tooltip;
    }
    if (Object.prototype.hasOwnProperty.call(values, 'hideInMenu')) {
      updateValues.hideInMenu = !!values.hideInMenu;
    }
    if (Object.prototype.hasOwnProperty.call(values, 'parentMenuRouteId')) {
      updateValues.parentId = values.parentMenuRouteId ?? null;
      updateValues.sort = this.allocateRouteSortValue();
    }
    if (Object.keys(nextOptions).length) {
      updateValues.options = nextOptions;
    }

    if (Object.keys(updateValues).length) {
      await this.db.getRepository('desktopRoutes').update({
        filterByTk: String(menuRouteId),
        values: updateValues,
        transaction: options.transaction,
      });
    }
    const updated = await this.findMenuRouteById(menuRouteId, options.transaction);
    return this.buildMenuResult(updated);
  }

  private async initializeFlowPageForRoute(route: any, values: Record<string, any>, transaction?: any) {
    const routeId = this.readRouteField(route, 'id');
    const pageSchemaUid = this.readRouteField(route, 'schemaUid');
    const structure = await this.loadRouteBackedPageStructure(route, transaction);
    let tabRoute = structure.tabRoutes[0];
    const routeOptions = this.readRouteOptions(route);
    if (!routeOptions[FLOW_SURFACE_MENU_BINDABLE_OPTION_KEY]) {
      throwBadRequest(`flowSurfaces createPage only accepts a bindable menu route created by createMenu(type="item")`);
    }
    if (!this.isBindableMenuRoutePendingInitialization(route, structure)) {
      throwBadRequest(`flowSurfaces createPage does not allow re-initializing menu route '${routeId}'`);
    }
    const existingPage = structure.pageModel;
    const enableTabs = !!values.enableTabs;
    const displayTitle = values.displayTitle !== false;
    const title = values.title || this.readRouteField(route, 'title') || pageSchemaUid;
    const nextRouteOptions = {
      ...routeOptions,
      ...(values.routeOptions || {}),
    };

    if (!tabRoute) {
      const tabSchemaUid = values.tabSchemaUid || uid();
      const tabSchemaName = values.tabSchemaName || uid();
      const tabTitle = values.tabTitle || 'Untitled';
      await this.db.getRepository('desktopRoutes').create({
        values: {
          type: 'tabs',
          sort: this.allocateRouteSortValue(1),
          title: tabTitle,
          icon: values.tabIcon,
          schemaUid: tabSchemaUid,
          tabSchemaName,
          hidden: !enableTabs,
          parentId: routeId,
          options: {
            documentTitle: values.tabDocumentTitle,
            flowRegistry: values.tabFlowRegistry || {},
          },
        },
        transaction,
      });
      tabRoute = await this.db.getRepository('desktopRoutes').findOne({
        filter: { schemaUid: tabSchemaUid },
        transaction,
      });
    } else {
      await this.db.getRepository('desktopRoutes').update({
        filterByTk: String(this.readRouteField(tabRoute, 'id')),
        values: {
          title: values.tabTitle || this.readRouteField(tabRoute, 'title') || 'Untitled',
          icon: Object.prototype.hasOwnProperty.call(values, 'tabIcon')
            ? values.tabIcon
            : this.readRouteField(tabRoute, 'icon'),
          hidden: !enableTabs,
          options: {
            ...this.readRouteOptions(tabRoute),
            documentTitle: values.tabDocumentTitle ?? this.readRouteOptions(tabRoute).documentTitle,
            flowRegistry: values.tabFlowRegistry || this.readRouteOptions(tabRoute).flowRegistry || {},
          },
        },
        transaction,
      });
      tabRoute = await this.db.getRepository('desktopRoutes').findOne({
        filterByTk: String(this.readRouteField(tabRoute, 'id')),
        transaction,
      });
    }

    await this.ensureFlowRoutePageSchemaShell(pageSchemaUid, transaction);
    await this.db.getRepository('desktopRoutes').update({
      filterByTk: String(routeId),
      values: {
        title,
        icon: Object.prototype.hasOwnProperty.call(values, 'icon') ? values.icon : this.readRouteField(route, 'icon'),
        enableTabs,
        enableHeader: values.enableHeader,
        displayTitle,
        options: nextRouteOptions,
      },
      transaction,
    });

    const pageTree = buildPersistedRootPageModel({
      pageUid: existingPage?.uid || values.pageUid || uid(),
      pageTitle: title,
      routeId,
      enableTabs,
      displayTitle,
      pageDocumentTitle: values.documentTitle,
    });
    const pageUid = await this.repository.upsertModel(
      {
        parentId: pageSchemaUid,
        subKey: 'page',
        subType: 'object',
        ...pageTree,
      },
      { transaction },
    );
    const tabSchemaUid = this.readRouteField(tabRoute, 'schemaUid');
    const tabSchemaName = this.readRouteField(tabRoute, 'tabSchemaName');
    const gridUid = await this.ensureGridChild(tabSchemaUid, 'BlockGridModel', transaction);

    return {
      routeId,
      parentMenuRouteId: this.readRouteField(route, 'parentId') ?? null,
      pageSchemaUid,
      pageUid,
      tabSchemaUid,
      tabRouteId: this.readRouteField(tabRoute, 'id'),
      tabSchemaName,
      gridUid,
    };
  }

  async createPage(values: Record<string, any>, options: { transaction?: any } = {}) {
    let result;
    if (!_.isNil(values.menuRouteId) && values.menuRouteId !== '') {
      const route = await this.assertMenuRouteBindable(values.menuRouteId, options.transaction);
      result = await this.initializeFlowPageForRoute(route, values, options.transaction);
    } else {
      const createdMenu = await this.createFlowMenuItem(values, options.transaction);
      const route = await this.assertMenuRouteBindable(createdMenu.routeId, options.transaction);
      result = await this.initializeFlowPageForRoute(route, values, options.transaction);
    }
    await this.persistCreatedKeysForAction('createPage', values, result, options.transaction);
    return result;
  }

  async destroyPage(values: Record<string, any>, options: { transaction?: any } = {}) {
    const uid = this.normalizeRootUidValue('destroyPage', values);
    const resolved = await this.locator.resolve({ uid }, options);
    const { pageSchemaUid } = await this.assertRouteBackedPageUidTarget('destroyPage', resolved, options.transaction);
    const pageRoute = await this.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid: pageSchemaUid,
      },
      appends: ['children'],
      transaction: options.transaction,
    });
    const pageModel = await this.repository.findModelByParentId(pageSchemaUid, {
      transaction: options.transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    const chartUids = [...this.collectChartBlockUidsFromTree(pageModel)];
    const tabRoutes = _.castArray(pageRoute?.get?.('children') || pageRoute?.children || []);
    for (const tabRoute of tabRoutes) {
      const tabSchemaUid = tabRoute?.get?.('schemaUid') || tabRoute?.schemaUid;
      if (!tabSchemaUid) {
        continue;
      }
      const tabGrid = await this.repository.findModelByParentId(tabSchemaUid, {
        transaction: options.transaction,
        subKey: 'grid',
        includeAsyncNode: true,
      });
      chartUids.push(...this.collectChartBlockUidsFromTree(tabGrid));
      await this.clearFlowTemplateUsagesForRouteSchemaUid(String(tabSchemaUid), options.transaction);
    }
    await this.clearFlowTemplateUsagesForRouteSchemaUid(pageSchemaUid, options.transaction);
    await this.removeFlowSqlBindingsForChartUids(chartUids, options.transaction);
    if (pageModel?.uid) {
      await this.removeNodeTreeWithBindings(pageModel.uid, options.transaction);
    }
    for (const tabRoute of tabRoutes) {
      await this.routeSync.removeTabAnchorTree(
        tabRoute?.get?.('schemaUid') || tabRoute?.schemaUid,
        options.transaction,
      );
    }
    await this.db.getRepository('desktopRoutes').destroy({
      filter: {
        schemaUid: pageSchemaUid,
      },
      transaction: options.transaction,
    });
    await this.removeFlowRoutePageSchemaShell(pageSchemaUid, options.transaction);
    return { uid: resolved.uid };
  }

  async addTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const pageTarget = await this.locator.resolve(this.normalizeWriteTarget('addTab', values?.target, values), options);
    await this.assertRouteBackedPageUidTarget('addTab', pageTarget, options.transaction);
    const pageRoute = pageTarget.pageRoute;
    if (!pageRoute) {
      throwConflict('flowSurfaces addTab page route not found', 'FLOW_SURFACE_PAGE_ROUTE_NOT_FOUND');
    }
    const tabSchemaUid = values.tabSchemaUid || uid();
    const tabSchemaName = values.tabSchemaName || uid();
    const title = values.title || 'Untitled';
    const sort = this.allocateRouteSortValue();
    const route = await this.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        sort,
        title,
        icon: values.icon,
        parentId: pageRoute.get('id'),
        schemaUid: tabSchemaUid,
        tabSchemaName,
        hidden: !pageRoute.get('enableTabs'),
        options: {
          documentTitle: values.documentTitle,
          flowRegistry: values.flowRegistry || {},
        },
      },
      transaction: options.transaction,
    });

    // Modern page tabs are route-backed synthetic anchors.
    // Keep the persisted subtree aligned with frontend semantics by storing only the async grid child under the tab schema uid.
    const gridUid = await this.ensureGridChild(tabSchemaUid, 'BlockGridModel', options.transaction);

    const result = {
      pageUid: pageTarget.uid,
      tabSchemaUid,
      tabRouteId: route.get('id'),
      tabSchemaName,
      gridUid,
    };
    await this.persistCreatedKeysForAction('addTab', values, result, options.transaction);
    return result;
  }

  async updateTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = await this.assertRouteBackedTabUidTarget(
      'updateTab',
      this.normalizeWriteTarget('updateTab', values?.target, values).uid,
      options.transaction,
    );
    const tabUid = target.uid;
    const route = target.tabRoute || (await this.locator.findRouteBySchemaUid(tabUid, options.transaction));
    if (!route) {
      throwConflict('flowSurfaces updateTab route not found', 'FLOW_SURFACE_TAB_ROUTE_NOT_FOUND');
    }
    const current = await this.loadResolvedNode(target, options.transaction);
    const nextPayload = buildDefinedPayload({
      props: _.pickBy(
        {
          title: values.title,
          icon: values.icon,
        },
        (value) => !_.isUndefined(value),
      ),
      stepParams:
        !_.isUndefined(values.title) || !_.isUndefined(values.icon) || !_.isUndefined(values.documentTitle)
          ? {
              pageTabSettings: {
                tab: _.pickBy(
                  {
                    title: values.title,
                    icon: values.icon,
                    documentTitle: values.documentTitle,
                  },
                  (value) => !_.isUndefined(value),
                ),
              },
            }
          : undefined,
      flowRegistry: !_.isUndefined(values.flowRegistry) ? values.flowRegistry : undefined,
    });
    await this.routeSync.persistTabSettings(target, current, nextPayload, options.transaction);

    return {
      uid: tabUid,
      routeId: route.get('id'),
      title: values.title,
      icon: values.icon,
    };
  }

  async moveTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    if (
      Object.prototype.hasOwnProperty.call(values || {}, 'sourceTabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values || {}, 'targetTabSchemaUid')
    ) {
      throwBadRequest(
        `flowSurfaces moveTab only accepts sourceUid and targetUid; if you only have tabSchemaUid, call flowSurfaces:get first`,
      );
    }
    const sourceUid = String(values.sourceUid || '').trim();
    const targetUid = String(values.targetUid || '').trim();
    const position = values.position === 'before' ? 'before' : 'after';
    if (!sourceUid || !targetUid) {
      throwBadRequest('flowSurfaces moveTab requires sourceUid and targetUid');
    }
    if (sourceUid === targetUid) {
      throwBadRequest('flowSurfaces moveTab requires different sourceUid and targetUid');
    }
    const sourceTarget = await this.assertRouteBackedTabUidTarget('moveTab', sourceUid, options.transaction);
    const targetTarget = await this.assertRouteBackedTabUidTarget('moveTab', targetUid, options.transaction);
    const sourceRoute = await this.locator.findRouteBySchemaUid(sourceUid, options.transaction);
    const targetRoute = await this.locator.findRouteBySchemaUid(targetUid, options.transaction);
    if (!sourceRoute || !targetRoute) {
      throwBadRequest('flowSurfaces moveTab route not found');
    }
    const sourceParentId = sourceRoute.get?.('parentId') ?? sourceRoute.parentId;
    const targetParentId = targetRoute.get?.('parentId') ?? targetRoute.parentId;
    if (!sourceParentId || !targetParentId || String(sourceParentId) !== String(targetParentId)) {
      throwBadRequest('flowSurfaces moveTab only supports sibling tabs under the same page route');
    }

    const desktopRoutesRepo = this.db.getRepository('desktopRoutes');
    const siblingRoutes = _.sortBy(
      _.castArray(
        await desktopRoutesRepo.find({
          filter: {
            parentId: sourceParentId,
          },
          transaction: options.transaction,
        }),
      ).map((route: any) => route?.toJSON?.() || route),
      (route: any) => route?.sort ?? 0,
    );
    const sourceIndex = siblingRoutes.findIndex((route: any) => String(route?.id) === String(sourceRoute.get('id')));
    const targetIndex = siblingRoutes.findIndex((route: any) => String(route?.id) === String(targetRoute.get('id')));
    if (sourceIndex === -1 || targetIndex === -1) {
      throwBadRequest('flowSurfaces moveTab cannot resolve sibling route order');
    }

    const [sourceItem] = siblingRoutes.splice(sourceIndex, 1);
    const nextTargetIndex = siblingRoutes.findIndex(
      (route: any) => String(route?.id) === String(targetRoute.get('id')),
    );
    siblingRoutes.splice(position === 'before' ? nextTargetIndex : nextTargetIndex + 1, 0, sourceItem);

    await Promise.all(
      siblingRoutes.map((route: any, index: number) =>
        desktopRoutesRepo.update({
          filterByTk: String(route.id),
          values: {
            sort: index + 1,
          },
          transaction: options.transaction,
        }),
      ),
    );

    return { sourceUid, targetUid, position };
  }

  async removeTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const uid = this.normalizeRootUidValue('removeTab', values);
    const resolved = await this.assertRouteBackedTabUidTarget('removeTab', uid, options.transaction);
    const tabRoute = resolved.tabRoute || (await this.locator.findRouteBySchemaUid(resolved.uid, options.transaction));
    const parentRouteId = tabRoute?.get?.('parentId') ?? tabRoute?.parentId;
    const siblingTabRoutes = parentRouteId
      ? _.castArray(
          await this.db.getRepository('desktopRoutes').find({
            filter: {
              parentId: parentRouteId,
              type: 'tabs',
            },
            transaction: options.transaction,
          }),
        )
      : [];
    if (siblingTabRoutes.length <= 1) {
      throwBadRequest('flowSurfaces removeTab cannot delete the last route-backed tab; use destroyPage instead');
    }
    await this.removeNodeTreeWithBindings(resolved.uid, options.transaction);
    await this.clearFlowTemplateUsagesForRouteSchemaUid(resolved.uid, options.transaction);
    await this.routeSync.removeTabAnchorTree(resolved.uid, options.transaction);
    await this.db.getRepository('desktopRoutes').destroy({
      filter: {
        schemaUid: resolved.uid,
      },
      transaction: options.transaction,
    });
    return { uid: resolved.uid };
  }

  async addPopupTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const popupPage = await this.assertPopupPageUidTarget(
      'addPopupTab',
      this.normalizeWriteTarget('addPopupTab', values?.target, values).uid,
      options.transaction,
    );
    const tree = buildPopupTabTree({
      title: values.title,
      icon: values.icon,
      documentTitle: values.documentTitle,
      flowRegistry: values.flowRegistry,
    });
    await this.repository.upsertModel(
      {
        parentId: popupPage.uid,
        subKey: 'tabs',
        subType: 'array',
        ...tree,
      },
      { transaction: options.transaction },
    );
    const result = {
      popupPageUid: popupPage.uid,
      popupTabUid: tree.uid,
      popupGridUid: tree.subModels?.grid?.uid,
    };
    await this.persistCreatedKeysForAction('addPopupTab', values, result, options.transaction);
    return result;
  }

  async updatePopupTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const { popupTab } = await this.assertPopupTabUidTarget(
      'updatePopupTab',
      this.normalizeWriteTarget('updatePopupTab', values?.target, values).uid,
      options.transaction,
    );
    const nextPayload = buildDefinedPayload({
      uid: popupTab.uid,
      props:
        !_.isUndefined(values.title) || !_.isUndefined(values.icon)
          ? {
              ...(popupTab.props || {}),
              ..._.pickBy(
                {
                  title: values.title,
                  icon: values.icon,
                },
                (value) => !_.isUndefined(value),
              ),
            }
          : undefined,
      stepParams:
        !_.isUndefined(values.title) || !_.isUndefined(values.icon) || !_.isUndefined(values.documentTitle)
          ? {
              ...(popupTab.stepParams || {}),
              pageTabSettings: {
                ...(popupTab.stepParams?.pageTabSettings || {}),
                tab: {
                  ...(popupTab.stepParams?.pageTabSettings?.tab || {}),
                  ..._.pickBy(
                    {
                      title: values.title,
                      icon: values.icon,
                      documentTitle: values.documentTitle,
                    },
                    (value) => !_.isUndefined(value),
                  ),
                },
              },
            }
          : undefined,
      flowRegistry: !_.isUndefined(values.flowRegistry) ? values.flowRegistry : undefined,
    });
    if (Object.keys(nextPayload).length === 1) {
      return { uid: popupTab.uid };
    }
    await this.repository.patch(nextPayload, { transaction: options.transaction });
    return buildDefinedPayload({
      uid: popupTab.uid,
      title: values.title,
      icon: values.icon,
    });
  }

  async movePopupTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const sourceUid = String(values.sourceUid || '').trim();
    const targetUid = String(values.targetUid || '').trim();
    const position = values.position === 'before' ? 'before' : 'after';
    if (!sourceUid || !targetUid) {
      throwBadRequest('flowSurfaces movePopupTab requires sourceUid and targetUid');
    }
    if (sourceUid === targetUid) {
      throwBadRequest('flowSurfaces movePopupTab requires different sourceUid and targetUid');
    }
    const source = await this.assertPopupTabUidTarget('movePopupTab', sourceUid, options.transaction);
    const target = await this.assertPopupTabUidTarget('movePopupTab', targetUid, options.transaction);
    if (source.popupPage.uid !== target.popupPage.uid) {
      throwBadRequest('flowSurfaces movePopupTab only supports sibling popup tabs under the same popup page');
    }
    await this.repository.attach(
      source.popupTab.uid,
      {
        parentId: source.popupPage.uid,
        subKey: 'tabs',
        subType: 'array',
        position: { type: position, target: target.popupTab.uid },
      },
      { transaction: options.transaction },
    );
    return { sourceUid, targetUid, position };
  }

  async removePopupTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const { popupTab } = await this.assertPopupTabUidTarget(
      'removePopupTab',
      this.normalizeWriteTarget('removePopupTab', values?.target, values).uid,
      options.transaction,
    );
    await this.removeNodeTreeWithBindings(popupTab.uid, options.transaction);
    return { uid: popupTab.uid };
  }

  private buildFlowTemplateReferenceBlockTree(template: any) {
    const resourceInit = buildDefinedPayload({
      dataSourceKey: template.dataSourceKey,
      collectionName: template.collectionName,
      associationName: template.associationName,
      filterByTk: template.filterByTk,
      sourceId: template.sourceId,
    });
    return {
      use: 'ReferenceBlockModel',
      stepParams: buildFlowTemplateReferenceBlockStepParams(template, template.targetUid, resourceInit),
    };
  }

  private patchCopiedTemplateGridFromRoot(templateRoot: any, gridModel: any) {
    if (!templateRoot || !gridModel || typeof gridModel !== 'object') {
      return gridModel;
    }
    const nextGrid = _.cloneDeep(gridModel);
    const nextStepParams = _.isPlainObject(nextGrid.stepParams) ? _.cloneDeep(nextGrid.stepParams) : {};
    const delegatedStepParams: Array<{ flowKey: string; stepKey: string }> = [
      { flowKey: 'formModelSettings', stepKey: 'layout' },
      { flowKey: 'eventSettings', stepKey: 'linkageRules' },
    ];

    for (const { flowKey, stepKey } of delegatedStepParams) {
      const value = _.get(templateRoot, ['stepParams', flowKey, stepKey]);
      if (_.isUndefined(value)) {
        continue;
      }
      const currentFlow = _.isPlainObject(nextStepParams[flowKey]) ? _.cloneDeep(nextStepParams[flowKey]) : {};
      if (!Object.prototype.hasOwnProperty.call(currentFlow, stepKey) || _.isUndefined(currentFlow[stepKey])) {
        currentFlow[stepKey] = _.cloneDeep(value);
        nextStepParams[flowKey] = currentFlow;
      }
    }

    nextGrid.stepParams = nextStepParams;
    return nextGrid;
  }

  private buildBlockCreateResult(tree: any, parentUid: string, subKey: string, popupSurface?: any) {
    const gridNode = getSingleNodeSubModel(tree?.subModels?.grid);
    const itemNode = getSingleNodeSubModel(tree?.subModels?.item);
    const itemGridNode = getSingleNodeSubModel(itemNode?.subModels?.grid);
    const columnNodes = getNodeSubModelList(tree?.subModels?.columns);
    const blockGridUid = gridNode?.uid || itemGridNode?.uid;
    const popupGridUid = popupSurface?.gridUid;
    const actionsColumnUid = columnNodes.find((item) => item.use === 'TableActionsColumnModel')?.uid;
    return {
      uid: tree.uid,
      parentUid,
      subKey,
      ...(blockGridUid || popupGridUid ? { gridUid: blockGridUid || popupGridUid } : {}),
      ...(blockGridUid ? { blockGridUid } : {}),
      ...(itemNode?.uid ? { itemUid: itemNode.uid } : {}),
      ...(itemGridNode?.uid ? { itemGridUid: itemGridNode.uid } : {}),
      ...(actionsColumnUid ? { actionsColumnUid } : {}),
      ...(popupSurface
        ? {
            pageUid: popupSurface.pageUid,
            tabUid: popupSurface.tabUid,
            popupPageUid: popupSurface.pageUid,
            popupTabUid: popupSurface.tabUid,
            popupGridUid: popupSurface.gridUid,
          }
        : {}),
    };
  }

  private async appendAddedBlockLayout(
    parentUid: string,
    createdUid: string,
    initialGrid: any,
    options: { transaction?: any },
  ) {
    if (!initialGrid?.uid) {
      return;
    }
    const finalGrid = await this.repository.findModelById(parentUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const layoutPayload = this.buildAppendGridLayoutPayload({
      initialGrid,
      finalGrid,
      appendedItemUids: [createdUid],
    });
    await this.setLayout(
      {
        target: {
          uid: parentUid,
        },
        ...layoutPayload,
      },
      options,
    );
  }

  private async applyTemplateFieldsToBlock(
    actionName: string,
    blockUid: string,
    template: any,
    mode: 'reference' | 'copy',
    options: { transaction?: any },
  ) {
    const hostBlock = await this.repository.findModelById(blockUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!hostBlock?.uid) {
      throwBadRequest(
        `flowSurfaces ${actionName} target '${blockUid}' does not exist`,
        'FLOW_SURFACE_TEMPLATE_FIELDS_TARGET_INVALID',
      );
    }
    await this.assertFieldsTemplateCompatibility(actionName, hostBlock, template);
    const currentGrid = getSingleNodeSubModel(hostBlock?.subModels?.grid);
    if (!currentGrid?.uid) {
      throwBadRequest(
        `flowSurfaces ${actionName} target '${blockUid}' does not have a form grid`,
        'FLOW_SURFACE_TEMPLATE_FIELDS_TARGET_INVALID',
      );
    }

    const templateRoot = await this.repository.findModelById(template.targetUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const templateGrid = getSingleNodeSubModel(templateRoot?.subModels?.grid);
    if (!templateGrid?.uid) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${template.uid}' does not contain a form grid`,
        'FLOW_SURFACE_TEMPLATE_FIELDS_SOURCE_INVALID',
      );
    }

    await this.clearFlowTemplateUsagesForNodeTree(currentGrid, options.transaction);

    if (mode === 'reference') {
      const nextSettings = {
        templateUid: template.uid,
        templateName: template.name,
        templateDescription: template.description,
        targetUid: template.targetUid,
        targetPath: 'subModels.grid',
        mode,
      };
      if (currentGrid.use === 'ReferenceFormGridModel') {
        const nextGrid = _.cloneDeep(currentGrid);
        _.set(nextGrid, ['stepParams', 'referenceSettings', 'useTemplate'], nextSettings);
        await this.repository.upsertModel(
          {
            ...nextGrid,
            parentId: blockUid,
            subKey: 'grid',
            subType: 'object',
          },
          { transaction: options.transaction },
        );
        await this.syncFlowTemplateUsagesForNodeTree(currentGrid.uid, options.transaction);
        return { gridUid: currentGrid.uid };
      }

      await this.repository.remove(currentGrid.uid, { transaction: options.transaction });
      await this.repository.upsertModel(
        {
          uid: currentGrid.uid,
          use: 'ReferenceFormGridModel',
          props: currentGrid.props,
          decoratorProps: currentGrid.decoratorProps,
          flowRegistry: currentGrid.flowRegistry,
          sortIndex: currentGrid.sortIndex,
          parentId: blockUid,
          subKey: 'grid',
          subType: 'object',
          stepParams: {
            referenceSettings: {
              useTemplate: nextSettings,
            },
          },
        },
        { transaction: options.transaction },
      );
      await this.syncFlowTemplateUsagesForNodeTree(currentGrid.uid, options.transaction);
      return { gridUid: currentGrid.uid };
    }

    const clonedGrid = await this.cloneFlowModelTree(actionName, templateGrid.uid, {
      transaction: options.transaction,
    });
    if (!clonedGrid?.uid) {
      throwConflict(
        `flowSurfaces ${actionName} failed to duplicate fields template '${template.uid}'`,
        'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
      );
    }

    await this.repository.remove(currentGrid.uid, { transaction: options.transaction });
    const createdGridUid = await this.repository.upsertModel(
      {
        ...this.patchCopiedTemplateGridFromRoot(templateRoot, clonedGrid),
        parentId: blockUid,
        subKey: 'grid',
        subType: 'object',
      },
      { transaction: options.transaction },
    );
    await this.syncFlowTemplateUsagesForNodeTree(createdGridUid, options.transaction);
    return { gridUid: createdGridUid };
  }

  private async addBlockFromFieldsTemplate(
    values: Record<string, any>,
    template: any,
    templateRef: { uid: string; mode: 'reference' | 'copy'; usage?: 'block' | 'fields' },
    options: { transaction?: any; deferAutoLayout?: boolean; enabledPackages?: ReadonlySet<string> } = {},
  ) {
    if (!template.useModel) {
      throwBadRequest(
        `flowSurfaces addBlock template '${template.uid}' is missing useModel`,
        'FLOW_SURFACE_TEMPLATE_USE_MODEL_MISSING',
      );
    }
    if (!_.isUndefined(values.resource) || !_.isUndefined(values.resourceInit)) {
      throwBadRequest(
        `flowSurfaces addBlock template.usage='fields' does not allow resource or resourceInit overrides`,
        'FLOW_SURFACE_TEMPLATE_FIELDS_RESOURCE_CONFLICT',
      );
    }
    if (!_.isUndefined(values.type) || !_.isUndefined(values.use)) {
      const expectedBlock = resolveSupportedBlockCatalogItem(
        {
          type: values.type,
          use: values.use,
        },
        {
          context: 'addBlock',
          enabledPackages: options.enabledPackages,
          requireCreateSupported: true,
        },
      );
      if (expectedBlock.use !== template.useModel) {
        throwBadRequest(
          `flowSurfaces addBlock template '${template.uid}' requires block use '${template.useModel}', got '${expectedBlock.use}'`,
          'FLOW_SURFACE_TEMPLATE_FIELDS_USE_MISMATCH',
        );
      }
    }

    const createdBlock = await this.addBlock(
      {
        ..._.omit(values, ['template']),
        use: template.useModel,
        ...(_.isUndefined(values.resource) && _.isUndefined(values.resourceInit)
          ? {
              resourceInit: buildDefinedPayload({
                dataSourceKey: template.dataSourceKey,
                collectionName: template.collectionName,
                associationName: template.associationName,
                filterByTk: template.filterByTk,
                sourceId: template.sourceId,
              }),
            }
          : {}),
      },
      options,
    );
    const templateFieldsResult = await this.applyTemplateFieldsToBlock(
      'addBlock',
      createdBlock.uid,
      template,
      templateRef.mode,
      options,
    );
    return {
      ...createdBlock,
      ...templateFieldsResult,
    };
  }

  private async addBlockFromTemplate(
    values: Record<string, any>,
    templateRef: { uid: string; mode: 'reference' | 'copy'; usage?: 'block' | 'fields' },
    options: { transaction?: any; deferAutoLayout?: boolean; enabledPackages?: ReadonlySet<string> } = {},
  ) {
    ensureNoRawDirectAddKeys('addBlock', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const template = await this.getFlowTemplateOrThrow('addBlock', templateRef.uid, {
      transaction: options.transaction,
      expectedType: 'block',
    });

    if (templateRef.usage === 'fields') {
      return this.addBlockFromFieldsTemplate(values, template, templateRef, options);
    }

    if (
      !_.isUndefined(values.type) ||
      !_.isUndefined(values.use) ||
      !_.isUndefined(values.resource) ||
      !_.isUndefined(values.resourceInit)
    ) {
      throwBadRequest(
        `flowSurfaces addBlock template.usage='block' does not allow type, use, resource or resourceInit`,
        'FLOW_SURFACE_TEMPLATE_BLOCK_CONFLICT',
      );
    }
    if (templateRef.mode === 'reference' && !_.isUndefined(values.settings)) {
      throwBadRequest(
        `flowSurfaces addBlock template.mode='reference' does not allow settings`,
        'FLOW_SURFACE_TEMPLATE_REFERENCE_SETTINGS_UNSUPPORTED',
      );
    }

    const target = this.normalizeWriteTarget('addBlock', values?.target, values);
    await this.assertBlockTemplateCompatibility('addBlock', target, template, options.transaction);
    const { parentUid, subKey, subType, popupSurface } = await this.surfaceContext.resolveBlockParent(
      target,
      options.transaction,
    );
    const initialGrid = options.deferAutoLayout
      ? null
      : await this.repository.findModelById(parentUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        });

    if (templateRef.mode === 'reference') {
      const tree = this.buildFlowTemplateReferenceBlockTree(template);
      const createdUid = await this.repository.upsertModel(
        {
          parentId: parentUid,
          subKey,
          subType,
          ...tree,
        },
        { transaction: options.transaction },
      );
      await this.syncFlowTemplateUsagesForNodeTree(createdUid, options.transaction);
      if (!options.deferAutoLayout && initialGrid?.uid) {
        await this.appendAddedBlockLayout(parentUid, createdUid, initialGrid, options);
      }
      return this.buildBlockCreateResult({ ...tree, uid: createdUid }, parentUid, subKey, popupSurface);
    }

    const clonedTree = await this.cloneFlowModelTree('addBlock', template.targetUid, {
      transaction: options.transaction,
    });
    if (!clonedTree?.uid) {
      throwConflict(
        `flowSurfaces addBlock failed to duplicate template '${template.uid}'`,
        'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
      );
    }
    const inlineSettings = this.normalizeInlineSettings('addBlock', values.settings);
    const createdUid = await this.repository.upsertModel(
      {
        ...clonedTree,
        parentId: parentUid,
        subKey,
        subType,
      },
      { transaction: options.transaction },
    );
    if (inlineSettings && Object.keys(inlineSettings).length) {
      await this.applyInlineNodeSettings('addBlock', createdUid, inlineSettings, options);
    }
    await this.syncFlowTemplateUsagesForNodeTree(createdUid, options.transaction);
    if (!options.deferAutoLayout && initialGrid?.uid) {
      await this.appendAddedBlockLayout(parentUid, createdUid, initialGrid, options);
    }
    return this.buildBlockCreateResult({ ...clonedTree, uid: createdUid }, parentUid, subKey, popupSurface);
  }

  private async addFieldFromTemplate(
    values: Record<string, any>,
    templateRef: { uid: string; mode: 'reference' | 'copy' },
    options: { transaction?: any; enabledPackages?: ReadonlySet<string> } = {},
  ): Promise<FlowSurfaceAddFieldResult> {
    const unsupportedKeys = Object.keys(_.omit(values || {}, ['target', 'template']));
    if (unsupportedKeys.length) {
      throwBadRequest(
        `flowSurfaces addField template import does not allow: ${unsupportedKeys.join(', ')}`,
        'FLOW_SURFACE_TEMPLATE_FIELDS_CONFLICT',
      );
    }
    const template = await this.getFlowTemplateOrThrow('addField', templateRef.uid, {
      transaction: options.transaction,
      expectedType: 'block',
    });
    const target = this.normalizeWriteTarget('addField', values?.target, values);
    const resolvedTarget = await this.locator.resolve(target, options);
    const container = await this.surfaceContext.resolveFieldContainer(resolvedTarget.uid, options.transaction);
    const result = await this.applyTemplateFieldsToBlock(
      'addField',
      container.ownerUid,
      template,
      templateRef.mode,
      options,
    );
    return {
      uid: container.ownerUid,
      parentUid: container.parentUid,
      subKey: container.subKey,
      ...result,
    };
  }

  async addBlock(
    values: Record<string, any>,
    options: { transaction?: any; deferAutoLayout?: boolean; enabledPackages?: ReadonlySet<string> } = {},
  ) {
    const templateRef = !_.isUndefined(values?.template)
      ? this.normalizeFlowTemplateReference('addBlock', values.template, {
          allowUsage: true,
          expectedType: 'block',
        })
      : null;
    if (templateRef) {
      const result = await this.addBlockFromTemplate(values, templateRef, options);
      await this.persistCreatedKeysForAction('addBlock', values, result, options.transaction);
      return result;
    }
    const target = this.normalizeWriteTarget('addBlock', values?.target, values);
    ensureNoRawDirectAddKeys('addBlock', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addBlock', values.settings);
    const semanticResource = this.normalizeResourceInput(values.resource);
    const rawResourceInit = _.isUndefined(values.resourceInit)
      ? undefined
      : normalizeSimpleResourceInit(values.resourceInit);
    if (semanticResource && rawResourceInit) {
      throwBadRequest('flowSurfaces addBlock does not allow resource and resourceInit at the same time');
    }
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const catalogItem = resolveSupportedBlockCatalogItem(
      {
        type: values.type,
        use: values.use,
      },
      {
        context: 'addBlock',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    let resolvedTarget = await this.locator.resolve(target, options);
    let targetNode = await this.loadResolvedNode(resolvedTarget, options.transaction);
    const targetOpenView = this.resolvePopupHostOpenView(targetNode);
    if (this.isPopupFieldHostUse(targetNode?.use) && !targetOpenView) {
      await this.ensureLocalFieldPopupSurface('addBlock', target.uid, options, { popup: {} });
      resolvedTarget = await this.locator.resolve(target, options);
      targetNode = await this.loadResolvedNode(resolvedTarget, options.transaction);
    }
    const popupProfile = await this.resolvePopupBlockProfile(
      target.uid,
      resolvedTarget,
      targetNode,
      options.transaction,
    );
    const resolvedResourceInit = await this.resolvePopupCollectionBlockResourceInit({
      actionName: 'addBlock',
      blockUse: catalogItem.use,
      popupProfile,
      semanticResource: semanticResource?.kind === 'semantic' ? semanticResource.value : undefined,
      resourceInit: rawResourceInit || (semanticResource?.kind === 'raw' ? semanticResource.value : undefined),
    });
    this.assertRequiredBlockResourceInit({
      actionName: 'addBlock',
      blockCatalogItem: catalogItem,
      resourceInit: resolvedResourceInit,
      resourceField: rawResourceInit ? 'resourceInit' : semanticResource?.kind === 'raw' ? 'resource' : undefined,
    });
    const { parentUid, subKey, subType, popupSurface } = await this.surfaceContext.resolveBlockParent(
      target,
      options.transaction,
    );
    const initialGrid = options.deferAutoLayout
      ? null
      : await this.repository.findModelById(parentUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        });
    const tree = buildBlockTree({
      use: catalogItem.use,
      resourceInit: resolvedResourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
    });
    this.contractGuard.validateNodeTreeAgainstContract(tree);
    const created = await this.repository.upsertModel(
      {
        parentId: parentUid,
        subKey,
        subType,
        ...tree,
      },
      { transaction: options.transaction },
    );
    const gridNode = getSingleNodeSubModel(tree.subModels?.grid);
    const itemNode = getSingleNodeSubModel(tree.subModels?.item);
    const itemGridNode = getSingleNodeSubModel(itemNode?.subModels?.grid);
    const columnNodes = getNodeSubModelList(tree.subModels?.columns);
    const blockGridUid = gridNode?.uid || itemGridNode?.uid;
    const popupGridUid = popupSurface?.gridUid;
    const actionsColumnUid =
      catalogItem.use === 'TableBlockModel'
        ? await this.ensureTableActionsColumn(created, options.transaction)
        : columnNodes.find((item) => item.use === 'TableActionsColumnModel')?.uid;
    const result = {
      uid: created,
      parentUid,
      subKey,
      ...(blockGridUid || popupGridUid ? { gridUid: blockGridUid || popupGridUid } : {}),
      ...(blockGridUid ? { blockGridUid } : {}),
      ...(itemNode?.uid ? { itemUid: itemNode.uid } : {}),
      ...(itemGridNode?.uid ? { itemGridUid: itemGridNode.uid } : {}),
      ...(actionsColumnUid ? { actionsColumnUid } : {}),
      ...(popupSurface
        ? {
            pageUid: popupSurface.pageUid,
            tabUid: popupSurface.tabUid,
            popupPageUid: popupSurface.pageUid,
            popupTabUid: popupSurface.tabUid,
            popupGridUid: popupSurface.gridUid,
          }
        : {}),
    };
    await this.applyInlineNodeSettings('addBlock', created, inlineSettings, options);
    if (!options.deferAutoLayout && initialGrid?.uid) {
      const finalGrid = await this.repository.findModelById(parentUid, {
        transaction: options.transaction,
        includeAsyncNode: true,
      });
      const layoutPayload = this.buildAppendGridLayoutPayload({
        initialGrid,
        finalGrid,
        appendedItemUids: [created],
      });
      await this.setLayout(
        {
          target: {
            uid: parentUid,
          },
          ...layoutPayload,
        },
        options,
      );
    }
    await this.persistCreatedKeysForAction('addBlock', values, result, options.transaction);
    return result;
  }

  async addField(
    values: Record<string, any>,
    options: { transaction?: any; enabledPackages?: ReadonlySet<string> } = {},
  ): Promise<FlowSurfaceAddFieldResult> {
    const templateRef = !_.isUndefined(values?.template)
      ? this.normalizeFlowTemplateReference('addField', values.template, {
          expectedType: 'block',
        })
      : null;
    if (templateRef) {
      const result = await this.addFieldFromTemplate(values, templateRef, options);
      await this.persistCreatedKeysForAction('addField', values, result, options.transaction);
      return result;
    }
    const target = this.normalizeWriteTarget('addField', values?.target, values);
    ensureNoRawDirectAddKeys('addField', values, [
      'wrapperProps',
      'fieldProps',
      'props',
      'decoratorProps',
      'stepParams',
      'flowRegistry',
    ]);
    const inlineSettings = this.normalizeInlineSettings('addField', values.settings);
    const inlinePopup = this.normalizeInlinePopup('addField', values.popup);
    const resolvedTarget = await this.locator.resolve(target, options);
    const container = await this.surfaceContext.resolveFieldContainer(resolvedTarget.uid, options.transaction);
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const isFilterFormItem = container.wrapperUse === 'FilterFormItemModel';
    const requestedStandaloneType =
      typeof values.type === 'string' && values.type.trim().length ? values.type.trim() : undefined;
    const fieldCapability = resolveSupportedFieldCapability({
      containerUse: container.ownerUse,
      requestedWrapperUse: requestedStandaloneType ? undefined : container.wrapperUse,
      requestedRenderer: values.renderer,
      requestedType: requestedStandaloneType,
      allowUnresolvedFieldUse: true,
      enabledPackages,
    });

    if (fieldCapability.standaloneUse) {
      if (inlinePopup) {
        throwBadRequest(`flowSurfaces addField type '${values.type}' does not support popup`);
      }
      if (isFilterFormItem) {
        throwBadRequest(`flowSurfaces addField type '${values.type}' is not allowed under filter-form`);
      }
      const node = buildStandaloneFieldNode({
        use: fieldCapability.standaloneUse as 'JSColumnModel' | 'JSItemModel',
        props: values.props || values.wrapperProps,
        decoratorProps: values.decoratorProps,
        stepParams: values.stepParams,
      });
      this.contractGuard.validateNodeTreeAgainstContract(node);
      await this.repository.upsertModel(
        {
          parentId: container.parentUid,
          subKey: container.subKey,
          subType: container.subType,
          ...node,
        },
        { transaction: options.transaction },
      );

      const result = {
        uid: node.uid,
        parentUid: container.parentUid,
        subKey: container.subKey,
        fieldUse: fieldCapability.standaloneUse,
        type: values.type,
      };
      await this.applyInlineStandaloneFieldSettings('addField', result.uid, inlineSettings, options);
      await this.persistCreatedKeysForAction('addField', values, result, options.transaction);
      return result;
    }

    const requestedFilterTargetUid = values.defaultTargetUid || values.targetBlockUid || values.targetUid;
    const filterTargets = isFilterFormItem
      ? await this.surfaceContext.collectFilterFormTargets(container.ownerUid, options.transaction)
      : [];
    const selectedFilterTarget =
      isFilterFormItem && filterTargets.length
        ? await this.surfaceContext.resolveFilterFormTarget(
            container.ownerUid,
            requestedFilterTargetUid,
            options.transaction,
          )
        : null;
    if (isFilterFormItem && !filterTargets.length && requestedFilterTargetUid) {
      throwBadRequest(
        `flowSurfaces addField filter target '${requestedFilterTargetUid}' is not available on the current surface`,
      );
    }
    const resourceContext = isFilterFormItem
      ? selectedFilterTarget ||
        (await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null))
      : await this.locator.resolveCollectionContext(container.ownerUid, options.transaction);
    if (!resourceContext?.resourceInit) {
      throwBadRequest('flowSurfaces addField cannot infer collection context');
    }

    const resolvedField = await this.resolveFieldDefinition({
      dataSourceKey: isFilterFormItem
        ? resourceContext.resourceInit.dataSourceKey
        : values.dataSourceKey || resourceContext.resourceInit.dataSourceKey,
      collectionName: isFilterFormItem
        ? resourceContext.resourceInit.collectionName
        : values.collectionName || resourceContext.resourceInit.collectionName,
      associationPathName: values.associationPathName,
      fieldPath: values.fieldPath,
    });
    if (!getFieldInterface(resolvedField.field)) {
      throwBadRequest(
        `flowSurfaces field '${resolvedField.collectionName}.${normalizeFieldPath(
          resolvedField.fieldPath,
          resolvedField.associationPathName,
        )}' has no interface and cannot be added via addField`,
      );
    }
    const fieldMenuCandidate = isFilterFormItem
      ? null
      : this.findFieldMenuCandidate({
          ownerUse: container.ownerUse,
          resourceInit: resourceContext.resourceInit,
          fieldPath: resolvedField.fieldPath,
          associationPathName: resolvedField.associationPathName,
          enabledPackages,
        });
    if (values.renderer === 'js' && fieldMenuCandidate && !fieldMenuCandidate.supportsJs) {
      throwBadRequest(
        `flowSurfaces addField renderer 'js' is not available for '${normalizeFieldPath(
          resolvedField.fieldPath,
          resolvedField.associationPathName,
        )}' under '${container.ownerUse}'`,
      );
    }
    const effectiveWrapperUse = fieldMenuCandidate?.explicitWrapperUse || container.wrapperUse;
    const normalizedFieldBinding = this.normalizeDisplayFieldBinding({
      wrapperUse: effectiveWrapperUse,
      dataSourceKey: resolvedField.dataSourceKey,
      collectionName: resolvedField.collectionName,
      fieldPath: resolvedField.fieldPath,
      associationPathName: resolvedField.associationPathName,
    });
    const titleFieldSyncDecision = await this.resolveTitleFieldSyncDecision({
      wrapperUse: effectiveWrapperUse,
      dataSourceKey: resolvedField.dataSourceKey,
      collectionName: resolvedField.collectionName,
      fieldPath: resolvedField.fieldPath,
      associationPathName: resolvedField.associationPathName,
      bindingChange: true,
      hasExistingTitleField: false,
      enabledPackages,
    });
    const preferredCapabilityField = this.resolvePreferredFieldForCapability({
      containerUse: container.ownerUse,
      dataSourceKey: resolvedField.dataSourceKey,
      associationPathName: resolvedField.associationPathName,
      field: resolvedField.field,
    });

    const filterFormInit = isFilterFormItem
      ? {
          filterField: buildFilterFieldMeta(resolvedField.field),
          ...(selectedFilterTarget?.ownerUid ? { defaultTargetUid: selectedFilterTarget.ownerUid } : {}),
        }
      : undefined;
    let capabilityField = preferredCapabilityField;
    let boundFieldCapability;
    if (fieldMenuCandidate?.explicitWrapperUse && fieldMenuCandidate?.explicitFieldUse && !values.renderer) {
      if (hasOwnDefined(values, 'fieldUse') && values.fieldUse !== fieldMenuCandidate.explicitFieldUse) {
        throwBadRequest(
          `flowSurfaces fieldUse '${values.fieldUse}' does not match inferred fieldUse '${fieldMenuCandidate.explicitFieldUse}' under '${container.ownerUse}'`,
        );
      }
      boundFieldCapability = {
        wrapperUse: fieldMenuCandidate.explicitWrapperUse,
        fieldUse: fieldMenuCandidate.explicitFieldUse,
        inferredFieldUse: fieldMenuCandidate.explicitFieldUse,
        standaloneUse: undefined,
        renderer: undefined,
      };
      capabilityField = resolvedField.field;
    } else {
      try {
        boundFieldCapability = resolveSupportedFieldCapability({
          containerUse: container.ownerUse,
          field: capabilityField,
          requestedFieldUse: values.fieldUse,
          requestedWrapperUse: container.wrapperUse,
          requestedRenderer: values.renderer,
          enabledPackages,
          dataSourceKey: resolvedField.dataSourceKey,
          getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
        });
      } catch (error) {
        if (
          hasOwnDefined(values, 'fieldUse') &&
          capabilityField !== resolvedField.field &&
          error instanceof FlowSurfaceBadRequestError
        ) {
          capabilityField = resolvedField.field;
          boundFieldCapability = resolveSupportedFieldCapability({
            containerUse: container.ownerUse,
            field: capabilityField,
            requestedFieldUse: values.fieldUse,
            requestedWrapperUse: container.wrapperUse,
            requestedRenderer: values.renderer,
            enabledPackages,
            dataSourceKey: resolvedField.dataSourceKey,
            getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
          });
        } else {
          throw error;
        }
      }
    }
    if (inlinePopup && !this.isPopupFieldHostUse(boundFieldCapability.fieldUse)) {
      throwBadRequest(`flowSurfaces addField field '${boundFieldCapability.fieldUse}' does not support popup`);
    }
    if (
      inlinePopup &&
      this.isExternalPopupOpenView(
        this.peekInlineFieldSettingsOpenView(inlineSettings, boundFieldCapability.wrapperUse),
      )
    ) {
      throwBadRequest(`flowSurfaces addField popup cannot be combined with external openView.uid`);
    }
    const defaultFieldState = buildDefaultFieldState(
      container.ownerUse,
      boundFieldCapability.fieldUse,
      capabilityField,
    );
    const defaultTitleField =
      titleFieldSyncDecision.titleField ??
      normalizedFieldBinding.defaultTitleField ??
      fieldMenuCandidate?.defaultTitleField;
    const wrapperShouldPersistTitleField =
      !_.isUndefined(defaultTitleField) &&
      TITLE_FIELD_SUPPORTED_WRAPPER_USES.has(boundFieldCapability.wrapperUse || '');
    const fieldShouldPersistTitleField = !_.isUndefined(defaultTitleField);

    const tree = buildFieldTree({
      wrapperUse: boundFieldCapability.wrapperUse,
      fieldUse: boundFieldCapability.fieldUse,
      fieldPath: normalizedFieldBinding.fieldPath,
      dataSourceKey: normalizedFieldBinding.dataSourceKey,
      collectionName: normalizedFieldBinding.collectionName,
      associationPathName: normalizedFieldBinding.associationPathName,
      filterFormInit,
      wrapperProps: _.merge(
        {},
        defaultFieldState.wrapperProps || {},
        wrapperShouldPersistTitleField ? { titleField: defaultTitleField } : {},
        values.wrapperProps || {},
      ),
      fieldProps: _.merge(
        {},
        defaultFieldState.fieldProps || {},
        fieldShouldPersistTitleField ? { titleField: defaultTitleField } : {},
        values.fieldProps || {},
      ),
    });
    this.contractGuard.validateNodeTreeAgainstContract(tree.model);

    await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...tree.model,
      },
      { transaction: options.transaction },
    );

    if (isFilterFormItem && selectedFilterTarget?.ownerUid) {
      await this.persistFilterFormConnectConfig(
        {
          filterModelUid: tree.wrapperUid,
          filterFormOwnerUid: container.ownerUid,
          targetBlockUid: selectedFilterTarget.ownerUid,
          resourceInit: resourceContext.resourceInit,
          fieldPath: normalizedFieldBinding.fieldPath,
          associationPathName: normalizedFieldBinding.associationPathName,
        },
        options.transaction,
      );
    }

    const result = {
      uid: tree.wrapperUid,
      wrapperUid: tree.wrapperUid,
      fieldUid: tree.innerUid,
      innerFieldUid: tree.innerUid,
      parentUid: container.parentUid,
      subKey: container.subKey,
      fieldUse: boundFieldCapability.fieldUse,
      ...(boundFieldCapability.renderer ? { renderer: boundFieldCapability.renderer } : {}),
      ...(isFilterFormItem && selectedFilterTarget?.ownerUid
        ? { defaultTargetUid: selectedFilterTarget.ownerUid }
        : {}),
      associationPathName: normalizedFieldBinding.associationPathName,
      fieldPath: normalizedFieldBinding.fieldPath,
    };
    await this.applyInlineFieldSettings('addField', result, inlineSettings, options);
    await this.applyInlineFieldPopup('addField', result, inlinePopup, options);
    await this.persistCreatedKeysForAction('addField', values, result, options.transaction);
    return result;
  }

  async addAction(
    values: Record<string, any>,
    options: {
      transaction?: any;
      enabledPackages?: ReadonlySet<string>;
      autoCompleteDefaultPopup?: boolean;
    } = {},
  ) {
    const target = this.normalizeWriteTarget('addAction', values?.target, values);
    ensureNoDirectActionScopeKey('addAction', values);
    ensureNoRawDirectAddKeys('addAction', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addAction', values.settings);
    const inlinePopup = this.normalizeInlinePopup('addAction', values.popup);
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const container = await this.surfaceContext.resolveActionContainer(target, options.transaction);
    if (getActionContainerScope(container.ownerUse) === 'record') {
      throwBadRequest(
        `flowSurfaces addAction target '${container.ownerUse}' is a record action surface, use addRecordAction`,
      );
    }
    const actionCatalogItem = this.resolveAddActionCatalogItem(
      {
        type: values.type,
        use: values.use,
        containerUse: container.ownerUse,
      },
      enabledPackages,
    );
    const resolvedScope = actionCatalogItem.scope;
    if (!resolvedScope) {
      throwInternalError(
        `flowSurfaces addAction '${actionCatalogItem.use}' is missing a resolved action scope`,
        'FLOW_SURFACE_ACTION_SCOPE_MISSING',
      );
    }
    if (inlinePopup && !POPUP_ACTION_USES.has(actionCatalogItem.use)) {
      throwBadRequest(`flowSurfaces addAction type '${actionCatalogItem.key}' does not support popup`);
    }
    assertRequestedActionScope({
      requestedScope: undefined,
      resolvedScope,
      containerUse: container.ownerUse,
      context: 'addAction',
    });
    const resourceContext = container.ownerUid
      ? await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null)
      : null;
    const action = buildActionTree({
      use: actionCatalogItem.use,
      containerUse: container.ownerUse,
      resourceInit: values.resourceInit || resourceContext?.resourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
      flowRegistry: values.flowRegistry,
    });
    this.contractGuard.validateNodeTreeAgainstContract(action);
    const created = await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...action,
      },
      { transaction: options.transaction },
    );
    await this.applyInlineNodeSettings('addAction', created, inlineSettings, options);
    await this.applyInlineActionPopup('addAction', created, inlinePopup, options);
    await this.syncFlowTemplateUsagesForNodeTree(created, options.transaction);
    const result = {
      uid: created,
      parentUid: container.parentUid,
      subKey: container.subKey,
      scope: actionCatalogItem.scope,
      ...(await this.collectComposeActionKeys(created, options.transaction)),
    };
    await this.persistCreatedKeysForAction('addAction', values, result, options.transaction);
    return result;
  }

  async addRecordAction(
    values: Record<string, any>,
    options: {
      transaction?: any;
      enabledPackages?: ReadonlySet<string>;
      autoCompleteDefaultPopup?: boolean;
    } = {},
  ) {
    const target = this.normalizeWriteTarget('addRecordAction', values?.target, values);
    ensureNoDirectActionScopeKey('addRecordAction', values);
    ensureNoRawDirectAddKeys('addRecordAction', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addRecordAction', values.settings);
    const inlinePopup = this.normalizeInlinePopup('addRecordAction', values.popup);
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const container = await this.resolveRecordActionContainer(target, options.transaction);
    const actionCatalogItem = this.resolveAddRecordActionCatalogItem(
      {
        type: values.type,
        use: values.use,
        containerUse: container.containerUse,
        ownerUse: container.ownerUse,
      },
      enabledPackages,
    );
    const resolvedScope = actionCatalogItem.scope;
    if (inlinePopup && !POPUP_ACTION_USES.has(actionCatalogItem.use)) {
      throwBadRequest(`flowSurfaces addRecordAction type '${actionCatalogItem.key}' does not support popup`);
    }
    assertRequestedActionScope({
      requestedScope: undefined,
      resolvedScope,
      containerUse: container.containerUse,
      context: 'addRecordAction',
    });
    const resourceContext = container.ownerUid
      ? await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null)
      : null;
    const action = buildActionTree({
      use: actionCatalogItem.use,
      containerUse: container.containerUse,
      resourceInit: values.resourceInit || resourceContext?.resourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
      flowRegistry: values.flowRegistry,
    });
    this.contractGuard.validateNodeTreeAgainstContract(action);
    const created = await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...action,
      },
      { transaction: options.transaction },
    );
    await this.applyInlineNodeSettings('addRecordAction', created, inlineSettings, options);
    await this.applyInlineActionPopup('addRecordAction', created, inlinePopup, options);
    await this.syncFlowTemplateUsagesForNodeTree(created, options.transaction);
    const result = {
      uid: created,
      parentUid: container.parentUid,
      subKey: container.subKey,
      scope: actionCatalogItem.scope,
      ...(await this.collectComposeActionKeys(created, options.transaction)),
    };
    await this.persistCreatedKeysForAction('addRecordAction', values, result, options.transaction);
    return result;
  }

  async addBlocks(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addBlocks',
      values,
      itemField: 'blocks',
      resultField: 'blocks',
      invoke: (itemValues, options) => this.addBlock(itemValues, options),
    });
  }

  async addFields(values: Record<string, any>) {
    if (!_.isUndefined(values?.template)) {
      const result = await this.transaction((transaction) =>
        this.addField(values, {
          transaction,
        }),
      );
      return {
        fields: [
          {
            index: 0,
            ok: true,
            result,
          },
        ],
        successCount: 1,
        errorCount: 0,
      };
    }
    return this.runBatchCreate({
      actionName: 'addFields',
      values,
      itemField: 'fields',
      resultField: 'fields',
      invoke: (itemValues, options) => this.addField(itemValues, options),
    });
  }

  async addActions(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addActions',
      values,
      itemField: 'actions',
      resultField: 'actions',
      invoke: (itemValues, options) => this.addAction(itemValues, options),
    });
  }

  async addRecordActions(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addRecordActions',
      values,
      itemField: 'recordActions',
      resultField: 'recordActions',
      invoke: (itemValues, options) => this.addRecordAction(itemValues, options),
    });
  }

  private normalizeInlineSettings(actionName: string, settings: any) {
    if (_.isUndefined(settings)) {
      return undefined;
    }
    if (!_.isPlainObject(settings)) {
      throwBadRequest(`flowSurfaces ${actionName} settings must be an object`);
    }
    return settings;
  }

  private normalizeInlinePopup(actionName: string, popup: any) {
    if (_.isUndefined(popup)) {
      return undefined;
    }
    if (!_.isPlainObject(popup)) {
      throwBadRequest(`flowSurfaces ${actionName} popup must be an object`);
    }
    return popup;
  }

  private peekInlineFieldSettingsOpenView(settings: Record<string, any> | undefined, wrapperUse?: string) {
    if (!settings || !Object.keys(settings).length) {
      return undefined;
    }
    const { fieldChanges } = splitComposeFieldChanges(settings, wrapperUse);
    return fieldChanges.openView;
  }

  private async assertOpenViewUidTarget(actionName: string, uid: string, options: { transaction?: any } = {}) {
    const targetNode = await this.repository.findModelById(uid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!targetNode?.uid) {
      throwBadRequest(`flowSurfaces ${actionName} openView.uid must reference an existing node`);
    }
    if (isPageModelUse(targetNode.use)) {
      throwBadRequest(
        `flowSurfaces ${actionName} openView.uid must not reference page or tab nodes, got '${targetNode.use}'`,
      );
    }

    const popupHostNode = await this.findPopupHostNode(uid, null, targetNode, options.transaction);
    if (popupHostNode?.uid && popupHostNode.uid !== targetNode.uid) {
      throwBadRequest(
        `flowSurfaces ${actionName} openView.uid must not reference popup subtree nodes, got '${targetNode.use}'`,
      );
    }
  }

  private normalizeFlowTemplateMode(actionName: string, mode: any, fieldName = 'template.mode') {
    const normalizedMode = String(mode || 'reference').trim() || 'reference';
    if (!FLOW_TEMPLATE_SUPPORTED_MODES.has(normalizedMode)) {
      throwBadRequest(
        `flowSurfaces ${actionName} ${fieldName} only supports 'reference' or 'copy'`,
        'FLOW_SURFACE_TEMPLATE_MODE_UNSUPPORTED',
      );
    }
    return normalizedMode as 'reference' | 'copy';
  }

  private normalizeFlowTemplateUsage(actionName: string, usage: any) {
    if (_.isUndefined(usage) || _.isNull(usage) || String(usage).trim() === '') {
      return 'block' as const;
    }
    const normalizedUsage = String(usage).trim();
    if (!FLOW_TEMPLATE_BLOCK_USAGES.has(normalizedUsage)) {
      throwBadRequest(
        `flowSurfaces ${actionName} template.usage only supports 'block' or 'fields'`,
        'FLOW_SURFACE_TEMPLATE_USAGE_UNSUPPORTED',
      );
    }
    return normalizedUsage as 'block' | 'fields';
  }

  private normalizeFlowTemplateReference(
    actionName: string,
    input: any,
    options: { allowUsage?: boolean; expectedType?: 'block' | 'popup' } = {},
  ) {
    if (!_.isPlainObject(input)) {
      throwBadRequest(`flowSurfaces ${actionName} template must be an object`, 'FLOW_SURFACE_TEMPLATE_INVALID');
    }
    const uid = String(input.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces ${actionName} template.uid is required`, 'FLOW_SURFACE_TEMPLATE_UID_REQUIRED');
    }
    const mode = this.normalizeFlowTemplateMode(actionName, input.mode);
    const usage = options.allowUsage ? this.normalizeFlowTemplateUsage(actionName, input.usage) : undefined;
    return {
      uid,
      mode,
      ...(usage ? { usage } : {}),
      ...(options.expectedType ? { expectedType: options.expectedType } : {}),
    };
  }

  private async getFlowTemplateOrThrow(
    actionName: string,
    templateUid: string,
    options: { transaction?: any; expectedType?: 'block' | 'popup' } = {},
  ) {
    const repo = this.getFlowTemplateRepository(actionName);
    const templateRecord = await repo.findOne({
      filter: { uid: templateUid },
      transaction: options.transaction,
    });
    if (!templateRecord) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${templateUid}' does not exist`,
        'FLOW_SURFACE_TEMPLATE_NOT_FOUND',
      );
    }
    const template = toTemplatePlainRow(templateRecord);
    const normalizedType = String(template.type || '').trim() || 'block';
    if (!FLOW_TEMPLATE_SUPPORTED_TYPES.has(normalizedType)) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${templateUid}' has unsupported type '${normalizedType}'`,
        'FLOW_SURFACE_TEMPLATE_TYPE_UNSUPPORTED',
      );
    }
    if (options.expectedType && normalizedType !== options.expectedType) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${templateUid}' must be type '${options.expectedType}', got '${normalizedType}'`,
        'FLOW_SURFACE_TEMPLATE_TYPE_MISMATCH',
      );
    }
    const targetUid = String(template.targetUid || '').trim();
    if (!targetUid) {
      throwBadRequest(
        `flowSurfaces ${actionName} template '${templateUid}' is missing targetUid`,
        'FLOW_SURFACE_TEMPLATE_TARGET_MISSING',
      );
    }
    return {
      ...template,
      type: normalizedType,
      targetUid,
      useModel: String(template.useModel || '').trim() || undefined,
      dataSourceKey: String(template.dataSourceKey || '').trim() || undefined,
      collectionName: String(template.collectionName || '').trim() || undefined,
      associationName: String(template.associationName || '').trim() || undefined,
      filterByTk: String(template.filterByTk || '').trim() || undefined,
      sourceId: String(template.sourceId || '').trim() || undefined,
    };
  }

  private buildPopupTemplateOpenView(template: any, mode: 'reference' | 'copy', uidValue: string) {
    const popupTemplateHasFilterByTk = !!String(template.filterByTk || '').trim();
    const popupTemplateHasSourceId =
      !!String(template.sourceId || '').trim() || !!String(template.associationName || '').trim();
    const base = buildDefinedPayload({
      uid: uidValue,
      dataSourceKey: template.dataSourceKey,
      collectionName: template.collectionName,
      associationName: template.associationName,
      ...(popupTemplateHasFilterByTk ? { filterByTk: template.filterByTk } : {}),
      ...(popupTemplateHasSourceId && template.sourceId ? { sourceId: template.sourceId } : {}),
      popupTemplateHasFilterByTk,
      popupTemplateHasSourceId,
      popupTemplateMode: mode,
    });
    if (mode === 'copy') {
      return {
        ...base,
        popupTemplateContext: true,
      };
    }
    return {
      ...base,
      popupTemplateUid: template.uid,
    };
  }

  private resolveExternalPopupHostUid(hostUid: string | undefined, openView: any) {
    const normalizedHostUid = String(hostUid || '').trim();
    if (!normalizedHostUid || !_.isPlainObject(openView)) {
      return undefined;
    }
    const externalUid = String(openView.uid || '').trim();
    if (!externalUid || externalUid === normalizedHostUid) {
      return undefined;
    }
    return externalUid;
  }

  private resolveDetachedPopupCopyUid(hostUid: string | undefined, openView: any) {
    if (!_.isPlainObject(openView) || !openView.popupTemplateContext) {
      return undefined;
    }
    return this.resolveExternalPopupHostUid(hostUid, openView);
  }

  private async cleanupLocalPopupSurfaceForHost(hostUid: string | undefined, transaction?: any, hostNode?: any) {
    const normalizedHostUid = String(hostUid || '').trim();
    if (!normalizedHostUid) {
      return;
    }
    const resolvedHost =
      hostNode ||
      (await this.repository.findModelById(normalizedHostUid, {
        transaction,
        includeAsyncNode: true,
      }));
    const localPopupPageUid = String(resolvedHost?.subModels?.page?.uid || '').trim();
    if (!localPopupPageUid) {
      return;
    }
    await this.removeNodeTreeWithBindings(localPopupPageUid, transaction);
  }

  private async reconcilePopupOpenViewTransition(
    hostUid: string | undefined,
    currentOpenView: any,
    nextOpenView: any,
    transaction?: any,
  ) {
    const currentDetachedPopupCopyUid = this.resolveDetachedPopupCopyUid(hostUid, currentOpenView);
    const nextDetachedPopupCopyUid = this.resolveDetachedPopupCopyUid(hostUid, nextOpenView);
    if (currentDetachedPopupCopyUid && currentDetachedPopupCopyUid !== nextDetachedPopupCopyUid) {
      await this.removeNodeTreeWithBindings(currentDetachedPopupCopyUid, transaction);
    }
    if (this.resolveExternalPopupHostUid(hostUid, nextOpenView)) {
      await this.cleanupLocalPopupSurfaceForHost(hostUid, transaction);
    }
  }

  private async normalizeOpenView(
    actionName: string,
    openView: any,
    options: { transaction?: any; popupTemplateHostUid?: string } = {},
  ) {
    if (_.isUndefined(openView) || _.isNull(openView)) {
      return openView;
    }
    if (!_.isPlainObject(openView)) {
      throwBadRequest(`flowSurfaces ${actionName} openView must be an object`);
    }
    const normalizedOpenView = _.cloneDeep(openView);
    if (!_.isUndefined(normalizedOpenView.template)) {
      const templateRef = this.normalizeFlowTemplateReference(actionName, normalizedOpenView.template, {
        expectedType: 'popup',
      });
      const template = await this.getFlowTemplateOrThrow(actionName, templateRef.uid, {
        transaction: options.transaction,
        expectedType: 'popup',
      });
      await this.assertPopupTemplateCompatibility(
        actionName,
        options.popupTemplateHostUid,
        template,
        options.transaction,
      );
      const resolvedUid =
        templateRef.mode === 'copy'
          ? String(
              (await this.duplicateDetachedFlowModelTree(actionName, template.targetUid, options.transaction))?.uid ||
                '',
            )
          : template.targetUid;
      if (!resolvedUid) {
        throwConflict(
          `flowSurfaces ${actionName} failed to duplicate popup template '${template.uid}'`,
          'FLOW_SURFACE_TEMPLATE_COPY_FAILED',
        );
      }
      if (templateRef.mode === 'copy') {
        await this.ensurePopupSurface(resolvedUid, options.transaction);
      }
      const nextTemplateOpenView = this.buildPopupTemplateOpenView(template, templateRef.mode, resolvedUid);
      Object.keys(normalizedOpenView).forEach((key) => {
        if (
          key === 'template' ||
          key === 'popupTemplateUid' ||
          key === 'popupTemplateMode' ||
          key === 'popupTemplateContext' ||
          key === 'popupTemplateHasFilterByTk' ||
          key === 'popupTemplateHasSourceId'
        ) {
          delete normalizedOpenView[key];
        }
      });
      Object.assign(normalizedOpenView, nextTemplateOpenView);
    }
    if (!_.isUndefined(normalizedOpenView.uid)) {
      const normalizedUid = String(normalizedOpenView.uid || '').trim();
      if (!normalizedUid) {
        throwBadRequest(`flowSurfaces ${actionName} openView.uid cannot be empty`);
      }
      normalizedOpenView.uid = normalizedUid;
      await this.assertOpenViewUidTarget(actionName, normalizedUid, options);
    }
    if (!_.isUndefined(normalizedOpenView.mode)) {
      const rawMode = String(normalizedOpenView.mode || '').trim();
      if (!rawMode) {
        throwBadRequest(`flowSurfaces ${actionName} openView.mode cannot be empty`);
      }
      const canonicalMode = OPEN_VIEW_MODE_ALIASES[rawMode as keyof typeof OPEN_VIEW_MODE_ALIASES] || rawMode;
      if (!OPEN_VIEW_SUPPORTED_MODES.has(canonicalMode)) {
        throwBadRequest(`flowSurfaces ${actionName} openView.mode only supports 'drawer', 'dialog' or 'embed'`);
      }
      normalizedOpenView.mode = canonicalMode;
    }
    return normalizedOpenView;
  }

  private isExternalPopupOpenView(openView: any, hostUid?: string) {
    if (!_.isPlainObject(openView)) {
      return false;
    }
    const openViewUid = String(openView.uid || '').trim();
    return !!openViewUid && openViewUid !== hostUid;
  }

  private async loadFieldHostNodes(fieldHostUid: string, transaction?: any) {
    const fieldNode = await this.repository.findModelById(fieldHostUid, {
      transaction,
      includeAsyncNode: true,
    });
    const wrapperUid = fieldNode?.uid ? await this.locator.findParentUid(fieldNode.uid, transaction) : null;
    const wrapperNode = wrapperUid
      ? await this.repository.findModelById(wrapperUid, {
          transaction,
          includeAsyncNode: true,
        })
      : null;
    return {
      fieldNode,
      wrapperNode,
    };
  }

  private resolveFieldOpenViewContext(fieldNode: any, wrapperNode: any) {
    const fieldInit = fieldNode?.stepParams?.fieldSettings?.init || wrapperNode?.stepParams?.fieldSettings?.init || {};
    const dataSourceKey = String(fieldInit.dataSourceKey || 'main').trim() || 'main';
    const collectionName = String(fieldInit.collectionName || '').trim() || undefined;
    const fieldPath = String(fieldInit.fieldPath || '').trim();
    const associationPathName = String(fieldInit.associationPathName || '').trim() || undefined;

    if (!collectionName) {
      return {};
    }
    if (!fieldPath) {
      return {
        dataSourceKey,
        collectionName,
      };
    }

    const collection = this.getCollection(dataSourceKey, collectionName);
    if (!collection) {
      return {
        dataSourceKey,
        collectionName,
      };
    }

    const associationContext = this.resolveFieldAssociationContextFromBinding({
      collection,
      fieldPath,
      associationPathName,
      dataSourceKey,
      collectionName,
    });

    return buildDefinedPayload({
      dataSourceKey: associationContext.dataSourceKey,
      collectionName: associationContext.collectionName,
      associationName: associationContext.associationName,
    });
  }

  private applyFieldOpenViewContext(fieldNode: any, wrapperNode: any, openView: any) {
    if (!_.isPlainObject(openView)) {
      return openView;
    }
    const fieldOpenViewContext = this.resolveFieldOpenViewContext(fieldNode, wrapperNode);
    const hasExplicitAssociationName = Object.prototype.hasOwnProperty.call(openView, 'associationName');
    const explicitAssociationName = hasExplicitAssociationName
      ? openView.associationName == null
        ? null
        : String(openView.associationName).trim() || null
      : undefined;
    const normalizedDataSourceKey = String(openView.dataSourceKey || '').trim() || undefined;
    const normalizedCollectionName = String(openView.collectionName || '').trim() || undefined;
    const shouldPreserveAssociationName =
      !hasExplicitAssociationName &&
      !!fieldOpenViewContext.associationName &&
      !this.isExternalPopupOpenView(openView, fieldNode?.uid) &&
      (!normalizedDataSourceKey || normalizedDataSourceKey === fieldOpenViewContext.dataSourceKey) &&
      (!normalizedCollectionName || normalizedCollectionName === fieldOpenViewContext.collectionName);
    return buildDefinedPayload({
      ...(shouldPreserveAssociationName ? fieldOpenViewContext : _.omit(fieldOpenViewContext, ['associationName'])),
      ...openView,
      ...(hasExplicitAssociationName
        ? { associationName: explicitAssociationName }
        : shouldPreserveAssociationName
          ? { associationName: fieldOpenViewContext.associationName }
          : {}),
    });
  }

  private buildDefaultFieldOpenView(fieldNode: any, wrapperNode: any) {
    const openViewBase = {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
    };
    return buildDefinedPayload({
      ...openViewBase,
      ...this.resolveFieldOpenViewContext(fieldNode, wrapperNode),
    });
  }

  private async ensureLocalFieldPopupSurface(
    actionName: string,
    fieldHostUid: string | undefined,
    options: { transaction?: any },
    input: {
      popup?: Record<string, any>;
    } = {},
  ) {
    if (!fieldHostUid) {
      return {};
    }

    let { fieldNode, wrapperNode } = await this.loadFieldHostNodes(fieldHostUid, options.transaction);
    if (!fieldNode?.uid) {
      return {};
    }
    if (input.popup && !this.isPopupFieldHostUse(fieldNode.use)) {
      throwBadRequest(`flowSurfaces ${actionName} field '${fieldNode.use}' does not support popup`);
    }

    let openView = this.resolvePopupHostOpenView(fieldNode);
    if (input.popup && this.isExternalPopupOpenView(openView, fieldHostUid)) {
      throwBadRequest(`flowSurfaces ${actionName} popup cannot be combined with external openView.uid`);
    }

    if (input.popup && !_.isPlainObject(openView)) {
      await this.configure(
        {
          target: {
            uid: fieldHostUid,
          },
          changes: {
            clickToOpen: true,
            openView: this.buildDefaultFieldOpenView(fieldNode, wrapperNode),
          },
        },
        options,
      );
      const reloaded = await this.loadFieldHostNodes(fieldHostUid, options.transaction);
      fieldNode = reloaded.fieldNode;
      wrapperNode = reloaded.wrapperNode;
      openView = this.resolvePopupHostOpenView(fieldNode);
    }

    if (!_.isPlainObject(openView) || this.isExternalPopupOpenView(openView, fieldHostUid)) {
      return {};
    }

    return this.collectPopupSurfaceKeys(
      fieldHostUid,
      options.transaction,
      await this.ensurePopupSurface(fieldHostUid, options.transaction),
    );
  }

  private async applyInlineNodeSettings(
    actionName: string,
    targetUid: string | undefined,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    if (!targetUid || !settings || !Object.keys(settings).length) {
      return;
    }
    try {
      await this.configure(
        {
          target: {
            uid: targetUid,
          },
          changes: settings,
        },
        options,
      );
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} settings invalid`);
    }
  }

  private assertInlinePopupTemplateConflict(actionName: string, popup: Record<string, any>) {
    const forbiddenKeys = ['blocks', 'layout', 'mode'].filter((key) => !_.isUndefined(popup[key]));
    if (forbiddenKeys.length) {
      throwBadRequest(
        `flowSurfaces ${actionName} popup.template cannot be combined with ${forbiddenKeys.join(', ')}`,
        'FLOW_SURFACE_TEMPLATE_POPUP_CONFLICT',
      );
    }
  }

  private async applyInlineFieldPopup(
    actionName: string,
    result: FlowSurfaceAddFieldResult,
    popup: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    const fieldHostUid = result.fieldUid || result.uid;
    if (!_.isUndefined(popup?.template)) {
      this.assertInlinePopupTemplateConflict(actionName, popup);
      Object.assign(
        result,
        await this.configureFieldNode(
          {
            uid: fieldHostUid,
          },
          {
            openView: {
              template: popup.template,
            },
          },
          {
            ...options,
            openViewActionName: actionName,
          },
        ),
      );
      return;
    }
    try {
      Object.assign(result, await this.ensureLocalFieldPopupSurface(actionName, fieldHostUid, options, { popup }));
      if (!popup || !fieldHostUid) {
        return;
      }
      await this.compose(
        {
          target: {
            uid: fieldHostUid,
          },
          mode: popup.mode || 'replace',
          blocks: popup.blocks || [],
          layout: popup.layout,
        },
        options,
      );
      Object.assign(result, await this.collectPopupSurfaceKeys(fieldHostUid, options.transaction));
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} popup invalid`);
    }
  }

  private async applyInlineFieldSettings(
    actionName: string,
    result: FlowSurfaceAddFieldResult,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    if (!settings || !Object.keys(settings).length) {
      return;
    }
    if (!result.wrapperUid || !result.fieldUid) {
      await this.applyInlineStandaloneFieldSettings(actionName, result.uid, settings, options);
      return;
    }
    try {
      const wrapperNode = await this.repository.findModelById(result.wrapperUid, {
        transaction: options.transaction,
        includeAsyncNode: true,
      });
      const { wrapperChanges, fieldChanges } = splitComposeFieldChanges(settings, wrapperNode?.use);
      if (Object.keys(wrapperChanges).length) {
        await this.configure(
          {
            target: {
              uid: result.wrapperUid,
            },
            changes: wrapperChanges,
          },
          options,
        );
      }
      if (Object.keys(fieldChanges).length) {
        await this.configure(
          {
            target: {
              uid: result.fieldUid,
            },
            changes: fieldChanges,
          },
          options,
        );
      }
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} settings invalid`);
    }
  }

  private async applyInlineStandaloneFieldSettings(
    actionName: string,
    targetUid: string | undefined,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    await this.applyInlineNodeSettings(actionName, targetUid, settings, options);
  }

  private getActionButtonTitle(actionNode: any) {
    const rawTitle =
      actionNode?.props?.title ?? _.get(actionNode, ['stepParams', 'buttonSettings', 'general', 'title']);
    if (_.isUndefined(rawTitle) || _.isNull(rawTitle)) {
      return undefined;
    }
    const normalizedTitle = String(rawTitle).trim();
    return normalizedTitle || undefined;
  }

  private isSemanticallyEmptyInlinePopup(popup: Record<string, any> | undefined) {
    if (!_.isPlainObject(popup)) {
      return false;
    }
    return !hasFlowSurfaceInlinePopupTemplate(popup) && !hasFlowSurfaceInlinePopupBlocks(popup);
  }

  private shouldAutoCompleteDefaultActionPopup(
    actionNode: any,
    popup: Record<string, any> | undefined,
    options: { autoCompleteDefaultPopup?: boolean } = {},
  ) {
    if (options.autoCompleteDefaultPopup === false) {
      return false;
    }
    if (!isFlowSurfaceDefaultActionPopupUse(actionNode?.use)) {
      return false;
    }
    const openView = this.resolvePopupHostOpenView(actionNode);
    if (this.isExternalPopupOpenView(openView, actionNode?.uid)) {
      return false;
    }
    if (!_.isUndefined(popup) && !this.isSemanticallyEmptyInlinePopup(popup)) {
      return false;
    }
    return true;
  }

  private buildDefaultActionPopupFieldPaths(input: {
    actionUse: string;
    popupProfile: FlowSurfacePopupBlockProfile | null;
  }) {
    const collectionName = String(input.popupProfile?.collectionName || '').trim();
    if (!collectionName) {
      return [];
    }
    const actionConfig = getFlowSurfaceDefaultActionPopupConfigByUse(input.actionUse);
    if (!actionConfig) {
      return [];
    }
    const mode = actionConfig.blockUse === 'DetailsBlockModel' ? 'details' : 'form';
    const directCandidates = this.buildFieldMenuDirectCandidates({
      mode,
      ownerUse: actionConfig.blockUse,
      resourceInit: {
        dataSourceKey: input.popupProfile?.dataSourceKey || 'main',
        collectionName,
      },
    });
    return pickFlowSurfaceDefaultActionPopupFieldPaths(directCandidates, {
      excludeAuditTimestampFields: mode === 'form',
    });
  }

  private buildDefaultActionPopupNamespace(actionNode: any) {
    if (!actionNode?.uid) {
      return undefined;
    }
    return normalizeFlowSurfaceComposeKey(
      `defaultPopup_${actionNode.uid}`,
      `flowSurfaces default popup for action '${actionNode?.uid || 'unknown'}'`,
    );
  }

  private buildDefaultActionPopupKeyMap(actionNode: any, namespace?: string) {
    const actionConfig = getFlowSurfaceDefaultActionPopupConfigByUse(actionNode?.use);
    if (!actionConfig || !namespace) {
      return new Map<string, string>();
    }
    const keyMap = new Map<string, string>();
    keyMap.set(actionConfig.blockKey, `${namespace}.${actionConfig.blockKey}`);
    if (actionConfig.submitAction?.key) {
      keyMap.set(actionConfig.submitAction.key, `${namespace}.${actionConfig.submitAction.key}`);
    }
    return keyMap;
  }

  private remapDefaultActionPopupField(field: any, namespace: string, context: string) {
    if (typeof field === 'string') {
      const fieldPath = field.trim();
      if (!fieldPath) {
        return field;
      }
      return {
        key: normalizeFlowSurfaceComposeKey(`${namespace}.${fieldPath}`, `${context}.key`),
        fieldPath,
      };
    }
    if (!_.isPlainObject(field)) {
      return _.cloneDeep(field);
    }
    const rawKey =
      (typeof field.key === 'string' && field.key.trim()) ||
      (typeof field.fieldPath === 'string' && field.fieldPath.trim()) ||
      (typeof field.type === 'string' && field.type.trim()) ||
      '';
    if (!rawKey) {
      return _.cloneDeep(field);
    }
    return {
      ..._.cloneDeep(field),
      key: normalizeFlowSurfaceComposeKey(`${namespace}.${rawKey}`, `${context}.key`),
    };
  }

  private remapDefaultActionPopupBlocks(blocks: any[], keyMap: ReadonlyMap<string, string>, namespace?: string) {
    return _.castArray(blocks || []).map((block) => {
      const blockKey = typeof block?.key === 'string' ? block.key.trim() : '';
      const remappedActions = _.castArray(block?.actions || []).map((action: any) => {
        const actionKey = typeof action?.key === 'string' ? action.key.trim() : '';
        if (!actionKey || !keyMap.has(actionKey)) {
          return _.cloneDeep(action);
        }
        return {
          ..._.cloneDeep(action),
          key: keyMap.get(actionKey),
        };
      });
      const remappedFields = _.castArray(block?.fields || []).map((field: any, fieldIndex: number) => {
        if (!namespace) {
          return _.cloneDeep(field);
        }
        return this.remapDefaultActionPopupField(
          field,
          namespace,
          `flowSurfaces default popup block '${blockKey || block?.type || 'unknown'}' field #${fieldIndex + 1}`,
        );
      });
      return _.pickBy(
        {
          ..._.cloneDeep(block),
          key: blockKey && keyMap.has(blockKey) ? keyMap.get(blockKey) : block?.key,
          fields: remappedFields.length ? remappedFields : undefined,
          actions: remappedActions.length ? remappedActions : undefined,
        },
        (value) => !_.isUndefined(value),
      );
    });
  }

  private remapDefaultActionPopupLayout(layout: Record<string, any> | undefined, keyMap: ReadonlyMap<string, string>) {
    if (!layout || !keyMap.size) {
      return layout;
    }
    const nextLayout = _.cloneDeep(layout);
    nextLayout.rows = _.castArray(nextLayout.rows || []).map((row: any) =>
      _.castArray(row || []).map((cell: any) => {
        if (typeof cell === 'string') {
          const normalized = cell.trim();
          return keyMap.get(normalized) || cell;
        }
        if (_.isPlainObject(cell) && typeof cell.key === 'string') {
          const normalized = cell.key.trim();
          if (keyMap.has(normalized)) {
            return {
              ...cell,
              key: keyMap.get(normalized),
            };
          }
        }
        return cell;
      }),
    );
    return nextLayout;
  }

  private buildDefaultActionPopupBlocks(
    actionNode: any,
    popupProfile: FlowSurfacePopupBlockProfile | null,
    keyMap: ReadonlyMap<string, string>,
    namespace?: string,
  ) {
    const fieldPaths = this.buildDefaultActionPopupFieldPaths({
      actionUse: actionNode?.use,
      popupProfile,
    });
    return this.remapDefaultActionPopupBlocks(
      buildFlowSurfaceDefaultActionPopupBlocks(actionNode?.use, fieldPaths),
      keyMap,
      namespace,
    );
  }

  private buildDefaultActionPopupComposeValues(
    actionNode: any,
    popupProfile: FlowSurfacePopupBlockProfile,
    popup: Record<string, any> | undefined,
  ) {
    const namespace = this.buildDefaultActionPopupNamespace(actionNode);
    const keyMap = this.buildDefaultActionPopupKeyMap(actionNode, namespace);
    return {
      target: {
        uid: actionNode.uid,
      },
      mode: popup?.mode || 'replace',
      blocks: this.buildDefaultActionPopupBlocks(actionNode, popupProfile, keyMap, namespace),
      layout: this.remapDefaultActionPopupLayout(popup?.layout, keyMap),
    };
  }

  private async resolveDefaultActionPopupSurfaceState(actionUid: string, transaction?: any) {
    const refreshedActionNode = await this.repository.findModelById(actionUid, {
      transaction,
      includeAsyncNode: true,
    });
    const popupPage = getSingleNodeSubModel(refreshedActionNode?.subModels?.page);
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGrid = getSingleNodeSubModel(popupTab?.subModels?.grid);
    const popupBlock = getNodeSubModelList(popupGrid?.subModels?.items)[0];
    return {
      actionNode: refreshedActionNode,
      popupTab,
      popupBlock,
    };
  }

  private shouldResetDefaultActionPopupFormLinkageRules(popupBlock: any) {
    if (!SIMPLE_FORM_BLOCK_USES.has(popupBlock?.use || '') || !popupBlock?.uid) {
      return false;
    }
    const linkageRules = _.get(popupBlock, ['stepParams', 'eventSettings', 'linkageRules', 'value']);
    return !Array.isArray(linkageRules) || linkageRules.length > 0;
  }

  private async resetDefaultActionPopupFormLinkageRules(popupBlock: any, options: { transaction?: any }) {
    if (!this.shouldResetDefaultActionPopupFormLinkageRules(popupBlock)) {
      return;
    }
    await this.updateSettings(
      {
        target: {
          uid: popupBlock.uid,
        },
        stepParams: {
          eventSettings: {
            linkageRules: {
              value: [],
            },
          },
        },
      },
      options,
    );
  }

  private resolvePopupTabTitle(tabNode: any) {
    const rawTitle = tabNode?.props?.title ?? _.get(tabNode, ['stepParams', 'pageTabSettings', 'tab', 'title']);
    if (_.isUndefined(rawTitle) || _.isNull(rawTitle)) {
      return undefined;
    }
    const normalizedTitle = String(rawTitle).trim();
    return normalizedTitle || undefined;
  }

  private async syncDefaultActionPopupTabTitle(actionNode: any, popupTab: any, options: { transaction?: any }) {
    const popupTabTitle = resolveFlowSurfaceDefaultActionPopupTabTitle(
      actionNode?.use,
      this.getActionButtonTitle(actionNode),
    );
    if (!popupTab?.uid || !popupTabTitle || this.resolvePopupTabTitle(popupTab) === popupTabTitle) {
      return;
    }
    await this.updatePopupTab(
      {
        target: {
          uid: popupTab.uid,
        },
        title: popupTabTitle,
      },
      options,
    );
  }

  private async applyDefaultActionPopupContent(
    actionNode: any,
    popup: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    const popupProfile = await this.resolvePopupBlockProfile(actionNode.uid, null, actionNode, options.transaction);
    if (!popupProfile?.isPopupSurface) {
      return;
    }

    await this.compose(this.buildDefaultActionPopupComposeValues(actionNode, popupProfile, popup), options);

    const popupState = await this.resolveDefaultActionPopupSurfaceState(actionNode.uid, options.transaction);
    await this.resetDefaultActionPopupFormLinkageRules(popupState.popupBlock, options);
    await this.syncDefaultActionPopupTabTitle(popupState.actionNode || actionNode, popupState.popupTab, options);
  }

  private async applyInlineActionPopup(
    actionName: string,
    actionUid: string,
    popup: Record<string, any> | undefined,
    options: { transaction?: any; autoCompleteDefaultPopup?: boolean },
  ) {
    const actionNode = await this.repository.findModelById(actionUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    if (!actionNode?.uid) {
      throwBadRequest(`flowSurfaces ${actionName} action '${actionUid}' does not exist`);
    }

    const openView = this.resolvePopupHostOpenView(actionNode);
    if (this.isExternalPopupOpenView(openView, actionNode?.uid)) {
      if (_.isUndefined(popup) || this.isSemanticallyEmptyInlinePopup(popup)) {
        return;
      }
      throwBadRequest(`flowSurfaces ${actionName} popup cannot be combined with external openView.uid`);
    }

    if (popup && hasFlowSurfaceInlinePopupTemplate(popup)) {
      this.assertInlinePopupTemplateConflict(actionName, popup);
      await this.configureActionNode(
        {
          uid: actionUid,
        },
        actionNode.use,
        {
          openView: {
            template: popup.template,
          },
        },
        {
          ...options,
          openViewActionName: actionName,
        },
      );
      return;
    }
    const shouldAutoCompleteDefaultPopup = this.shouldAutoCompleteDefaultActionPopup(actionNode, popup, options);
    if (_.isUndefined(popup) && !shouldAutoCompleteDefaultPopup) {
      return;
    }

    try {
      if (shouldAutoCompleteDefaultPopup) {
        await this.applyDefaultActionPopupContent(actionNode, popup, options);
      } else if (!_.isUndefined(popup)) {
        await this.compose(
          {
            target: {
              uid: actionUid,
            },
            mode: popup.mode || 'replace',
            blocks: popup.blocks || [],
            layout: popup.layout,
          },
          options,
        );
      }
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} popup invalid`);
    }
  }

  async updateSettings(
    values: Record<string, any>,
    options: {
      transaction?: any;
      replaceChartCardSettings?: boolean;
      openViewActionName?: string;
      popupTemplateHostUid?: string;
    } = {},
  ) {
    validateFlowSurfacePayloadShape('updateSettings', values, 'values');
    const writeTarget = this.normalizeWriteTarget('updateSettings', values?.target, values);
    const target = await this.locator.resolve(writeTarget, options);
    const current = await this.loadResolvedNode(target, options.transaction);
    const contract = getNodeContract(current.use);
    const nextPayload: Record<string, any> = { uid: current.uid };

    (['props', 'decoratorProps', 'stepParams', 'flowRegistry'] as FlowSurfaceNodeDomain[]).forEach((domain) => {
      if (typeof values[domain] === 'undefined') {
        return;
      }
      if (!contract.editableDomains.includes(domain)) {
        throwBadRequest(`flowSurfaces updateSettings domain '${domain}' is not editable`);
      }
      const domainContract = contract.domains[domain];
      if (!domainContract) {
        throwBadRequest(`flowSurfaces updateSettings domain '${domain}' is not supported by '${current.use}'`);
      }
      nextPayload[domain] = this.contractGuard.mergeDomainValue(
        domain,
        current[domain],
        values[domain],
        domainContract,
        current.use,
      );
    });

    this.syncMirroredStepParamsForUpdateSettings(current, nextPayload);
    await this.normalizeOpenViewForUpdateSettings(
      options.openViewActionName || 'updateSettings',
      current,
      nextPayload,
      {
        transaction: options.transaction,
        popupTemplateHostUid: options.popupTemplateHostUid,
      },
    );
    this.syncChartConfigureForUpdateSettings(current, nextPayload);
    await this.validateChartConfigureForUpdateSettings(current, nextPayload, options.transaction);
    this.syncChartCardRuntimeStepParamsForUpdateSettings(
      current,
      nextPayload,
      options.replaceChartCardSettings ? _.get(values, ['stepParams', 'cardSettings']) : undefined,
    );
    this.stripLegacyChartCardChromeForUpdateSettings(current, nextPayload);

    const effectiveNode = {
      ...current,
      props: nextPayload.props ?? current.props,
      decoratorProps: nextPayload.decoratorProps ?? current.decoratorProps,
      stepParams: nextPayload.stepParams ?? current.stepParams,
      flowRegistry: nextPayload.flowRegistry ?? current.flowRegistry,
    };
    const shouldValidateFlowRegistry =
      !_.isUndefined(nextPayload.flowRegistry) || !_.isUndefined(nextPayload.stepParams);

    if (
      shouldValidateFlowRegistry &&
      _.isPlainObject(effectiveNode.flowRegistry) &&
      Object.keys(effectiveNode.flowRegistry).length
    ) {
      this.contractGuard.validateFlowRegistry(effectiveNode, effectiveNode.flowRegistry);
    }

    if (Object.keys(nextPayload).length === 1) {
      return { uid: current.uid };
    }

    if (target.kind === 'tab' && target.tabRoute) {
      await this.routeSync.persistTabSettings(target, current, nextPayload, options.transaction);
      return {
        uid: current.uid,
        updated: Object.keys(_.omit(nextPayload, ['uid'])),
      };
    }

    if (target.kind === 'page' && target.pageRoute) {
      await this.routeSync.persistPageSettings(target, current, nextPayload, options.transaction);
      return {
        uid: current.uid,
        updated: Object.keys(_.omit(nextPayload, ['uid'])),
      };
    }

    await this.repository.patch(nextPayload, { transaction: options.transaction });
    if (!_.isUndefined(nextPayload.stepParams?.fieldSettings)) {
      await this.syncFieldBindingSettingsForNode(current, effectiveNode, options.transaction);
    } else if (current.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(effectiveNode, options.transaction);
    } else if (current.use === 'ChartBlockModel' && !_.isUndefined(nextPayload.stepParams?.chartSettings)) {
      await this.syncChartDataBindingsForNode(effectiveNode, options.transaction);
    }
    await this.syncFlowTemplateUsagesForNodeTree(current.uid, options.transaction);
    return {
      uid: current.uid,
      updated: Object.keys(_.omit(nextPayload, ['uid'])),
    };
  }

  private syncMirroredStepParamsForUpdateSettings(current: any, nextPayload: Record<string, any>) {
    const mirrors = UPDATE_SETTINGS_STEP_PARAM_MIRRORS_BY_USE[current?.use || ''];
    if (!mirrors?.length) {
      return;
    }

    let nextStepParams: Record<string, any> | undefined;

    for (const mirror of mirrors) {
      const domainPayload = nextPayload[mirror.domain];
      if (!_.isPlainObject(domainPayload) || !Object.prototype.hasOwnProperty.call(domainPayload, mirror.key)) {
        continue;
      }

      const value = domainPayload[mirror.key];
      if (_.isUndefined(value)) {
        continue;
      }

      nextStepParams = nextStepParams ?? _.cloneDeep(nextPayload.stepParams ?? current?.stepParams ?? {});
      if (_.has(nextStepParams, mirror.stepParamsPath)) {
        continue;
      }
      _.set(nextStepParams, mirror.stepParamsPath, value);
    }

    if (nextStepParams) {
      nextPayload.stepParams = nextStepParams;
    }
  }

  private async normalizeOpenViewForUpdateSettings(
    actionName: string,
    current: any,
    nextPayload: Record<string, any>,
    options: { transaction?: any; popupTemplateHostUid?: string } = {},
  ) {
    const openViewPaths: Array<[string, string]> = [
      ['popupSettings', 'openView'],
      ['selectExitRecordSettings', 'openView'],
    ];
    const popupTemplateHostUid = String(options.popupTemplateHostUid || current?.uid || '').trim() || undefined;
    for (const [flowKey, stepKey] of openViewPaths) {
      if (!_.has(nextPayload, ['stepParams', flowKey, stepKey])) {
        continue;
      }
      const currentOpenView = _.get(current, ['stepParams', flowKey, stepKey]);
      const nextOpenView = await this.normalizeOpenView(
        actionName,
        _.get(nextPayload, ['stepParams', flowKey, stepKey]),
        {
          transaction: options.transaction,
          popupTemplateHostUid,
        },
      );
      await this.reconcilePopupOpenViewTransition(
        popupTemplateHostUid,
        currentOpenView,
        nextOpenView,
        options.transaction,
      );
      _.set(nextPayload, ['stepParams', flowKey, stepKey], nextOpenView);
    }
  }

  private syncChartConfigureForUpdateSettings(current: any, nextPayload: Record<string, any>) {
    if (current?.use !== 'ChartBlockModel') {
      return;
    }
    const nextConfigure = _.get(nextPayload, ['stepParams', 'chartSettings', 'configure']);
    if (_.isUndefined(nextConfigure)) {
      return;
    }
    _.set(nextPayload, ['stepParams', 'chartSettings', 'configure'], canonicalizeChartConfigure(nextConfigure));
  }

  private async validateChartConfigureForUpdateSettings(
    current: any,
    nextPayload: Record<string, any>,
    transaction?: any,
  ) {
    if (current?.use !== 'ChartBlockModel') {
      return;
    }

    const configure = _.get(nextPayload, ['stepParams', 'chartSettings', 'configure']);
    if (!_.isPlainObject(configure)) {
      return;
    }

    const state = deriveChartSemanticState(configure);
    if (state.query?.mode !== 'sql') {
      return;
    }

    const sqlPreview = await this.resolveSqlChartPreview(state.query, transaction);
    if (state.visual?.mode !== 'basic') {
      return;
    }

    if (!sqlPreview.queryOutputs?.length) {
      throwBadRequest(
        "chart visual.mode='basic' requires previewable SQL query outputs; write query first, then read flowSurfaces:context(path='chart'), or use visual.mode='custom' after browser verification",
      );
    }

    const supportedOutputs = new Set(
      sqlPreview.queryOutputs.map((output) => String(output?.alias || '').trim()).filter(Boolean),
    );

    for (const mappingField of getChartVisualMappingAliases(state.visual)) {
      if (!supportedOutputs.has(mappingField)) {
        throwBadRequest(
          `chart visual mappings only support SQL query output fields: ${Array.from(supportedOutputs).join(', ')}`,
        );
      }
    }
  }

  private stripChartSqlForInspection(sql: string) {
    return sql
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--[^\r\n]*/g, ' ')
      .replace(/'(?:''|[^'])*'/g, "''")
      .replace(/"(?:[""]|[^"])*"/g, '""');
  }

  private normalizeReadOnlyChartSql(sql: string) {
    const normalized = (typeof sql === 'string' ? sql : '').trim();
    const inspected = this.stripChartSqlForInspection(normalized)
      .replace(/;+\s*$/, '')
      .trim();
    if (!inspected) {
      throwBadRequest('chart query.sql cannot be empty');
    }
    if (inspected.includes(';')) {
      throwBadRequest('chart query.sql must be a single read-only SELECT statement');
    }
    if (!/^(with|select)\b/i.test(inspected)) {
      throwBadRequest('chart query.sql must start with SELECT or WITH');
    }
    if (
      /\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|merge|call|execute)\b/i.test(inspected)
    ) {
      throwBadRequest('chart query.sql must be read-only');
    }
    return normalized.replace(/;+\s*$/, '').trim();
  }

  private buildChartSqlPreviewQuery(sql: string) {
    return `SELECT * FROM (${sql}) AS __flow_surfaces_chart_preview LIMIT 1`;
  }

  private buildChartSqlPreviewMetadataQuery(sql: string) {
    return `SELECT * FROM (${sql}) AS __flow_surfaces_chart_preview LIMIT 0`;
  }

  private async runChartSqlPreviewRaw(db: any, sql: string, bind: any, transaction?: any) {
    if (typeof db?.runSQLWithSchema === 'function') {
      return db.runSQLWithSchema(sql, bind, transaction);
    }
    if (db?.sequelize?.query) {
      return db.sequelize.query(sql, { bind, transaction });
    }
    throwBadRequest('chart SQL preview is unavailable for the target data source');
  }

  private extractSqlChartPreviewAliases(metadata: any): string[] {
    const pickName = (field: any): string | undefined =>
      [field?.name, field?.columnName, field?.fieldName]
        .find((value): value is string => typeof value === 'string' && !!value.trim())
        ?.trim();

    if (Array.isArray(metadata)) {
      return Array.from(new Set(metadata.map((field) => pickName(field)).filter((value): value is string => !!value)));
    }

    if (Array.isArray(metadata?.fields)) {
      return Array.from(
        new Set(metadata.fields.map((field: any) => pickName(field)).filter((value): value is string => !!value)),
      );
    }

    return [];
  }

  private inferSqlChartOutputType(value: any): string {
    if (Array.isArray(value)) {
      return 'array';
    }
    if (_.isBoolean(value)) {
      return 'boolean';
    }
    if (_.isFinite(value)) {
      return 'number';
    }
    if (_.isPlainObject(value)) {
      return 'object';
    }
    return 'string';
  }

  private mergeChartHintLists(base: FlowSurfaceChartHint[], extra: FlowSurfaceChartHint[]): FlowSurfaceChartHint[] {
    return _.uniqBy([...(base || []), ...(extra || [])], 'key');
  }

  private async resolveSqlChartPreview(query: any, _transaction?: any): Promise<FlowSurfaceSqlChartPreview> {
    const normalizedSql = this.normalizeReadOnlyChartSql(query?.sql);
    const transformed = await transformSQL(normalizedSql);
    const riskyHints: FlowSurfaceChartHint[] = [];
    const hasRuntimeContext =
      Object.keys(transformed?.bind || {}).length > 0 || Object.keys(transformed?.liquidContext || {}).length > 0;

    if (hasRuntimeContext) {
      riskyHints.push({
        key: 'sql_runtime_context',
        title: 'SQL depends on runtime context',
        description:
          'This SQL uses template variables or ctx placeholders, so FlowSurfaces cannot preview its outputs before runtime.',
      });
      return { riskyHints };
    }

    const db = (this.plugin as any).getDatabaseByDataSourceKey?.(query?.sqlDatasource || 'main');
    if (!db?.runSQL) {
      riskyHints.push({
        key: 'sql_preview_unavailable',
        title: 'SQL preview unavailable',
        description: 'FlowSurfaces could not access the target data source to preview SQL outputs.',
      });
      return { riskyHints };
    }

    try {
      const previewMetadataResult = await this.runChartSqlPreviewRaw(
        db,
        this.buildChartSqlPreviewMetadataQuery(transformed.sql),
        transformed.bind,
        _transaction,
      );
      const previewAliases = this.extractSqlChartPreviewAliases(previewMetadataResult?.[1]);
      const rows = await db.runSQL(this.buildChartSqlPreviewQuery(transformed.sql), {
        type: 'selectRows',
        bind: transformed.bind,
        transaction: _transaction,
      });
      const firstRow = Array.isArray(rows) && _.isPlainObject(rows[0]) ? (rows[0] as Record<string, any>) : undefined;

      if (previewAliases.length) {
        return {
          queryOutputs: previewAliases.map(
            (alias): FlowSurfaceSqlChartQueryOutput => ({
              alias,
              source: 'sql',
              type:
                firstRow && Object.prototype.hasOwnProperty.call(firstRow, alias)
                  ? this.inferSqlChartOutputType(firstRow[alias])
                  : undefined,
            }),
          ),
          riskyHints,
        };
      }

      if (!_.isPlainObject(firstRow)) {
        riskyHints.push({
          key: 'sql_outputs_unavailable',
          title: 'SQL outputs could not be inferred',
          description:
            'The SQL preview returned no sample row, so FlowSurfaces could not cross-validate visual.mappings against concrete output fields.',
        });
        return { riskyHints };
      }

      const outputAliases = Object.keys(firstRow);
      if (!outputAliases.length) {
        throwBadRequest('chart query.sql must expose at least one output column');
      }

      return {
        queryOutputs: outputAliases.map((alias) => ({
          alias,
          source: 'sql' as const,
          type: this.inferSqlChartOutputType(firstRow[alias]),
        })),
        riskyHints,
      };
    } catch (error: any) {
      const message = error?.message || String(error);
      throwBadRequest(`chart query.sql is invalid: ${message}`);
    }
  }

  private syncChartCardRuntimeStepParamsForUpdateSettings(
    current: any,
    nextPayload: Record<string, any>,
    replacementCardSettings?: any,
  ) {
    if (current?.use !== 'ChartBlockModel') {
      return;
    }

    if (_.isUndefined(_.get(nextPayload, ['stepParams', 'cardSettings']))) {
      return;
    }

    const nextStepParams = _.cloneDeep(nextPayload.stepParams ?? current?.stepParams ?? {});
    const nextCardSettings = normalizeChartCardSettings(
      _.isUndefined(replacementCardSettings) ? _.get(nextStepParams, ['cardSettings']) : replacementCardSettings,
    );

    if (_.isEmpty(nextCardSettings)) {
      _.unset(nextStepParams, ['cardSettings']);
    } else {
      _.set(nextStepParams, ['cardSettings'], nextCardSettings);
    }

    nextPayload.stepParams = nextStepParams;
  }

  private stripLegacyChartCardChromeForUpdateSettings(current: any, nextPayload: Record<string, any>) {
    if (current?.use !== 'ChartBlockModel') {
      return;
    }

    const legacyChromeKeys = ['title', 'displayTitle', 'height', 'heightMode'];
    const currentProps = _.isPlainObject(current?.props) ? current.props : {};
    const currentDecoratorProps = _.isPlainObject(current?.decoratorProps) ? current.decoratorProps : {};
    const hasLegacyProps = legacyChromeKeys.some((key) => Object.prototype.hasOwnProperty.call(currentProps, key));
    const hasLegacyDecoratorProps = legacyChromeKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(currentDecoratorProps, key),
    );

    if (!hasLegacyProps && !hasLegacyDecoratorProps) {
      return;
    }

    nextPayload.props = _.omit(_.cloneDeep(nextPayload.props ?? currentProps), legacyChromeKeys);
    nextPayload.decoratorProps = _.omit(
      _.cloneDeep(nextPayload.decoratorProps ?? currentDecoratorProps),
      legacyChromeKeys,
    );
  }

  async setEventFlows(values: Record<string, any>, options: { transaction?: any } = {}) {
    const writeTarget = this.normalizeWriteTarget('setEventFlows', values?.target, values);
    const target = await this.locator.resolve(writeTarget, options);
    const current = await this.loadResolvedNode(target, options.transaction);
    const contract = getNodeContract(current?.use);
    if (!contract.editableDomains.includes('flowRegistry')) {
      throwBadRequest(`flowSurfaces setEventFlows is not supported on '${current?.use || target.uid}'`);
    }
    const flows = values.flowRegistry || values.flows || {};
    this.contractGuard.validateFlowRegistry(current, flows);

    if (target.kind === 'tab' && target.tabRoute) {
      await this.routeSync.persistTabSettings(
        target,
        current,
        {
          uid: current.uid,
          flowRegistry: flows,
        },
        options.transaction,
      );
      return {
        uid: target.uid,
        flowRegistry: flows,
      };
    }

    await this.repository.patch(
      {
        uid: target.uid,
        flowRegistry: flows,
      },
      { transaction: options.transaction },
    );
    return {
      uid: target.uid,
      flowRegistry: flows,
    };
  }

  async setLayout(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('setLayout', values?.target, values);
    const resolved = await this.locator.resolve(target, options);
    const grid = await this.surfaceContext.resolveGridNode(resolved.uid, options.transaction);
    const contract = getNodeContract(grid?.use);
    if (!contract.layoutCapabilities?.supported) {
      throwBadRequest(`flowSurfaces setLayout is not supported on '${grid?.use || resolved.uid}'`);
    }
    const rows = values.rows || {};
    const sizes = values.sizes || {};
    const rowOrder = values.rowOrder || Object.keys(rows);
    this.contractGuard.validateLayout(grid, { rows, sizes, rowOrder });
    await this.repository.patch(
      {
        uid: grid.uid,
        props: {
          ...(grid.props || {}),
          rows,
          sizes,
          rowOrder,
        },
        stepParams: {
          ...(grid.stepParams || {}),
          [GRID_SETTINGS_FLOW_KEY]: {
            ...(grid.stepParams?.[GRID_SETTINGS_FLOW_KEY] || {}),
            [GRID_SETTINGS_LAYOUT_STEP_KEY]: {
              rows,
              sizes,
              rowOrder,
            },
          },
        },
      },
      { transaction: options.transaction },
    );
    return {
      uid: grid.uid,
      rows,
      sizes,
      rowOrder,
    };
  }

  async moveNode(values: Record<string, any>, options: { transaction?: any } = {}) {
    const sourceUid = String(values.sourceUid || '').trim();
    const targetUid = String(values.targetUid || '').trim();
    const position = values.position === 'before' ? 'before' : 'after';
    if (!sourceUid || !targetUid) {
      throwBadRequest('flowSurfaces moveNode requires sourceUid and targetUid');
    }
    const sourceModel = await this.repository.findModelById(sourceUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const targetModel = await this.repository.findModelById(targetUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const sourceParentUid = await this.locator.findParentUid(sourceUid, options.transaction);
    const targetParentUid = await this.locator.findParentUid(targetUid, options.transaction);
    if (!sourceModel?.subKey || !targetModel?.subKey || !sourceParentUid || !targetParentUid) {
      throwBadRequest('flowSurfaces moveNode requires sibling nodes with persisted parent relationship');
    }
    if (
      sourceParentUid !== targetParentUid ||
      sourceModel.subKey !== targetModel.subKey ||
      sourceModel.subType !== targetModel.subType
    ) {
      throwBadRequest('flowSurfaces moveNode only supports siblings under the same parent/subKey');
    }
    await this.repository.attach(
      sourceUid,
      {
        parentId: sourceParentUid,
        subKey: sourceModel.subKey,
        subType: sourceModel.subType,
        position: { type: position, target: targetUid },
      },
      { transaction: options.transaction },
    );
    return { sourceUid, targetUid, position };
  }

  async removeNode(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeRemoveNodeTarget(values);
    const resolved = await this.locator.resolve(target, options);
    const node =
      resolved.node ||
      (await this.repository.findModelById(resolved.uid, {
        transaction: options.transaction,
        includeAsyncNode: true,
      }));
    this.assertRemoveNodeResolvedTarget(resolved, node);
    if (node?.use === 'FilterFormItemModel') {
      await this.removeFilterFormConnectConfig(resolved.uid, options.transaction);
    }
    if (FILTER_TARGET_BLOCK_USES.has(node?.use || '')) {
      await this.removeFilterFormTargetBindings(resolved.uid, options.transaction);
    }
    await this.removeNodeTreeWithBindings(resolved.uid, options.transaction);
    return { uid: resolved.uid };
  }

  async mutate(values: FlowSurfaceMutateValues, options: { transaction?: any } = {}) {
    this.assertMutateAtomicFlag(values.atomic);
    const ops = _.castArray(values.ops || []) as FlowSurfaceMutateOp[];
    const ctx: FlowSurfaceExecutorContext = {
      transaction: options.transaction,
      keys: new Map(),
      clientKeyToUid: {},
    };
    const results = await executeMutateOps(ops, ctx, async (op, resolvedValues, execCtx) => {
      return this.dispatchOp(op, resolvedValues, execCtx);
    });
    return {
      results,
      clientKeyToUid: ctx.clientKeyToUid,
    };
  }

  async apply(values: FlowSurfaceApplyValues, options: { transaction?: any } = {}) {
    this.assertApplyMode(values.mode);
    validateFlowSurfacePayloadShape('apply', values?.spec, 'spec');
    const target = this.normalizeWriteTarget('apply', values?.target, values);
    const spec = values.spec as FlowSurfaceApplySpec;
    const readback = await this.get(target, options);
    const compiled = compileApplySpec(target, readback.tree, spec);
    const mutateRes = await this.mutate({ ops: compiled.ops, atomic: true }, options);
    return {
      ...mutateRes,
      clientKeyToUid: {
        ...compiled.clientKeyToUid,
        ...(mutateRes?.clientKeyToUid || {}),
      },
    };
  }

  async transaction<T>(callback: (transaction: any) => Promise<T>) {
    const transaction = await this.db.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async dispatchOp(
    op: FlowSurfaceMutateOp,
    resolvedValues: Record<string, any>,
    ctx: FlowSurfaceExecutorContext,
  ) {
    const options = { transaction: ctx.transaction };
    let result: any;
    switch (op.type) {
      case 'createMenu':
        result = await this.createMenu(resolvedValues, options);
        break;
      case 'updateMenu':
        result = await this.updateMenu(resolvedValues, options);
        break;
      case 'createPage':
        result = await this.createPage(resolvedValues, options);
        break;
      case 'destroyPage':
        result = await this.destroyPage(resolvedValues, options);
        break;
      case 'addTab':
        result = await this.addTab(resolvedValues, options);
        break;
      case 'updateTab':
        result = await this.updateTab(resolvedValues, options);
        break;
      case 'moveTab':
        result = await this.moveTab(resolvedValues, options);
        break;
      case 'removeTab':
        result = await this.removeTab(resolvedValues, options);
        break;
      case 'addPopupTab':
        result = await this.addPopupTab(resolvedValues, options);
        break;
      case 'updatePopupTab':
        result = await this.updatePopupTab(resolvedValues, options);
        break;
      case 'movePopupTab':
        result = await this.movePopupTab(resolvedValues, options);
        break;
      case 'removePopupTab':
        result = await this.removePopupTab(resolvedValues, options);
        break;
      case 'addBlock':
        result = await this.addBlock(resolvedValues, options);
        break;
      case 'addField':
        result = await this.addField(resolvedValues, options);
        break;
      case 'addAction':
        result = await this.addAction(resolvedValues, options);
        break;
      case 'addRecordAction':
        result = await this.addRecordAction(resolvedValues, options);
        break;
      case 'updateSettings':
        result = await this.updateSettings(resolvedValues, options);
        break;
      case 'setEventFlows':
        result = await this.setEventFlows(resolvedValues, options);
        break;
      case 'setLayout':
        result = await this.setLayout(resolvedValues, options);
        break;
      case 'moveNode':
        result = await this.moveNode(resolvedValues, options);
        break;
      case 'removeNode':
        result = await this.removeNode(resolvedValues, options);
        break;
      default:
        throwBadRequest(`flowSurfaces mutate op '${op.type}' is not supported`);
    }
    if (resolvedValues.clientKey) {
      ctx.clientKeyToUid[resolvedValues.clientKey] =
        result?.wrapperUid ||
        result?.uid ||
        result?.popupTabUid ||
        result?.popupGridUid ||
        result?.popupPageUid ||
        result?.tabSchemaUid ||
        result?.fieldUid ||
        result?.gridUid ||
        result?.pageUid;
    }
    return result;
  }

  private assertApplyMode(mode?: FlowSurfaceApplyMode) {
    if (!_.isUndefined(mode) && mode !== 'replace') {
      throwBadRequest(`flowSurfaces apply only supports mode='replace' in v1`);
    }
  }

  private assertComposeMode(mode?: FlowSurfaceComposeMode) {
    if (_.isUndefined(mode)) {
      return 'append' as const;
    }
    if (mode !== 'append' && mode !== 'replace') {
      throwBadRequest(`flowSurfaces compose only supports mode='append' or mode='replace'`);
    }
    return mode;
  }

  private assertMutateAtomicFlag(atomic: FlowSurfaceAtomicFlag | undefined) {
    if (!_.isUndefined(atomic) && atomic !== true) {
      throwBadRequest(`flowSurfaces mutate only supports atomic=true in v1`);
    }
  }

  private normalizeWriteTarget(actionName: string, target: any, values?: Record<string, any>): FlowSurfaceWriteTarget {
    if (hasLegacyLocatorFields(values || {}, { allowRootUid: true })) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    if (!_.isPlainObject(target)) {
      throwBadRequest(`flowSurfaces ${actionName} requires target.uid`);
    }
    const targetKeys = Object.keys(target);
    if (!targetKeys.length || targetKeys.some((key) => key !== 'uid') || hasLegacyLocatorFields(target)) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const uid = String(target.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces ${actionName} requires target.uid`);
    }
    return { uid };
  }

  private normalizeRootUidValue(actionName: string, values: Record<string, any>): string {
    if (_.isPlainObject(values?.target)) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts root uid; do not wrap it in target. If you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    if (hasLegacyLocatorFields(values || {})) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts root uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const uid = String(values?.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces ${actionName} requires uid`);
    }
    return uid;
  }

  private async assertRouteBackedPageUidTarget(
    actionName: 'addTab' | 'destroyPage',
    resolved: FlowSurfaceResolvedTarget,
    transaction?: any,
  ) {
    const pageSchemaUid = resolved.pageRoute?.get?.('schemaUid') || resolved.pageRoute?.schemaUid;
    const pageModel =
      resolved.pageModel ||
      (pageSchemaUid
        ? await this.repository.findModelByParentId(pageSchemaUid, {
            transaction,
            subKey: 'page',
            includeAsyncNode: true,
          })
        : null);
    if (
      resolved.kind !== 'page' ||
      !pageSchemaUid ||
      pageModel?.use !== 'RootPageModel' ||
      resolved.uid !== pageModel.uid
    ) {
      if (actionName === 'addTab') {
        throwBadRequest(
          `flowSurfaces addTab only accepts a route-backed page uid; popup child pages use addPopupTab on popupPageUid. If you only have pageSchemaUid or routeId, call flowSurfaces:get first`,
        );
      }
      throwBadRequest(
        `flowSurfaces destroyPage only accepts a route-backed page uid; popup child pages are internal popup subtrees and cannot be destroyed via destroyPage. If you only have pageSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const structure = await this.loadRouteBackedPageStructure(resolved.pageRoute, transaction);
    if (!this.isRouteBackedPageInitialized(resolved.pageRoute, structure)) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires an initialized page; call createPage(menuRouteId=...) before using page lifecycle APIs`,
      );
    }
    return {
      pageSchemaUid,
      node: pageModel,
    };
  }

  private async assertRouteBackedTabUidTarget(
    actionName: 'updateTab' | 'moveTab' | 'removeTab',
    uid: string,
    transaction?: any,
  ) {
    const resolved = await this.locator.resolve({ uid }, { transaction });
    const route = resolved.tabRoute || (await this.locator.findRouteBySchemaUid(uid, transaction));
    const exactNode =
      resolved.node ||
      (await this.repository.findModelById(uid, {
        transaction,
        includeAsyncNode: true,
      }));
    const routeSchemaUid = route?.get?.('schemaUid') || route?.schemaUid;
    const routeType = route?.get?.('type') || route?.type;
    if (
      routeType !== 'tabs' ||
      !routeSchemaUid ||
      String(routeSchemaUid) !== uid ||
      exactNode?.use === 'ChildPageTabModel'
    ) {
      const recommendedAction =
        actionName === 'updateTab' ? 'updatePopupTab' : actionName === 'moveTab' ? 'movePopupTab' : 'removePopupTab';
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts a route-backed tab uid; popup child tabs use ${recommendedAction}`,
      );
    }
    const parentRouteId = route?.get?.('parentId') ?? route?.parentId;
    const parentRoute = parentRouteId ? await this.findMenuRouteById(parentRouteId, transaction) : null;
    const structure = parentRoute ? await this.loadRouteBackedPageStructure(parentRoute, transaction) : null;
    if (!parentRoute || !structure || !this.isRouteBackedPageInitialized(parentRoute, structure)) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires an initialized page; call createPage(menuRouteId=...) before using tab lifecycle APIs`,
      );
    }
    return {
      ...resolved,
      tabRoute: route,
    };
  }

  private async assertPopupPageUidTarget(actionName: 'addPopupTab', uid: string, transaction?: any) {
    const popupPage = await this.repository.findModelById(uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (popupPage?.use !== 'ChildPageModel') {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts target.uid for popupPageUid; use get(hostUid) and read tree.subModels.page.uid first`,
      );
    }
    return popupPage;
  }

  private async assertPopupTabUidTarget(
    actionName: 'updatePopupTab' | 'movePopupTab' | 'removePopupTab',
    uid: string,
    transaction?: any,
  ) {
    const popupTab = await this.repository.findModelById(uid, {
      transaction,
      includeAsyncNode: true,
    });
    const popupPageUid = popupTab?.uid ? await this.locator.findParentUid(popupTab.uid, transaction) : null;
    const popupPage = popupPageUid
      ? await this.repository.findModelById(popupPageUid, {
          transaction,
          includeAsyncNode: true,
        })
      : null;
    if (popupTab?.use !== 'ChildPageTabModel' || popupPage?.use !== 'ChildPageModel') {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts popup tab uid; use get(hostUid) and read tree.subModels.page.subModels.tabs[].uid first`,
      );
    }
    return {
      popupTab,
      popupPage,
    };
  }

  private normalizeRemoveNodeTarget(values: Record<string, any>): FlowSurfaceWriteTarget {
    if (!_.isPlainObject(values?.target)) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(values, 'uid') ||
      Object.prototype.hasOwnProperty.call(values, 'pageSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values, 'tabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values, 'routeId')
    ) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    const target = values.target || {};
    if (
      Object.prototype.hasOwnProperty.call(target, 'pageSchemaUid') ||
      Object.prototype.hasOwnProperty.call(target, 'tabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(target, 'routeId')
    ) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    const uid = String(target.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces removeNode requires target.uid`);
    }
    return { uid };
  }

  private assertRemoveNodeResolvedTarget(resolved: FlowSurfaceResolvedTarget, node?: any) {
    if (resolved.kind === 'page' || ['RootPageModel', 'ChildPageModel'].includes(node?.use || '')) {
      throwBadRequest(`flowSurfaces removeNode does not support page surfaces; use destroyPage`);
    }
    if (resolved.kind === 'tab' || ['RootPageTabModel', 'ChildPageTabModel'].includes(node?.use || '')) {
      throwBadRequest(`flowSurfaces removeNode does not support tab surfaces; use removeTab`);
    }
    if (node?.use === 'RouteModel' || (resolved.route && !resolved.node)) {
      throwBadRequest(
        `flowSurfaces removeNode only supports block / field / action / popup subtree nodes; page use destroyPage and tab use removeTab`,
      );
    }
  }

  private normalizeGetTarget(input: Record<string, any>): FlowSurfaceReadLocator {
    if (!_.isPlainObject(input)) {
      throwBadRequest(`flowSurfaces:get requires root locator fields`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'target')) {
      throwBadRequest(`flowSurfaces:get only accepts root locator fields; do not wrap them in 'target'`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'values')) {
      throwBadRequest(`flowSurfaces:get only accepts root locator fields; do not wrap them in 'values'`);
    }
    const target = buildDefinedPayload({
      uid: input.uid,
      pageSchemaUid: input.pageSchemaUid,
      tabSchemaUid: input.tabSchemaUid,
      routeId: _.isNil(input.routeId) ? undefined : String(input.routeId),
    });
    if (!Object.keys(target).length) {
      throwBadRequest(`flowSurfaces:get requires one of uid, pageSchemaUid, tabSchemaUid or routeId`);
    }
    if (Object.keys(target).length > 1) {
      throwBadRequest(`flowSurfaces:get only accepts exactly one locator: uid, pageSchemaUid, tabSchemaUid or routeId`);
    }
    return target;
  }

  private normalizeContextPath(path?: string) {
    if (_.isUndefined(path) || _.isNull(path)) {
      return undefined;
    }
    if (typeof path !== 'string') {
      throwBadRequest(`flowSurfaces context path must be a bare string path like 'record' or 'popup.record'`);
    }
    const normalized = String(path).trim();
    if (!normalized) {
      return undefined;
    }
    if (
      normalized === 'ctx' ||
      normalized.startsWith('ctx.') ||
      normalized.includes('{{') ||
      normalized.includes('}}')
    ) {
      throwBadRequest(`flowSurfaces context path only accepts bare paths like 'record' or 'popup.record'`);
    }
    if (!isBareFlowContextPath(normalized)) {
      throwBadRequest(`flowSurfaces context path only accepts bare dot paths like 'item.parentItem.value'`);
    }
    return normalized;
  }

  private normalizeContextMaxDepth(maxDepth?: number) {
    const normalized = Number(maxDepth);
    if (!Number.isFinite(normalized)) {
      return 3;
    }
    return Math.max(1, Math.floor(normalized));
  }

  private buildReadTargetSummary(
    target: FlowSurfaceReadLocator,
    resolved: { uid: string; kind: string },
  ): FlowSurfaceReadTarget {
    return {
      locator: buildDefinedPayload({
        uid: target.uid,
        pageSchemaUid: target.pageSchemaUid,
        tabSchemaUid: target.tabSchemaUid,
        routeId: target.routeId,
      }),
      uid: resolved.uid,
      kind: resolved.kind as FlowSurfaceReadTarget['kind'],
    };
  }

  private tryResolveActionCatalogItem(
    input: {
      type?: string;
      use?: string;
      containerUse?: string;
    },
    options: {
      context?: string;
      enabledPackages?: ReadonlySet<string>;
      requireCreateSupported?: boolean;
    } = {},
  ) {
    try {
      return resolveSupportedActionCatalogItem(input, options);
    } catch (error) {
      return null;
    }
  }

  private resolveAddActionCatalogItem(
    input: { type?: string; use?: string; containerUse: string },
    enabledPackages?: ReadonlySet<string>,
  ) {
    const item = this.tryResolveActionCatalogItem(input, {
      context: 'addAction',
      enabledPackages,
      requireCreateSupported: true,
    });
    if (item) {
      if (item.scope === 'record') {
        throwBadRequest(
          `flowSurfaces addAction does not support record action '${item.key}' under '${input.containerUse}', use addRecordAction`,
        );
      }
      return item;
    }

    const recordContainerUse = getCatalogRecordActionContainerUse(input.containerUse);
    const recordItem = recordContainerUse
      ? this.tryResolveActionCatalogItem(
          {
            ...input,
            containerUse: recordContainerUse,
          },
          {
            context: 'addAction',
            enabledPackages,
            requireCreateSupported: true,
          },
        )
      : null;
    if (recordItem?.scope === 'record') {
      throwBadRequest(
        `flowSurfaces addAction does not support record action '${recordItem.key}' under '${input.containerUse}', use addRecordAction`,
      );
    }

    return resolveSupportedActionCatalogItem(input, {
      context: 'addAction',
      enabledPackages,
      requireCreateSupported: true,
    });
  }

  private resolveAddRecordActionCatalogItem(
    input: {
      type?: string;
      use?: string;
      containerUse: string;
      ownerUse: string;
    },
    enabledPackages?: ReadonlySet<string>,
  ) {
    const item = this.tryResolveActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.containerUse,
      },
      {
        context: 'addRecordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope !== 'record') {
        throwBadRequest(
          `flowSurfaces addRecordAction only supports record actions; '${item.key}' should use addAction`,
        );
      }
      return item;
    }

    const ownerItem = this.tryResolveActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.ownerUse,
      },
      {
        context: 'addRecordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    if (ownerItem && ownerItem.scope !== 'record') {
      throwBadRequest(
        `flowSurfaces addRecordAction only supports record actions; '${ownerItem.key}' should use addAction`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.containerUse,
      },
      {
        context: 'addRecordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
  }

  private resolveComposeBlockActionCatalogItem(
    blockUse: string,
    actionType: string,
    enabledPackages?: ReadonlySet<string>,
  ) {
    const item = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        context: 'compose action',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope === 'record') {
        throwBadRequest(
          `flowSurfaces compose action '${actionType}' on '${blockUse}' must be placed under recordActions`,
        );
      }
      return item;
    }

    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);
    const recordItem = recordContainerUse
      ? this.tryResolveActionCatalogItem(
          {
            type: actionType,
            containerUse: recordContainerUse,
          },
          {
            context: 'compose action',
            enabledPackages,
            requireCreateSupported: true,
          },
        )
      : null;
    if (recordItem?.scope === 'record') {
      throwBadRequest(
        `flowSurfaces compose action '${actionType}' on '${blockUse}' must be placed under recordActions`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        context: 'compose action',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
  }

  private resolveComposeRecordActionCatalogItem(
    blockUse: string,
    actionType: string,
    enabledPackages?: ReadonlySet<string>,
  ) {
    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);
    if (!recordContainerUse) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }

    const item = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: recordContainerUse,
      },
      {
        context: 'compose recordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope !== 'record') {
        throwBadRequest(
          `flowSurfaces compose record action '${actionType}' on '${blockUse}' must be placed under actions`,
        );
      }
      return item;
    }

    const blockItem = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        context: 'compose recordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
    if (blockItem && blockItem.scope !== 'record') {
      throwBadRequest(
        `flowSurfaces compose record action '${actionType}' on '${blockUse}' must be placed under actions`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: actionType,
        containerUse: recordContainerUse,
      },
      {
        context: 'compose recordAction',
        enabledPackages,
        requireCreateSupported: true,
      },
    );
  }

  private async resolveRecordActionContainer(target: FlowSurfaceWriteTarget, transaction?: any) {
    const resolved = await this.locator.resolve(target, { transaction });
    const node =
      resolved.node || (await this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true }));
    const use = node?.use;

    if (use === 'TableBlockModel') {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: 'TableActionsColumnModel',
        parentUid: await this.ensureTableActionsColumn(node.uid, transaction),
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'DetailsBlockModel') {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: use,
        parentUid: node.uid,
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'ListBlockModel' || use === 'GridCardBlockModel') {
      const itemUid = node.subModels?.item?.uid;
      if (!itemUid) {
        throwConflict(
          `flowSurfaces addRecordAction target '${use}' is missing its item subtree`,
          'FLOW_SURFACE_RECORD_ACTION_ITEM_SUBTREE_MISSING',
        );
      }
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: use === 'ListBlockModel' ? 'ListItemModel' : 'GridCardItemModel',
        parentUid: itemUid,
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'TableActionsColumnModel') {
      throwBadRequest(
        `flowSurfaces addRecordAction target '${use}' is an internal record action container; pass the owning table block uid instead`,
      );
    }
    if (use === 'ListItemModel' || use === 'GridCardItemModel') {
      throwBadRequest(
        `flowSurfaces addRecordAction target '${use}' is an internal record action container; pass the owning ${
          use === 'ListItemModel' ? 'list' : 'gridCard'
        } block uid instead`,
      );
    }

    throwBadRequest(
      `flowSurfaces addRecordAction target '${use || resolved.uid}' is not a supported record action surface`,
    );
  }

  private async runBatchCreate(options: {
    actionName: string;
    values: Record<string, any>;
    itemField: string;
    resultField: string;
    invoke: (
      itemValues: Record<string, any>,
      options: { transaction?: any; enabledPackages?: ReadonlySet<string> },
    ) => Promise<any>;
  }) {
    const target = this.normalizeWriteTarget(options.actionName, options.values?.target, options.values);
    const items = options.values?.[options.itemField];
    if (!Array.isArray(items)) {
      throwBadRequest(`flowSurfaces ${options.actionName} requires ${options.itemField}[]`);
    }
    const enabledPackages = await this.resolveEnabledPluginPackages();

    const results: Array<Record<string, any>> = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [index, rawItem] of items.entries()) {
      const result: Record<string, any> = { index, ok: false };
      assertNoFlowSurfaceLegacyRef(rawItem, {
        actionName: options.actionName,
        path: `item #${index + 1}`,
        dollarRefAllowed: 'key',
        refAllowed: 'key',
      });
      if (_.isPlainObject(rawItem) && typeof rawItem.key === 'string' && rawItem.key.trim()) {
        result.key = rawItem.key.trim();
      }
      try {
        if (!_.isPlainObject(rawItem)) {
          throwBadRequest(`flowSurfaces ${options.actionName} item #${index + 1} must be an object`);
        }
        if (Object.prototype.hasOwnProperty.call(rawItem, 'target')) {
          throwBadRequest(
            `flowSurfaces ${options.actionName} item #${
              index + 1
            } must not include target; use the shared top-level target`,
          );
        }
        const itemValues = {
          target,
          ...rawItem,
        };
        result.result = await this.transaction((transaction) =>
          options.invoke(itemValues, {
            transaction,
            enabledPackages,
          }),
        );
        result.ok = true;
        successCount += 1;
      } catch (error: any) {
        result.error = toFlowSurfaceBatchItemError(error);
        errorCount += 1;
      }
      results.push(result);
    }

    return {
      [options.resultField]: results,
      successCount,
      errorCount,
    };
  }

  private normalizeComposeBlock(input: any, index: number, enabledPackages?: ReadonlySet<string>) {
    if (!_.isPlainObject(input)) {
      throwBadRequest(`flowSurfaces compose block #${index + 1} must be an object`);
    }
    assertNoFlowSurfaceLegacyRef(input, {
      actionName: 'compose',
      path: `block #${index + 1}`,
      dollarRefAllowed: 'key',
      refAllowed: 'key',
    });
    if (input.use || input.fieldUse || input.stepParams || input.props || input.decoratorProps || input.flowRegistry) {
      throwBadRequest('flowSurfaces compose only accepts public semantic block fields');
    }
    const key = normalizeFlowSurfaceComposeKey(
      String(input.key || '').trim(),
      `flowSurfaces compose block #${index + 1}`,
    );
    const type = String(input.type || '').trim();
    const template = _.isUndefined(input.template)
      ? undefined
      : _.isPlainObject(input.template)
        ? _.cloneDeep(input.template)
        : throwBadRequest(`flowSurfaces compose block #${index + 1} template must be an object`);
    const templateUsage = String((template as any)?.usage || 'block').trim() || 'block';
    if (templateUsage === 'fields' && _.castArray(input.fields || []).length) {
      throwBadRequest(`flowSurfaces compose block #${index + 1} cannot mix template.usage='fields' with fields[]`);
    }
    if (
      template &&
      String((template as any).mode || 'reference').trim() !== 'copy' &&
      _.isPlainObject(input.settings) &&
      Object.keys(input.settings).length
    ) {
      throwBadRequest(
        `flowSurfaces compose block #${index + 1} does not allow settings when template.mode is 'reference'`,
      );
    }
    if (!key || (!type && !template)) {
      throwBadRequest(`flowSurfaces compose block #${index + 1} requires key and either type or template`);
    }
    const blockCatalogItem = type
      ? resolveSupportedBlockCatalogItem(
          { type },
          {
            context: 'compose',
            enabledPackages,
            requireCreateSupported: true,
          },
        )
      : null;
    const actions = _.castArray(input.actions || []).map((action, actionIndex) =>
      normalizeComposeActionSpec(action, actionIndex),
    );
    const recordActions = _.castArray(input.recordActions || []).map((action, actionIndex) =>
      normalizeComposeActionSpec(action, actionIndex),
    );
    const fields = _.castArray(input.fields || []).map((field, fieldIndex) =>
      normalizeComposeFieldSpec(field, fieldIndex),
    );
    assertFlowSurfaceComposeUniqueKeys(fields, `flowSurfaces compose block #${index + 1} fields`);
    assertFlowSurfaceComposeUniqueKeys(actions, `flowSurfaces compose block #${index + 1} actions`);
    assertFlowSurfaceComposeUniqueKeys(recordActions, `flowSurfaces compose block #${index + 1} recordActions`);
    if (!blockCatalogItem && (actions.length || recordActions.length)) {
      throwBadRequest(
        `flowSurfaces compose block #${index + 1} requires type when actions or recordActions are provided`,
      );
    }
    if (blockCatalogItem) {
      this.validateComposeActionGroups(blockCatalogItem.use, actions, recordActions, enabledPackages);
    }
    return {
      index: index + 1,
      key,
      type,
      catalogItem: blockCatalogItem,
      resource: this.normalizeResourceInput(input.resource),
      settings: _.isPlainObject(input.settings) ? input.settings : {},
      fields,
      actions,
      recordActions,
      template,
    };
  }

  private normalizeComposeBlocks(input: any, enabledPackages?: ReadonlySet<string>) {
    const normalizedBlocks = _.castArray(input || []).map((item, index) =>
      this.normalizeComposeBlock(item, index, enabledPackages),
    );
    assertFlowSurfaceComposeUniqueKeys(normalizedBlocks, 'flowSurfaces compose blocks');
    return normalizedBlocks;
  }

  private resolveComposeActionContainerUid(blockSpec: any, blockResult: any) {
    return blockResult.uid;
  }

  private resolveComposeFieldContainerUid(blockSpec: any, blockResult: any) {
    if (LIST_LIKE_COMPOSE_BLOCK_TYPES.has(blockSpec.type)) {
      return blockResult.itemUid || blockResult.uid;
    }
    return blockResult.uid;
  }

  private async resolveComposeRecordActionContainerUid(blockSpec: any, blockResult: any, transaction?: any) {
    if (blockSpec.type === 'table') {
      return this.ensureTableActionsColumn(blockResult.uid, transaction);
    }
    if (blockSpec.type === 'details') {
      return blockResult.uid;
    }
    if (!LIST_LIKE_COMPOSE_BLOCK_TYPES.has(blockSpec.type)) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }
    if (!blockResult.itemUid) {
      throwConflict(
        `flowSurfaces compose block '${blockSpec.key}' is missing its item subtree`,
        'FLOW_SURFACE_COMPOSE_ITEM_SUBTREE_MISSING',
      );
    }
    return blockResult.itemUid;
  }

  private validateComposeActionGroups(
    blockUse: string,
    actions: any[],
    recordActions: any[],
    enabledPackages?: ReadonlySet<string>,
  ) {
    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);

    if (recordActions.length && !recordContainerUse) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }

    actions.forEach((action) => {
      this.resolveComposeBlockActionCatalogItem(blockUse, action.type, enabledPackages);
    });

    if (recordContainerUse) {
      recordActions.forEach((action) => {
        this.resolveComposeRecordActionCatalogItem(blockUse, action.type, enabledPackages);
      });
    }
  }

  private buildComposeLayoutPayload(input: {
    layout?: Record<string, any>;
    createdByKey: Record<string, any>;
    finalItems: any[];
  }) {
    const declaredRows = _.castArray(input.layout?.rows || []);
    const finalUids = input.finalItems.map((item) => item.uid);
    const mentioned = new Set<string>();
    const rows: Record<string, string[][]> = {};
    const sizes: Record<string, number[]> = {};
    const rowOrder: string[] = [];
    let rowIndex = 0;

    const pushRow = (cells: Array<{ uid: string; span?: number }>) => {
      if (!cells.length) {
        return;
      }
      rowIndex += 1;
      const rowKey = `row${rowIndex}`;
      rows[rowKey] = cells.map((cell) => [cell.uid]);
      sizes[rowKey] = normalizeRowSpans(cells.map((cell) => cell.span));
      rowOrder.push(rowKey);
      cells.forEach((cell) => mentioned.add(cell.uid));
    };

    declaredRows.forEach((row: any, index: number) => {
      if (!Array.isArray(row) || !row.length) {
        throwBadRequest(`flowSurfaces compose layout row #${index + 1} must be a non-empty array`);
      }
      const cells = row.map((cell: any) => {
        if (_.isPlainObject(cell)) {
          const key = String(cell.composeKey || cell.key || '').trim();
          if (!key) {
            if (typeof cell.uid === 'string' && cell.uid.trim()) {
              return {
                uid: cell.uid.trim(),
                span: _.isNumber(cell.span) ? cell.span : undefined,
              };
            }
            throwBadRequest(`flowSurfaces compose layout row #${index + 1} contains an empty key`);
          }
          const uid = input.createdByKey[key]?.uid || (finalUids.includes(key) ? key : null);
          if (!uid) {
            throwBadRequest(
              `flowSurfaces compose layout key '${key}' does not match a created block key or existing uid`,
            );
          }
          return {
            uid,
            span: _.isNumber(cell.span) ? cell.span : undefined,
          };
        }
        const key = String(cell || '').trim();
        const uid = input.createdByKey[key]?.uid || (finalUids.includes(key) ? key : null);
        if (!uid) {
          throwBadRequest(
            `flowSurfaces compose layout key '${key}' does not match a created block key or existing uid`,
          );
        }
        return { uid };
      });
      pushRow(cells);
    });

    finalUids
      .filter((uid) => !mentioned.has(uid))
      .forEach((uid) => {
        pushRow([{ uid, span: 24 }]);
      });

    return {
      rows,
      sizes,
      rowOrder,
    };
  }

  private buildAppendGridLayoutPayload(input: { initialGrid: any; finalGrid: any; appendedItemUids: string[] }) {
    const finalItemUids = _.castArray(input.finalGrid?.subModels?.items || [])
      .map((item: any) => item?.uid)
      .filter(Boolean);
    if (!finalItemUids.length) {
      return buildAutoLayout([]);
    }

    const appendedItemUids = Array.from(
      new Set(input.appendedItemUids.filter((itemUid) => finalItemUids.includes(itemUid))),
    );
    const initialLayout = this.readGridLayout(input.initialGrid);

    if (this.hasMaterialGridLayout(initialLayout) && this.isGridLayoutValid(input.initialGrid, initialLayout)) {
      return this.appendRowsToLayout(initialLayout, appendedItemUids);
    }

    return buildAutoLayout(finalItemUids);
  }

  private readGridLayout(grid: any) {
    const rows = _.cloneDeep(grid?.props?.rows || {});
    return {
      rows,
      sizes: _.cloneDeep(grid?.props?.sizes || {}),
      rowOrder: _.cloneDeep(grid?.props?.rowOrder || Object.keys(rows)),
    };
  }

  private isGridLayoutValid(
    grid: any,
    layout: { rows: Record<string, string[][]>; sizes: Record<string, number[]>; rowOrder: string[] },
  ) {
    try {
      this.contractGuard.validateLayout(grid, {
        rows: layout.rows || {},
        sizes: layout.sizes || {},
        rowOrder: layout.rowOrder || Object.keys(layout.rows || {}),
      });
      return true;
    } catch {
      return false;
    }
  }

  private hasMaterialGridLayout(layout: {
    rows: Record<string, string[][]>;
    sizes: Record<string, number[]>;
    rowOrder: string[];
  }) {
    return !!(
      layout.rowOrder?.length ||
      Object.keys(layout.rows || {}).length ||
      Object.keys(layout.sizes || {}).length
    );
  }

  private appendRowsToLayout(
    layout: {
      rows: Record<string, string[][]>;
      sizes: Record<string, number[]>;
      rowOrder: string[];
    },
    appendedItemUids: string[],
  ) {
    const rows = _.cloneDeep(layout.rows || {});
    const sizes = _.cloneDeep(layout.sizes || {});
    const rowOrder = [...(layout.rowOrder || Object.keys(rows))];
    const usedRowKeys = new Set([...Object.keys(rows), ...rowOrder]);
    let nextRowIndex = 0;

    for (const itemUid of appendedItemUids) {
      let rowKey = '';
      do {
        nextRowIndex += 1;
        rowKey = `appendRow${nextRowIndex}`;
      } while (usedRowKeys.has(rowKey));
      rows[rowKey] = [[itemUid]];
      sizes[rowKey] = [24];
      rowOrder.push(rowKey);
      usedRowKeys.add(rowKey);
    }

    return {
      rows,
      sizes,
      rowOrder,
    };
  }

  private async collectComposeActionKeys(actionUid: string, transaction?: any) {
    const actionNode = await this.repository.findModelById(actionUid, {
      transaction,
      includeAsyncNode: true,
    });
    const assignForm = actionNode?.subModels?.assignForm;
    const assignFormGrid = assignForm?.subModels?.grid;
    return _.pickBy(
      {
        assignFormUid: assignForm?.uid,
        assignFormGridUid: assignFormGrid?.uid,
        ...(await this.collectPopupSurfaceKeys(actionUid, transaction, undefined, actionNode)),
      },
      (value) => !!value,
    );
  }

  private async collectPopupSurfaceKeys(
    hostUid: string,
    transaction?: any,
    ensuredPopupSurface?: {
      pageUid?: string;
      tabUid?: string;
      gridUid?: string;
    },
    hostNode?: any,
  ) {
    if (ensuredPopupSurface?.pageUid && ensuredPopupSurface?.tabUid && ensuredPopupSurface?.gridUid) {
      return {
        popupPageUid: ensuredPopupSurface.pageUid,
        popupTabUid: ensuredPopupSurface.tabUid,
        popupGridUid: ensuredPopupSurface.gridUid,
      };
    }
    const resolvedHost =
      hostNode ||
      (await this.repository.findModelById(hostUid, {
        transaction,
        includeAsyncNode: true,
      }));
    const openView = this.resolvePopupHostOpenView(resolvedHost);
    const externalPopupHostUid = this.resolveExternalPopupHostUid(resolvedHost?.uid, openView);
    if (externalPopupHostUid && String(openView?.popupTemplateUid || '').trim() && !openView?.popupTemplateContext) {
      return {};
    }
    const popupHost =
      externalPopupHostUid && externalPopupHostUid !== resolvedHost?.uid
        ? await this.repository.findModelById(externalPopupHostUid, {
            transaction,
            includeAsyncNode: true,
          })
        : resolvedHost;
    const popupPage = popupHost?.subModels?.page;
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGrid = popupTab?.subModels?.grid;
    return _.pickBy(
      {
        popupPageUid: popupPage?.uid,
        popupTabUid: popupTab?.uid,
        popupGridUid: popupGrid?.uid,
      },
      (value) => !!value,
    );
  }

  private async removeNodeTreeWithBindings(uid: string, transaction?: any) {
    const node = await this.repository.findModelById(uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!node?.uid) {
      return;
    }
    const detachedPopupCopyUid = this.resolveDetachedPopupCopyUid(node.uid, this.resolvePopupHostOpenView(node));
    await this.removeFlowSqlBindingsForNodeTree(node, transaction);
    await this.cleanupNodeBindings(node, transaction);
    await this.clearFlowTemplateUsagesForNodeTree(node, transaction);
    await this.repository.remove(uid, { transaction });
    if (detachedPopupCopyUid && detachedPopupCopyUid !== node.uid) {
      await this.removeNodeTreeWithBindings(detachedPopupCopyUid, transaction);
    }
  }

  private async cleanupNodeBindings(node: any, transaction?: any) {
    if (!node?.uid) {
      return;
    }
    for (const child of Object.values(node.subModels || {})) {
      for (const item of _.castArray(child as any)) {
        await this.cleanupNodeBindings(item, transaction);
      }
    }
    if (node.use === 'FilterFormItemModel') {
      await this.removeFilterFormConnectConfig(node.uid, transaction);
    }
    if (FILTER_TARGET_BLOCK_USES.has(node.use || '')) {
      await this.removeFilterFormTargetBindings(node.uid, transaction);
    }
  }

  private async configurePage(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForResolvedNode({
      kind: 'page',
    });
    assertSupportedSimpleChanges('page', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          enableTabs: changes.enableTabs,
          icon: changes.icon,
          enableHeader: changes.enableHeader,
        }),
        stepParams: hasDefinedValue(changes, [
          'title',
          'documentTitle',
          'displayTitle',
          'enableTabs',
          'icon',
          'enableHeader',
        ])
          ? {
              pageSettings: {
                general: buildDefinedPayload({
                  title: changes.title,
                  documentTitle: changes.documentTitle,
                  displayTitle: changes.displayTitle,
                  enableTabs: changes.enableTabs,
                  icon: changes.icon,
                  enableHeader: changes.enableHeader,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureTab(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForResolvedNode({
      kind: 'tab',
    });
    assertSupportedSimpleChanges('tab', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          icon: changes.icon,
        }),
        stepParams: hasDefinedValue(changes, ['title', 'icon', 'documentTitle'])
          ? {
              pageTabSettings: {
                tab: buildDefinedPayload({
                  title: changes.title,
                  icon: changes.icon,
                  documentTitle: changes.documentTitle,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureTableBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('TableBlockModel');
    assertSupportedSimpleChanges('table', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: normalizePublicBlockHeightMode(changes.heightMode),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, [
            'pageSize',
            'density',
            'showRowNumbers',
            'sorting',
            'dataScope',
            'quickEdit',
            'treeTable',
            'defaultExpandAllRows',
            'dragSort',
            'dragSortBy',
          ])
            ? {
                tableSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'pageSize') ? { pageSize: { pageSize: changes.pageSize } } : {}),
                  ...(hasOwnDefined(changes, 'density') ? { tableDensity: { size: changes.density } } : {}),
                  ...(hasOwnDefined(changes, 'quickEdit') ? { quickEdit: { editable: changes.quickEdit } } : {}),
                  ...(hasOwnDefined(changes, 'showRowNumbers')
                    ? { showRowNumbers: { showIndex: changes.showRowNumbers } }
                    : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'treeTable') ? { treeTable: { treeTable: changes.treeTable } } : {}),
                  ...(hasOwnDefined(changes, 'defaultExpandAllRows')
                    ? { defaultExpandAllRows: { defaultExpandAllRows: changes.defaultExpandAllRows } }
                    : {}),
                  ...(hasOwnDefined(changes, 'dragSort') ? { dragSort: { dragSort: changes.dragSort } } : {}),
                  ...(hasOwnDefined(changes, 'dragSortBy') ? { dragSortBy: { dragSortBy: changes.dragSortBy } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureFormBlock(
    target: FlowSurfaceWriteTarget,
    use: string,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse(use);
    assertSupportedSimpleChanges('form', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    const nextStepParams: Record<string, any> = {};
    if (changes.resource) {
      nextStepParams.resourceSettings = {
        init: normalizeSimpleResourceInit(changes.resource),
      };
    }
    if (hasDefinedValue(changes, ['layout', 'labelAlign', 'labelWidth', 'labelWrap', 'assignRules', 'colon'])) {
      nextStepParams.formModelSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'layout') ||
        hasOwnDefined(changes, 'labelAlign') ||
        hasOwnDefined(changes, 'labelWidth') ||
        hasOwnDefined(changes, 'labelWrap') ||
        hasOwnDefined(changes, 'colon')
          ? {
              layout: buildDefinedPayload({
                layout: layoutValue,
                labelAlign: changes.labelAlign,
                labelWidth: changes.labelWidth,
                labelWrap: changes.labelWrap,
                colon: changes.colon,
              }),
            }
          : {}),
        ...(hasOwnDefined(changes, 'assignRules') ? { assignRules: { value: changes.assignRules } } : {}),
      });
    }
    if (use === 'EditFormModel' && hasOwnDefined(changes, 'dataScope')) {
      nextStepParams.formSettings = {
        dataScope: {
          filter: changes.dataScope,
        },
      };
    }

    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: Object.keys(nextStepParams).length ? nextStepParams : undefined,
      },
      options,
    );
  }

  private async configureDetailsBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('DetailsBlockModel');
    assertSupportedSimpleChanges('details', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, [
            'layout',
            'labelAlign',
            'labelWidth',
            'labelWrap',
            'colon',
            'sorting',
            'dataScope',
            'linkageRules',
          ])
            ? {
                detailsSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'layout') ||
                  hasOwnDefined(changes, 'labelAlign') ||
                  hasOwnDefined(changes, 'labelWidth') ||
                  hasOwnDefined(changes, 'labelWrap') ||
                  hasOwnDefined(changes, 'colon')
                    ? {
                        layout: buildDefinedPayload({
                          layout: layoutValue,
                          labelAlign: changes.labelAlign,
                          labelWidth: changes.labelWidth,
                          labelWrap: changes.labelWrap,
                          colon: changes.colon,
                        }),
                      }
                    : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'linkageRules') ? { linkageRules: { value: changes.linkageRules } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureFilterFormBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('FilterFormBlockModel');
    assertSupportedSimpleChanges('filterForm', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['layout', 'labelAlign', 'labelWidth', 'labelWrap', 'defaultValues'])
            ? {
                formFilterBlockModelSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'layout') ||
                  hasOwnDefined(changes, 'labelAlign') ||
                  hasOwnDefined(changes, 'labelWidth') ||
                  hasOwnDefined(changes, 'labelWrap')
                    ? {
                        layout: buildDefinedPayload({
                          layout: layoutValue,
                          labelAlign: changes.labelAlign,
                          labelWidth: changes.labelWidth,
                          labelWrap: changes.labelWrap,
                        }),
                      }
                    : {}),
                  ...(hasOwnDefined(changes, 'defaultValues')
                    ? { defaultValues: { value: changes.defaultValues } }
                    : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureListBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ListBlockModel');
    assertSupportedSimpleChanges('list', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: normalizePublicBlockHeightMode(changes.heightMode),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['pageSize', 'dataScope', 'sorting', 'layout'])
            ? {
                listSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'pageSize') ? { pageSize: { pageSize: changes.pageSize } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureGridCardBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('GridCardBlockModel');
    assertSupportedSimpleChanges('gridCard', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    const columns = normalizeGridCardColumns(changes.columns);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: normalizePublicBlockHeightMode(changes.heightMode),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['columns', 'rowCount', 'dataScope', 'sorting', 'layout'])
            ? {
                GridCardSettings: buildDefinedPayload({
                  ...(columns ? { columnCount: { columnCount: columns } } : {}),
                  ...(hasOwnDefined(changes, 'rowCount') ? { rowCount: { rowCount: changes.rowCount } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureMarkdownBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('MarkdownBlockModel');
    assertSupportedSimpleChanges('markdown', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          content: changes.content,
          value: changes.content,
        }),
        stepParams: hasOwnDefined(changes, 'content')
          ? {
              markdownBlockSettings: {
                editMarkdown: {
                  content: changes.content,
                },
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureIframeBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('IframeBlockModel');
    assertSupportedSimpleChanges('iframe', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          height: changes.height,
          heightMode: changes.heightMode,
          mode: changes.mode,
          url: changes.url,
          html: changes.html,
          params: changes.params,
          allow: changes.allow,
          htmlId: changes.htmlId,
        }),
        stepParams: hasDefinedValue(changes, ['height', 'mode', 'url', 'html', 'params', 'allow', 'htmlId'])
          ? {
              iframeBlockSettings: {
                editIframe: buildDefinedPayload({
                  height: changes.height,
                  mode: changes.mode,
                  url: changes.url,
                  html: changes.html,
                  params: changes.params,
                  allow: changes.allow,
                  htmlId: changes.htmlId,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureChartBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ChartBlockModel');
    assertSupportedSimpleChanges('chart', changes, allowedKeys);
    const shouldUpdateCardSettings = ['title', 'displayTitle', 'height', 'heightMode'].some((key) =>
      Object.prototype.hasOwnProperty.call(changes, key),
    );
    const shouldUpdateConfigure = ['configure', 'query', 'visual', 'events'].some((key) =>
      Object.prototype.hasOwnProperty.call(changes, key),
    );
    const shouldLoadCurrent = shouldUpdateConfigure || shouldUpdateCardSettings;
    const resolved = shouldLoadCurrent ? await this.locator.resolve(target, options) : null;
    const current = resolved ? await this.loadResolvedNode(resolved, options.transaction) : null;
    let nextConfigure = shouldUpdateConfigure
      ? buildChartConfigureFromSemanticChanges(_.get(current, ['stepParams', 'chartSettings', 'configure']), changes)
      : undefined;
    if (shouldUpdateConfigure) {
      nextConfigure = await this.stripBasicSqlVisualWhenPreviewUnavailable(nextConfigure, changes, options.transaction);
    }
    const nextCardSettings = shouldUpdateCardSettings
      ? buildChartCardSettingsFromSemanticChanges(_.get(current, ['stepParams', 'cardSettings']), changes)
      : undefined;
    return this.updateSettings(
      {
        target,
        stepParams:
          shouldUpdateConfigure || shouldUpdateCardSettings
            ? buildDefinedPayload({
                ...(shouldUpdateCardSettings ? { cardSettings: nextCardSettings } : {}),
                ...(shouldUpdateConfigure
                  ? {
                      chartSettings: {
                        configure: nextConfigure,
                      },
                    }
                  : {}),
              })
            : undefined,
      },
      {
        ...options,
        replaceChartCardSettings: shouldUpdateCardSettings,
      },
    );
  }

  private async stripBasicSqlVisualWhenPreviewUnavailable(
    nextConfigure: any,
    changes: Record<string, any>,
    transaction?: any,
  ) {
    if (!_.isPlainObject(nextConfigure) || !hasMeaningfulChartSemanticPatch(changes, 'query')) {
      return nextConfigure;
    }

    if (hasMeaningfulChartSemanticPatch(changes, 'visual')) {
      return nextConfigure;
    }

    const state = deriveChartSemanticState(nextConfigure);
    if (state.query?.mode !== 'sql' || state.visual?.mode !== 'basic') {
      return nextConfigure;
    }

    const sqlPreview = await this.resolveSqlChartPreview(state.query, transaction);
    if (sqlPreview.queryOutputs?.length) {
      return nextConfigure;
    }

    const strippedConfigure = _.cloneDeep(nextConfigure);
    _.unset(strippedConfigure, ['chart', 'option']);
    if (_.isEmpty(_.get(strippedConfigure, ['chart']))) {
      _.unset(strippedConfigure, ['chart']);
    }
    return strippedConfigure;
  }

  private async configureActionPanelBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ActionPanelBlockModel');
    assertSupportedSimpleChanges('actionPanel', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          layout: layoutValue,
          ellipsis: changes.ellipsis,
        }),
        stepParams: hasDefinedValue(changes, ['layout', 'ellipsis'])
          ? {
              actionPanelBlockSetting: buildDefinedPayload({
                ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                ...(hasOwnDefined(changes, 'ellipsis') ? { ellipsis: { ellipsis: changes.ellipsis } } : {}),
              }),
            }
          : undefined,
      },
      options,
    );
  }

  private async configureJSBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSBlockModel');
    assertSupportedSimpleChanges('jsBlock', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        decoratorProps: buildDefinedPayload({
          title: changes.title,
          description: changes.description,
          className: changes.className,
        }),
        stepParams: hasDefinedValue(changes, ['code', 'version'])
          ? {
              jsSettings: {
                runJs: buildDefinedPayload({
                  code: changes.code,
                  version: changes.version,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureActionColumn(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('TableActionsColumnModel');
    assertSupportedSimpleChanges('action column', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          width: changes.width,
          fixed: changes.fixed,
        }),
        stepParams: hasOwnDefined(changes, 'title')
          ? {
              tableColumnSettings: {
                title: {
                  title: changes.title,
                },
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureJSColumn(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSColumnModel');
    assertSupportedSimpleChanges('jsColumn', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          width: changes.width,
          fixed: changes.fixed,
        }),
        stepParams: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'title')
            ? {
                tableColumnSettings: {
                  title: {
                    title: changes.title,
                  },
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['code', 'version'])
            ? {
                jsSettings: {
                  runJs: buildDefinedPayload({
                    code: changes.code,
                    version: changes.version,
                  }),
                },
              }
            : {}),
        }),
      },
      options,
    );
  }

  private async configureJSItem(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSItemModel');
    assertSupportedSimpleChanges('jsItem', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          label: changes.label,
          tooltip: changes.tooltip,
          extra: changes.extra,
          showLabel: changes.showLabel,
        }),
        decoratorProps: buildDefinedPayload({
          labelWidth: changes.labelWidth,
          labelWrap: changes.labelWrap,
        }),
        stepParams: hasDefinedValue(changes, ['code', 'version'])
          ? {
              jsSettings: {
                runJs: buildDefinedPayload({
                  code: changes.code,
                  version: changes.version,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureFieldWrapper(
    target: FlowSurfaceWriteTarget,
    current: any,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    assertSupportedSimpleChanges('field wrapper', changes, getConfigureOptionKeysForUse(current?.use));

    const rawWrapperChanges = _.omit(changes, ['clickToOpen', 'openView', 'code', 'version', 'fieldComponent']);
    const wrapperChanges =
      current?.use === 'TableColumnModel' &&
      !hasOwnDefined(rawWrapperChanges, 'title') &&
      hasOwnDefined(rawWrapperChanges, 'label')
        ? {
            ...rawWrapperChanges,
            title: rawWrapperChanges.label,
          }
        : rawWrapperChanges;
    const innerUid = current?.subModels?.field?.uid;
    const innerField = innerUid
      ? current?.subModels?.field ||
        (await this.repository.findModelById(innerUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        }))
      : null;
    const currentFieldInit =
      current?.stepParams?.fieldSettings?.init || innerField?.stepParams?.fieldSettings?.init || {};
    const bindingChange = hasDefinedValue(wrapperChanges, ['fieldPath', 'associationPathName']);
    const normalizedBinding = bindingChange
      ? this.normalizeDisplayFieldBinding({
          wrapperUse: current?.use,
          dataSourceKey: currentFieldInit.dataSourceKey,
          collectionName: currentFieldInit.collectionName,
          fieldPath: hasOwnDefined(wrapperChanges, 'fieldPath') ? wrapperChanges.fieldPath : currentFieldInit.fieldPath,
          associationPathName: hasOwnDefined(wrapperChanges, 'associationPathName')
            ? wrapperChanges.associationPathName
            : currentFieldInit.associationPathName,
        })
      : null;
    const canSyncTitleField = TITLE_FIELD_SUPPORTED_WRAPPER_USES.has(current?.use || '');
    const hasExistingTitleField =
      !_.isUndefined(current?.props?.titleField) || !_.isUndefined(innerField?.props?.titleField);
    const titleFieldSyncDecision = await this.resolveTitleFieldSyncDecision({
      wrapperUse: current?.use,
      dataSourceKey: currentFieldInit.dataSourceKey,
      collectionName: currentFieldInit.collectionName,
      fieldPath: hasOwnDefined(wrapperChanges, 'fieldPath') ? wrapperChanges.fieldPath : currentFieldInit.fieldPath,
      associationPathName: hasOwnDefined(wrapperChanges, 'associationPathName')
        ? wrapperChanges.associationPathName
        : currentFieldInit.associationPathName,
      ...(hasOwnDefined(wrapperChanges, 'titleField') ? { explicitTitleField: wrapperChanges.titleField } : {}),
      bindingChange,
      hasExistingTitleField,
      enabledPackages,
    });
    const shouldSyncTitleField = titleFieldSyncDecision.shouldSync;
    const syncedTitleField = titleFieldSyncDecision.titleField;

    if (Object.keys(wrapperChanges).length) {
      await this.updateSettings(
        {
          target,
          props: buildDefinedPayload(
            current?.use === 'TableColumnModel'
              ? {
                  title: wrapperChanges.title,
                  tooltip: wrapperChanges.tooltip,
                  width: wrapperChanges.width,
                  fixed: wrapperChanges.fixed,
                  sorter: wrapperChanges.sorter,
                  editable: wrapperChanges.editable,
                  dataIndex: wrapperChanges.dataIndex,
                  ...(canSyncTitleField && shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
                }
              : {
                  label: wrapperChanges.label,
                  tooltip: wrapperChanges.tooltip,
                  extra: wrapperChanges.extra,
                  showLabel: wrapperChanges.showLabel,
                  initialValue: wrapperChanges.initialValue,
                  required: wrapperChanges.required,
                  disabled: wrapperChanges.disabled,
                  multiple: wrapperChanges.multiple,
                  allowMultiple: wrapperChanges.allowMultiple,
                  maxCount: wrapperChanges.maxCount,
                  pattern: wrapperChanges.pattern,
                  ...(canSyncTitleField && shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
                  name: wrapperChanges.name,
                },
          ),
          decoratorProps:
            current?.use === 'TableColumnModel'
              ? undefined
              : buildDefinedPayload({
                  labelWidth: wrapperChanges.labelWidth,
                  labelWrap: wrapperChanges.labelWrap,
                }),
          stepParams:
            hasDefinedValue(wrapperChanges, ['fieldPath', 'associationPathName']) ||
            (current?.use === 'TableColumnModel' && hasOwnDefined(wrapperChanges, 'title'))
              ? buildDefinedPayload({
                  ...(current?.use === 'TableColumnModel' && hasOwnDefined(wrapperChanges, 'title')
                    ? {
                        tableColumnSettings: {
                          title: {
                            title: wrapperChanges.title,
                          },
                        },
                      }
                    : {}),
                })
              : undefined,
        },
        options,
      );
    }

    if (bindingChange && normalizedBinding) {
      await this.patchFieldSettingsInitExact(
        current,
        {
          dataSourceKey: normalizedBinding.dataSourceKey,
          collectionName: normalizedBinding.collectionName,
          fieldPath: normalizedBinding.fieldPath,
          associationPathName: normalizedBinding.associationPathName,
        },
        options.transaction,
      );
      if (innerField?.uid) {
        await this.patchFieldSettingsInitExact(
          innerField,
          {
            dataSourceKey: normalizedBinding.dataSourceKey,
            collectionName: normalizedBinding.collectionName,
            fieldPath: normalizedBinding.fieldPath,
            associationPathName: normalizedBinding.associationPathName,
          },
          options.transaction,
        );
      }
    }

    if (hasOwnDefined(changes, 'fieldComponent')) {
      if (!innerUid) {
        throwConflict(
          `flowSurfaces configure field wrapper '${current?.use}' cannot resolve inner field`,
          'FLOW_SURFACE_INNER_FIELD_MISSING',
        );
      }
      const normalizedFieldComponentUse = await this.rebuildFieldSubModelOnServer({
        wrapperNode: current,
        innerField,
        targetFieldUse: changes.fieldComponent,
        normalizedBinding,
        transaction: options.transaction,
      });
      await this.syncFieldComponentStepParams(current, normalizedFieldComponentUse, options.transaction);
    }

    if (shouldSyncTitleField) {
      if (!innerUid) {
        throwConflict(
          `flowSurfaces configure field wrapper '${current?.use}' cannot resolve inner field`,
          'FLOW_SURFACE_INNER_FIELD_MISSING',
        );
      }
      await this.updateSettings(
        {
          target: {
            uid: innerUid,
          },
          props: {
            titleField: syncedTitleField,
          },
        },
        options,
      );
    }

    if (hasDefinedValue(changes, ['clickToOpen', 'openView', 'code', 'version'])) {
      if (!innerUid) {
        throwConflict(
          `flowSurfaces configure field wrapper '${current?.use}' cannot resolve inner field`,
          'FLOW_SURFACE_INNER_FIELD_MISSING',
        );
      }
      return this.configureFieldNode(
        {
          uid: innerUid,
        },
        _.pick(changes, ['clickToOpen', 'openView', 'displayStyle', 'code', 'version']),
        options,
      );
    }

    return {
      uid: current.uid,
    };
  }

  private async configureFieldNode(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any; openViewActionName?: string },
  ) {
    const enabledPackages = await this.resolveEnabledPluginPackages(options);
    const resolved = await this.locator.resolve(target, options);
    const current = await this.loadResolvedNode(resolved, options.transaction);
    assertSupportedSimpleChanges(
      'field',
      changes,
      getConfigureOptionKeysForUse(current?.use || 'DisplayTextFieldModel'),
    );
    const parentUid = current?.uid ? await this.locator.findParentUid(current.uid, options.transaction) : null;
    const parentWrapper = parentUid
      ? await this.repository.findModelById(parentUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        })
      : null;
    const isJsFieldNode = ['JSFieldModel', 'JSEditableFieldModel'].includes(current?.use || '');
    if (hasDefinedValue(changes, ['code', 'version']) && !isJsFieldNode) {
      throwBadRequest(`flowSurfaces configure field '${current?.use}' does not support code/version`);
    }
    const currentFieldInit =
      current?.stepParams?.fieldSettings?.init || parentWrapper?.stepParams?.fieldSettings?.init || {};
    const bindingChange = hasDefinedValue(changes, ['fieldPath', 'associationPathName']);
    const normalizedBinding = bindingChange
      ? this.normalizeDisplayFieldBinding({
          wrapperUse: parentWrapper?.use,
          dataSourceKey: currentFieldInit.dataSourceKey,
          collectionName: currentFieldInit.collectionName,
          fieldPath: hasOwnDefined(changes, 'fieldPath') ? changes.fieldPath : currentFieldInit.fieldPath,
          associationPathName: hasOwnDefined(changes, 'associationPathName')
            ? changes.associationPathName
            : currentFieldInit.associationPathName,
        })
      : null;
    const canSyncWrapperTitleField = TITLE_FIELD_SUPPORTED_WRAPPER_USES.has(parentWrapper?.use || '');
    const hasExistingTitleField =
      !_.isUndefined(parentWrapper?.props?.titleField) || !_.isUndefined(current?.props?.titleField);
    const titleFieldSyncDecision = await this.resolveTitleFieldSyncDecision({
      wrapperUse: parentWrapper?.use,
      dataSourceKey: currentFieldInit.dataSourceKey,
      collectionName: currentFieldInit.collectionName,
      fieldPath: hasOwnDefined(changes, 'fieldPath') ? changes.fieldPath : currentFieldInit.fieldPath,
      associationPathName: hasOwnDefined(changes, 'associationPathName')
        ? changes.associationPathName
        : currentFieldInit.associationPathName,
      ...(hasOwnDefined(changes, 'titleField') ? { explicitTitleField: changes.titleField } : {}),
      bindingChange,
      hasExistingTitleField,
      enabledPackages,
    });
    const shouldSyncTitleField = titleFieldSyncDecision.shouldSync;
    const syncedTitleField = titleFieldSyncDecision.titleField;

    if (parentWrapper?.uid && canSyncWrapperTitleField && shouldSyncTitleField) {
      await this.updateSettings(
        {
          target: {
            uid: parentWrapper.uid,
          },
          props: shouldSyncTitleField
            ? {
                titleField: syncedTitleField,
              }
            : undefined,
        },
        options,
      );
    }
    if (bindingChange && normalizedBinding) {
      if (parentWrapper?.uid) {
        await this.patchFieldSettingsInitExact(
          parentWrapper,
          {
            dataSourceKey: normalizedBinding.dataSourceKey,
            collectionName: normalizedBinding.collectionName,
            fieldPath: normalizedBinding.fieldPath,
            associationPathName: normalizedBinding.associationPathName,
          },
          options.transaction,
        );
      }
      await this.patchFieldSettingsInitExact(
        current,
        {
          dataSourceKey: normalizedBinding.dataSourceKey,
          collectionName: normalizedBinding.collectionName,
          fieldPath: normalizedBinding.fieldPath,
          associationPathName: normalizedBinding.associationPathName,
        },
        options.transaction,
      );
    }

    const effectiveClickToOpen = hasOwnDefined(changes, 'clickToOpen')
      ? changes.clickToOpen
      : !_.isUndefined(changes.openView)
        ? true
        : undefined;
    const normalizedOpenView = hasOwnDefined(changes, 'openView')
      ? this.applyFieldOpenViewContext(current, parentWrapper, _.cloneDeep(changes.openView))
      : undefined;
    const exactBindingInit =
      bindingChange && normalizedBinding
        ? {
            fieldSettings: {
              init: this.buildExactFieldSettingsInitPayload({
                dataSourceKey: normalizedBinding.dataSourceKey,
                collectionName: normalizedBinding.collectionName,
                fieldPath: normalizedBinding.fieldPath,
                associationPathName: normalizedBinding.associationPathName,
              }),
            },
          }
        : undefined;
    const result = await this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          icon: changes.icon,
          autoSize: changes.autoSize,
          allowClear: changes.allowClear,
          multiple: changes.multiple,
          allowMultiple: changes.allowMultiple,
          quickCreate: changes.quickCreate,
          displayStyle: changes.displayStyle,
          options: changes.options,
          ...(shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
          ...(hasOwnDefined(changes, 'clickToOpen') || !_.isUndefined(changes.openView)
            ? { clickToOpen: effectiveClickToOpen }
            : {}),
        }),
        stepParams: buildDefinedPayload({
          ...(!parentWrapper?.uid && exactBindingInit ? exactBindingInit : {}),
          ...(hasOwnDefined(changes, 'clickToOpen') || !_.isUndefined(changes.openView)
            ? {
                displayFieldSettings: {
                  ...(hasOwnDefined(changes, 'displayStyle')
                    ? {
                        displayStyle: {
                          displayStyle: changes.displayStyle,
                        },
                      }
                    : {}),
                  clickToOpen: {
                    clickToOpen: effectiveClickToOpen,
                  },
                },
              }
            : hasOwnDefined(changes, 'displayStyle')
              ? {
                  displayFieldSettings: {
                    displayStyle: {
                      displayStyle: changes.displayStyle,
                    },
                  },
                }
              : {}),
          ...(hasOwnDefined(changes, 'openView')
            ? {
                popupSettings: {
                  openView: normalizedOpenView,
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['code', 'version'])
            ? {
                jsSettings: {
                  runJs: buildDefinedPayload({
                    code: changes.code,
                    version: changes.version,
                  }),
                },
              }
            : {}),
        }),
      },
      {
        ...options,
        openViewActionName: options.openViewActionName || 'configure field',
        popupTemplateHostUid: target.uid,
      },
    );
    if (hasOwnDefined(changes, 'openView')) {
      return {
        ...result,
        ...(await this.ensureLocalFieldPopupSurface(
          options.openViewActionName || 'configure field',
          target.uid,
          options,
        )),
        ...(await this.collectPopupSurfaceKeys(target.uid, options.transaction)),
      };
    }
    return result;
  }

  private async configureActionNode(
    target: FlowSurfaceWriteTarget,
    use: string,
    changes: Record<string, any>,
    options: { transaction?: any; openViewActionName?: string },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse(use);
    assertSupportedSimpleChanges('action', changes, allowedKeys);
    const stepParams: Record<string, any> = {};
    if (hasDefinedValue(changes, ['title', 'tooltip', 'icon', 'type', 'danger', 'color', 'linkageRules'])) {
      stepParams.buttonSettings = {
        ...(hasDefinedValue(changes, ['title', 'tooltip', 'icon', 'type', 'danger', 'color'])
          ? {
              general: buildDefinedPayload({
                title: changes.title,
                tooltip: changes.tooltip,
                icon: changes.icon,
                type: changes.type,
                danger: changes.danger,
                color: changes.color,
              }),
            }
          : {}),
        ...(hasOwnDefined(changes, 'linkageRules') ? { linkageRules: changes.linkageRules } : {}),
      };
    }
    if (!_.isUndefined(changes.openView)) {
      if (use === 'UploadActionModel') {
        stepParams.selectExitRecordSettings = {
          openView: _.cloneDeep(changes.openView),
        };
      } else if (!POPUP_ACTION_USES.has(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support openView`);
      } else {
        stepParams.popupSettings = {
          openView: _.cloneDeep(changes.openView),
        };
      }
    }
    if (!_.isUndefined(changes.confirm)) {
      if (DELETE_ACTION_USES.has(use)) {
        stepParams.deleteSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else if (CONFIRMABLE_SUBMIT_ACTION_USES.has(use)) {
        stepParams.submitSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else if (['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        stepParams.assignSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support confirm`);
      }
    }
    if (hasOwnDefined(changes, 'assignValues')) {
      if (!['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support assignValues`);
      }
      stepParams.assignSettings = {
        ...(stepParams.assignSettings || {}),
        assignFieldValues: {
          assignedValues: changes.assignValues,
        },
      };
      stepParams.apply = {
        apply: {
          assignedValues: changes.assignValues,
        },
      };
    }
    if (hasOwnDefined(changes, 'editMode')) {
      if (use !== 'BulkEditActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support editMode`);
      }
      stepParams.bulkEditSettings = {
        editMode: {
          value: changes.editMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'updateMode')) {
      if (!['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support updateMode`);
      }
      stepParams.assignSettings = {
        ...(stepParams.assignSettings || {}),
        updateMode: {
          value: changes.updateMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'duplicateMode')) {
      if (use !== 'DuplicateActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support duplicateMode`);
      }
      stepParams.duplicateModeSettings = {
        duplicateMode: {
          duplicateMode: changes.duplicateMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'collapsedRows') || hasOwnDefined(changes, 'defaultCollapsed')) {
      if (use !== 'FilterFormCollapseActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support collapsedRows/defaultCollapsed`);
      }
      stepParams.collapseSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'collapsedRows')
          ? {
              toggle: {
                collapsedRows: changes.collapsedRows,
              },
            }
          : {}),
        ...(hasOwnDefined(changes, 'defaultCollapsed')
          ? {
              defaultCollapsed: {
                value: changes.defaultCollapsed,
              },
            }
          : {}),
      });
    }
    if (hasOwnDefined(changes, 'emailFieldNames') || hasOwnDefined(changes, 'defaultSelectAllRecords')) {
      if (use !== 'MailSendActionModel') {
        throwBadRequest(
          `flowSurfaces configure action '${use}' does not support emailFieldNames/defaultSelectAllRecords`,
        );
      }
      stepParams.sendEmailSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'emailFieldNames')
          ? {
              emailFieldNames: {
                value: changes.emailFieldNames,
              },
            }
          : {}),
        ...(hasOwnDefined(changes, 'defaultSelectAllRecords')
          ? {
              defaultSelectAllRecords: {
                value: changes.defaultSelectAllRecords,
              },
            }
          : {}),
      });
    }
    if (hasDefinedValue(changes, ['code', 'version'])) {
      if (!JS_ACTION_USES.has(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support code/version`);
      }
      stepParams.clickSettings = {
        runJs: buildDefinedPayload({
          code: changes.code,
          version: changes.version,
        }),
      };
    }

    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          icon: changes.icon,
          type: changes.type,
          htmlType: changes.htmlType,
          position: changes.position,
          danger: changes.danger,
          color: changes.color,
        }),
        stepParams: Object.keys(stepParams).length ? stepParams : undefined,
      },
      {
        ...options,
        openViewActionName: options.openViewActionName || 'configure action',
        popupTemplateHostUid: target.uid,
      },
    );
  }

  private async buildFieldCatalog(
    target: FlowSurfaceWriteTarget,
    options: {
      transaction?: any;
      includeConfigureOptions?: boolean;
      includeContracts?: boolean;
      enabledPackages?: ReadonlySet<string>;
    } = {},
  ): Promise<FlowSurfaceCatalogProjectableItem[]> {
    const resolved = await this.locator.resolve(target, { transaction: options.transaction });
    const container = await this.surfaceContext
      .resolveFieldContainer(resolved.uid, options.transaction)
      .catch(() => null);
    if (!container) {
      return [];
    }
    if (container.wrapperUse === 'FilterFormItemModel') {
      const targets = await this.surfaceContext.collectFilterFormTargets(container.ownerUid, options.transaction);
      if (!targets.length) {
        const resourceContext = await this.locator
          .resolveCollectionContext(container.ownerUid, options.transaction)
          .catch(() => null);
        if (!resourceContext?.resourceInit) {
          return [];
        }
        return this.buildFieldCatalogEntriesForResource({
          ownerUse: container.ownerUse,
          resourceInit: resourceContext.resourceInit,
          requireDefaultTargetUid: false,
          includeConfigureOptions: options.includeConfigureOptions,
          includeContracts: options.includeContracts,
          enabledPackages: options.enabledPackages,
        });
      }
      return targets.flatMap((targetBlock) =>
        this.buildFieldCatalogEntriesForResource({
          ownerUse: container.ownerUse,
          resourceInit: targetBlock.resourceInit,
          targetBlockUid: targetBlock.ownerUid,
          targetLabel: targetBlock.label,
          multiTarget: targets.length > 1,
          requireDefaultTargetUid: targets.length > 1,
          includeConfigureOptions: options.includeConfigureOptions,
          includeContracts: options.includeContracts,
          enabledPackages: options.enabledPackages,
        }),
      );
    }
    const resourceContext = await this.locator.resolveCollectionContext(container.ownerUid, options.transaction);
    if (!resourceContext?.resourceInit) {
      return [];
    }
    return this.buildFieldCatalogEntriesForResource({
      ownerUse: container.ownerUse,
      resourceInit: resourceContext.resourceInit,
      includeConfigureOptions: options.includeConfigureOptions,
      includeContracts: options.includeContracts,
      enabledPackages: options.enabledPackages,
    });
  }

  private getFieldMenuCatalogMode(ownerUse: string) {
    if (UI_FIELD_MENU_TABLE_OWNER_USES.has(ownerUse)) {
      return 'table';
    }
    if (UI_FIELD_MENU_DETAILS_OWNER_USES.has(ownerUse)) {
      return 'details';
    }
    if (UI_FIELD_MENU_FORM_OWNER_USES.has(ownerUse)) {
      return 'form';
    }
    return null;
  }

  private resolveRegisteredFieldBinding(input: {
    containerUse: string;
    field: any;
    dataSourceKey: string;
    enabledPackages?: ReadonlySet<string>;
    useStrictOnly?: boolean;
  }) {
    return resolveRegisteredFieldBinding({
      containerUse: input.containerUse,
      field: input.field,
      dataSourceKey: input.dataSourceKey,
      enabledPackages: input.enabledPackages,
      getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
      useStrictOnly: input.useStrictOnly,
    });
  }

  private resolveAssociationLeafDisplaySemantics(
    field: any,
    dataSourceKey: string,
    enabledPackages?: ReadonlySet<string>,
  ) {
    const registeredBinding = this.resolveRegisteredFieldBinding({
      containerUse: 'DetailsItemModel',
      field,
      dataSourceKey,
      enabledPackages,
      useStrictOnly: true,
    });
    if (registeredBinding?.modelClassName) {
      return {
        fieldUse: registeredBinding.modelClassName,
        defaultTitleField: undefined,
      };
    }

    if (isAssociationField(field)) {
      const defaultTitleField = this.getAssociationDefaultTitleFieldName(field, dataSourceKey);
      if (!defaultTitleField) {
        return null;
      }
      return {
        fieldUse: 'DisplayTextFieldModel',
        defaultTitleField,
      };
    }

    const fieldUse = inferAssociationLeafDisplayFieldUse(getFieldInterface(field));
    if (!fieldUse) {
      return null;
    }
    return {
      fieldUse,
      defaultTitleField: undefined,
    };
  }

  private buildFieldMenuDirectCandidates(input: {
    mode: 'table' | 'details' | 'form';
    ownerUse: string;
    resourceInit: Record<string, any>;
    enabledPackages?: ReadonlySet<string>;
  }) {
    const collection = this.getCollection(input.resourceInit.dataSourceKey, input.resourceInit.collectionName);
    return getCollectionFields(collection).flatMap((field) => {
      const fieldName = getFieldName(field);
      const fieldInterface = getFieldInterface(field);
      if (!fieldName || !fieldInterface) {
        return [];
      }
      if (input.mode === 'table' && field?.options?.treeChildren) {
        return [];
      }

      const registeredBinding = this.resolveRegisteredFieldBinding({
        containerUse: input.ownerUse,
        field,
        dataSourceKey: input.resourceInit.dataSourceKey,
        enabledPackages: input.enabledPackages,
        useStrictOnly: true,
      });

      if (isAssociationField(field)) {
        if (!registeredBinding?.modelClassName) {
          const safeTitleField = this.getAssociationDefaultTitleFieldName(field, input.resourceInit.dataSourceKey);
          if (!safeTitleField) {
            return [];
          }
        }
      } else if (!registeredBinding?.modelClassName) {
        const hasLegacyCapability =
          input.mode === 'form'
            ? !!inferFieldMenuEditableFieldUse(fieldInterface)
            : !!inferAssociationLeafDisplayFieldUse(fieldInterface);
        if (!hasLegacyCapability) {
          return [];
        }
      }

      return [
        {
          field,
          fieldPath: fieldName,
          label: getFieldTitle(field),
          supportsJs: true,
        },
      ];
    });
  }

  private collectFieldMenuAssociationLeafCandidates(input: {
    mode: 'table' | 'details' | 'form';
    ownerUse: string;
    collection: any;
    dataSourceKey: string;
    pathPrefix?: string;
    titlePrefix?: string[];
    visitedCollectionKeys?: string[];
    enabledPackages?: ReadonlySet<string>;
  }): FlowSurfaceFieldMenuCandidate[] {
    const collection = input.collection;
    if (!collection) {
      return [];
    }

    const visitedCollectionKeys = _.castArray(input.visitedCollectionKeys || []);
    const nextCandidates: FlowSurfaceFieldMenuCandidate[] = [];

    for (const field of getCollectionFields(collection)) {
      if (!getFieldInterface(field) || !isAssociationField(field)) {
        continue;
      }

      const fieldInterface = String(getFieldInterface(field) || '').trim();
      if (MULTI_VALUE_ASSOCIATION_INTERFACES.has(fieldInterface)) {
        continue;
      }

      const associationFieldName = getFieldName(field);
      const associationFieldTitle = getFieldTitle(field);
      if (!associationFieldName) {
        continue;
      }

      const targetCollection = resolveFieldTargetCollection(
        field,
        input.dataSourceKey,
        (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
      );
      if (!targetCollection) {
        continue;
      }

      const associationPathName = input.pathPrefix
        ? `${input.pathPrefix}.${associationFieldName}`
        : associationFieldName;
      const titlePrefix = [..._.castArray(input.titlePrefix || []), associationFieldTitle];

      for (const targetField of getCollectionFields(targetCollection)) {
        if (!getFieldInterface(targetField)) {
          continue;
        }
        const displaySemantics = this.resolveAssociationLeafDisplaySemantics(
          targetField,
          input.dataSourceKey,
          input.enabledPackages,
        );
        if (!displaySemantics) {
          continue;
        }
        const targetFieldName = getFieldName(targetField);
        if (!targetFieldName) {
          continue;
        }
        nextCandidates.push({
          field: targetField,
          fieldPath: `${associationPathName}.${targetFieldName}`,
          associationPathName,
          label: [...titlePrefix, getFieldTitle(targetField)].join(' / '),
          supportsJs: input.mode !== 'form',
          explicitWrapperUse: input.mode === 'form' ? 'FormAssociationItemModel' : undefined,
          explicitFieldUse: displaySemantics.fieldUse,
          defaultTitleField: displaySemantics.defaultTitleField,
        });
      }

      const cycleKey = buildCatalogCollectionCycleKey(targetCollection, input.dataSourceKey);
      if (cycleKey && visitedCollectionKeys.includes(cycleKey)) {
        continue;
      }
      nextCandidates.push(
        ...this.collectFieldMenuAssociationLeafCandidates({
          ...input,
          collection: targetCollection,
          pathPrefix: associationPathName,
          titlePrefix,
          visitedCollectionKeys: cycleKey ? [...visitedCollectionKeys, cycleKey] : visitedCollectionKeys,
          enabledPackages: input.enabledPackages,
        }),
      );
    }

    return nextCandidates;
  }

  private buildFieldMenuCandidates(input: {
    ownerUse: string;
    resourceInit: Record<string, any>;
    enabledPackages?: ReadonlySet<string>;
  }): FlowSurfaceFieldMenuCandidate[] {
    const mode = this.getFieldMenuCatalogMode(input.ownerUse);
    if (!mode) {
      return [];
    }

    const collection = this.getCollection(input.resourceInit.dataSourceKey, input.resourceInit.collectionName);
    if (!collection) {
      return [];
    }

    const rootCycleKey = buildCatalogCollectionCycleKey(collection, input.resourceInit.dataSourceKey);
    return dedupeVisibleFieldCandidates([
      ...this.buildFieldMenuDirectCandidates({
        mode,
        ownerUse: input.ownerUse,
        resourceInit: input.resourceInit,
        enabledPackages: input.enabledPackages,
      }),
      ...this.collectFieldMenuAssociationLeafCandidates({
        mode,
        ownerUse: input.ownerUse,
        collection,
        dataSourceKey: input.resourceInit.dataSourceKey,
        visitedCollectionKeys: rootCycleKey ? [rootCycleKey] : [],
        enabledPackages: input.enabledPackages,
      }),
    ]);
  }

  private findFieldMenuCandidate(input: {
    ownerUse: string;
    resourceInit: Record<string, any>;
    fieldPath: string;
    associationPathName?: string;
    enabledPackages?: ReadonlySet<string>;
  }) {
    const candidates = this.buildFieldMenuCandidates({
      ownerUse: input.ownerUse,
      resourceInit: input.resourceInit,
      enabledPackages: input.enabledPackages,
    });
    const normalizedFieldPath = normalizeFieldPath(input.fieldPath, input.associationPathName);
    return (
      candidates.find(
        (candidate) => normalizeFieldPath(candidate.fieldPath, candidate.associationPathName) === normalizedFieldPath,
      ) || null
    );
  }

  private buildCatalogItemOptionalFields(
    use: string,
    options: {
      includeConfigureOptions?: boolean;
      includeContracts?: boolean;
    } = {},
  ) {
    return buildDefinedPayload({
      ...(options.includeContracts
        ? {
            editableDomains: this.getEditableDomains(use),
            settingsSchema: getSettingsSchemaForUse(use),
            settingsContract: getNodeContract(use).domains,
          }
        : {}),
      ...(options.includeConfigureOptions ? { configureOptions: getConfigureOptionsForUse(use) } : {}),
    });
  }

  private buildFieldCatalogEntriesForResource(input: {
    ownerUse: string;
    resourceInit: Record<string, any>;
    targetBlockUid?: string;
    targetLabel?: string;
    multiTarget?: boolean;
    requireDefaultTargetUid?: boolean;
    includeConfigureOptions?: boolean;
    includeContracts?: boolean;
    enabledPackages?: ReadonlySet<string>;
  }): FlowSurfaceCatalogProjectableItem[] {
    const containerKind = normalizeFieldContainerKind(input.ownerUse);
    const targetPrefix = input.multiTarget && input.targetLabel ? `${input.targetLabel} / ` : '';
    const fieldMenuEntries = this.buildFieldMenuCandidates({
      ownerUse: input.ownerUse,
      resourceInit: input.resourceInit,
      enabledPackages: input.enabledPackages,
    });
    if (fieldMenuEntries.length) {
      const semanticEntries = fieldMenuEntries.flatMap((item) => {
        const label = `${targetPrefix}${item.label}`;
        const entries: FlowSurfaceCatalogProjectableItem[] = [];
        const pushEntry = (semantic: { renderer?: 'js'; type?: 'jsColumn' | 'jsItem' } = {}) => {
          if (semantic.renderer === 'js' && !item.supportsJs) {
            return;
          }

          let wrapperUse = item.explicitWrapperUse;
          let fieldUse = item.explicitFieldUse;
          let standaloneUse: string | undefined;

          if (semantic.renderer || semantic.type || !wrapperUse || !fieldUse) {
            const capabilityField = this.resolvePreferredFieldForCapability({
              containerUse: input.ownerUse,
              dataSourceKey: input.resourceInit.dataSourceKey,
              associationPathName: item.associationPathName,
              field: item.field,
            });
            const fieldCapability = resolveSupportedFieldCapability({
              containerUse: input.ownerUse,
              field: capabilityField,
              requestedRenderer: semantic.renderer,
              requestedType: semantic.type,
              enabledPackages: input.enabledPackages,
              dataSourceKey: input.resourceInit.dataSourceKey,
              getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
            });
            wrapperUse = wrapperUse || fieldCapability.wrapperUse;
            fieldUse = fieldUse || fieldCapability.fieldUse;
            standaloneUse = fieldCapability.standaloneUse;
          }

          const use = standaloneUse || wrapperUse;
          if (!use) {
            return;
          }

          entries.push({
            key: semantic.type ? semantic.type : semantic.renderer === 'js' ? `js:${item.fieldPath}` : item.fieldPath,
            label: semantic.type ? `JS / ${semantic.type}` : semantic.renderer === 'js' ? `JS / ${label}` : label,
            kind: 'field',
            use,
            fieldUse: standaloneUse || fieldUse,
            wrapperUse,
            associationPathName: item.associationPathName,
            ...(semantic.renderer ? { renderer: semantic.renderer } : {}),
            ...(semantic.type ? { type: semantic.type } : {}),
            ...(input.targetBlockUid
              ? { defaultTargetUid: input.targetBlockUid, targetBlockUid: input.targetBlockUid }
              : {}),
            requiredInitParams: semantic.type
              ? []
              : wrapperUse === 'FilterFormItemModel' && input.requireDefaultTargetUid
                ? ['fieldPath', 'defaultTargetUid']
                : ['fieldPath'],
            ...this.buildCatalogItemOptionalFields(use, input),
          });
        };

        pushEntry();
        if (containerKind === 'form' || containerKind === 'details' || containerKind === 'table') {
          pushEntry({ renderer: 'js' });
        }
        return entries;
      });

      if (containerKind === 'table') {
        semanticEntries.push({
          key: 'jsColumn',
          label: 'JS / jsColumn',
          kind: 'field',
          use: 'JSColumnModel',
          fieldUse: 'JSColumnModel',
          type: 'jsColumn',
          requiredInitParams: [],
          ...this.buildCatalogItemOptionalFields('JSColumnModel', input),
        });
      }

      if (containerKind === 'form') {
        semanticEntries.push({
          key: 'jsItem',
          label: 'JS / jsItem',
          kind: 'field',
          use: 'JSItemModel',
          fieldUse: 'JSItemModel',
          type: 'jsItem',
          requiredInitParams: [],
          ...this.buildCatalogItemOptionalFields('JSItemModel', input),
        });
      }

      return semanticEntries;
    }

    return this.buildLegacyFieldCatalogEntriesForResource(input);
  }

  private buildLegacyFieldCatalogEntriesForResource(input: {
    ownerUse: string;
    resourceInit: Record<string, any>;
    targetBlockUid?: string;
    targetLabel?: string;
    multiTarget?: boolean;
    requireDefaultTargetUid?: boolean;
    includeConfigureOptions?: boolean;
    includeContracts?: boolean;
    enabledPackages?: ReadonlySet<string>;
  }): FlowSurfaceCatalogProjectableItem[] {
    const collection = this.getCollection(input.resourceInit.dataSourceKey, input.resourceInit.collectionName);
    const getFields = (targetCollection: any) => getCollectionFields(targetCollection);
    const isFilterFieldVisible = (field: any) => getFieldFilterable(field) !== false && !!getFieldInterface(field);
    const directFields = getFields(collection).filter((field) =>
      ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(input.ownerUse)
        ? isFilterFieldVisible(field)
        : !!getFieldInterface(field),
    );
    if (!directFields.length && !collection) {
      return [];
    }
    const associationLeafFields = directFields.flatMap((field) => {
      const targetCollection = resolveFieldTargetCollection(
        field,
        input.resourceInit.dataSourceKey,
        (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
      );
      if (!isAssociationField(field) || !targetCollection) {
        return [];
      }
      return getFields(targetCollection)
        .filter((targetField) =>
          ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(input.ownerUse)
            ? isFilterFieldVisible(targetField)
            : !!getFieldInterface(targetField),
        )
        .map((targetField) => ({
          field: targetField,
          fieldPath: `${getFieldName(field)}.${getFieldName(targetField)}`,
          associationPathName: getFieldName(field),
          label: `${getFieldTitle(field)} / ${getFieldTitle(targetField)}`,
        }));
    });

    const containerKind = normalizeFieldContainerKind(input.ownerUse);
    const targetPrefix = input.multiTarget && input.targetLabel ? `${input.targetLabel} / ` : '';
    const baseEntries = [
      ...directFields.map((field) => ({
        field,
        fieldPath: getFieldName(field),
        associationPathName: undefined,
        label: getFieldTitle(field),
      })),
      ...associationLeafFields,
    ];

    const semanticEntries = baseEntries
      .filter((item) => !!getFieldInterface(item?.field))
      .flatMap((item) => {
        const label = `${targetPrefix}${item.label}`;
        const entries: FlowSurfaceCatalogProjectableItem[] = [];
        const pushEntry = (semantic: { renderer?: 'js'; type?: 'jsColumn' | 'jsItem' } = {}) => {
          const capabilityField = this.resolvePreferredFieldForCapability({
            containerUse: input.ownerUse,
            dataSourceKey: input.resourceInit.dataSourceKey,
            associationPathName: item.associationPathName,
            field: item.field,
          });
          const fieldCapability = resolveSupportedFieldCapability({
            containerUse: input.ownerUse,
            field: capabilityField,
            requestedRenderer: semantic.renderer,
            requestedType: semantic.type,
            enabledPackages: input.enabledPackages,
            dataSourceKey: input.resourceInit.dataSourceKey,
            getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
          });
          const use = fieldCapability.standaloneUse || fieldCapability.wrapperUse;
          if (!use) {
            return;
          }
          entries.push({
            key: semantic.type ? semantic.type : semantic.renderer === 'js' ? `js:${item.fieldPath}` : item.fieldPath,
            label: semantic.type ? `JS / ${semantic.type}` : semantic.renderer === 'js' ? `JS / ${label}` : label,
            kind: 'field',
            use,
            fieldUse: fieldCapability.standaloneUse || fieldCapability.fieldUse,
            wrapperUse: fieldCapability.wrapperUse,
            associationPathName: item.associationPathName,
            ...(semantic.renderer ? { renderer: semantic.renderer } : {}),
            ...(semantic.type ? { type: semantic.type } : {}),
            ...(input.targetBlockUid
              ? { defaultTargetUid: input.targetBlockUid, targetBlockUid: input.targetBlockUid }
              : {}),
            requiredInitParams: semantic.type
              ? []
              : fieldCapability.wrapperUse === 'FilterFormItemModel' && input.requireDefaultTargetUid
                ? ['fieldPath', 'defaultTargetUid']
                : ['fieldPath'],
            ...this.buildCatalogItemOptionalFields(use, input),
          });
        };

        pushEntry();
        if (containerKind === 'form' || containerKind === 'details' || containerKind === 'table') {
          pushEntry({ renderer: 'js' });
        }
        return entries;
      });

    if (containerKind === 'table') {
      semanticEntries.push({
        key: 'jsColumn',
        label: 'JS / jsColumn',
        kind: 'field',
        use: 'JSColumnModel',
        fieldUse: 'JSColumnModel',
        type: 'jsColumn',
        requiredInitParams: [],
        ...this.buildCatalogItemOptionalFields('JSColumnModel', input),
      });
    }

    if (containerKind === 'form') {
      semanticEntries.push({
        key: 'jsItem',
        label: 'JS / jsItem',
        kind: 'field',
        use: 'JSItemModel',
        fieldUse: 'JSItemModel',
        type: 'jsItem',
        requiredInitParams: [],
        ...this.buildCatalogItemOptionalFields('JSItemModel', input),
      });
    }

    return semanticEntries;
  }

  private async findOwningBlockGrid(uid: string, transaction?: any) {
    let cursor = uid;
    while (cursor) {
      const node = await this.repository.findModelById(cursor, { transaction, includeAsyncNode: true });
      if (node?.use === 'BlockGridModel') {
        return node;
      }
      cursor = await this.locator.findParentUid(cursor, transaction);
    }
    return null;
  }

  private isFilterFormFieldPathAvailableForResource(
    resourceInit: Record<string, any> | undefined,
    fieldPath?: string,
    associationPathName?: string,
  ) {
    if (!resourceInit?.dataSourceKey || !resourceInit?.collectionName || !fieldPath) {
      return false;
    }
    const collection = this.getCollection(resourceInit.dataSourceKey, resourceInit.collectionName);
    if (!collection) {
      return false;
    }
    return !!resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath, associationPathName));
  }

  private async persistFilterFormConnectConfig(
    input: {
      filterModelUid: string;
      filterFormOwnerUid: string;
      targetBlockUid: string;
      resourceInit: Record<string, any>;
      fieldPath: string;
      associationPathName?: string;
    },
    transaction?: any,
  ) {
    const blockGrid = await this.findOwningBlockGrid(input.filterFormOwnerUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.filterId !== input.filterModelUid);
    nextConfigs.push({
      filterId: input.filterModelUid,
      targetId: input.targetBlockUid,
      filterPaths: this.buildFilterFormTargetPaths(input.resourceInit, input.fieldPath, input.associationPathName),
    });
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private async removeFilterFormConnectConfig(filterModelUid: string, transaction?: any) {
    const blockGrid = await this.findOwningBlockGrid(filterModelUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.filterId !== filterModelUid);
    if (_.isEqual(nextConfigs, currentConfigs)) {
      return;
    }
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private async removeFilterFormTargetBindings(targetBlockUid: string, transaction?: any) {
    const blockGrid = await this.findOwningBlockGrid(targetBlockUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.targetId !== targetBlockUid);
    if (_.isEqual(nextConfigs, currentConfigs)) {
      return;
    }
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private collectChartBlockUidsFromTree(node: any) {
    if (!node?.uid) {
      return [];
    }
    return Object.values(flattenModel(node))
      .filter((item: any) => item?.use === 'ChartBlockModel' && item?.uid)
      .map((item: any) => item.uid);
  }

  private async removeFlowSqlBindingsForChartUids(uids: string[], transaction?: any) {
    const uniqueUids = _.uniq(uids.filter(Boolean));
    if (!uniqueUids.length) {
      return;
    }
    const repo = this.db.getRepository('flowSql');
    for (const uid of uniqueUids) {
      await repo.destroy({
        filterByTk: uid,
        transaction,
      });
    }
  }

  private async removeFlowSqlBindingsForNodeTree(node: any, transaction?: any) {
    await this.removeFlowSqlBindingsForChartUids(this.collectChartBlockUidsFromTree(node), transaction);
  }

  private async persistChartSqlBinding(node: any, transaction?: any) {
    if (node?.use !== 'ChartBlockModel' || !node?.uid) {
      return;
    }
    const repo = this.db.getRepository('flowSql');
    const configure = _.get(node, ['stepParams', 'chartSettings', 'configure']);
    const query = _.get(configure, ['query']);
    if (query?.mode !== 'sql') {
      await repo.destroy({
        filterByTk: node.uid,
        transaction,
      });
      return;
    }
    const sql = typeof query?.sql === 'string' ? query.sql.trim() : '';
    if (!sql) {
      await repo.destroy({
        filterByTk: node.uid,
        transaction,
      });
      return;
    }
    await repo.updateOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: node.uid,
        sql,
        dataSourceKey: query?.sqlDatasource,
      },
      transaction,
    });
  }

  private async syncChartDataBindingsForNode(node: any, transaction?: any) {
    if (node?.use !== 'ChartBlockModel' || !node?.uid) {
      return;
    }

    await this.persistChartSqlBinding(node, transaction);

    const blockGrid = await this.findOwningBlockGrid(node.uid, transaction);
    if (!blockGrid?.uid) {
      return;
    }

    const nodeMap = flattenModel(blockGrid);
    const targetFilterNodes = Object.values(nodeMap).filter((item: any) => {
      if (item?.use !== 'FilterFormItemModel') {
        return false;
      }
      return _.get(item, ['stepParams', 'filterFormItemSettings', 'init', 'defaultTargetUid']) === node.uid;
    });

    for (const filterNode of targetFilterNodes) {
      await this.syncFilterFormConnectConfigForNode(filterNode, transaction, {
        skipIfTargetUnavailable: true,
      });
    }
  }

  private async syncFilterFormConnectConfigForNode(
    node: any,
    transaction?: any,
    options: { skipIfTargetUnavailable?: boolean } = {},
  ) {
    if (node?.use !== 'FilterFormItemModel' || !node?.uid) {
      return;
    }

    const fieldInit = _.get(node, ['stepParams', 'fieldSettings', 'init']) || {};
    const defaultTargetUid = _.get(node, ['stepParams', 'filterFormItemSettings', 'init', 'defaultTargetUid']);
    if (!fieldInit?.fieldPath || !defaultTargetUid) {
      await this.removeFilterFormConnectConfig(node.uid, transaction);
      return;
    }

    const parentUid = await this.locator.findParentUid(node.uid, transaction);
    if (!parentUid) {
      return;
    }
    const container = await this.surfaceContext.resolveFieldContainer(parentUid, transaction).catch(() => null);
    if (!container || container.wrapperUse !== 'FilterFormItemModel') {
      return;
    }

    const target = await this.surfaceContext
      .resolveFilterFormTarget(container.ownerUid, defaultTargetUid, transaction)
      .catch(async (error) => {
        if (!options.skipIfTargetUnavailable) {
          throw error;
        }
        await this.removeFilterFormConnectConfig(node.uid, transaction);
        return null;
      });
    if (!target) {
      return;
    }
    if (
      !this.isFilterFormFieldPathAvailableForResource(
        target.resourceInit,
        fieldInit.fieldPath,
        fieldInit.associationPathName,
      )
    ) {
      await this.removeFilterFormConnectConfig(node.uid, transaction);
      return;
    }
    await this.persistFilterFormConnectConfig(
      {
        filterModelUid: node.uid,
        filterFormOwnerUid: container.ownerUid,
        targetBlockUid: target.ownerUid,
        resourceInit: target.resourceInit,
        fieldPath: fieldInit.fieldPath,
        associationPathName: fieldInit.associationPathName,
      },
      transaction,
    );
  }

  private async syncFieldBindingSettingsForNode(current: any, effectiveNode: any, transaction?: any) {
    const nextFieldSettings = _.cloneDeep(effectiveNode?.stepParams?.fieldSettings);
    if (!nextFieldSettings || !current?.uid) {
      return;
    }

    if (FIELD_WRAPPER_USES.has(current.use || '')) {
      const innerFieldUid = effectiveNode?.subModels?.field?.uid || current?.subModels?.field?.uid;
      if (innerFieldUid) {
        const innerField =
          current?.subModels?.field ||
          (await this.repository.findModelById(innerFieldUid, { transaction, includeAsyncNode: true }));
        if (innerField?.uid) {
          await this.repository.patch(
            {
              uid: innerField.uid,
              stepParams: {
                ...(innerField.stepParams || {}),
                fieldSettings: nextFieldSettings,
              },
            },
            { transaction },
          );
        }
      }
      if (current.use === 'FilterFormItemModel') {
        await this.syncFilterFormConnectConfigForNode(effectiveNode, transaction);
      }
      return;
    }

    const parentUid = await this.locator.findParentUid(current.uid, transaction);
    if (!parentUid) {
      return;
    }
    const parentNode = await this.repository.findModelById(parentUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!FIELD_WRAPPER_USES.has(parentNode?.use || '')) {
      return;
    }

    const nextWrapper = {
      ...parentNode,
      stepParams: {
        ...(parentNode?.stepParams || {}),
        fieldSettings: nextFieldSettings,
      },
    };
    await this.repository.patch(
      {
        uid: parentUid,
        stepParams: nextWrapper.stepParams,
      },
      { transaction },
    );

    if (parentNode.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(nextWrapper, transaction);
    }
  }

  private buildFilterFormTargetPaths(
    resourceInit: Record<string, any>,
    fieldPath: string,
    associationPathName?: string,
  ) {
    const persistedFieldPath = normalizeFieldPath(fieldPath, associationPathName);
    const collection = this.getCollection(resourceInit.dataSourceKey, resourceInit.collectionName);
    const field = resolveFieldFromCollection(collection, persistedFieldPath);
    const targetCollection = resolveFieldTargetCollection(
      field,
      resourceInit.dataSourceKey,
      (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
    );
    if (getFieldTarget(field)) {
      return [`${persistedFieldPath}.${getAssociationFilterTargetKey(field, targetCollection)}`];
    }
    return [persistedFieldPath];
  }

  private getEditableDomains(use?: string): FlowSurfaceNodeDomain[] {
    return getEditableDomainsForUse(use);
  }

  private async resolveContextSemantic(
    uid: string,
    resolved: FlowSurfaceResolvedTarget,
    transaction?: any,
  ): Promise<FlowSurfaceContextSemantic> {
    const collection = await this.resolveContextOwnerCollection(uid, transaction).catch(() => null);
    const ancestors = await this.loadContextAncestorChain(uid, resolved, transaction);
    const recordContextOwner = ancestors.find((node) => RECORD_CONTEXT_OWNER_USES.has(node?.use));
    const recordCollection = recordContextOwner
      ? await this.resolveContextOwnerCollection(recordContextOwner.uid, transaction)
      : null;

    const formNode = ancestors.find((node) => FORM_BLOCK_USES.has(node?.use));
    const formValuesCollection = this.resolveCollectionFromInit(
      _.get(formNode, ['stepParams', 'resourceSettings', 'init']),
    );

    const itemCollections = ancestors
      .filter((node) => ITEM_CONTEXT_OWNER_USES.has(node?.use))
      .map((node) => this.resolveItemContextCollection(node))
      .filter(Boolean) as NonNullable<FlowSurfaceContextSemantic['itemCollections']>;

    const rawPopupLevels: NonNullable<FlowSurfaceContextSemantic['popupLevels']> = [];
    for (let index = 0; index < ancestors.length; index += 1) {
      const node = ancestors[index];
      if (node?.use !== 'ChildPageModel') {
        continue;
      }
      const hostNode = ancestors[index + 1];
      rawPopupLevels.push(
        await this.resolvePopupContextLevel(node?.uid, hostNode, transaction, {
          allowSourceIdAsRecordId: rawPopupLevels.length > 0,
        }),
      );
    }

    const popupLevels = rawPopupLevels.slice(0, 1);
    const parentPopupLevel = rawPopupLevels[1];
    if (parentPopupLevel?.recordCollection) {
      popupLevels.push(parentPopupLevel);
    }
    const chartNode = ancestors.find((node) => node?.use === 'ChartBlockModel');

    return {
      collection,
      recordCollection,
      formValuesCollection,
      itemCollections,
      itemRootCollection: itemCollections.length ? formValuesCollection || recordCollection || undefined : undefined,
      popupLevels,
      chart: await this.buildChartContextSemantic(chartNode, transaction),
    };
  }

  private async loadContextAncestorChain(uid: string, resolved: FlowSurfaceResolvedTarget, transaction?: any) {
    const chain: any[] = [];
    const visited = new Set<string>();
    let cursor = uid;

    const ensureCursor = async () => {
      if (!cursor) {
        return;
      }
      const existing = await this.repository.findModelById(cursor, {
        transaction,
        includeAsyncNode: true,
      });
      if (existing?.uid) {
        return;
      }
      cursor = resolved?.node?.uid || (resolved?.kind === 'page' ? resolved?.pageModel?.uid : '') || '';
    };

    await ensureCursor();

    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const node = await this.repository.findModelById(cursor, {
        transaction,
        includeAsyncNode: true,
      });
      if (!node?.uid) {
        break;
      }
      chain.push(node);
      cursor = (await this.locator.findParentUid(cursor, transaction)) || '';
    }

    return chain;
  }

  private resolveCollectionFromInit(resourceInit?: { dataSourceKey?: string; collectionName?: string }) {
    if (!resourceInit?.collectionName) {
      return null;
    }
    return this.getCollection(resourceInit.dataSourceKey || 'main', resourceInit.collectionName);
  }

  private async buildChartContextSemantic(
    chartNode?: any,
    transaction?: any,
  ): Promise<NonNullable<FlowSurfaceContextSemantic['chart']> | undefined> {
    if (chartNode?.use !== 'ChartBlockModel') {
      return undefined;
    }

    const configure = _.get(chartNode, ['stepParams', 'chartSettings', 'configure']);
    const chart: NonNullable<FlowSurfaceContextSemantic['chart']> = {
      supportedMappings: getChartSupportedMappingsByType(),
      supportedStyles: getChartSupportedStylesByType(),
      supportedVisualTypes: getChartSupportedVisualTypes(),
      safeDefaults: getChartSafeDefaultHints(),
      riskyPatterns: getChartRiskyPatternHints(),
      unsupportedPatterns: getChartUnsupportedPatternHints(),
    };
    const semanticState = deriveChartSemanticState(configure);
    const resourceInit = getChartBuilderResourceInit(configure);
    if (resourceInit) {
      const collection = this.resolveCollectionFromInit(resourceInit);
      const queryOutputs = getChartBuilderQueryOutputs(configure).map((output) => ({
        ...output,
        type: this.resolveChartQueryOutputType(collection, resourceInit.dataSourceKey, output),
      }));
      if (queryOutputs.length) {
        chart.queryOutputs = queryOutputs;
        chart.aliases = getChartBuilderQueryAliases(configure);
      }
      return chart;
    }

    if (semanticState.query?.mode === 'sql') {
      const sqlPreview = await this.resolveSqlChartPreview(semanticState.query, transaction);
      if (sqlPreview.queryOutputs?.length) {
        chart.queryOutputs = sqlPreview.queryOutputs;
      }
      chart.riskyPatterns = this.mergeChartHintLists(chart.riskyPatterns || [], sqlPreview.riskyHints || []);
    }
    return chart;
  }

  private resolveChartQueryOutputType(collection: any, dataSourceKey: string, output: { kind?: string; field?: any }) {
    if (output.kind === 'measure') {
      return 'number';
    }
    const fieldPath = Array.isArray(output.field) ? output.field.join('.') : String(output.field || '').trim();
    if (!collection || !fieldPath) {
      return 'string';
    }
    const parsed = this.parseFieldPath(collection, fieldPath, undefined, dataSourceKey, collection?.name);
    const field = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    return inferFlowContextTypeFromField(field);
  }

  private async resolveContextOwnerCollection(uid: string, transaction?: any) {
    const collectionContext = await this.locator.resolveCollectionContext(uid, transaction).catch(() => null);
    return this.resolveCollectionFromInit(collectionContext?.resourceInit);
  }

  private resolveItemContextCollection(node: any) {
    const fieldInit = _.get(node, ['stepParams', 'fieldSettings', 'init']);
    if (!fieldInit?.collectionName || !fieldInit?.fieldPath) {
      return null;
    }
    const collection = this.getCollection(fieldInit.dataSourceKey || 'main', fieldInit.collectionName);
    if (!collection) {
      return null;
    }
    const parsed = this.parseFieldPath(
      collection,
      fieldInit.fieldPath,
      fieldInit.associationPathName,
      fieldInit.dataSourceKey,
      fieldInit.collectionName,
    );
    const field = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    return (
      resolveFieldTargetCollection(field, parsed.dataSourceKey, (dataSourceKey, collectionName) =>
        this.getCollection(dataSourceKey, collectionName),
      ) ||
      field?.targetCollection ||
      null
    );
  }

  private resolvePopupHostOpenView(node: any) {
    for (const [flowKey, stepKey] of POPUP_HOST_STEP_PARAM_PATHS) {
      const openView = _.get(node, ['stepParams', flowKey, stepKey]);
      if (_.isPlainObject(openView)) {
        return openView;
      }
    }
    return null;
  }

  private resolvePopupSourceRecordCollectionName(
    popupAssociationName: string,
    hostContext?: {
      associationContext?: any;
      resourceContext?: any;
    } | null,
  ) {
    const normalizedAssociationName = String(popupAssociationName || '').trim();
    const resourceCollectionName = String(hostContext?.resourceContext?.resourceInit?.collectionName || '').trim();

    if (hostContext?.associationContext?.associationField && resourceCollectionName) {
      return resourceCollectionName;
    }
    if (normalizedAssociationName.includes('.')) {
      return normalizedAssociationName.split('.')[0];
    }
    if (normalizedAssociationName && resourceCollectionName) {
      return resourceCollectionName;
    }
    return undefined;
  }

  private async resolvePopupContextLevel(
    uid: string | undefined,
    hostNode: any,
    transaction?: any,
    options: {
      allowSourceIdAsRecordId?: boolean;
    } = {},
  ) {
    const popupConfig = this.resolvePopupHostOpenView(hostNode);
    const hostContext = hostNode?.uid
      ? await this.resolvePopupHostProfileContext(hostNode, transaction).catch(() => null)
      : null;
    const popupDataSourceKey =
      popupConfig?.dataSourceKey ||
      hostContext?.associationContext?.dataSourceKey ||
      hostContext?.resourceContext?.resourceInit?.dataSourceKey ||
      'main';
    const popupCollectionName =
      String(popupConfig?.collectionName || hostContext?.associationContext?.collectionName || '').trim() || undefined;
    const popupAssociationName = String(
      popupConfig?.associationName || hostContext?.associationContext?.associationName || '',
    ).trim();
    const sourceRecordCollectionName = this.resolvePopupSourceRecordCollectionName(popupAssociationName, hostContext);
    const sourceRecordDataSourceKey = hostContext?.resourceContext?.resourceInit?.dataSourceKey || popupDataSourceKey;
    const recordIdentifier = options.allowSourceIdAsRecordId
      ? popupConfig?.filterByTk ?? popupConfig?.sourceId
      : popupConfig?.filterByTk;

    return {
      uid,
      recordCollection:
        popupCollectionName && hasConfiguredFlowContextValue(recordIdentifier)
          ? this.getCollection(popupDataSourceKey, popupCollectionName)
          : null,
      sourceRecordCollection:
        sourceRecordCollectionName && hasConfiguredFlowContextValue(popupConfig?.sourceId)
          ? this.getCollection(sourceRecordDataSourceKey, sourceRecordCollectionName)
          : null,
    };
  }

  private getCollection(dataSourceKey: string, collectionName: string) {
    const normalizedDataSourceKey = dataSourceKey || 'main';
    const dataSourceManager = this.plugin.app.dataSourceManager;
    const dataSource = dataSourceManager?.get?.(normalizedDataSourceKey);
    return (
      dataSource?.collectionManager?.getCollection?.(collectionName) ||
      this.plugin.app.db?.getCollection?.(collectionName)
    );
  }

  private async resolveFieldDefinition(input: {
    dataSourceKey: string;
    collectionName: string;
    associationPathName?: string;
    fieldPath: string;
  }) {
    const collection = this.getCollection(input.dataSourceKey, input.collectionName);
    const parsed = this.parseFieldPath(
      collection,
      input.fieldPath,
      input.associationPathName,
      input.dataSourceKey,
      input.collectionName,
    );
    const field = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    if (!field) {
      throwBadRequest(`flowSurfaces field '${input.collectionName}.${input.fieldPath}' not found`);
    }
    return {
      dataSourceKey: parsed.dataSourceKey || input.dataSourceKey,
      collectionName: parsed.collectionName || input.collectionName,
      associationPathName: parsed.associationPathName,
      fieldPath: parsed.fieldPath,
      field,
    };
  }

  private getAssociationDefaultTitleFieldName(field: any, dataSourceKey: string) {
    const resolved = resolveAssociationSafeTitleField(field, dataSourceKey, (resolvedDsKey, targetCollectionName) =>
      this.getCollection(resolvedDsKey, targetCollectionName),
    );
    return resolved?.fieldName;
  }

  private getAssociationTitleFieldTargetCollection(field: any, dataSourceKey: string) {
    return resolveAssociationTitleFieldTargetCollection(field, dataSourceKey, (resolvedDsKey, targetCollectionName) =>
      this.getCollection(resolvedDsKey, targetCollectionName),
    );
  }

  private buildAssociationTitleFieldUnavailableMessage(input: {
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
    targetCollection?: any;
  }) {
    const normalizedFieldPath = normalizeFieldPath(input.fieldPath, input.associationPathName);
    const targetCollectionName = getCollectionName(input.targetCollection) || 'unknown';
    return `flowSurfaces association field '${input.collectionName}.${normalizedFieldPath}' target collection '${targetCollectionName}' has no usable titleField`;
  }

  private async resolveTitleFieldSyncDecision(input: {
    wrapperUse?: string;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
    explicitTitleField?: any;
    bindingChange?: boolean;
    hasExistingTitleField?: boolean;
    enabledPackages?: ReadonlySet<string>;
  }) {
    const wrapperUse = String(input.wrapperUse || '').trim();
    const hasExplicitTitleField = Object.prototype.hasOwnProperty.call(input, 'explicitTitleField');
    const shouldAutoSyncOnBindingChange = AUTO_TITLE_FIELD_BINDING_WRAPPER_USES.has(wrapperUse);

    if (!hasExplicitTitleField && !input.bindingChange) {
      return {
        shouldSync: false,
        titleField: undefined,
      };
    }

    const resolvedField = await this.resolveFieldDefinition({
      dataSourceKey: input.dataSourceKey,
      collectionName: input.collectionName,
      fieldPath: input.fieldPath,
      associationPathName: input.associationPathName,
    });
    const isAssociation = isAssociationField(resolvedField.field);

    if (hasExplicitTitleField) {
      if (!isAssociation) {
        throwBadRequest(
          `flowSurfaces field '${input.collectionName}.${normalizeFieldPath(
            input.fieldPath,
            input.associationPathName,
          )}' titleField is only supported for association fields`,
        );
      }

      const normalizedExplicitTitleField =
        typeof input.explicitTitleField === 'string'
          ? input.explicitTitleField.trim()
          : String(input.explicitTitleField || '').trim();
      if (!normalizedExplicitTitleField) {
        throwBadRequest('flowSurfaces association titleField must be a non-empty string');
      }

      const targetCollection = this.getAssociationTitleFieldTargetCollection(
        resolvedField.field,
        resolvedField.dataSourceKey,
      );
      if (!targetCollection) {
        throwBadRequest(
          `flowSurfaces association field '${input.collectionName}.${normalizeFieldPath(
            input.fieldPath,
            input.associationPathName,
          )}' target collection is not available`,
        );
      }

      assertCollectionTitleFieldExists(targetCollection, normalizedExplicitTitleField);
      return {
        shouldSync: true,
        titleField: normalizedExplicitTitleField,
      };
    }

    if (!shouldAutoSyncOnBindingChange || !input.bindingChange) {
      return {
        shouldSync: false,
        titleField: undefined,
      };
    }

    if (!isAssociation) {
      return input.hasExistingTitleField
        ? {
            shouldSync: true,
            titleField: null,
          }
        : {
            shouldSync: false,
            titleField: undefined,
          };
    }

    const registeredBinding = this.resolveRegisteredFieldBinding({
      containerUse: wrapperUse,
      field: resolvedField.field,
      dataSourceKey: resolvedField.dataSourceKey,
      enabledPackages: input.enabledPackages,
      useStrictOnly: true,
    });
    if (registeredBinding?.modelClassName) {
      return input.hasExistingTitleField
        ? {
            shouldSync: true,
            titleField: null,
          }
        : {
            shouldSync: false,
            titleField: undefined,
          };
    }

    const resolvedTitleField = resolveAssociationSafeTitleField(
      resolvedField.field,
      resolvedField.dataSourceKey,
      (resolvedDsKey, targetCollectionName) => this.getCollection(resolvedDsKey, targetCollectionName),
    );
    if (!resolvedTitleField?.fieldName) {
      const targetCollection = this.getAssociationTitleFieldTargetCollection(
        resolvedField.field,
        resolvedField.dataSourceKey,
      );
      throwBadRequest(
        this.buildAssociationTitleFieldUnavailableMessage({
          dataSourceKey: resolvedField.dataSourceKey,
          collectionName: input.collectionName,
          fieldPath: input.fieldPath,
          associationPathName: input.associationPathName,
          targetCollection,
        }),
      );
    }

    return {
      shouldSync: true,
      titleField: resolvedTitleField.fieldName,
    };
  }

  private resolvePreferredFieldForCapability(input: {
    containerUse: string;
    dataSourceKey: string;
    associationPathName?: string;
    field: any;
  }) {
    if (
      !shouldUseAssociationTitleTextDisplay({
        containerUse: input.containerUse,
        associationPathName: input.associationPathName,
        fieldInterface: getFieldInterface(input.field) || '',
      })
    ) {
      return input.field;
    }

    const titleFieldName = this.getAssociationDefaultTitleFieldName(input.field, input.dataSourceKey);
    if (!titleFieldName) {
      return input.field;
    }

    const targetCollection = resolveFieldTargetCollection(
      input.field,
      input.dataSourceKey,
      (resolvedDsKey, targetCollectionName) => this.getCollection(resolvedDsKey, targetCollectionName),
    );
    return resolveFieldFromCollection(targetCollection, titleFieldName) || input.field;
  }

  private async ensureGridChild(parentUid: string, use: string, transaction?: any) {
    const existing = await this.repository.findModelByParentId(parentUid, {
      transaction,
      subKey: 'grid',
      includeAsyncNode: true,
    });
    if (existing?.uid) {
      return existing.uid;
    }
    const childUid = uid();
    await this.repository.upsertModel(
      {
        uid: childUid,
        parentId: parentUid,
        subKey: 'grid',
        subType: 'object',
        use,
      },
      { transaction },
    );
    return childUid;
  }

  private async ensureTableActionsColumn(tableUid: string, transaction?: any) {
    const table = await this.repository.findModelById(tableUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (table?.use !== 'TableBlockModel') {
      throwInternalError(
        `flowSurfaces table recordActions require a TableBlockModel target, got '${table?.use || tableUid}'`,
        'FLOW_SURFACE_TABLE_TARGET_INVALID',
      );
    }

    const attachedColumns = _.castArray(table?.subModels?.columns || []).filter(
      (item: any) => item?.use === 'TableActionsColumnModel' && item?.uid,
    );
    if (attachedColumns.length) {
      return attachedColumns[0].uid;
    }

    const columnTree = buildCanonicalTableActionsColumnNode();
    this.contractGuard.validateNodeTreeAgainstContract(columnTree);
    await this.repository.upsertModel(
      {
        parentId: tableUid,
        subKey: 'columns',
        subType: 'array',
        ...columnTree,
      },
      { transaction },
    );
    return columnTree.uid;
  }

  private async ensurePopupSurface(parentUid: string, transaction?: any) {
    const hostNode = await this.repository.findModelById(parentUid, {
      transaction,
      includeAsyncNode: true,
    });
    const openView = this.resolvePopupHostOpenView(hostNode);
    const externalPopupHostUid = this.resolveExternalPopupHostUid(parentUid, openView);
    if (externalPopupHostUid && String(openView?.popupTemplateUid || '').trim() && !openView?.popupTemplateContext) {
      throwBadRequest(
        `flowSurfaces popup surface '${parentUid}' uses a popup template reference; convert it to copy before editing popup blocks`,
        'FLOW_SURFACE_TEMPLATE_REFERENCE_REQUIRED',
      );
    }
    const popupHostUid = externalPopupHostUid || parentUid;
    const existingPage = await this.repository.findModelByParentId(popupHostUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });

    if (existingPage?.uid) {
      const tab = _.castArray(existingPage?.subModels?.tabs || [])[0];
      if (!tab?.uid) {
        const nextTab = buildPopupTabTree({});
        await this.repository.upsertModel(
          {
            parentId: existingPage.uid,
            subKey: 'tabs',
            subType: 'array',
            ...nextTab,
          },
          { transaction },
        );
        return {
          pageUid: existingPage.uid,
          tabUid: nextTab.uid,
          gridUid: nextTab.subModels?.grid?.uid,
        };
      }
      const grid = tab.subModels?.grid?.uid
        ? tab.subModels.grid
        : await this.repository.findModelByParentId(tab.uid, {
            transaction,
            subKey: 'grid',
            includeAsyncNode: true,
          });
      if (grid?.uid) {
        return {
          pageUid: existingPage.uid,
          tabUid: tab.uid,
          gridUid: grid.uid,
        };
      }
      const gridUid = await this.ensureGridChild(tab.uid, 'BlockGridModel', transaction);
      return {
        pageUid: existingPage.uid,
        tabUid: tab.uid,
        gridUid,
      };
    }

    const tree = buildPopupPageTree({});
    await this.repository.upsertModel(
      {
        parentId: popupHostUid,
        subKey: 'page',
        subType: 'object',
        ...tree,
      },
      { transaction },
    );

    const persisted = await this.repository.findModelByParentId(popupHostUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    const tab = _.castArray(persisted?.subModels?.tabs || [])[0];
    const grid = tab?.subModels?.grid;
    if (!persisted?.uid || !tab?.uid || !grid?.uid) {
      throwConflict(
        `flowSurfaces failed to create popup surface under '${parentUid}'`,
        'FLOW_SURFACE_POPUP_SURFACE_INCOMPLETE',
      );
    }
    return {
      pageUid: persisted.uid,
      tabUid: tab.uid,
      gridUid: grid.uid,
    };
  }

  private async ensureFlowRoutePageSchemaShell(pageSchemaUid: string, transaction?: any) {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    if (!uiSchemas || !pageSchemaUid) {
      return;
    }
    const existing = await uiSchemas.findOne({
      filterByTk: pageSchemaUid,
      transaction,
    });
    if (existing) {
      return;
    }
    await uiSchemas.insert(
      {
        type: 'void',
        'x-component': 'FlowRoute',
        'x-uid': pageSchemaUid,
      },
      { transaction },
    );
  }

  private async removeFlowRoutePageSchemaShell(pageSchemaUid: string, transaction?: any) {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    if (!uiSchemas || !pageSchemaUid) {
      return;
    }
    await uiSchemas.remove(pageSchemaUid, { transaction });
  }

  private normalizeDisplayFieldBinding(input: {
    wrapperUse?: string;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
  }) {
    const collection = this.getCollection(input.dataSourceKey, input.collectionName);
    const parsed = this.parseFieldPath(
      collection,
      input.fieldPath,
      input.associationPathName,
      input.dataSourceKey,
      input.collectionName,
    );
    const associationInterface = getFieldInterface(parsed.associationField);
    const leafField = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    const shouldBindAssociationValue =
      DISPLAY_FIELD_WRAPPER_USES.has(input.wrapperUse || '') &&
      !!parsed.associationPathName &&
      parsed.fieldPath !== parsed.associationPathName &&
      MULTI_VALUE_ASSOCIATION_INTERFACES.has(associationInterface || '');

    if (shouldBindAssociationValue) {
      const associationFieldPath = parsed.associationPathName;
      if (!associationFieldPath) {
        throwInternalError(
          'flowSurfaces field binding requires associationPathName for multi-value association display',
          'FLOW_SURFACE_ASSOCIATION_PATH_REQUIRED',
        );
      }
      return {
        dataSourceKey: parsed.dataSourceKey,
        collectionName: parsed.collectionName,
        fieldPath: associationFieldPath,
        associationPathName: undefined,
        defaultTitleField: parsed.leafFieldPath,
        usesAssociationValueBinding: true,
      };
    }

    const shouldDefaultToAssociationTitleField = shouldUseAssociationTitleTextDisplay({
      containerUse: input.wrapperUse,
      associationPathName: parsed.associationPathName,
      fieldInterface: getFieldInterface(leafField) || '',
    });
    if (shouldDefaultToAssociationTitleField) {
      return {
        dataSourceKey: parsed.dataSourceKey,
        collectionName: parsed.collectionName,
        fieldPath: parsed.fieldPath,
        associationPathName: parsed.associationPathName,
        defaultTitleField: this.getAssociationDefaultTitleFieldName(leafField, parsed.dataSourceKey),
        usesAssociationValueBinding: false,
      };
    }

    return {
      dataSourceKey: parsed.dataSourceKey,
      collectionName: parsed.collectionName,
      fieldPath: parsed.fieldPath,
      associationPathName: parsed.associationPathName,
      defaultTitleField: undefined,
      usesAssociationValueBinding: false,
    };
  }

  private buildExactFieldSettingsInitPayload(input: {
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
  }) {
    return buildDefinedPayload({
      dataSourceKey: input.dataSourceKey,
      collectionName: input.collectionName,
      fieldPath: input.fieldPath,
      ...(typeof input.associationPathName !== 'undefined' ? { associationPathName: input.associationPathName } : {}),
    });
  }

  private async patchFieldSettingsInitExact(
    node: any,
    input: {
      dataSourceKey: string;
      collectionName: string;
      fieldPath: string;
      associationPathName?: string;
    },
    transaction?: any,
  ) {
    if (!node?.uid) {
      return;
    }
    const nextStepParams = {
      ...(node.stepParams || {}),
      fieldSettings: {
        ...(node.stepParams?.fieldSettings || {}),
        init: this.buildExactFieldSettingsInitPayload(input),
      },
    };
    await this.repository.patch(
      {
        uid: node.uid,
        stepParams: nextStepParams,
      },
      { transaction },
    );

    if (node.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(
        {
          ...node,
          stepParams: nextStepParams,
        },
        transaction,
      );
    }
  }

  private inferFieldComponentFlowDomain(wrapperUse?: string) {
    switch (String(wrapperUse || '').trim()) {
      case 'TableColumnModel':
        return {
          flowKey: 'tableColumnSettings',
          stepKey: 'model',
        };
      case 'DetailsItemModel':
      case 'FormAssociationItemModel':
        return {
          flowKey: 'detailItemSettings',
          stepKey: 'model',
        };
      case 'FormItemModel':
        return {
          flowKey: 'editItemSettings',
          stepKey: 'model',
        };
      case 'FilterFormItemModel':
        return {
          flowKey: 'filterFormItemSettings',
          stepKey: 'model',
        };
      default:
        return null;
    }
  }

  private resolveFieldComponentFieldSource(wrapperNode: any, normalizedBinding?: any) {
    const currentFieldInit =
      normalizedBinding ||
      wrapperNode?.subModels?.field?.stepParams?.fieldSettings?.init ||
      wrapperNode?.stepParams?.fieldSettings?.init;
    if (!currentFieldInit?.dataSourceKey || !currentFieldInit?.collectionName || !currentFieldInit?.fieldPath) {
      throwConflict(
        `flowSurfaces configure field wrapper '${wrapperNode?.use}' cannot resolve field source`,
        'FLOW_SURFACE_FIELD_SOURCE_MISSING',
      );
    }
    const collection = this.getCollection(currentFieldInit.dataSourceKey, currentFieldInit.collectionName);
    const parsed = this.parseFieldPath(
      collection,
      currentFieldInit.fieldPath,
      currentFieldInit.associationPathName,
      currentFieldInit.dataSourceKey,
      currentFieldInit.collectionName,
    );
    const leafField = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    if (!leafField) {
      throwConflict(
        `flowSurfaces configure field wrapper '${wrapperNode?.use}' cannot resolve leaf field '${currentFieldInit.fieldPath}'`,
        'FLOW_SURFACE_FIELD_LEAF_MISSING',
      );
    }
    return {
      field: leafField,
      fieldSettingsInit: this.buildExactFieldSettingsInitPayload({
        dataSourceKey: currentFieldInit.dataSourceKey,
        collectionName: currentFieldInit.collectionName,
        fieldPath: currentFieldInit.fieldPath,
        associationPathName: currentFieldInit.associationPathName,
      }),
    };
  }

  private assertSupportedFieldComponentUse(wrapperUse: string | undefined, targetFieldUse: string) {
    const normalizedTargetUse = String(targetFieldUse || '').trim();
    if (!normalizedTargetUse) {
      throwBadRequest('flowSurfaces configure fieldComponent cannot be empty');
    }
    const normalizedWrapperUse = String(wrapperUse || '').trim();
    const containerUse =
      normalizedWrapperUse === 'FormAssociationItemModel' ? 'DetailsItemModel' : normalizedWrapperUse;
    if (DISPLAY_COMPONENT_FIELD_WRAPPER_USES.has(normalizedWrapperUse)) {
      const contract = resolveSupportedFieldCapability({
        containerUse,
        requestedFieldUse: normalizedTargetUse,
      });
      if (!contract?.fieldUse) {
        throwBadRequest(
          `flowSurfaces configure field wrapper '${normalizedWrapperUse}' does not support fieldComponent '${normalizedTargetUse}'`,
        );
      }
      return contract.fieldUse;
    }
    if (EDITABLE_FIELD_WRAPPER_USES.has(normalizedWrapperUse)) {
      const contract = resolveSupportedFieldCapability({
        containerUse,
        requestedFieldUse: normalizedTargetUse,
      });
      if (!contract?.fieldUse) {
        throwBadRequest(
          `flowSurfaces configure field wrapper '${normalizedWrapperUse}' does not support fieldComponent '${normalizedTargetUse}'`,
        );
      }
      return contract.fieldUse;
    }
    throwBadRequest(`flowSurfaces configure field wrapper '${normalizedWrapperUse}' does not support fieldComponent`);
  }

  private async syncFieldComponentStepParams(wrapperNode: any, targetFieldUse: string, transaction?: any) {
    const flowDomain = this.inferFieldComponentFlowDomain(wrapperNode?.use);
    if (!flowDomain || !wrapperNode?.uid) {
      return;
    }
    const nextStepParams = _.merge({}, wrapperNode.stepParams || {}, {
      [flowDomain.flowKey]: {
        [flowDomain.stepKey]: {
          use: targetFieldUse,
        },
      },
    });
    await this.repository.patch(
      {
        uid: wrapperNode.uid,
        stepParams: nextStepParams,
      },
      { transaction },
    );
  }

  private async rebuildFieldSubModelOnServer(input: {
    wrapperNode: any;
    innerField: any;
    targetFieldUse: string;
    normalizedBinding?: any;
    transaction?: any;
  }) {
    const innerField = input.innerField;
    if (!innerField?.uid) {
      throwConflict(
        `flowSurfaces configure field wrapper '${input.wrapperNode?.use}' cannot resolve inner field`,
        'FLOW_SURFACE_INNER_FIELD_MISSING',
      );
    }
    const normalizedTargetUse = this.assertSupportedFieldComponentUse(input.wrapperNode?.use, input.targetFieldUse);
    const fieldSource = this.resolveFieldComponentFieldSource(input.wrapperNode, input.normalizedBinding);
    const defaultProps = getFieldBindingDefaultProps(input.wrapperNode?.use, normalizedTargetUse, fieldSource.field);
    const nextFieldNode = {
      uid: innerField.uid,
      use: normalizedTargetUse,
      props: _.pickBy(
        {
          ...(innerField.props || {}),
          ...defaultProps,
        },
        (value) => !_.isUndefined(value),
      ),
      decoratorProps: _.cloneDeep(innerField.decoratorProps || {}),
      flowRegistry: _.cloneDeep(innerField.flowRegistry || {}),
      stepParams: _.merge({}, innerField.stepParams || {}, {
        fieldBinding: {
          use: normalizedTargetUse,
        },
        fieldSettings: {
          init: fieldSource.fieldSettingsInit,
        },
      }),
    };
    await this.repository.patch(nextFieldNode, { transaction: input.transaction });
    return normalizedTargetUse;
  }

  private parseFieldPath(
    collection: any,
    fieldPath: string,
    associationPathName?: string,
    dataSourceKey?: string,
    collectionName?: string,
  ) {
    const rawFieldPath = String(fieldPath || '').trim();
    const explicitAssociationPath = String(associationPathName || '').trim() || undefined;
    const parsedAssociationPath =
      explicitAssociationPath ||
      (rawFieldPath.includes('.') ? rawFieldPath.split('.').slice(0, -1).join('.') : undefined);
    const persistedFieldPath =
      explicitAssociationPath && !rawFieldPath.includes('.')
        ? `${explicitAssociationPath}.${rawFieldPath}`
        : rawFieldPath;
    const leafFieldPath = parsedAssociationPath ? persistedFieldPath.split('.').slice(-1)[0] : persistedFieldPath;
    const resolvedDataSourceKey = dataSourceKey || collection?.dataSourceKey || 'main';
    const resolvedCollectionName = collectionName || collection?.name || collection?.options?.name;

    if (!parsedAssociationPath) {
      return {
        leafCollection: collection,
        dataSourceKey: resolvedDataSourceKey,
        collectionName: resolvedCollectionName,
        fieldPath: persistedFieldPath,
        leafFieldPath,
        associationPathName: undefined,
        associationField: undefined,
      };
    }

    const associationField = resolveFieldFromCollection(collection, parsedAssociationPath);
    const targetCollection = resolveFieldTargetCollection(
      associationField,
      resolvedDataSourceKey,
      (resolvedDsKey, targetCollectionName) => this.getCollection(resolvedDsKey, targetCollectionName),
    );
    return {
      leafCollection: targetCollection || collection,
      dataSourceKey: resolvedDataSourceKey,
      collectionName: resolvedCollectionName,
      fieldPath: persistedFieldPath,
      leafFieldPath,
      associationPathName: parsedAssociationPath,
      associationField,
    };
  }

  private async loadResolvedNode(resolved: any, transaction?: any) {
    if (resolved?.kind === 'page' && resolved?.pageRoute) {
      return this.routeSync.buildPageTree(resolved.pageRoute, transaction);
    }
    if (resolved?.kind === 'tab' && resolved?.tabRoute) {
      return this.routeSync.buildTabAnchor(resolved.tabRoute, transaction);
    }
    if (resolved?.node?.uid) {
      return resolved.node;
    }
    return this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true });
  }

  private normalizePopupTreeShape<T = any>(node: T): T {
    if (!node || typeof node !== 'object') {
      return node;
    }

    const visit = (current: any) => {
      if (!current || typeof current !== 'object') {
        return;
      }

      if (current.use === 'ChildPageModel') {
        current.subModels = {
          ...(current.subModels || {}),
          tabs: _.castArray(current.subModels?.tabs || []),
        };
      }

      const subModels = current.subModels;
      if (!subModels || typeof subModels !== 'object') {
        return;
      }

      for (const value of Object.values(subModels)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            visit(item);
          }
          continue;
        }
        visit(value);
      }
    };

    visit(node);
    return node;
  }
}
