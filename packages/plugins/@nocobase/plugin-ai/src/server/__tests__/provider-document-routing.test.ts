/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { createMockPlugin, createTextStream } from './helpers/document-parser-mocks';
import { DashscopeProvider } from '../llm-providers/dashscope';
import { DeepSeekProvider } from '../llm-providers/deepseek';
import { KimiProvider } from '../llm-providers/kimi';
import { OpenAICompletionsProvider } from '../llm-providers/openai/completions';
import { GoogleGenAIProvider } from '../llm-providers/google-genai';
import { AnthropicProvider } from '../llm-providers/anthropic';

describe('Provider document routing', () => {
  const docAttachment = {
    id: 1,
    filename: 'contract.pdf',
    extname: '.pdf',
    mimetype: 'application/pdf',
    storageId: 1,
    meta: {},
  };

  let localFilePath: string;
  let localFilePathForProvider: string;

  beforeAll(async () => {
    localFilePath = path.join(os.tmpdir(), `provider-routing-${Date.now()}.txt`);
    await fs.writeFile(localFilePath, 'mock file content', 'utf-8');
    localFilePathForProvider = path.relative(process.cwd(), localFilePath);
  });

  afterAll(async () => {
    await fs.rm(localFilePath, { force: true });
  });

  it('routes dashscope/deepseek attachments to parsed document system messages', async () => {
    const parserLoad = vi.fn().mockResolvedValue({
      supported: true,
      text: 'parsed contract content',
      documents: [],
    });
    const { app } = createMockPlugin({ parserLoad, getFileURL: async () => localFilePathForProvider });

    const providers = [
      new DashscopeProvider({ app: app as any, serviceOptions: {} }),
      new DeepSeekProvider({ app: app as any, serviceOptions: {} }),
    ];

    for (const provider of providers) {
      const parsed = await provider.parseAttachment({} as any, docAttachment as any);
      expect(parsed.placement).toBe('system');
      expect(parsed.content).toContain('<parsed_document filename="contract.pdf">');
      expect(parsed.content).toContain('parsed contract content');
    }

    expect(parserLoad).toHaveBeenCalledTimes(2);
  });

  it('routes kimi attachments to parsed document system messages via cached json', async () => {
    const parsedFileId = 22;
    const cachedParsedFile = {
      id: parsedFileId,
      filename: 'parsed.json',
      extname: '.json',
      mimetype: 'application/json',
      storageId: 1,
    };
    const { app } = createMockPlugin({
      findById: async (id) => (id === parsedFileId ? cachedParsedFile : null),
      getFileStream: async () => ({
        stream: createTextStream(JSON.stringify({ text: 'parsed contract content from kimi cache' })),
        contentType: 'application/json',
      }),
    });

    const kimiProvider = new KimiProvider({ app: app as any, serviceOptions: { apiKey: 'test-key' } });
    const kimiAttachment = {
      ...docAttachment,
      meta: {
        documentParse: {
          status: 'ready',
          parserVersion: 'kimi-v1',
          parsedFileId,
          parsedFilename: 'parsed.json',
          parsedMimetype: 'application/json',
          updatedAt: new Date().toISOString(),
        },
      },
    };

    const parsed = await kimiProvider.parseAttachment({} as any, kimiAttachment as any);
    expect(parsed.placement).toBe('system');
    expect(parsed.content).toContain('<parsed_document filename="contract.pdf">');
    expect(parsed.content).toContain('parsed contract content from kimi cache');
  });

  it('keeps openai/google/anthropic file attachment behavior as base64-style blocks', async () => {
    const { app } = createMockPlugin({ getFileURL: async () => localFilePathForProvider });

    const openaiProvider = new OpenAICompletionsProvider({ app: app as any, serviceOptions: {} });
    const googleProvider = new GoogleGenAIProvider({ app: app as any, serviceOptions: {} });
    const anthropicProvider = new AnthropicProvider({ app: app as any, serviceOptions: {} });

    const openaiParsed = await openaiProvider.parseAttachment({} as any, docAttachment as any);
    const googleParsed = await googleProvider.parseAttachment({} as any, docAttachment as any);
    const anthropicParsed = await anthropicProvider.parseAttachment({} as any, docAttachment as any);

    expect(openaiParsed.placement).toBe('contentBlocks');
    expect(openaiParsed.content.type).toBe('file');
    expect(openaiParsed.content.data).toBeTruthy();

    expect(googleParsed.placement).toBe('contentBlocks');
    expect(googleParsed.content.type).toBe('application/pdf');
    expect(googleParsed.content.data).toBeTruthy();

    expect(anthropicParsed.placement).toBe('contentBlocks');
    expect(anthropicParsed.content.type).toBe('document');
    expect(anthropicParsed.content.source.type).toBe('base64');
    expect(anthropicParsed.content.source.data).toBeTruthy();
  });
});
