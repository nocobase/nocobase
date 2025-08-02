/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Spin, Popover, Card, Tag, Tooltip } from 'antd';
import { FlowModel, defineFlow, escapeT, useFlowEngine, useFlowSettingsContext } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, Task, TriggerTaskOptions, ContextItem as ContextItemType } from '../../types';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import { ProfileCard } from '../../ProfileCard';
import { useToken } from '@nocobase/client';
import { useAIEmployeesData } from '../../hooks/useAIEmployeesData';
import { useT } from '../../../locale';
import { AddContextButton } from '../../AddContextButton';
import { useField } from '@formily/react';
import { ArrayField } from '@formily/core';
import { ContextItem } from '../../chatbox/ContextItem';
import { aiSelection } from '../../stores/ai-selection';
import { AIEmployeeShortcutListModel } from './AIEmployeeShortcutListModel';

const { Meta } = Card;

type ShortcutProps = TriggerTaskOptions & {
  builtIn?: boolean;
  showNotice?: boolean;
};

const Shortcut: React.FC<ShortcutProps> = ({ aiEmployee: { username }, tasks, showNotice, builtIn }) => {
  const [focus, setFocus] = useState(false);

  const { loading, aiEmployeesMap } = useAIEmployeesData();
  const aiEmployee = aiEmployeesMap[username];

  const { triggerTask } = useChatBoxActions();

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return null;
    }
    if (focus || showNotice) {
      return avatars(avatar, {
        gesture: ['waveLongArm'],
        gestureProbability: 100,
        translateX: -15,
      });
    }
    return avatars(avatar);
  }, [aiEmployee, focus, showNotice]);

  return (
    <Spin spinning={loading}>
      <Popover content={<ProfileCard aiEmployee={aiEmployee} tasks={tasks} />}>
        <Avatar
          src={currentAvatar}
          size={52}
          shape="square"
          style={{
            cursor: 'pointer',
          }}
          // @ts-ignore
          onMouseEnter={() => {
            setFocus(true);
          }}
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
  public declare props: ShortcutProps;

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

const WorkContext: React.FC = () => {
  const field = useField<ArrayField>();
  const onAdd = (contextItem: ContextItemType) => {
    const exists = field.value.some((item) => item.type === contextItem.type && item.uid === contextItem.uid);
    if (!exists) {
      field.value = [...field.value, contextItem];
    }
  };
  const onRemove = (type: string, uid: string) => {
    field.value = field.value.filter((item) => !(item.type === type && item.uid === uid));
  };
  return (
    <>
      <div>
        {field.value.map((item) => (
          <ContextItem key={`${item.type}:${item.uid}`} item={item} closable={true} onRemove={onRemove} />
        ))}
      </div>
      <AddContextButton onAdd={onAdd} />
    </>
  );
};

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  title: escapeT('Task settings'),
  steps: {
    editTasks: {
      title: escapeT('Edit tasks'),
      uiMode(ctx) {
        return {
          type: 'dialog',
          props: {
            styles: {
              mask: { zIndex: aiSelection.selectable ? -1 : 311 },
              wrapper: { zIndex: aiSelection.selectable ? -1 : 311 },
            },
          },
        };
      },
      uiSchema: async (ctx) => {
        const { aiEmployeesMap } = await ctx.aiEmployeesData;
        return {
          profile: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': () => <Information aiEmployeesMap={aiEmployeesMap} />,
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
                      'x-component': WorkContext,
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
