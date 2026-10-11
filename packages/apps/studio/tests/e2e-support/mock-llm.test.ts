import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { intakeMessage } from '../../server/agents/conversation/intake.ts';
import {
  EMBEDDING_DIMENSIONS,
  MOCK_EMBEDDING_MODEL,
  MOCK_RERANK_MODEL,
  decide,
  embed,
  similarity,
  startMockLlm,
  type MockLlm,
} from '../../e2e/support/mock-llm.ts';

describe('the mock model server', () => {
  let mock: MockLlm;
  beforeAll(async () => {
    mock = await startMockLlm(0, 0);
  });
  afterAll(async () => {
    await mock.close();
  });

  const post = async (path: string, payload: unknown) => {
    const response = await fetch(`${mock.url}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as Record<string, unknown>;
  };

  it('proposes an intake request as a plan, the first line the parent of the rest', () => {
    const answer = decide({
      tools: [{ function: { name: 'bash' } }],
      messages: [
        {
          role: 'user',
          content: intakeMessage({
            text: '# 导出改进\n- 导出 CSV\n- 导出 Excel',
          }),
        },
      ],
    });
    expect(answer.kind).toBe('call');
    const command =
      answer.kind === 'call'
        ? (answer.args as { command: string }).command
        : '';
    expect(command).toContain('nb-studio plan create --file');
    const plan = JSON.parse(command.split('\n')[1] ?? '') as {
      rows: { op: string; ref?: string; params: Record<string, unknown> }[];
    };
    expect(plan.rows).toEqual([
      { op: 'issue.create', ref: 'parent', params: { title: '导出改进' } },
      {
        op: 'issue.create',
        params: { title: '导出 CSV', parentIssueId: { ref: 'parent' } },
      },
      {
        op: 'issue.create',
        params: { title: '导出 Excel', parentIssueId: { ref: 'parent' } },
      },
    ]);
  });

  it('searches the knowledge base by the first knowledge word of a question, in English too', () => {
    const search = (question: string) => {
      const answer = decide({
        tools: [{ function: { name: 'bash' } }],
        messages: [{ role: 'user', content: question }],
      });
      return answer.kind === 'call'
        ? (answer.args as { command: string }).command
        : '';
    };
    expect(search('我们的发布流程是什么？')).toBe(
      "nb-studio kb search '发布' --json",
    );
    expect(search('What is our Release process?')).toBe(
      "nb-studio kb search 'release' --json",
    );
  });

  it('embeds deterministically, so similar texts score closer', () => {
    const release = embed('发布流程需要评审');
    expect(release).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(Math.hypot(...release)).toBeCloseTo(1);
    expect(embed('发布流程需要评审')).toEqual(release);
    expect(similarity(release, embed('发布流程'))).toBeGreaterThan(
      similarity(release, embed('前端组件规范')),
    );
  });

  it('lists the embedding and rerank models', async () => {
    const response = await fetch(`${mock.url}/models`);
    const { data } = (await response.json()) as { data: { id: string }[] };
    expect(data.map((model) => model.id)).toEqual(
      expect.arrayContaining([MOCK_EMBEDDING_MODEL, MOCK_RERANK_MODEL]),
    );
  });

  it('answers /embeddings for one text or many, at the asked dimensions', async () => {
    const many = await post('/embeddings', {
      model: MOCK_EMBEDDING_MODEL,
      input: ['release process', 'component guide'],
      dimensions: 64,
    });
    const data = many.data as { index: number; embedding: number[] }[];
    expect(data.map((item) => item.index)).toEqual([0, 1]);
    expect(data[0]?.embedding).toHaveLength(64);
    expect(many.usage).toMatchObject({ prompt_tokens: expect.any(Number) });

    const one = await post('/embeddings', { input: 'release process' });
    expect((one.data as { embedding: number[] }[])[0]?.embedding).toHaveLength(
      EMBEDDING_DIMENSIONS,
    );
  });

  it('reranks documents by similarity to the query', async () => {
    const answer = await post('/rerank', {
      model: MOCK_RERANK_MODEL,
      query: '发布流程',
      documents: ['前端组件规范', '发布流程与评审', '提交规范'],
      top_n: 2,
    });
    const results = answer.results as { index: number }[];
    expect(results).toHaveLength(2);
    expect(results[0]?.index).toBe(1);
  });
});
