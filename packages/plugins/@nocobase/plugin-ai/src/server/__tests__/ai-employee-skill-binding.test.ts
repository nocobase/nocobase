/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employees/ai-employee';

describe('AIEmployee skill tool binding', () => {
  it('should include tools from dynamically loaded skills even if they are filtered out of available skills', async () => {
    const employee = Object.create(AIEmployee.prototype) as AIEmployee & {
      plugin: any;
      getLoadedSkillNames: () => Promise<string[]>;
      getAvailableSkills: () => Promise<any[]>;
    };

    employee.plugin = {
      ai: {
        skillsManager: {
          getSkills: vi.fn().mockResolvedValue([
            {
              name: 'data-query',
              tools: ['getSkill', 'dataQuery', 'dataSourceQuery', 'dataSourceCounting'],
            },
            {
              name: 'data-metadata',
              tools: ['getDataSources', 'getCollectionNames', 'getCollectionMetadata', 'searchFieldMetadata'],
            },
          ]),
        },
      },
    };
    employee.getLoadedSkillNames = vi.fn().mockResolvedValue(['data-query', 'data-metadata']);
    employee.getAvailableSkills = vi.fn().mockResolvedValue([
      {
        name: 'business-analysis-report',
        tools: ['getSkill', 'businessReportGenerator'],
      },
    ]);

    const result = await employee.getActivatedSkillToolNames();

    expect(result).toEqual(
      new Set([
        'getSkill',
        'dataQuery',
        'dataSourceQuery',
        'dataSourceCounting',
        'getDataSources',
        'getCollectionNames',
        'getCollectionMetadata',
        'searchFieldMetadata',
      ]),
    );
    expect(employee.plugin.ai.skillsManager.getSkills).toHaveBeenCalledWith(['data-query', 'data-metadata']);
  });

  it('should keep skill-owned tools unavailable until the skill is loaded', async () => {
    const employee = Object.create(AIEmployee.prototype) as AIEmployee & {
      getAIEmployeeTools: () => Promise<any[]>;
      getToolsMap: () => Promise<Map<string, any>>;
      getAvailableSkills: () => Promise<any[]>;
    };

    const getSkillTool = { definition: { name: 'getSkill' } };
    const businessReportGeneratorTool = { definition: { name: 'businessReportGenerator' } };
    const getCollectionMetadataTool = { definition: { name: 'getCollectionMetadata' } };

    employee.getAIEmployeeTools = vi.fn().mockResolvedValue([getSkillTool, businessReportGeneratorTool]);
    employee.getToolsMap = vi.fn().mockResolvedValue(
      new Map([
        ['getSkill', getSkillTool],
        ['businessReportGenerator', businessReportGeneratorTool],
        ['getCollectionMetadata', getCollectionMetadataTool],
      ]),
    );
    employee.getAvailableSkills = vi.fn().mockResolvedValue([
      {
        name: 'business-analysis-report',
        tools: ['getSkill', 'businessReportGenerator'],
      },
    ]);

    const result = await (employee as any).getAgentTools();

    expect(result.baseToolNames).toEqual(new Set(['getSkill']));
    expect(result.tools.map((tool) => tool.definition.name)).toEqual([
      'getSkill',
      'businessReportGenerator',
      'getCollectionMetadata',
    ]);
  });
});
