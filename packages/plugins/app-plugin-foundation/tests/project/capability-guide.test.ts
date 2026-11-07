import { describe, expect, it } from 'vitest';

import {
  CAPABILITIES,
  CAPABILITY_GROUP_IDS,
  CAPABILITY_PROMPTS,
  findCapability,
  guideContent,
} from '../../shared/capability-guide/index.js';

function blankStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    blankStrings(child, path ? `${path}.${key}` : key),
  );
}

describe('capability guide catalog', () => {
  it('lists each capability once, in a known group, relating only to listed capabilities', () => {
    const ids = CAPABILITIES.map((capability) => capability.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.toSorted()).toEqual(Object.keys(CAPABILITY_PROMPTS).toSorted());
    for (const capability of CAPABILITIES) {
      expect(CAPABILITY_GROUP_IDS).toContain(capability.group);
      expect(capability.prompts.length).toBeGreaterThan(0);
      for (const related of capability.related)
        expect(
          findCapability(related),
          `${capability.id} → ${related}`,
        ).toBeDefined();
    }
  });

  it.each(['en-US', 'zh-CN'])(
    'words every capability and prompt in %s, with nothing extra or blank',
    (locale) => {
      const content = guideContent(locale);
      expect(Object.keys(content.capabilities).toSorted()).toEqual(
        Object.keys(CAPABILITY_PROMPTS).toSorted(),
      );
      for (const capability of CAPABILITIES) {
        const prompts = content.capabilities[capability.id].prompts;
        expect({
          id: capability.id,
          prompts: Object.keys(prompts).toSorted(),
        }).toEqual({
          id: capability.id,
          prompts: [...capability.prompts].toSorted(),
        });
      }
      expect(blankStrings(content)).toEqual([]);
    },
  );
});
