/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URL, LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION } from '../../../constants';
import type { LightExtensionCapabilities, LightExtensionDiagnostic } from '../../../shared/types';
import { diagnostic, isPlainRecord } from './diagnostics';
import type { DiagnosticTarget, NormalizedSourceFile, ParsedEntryDescriptor } from './types';
import { isValidEntryName } from './workspacePolicy';

const invalidJsonParse = Symbol('invalidJsonParse');

export class LightExtensionSchemaValidator {
  constructor(private readonly capabilities: LightExtensionCapabilities) {}

  validateEntryDescriptor(
    file: NormalizedSourceFile | undefined,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): ParsedEntryDescriptor | null {
    if (!file) {
      diagnostics.push(diagnostic('entry_descriptor_missing', 'error', 'Entry root must include entry.json', target));
      return null;
    }

    if (file.size > this.capabilities.limits.maxEntryDescriptorBytes) {
      diagnostics.push(
        diagnostic('entry_descriptor_too_large', 'error', 'entry.json exceeds the 128 KiB size limit', {
          ...target,
          path: file.path,
          details: {
            size: file.size,
            maxEntryDescriptorBytes: this.capabilities.limits.maxEntryDescriptorBytes,
          },
        }),
      );
      return null;
    }

    const json = this.parseJson(file, 'entry_descriptor_json_invalid', diagnostics, target);
    if (json === invalidJsonParse) {
      return null;
    }
    if (!isPlainRecord(json)) {
      diagnostics.push(
        diagnostic('entry_descriptor_invalid', 'error', 'entry.json must contain a JSON object', {
          ...target,
          path: file.path,
        }),
      );
      return null;
    }

    const descriptorTarget = { ...target, path: file.path };
    const allowedKeys = new Set([
      '$schema',
      'schemaVersion',
      'key',
      'title',
      'description',
      'category',
      'icon',
      'tags',
      'sort',
      'settingsSchema',
    ]);
    for (const key of Object.keys(json)) {
      if (!allowedKeys.has(key)) {
        diagnostics.push(
          diagnostic(
            'entry_descriptor_unknown_field',
            'error',
            `entry.json field "${key}" is not supported`,
            descriptorTarget,
          ),
        );
      }
    }

    if (json.schemaVersion !== LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION) {
      diagnostics.push(
        diagnostic(
          typeof json.schemaVersion === 'undefined'
            ? 'entry_descriptor_schema_version_required'
            : 'entry_descriptor_schema_version_unsupported',
          'error',
          `entry.json schemaVersion must be ${LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION}`,
          descriptorTarget,
        ),
      );
    }
    if (typeof json.$schema !== 'undefined' && json.$schema !== LIGHT_EXTENSION_ENTRY_SCHEMA_URL) {
      diagnostics.push(
        diagnostic(
          'entry_descriptor_schema_url_unsupported',
          'error',
          `entry.json $schema must be "${LIGHT_EXTENSION_ENTRY_SCHEMA_URL}"`,
          descriptorTarget,
        ),
      );
    }
    const key = requiredSlugField(json, 'key', diagnostics, descriptorTarget);
    const settingsSchema = this.validateSettingsSchema(json.settingsSchema, diagnostics, descriptorTarget);
    if (!key) {
      return null;
    }

    return {
      key,
      title: optionalStringField(json, 'title', diagnostics, descriptorTarget, 120),
      description: optionalStringField(json, 'description', diagnostics, descriptorTarget, 1000),
      category: optionalSlugField(json, 'category', diagnostics, descriptorTarget),
      icon: optionalStringField(json, 'icon', diagnostics, descriptorTarget, 120),
      tags: optionalStringArrayField(json, 'tags', diagnostics, descriptorTarget),
      sort: optionalIntegerField(json, 'sort', diagnostics, descriptorTarget),
      settingsSchema,
    };
  }

  private validateSettingsSchema(
    value: unknown,
    diagnostics: LightExtensionDiagnostic[],
    target: DiagnosticTarget,
  ): Record<string, unknown> | null {
    if (typeof value === 'undefined') {
      return null;
    }
    if (!isPlainRecord(value)) {
      diagnostics.push(
        diagnostic(
          'settings_schema_invalid',
          'error',
          'entry.json settingsSchema must be a JSON object schema',
          target,
        ),
      );
      return null;
    }

    this.validateSettingsSchemaNode(value, {
      path: target.path || '',
      schemaPath: '$.settingsSchema',
      depth: 0,
      diagnostics,
      target,
    });

    return value;
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
        diagnostic('settings_schema_too_deep', 'error', 'entry.json settingsSchema is too deeply nested', {
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
            `entry.json settingsSchema keyword "${key}" is not supported`,
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
          diagnostic(
            'settings_expression_not_allowed',
            'error',
            'entry.json settingsSchema expressions are not supported',
            {
              ...schemaTarget,
              details: {
                schemaPath: `${input.schemaPath}.${key}`,
                keyword: key,
              },
            },
          ),
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
          diagnostic('settings_schema_type_not_allowed', 'error', 'entry.json settingsSchema type is not supported', {
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
          diagnostic(
            'settings_x_component_not_allowed',
            'error',
            'entry.json settingsSchema x-component is not allowed',
            {
              ...schemaTarget,
              details: {
                schemaPath: input.schemaPath,
                component: node['x-component'],
              },
            },
          ),
        );
      }
    }

    if (typeof node.required !== 'undefined') {
      if (!Array.isArray(node.required) || node.required.some((item) => typeof item !== 'string')) {
        input.diagnostics.push(
          diagnostic(
            'settings_required_invalid',
            'error',
            'entry.json settingsSchema required must be a string array',
            {
              ...schemaTarget,
              details: {
                schemaPath: input.schemaPath,
              },
            },
          ),
        );
      }
    }

    if (typeof node.enum !== 'undefined' && !Array.isArray(node.enum)) {
      input.diagnostics.push(
        diagnostic('settings_enum_invalid', 'error', 'entry.json settingsSchema enum must be an array', {
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
          diagnostic('settings_properties_invalid', 'error', 'entry.json settingsSchema properties must be an object', {
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
              diagnostic(
                'settings_property_name_invalid',
                'error',
                'entry.json settingsSchema property name is invalid',
                {
                  ...schemaTarget,
                  details: {
                    schemaPath: `${input.schemaPath}.properties.${propertyName}`,
                    propertyName,
                  },
                },
              ),
            );
            continue;
          }
          if (!isPlainRecord(propertySchema)) {
            input.diagnostics.push(
              diagnostic(
                'settings_property_schema_invalid',
                'error',
                'entry.json settingsSchema property schema must be an object',
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
          diagnostic('settings_items_invalid', 'error', 'entry.json settingsSchema items must be a schema object', {
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
        diagnostic('settings_schema_too_deep', 'error', 'entry.json settingsSchema is too deeply nested', {
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
          diagnostic(
            'settings_expression_not_allowed',
            'error',
            'entry.json settingsSchema expressions are not supported',
            {
              ...schemaTarget,
              details: {
                schemaPath: input.schemaPath,
              },
            },
          ),
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
    diagnostics.push(
      diagnostic('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a string`, target),
    );
    return null;
  }
  if (value.length > maxLength) {
    diagnostics.push(
      diagnostic('entry_descriptor_field_too_long', 'error', `entry.json field "${key}" is too long`, target),
    );
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
    diagnostics.push(
      diagnostic('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a slug`, target),
    );
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
      diagnostic('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a string array`, target),
    );
    return null;
  }
  if (value.length > 20) {
    diagnostics.push(
      diagnostic('entry_descriptor_field_too_large', 'error', `entry.json field "${key}" has too many items`, target),
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
    diagnostics.push(
      diagnostic('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be an integer`, target),
    );
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
      diagnostic(
        'settings_field_invalid',
        'error',
        `entry.json settingsSchema field "${key}" must be a string`,
        target,
      ),
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
      diagnostic(
        'settings_field_invalid',
        'error',
        `entry.json settingsSchema field "${key}" must be a number`,
        target,
      ),
    );
  }
}

function isValidSettingsPropertyName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(value);
}

function containsTemplateExpression(value: string): boolean {
  return value.includes('{{') || value.includes('}}');
}

function requiredSlugField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): string | null {
  if (typeof record[key] === 'undefined' || record[key] === null || record[key] === '') {
    diagnostics.push(
      diagnostic('entry_descriptor_key_required', 'error', 'entry.json field "key" is required', target),
    );
    return null;
  }

  return optionalSlugField(record, key, diagnostics, target);
}
