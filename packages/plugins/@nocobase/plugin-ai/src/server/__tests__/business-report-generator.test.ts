/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { ChatOpenAI } from '@langchain/openai';
import businessReportGenerator from '../../ai/tools/businessReportGenerator';
import { buildTool } from '../utils';

describe('business report generator tool', () => {
  it('should bind to langchain without schema serialization errors', () => {
    const model = new ChatOpenAI({
      apiKey: 'test',
      model: 'gpt-4o-mini',
    });

    expect(() => model.bindTools([buildTool(businessReportGenerator)])).not.toThrow();
  });

  it('should count charts from string payloads in invoke result', async () => {
    const result = await businessReportGenerator.invoke(
      null as any,
      {
        title: 'April report',
        markdown: '# Body',
        charts: '[{"title":"Orders","options":{"series":[]}}]',
      },
      null as any,
    );

    expect(JSON.parse(result.content)).toEqual({
      title: 'April report',
      chartCount: 1,
      fileName: null,
    });
  });
});
