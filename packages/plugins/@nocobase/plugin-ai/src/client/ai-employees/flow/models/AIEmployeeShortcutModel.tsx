/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Button, Spin, Popover, Card, Tag } from 'antd';
import { FlowModel, defineFlow, escapeT, useFlowEngine, useFlowSettingsContext } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, Task, TriggerTaskOptions } from '../../types';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import { ProfileCard } from '../../ProfileCard';
import { useToken } from '@nocobase/client';
import { useAIEmployeesData } from '../../useAIEmployeesData';
const { Meta } = Card;

const Shortcut: React.FC<TriggerTaskOptions> = ({ aiEmployee: { username }, tasks }) => {
  const [focus, setFocus] = useState(false);

  const { loading, aiEmployeesMap } = useAIEmployeesData();
  const aiEmployee = aiEmployeesMap[username];

  const { triggerTask } = useChatBoxActions();

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return null;
    }
    if (focus) {
      return avatars(avatar, {
        gesture: ['waveLongArm'],
        gestureProbability: 100,
        translateX: -15,
      });
    }
    return avatars(avatar);
  }, [aiEmployee, focus]);

  return (
    <Spin spinning={loading}>
      <Popover content={<ProfileCard aiEmployee={aiEmployee} />} placement="topLeft">
        <Avatar
          src={currentAvatar}
          size={52}
          shape="square"
          style={{
            cursor: 'pointer',
          }}
          // @ts-ignore
          onMouseEnter={() => setFocus(true)}
          onMouseLeave={() => setFocus(false)}
          onClick={() => {
            triggerTask({ aiEmployee, tasks });
          }}
        />
      </Popover>
    </Spin>
  );
};

export class AIEmployeeShortcutModel extends FlowModel {
  public declare props: TriggerTaskOptions & {
    builtIn?: boolean;
  };

  render() {
    return <Shortcut {...this.props} />;
  }
}

const Information: React.FC<{
  aiEmployeesMap: {
    [username: string]: AIEmployee;
  };
}> = ({ aiEmployeesMap = {} }) => {
  const { token } = useToken();
  const ctx = useFlowSettingsContext();
  const username = ctx.model.props.aiEmployee?.username;
  const aiEmployee = aiEmployeesMap[username];

  if (!aiEmployee) {
    return null;
  }

  return (
    <Card
      variant="borderless"
      style={{
        maxWidth: 520,
      }}
    >
      <Meta
        avatar={aiEmployee.avatar ? <Avatar src={avatars(aiEmployee.avatar)} size={48} /> : null}
        title={
          <>
            {aiEmployee.nickname}
            {aiEmployee.position && (
              <Tag
                style={{
                  marginLeft: token.margin,
                }}
              >
                {aiEmployee.position}
              </Tag>
            )}
          </>
        }
        description={<>{aiEmployee.bio}</>}
      />
    </Card>
  );
};

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  title: escapeT('Task settings'),
  steps: {
    editTasks: {
      title: escapeT('Edit tasks'),
      uiSchema: async (ctx) => {
        const { aiEmployeesMap } = await ctx.aiEmployeesData;
        return {
          profile: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': () => <Information aiEmployeesMap={aiEmployeesMap} />,
          },
          taskDesc: {
            type: 'string',
            title: escapeT('Task description'),
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: escapeT(
                'Displays the AI employee’s assigned tasks on the profile when hovering over the button.',
              ),
            },
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: {
                minRows: 2,
              },
            },
          },
          tasks: {
            type: 'array',
            title: escapeT('Task'),
            'x-component': 'ArrayTabs',
            'x-component-props': {
              size: 'small',
            },
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  title: escapeT('Title'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-decorator-props': {
                    tooltip: escapeT('Label for task selection buttons when multiple tasks exist'),
                  },
                },
                message: {
                  type: 'object',
                  properties: {
                    system: {
                      title: escapeT('Background'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        tooltip: escapeT(
                          'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                        ),
                      },
                      'x-component': 'Input.TextArea',
                    },
                    user: {
                      title: escapeT('Default user message'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                    },
                    workContext: {
                      title: escapeT('Work context'),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkContext',
                    },
                  },
                },
                autoSend: {
                  type: 'boolean',
                  'x-content': escapeT('Send default user message automatically'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                },
              },
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          tasks: params.tasks,
        });
      },
    },
  },
});
