import type { AppClientSettingsRouteGroupDefinition } from '@nocobase/app-client/plugins';
import {
  Bot,
  BrainCircuit,
  ContactRound,
  MessagesSquare,
  Plug,
  Sparkles,
  Wrench,
} from 'lucide-react';

export function createAISettings(): AppClientSettingsRouteGroupDefinition {
  return {
    name: 'aiGroup',
    navigation: { title: 'AI', icon: Bot },
    children: [
      {
        name: 'ai',
        path: '/ai',
        navigation: { title: 'AI Employees', icon: ContactRound },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/settings-page.js'),
        children: [
          {
            name: 'aiEmployeeProfile',
            path: 'employees/:username/profile',
            componentLoader: () => import('./pages/employees/profile.js'),
          },
          {
            name: 'aiEmployeeRole',
            path: 'employees/:username/role',
            componentLoader: () => import('./pages/employees/role.js'),
          },
          {
            name: 'aiEmployeeModels',
            path: 'employees/:username/models',
            componentLoader: () => import('./pages/employees/models.js'),
          },
          {
            name: 'aiEmployeeSkills',
            path: 'employees/:username/skills',
            componentLoader: () => import('./pages/employees/skills.js'),
          },
          {
            name: 'aiEmployeeTools',
            path: 'employees/:username/tools',
            componentLoader: () => import('./pages/employees/tools.js'),
          },
          {
            name: 'aiEmployeeKnowledge',
            path: 'employees/:username/knowledge',
            componentLoader: () => import('./pages/employees/knowledge.js'),
          },
          {
            name: 'aiEmployeeUnknownTab',
            path: 'employees/:username/:tab',
            componentLoader: () => import('./pages/employees/not-found.js'),
          },
        ],
      },
      {
        name: 'aiSkills',
        path: '/ai/skills',
        navigation: { title: 'Skills', icon: Sparkles },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/skills-settings-page.js'),
        children: [
          {
            name: 'aiSkillDetails',
            path: ':skillName',
            componentLoader: () => import('./pages/skills/detail.js'),
            children: [
              {
                name: 'aiSkillInstructions',
                path: 'instructions',
                componentLoader: () => import('./pages/skills/instructions.js'),
              },
              {
                name: 'aiSkillTools',
                path: 'tools',
                componentLoader: () => import('./pages/skills/tools.js'),
              },
            ],
          },
        ],
      },
      {
        name: 'aiTools',
        path: '/ai/tools',
        navigation: { title: 'tools.title', icon: Wrench },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/tools-settings-page.js'),
        children: [
          {
            name: 'aiToolDetails',
            path: ':toolName',
            componentLoader: () => import('./pages/tools/detail.js'),
          },
        ],
      },
      {
        name: 'aiLLMServices',
        path: '/ai/llm-services',
        navigation: { title: 'LLM services', icon: BrainCircuit },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/llm-service-settings-page.js'),
        children: [
          {
            name: 'aiLLMServiceModels',
            path: ':serviceName/models',
            componentLoader: () => import('./pages/llm-services/models.js'),
          },
        ],
      },
      {
        name: 'aiMCPServices',
        path: '/ai/mcp-services',
        navigation: { title: 'MCP services', icon: Plug },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/mcp-service-settings-page.js'),
        children: [
          {
            name: 'aiMCPServiceTools',
            path: ':serverName/tools',
            componentLoader: () => import('./pages/mcp-services/tools.js'),
          },
        ],
      },
      {
        name: 'aiConversations',
        path: '/ai/conversations',
        navigation: { title: 'Conversations', icon: MessagesSquare },
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/conversations-settings-page.js'),
        children: [
          {
            name: 'aiConversationDetails',
            path: ':sessionId',
            componentLoader: () => import('./pages/conversations/detail.js'),
          },
        ],
      },
      {
        name: 'aiSettings',
        path: '/ai/settings',
        authz: {
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        },
        componentLoader: () => import('./pages/service-settings-page.js'),
      },
    ],
  };
}
