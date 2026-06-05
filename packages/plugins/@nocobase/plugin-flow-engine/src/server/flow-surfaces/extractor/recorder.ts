/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilityConfidence, FlowSurfaceCapabilityWarning } from '../types';
import { types as nodeUtilTypes } from 'util';
import { parseFlowSurfaceTranslationExpressionLabel } from './labels';
import type {
  FlowSurfaceCreateModelOptionsSubModels,
  FlowSurfaceExtractionEvent,
  FlowSurfaceExtractorCreateModelOptionsStatus,
  FlowSurfaceExtractorEvidenceSource,
  FlowSurfaceExtractorFlowStaticStatus,
  FlowSurfaceExtractorLabelFields,
  FlowSurfaceFieldBindingRole,
} from './types';

type FlowSurfaceModelRecordInput = {
  modelUse: string;
  className?: string;
  source?: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  confidence?: FlowSurfaceCapabilityConfidence;
};

type FlowSurfaceModelLoaderRecordInput = {
  modelUse: string;
  loaderName?: string;
  source?: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  confidence?: FlowSurfaceCapabilityConfidence;
};

type FlowSurfaceFlowRecordInput = {
  modelUse?: string;
  flowKey?: string;
  title?: string;
  sort?: number;
  staticStatus?: FlowSurfaceExtractorFlowStaticStatus;
  source?: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  confidence?: FlowSurfaceCapabilityConfidence;
};

type FlowSurfaceMenuItemRecordInput = FlowSurfaceExtractorLabelFields & {
  menuKey?: string;
  modelUse?: string;
  slot?: string;
  createModelOptionsStatus?: FlowSurfaceExtractorCreateModelOptionsStatus;
  createModelOptionsUse?: string;
  createModelOptionsSubModels?: FlowSurfaceCreateModelOptionsSubModels;
  source?: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  confidence?: FlowSurfaceCapabilityConfidence;
};

type FlowSurfaceFieldBindingRecordInput = {
  fieldInterface?: string;
  modelUse?: string;
  role: FlowSurfaceFieldBindingRole;
  source?: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  confidence?: FlowSurfaceCapabilityConfidence;
};

type FlowSurfaceOwnDescriptorEntry =
  | {
      key: string;
      readable: true;
      value: unknown;
    }
  | {
      key: string;
      readable: false;
    };

export class FlowSurfaceExtractionRecorder {
  private readonly events: FlowSurfaceExtractionEvent[] = [];

  recordModel(input: FlowSurfaceModelRecordInput) {
    const modelUse = normalizeString(input.modelUse);
    if (!modelUse) {
      return;
    }
    this.events.push({
      type: 'model.registered',
      modelUse,
      ...(input.className ? { className: input.className } : {}),
      source: input.source || 'runtime',
      evidenceSource: input.evidenceSource || 'runtime',
      confidence: input.confidence || 'medium',
    });
  }

  recordModels(
    models: Record<string, unknown>,
    source = 'runtime',
    confidence: FlowSurfaceCapabilityConfidence = 'medium',
    evidenceSource: FlowSurfaceExtractorEvidenceSource = 'runtime',
  ) {
    getOwnDescriptorEntries(models).forEach((entry) => {
      const className = entry.readable ? getFunctionName(entry.value) || entry.key : undefined;
      this.recordModel({
        modelUse: entry.key,
        ...(className ? { className } : {}),
        source,
        evidenceSource,
        confidence,
      });
    });
  }

  recordModelLoader(input: FlowSurfaceModelLoaderRecordInput) {
    const modelUse = normalizeString(input.modelUse);
    if (!modelUse) {
      return;
    }
    this.events.push({
      type: 'model.loaderRegistered',
      modelUse,
      ...(input.loaderName ? { loaderName: input.loaderName } : {}),
      source: input.source || 'runtime',
      evidenceSource: input.evidenceSource || 'runtime',
      confidence: input.confidence || 'medium',
    });
  }

  recordModelLoaders(
    loaders: Record<string, unknown>,
    source = 'runtime',
    confidence: FlowSurfaceCapabilityConfidence = 'medium',
    evidenceSource: FlowSurfaceExtractorEvidenceSource = 'runtime',
  ) {
    getOwnDescriptorEntries(loaders).forEach((entry) => {
      this.recordModelLoader({
        modelUse: entry.key,
        loaderName: entry.readable ? getLoaderName(entry.value) : undefined,
        source,
        evidenceSource,
        confidence,
      });
    });
  }

  recordFlow(input: FlowSurfaceFlowRecordInput) {
    if (!input.modelUse && !input.flowKey) {
      return;
    }
    this.events.push({
      type: 'model.flowRegistered',
      ...(input.modelUse ? { modelUse: input.modelUse } : {}),
      ...(input.flowKey ? { flowKey: input.flowKey } : {}),
      ...(input.title ? { title: input.title } : {}),
      ...(typeof input.sort === 'number' ? { sort: input.sort } : {}),
      staticStatus: input.staticStatus || 'unresolved',
      source: input.source || 'runtime',
      evidenceSource: input.evidenceSource || 'runtime',
      confidence: input.confidence || 'medium',
    });
  }

  recordMenuItem(input: FlowSurfaceMenuItemRecordInput) {
    if (!input.menuKey && !input.modelUse && !input.slot) {
      return;
    }
    const labelFields = normalizeLabelFields(input);
    this.events.push({
      type: 'menu.itemRegistered',
      ...(input.menuKey ? { menuKey: input.menuKey } : {}),
      ...labelFields,
      ...(input.modelUse ? { modelUse: input.modelUse } : {}),
      ...(input.slot ? { slot: input.slot } : {}),
      createModelOptionsStatus: input.createModelOptionsStatus || 'unresolved',
      ...(input.createModelOptionsUse ? { createModelOptionsUse: input.createModelOptionsUse } : {}),
      ...(hasCreateModelOptionsSubModels(input.createModelOptionsSubModels)
        ? { createModelOptionsSubModels: input.createModelOptionsSubModels }
        : {}),
      source: input.source || 'runtime',
      evidenceSource: input.evidenceSource || 'runtime',
      confidence: input.confidence || 'medium',
    });
  }

  recordFieldBinding(input: FlowSurfaceFieldBindingRecordInput) {
    if (!input.fieldInterface && !input.modelUse) {
      return;
    }
    this.events.push({
      type: 'field.bindingRegistered',
      ...(input.fieldInterface ? { fieldInterface: input.fieldInterface } : {}),
      ...(input.modelUse ? { modelUse: input.modelUse } : {}),
      role: input.role,
      source: input.source || 'runtime',
      evidenceSource: input.evidenceSource || 'runtime',
      confidence: input.confidence || 'medium',
    });
  }

  recordWarning(warning: FlowSurfaceCapabilityWarning) {
    this.events.push({
      type: 'warning',
      warning,
    });
  }

  getEvents(): FlowSurfaceExtractionEvent[] {
    return [...this.events];
  }
}

export function createFlowSurfaceExtractionRecorder() {
  return new FlowSurfaceExtractionRecorder();
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeLabelFields(input: FlowSurfaceExtractorLabelFields): FlowSurfaceExtractorLabelFields {
  const labelText = normalizeOptionalString(input.labelText);
  const labelKey = normalizeOptionalString(input.labelKey);
  const labelFallback = normalizeOptionalString(input.labelFallback);
  const explicitLabel = normalizeOptionalString(input.label);

  if (labelText || labelKey || labelFallback) {
    return {
      label: explicitLabel || labelText || labelFallback || labelKey,
      ...(labelText ? { labelText } : {}),
      ...(labelKey ? { labelKey } : {}),
      ...(labelFallback ? { labelFallback } : {}),
    };
  }

  if (!explicitLabel) {
    return {};
  }

  const translation = parseFlowSurfaceTranslationExpressionLabel(explicitLabel);
  if (translation) {
    return translation;
  }

  return {
    label: explicitLabel,
    labelText: explicitLabel,
  };
}

function getFunctionName(value: unknown) {
  if ((typeof value === 'function' || (value && typeof value === 'object')) && isProxy(value)) {
    return undefined;
  }
  return typeof value === 'function' && typeof value.name === 'string' && value.name ? value.name : undefined;
}

function getLoaderName(value: unknown) {
  const directName = getFunctionName(value);
  if (directName) {
    return directName;
  }
  if (!value || typeof value !== 'object' || isProxy(value)) {
    return undefined;
  }
  const loader = getOwnDataPropertyValue(value, 'loader');
  return getFunctionName(loader);
}

function hasCreateModelOptionsSubModels(value: unknown): value is FlowSurfaceCreateModelOptionsSubModels {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((items) => Array.isArray(items))
  );
}

function getOwnDescriptorEntries(value: Record<string, unknown>): FlowSurfaceOwnDescriptorEntry[] {
  if (isProxy(value)) {
    return [];
  }
  try {
    return Object.entries(Object.getOwnPropertyDescriptors(value)).map(([key, descriptor]) => {
      if (!('value' in descriptor)) {
        return {
          key,
          readable: false,
        };
      }
      return {
        key,
        readable: true,
        value: descriptor.value,
      };
    });
  } catch {
    return [];
  }
}

function getOwnDataPropertyValue(value: object, property: string) {
  if (isProxy(value)) {
    return undefined;
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    return descriptor && 'value' in descriptor ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

function isProxy(value: object | Function) {
  return nodeUtilTypes.isProxy(value);
}
