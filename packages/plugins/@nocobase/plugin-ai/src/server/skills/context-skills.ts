/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SkillManager } from './skill-manager';

/**
 * Summarize an API entry for overview (without nested properties details)
 */
function summarizeApiEntry(value: any): any {
  if (!value || typeof value !== 'object') {
    return { description: value?.description || '' };
  }

  const summary: any = {};

  if (value.description) summary.description = value.description;
  if (value.type) summary.type = value.type;
  if (value.title) summary.title = value.title;

  if (value.properties) {
    summary.hasProperties = true;
    summary.propertyNames = Object.keys(value.properties);
  }

  return summary;
}

/**
 * Get all environment variables (dynamic runtime context)
 */
export function getContextEnvs(skillManager: SkillManager): string {
  const contextData = skillManager.getContextData();

  if (!contextData) {
    return JSON.stringify({
      error: 'Context not initialized. No block context available.',
    });
  }

  if (!contextData.envs) {
    return JSON.stringify({
      error: 'No environment variables available.',
    });
  }

  return JSON.stringify(contextData.envs);
}

/**
 * Get API information with progressive disclosure
 * - No path: returns all top-level APIs summary
 * - With path: returns detailed info for that path
 */
export function getContextApis(skillManager: SkillManager, path?: string): string {
  const contextData = skillManager.getContextData();

  if (!contextData) {
    return JSON.stringify({
      error: 'Context not initialized. No block context available.',
    });
  }

  if (!contextData.apis) {
    return JSON.stringify({
      error: 'No APIs available.',
    });
  }

  // No path: return top-level summary
  if (!path || path === '') {
    const summary: Record<string, any> = {};
    for (const [key, value] of Object.entries(contextData.apis)) {
      summary[key] = summarizeApiEntry(value);
    }
    return JSON.stringify(summary);
  }

  // With path: navigate and return details
  const pathParts = path.split('.');
  let current: any = contextData.apis;
  const traversedPath: string[] = [];

  for (const part of pathParts) {
    if (!current || typeof current !== 'object') {
      return JSON.stringify({
        error: `Invalid path: ${path}`,
        validPath: traversedPath.join('.') || 'root',
      });
    }

    if (current.properties && current.properties[part]) {
      current = current.properties[part];
      traversedPath.push(part);
    } else if (current[part]) {
      current = current[part];
      traversedPath.push(part);
    } else {
      const availableKeys = current.properties
        ? Object.keys(current.properties)
        : Object.keys(current).filter((k) => !['description', 'type', 'examples', 'completion', 'title'].includes(k));

      return JSON.stringify({
        error: `"${part}" not found at "${traversedPath.join('.') || 'root'}"`,
        availableKeys,
      });
    }
  }

  // Build result with details
  const result: any = { path };

  if (current.description) result.description = current.description;
  if (current.type) result.type = current.type;
  if (current.title) result.title = current.title;
  if (current.examples) result.examples = current.examples;
  if (current.completion) result.completion = current.completion;

  if (current.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(current.properties)) {
      result.properties[key] = summarizeApiEntry(value);
    }
  }

  return JSON.stringify(result);
}
