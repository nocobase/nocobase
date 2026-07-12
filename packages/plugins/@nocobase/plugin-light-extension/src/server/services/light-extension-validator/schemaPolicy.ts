/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionCapabilities, LightExtensionDiagnostic } from '../../../shared/types';
import { diagnostic, isPlainRecord } from './diagnostics';
import type { DiagnosticTarget, NormalizedSourceFile, ParsedMeta } from './types';
import { isValidEntryName } from './workspacePolicy';

const invalidJsonParse = Symbol('invalidJsonParse');

export class LightExtensionSchemaValidator {
  constructor(private readonly capabilities: LightExtensionCapabilities) {}

  validateMetaFile(
    file: NormalizedSourceFile | undefined,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): ParsedMeta {
    const emptyMeta: ParsedMeta = {
      key: null,
      title: null,
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
    };

    if (!file) {
      return emptyMeta;
    }

    const json = this.parseJson(file, 'meta_json_invalid', diagnostics, target);
    if (json === invalidJsonParse) {
      return emptyMeta;
    }
    if (!isPlainRecord(json)) {
      diagnostics.push(
        diagnostic('meta_json_invalid', 'error', 'meta.json must contain a JSON object', {
          ...target,
          path: file.path,
        }),
      );
      return emptyMeta;
    }

    const allowedKeys = new Set(['key', 'title', 'description', 'category', 'icon', 'tags', 'sort']);
    for (const key of Object.keys(json)) {
      if (!allowedKeys.has(key)) {
        diagnostics.push(
          diagnostic('meta_unknown_field', 'error', `meta.json field "${key}" is not supported`, {
            ...target,
            path: file.path,
          }),
        );
      }
    }

    return {
      key: optionalSlugField(json, 'key', diagnostics, { ...target, path: file.path }),
      title: optionalStringField(json, 'title', diagnostics, { ...target, path: file.path }, 120),
      description: optionalStringField(json, 'description', diagnostics, { ...target, path: file.path }, 1000),
      category: optionalSlugField(json, 'category', diagnostics, { ...target, path: file.path }),
      icon: optionalStringField(json, 'icon', diagnostics, { ...target, path: file.path }, 120),
      tags: optionalStringArrayField(json, 'tags', diagnostics, { ...target, path: file.path }),
      sort: optionalIntegerField(json, 'sort', diagnostics, { ...target, path: file.path }),
    };
  }

  validateSettingsFile(
    file: NormalizedSourceFile | undefined,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): Record<string, unknown> | null {
    if (!file) {
      return null;
    }

    const json = this.parseJson(file, 'settings_json_invalid', diagnostics, target);
    if (json === invalidJsonParse) {
      return null;
    }
    if (!isPlainRecord(json)) {
      diagnostics.push(
        diagnostic('settings_schema_invalid', 'error', 'settings.json must contain a JSON object schema', {
          ...target,
          path: file.path,
        }),
      );
      return null;
    }

    this.validateSettingsSchemaNode(json, {
      path: file.path,
      schemaPath: '$',
      depth: 0,
      diagnostics,
      target,
    });

    return json;
  }

  private parseJson(
    file: NormalizedSourceFile,
    code: string,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): unknown {
    if (file.size > this.capabilities.limits.maxJsonBytes) {
      diagnostics.push(
        diagnostic('json_file_too_large', 'error', 'JSON metadata file is too large', {
          ...target,
          path: file.path,
          details: {
            size: file.size,
            maxJsonBytes: this.capabilities.limits.maxJsonBytes,
          },
        }),
      );
      return invalidJsonParse;
    }

    try {
      return JSON.parse(file.content);
    } catch (error) {
      diagnostics.push(
        diagnostic(code, 'error', error instanceof Error ? error.message : 'Invalid JSON', {
          ...target,
          path: file.path,
        }),
      );
      return invalidJsonParse;
    }
  }

  private validateSettingsSchemaNode(
    node: Record<string, unknown>,
    input: {
      path: string;
      schemaPath: string;
      depth: number;
      diagnostics: LightExtensionDiagnostic[];
      target: Omit<DiagnosticTarget, 'path'>;
    },
  ): void {
    const keywordSet = new Set<string>(this.capabilities.schemaSubset.allowedKeywords);
    const schemaTarget = {
      ...input.target,
      path: input.path,
    };

    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.diagnostics.push(
        diagnostic('settings_schema_too_deep', 'error', 'settings.json schema is too deeply nested', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
            maxDepth: this.capabilities.limits.maxSettingsSchemaDepth,
          },
        }),
      );
      return;
    }

    for (const key of Object.keys(node)) {
      if (!keywordSet.has(key)) {
        input.diagnostics.push(
          diagnostic(
            'settings_schema_keyword_not_allowed',
            'error',
            `settings.json keyword "${key}" is not supported`,
            {
              ...schemaTarget,
              details: {
                schemaPath: input.schemaPath,
                keyword: key,
              },
            },
          ),
        );
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && containsTemplateExpression(value)) {
        input.diagnostics.push(
          diagnostic('settings_expression_not_allowed', 'error', 'settings.json expression strings are not supported', {
            ...schemaTarget,
            details: {
              schemaPath: `${input.schemaPath}.${key}`,
              keyword: key,
            },
          }),
        );
      }
    }
    for (const key of ['default', 'enum', 'x-component-props', 'x-decorator-props'] as const) {
      const value = node[key];
      if (Array.isArray(value) || isPlainRecord(value)) {
        this.validateSettingsSchemaValue(value, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }

    if (typeof node.type !== 'undefined') {
      if (typeof node.type !== 'string' || !this.capabilities.schemaSubset.allowedTypes.includes(node.type)) {
        input.diagnostics.push(
          diagnostic('settings_schema_type_not_allowed', 'error', 'settings.json schema type is not supported', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
              type: node.type,
            },
          }),
        );
      }
    }

    validateOptionalString(node, 'title', input.diagnostics, schemaTarget);
    validateOptionalString(node, 'description', input.diagnostics, schemaTarget);
    validateOptionalString(node, 'format', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'minLength', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'maxLength', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'minimum', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'maximum', input.diagnostics, schemaTarget);

    if (typeof node['x-component'] !== 'undefined') {
      if (
        typeof node['x-component'] !== 'string' ||
        !this.capabilities.xComponentWhitelist.includes(node['x-component'])
      ) {
        input.diagnostics.push(
          diagnostic('settings_x_component_not_allowed', 'error', 'settings.json x-component is not allowed', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
              component: node['x-component'],
            },
          }),
        );
      }
    }

    if (typeof node.required !== 'undefined') {
      if (!Array.isArray(node.required) || node.required.some((item) => typeof item !== 'string')) {
        input.diagnostics.push(
          diagnostic('settings_required_invalid', 'error', 'settings.json required must be a string array', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      }
    }

    if (typeof node.enum !== 'undefined' && !Array.isArray(node.enum)) {
      input.diagnostics.push(
        diagnostic('settings_enum_invalid', 'error', 'settings.json enum must be an array', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
          },
        }),
      );
    }

    if (typeof node.properties !== 'undefined') {
      if (!isPlainRecord(node.properties)) {
        input.diagnostics.push(
          diagnostic('settings_properties_invalid', 'error', 'settings.json properties must be an object', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      } else {
        for (const [propertyName, propertySchema] of Object.entries(node.properties)) {
          if (!isValidSettingsPropertyName(propertyName)) {
            input.diagnostics.push(
              diagnostic('settings_property_name_invalid', 'error', 'settings.json property name is invalid', {
                ...schemaTarget,
                details: {
                  schemaPath: `${input.schemaPath}.properties.${propertyName}`,
                  propertyName,
                },
              }),
            );
            continue;
          }
          if (!isPlainRecord(propertySchema)) {
            input.diagnostics.push(
              diagnostic(
                'settings_property_schema_invalid',
                'error',
                'settings.json property schema must be an object',
                {
                  ...schemaTarget,
                  details: {
                    schemaPath: `${input.schemaPath}.properties.${propertyName}`,
                  },
                },
              ),
            );
            continue;
          }
          this.validateSettingsSchemaNode(propertySchema, {
            ...input,
            schemaPath: `${input.schemaPath}.properties.${propertyName}`,
            depth: input.depth + 1,
          });
        }
      }
    }

    if (typeof node.items !== 'undefined') {
      if (!isPlainRecord(node.items)) {
        input.diagnostics.push(
          diagnostic('settings_items_invalid', 'error', 'settings.json items must be a schema object', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      } else {
        this.validateSettingsSchemaNode(node.items, {
          ...input,
          schemaPath: `${input.schemaPath}.items`,
          depth: input.depth + 1,
        });
      }
    }
  }

  private validateSettingsSchemaValue(
    value: unknown,
    input: {
      path: string;
      schemaPath: string;
      depth: number;
      diagnostics: LightExtensionDiagnostic[];
      target: Omit<DiagnosticTarget, 'path'>;
    },
  ): void {
    const schemaTarget = {
      ...input.target,
      path: input.path,
    };

    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.diagnostics.push(
        diagnostic('settings_schema_too_deep', 'error', 'settings.json schema is too deeply nested', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
            maxDepth: this.capabilities.limits.maxSettingsSchemaDepth,
          },
        }),
      );
      return;
    }

    if (typeof value === 'string') {
      if (containsTemplateExpression(value)) {
        input.diagnostics.push(
          diagnostic('settings_expression_not_allowed', 'error', 'settings.json expression strings are not supported', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateSettingsSchemaValue(item, {
          ...input,
          schemaPath: `${input.schemaPath}[${index}]`,
          depth: input.depth + 1,
        });
      });
      return;
    }

    if (isPlainRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        this.validateSettingsSchemaValue(child, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }
  }
}

function optionalStringField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
  maxLength: number,
): string | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a string`, target));
    return null;
  }
  if (value.length > maxLength) {
    diagnostics.push(diagnostic('meta_field_too_long', 'error', `meta.json field "${key}" is too long`, target));
    return null;
  }
  return value;
}

function optionalSlugField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): string | null {
  const value = optionalStringField(record, key, diagnostics, target, 80);
  if (value && !isValidEntryName(value)) {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a slug`, target));
    return null;
  }
  return value;
}

function optionalStringArrayField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): string[] | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    diagnostics.push(
      diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a string array`, target),
    );
    return null;
  }
  if (value.length > 20) {
    diagnostics.push(
      diagnostic('meta_field_too_large', 'error', `meta.json field "${key}" has too many items`, target),
    );
    return null;
  }
  return value;
}

function optionalIntegerField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): number | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be an integer`, target));
    return null;
  }
  return value;
}

function validateOptionalString(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'string') {
    diagnostics.push(
      diagnostic('settings_field_invalid', 'error', `settings.json field "${key}" must be a string`, target),
    );
  }
}

function validateOptionalNumber(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'number') {
    diagnostics.push(
      diagnostic('settings_field_invalid', 'error', `settings.json field "${key}" must be a number`, target),
    );
  }
}

function isValidSettingsPropertyName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(value);
}

function containsTemplateExpression(value: string): boolean {
  return value.includes('{{') || value.includes('}}');
}
