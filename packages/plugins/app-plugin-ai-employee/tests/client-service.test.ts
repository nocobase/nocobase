import { describe, expect, it } from 'vitest';

import {
  buildAIEmployeeUpdatePayload,
  buildEditableValues,
  hasKnowledgeBaseDataPlaceholder,
  type AIEmployeeEditableValues,
  type AIEmployeeRecord,
} from '../client/ai-employee-service.ts';

describe('AI employee knowledge base editing', () => {
  it('defaults legacy records to always retrieval and preserves on-demand settings', () => {
    expect(
      buildEditableValues({ username: 'legacy' }).knowledgeBase,
    ).toMatchObject({
      retrievalStrategy: 'always',
    });
    expect(
      buildEditableValues({
        username: 'modern',
        knowledgeBase: { retrievalStrategy: 'onDemand' },
      }).knowledgeBase,
    ).toMatchObject({ retrievalStrategy: 'onDemand' });
  });

  it('requires the exact knowledge base data placeholder', () => {
    expect(
      hasKnowledgeBaseDataPlaceholder('Context: {knowledgeBaseData}'),
    ).toBe(true);
    expect(
      hasKnowledgeBaseDataPlaceholder('Context: {knowledgeBasedata}'),
    ).toBe(false);
  });
});

describe('AI employee update payload', () => {
  it.each(
    [undefined, null, [], ['unknown-tool', 'search']].map((enabledTools) => ({
      enabledTools,
    })),
  )(
    'preserves and clones enabledTools $enabledTools and every saved permission',
    ({ enabledTools }) => {
      const employee: AIEmployeeRecord = {
        username: 'ava',
        skillSettings: {
          skills: ['legacy-unknown'],
          tools: [
            { name: 'unknown-tool', autoCall: false, futurePermission: 'keep' },
            { name: 'search', autoCall: true },
          ],
          ...(enabledTools === undefined ? {} : { enabledTools }),
        },
      };
      const editable = buildEditableValues(employee);
      const payload = buildAIEmployeeUpdatePayload(employee, editable);
      if (enabledTools === undefined) {
        expect(editable.skillSettings).not.toHaveProperty('enabledTools');
        expect(payload.skillSettings).not.toHaveProperty('enabledTools');
      } else {
        expect(editable.skillSettings.enabledTools).toEqual(enabledTools);
        expect(payload.skillSettings.enabledTools).toEqual(enabledTools);
      }
      if (Array.isArray(enabledTools)) {
        expect(editable.skillSettings.enabledTools).not.toBe(enabledTools);
        expect(payload.skillSettings.enabledTools).not.toBe(
          editable.skillSettings.enabledTools,
        );
        payload.skillSettings.enabledTools?.push('another');
        expect(editable.skillSettings.enabledTools).toEqual(enabledTools);
      }
      expect(payload.skillSettings.tools).toEqual(
        employee.skillSettings?.tools,
      );
      expect(editable.skillSettings.tools[0]).not.toBe(
        employee.skillSettings?.tools?.[0],
      );
      expect(payload.skillSettings.tools[0]).not.toBe(
        editable.skillSettings.tools[0],
      );
      expect(payload.skillSettings.skills).toEqual(['legacy-unknown']);
    },
  );

  it.each(
    [undefined, null, [], ['unknown-skill', 'analysis']].map(
      (enabledSkills) => ({ enabledSkills }),
    ),
  )(
    'preserves and clones enabledSkills $enabledSkills without defaulting or filtering',
    ({ enabledSkills }) => {
      const employee: AIEmployeeRecord = {
        username: 'ava',
        skillSettings: {
          skills: ['legacy-unknown'],
          ...(enabledSkills === undefined ? {} : { enabledSkills }),
        },
      };
      const editable = buildEditableValues(employee);
      const payload = buildAIEmployeeUpdatePayload(employee, editable);
      if (enabledSkills === undefined) {
        expect(editable.skillSettings).not.toHaveProperty('enabledSkills');
        expect(payload.skillSettings).not.toHaveProperty('enabledSkills');
      } else {
        expect(editable.skillSettings.enabledSkills).toEqual(enabledSkills);
        expect(payload.skillSettings.enabledSkills).toEqual(enabledSkills);
      }
      if (Array.isArray(enabledSkills)) {
        expect(editable.skillSettings.enabledSkills).not.toBe(enabledSkills);
        expect(payload.skillSettings.enabledSkills).not.toBe(
          editable.skillSettings.enabledSkills,
        );
        payload.skillSettings.enabledSkills?.push('another');
        expect(editable.skillSettings.enabledSkills).toEqual(enabledSkills);
      }
      expect(payload.skillSettings.skills).toEqual(['legacy-unknown']);
    },
  );

  it('submits editable role, model, skill, and knowledge base settings', () => {
    const employee: AIEmployeeRecord = {
      username: 'ava',
      nickname: 'Ava',
      about: 'read-only role',
      skillSettings: { skills: ['analysis'], tools: [{ name: 'search' }] },
      modelSettings: { enabled: false, futureSetting: true },
      knowledgeBase: { futureSetting: 'preserved' },
    };
    const editable: AIEmployeeEditableValues = {
      enabled: false,
      about: 'updated role',
      modelSettings: {
        enabled: true,
        models: [{ llmService: 'openai', model: 'gpt' }],
      },
      skillSettings: {
        skills: ['analysis', 'writing'],
        tools: [{ name: 'search', autoCall: true }],
      },
      enableKnowledgeBase: true,
      knowledgeBasePrompt: '',
      knowledgeBase: { knowledgeBaseKeys: [], topK: 8, score: 0.7 },
    };

    const payload = buildAIEmployeeUpdatePayload(employee, editable);

    expect(payload).toEqual({
      enabled: false,
      about: 'updated role',
      modelSettings: {
        enabled: true,
        futureSetting: true,
        models: [{ llmService: 'openai', model: 'gpt' }],
      },
      skillSettings: {
        skills: ['analysis', 'writing'],
        tools: [{ name: 'search', autoCall: true }],
      },
      enableKnowledgeBase: true,
      knowledgeBasePrompt: '',
      knowledgeBase: {
        futureSetting: 'preserved',
        knowledgeBaseKeys: [],
        topK: 8,
        score: 0.7,
      },
    });
    expect(payload).not.toHaveProperty('nickname');
  });
});
