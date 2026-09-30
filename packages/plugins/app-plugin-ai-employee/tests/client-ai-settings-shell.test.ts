import { describe, expect, it } from 'vitest';
import { getActiveAISettingsTabKey } from '../client/ai-settings-shell.tsx';

describe('AI settings navigation', () => {
  it('does not treat the conversation sibling page as an employee tab', () => {
    expect(getActiveAISettingsTabKey('/settings/ai/conversations')).toBe(
      'ai-employee',
    );
    expect(getActiveAISettingsTabKey('/settings/ai/conversations/')).toBe(
      'ai-employee',
    );
  });

  it('recognizes legacy center links for canonical redirects', () => {
    expect(
      getActiveAISettingsTabKey('/settings/ai/', '?tab=conversations'),
    ).toBe('conversations');
    expect(
      getActiveAISettingsTabKey('/settings/ai', '', {
        aiSettingsTab: 'conversations',
      }),
    ).toBe('conversations');
  });

  it('keeps contributed detail route selection ahead of query and state', () => {
    expect(
      getActiveAISettingsTabKey(
        '/settings/ai/knowledge-base/42',
        '?tab=conversations',
        { aiSettingsTab: 'mcp' },
      ),
    ).toBe('knowledge-base');
    expect(getActiveAISettingsTabKey('/settings/ai/vector-database/42')).toBe(
      'vector-database',
    );
  });

  it('supports legacy location state and trailing slashes', () => {
    expect(
      getActiveAISettingsTabKey('/settings/ai/', '', {
        aiSettingsTab: 'knowledge-base',
      }),
    ).toBe('knowledge-base');
    expect(
      getActiveAISettingsTabKey('/settings/ai', '?tab=mcp', {
        aiSettingsTab: 'llm-service',
      }),
    ).toBe('mcp');
  });

  it('keeps the active tab on the shared settings route', () => {
    expect(getActiveAISettingsTabKey('/settings/ai')).toBe('ai-employee');
    expect(getActiveAISettingsTabKey('/settings/ai', '?tab=llm-service')).toBe(
      'llm-service',
    );
  });
});
