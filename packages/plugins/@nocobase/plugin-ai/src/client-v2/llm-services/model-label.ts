/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Strip known prefixes from a model ID.
 */
export const stripModelIdPrefix = (id: string): string => {
  let name = id;
  name = name.replace(/^ft:/, '');
  const slashIndex = name.lastIndexOf('/');
  if (slashIndex !== -1) {
    name = name.substring(slashIndex + 1);
  }
  return name;
};

export const capitalize = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Merge consecutive short (<=2 digit) numeric segments with '.'.
 * e.g. ["claude","opus","4","5","20251101"] -> ["claude","opus","4.5","20251101"]
 */
export const mergeVersionSegments = (segments: string[]): string[] => {
  const result: string[] = [];
  let i = 0;
  while (i < segments.length) {
    if (/^\d{1,2}$/.test(segments[i])) {
      let version = segments[i];
      while (i + 1 < segments.length && /^\d{1,2}$/.test(segments[i + 1])) {
        version += '.' + segments[i + 1];
        i++;
      }
      result.push(version);
    } else {
      result.push(segments[i]);
    }
    i++;
  }
  return result;
};

/**
 * Default fallback: space-separated, version-merged.
 */
export const formatModelLabel = (id: string): string => {
  const name = stripModelIdPrefix(id);
  const segments = mergeVersionSegments(name.split(/[-_]/));
  return segments.map(capitalize).join(' ');
};
