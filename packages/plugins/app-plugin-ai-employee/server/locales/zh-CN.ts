import type { AIEmployeeServerResource } from './en-US.js';

const zhCN: AIEmployeeServerResource = {
  authorization: {
    section: 'AI',
    items: {
      employees: 'AI 员工',
      skills: '技能',
      tools: '工具',
      llmServices: 'LLM 服务',
      mcpServers: 'MCP 服务',
      usage: '用量统计',
      conversations: '会话',
    },
    actions: { read: '查看', manage: '管理' },
  },
};

export default zhCN;
