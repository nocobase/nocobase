/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { buildDefinedPayload } from '../service-utils';
import type { FlowSurfacePlanStep } from '../types';
import type { FlowSurfaceApplyBlueprintReactionItem } from '../reaction/types';
import type { FlowSurfaceApplyBlueprintDocument } from './public-types';

function buildReactionStepId(index: number) {
  return `blueprintReaction__${index + 1}`;
}

function compileReactionItem(item: FlowSurfaceApplyBlueprintReactionItem, index: number): FlowSurfacePlanStep {
  return {
    id: buildReactionStepId(index),
    action: item.type,
    selectors: {
      target: {
        key: item.target,
      },
    },
    values: buildDefinedPayload({
      rules: _.cloneDeep(item.rules),
      expectedFingerprint: item.expectedFingerprint,
    }),
  };
}

export function compileReactionPlanSteps(
  reaction: FlowSurfaceApplyBlueprintDocument['reaction'] | undefined,
): FlowSurfacePlanStep[] {
  const reactionItems = _.castArray(reaction?.items || []);
  if (!reactionItems.length) {
    return [];
  }
  return reactionItems.map((item, index) => compileReactionItem(item, index));
}
