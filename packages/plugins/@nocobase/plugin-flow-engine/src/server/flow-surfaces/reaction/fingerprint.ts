/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import _ from 'lodash';
import type { FlowSurfaceReactionKind, FlowSurfaceReactionScene, FlowSurfaceReactionSlot } from './types';

export function buildReactionStableFingerprintString(value: any): string {
  if (_.isNil(value)) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => buildReactionStableFingerprintString(item)).join(',')}]`;
  }
  if (_.isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${buildReactionStableFingerprintString(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildReactionFingerprint(params: {
  kind: FlowSurfaceReactionKind;
  scene: FlowSurfaceReactionScene;
  slot: FlowSurfaceReactionSlot;
  canonicalRules: any[];
}) {
  const payload = {
    kind: params.kind,
    scene: params.scene,
    slot: params.slot,
    canonicalRules: Array.isArray(params.canonicalRules) ? params.canonicalRules : [],
  };
  return createHash('sha1').update(buildReactionStableFingerprintString(payload)).digest('hex');
}
