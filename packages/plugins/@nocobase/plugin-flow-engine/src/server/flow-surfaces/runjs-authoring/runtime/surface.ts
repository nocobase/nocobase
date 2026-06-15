/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringContext } from '../internal-types';
import type { RunJsAuthoringInspectionInput, RunJsAuthoringSurfaceStyle } from '../types';
import {
  ACTION_MODEL_USES,
  ACTION_TYPE_ALIASES,
  KNOWN_MODEL_USES,
  PUBLIC_BLOCK_TYPE_BY_MODEL_USE,
  RENDER_MODEL_USES,
  SURFACE_STYLE_BY_ID,
  VALUE_MODEL_USES,
} from './constants';

export function resolveFieldModelUse(type: string, renderer: string, blockType: string) {
  if (type === 'jsColumn') {
    return 'JSColumnModel';
  }
  if (type === 'jsItem') {
    return 'JSItemModel';
  }
  if (renderer === 'js') {
    return ['createForm', 'editForm'].includes(blockType) ? 'JSEditableFieldModel' : 'JSFieldModel';
  }
  return '';
}

export function resolveActionModelUse(actionType: string, blockType: string, slot: 'actions' | 'recordActions') {
  if (actionType === 'jsItem') {
    return 'JSItemActionModel';
  }
  if (actionType !== 'js') {
    return '';
  }
  if (slot === 'recordActions') {
    return 'JSRecordActionModel';
  }
  if (['createForm', 'editForm'].includes(blockType)) {
    return 'JSFormActionModel';
  }
  if (blockType === 'filterForm') {
    return 'FilterFormJSActionModel';
  }
  if (['table', 'list', 'gridCard', 'calendar', 'kanban'].includes(blockType)) {
    return 'JSCollectionActionModel';
  }
  return 'JSActionModel';
}

export function resolveConfigureModelUse(currentNode: any) {
  const currentUse = normalizeText(currentNode?.use);
  if (KNOWN_MODEL_USES.has(currentUse)) {
    return currentUse;
  }
  const fieldUse = normalizeText(currentNode?.subModels?.field?.use);
  if (KNOWN_MODEL_USES.has(fieldUse)) {
    return fieldUse;
  }
  return '';
}

export function resolveConfigureBlockType(context: RunJsAuthoringContext) {
  const hostBlockType = normalizeText(context.hostBlockType);
  if (hostBlockType) {
    return resolvePublicBlockType(hostBlockType);
  }
  const currentUse = normalizeText(context.currentNode?.use);
  return resolvePublicBlockType(currentUse);
}

export function resolvePublicBlockType(value: any) {
  const normalized = normalizeText(value);
  return PUBLIC_BLOCK_TYPE_BY_MODEL_USE[normalized] || normalized;
}

export function resolveSurfaceStyle(input: RunJsAuthoringInspectionInput): RunJsAuthoringSurfaceStyle | undefined {
  if (input.surfaceStyle) {
    return input.surfaceStyle;
  }
  const surface = normalizeText(input.surface);
  if (surface && SURFACE_STYLE_BY_ID[surface]) {
    return SURFACE_STYLE_BY_ID[surface];
  }
  return resolveModelSurfaceStyle(input.modelUse);
}

export function resolveModelSurfaceStyle(modelUse: any): RunJsAuthoringSurfaceStyle | undefined {
  const normalized = normalizeText(modelUse);
  if (RENDER_MODEL_USES.has(normalized)) {
    return 'render';
  }
  if (ACTION_MODEL_USES.has(normalized)) {
    return 'action';
  }
  if (VALUE_MODEL_USES.has(normalized)) {
    return 'value';
  }
  return undefined;
}

export function normalizeActionType(value: any) {
  const normalized = normalizeText(value);
  return ACTION_TYPE_ALIASES.get(normalized.toLowerCase()) || normalized;
}

export function normalizeText(value: any) {
  return typeof value === 'string' ? value.trim() : '';
}
