import { expect, it } from 'vitest';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';

it.each([
  { name: 'en-US', load: () => import('../client/locales/en-US.js') },
  { name: 'zh-CN', load: () => import('../client/locales/zh-CN.js') },
  { name: 'zh-TW', load: () => import('../client/locales/zh-TW.js') },
  { name: 'ja-JP', load: () => import('../client/locales/ja-JP.js') },
  { name: 'es-ES', load: () => import('../client/locales/es-ES.js') },
  { name: 'pt-BR', load: () => import('../client/locales/pt-BR.js') },
  { name: 'fr-FR', load: () => import('../client/locales/fr-FR.js') },
  { name: 'de-DE', load: () => import('../client/locales/de-DE.js') },
  { name: 'vi-VN', load: () => import('../client/locales/vi-VN.js') },
  { name: 'id-ID', load: () => import('../client/locales/id-ID.js') },
])(
  'explains vector databases and configuration steps in both audiences ($name)',
  async ({ load }) => {
    const indexing = (await load()).default.indexing;
    const { agentPrompt, databases, setup } = indexing;
    for (const term of [
      'AGENTS.md',
      'type',
      'config.yaml',
      'config.yml',
      'knowledge.indexing',
      'sqlite-vec',
      'pgvector',
    ]) {
      expect(agentPrompt).toContain(term);
    }
    expect(agentPrompt.split('\n\n')).toHaveLength(5);
    expect(databases.sqlite.name).toContain('SQLite');
    expect(databases.sqlite.description).toContain('sqlite-vec');
    expect(databases.pgvector.name).toContain('PostgreSQL');
    expect(databases.pgvector.description).toContain('pgvector');
    expect(databases.pgvector.description).toContain('vector');
    expect(setup.instance).toContain('config.yaml');
    expect(setup.instance).toContain('knowledge.indexing');
    expect(setup.restart.length).toBeGreaterThan(10);
    expect(setup.enable.length).toBeGreaterThan(10);
  },
);

it('lets the user choose before editing and requires confirmation for restarts and paid operations', () => {
  const prompt = enUS.indexing.agentPrompt;
  expect(prompt).toContain(
    'Let me choose before continuing; do not decide for me',
  );
  expect(prompt).toContain(
    'Show the proposed configuration and get my confirmation before writing',
  );
  expect(prompt).toContain(
    'Get my confirmation before restarting or installing dependencies',
  );
  expect(prompt).toContain(
    'Ask for confirmation before calling paid models or rebuilding indexes',
  );
  expect(prompt).toContain('Do not show passwords or API keys');
});

it('matches the approved Chinese vector-database guidance and type-specific questions', () => {
  const indexing = zhCN.indexing;
  expect(indexing.emptyTitle).toBe('先配置向量数据库');
  expect(indexing.databases.sqlite.name).toBe('SQLite 向量数据库');
  expect(indexing.databases.pgvector.name).toBe('PostgreSQL 向量数据库');
  const prompt = indexing.agentPrompt;
  expect(prompt).toContain('知识库索引');
  expect(prompt).not.toContain('Knowledge');
  expect(prompt).toContain('让我选择后再继续，不要直接替我决定');
  expect(prompt).toContain('选择 SQLite 时，确认索引文件的保存位置');
  expect(prompt).toContain('选择 PostgreSQL 时，确认数据库连接信息');
  expect(prompt).toContain('征得我确认后，再写入应用 config.yaml');
  expect(prompt).toContain('不要在对话中展示密码或 API Key');
});
