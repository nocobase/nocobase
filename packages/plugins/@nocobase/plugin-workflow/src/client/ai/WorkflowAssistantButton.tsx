/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Button, Tooltip } from 'antd';
import { css, cx } from '@nocobase/client';
import { useFlowContext } from '../FlowContext';
import { useWorkflowTranslation } from '../locale';

type UseAIEmployeesData = () => {
  aiEmployeesMap: Record<string, any>;
  loading?: boolean;
};

type UseChatBoxActions = () => {
  triggerTask: (payload: any) => Promise<void> | void;
};

type WorkflowAssistantDependencies = {
  useAIEmployeesData: UseAIEmployeesData;
  useChatBoxActions: UseChatBoxActions;
  avatars: (avatar: string, options?: { size?: number }) => string;
  icon: string;
  assistantUsername?: string;
  requiredSkills?: string[];
};

type WorkflowToolbarAddonRegistry = {
  registerToolbarAddon: (Component: React.ComponentType<any>) => void;
};

type ContextItem = {
  type: string;
  id: string;
  title?: string;
  content?: any;
};

const DEFAULT_REQUIRED_SKILLS = [
  'workflowDesigner-workflowUpsert',
  'workflowDesigner-workflowNodeUpsert',
  'searchDocs',
  'readDocEntry',
  'dataModeling-getCollectionNames',
  'dataModeling-getCollectionMetadata',
  'dataSource-dataSourceQuery',
  'dataSource-dataSourceCounting',
];

export const createWorkflowAssistantButton = ({
  useAIEmployeesData,
  useChatBoxActions,
  avatars,
  icon,
  assistantUsername = 'flowmind',
  requiredSkills = DEFAULT_REQUIRED_SKILLS,
}: WorkflowAssistantDependencies) => {
  const WorkflowAssistantButton: React.FC = () => {
    const { workflow, nodes = [] } = useFlowContext();
    const { t } = useWorkflowTranslation();
    const { aiEmployeesMap, loading } = useAIEmployeesData();
    const { triggerTask } = useChatBoxActions();
    const assistant = aiEmployeesMap?.[assistantUsername];
    const assistantAvatar = assistant?.avatar ? avatars(assistant.avatar, { size: 80 }) : icon;

    if (!assistant || !workflow?.id) {
      return null;
    }

    const openChatPanel = async () => {
      const workContext: ContextItem = {
        type: 'workflow',
        id: String(workflow.id),
        title: workflow.title,
        content: {
          workflow: {
            id: workflow.id,
            key: workflow.key,
            title: workflow.title,
            type: workflow.type,
            description: workflow.description,
            triggerTitle: workflow.triggerTitle,
            config: workflow.config,
            sync: workflow.sync,
            enabled: workflow.enabled,
          },
          nodes: nodes.map((node) => ({
            id: node.id,
            title: node.title,
            type: node.type,
            upstreamId: node.upstreamId,
            downstreamId: node.downstreamId,
            branchIndex: node.branchIndex,
            config: node.config,
          })),
        },
      };
      await triggerTask({
        aiEmployee: assistant,
        tasks: [
          {
            title: t('Workflow automation task'),
            message: {
              system: buildSystemMessage(workflow),
              workContext: [workContext],
              skillSettings: {
                skills: requiredSkills,
              },
            },
            autoSend: false,
          },
        ],
      });
    };

    return (
      <Tooltip title={t('Let Flowmind plan this workflow')}>
        <Button
          type="text"
          shape="circle"
          loading={loading}
          onClick={openChatPanel}
          aria-label="workflow-ai-assistant"
          icon={<Avatar src={assistantAvatar} size={28} shape="square" />}
          className={cx(css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            width: 36px;
            height: 36px;
          `)}
        />
      </Tooltip>
    );
  };

  WorkflowAssistantButton.displayName = 'WorkflowAssistantButton';
  return WorkflowAssistantButton;
};

export const registerWorkflowAssistantButton = ({
  workflow,
  ...deps
}: { workflow: WorkflowToolbarAddonRegistry } & WorkflowAssistantDependencies) => {
  if (!workflow) {
    return;
  }
  workflow.registerToolbarAddon(createWorkflowAssistantButton(deps));
};

function buildSystemMessage(workflow: any) {
  if (!workflow) {
    return 'You are editing a workflow inside NocoBase.';
  }
  return `You are editing workflow #${workflow.id} (${
    workflow.title || 'Untitled'
  }). Before creating or updating workflow data, consult docs with docs-searchDocs/docs-readDocEntry, then use workflowDesigner-workflowUpsert and workflowDesigner-workflowNodeUpsert to apply changes safely. Always explain the resulting trigger, main path, and each branch.`;
}
