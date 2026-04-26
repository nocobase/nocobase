/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Spin, Popover, Card, Tag, Select, Switch, Alert, Typography, Input } from 'antd';
import { FlowModel, tExpr, useFlowSettingsContext, observer, useFlowContext } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, TriggerTaskOptions, ContextItem as ContextItemType } from '../../types';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import { useChatMessageActions } from '../../chatbox/hooks/useChatMessageActions';
import { ProfileCard } from '../../ProfileCard';
import { RemoteSelect, TextAreaWithContextSelector, useCompile, useRequest, useToken } from '@nocobase/client';
import { AddContextButton } from '../../AddContextButton';
import { Schema, useField } from '@formily/react';
import { ArrayField, ObjectField, Field } from '@formily/core';
import { ContextItem } from '../../chatbox/ContextItem';
import { dialogController } from '../../stores/dialog-controller';
import { namespace } from '../../../locale';
import { ContextItem as WorkContextItem } from '../../types';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { useLLMServiceCatalog } from '../../../llm-services/hooks/useLLMServiceCatalog';
import { useLLMProviders } from '../../../llm-services/llm-providers';
import { useT } from '../../../locale';
import { buildProviderGroupedModelOptions, getServiceByOverride } from '../../../llm-services/utils';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { Skills, Tools } from '../../../components/skill-settings';
import _ from 'lodash';

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
  const aiConfigRepository = useAIConfigRepository();
  const { loading } = useRequest<AIEmployee[]>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const aiEmployeesMap = aiConfigRepository.getAIEmployeesMap();
  const aiEmployee = aiEmployeesMap[username];

  const { triggerTask } = useChatBoxActions();
  const addContextItems = useChatMessagesStore.use.addContextItems();
  const { syncContextAttachments } = useChatMessageActions();

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
            triggerTask({ aiEmployee, tasks, auto });
            if (context?.workContext?.length) {
              addContextItems(context.workContext);
              syncContextAttachments(context.workContext);
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

const TaskModelSelect: React.FC = observer(() => {
  const t = useT();
  const field = useField<ObjectField>();
  const { services, loading } = useLLMServiceCatalog();
  const providers = useLLMProviders();
  const options = useMemo(
    () => buildProviderGroupedModelOptions(services, providers, (label) => Schema.compile(label, { t })),
    [services, providers, t],
  );

  const selectedValue =
    field.value?.llmService && field.value?.model ? `${field.value.llmService}:${field.value.model}` : undefined;

  const handleChange = (value?: string) => {
    if (!value) {
      field.value = null;
      return;
    }
    const [llmService, model] = value.split(':');
    field.value = { llmService, model };
  };

  return (
    <Select
      allowClear={true}
      showSearch={true}
      value={selectedValue}
      placeholder={t('Use default model')}
      options={options}
      onChange={handleChange}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : null}
      optionFilterProp="label"
    />
  );
});

const TaskWebSearchSwitch: React.FC = observer(() => {
  const t = useT();
  const field = useField<Field>();
  const modelField = field.query('.model').take() as Field;
  const { services } = useLLMServiceCatalog();

  const selectedService = useMemo(
    () => getServiceByOverride(services, modelField?.value),
    [modelField?.value, services],
  );

  const supportWebSearch = selectedService?.supportWebSearch;
  const isDisabled = !!modelField?.value && supportWebSearch === false;

  useEffect(() => {
    if (isDisabled && field.value) {
      field.value = false;
    }
  }, [isDisabled, field]);

  return (
    <div>
      <Switch checked={!!field.value} disabled={isDisabled} onChange={(checked) => (field.value = checked)} />
      {isDisabled && <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>{t('Web search not supported')}</div>}
    </div>
  );
});

const SkillsWrapper: React.FC<any> = (props) => {
  const ctx = useFlowContext();
  const field = useField<ArrayField>();
  const skillsSettingField = field.parent as ObjectField;
  const taskField = skillsSettingField?.parent as ObjectField;
  const taskIndex = taskField?.index ?? -1;
  const tasks = ctx.model?.props?.tasks ?? [];
  const task = taskIndex >= 0 ? tasks[taskIndex] ?? {} : {};
  const initials = task.skillSettings?.skills;

  useEffect(() => {
    if (initials == null) {
      field.setValue(undefined);
    }
  }, [field, initials]);

  return <Skills {...props} initials={initials} />;
};

const ToolsWrapper: React.FC<any> = (props) => {
  const ctx = useFlowContext();
  const field = useField<ArrayField>();
  const skillsSettingField = field.parent as ObjectField;
  const taskField = skillsSettingField?.parent as ObjectField;
  const taskIndex = taskField?.index ?? -1;
  const tasks = ctx.model?.props?.tasks ?? [];
  const task = taskIndex >= 0 ? tasks[taskIndex] ?? {} : {};
  const initials = task.skillSettings?.tools;

  useEffect(() => {
    if (initials == null) {
      field.setValue(undefined);
    }
  }, [field, initials]);

  return <Tools {...props} initials={initials} />;
};

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  title: tExpr('Task settings', { ns: namespace }),
  steps: {
    migration: {
      handler: async (ctx) => {
        console.log('cgyrock', 'migration', ctx.model?.stepParams?.shortcutSettings?.editTasks);
        for (const task of ctx.model?.stepParams?.shortcutSettings?.editTasks?.tasks ?? []) {
          const { skillsVersion, toolsVersion, skills, tools } = task.skillSettings;
          if (skillsVersion == null) {
            if (_.isArray(skills) && skills.length === 0) {
              task.skillSettings.skills = undefined;
            }
            task.skillSettings.skillsVersion = 2;
          }
          if (toolsVersion == null) {
            if (_.isArray(tools) && tools.length === 0) {
              task.skillSettings.tools = undefined;
            }
            task.skillSettings.toolsVersion = 2;
          }
        }
      },
    },
    editTasks: {
      title: tExpr('Edit tasks', { ns: namespace }),
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
        await ctx.aiConfigRepository.getAIEmployees();
        const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
        const username = ctx.model.props?.aiEmployee?.username ?? '';
        const defaultSkills: string[] =
          aiEmployeesMap[username]?.skillSettings?.skills?.map((name: string) => name) ?? [];
        const defaultTools: string[] =
          aiEmployeesMap[username]?.skillSettings?.tools?.map(({ name }: { name: string }) => name) ?? [];
        return {
          profile: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': () => <Information aiEmployeesMap={aiEmployeesMap} />,
          },
          tasks: {
            type: 'array',
            title: tExpr('Task', { ns: namespace }),
            'x-component': 'ArrayTabs',
            'x-component-props': {
              size: 'small',
            },
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  title: tExpr('Title', { ns: namespace }),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-decorator-props': {
                    tooltip: tExpr('Label for task selection buttons when multiple tasks exist', { ns: namespace }),
                  },
                },
                message: {
                  type: 'object',
                  properties: {
                    system: {
                      title: tExpr('Background', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        tooltip: tExpr(
                          'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                          { ns: namespace },
                        ),
                      },
                      'x-component': TextAreaWithContextSelector,
                    },
                    user: {
                      title: tExpr('Default user message', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': TextAreaWithContextSelector,
                    },
                    workContext: {
                      title: tExpr('Work context', { ns: namespace }),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': WorkContext,
                    },
                  },
                },
                autoSend: {
                  type: 'boolean',
                  'x-content': tExpr('Send default user message automatically', { ns: namespace }),
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                },
                skillSettings: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    toolsVersion: {
                      type: 'number',
                      'x-hidden': true,
                    },
                    skillsVersion: {
                      type: 'number',
                      'x-hidden': true,
                    },
                    skills: {
                      title: tExpr('Skills', { ns: namespace }),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': SkillsWrapper,
                      'x-component-props': {
                        username,
                        defaultSkills,
                      },
                      'x-decorator-props': {
                        layout: 'horizontal',
                        tooltip: tExpr('Configure the skills available to this task', {
                          ns: namespace,
                        }),
                      },
                    },
                    tools: {
                      title: tExpr('Tools', { ns: namespace }),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': ToolsWrapper,
                      'x-component-props': {
                        username,
                        defaultTools,
                      },
                      'x-decorator-props': {
                        layout: 'horizontal',
                        tooltip: tExpr('Configure the tools available to this task', {
                          ns: namespace,
                        }),
                      },
                    },
                  },
                },
                model: {
                  title: tExpr('Model', { ns: namespace }),
                  type: 'object',
                  nullable: true,
                  'x-decorator': 'FormItem',
                  'x-component': TaskModelSelect,
                },
                webSearch: {
                  title: tExpr('Web search', { ns: namespace }),
                  type: 'boolean',
                  default: false,
                  'x-decorator': 'FormItem',
                  'x-component': TaskWebSearchSwitch,
                },
              },
            },
          },
        };
      },
      beforeParamsSave(_ctx, params) {
        for (const task of params.tasks ?? []) {
          if (task.skillSettings) {
            const { skillsVersion, toolsVersion } = task.skillSettings;
            if (skillsVersion == null) {
              task.skillSettings.skillsVersion = 2;
            }
            if (toolsVersion == null) {
              task.skillSettings.toolsVersion = 2;
            }
          }
        }
      },
      handler(ctx, params) {
        ctx.model.setProps({
          tasks: params.tasks,
        });
      },
    },
  },
});
