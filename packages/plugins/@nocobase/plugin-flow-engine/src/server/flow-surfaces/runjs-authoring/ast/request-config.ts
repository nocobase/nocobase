/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AstIdentifierBinding, StaticFilterValueBinding, StaticStringBinding } from '../internal-types';
import { normalizeText } from '../runtime/surface';
import { unwrapAstChainExpression } from './bindings';
import {
  getAstStaticPropertyName,
  getRunJsObjectProperty,
  getRunJsObjectPropertyLookup,
  hasAstShadowBinding,
  resolveRunJsStaticObjectExpression,
  resolveRunJsStaticString,
} from './static-values';

export function getRunJsStaticRequestConfigObjectFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
) {
  return (
    resolveRunJsStaticObjectExpression(node.arguments?.[0], identifierBindings, staticFilterValueBindings) ||
    resolveRunJsStaticObjectExpression(node.arguments?.[1], identifierBindings, staticFilterValueBindings)
  );
}

export function getRunJsStaticDataSourceKeyFromHeaders(
  headersNode: any,
  source: string,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
  unresolvedAsUnknown = true,
  propertyUnknownAsUnknown = unresolvedAsUnknown,
): string | undefined {
  const unwrapped = unwrapAstChainExpression(headersNode);
  if (!unwrapped) {
    return undefined;
  }
  const headers = resolveRunJsStaticObjectExpression(headersNode, identifierBindings, staticFilterValueBindings);
  if (!headers) {
    return unresolvedAsUnknown ? '' : undefined;
  }
  const dataSourceProperty = getRunJsObjectPropertyLookup(
    headers,
    ['x-data-source'],
    identifierBindings,
    staticFilterValueBindings,
  );
  if (dataSourceProperty.status === 'unknown') {
    return propertyUnknownAsUnknown ? '' : undefined;
  }
  if (dataSourceProperty.status === 'missing') {
    return undefined;
  }
  if (dataSourceProperty.status !== 'found') {
    return undefined;
  }
  return resolveRunJsStaticString(dataSourceProperty.property.value, source, stringBindings, identifierBindings) ?? '';
}

export function getRunJsStaticRequestDataSourceKeyFromAst(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const configArg = getRunJsStaticRequestConfigObjectFromAst(node, identifierBindings, staticFilterValueBindings);
  const headersProperty = getRunJsObjectProperty(configArg, ['headers'], identifierBindings, staticFilterValueBindings);
  return getRunJsStaticDataSourceKeyFromHeaders(
    headersProperty?.value,
    source,
    stringBindings,
    staticFilterValueBindings,
    identifierBindings,
  );
}

export function getRunJsApiResourceCallDataSourceKey(
  args: any[],
  source: string,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const actionName = resolveRunJsStaticString(args?.[1], source, stringBindings, identifierBindings);
  if (actionName) {
    return getRunJsStaticDataSourceKeyFromActionParams(
      args?.[2],
      source,
      stringBindings,
      staticFilterValueBindings,
      identifierBindings,
    );
  }
  const thirdArgDataSourceKey = getRunJsStaticDataSourceKeyFromHeaders(
    args?.[2],
    source,
    stringBindings,
    staticFilterValueBindings,
    identifierBindings,
  );
  if (typeof thirdArgDataSourceKey === 'string') {
    return thirdArgDataSourceKey;
  }
  return getRunJsStaticDataSourceKeyFromHeaders(
    args?.[1],
    source,
    stringBindings,
    staticFilterValueBindings,
    identifierBindings,
    false,
  );
}

export function getRunJsStaticDataSourceKeyFromActionParams(
  paramsNode: any,
  source: string,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const params = resolveRunJsStaticObjectExpression(paramsNode, identifierBindings, staticFilterValueBindings);
  if (params) {
    const dataSourceProperty = getRunJsActionParamsDataSourcePropertyLookup(
      params,
      identifierBindings,
      staticFilterValueBindings,
    );
    if (dataSourceProperty.status === 'unknown') {
      return '';
    }
    if (dataSourceProperty.status === 'found') {
      return (
        resolveRunJsStaticString(dataSourceProperty.property.value, source, stringBindings, identifierBindings) ?? ''
      );
    }
    return undefined;
  }
  return hasRunJsInactiveStaticDataSourceParamBinding(paramsNode, staticFilterValueBindings, identifierBindings)
    ? ''
    : undefined;
}

export function getRunJsActionParamsDataSourcePropertyLookup(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
): { property: any; status: 'found' } | { status: 'missing' | 'unknown' } {
  const object = unwrapAstChainExpression(node);
  if (object?.type !== 'ObjectExpression') {
    return { status: 'missing' };
  }
  let hasUnknownLaterOverride = false;
  const properties = object.properties || [];
  for (let index = properties.length - 1; index >= 0; index -= 1) {
    const property = properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'SpreadElement') {
      const spreadObject = resolveRunJsStaticObjectExpression(
        property.argument,
        identifierBindings,
        staticFilterValueBindings,
      );
      if (spreadObject) {
        const spreadLookup = getRunJsActionParamsDataSourcePropertyLookup(
          spreadObject,
          identifierBindings,
          staticFilterValueBindings,
        );
        if (spreadLookup.status === 'found') {
          return hasUnknownLaterOverride ? { status: 'unknown' } : spreadLookup;
        }
        if (spreadLookup.status === 'unknown') {
          hasUnknownLaterOverride = true;
        }
        continue;
      }
      hasUnknownLaterOverride = true;
      continue;
    }
    if (property.type !== 'Property') {
      hasUnknownLaterOverride = true;
      continue;
    }
    const propertyName = normalizeText(getAstStaticPropertyName(property));
    if (!propertyName) {
      hasUnknownLaterOverride = true;
      continue;
    }
    if (propertyName.toLowerCase() === 'x-data-source') {
      return hasUnknownLaterOverride ? { status: 'unknown' } : { status: 'found', property };
    }
  }
  return { status: 'missing' };
}

export function hasRunJsInactiveStaticDataSourceParamBinding(
  node: any,
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'Identifier') {
    return false;
  }
  const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
  return staticFilterValueBindings.some(
    (binding) =>
      binding.name === unwrapped.name &&
      index >= binding.end &&
      !hasAstShadowBinding(binding.name, index, binding, identifierBindings) &&
      getRunJsActionParamsDataSourcePropertyLookup(binding.valueNode, identifierBindings, staticFilterValueBindings)
        .status !== 'missing',
  );
}
