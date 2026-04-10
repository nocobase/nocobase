/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import type {
  FlowSurfaceDslDocument,
  FlowSurfaceDslKind,
  FlowSurfaceDslVerificationMode,
  FlowSurfaceExecuteDslValues,
  FlowSurfacePreparedDslRequest,
  FlowSurfaceValidateDslValues,
} from './types';

const FLOW_SURFACE_DSL_META_KEYS = ['dsl', 'expectedFingerprint', 'bindRefs', 'validation', 'verificationMode'];

function looksLikePatchDsl(input: any) {
  if (!_.isPlainObject(input)) {
    return false;
  }
  if (String(input.kind || '').trim() === 'patch') {
    return true;
  }
  return Array.isArray(input.changes);
}

function inferDslKind(input: any): FlowSurfaceDslKind {
  return looksLikePatchDsl(input) ? 'patch' : 'blueprint';
}

function normalizeStringArray(value: any) {
  return _.castArray(value || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

export function normalizeFlowSurfaceDslDocument(actionName: string, input: any): FlowSurfaceDslDocument {
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces ${actionName} dsl must be an object`);
  }

  const kind = inferDslKind(input);
  if (kind === 'patch') {
    return {
      ..._.cloneDeep(input),
      kind: 'patch',
      version: String(input.version || '1').trim() as '1',
      target: _.isPlainObject(input.target) ? _.cloneDeep(input.target) : { locator: {} },
      dataSources: _.castArray(input.dataSources || []).map((item) =>
        _.isPlainObject(item) ? _.cloneDeep(item) : item,
      ),
      popups: _.castArray(input.popups || []).map((item) => (_.isPlainObject(item) ? _.cloneDeep(item) : item)),
      changes: _.castArray(input.changes || []).map((item) => (_.isPlainObject(item) ? _.cloneDeep(item) : item)),
      assumptions: normalizeStringArray(input.assumptions),
      unresolvedQuestions: normalizeStringArray(input.unresolvedQuestions),
    };
  }

  return {
    ..._.cloneDeep(input),
    kind: 'blueprint',
    version: String(input.version || '1').trim() as '1',
    target: _.isPlainObject(input.target) ? _.cloneDeep(input.target) : { mode: 'create-page' },
    navigation: _.isPlainObject(input.navigation) ? _.cloneDeep(input.navigation) : undefined,
    dataSources: _.castArray(input.dataSources || []).map((item) => (_.isPlainObject(item) ? _.cloneDeep(item) : item)),
    layout: _.isPlainObject(input.layout)
      ? _.cloneDeep(input.layout)
      : {
          kind: 'rows-columns',
          rows: [],
        },
    blocks: _.castArray(input.blocks || []).map((item) => (_.isPlainObject(item) ? _.cloneDeep(item) : item)),
    interactions: _.castArray(input.interactions || []).map((item) =>
      _.isPlainObject(item) ? _.cloneDeep(item) : item,
    ),
    popups: _.castArray(input.popups || []).map((item) => (_.isPlainObject(item) ? _.cloneDeep(item) : item)),
    assumptions: normalizeStringArray(input.assumptions),
    unresolvedQuestions: normalizeStringArray(input.unresolvedQuestions),
  };
}

export function normalizeFlowSurfaceDslRequest(
  actionName: 'validateDsl' | 'executeDsl',
  input: FlowSurfaceValidateDslValues | FlowSurfaceExecuteDslValues | Record<string, any>,
): FlowSurfacePreparedDslRequest {
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces ${actionName} requires an object payload`);
  }

  const rawDsl = _.isPlainObject(input.dsl) ? input.dsl : _.omit(input, FLOW_SURFACE_DSL_META_KEYS);
  const dsl = normalizeFlowSurfaceDslDocument(actionName, rawDsl);

  const bindRefs = _.isUndefined(input.bindRefs)
    ? undefined
    : Array.isArray(input.bindRefs)
      ? _.cloneDeep(input.bindRefs)
      : throwBadRequest(`flowSurfaces ${actionName} bindRefs must be an array`);

  const validation = _.isUndefined((input as any).validation)
    ? undefined
    : _.isPlainObject((input as any).validation)
      ? {
          collectFieldIssues: !!(input as any).validation.collectFieldIssues,
        }
      : throwBadRequest(`flowSurfaces ${actionName} validation must be an object`);

  const verificationMode =
    String((input as any).verificationMode || 'strict').trim() === 'none'
      ? ('none' as FlowSurfaceDslVerificationMode)
      : ('strict' as FlowSurfaceDslVerificationMode);

  const expectedFingerprint =
    typeof input.expectedFingerprint === 'string' && input.expectedFingerprint.trim()
      ? input.expectedFingerprint.trim()
      : undefined;

  return {
    dsl,
    bindRefs,
    validation,
    verificationMode,
    expectedFingerprint,
    planValues: {
      plan: {
        steps: [],
      },
    },
  };
}
