import { describe, expect, it } from 'vitest';

import { AIEmployeeResources } from '../server/ai/index.js';
import builtInTools from '../server/ai/tools/index.js';
import { AISkillService } from '../server/service/ai-skill-service.js';
import { AIToolService } from '../server/service/ai-tool-service.js';
import { createMockServer } from './mock-server.js';

const skillTitles = {
  'data-metadata': 'Data metadata',
  'data-query': 'Data query',
  'business-analysis-report': 'Business analysis report',
};

const toolTitles = {
  getDataSources: 'List data sources',
  getCollectionNames: 'List collections',
  getCollectionMetadata: 'Get collection metadata',
  searchFieldMetadata: 'Search field metadata',
  dataSourceQuery: 'Query records',
  dataSourceCounting: 'Count records',
  dataQuery: 'Aggregate data',
  businessReportGenerator: 'Business report generator',
  chartGenerator: 'Chart generator',
  executeFrontendTool: 'Execute frontend tool',
  formFiller: 'Form filler',
  getSkill: 'Load skill',
  'knowledge-base-retrieve': 'Knowledge base retrieval',
  loadFrontendTool: 'Load frontend tool',
  'dispatch-sub-agent-task': 'Dispatch AI employee task',
  'get-ai-employee': 'Get AI employee',
  'list-ai-employees': 'List AI employees',
  subAgentWebSearch: 'Web search',
  suggestions: 'Suggestions',
};

const legacyTranslationMarker = /\{\{\s*t\s*\(/u;

function expectPlainText(value: unknown, label: string): void {
  expect(value, label).toEqual(expect.any(String));
  expect(value, label).toMatch(/\S/u);
  expect(value, label).not.toMatch(legacyTranslationMarker);
}

describe('built-in resource display titles', () => {
  it('declares plain English titles and about text for every registered built-in tool', async () => {
    const { aiManager } = await createMockServer();
    await new AIEmployeeResources().registerAIResources(aiManager);
    const tools = await aiManager.toolsManager.listTools({});

    expect(tools.length).toBeGreaterThan(0);
    expect(tools.map((tool) => tool.definition.name).sort()).toEqual(
      builtInTools.map((tool) => tool.definition.name).sort(),
    );
    // Inspect declarations too: registry normalization must not hide missing titles.
    for (const declaration of builtInTools) {
      const { name } = declaration.definition;
      expectPlainText(declaration.introduction?.title, `${name}.title`);
      expectPlainText(declaration.introduction?.about, `${name}.about`);
      expect(declaration.introduction?.title, name).not.toBe(name);
      expect(await aiManager.toolsManager.getTools(name)).toMatchObject({
        definition: declaration.definition,
        introduction: declaration.introduction,
      });
    }
    expect(Object.keys(toolTitles).sort()).toEqual(
      tools.map((tool) => tool.definition.name).sort(),
    );
    for (const [name, title] of Object.entries(toolTitles)) {
      expect(await aiManager.toolsManager.getTools(name)).toMatchObject({
        introduction: { title },
      });
    }

    const toolService = new AIToolService({ ai: aiManager });
    const actor = { id: 'settings-reader', canReadAllTools: true };
    const managedTools = await toolService.list({ actor });
    expect(managedTools).toHaveLength(tools.length);
    expect(JSON.stringify(managedTools)).not.toMatch(legacyTranslationMarker);
    for (const tool of tools) {
      const name = tool.definition.name;
      expectPlainText(tool.introduction?.title, `${name}.title`);
      expectPlainText(tool.introduction?.about, `${name}.about`);
      const expected = {
        name,
        title: tool.introduction?.title,
        description: tool.definition.description,
        about: tool.introduction?.about ?? '',
      };
      expect(managedTools).toEqual(
        expect.arrayContaining([expect.objectContaining(expected)]),
      );
      const details = await toolService.get({ actor, name });
      expect(details).toMatchObject(expected);
      expect(JSON.stringify(details)).not.toMatch(legacyTranslationMarker);
    }
  });

  it('loads the shipped skill titles and preserves exact skill and tool titles in management', async () => {
    const { aiManager } = await createMockServer();
    await new AIEmployeeResources().registerAIResources(aiManager);
    const skills = await aiManager.skillsManager.listSkills();
    expect(
      Object.fromEntries(
        skills.map((skill) => [skill.name, skill.introduction?.title]),
      ),
    ).toEqual(skillTitles);

    const service = new AISkillService({ ai: aiManager });
    const actor = { id: 'settings-reader', canReadAllSkills: true };
    const rows = await service.list({ actor });
    expect(rows).toHaveLength(skills.length);
    expect(JSON.stringify(rows)).not.toMatch(legacyTranslationMarker);
    for (const skill of skills) {
      expectPlainText(skill.introduction?.title, `${skill.name}.title`);
      if (skill.introduction?.about !== undefined) {
        expectPlainText(skill.introduction.about, `${skill.name}.about`);
      }
      const expectedTools = await Promise.all(
        (skill.tools ?? []).map(async (name) => {
          const tool = await aiManager.toolsManager.getTools(name);
          expect(tool, name).toBeDefined();
          return {
            name,
            title: tool?.introduction?.title,
            description: tool?.definition.description,
            about: tool?.introduction?.about ?? '',
            i18n: tool?.i18n,
            available: true,
          };
        }),
      );
      const summary = {
        name: skill.name,
        title: skill.introduction?.title,
        description: skill.description,
        about: skill.introduction?.about ?? '',
        scope: skill.scope,
        source: skill.from ?? '',
        i18n: skill.i18n,
        tools: expectedTools,
      };
      expect(rows.find((row) => row.name === skill.name)).toEqual(summary);
      const details = await service.get({ actor, name: skill.name });
      expect(details).toEqual({ ...summary, content: skill.content });
      expect(JSON.stringify(details)).not.toMatch(legacyTranslationMarker);
    }
  });
});
