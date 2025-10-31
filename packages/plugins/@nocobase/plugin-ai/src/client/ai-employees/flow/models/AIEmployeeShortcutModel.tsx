/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Spin, Popover, Card, Tag } from 'antd';
import { FlowModel, escapeT, useFlowSettingsContext } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, TriggerTaskOptions, ContextItem as ContextItemType } from '../../types';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import { ProfileCard } from '../../ProfileCard';
import { RemoteSelect, TextAreaWithContextSelector, useToken } from '@nocobase/client';
import { useAIEmployeesData } from '../../hooks/useAIEmployeesData';
import { AddContextButton } from '../../AddContextButton';
import { useField } from '@formily/react';
import { ArrayField, ObjectField } from '@formily/core';
import { ContextItem } from '../../chatbox/ContextItem';
import { dialogController } from '../../stores/dialog-controller';
import { namespace } from '../../../locale';
import { ContextItem as WorkContextItem } from '../../types';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { useChatConversationOptions } from '../../chatbox/hooks/useChatConversationOptions';

const { Meta } = Card;

type ShortcutProps = TriggerTaskOptions & {
  builtIn?: boolean;
  showNotice?: boolean;
  style: {
    size?: number;
    mask?: boolean;
  };
  context: ShortcutContext;
  auto?: boolean;
};

type ShortcutContext = {
  workContext?: WorkContextItem[];
};

const Shortcut: React.FC<ShortcutProps> = ({
  aiEmployee: { username },
  tasks,
  showNotice,
  builtIn,
  style = {},
  context,
  auto,
}) => {
  const { size, mask } = style;
  const [focus, setFocus] = useState(false);

  const { loading, aiEmployeesMap } = useAIEmployeesData();
  const aiEmployee = aiEmployeesMap[username];

  const { triggerTask } = useChatBoxActions();
  const addContextItems = useChatMessagesStore.use.addContextItems();

  const { resetDefaultWebSearch } = useChatConversationOptions();

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return null;
    }
    if (focus || showNotice) {
      return avatars(avatar, {
        mask: undefined,
        flip: true,
      });
    }
    return avatars(avatar, {
      mouth: undefined,
      mask: mask !== false ? ['dark'] : undefined,
    });
  }, [aiEmployee, focus, showNotice, mask]);

  if (!aiEmployee) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <Popover content={<ProfileCard aiEmployee={aiEmployee} tasks={tasks} />}>
        <Avatar
          src={currentAvatar}
          size={size || 52}
          shape="circle"
          style={{
            cursor: 'pointer',
          }}
          // @ts-ignore
          onMouseEnter={() => {
            setFocus(true);
          }}
          onMouseLeave={() => setFocus(false)}
          onClick={() => {
            resetDefaultWebSearch();
            triggerTask({ aiEmployee, tasks, auto });
            if (context?.workContext?.length) {
              addContextItems(context.workContext);
            }
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
          <ContextItem within="task" key={`${item.type}:${item.uid}`} item={item} closable={true} onRemove={onRemove} />
        ))}
      </div>
      <AddContextButton contextItems={field.value} onAdd={onAdd} onRemove={onRemove} />
    </>
  );
};

const SkillSettings: React.FC<{
  aiEmployeesMap: {
    [username: string]: AIEmployee;
  };
}> = ({ aiEmployeesMap = {} }) => {
  const field = useField<ObjectField>();
  const ctx = useFlowSettingsContext();
  const username = ctx.model.props.aiEmployee?.username;
  const aiEmployee = aiEmployeesMap[username];
  const defaultSkills = aiEmployee?.skillSettings?.skills?.map(({ name }) => name) ?? [];

  if (field.value?.skills?.length) {
    field.addProperty(
      'skills',
      field.value.skills.filter((skill) => defaultSkills.includes(skill)),
    );
  }
  const handleChange = (value: string[]) => {
    field.addProperty('skills', value);
  };

  return (
    <RemoteSelect
      defaultValue={field.value?.skills ?? defaultSkills}
      onChange={handleChange}
      manual={false}
      multiple={true}
      fieldNames={{
        label: 'title',
        value: 'name',
      }}
      service={{
        resource: 'aiTools',
        action: 'listBinding',
        params: {
          username,
        },
      }}
    />
  );
};

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  title: escapeT('Task settings', { ns: namespace }),
  steps: {
    editTasks: {
      title: escapeT('Edit tasks', { ns: namespace }),
      uiMode(ctx) {
        return {
          type: 'dialog',
          props: {
            styles: {
              mask: { zIndex: dialogController.shouldHide ? -1 : 9999 },
              wrapper: { zIndex: dialogController.shouldHide ? -1 : 9999 },
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
            title: escapeT('Task', { ns: namespace }),
            'x-component': 'ArrayTabs',
            'x-component-props': {
              size: 'small',
            },
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  title: escapeT('Title', { ns: namespace }),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-decorator-props': {
                    tooltip: escapeT('Label for task selection buttons when multiple tasks exist', { ns: namespace }),
                  },
                },
                message: {
                  type: 'object',
                  properties: {
                    system: {
                      title: escapeT('Background', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        tooltip: escapeT(
                          'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                          { ns: namespace },
                        ),
                      },
                      'x-component': TextAreaWithContextSelector,
                    },
                    user: {
                      title: escapeT('Default user message', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': TextAreaWithContextSelector,
                    },
                    workContext: {
                      title: escapeT('Work context', { ns: namespace }),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': WorkContext,
                    },
                    skillSettings: {
                      title: escapeT('Skills', { ns: namespace }),
                      type: 'object',
                      nullable: true,
                      'x-decorator': 'FormItem',
                      'x-component': () => <SkillSettings aiEmployeesMap={aiEmployeesMap} />,
                    },
                  },
                },
                autoSend: {
                  type: 'boolean',
                  'x-content': escapeT('Send default user message automatically', { ns: namespace }),
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
