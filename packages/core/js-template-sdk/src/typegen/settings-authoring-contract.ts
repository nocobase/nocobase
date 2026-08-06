/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getJsTemplateSettingsContextTypeName,
  type JsTemplateClientTypegenKind,
  type JsTemplateSettingsContextTypeName,
} from './authoring-contract';

export type { JsTemplateClientTypegenKind, JsTemplateSettingsContextTypeName } from './authoring-contract';

export interface JsTemplateSettingsAuthoringTemplate {
  target: 'client';
  kind: JsTemplateClientTypegenKind;
  templateName: string;
  entryKey: string;
  descriptorPath: string;
  virtualImport: string;
  schema: Record<string, unknown>;
  schemaHash: string;
}

export interface JsTemplateSettingsAuthoringContract {
  specifier: string;
  target: 'client';
  kind: JsTemplateClientTypegenKind;
  templateName: string;
  entryKey: string;
  descriptorPath: string;
  virtualImport: string;
  schemaHash: string;
  settingsTypeExpression: string;
  settingsSchemaSummaryTypeExpression: string;
  context: {
    publicTypeName: JsTemplateSettingsContextTypeName;
    settingsTypeExpression: string;
  };
}

export type JsTemplateSettingsAuthoringContractLookup = ReadonlyMap<string, JsTemplateSettingsAuthoringContract>;

type JsonSchemaLike = {
  type?: unknown;
  enum?: unknown;
  required?: unknown;
  properties?: unknown;
  items?: unknown;
};

export function buildJsTemplateSettingsAuthoringContract(
  template: JsTemplateSettingsAuthoringTemplate,
): JsTemplateSettingsAuthoringContract {
  const settingsTypeExpression = schemaObjectToTypeExpression(template.schema);
  return {
    specifier: template.virtualImport,
    target: template.target,
    kind: template.kind,
    templateName: template.templateName,
    entryKey: template.entryKey,
    descriptorPath: template.descriptorPath,
    virtualImport: template.virtualImport,
    schemaHash: template.schemaHash,
    settingsTypeExpression,
    settingsSchemaSummaryTypeExpression: `{ target: ${JSON.stringify(template.target)}; kind: ${JSON.stringify(
      template.kind,
    )}; templateName: ${JSON.stringify(template.templateName)}; entryKey: ${JSON.stringify(
      template.entryKey,
    )}; descriptorPath: ${JSON.stringify(template.descriptorPath)}; virtualImport: ${JSON.stringify(
      template.virtualImport,
    )}; schemaHash: ${JSON.stringify(template.schemaHash)} }`,
    context: {
      publicTypeName: getJsTemplateSettingsContextTypeName(template.kind),
      settingsTypeExpression,
    },
  };
}

export function buildJsTemplateSettingsAuthoringContractLookup(
  templates: readonly JsTemplateSettingsAuthoringTemplate[],
): JsTemplateSettingsAuthoringContractLookup {
  return new Map(
    templates.map((template) => {
      const contract = buildJsTemplateSettingsAuthoringContract(template);
      return [contract.specifier, contract] as const;
    }),
  );
}

function schemaObjectToTypeExpression(schema: Record<string, unknown>): string {
  const schemaLike = schema as JsonSchemaLike;
  const properties = isRecord(schemaLike.properties) ? schemaLike.properties : {};
  const required = new Set(Array.isArray(schemaLike.required) ? schemaLike.required.filter(isString) : []);
  const fields = Object.entries(properties)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
    .map(([propertyName, propertySchema]) => {
      const optional = required.has(propertyName) ? '' : '?';
      return `${quotePropertyName(propertyName)}${optional}: ${schemaToType(propertySchema as JsonSchemaLike)}`;
    });
  return fields.length ? `{ ${fields.join('; ')}; }` : '{}';
}

function schemaToType(schema: JsonSchemaLike): string {
  if (Array.isArray(schema.enum)) {
    return schema.enum.map(literalToType).join(' | ') || 'unknown';
  }
  const type = normalizeSchemaType(schema);
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'array') {
    return `Array<${isRecord(schema.items) ? schemaToType(schema.items as JsonSchemaLike) : 'unknown'}>`;
  }
  if (type === 'object') return schemaObjectToTypeExpression(schema as Record<string, unknown>);
  return 'unknown';
}

function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  if (Array.isArray(schema.type)) {
    return schema.type.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schema.type === 'string') return schema.type;
  if (isRecord(schema.properties) || Array.isArray(schema.required)) return 'object';
  if (isRecord(schema.items)) return 'array';
  return undefined;
}

function literalToType(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null
    ? JSON.stringify(value)
    : 'unknown';
}

function quotePropertyName(propertyName: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName) ? propertyName : JSON.stringify(propertyName);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
