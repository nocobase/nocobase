import { describe, expect, it } from 'vitest';

import { ruleKindOfAddress } from '../../../client/settings/readable-rule-tabs.js';

describe('the kind of rule an address opens', () => {
  it('reads each kind from its own address and the addresses below it', () => {
    expect(ruleKindOfAddress('/settings/default-access', '')).toBe(
      'default-access',
    );
    expect(
      ruleKindOfAddress('/settings/default-access/project/edit', '?x=1'),
    ).toBe('default-access');
    expect(ruleKindOfAddress('/settings/sharing-rules', '')).toBe(
      'sharing-rules',
    );
    expect(ruleKindOfAddress('/settings/restriction-rules/', '')).toBe(
      'restriction-rules',
    );
  });

  it('reads a kind named under Default access and ignores any other address', () => {
    expect(ruleKindOfAddress('/settings/default-access', '?rule=custom')).toBe(
      'custom',
    );
    expect(
      ruleKindOfAddress('/settings/roles', '?rule=custom'),
    ).toBeUndefined();
    expect(ruleKindOfAddress('/default-access', '')).toBeUndefined();
    expect(
      ruleKindOfAddress('/settings/default-access-extra', ''),
    ).toBeUndefined();
  });
});
