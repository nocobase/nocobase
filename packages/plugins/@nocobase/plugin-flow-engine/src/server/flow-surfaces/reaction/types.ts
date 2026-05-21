/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceContextResponse, FlowSurfaceWriteTarget } from '../types';

export type FlowSurfaceReactionKind = 'fieldValue' | 'blockLinkage' | 'fieldLinkage' | 'actionLinkage';

export type FlowSurfaceReactionScene = 'form' | 'block' | 'action' | 'details' | 'subForm';

export type FlowSurfaceFieldLinkageScene = Extract<FlowSurfaceReactionScene, 'form' | 'details' | 'subForm'>;

export type FlowSurfaceReactionSlot = {
  flowKey: string;
  stepKey: string;
  valuePath?: string | null;
};

export type FlowSurfaceReactionFilter = Record<string, any>;

export type FlowSurfaceValueExpr =
  | {
      source: 'literal';
      value: any;
    }
  | {
      source: 'path';
      path: string;
    }
  | {
      source: 'runjs';
      code: string;
      version?: 'v1' | 'v2';
    };

export type FlowSurfaceFieldValueRule = {
  key?: string;
  title?: string;
  enabled?: boolean;
  targetPath: string;
  mode?: 'default' | 'assign';
  when?: FlowSurfaceReactionFilter;
  value: FlowSurfaceValueExpr;
};

export type FlowSurfaceBlockLinkageAction =
  | {
      key?: string;
      type: 'setBlockState';
      state: 'visible' | 'hidden';
    }
  | {
      key?: string;
      type: 'runjs';
      code: string;
      version?: 'v1' | 'v2';
    };

export type FlowSurfaceActionLinkageAction =
  | {
      key?: string;
      type: 'setActionState';
      state: 'visible' | 'hidden' | 'hiddenText' | 'enabled' | 'disabled';
    }
  | {
      key?: string;
      type: 'runjs';
      code: string;
      version?: 'v1' | 'v2';
    };

export type FlowSurfaceFieldLinkageAssignItem = {
  key?: string;
  enabled?: boolean;
  targetPath: string;
  when?: FlowSurfaceReactionFilter;
  value: FlowSurfaceValueExpr;
};

export type FlowSurfaceFieldLinkageAction =
  | {
      key?: string;
      type: 'setFieldState';
      fieldPaths: string[];
      state: 'visible' | 'hidden' | 'hiddenReservedValue' | 'required' | 'notRequired' | 'disabled' | 'enabled';
    }
  | {
      key?: string;
      type: 'assignField';
      items: FlowSurfaceFieldLinkageAssignItem[];
    }
  | {
      key?: string;
      type: 'setFieldDefaultValue';
      items: FlowSurfaceFieldLinkageAssignItem[];
    }
  | {
      key?: string;
      type: 'runjs';
      code: string;
      version?: 'v1' | 'v2';
    };

export type FlowSurfaceFieldUidToPathResolver = (fieldUid: string) => string | undefined;

export type FlowSurfaceFieldPathToUidResolver = (fieldPath: string) => string | undefined;

export type FlowSurfaceBlockLinkageRule = {
  key?: string;
  title?: string;
  enabled?: boolean;
  when?: FlowSurfaceReactionFilter;
  then: FlowSurfaceBlockLinkageAction[];
};

export type FlowSurfaceActionLinkageRule = {
  key?: string;
  title?: string;
  enabled?: boolean;
  when?: FlowSurfaceReactionFilter;
  then: FlowSurfaceActionLinkageAction[];
};

export type FlowSurfaceFieldLinkageRule = {
  key?: string;
  title?: string;
  enabled?: boolean;
  when?: FlowSurfaceReactionFilter;
  then: FlowSurfaceFieldLinkageAction[];
};

export type FlowSurfaceReactionTargetSummary = {
  uid: string;
  publicPath?: string;
};

export type FlowSurfaceReactionResolvedTargetKind = 'block' | 'action' | 'fieldHost';

export type FlowSurfaceResolvedReactionCapability = {
  kind: FlowSurfaceReactionKind;
  resolvedScene: FlowSurfaceReactionScene;
  resolvedSlot: FlowSurfaceReactionSlot;
};

export type FlowSurfaceResolvedReactionTarget = {
  target: FlowSurfaceReactionTargetSummary;
  node: any;
  use?: string;
  targetKind: FlowSurfaceReactionResolvedTargetKind;
  capabilities: FlowSurfaceResolvedReactionCapability[];
};

export type FlowSurfaceResolveReactionTargetValues = {
  target: FlowSurfaceWriteTarget | FlowSurfaceReactionTargetSummary;
  node?: any;
  use?: string;
  publicPath?: string;
};

export type FlowSurfaceResolveReactionCapabilityResult = FlowSurfaceResolvedReactionTarget &
  FlowSurfaceResolvedReactionCapability;

export type FlowSurfaceReactionWriteValues<T> = {
  target: FlowSurfaceWriteTarget;
  rules: T[];
  expectedFingerprint?: string;
  verify?: boolean;
};

export type FlowSurfaceReactionWriteResult<T> = {
  target: FlowSurfaceReactionTargetSummary;
  resolvedScene: FlowSurfaceReactionScene;
  resolvedSlot: FlowSurfaceReactionSlot;
  fingerprint: string;
  normalizedRules: T[];
  canonicalRules: any[];
};

export type FlowSurfaceFieldOption = {
  path: string;
  label: string;
  interface?: string;
  type?: string;
  supportsDefault?: boolean;
  supportsAssign?: boolean;
  supportsState?: string[];
};

export type FlowSurfaceReactionCapabilityBase<TKind extends FlowSurfaceReactionKind, TRule> = {
  kind: TKind;
  resolvedScene: FlowSurfaceReactionScene;
  resolvedSlot: FlowSurfaceReactionSlot;
  fingerprint: string;
  normalizedRules: TRule[];
  canonicalRules: any[];
  context: FlowSurfaceContextResponse;
};

export type FlowSurfaceFieldValueCapability = FlowSurfaceReactionCapabilityBase<
  'fieldValue',
  FlowSurfaceFieldValueRule
> & {
  targetFields: FlowSurfaceFieldOption[];
  valueExprMeta: {
    supportedSources: Array<'literal' | 'path' | 'runjs'>;
    runjsScene: 'fieldValue';
  };
};

export type FlowSurfaceLinkageCapability =
  | (FlowSurfaceReactionCapabilityBase<'blockLinkage', FlowSurfaceBlockLinkageRule> & {
      supportedActions: Array<Record<string, any>>;
      conditionMeta: {
        operatorsByPath: Record<string, string[]>;
      };
    })
  | (FlowSurfaceReactionCapabilityBase<'actionLinkage', FlowSurfaceActionLinkageRule> & {
      supportedActions: Array<Record<string, any>>;
      conditionMeta: {
        operatorsByPath: Record<string, string[]>;
      };
    })
  | (FlowSurfaceReactionCapabilityBase<'fieldLinkage', FlowSurfaceFieldLinkageRule> & {
      supportedActions: Array<Record<string, any>>;
      targetFields: FlowSurfaceFieldOption[];
      conditionMeta: {
        operatorsByPath: Record<string, string[]>;
      };
      valueExprMeta?: {
        supportedSources: Array<'literal' | 'path' | 'runjs'>;
        runjsScene: 'linkage';
      };
    });

export type FlowSurfaceReactionCapability = FlowSurfaceFieldValueCapability | FlowSurfaceLinkageCapability;

export type FlowSurfaceReactionUnavailableCapability = {
  kind: FlowSurfaceReactionKind;
  code: string;
  reason: string;
};

export type FlowSurfaceReactionRuleNormalizerInput = {
  kind: FlowSurfaceReactionKind;
  resolvedScene: FlowSurfaceReactionScene;
  resolvedSlot: FlowSurfaceReactionSlot;
  canonicalRules: any[];
  node: any;
  context: FlowSurfaceContextResponse;
};

export type FlowSurfaceReactionRuleNormalizer = (input: FlowSurfaceReactionRuleNormalizerInput) => any[];

export type FlowSurfaceReactionRuleNormalizers = Partial<
  Record<FlowSurfaceReactionKind, FlowSurfaceReactionRuleNormalizer>
>;

export type FlowSurfaceGetReactionMetaValues = {
  target: FlowSurfaceWriteTarget;
};

export type FlowSurfaceGetReactionMetaResult = {
  target: FlowSurfaceReactionTargetSummary;
  capabilities: FlowSurfaceReactionCapability[];
  unavailable: FlowSurfaceReactionUnavailableCapability[];
};

export type FlowSurfaceApplyBlueprintReactionItem =
  | {
      type: 'setFieldValueRules';
      target: string;
      rules: FlowSurfaceFieldValueRule[];
      expectedFingerprint?: string;
    }
  | {
      type: 'setBlockLinkageRules';
      target: string;
      rules: FlowSurfaceBlockLinkageRule[];
      expectedFingerprint?: string;
    }
  | {
      type: 'setFieldLinkageRules';
      target: string;
      rules: FlowSurfaceFieldLinkageRule[];
      expectedFingerprint?: string;
    }
  | {
      type: 'setActionLinkageRules';
      target: string;
      rules: FlowSurfaceActionLinkageRule[];
      expectedFingerprint?: string;
    };

export type FlowSurfaceBuildReactionMetaCapabilitiesInput = {
  resolvedTarget: FlowSurfaceResolvedReactionTarget;
  context: FlowSurfaceContextResponse;
  normalizeRules?: FlowSurfaceReactionRuleNormalizers;
};
