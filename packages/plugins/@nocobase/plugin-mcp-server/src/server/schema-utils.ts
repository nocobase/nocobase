/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function sanitizeSchemaNode(node: any): any {
  if (Array.isArray(node)) {
    return node.map((item) => sanitizeSchemaNode(item)).filter((item) => typeof item !== 'undefined');
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const sanitizedEntries = Object.entries(node)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => [key, sanitizeSchemaNode(value)] as const)
    .filter(([, value]) => typeof value !== 'undefined');

  const sanitizedNode = Object.fromEntries(sanitizedEntries) as Record<string, any>;

  if (Array.isArray(sanitizedNode.type)) {
    const nextTypes = sanitizedNode.type.filter((type: unknown) => type !== null && type !== 'null');
    if (nextTypes.length === 1) {
      sanitizedNode.type = nextTypes[0];
    } else if (nextTypes.length > 1) {
      sanitizedNode.type = nextTypes;
    } else {
      delete sanitizedNode.type;
    }
  } else if (sanitizedNode.type === null || sanitizedNode.type === 'null') {
    delete sanitizedNode.type;
  }

  delete sanitizedNode.nullable;

  if (typeof sanitizedNode.type === 'undefined') {
    if (
      sanitizedNode.properties ||
      sanitizedNode.additionalProperties ||
      Array.isArray(sanitizedNode.required) ||
      sanitizedNode.patternProperties
    ) {
      sanitizedNode.type = 'object';
    } else if (sanitizedNode.items) {
      sanitizedNode.type = 'array';
    }
  }

  return sanitizedNode;
}

export function sanitizeJsonSchemaForOpenAITools<T>(schema: T): T {
  return sanitizeSchemaNode(schema);
}
