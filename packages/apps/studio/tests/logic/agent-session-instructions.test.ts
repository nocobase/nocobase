import { describe, expect, test } from 'vitest';

import { sessionInstructions } from '../../server/agent-sessions/provider.js';

describe('My Agent task language instructions', () => {
  test.each(['zh-CN', 'en-US'])(
    'uses the effective Studio language %s',
    (locale) => {
      const instructions = sessionInstructions(locale);
      expect(instructions).toContain(
        `current Studio interface language is ${locale}`,
      );
      expect(instructions).toContain(
        'write both titles and descriptions in that language',
      );
      expect(instructions).toContain(
        'explicitly requests another task language, follow their request',
      );
      expect(instructions).toContain(
        'Do not infer the task language from the chat text',
      );
      expect(instructions).toContain(
        'takes precedence over repository rules that require English for code, commits or pull requests',
      );
      expect(instructions).toContain(
        'Keep technical identifiers, code, file paths and product names in their original form',
      );
      expect(instructions).toContain(
        'Do not translate or rewrite existing tasks automatically',
      );
    },
  );
});
