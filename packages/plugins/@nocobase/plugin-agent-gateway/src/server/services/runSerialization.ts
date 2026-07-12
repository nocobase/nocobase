/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { redactRunResultSummary } from '../security';
import {
  JsonRecord,
  ModelRecord,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelValue,
  getRecord,
  getString,
} from '../actions/utils';

export function serializeRun(run: ModelRecord) {
  const json = getModelJson(run);
  delete json.claimTokenHash;
  delete json.promptSnapshot;
  delete json.executionPayloadJson;
  delete json.observabilityRollupJson;
  return json;
}

export function serializeRunForUser(run: ModelRecord) {
  const json = serializeRun(run);
  delete json.claimAttempt;
  delete json.leaseVersion;
  delete json.claimTokenLast4;
  delete json.claimExpiresAt;
  delete json.terminalSessionName;
  return json;
}

export function serializeCreatedRunForUser(run: ModelRecord) {
  return {
    ...serializeRunForUser(run),
    claimAttempt: getModelNumber(run, 'claimAttempt'),
    leaseVersion: getModelNumber(run, 'leaseVersion'),
  };
}

export function getRunTaskTitle(run: ModelRecord, options: { includeRunCode?: boolean } = {}) {
  const resultSummary = getRecord(getModelValue(run, 'resultSummaryJson'));
  const executionPayload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const promptSnapshot = getRecord(getModelValue(run, 'promptSnapshot'));
  const promptVariables = getRecord(promptSnapshot.variables);
  const title =
    getString(resultSummary.title) ||
    getString(executionPayload.title) ||
    getString(promptVariables.title) ||
    getString(promptSnapshot.title);
  if (title || options.includeRunCode === false) {
    return title;
  }
  return getModelString(run, 'runCode');
}

export function mergeTerminalResultSummary(run: ModelRecord, value: unknown): JsonRecord {
  const resultSummary = getRecord(redactRunResultSummary(value));
  if (getString(resultSummary.title)) {
    return resultSummary;
  }
  const existingTitle = getRunTaskTitle(run, { includeRunCode: false });
  if (existingTitle) {
    resultSummary.title = existingTitle;
  }
  return resultSummary;
}
