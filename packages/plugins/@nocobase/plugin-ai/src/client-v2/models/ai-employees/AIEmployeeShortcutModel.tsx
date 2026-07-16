/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Avatar, Card, Radio, Select, Space, Spin, Switch, Tag, Tooltip, Typography, theme } from 'antd';
import type { RadioGroupProps } from 'antd';
import { FlowModel, observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import type { FlowModelContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { AIEmployeeShortcut } from '../../ai-employees/AIEmployeeShortcut';
import { AddContextButton } from '../../ai-employees/AddContextButton';
import { ContextItem as WorkContextItem } from '../../ai-employees/chatbox/components/ContextItem';
import { getGlobalChatBoxRuntime } from '../../ai-employees/chatbox/stores/runtime';
import { avatars } from '../../ai-employees/avatars';
import { getAIEmployeeModels, getAllModels } from '../../ai-employees/chatbox/model';
import { dialogController } from '../../ai-employees/stores/dialog-controller';
import type { AIEmployee, ContextItem, SkillSettings, Task } from '../../ai-employees/types';
import { useT, tExpr } from '../../locale';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import type { LLMServiceItem } from '../../repositories/AIConfigRepository';
import { RemoteSelect } from '../../components/RemoteSelect';

const { Meta } = Card;

type ShortcutStyle = {
  size?: number;
  mask?: boolean;
};

export type AIEmployeeShortcutModelProps = {
  aiEmployee: Pick<AIEmployee, 'username'> & Partial<AIEmployee>;
  tasks?: Task[];
  showNotice?: boolean;
  builtIn?: boolean;
  style?: ShortcutStyle;
  context?: {
    workContext?: ContextItem[];
  };
  auto?: boolean;
};

export class AIEmployeeShortcutModel extends FlowModel {
  declare props: AIEmployeeShortcutModelProps;

  render() {
    const { style, ...props } = this.props;
    return <AIEmployeeShortcut {...props} runtime={getGlobalChatBoxRuntime()} size={style?.size} mask={style?.mask} />;
  }
}

export class AIEmployeeButtonModel extends AIEmployeeShortcutModel {
  render() {
    const { style, ...props } = this.props;
    return (
      <AIEmployeeShortcut
        {...props}
        runtime={getGlobalChatBoxRuntime()}
        size={style?.size ?? 40}
        mask={style?.mask ?? false}
      />
    );
  }
}

type ShortcutTask = Task & {
  skillSettings?: SkillSettings;
};

type ShortcutSettingsParams = {
  tasks?: ShortcutTask[];
};

type AIShortcutFlowContext = FlowModelContext & {
  aiConfigRepository?: {
    getAIEmployees: () => Promise<AIEmployee[]>;
    getAIEmployeesMap: () => Record<string, AIEmployee>;
  };
};

type BindingOption = {
  name: string;
  title?: string;
  description?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isBindingOption = (value: unknown): value is BindingOption => isRecord(value) && typeof value.name === 'string';

const getSelectedModelValue = (value?: Task['model']) =>
  value?.llmService && value?.model ? `${value.llmService}:${value.model}` : undefined;

const getServiceByOverride = (services: LLMServiceItem[], override?: Task['model']) => {
  if (!override?.llmService) {
    return undefined;
  }
  return services.find((service) => service.llmService === override.llmService);
};

export const normalizeShortcutTaskSkillSettings = (
  task: ShortcutTask,
  options?: { dropEmptyLegacyArrays?: boolean },
) => {
  const { skillsVersion, toolsVersion, skills, tools } = task.skillSettings ?? {};

  if (skillsVersion == null) {
    if (options?.dropEmptyLegacyArrays && Array.isArray(skills) && skills.length === 0 && task.skillSettings) {
      task.skillSettings.skills = undefined;
    }
    task.skillSettings = {
      ...task.skillSettings,
      skillsVersion: 2,
    };
  }

  if (toolsVersion == null) {
    if (options?.dropEmptyLegacyArrays && Array.isArray(tools) && tools.length === 0 && task.skillSettings) {
      task.skillSettings.tools = undefined;
    }
    task.skillSettings = {
      ...task.skillSettings,
      toolsVersion: 2,
    };
  }
};

export const normalizeShortcutTasksSkillSettings = (
  tasks: ShortcutTask[] | undefined,
  options?: { dropEmptyLegacyArrays?: boolean; onlyExistingSettings?: boolean },
) => {
  for (const task of tasks ?? []) {
    if (options?.onlyExistingSettings && !task.skillSettings) {
      continue;
    }
    normalizeShortcutTaskSkillSettings(task, options);
  }
};

const cleanupEmptyShortcutTaskSkillSettings = (tasks: ShortcutTask[] | undefined) => {
  for (const task of tasks ?? []) {
    const settings = task.skillSettings;
    if (!settings) {
      continue;
    }
    if (settings.skills == null && settings.tools == null) {
      task.skillSettings = undefined;
    }
  }
};

const useLLMServices = () => {
  const repo = useAIConfigRepository();
  const { loading } = useRequest(() => repo.getLLMServices(), {
    refreshDeps: [repo],
  });

  return {
    services: repo.llmServices,
    loading: loading || repo.llmServicesLoading,
  };
};

const useCurrentAIEmployee = () => {
  const ctx = useFlowSettingsContext<AIEmployeeShortcutModel>();
  const repo = useAIConfigRepository();
  const username = ctx.model.props?.aiEmployee?.username ?? '';
  return repo.getAIEmployeesMap()[username];
};

const Information: React.FC = observer(() => {
  const aiEmployee = useCurrentAIEmployee();
  const { token } = theme.useToken();
  const avatarSize = token.controlHeight + token.margin + token.marginSM + token.marginXXS;

  if (!aiEmployee) {
    return null;
  }

  return (
    <Card
      variant="borderless"
      style={{
        maxWidth: token.screenSMMin,
      }}
    >
      <Meta
        avatar={aiEmployee.avatar ? <Avatar src={avatars(aiEmployee.avatar)} size={avatarSize} /> : null}
        title={
          <>
            {aiEmployee.nickname}
            {aiEmployee.position ? <Tag style={{ marginLeft: token.margin }}>{aiEmployee.position}</Tag> : null}
          </>
        }
        description={<>{aiEmployee.bio}</>}
      />
    </Card>
  );
});

export const WorkContext: React.FC<{
  value?: ContextItem[];
  onChange?: (value: ContextItem[]) => void;
}> = ({ value, onChange }) => {
  const items = Array.isArray(value) ? value : [];
  const onAdd = (contextItem: ContextItem) => {
    const exists = items.some((item) => item.type === contextItem.type && item.uid === contextItem.uid);
    if (!exists) {
      onChange?.([...items, contextItem]);
    }
  };
  const onRemove = (type: string, uid: string) => {
    onChange?.(items.filter((item) => !(item.type === type && item.uid === uid)));
  };
  return (
    <Space direction="vertical">
      <Space wrap>
        {items.map((item) => (
          <WorkContextItem
            within="task"
            key={`${item.type}:${item.uid}`}
            item={item}
            closable={true}
            onRemove={onRemove}
          />
        ))}
      </Space>
      <AddContextButton contextItems={items} onAdd={onAdd} onRemove={onRemove} runtime={getGlobalChatBoxRuntime()} />
    </Space>
  );
};

const TaskModelSelect: React.FC<{
  value?: Task['model'];
  onChange?: (value: Task['model']) => void;
}> = observer(({ value, onChange }) => {
  const t = useT();
  const aiEmployee = useCurrentAIEmployee();
  const { services, loading } = useLLMServices();
  const options = useMemo(() => {
    const modelKeys = new Set(
      getAIEmployeeModels(aiEmployee, getAllModels(services)).map((model) => `${model.llmService}:${model.model}`),
    );
    return services
      .map((service) => ({
        label: service.llmServiceTitle,
        options: service.enabledModels
          .filter((model) => modelKeys.has(`${service.llmService}:${model.value}`))
          .map((model) => ({
            label: `${service.llmServiceTitle} / ${model.label}`,
            value: `${service.llmService}:${model.value}`,
          })),
      }))
      .filter((service) => service.options.length);
  }, [aiEmployee, services]);
  const optionValues = useMemo(
    () => new Set(options.flatMap((group) => group.options.map((option) => option.value))),
    [options],
  );
  const selectedValue = getSelectedModelValue(value);

  useEffect(() => {
    if (selectedValue && !optionValues.has(selectedValue)) {
      onChange?.(null);
    }
  }, [onChange, optionValues, selectedValue]);

  const handleChange = (nextValue?: string) => {
    if (!nextValue) {
      onChange?.(null);
      return;
    }
    const [llmService, model] = nextValue.split(':');
    onChange?.({ llmService, model });
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

const TaskWebSearchSwitch: React.FC<{
  value?: boolean;
  onChange?: (value: boolean) => void;
}> = observer(({ value, onChange }) => {
  const t = useT();
  const ctx = useFlowSettingsContext<AIEmployeeShortcutModel>();
  const { services } = useLLMServices();
  const tasks = ctx.model.getStepParams('shortcutSettings', 'editTasks')?.tasks;
  const currentModel = Array.isArray(tasks) ? tasks.find((task) => task?.webSearch === value)?.model : undefined;
  const selectedService = useMemo(() => getServiceByOverride(services, currentModel), [currentModel, services]);
  const supportWebSearch = selectedService?.supportWebSearch;
  const isDisabled = !!currentModel && supportWebSearch === false;

  useEffect(() => {
    if (isDisabled && value) {
      onChange?.(false);
    }
  }, [isDisabled, onChange, value]);

  return (
    <Space direction="vertical">
      <Switch checked={!!value} disabled={isDisabled} onChange={(checked) => onChange?.(checked)} />
      {isDisabled ? <Typography.Text type="secondary">{t('Web search not supported')}</Typography.Text> : null}
    </Space>
  );
});

const RadioOptions = {
  preset: { value: 'preset' },
  custom: { value: 'custom' },
};

const getRadioOptions = (t: ReturnType<typeof useT>, type: 'skills' | 'tools') => [
  {
    label: (
      <Tooltip
        title={t(
          type === 'skills'
            ? "Use the AI employee's default skills for this task."
            : "Use the AI employee's default tools for this task.",
        )}
      >
        <span>{t('Preset')}</span>
      </Tooltip>
    ),
    value: RadioOptions.preset.value,
  },
  {
    label: (
      <Tooltip
        title={t(
          type === 'skills'
            ? 'Select the specific skills this task is allowed to use.'
            : 'Select the specific tools this task is allowed to use.',
        )}
      >
        <span>{t('Custom')}</span>
      </Tooltip>
    ),
    value: RadioOptions.custom.value,
  },
];

const OptionContent: React.FC<{
  title?: string;
  description?: string;
}> = ({ title, description }) => {
  const t = useT();
  const { token } = theme.useToken();
  const compiledTitle = title ? t(title) : '';
  const compiledDescription = description ? t(description) : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginXXS,
        width: '100%',
        minWidth: 0,
        padding: `${token.paddingXXS}px 0`,
      }}
    >
      <div>{compiledTitle}</div>
      {compiledDescription ? (
        <Typography.Text
          type="secondary"
          style={{
            fontSize: token.fontSizeSM,
          }}
          ellipsis={{
            tooltip: compiledDescription,
          }}
        >
          {compiledDescription}
        </Typography.Text>
      ) : null}
    </div>
  );
};

const TaskCapabilitySelect: React.FC<{
  type: 'skills' | 'tools';
  value?: string[];
  onChange?: (value?: string[]) => void;
}> = observer(({ type, value, onChange }) => {
  const t = useT();
  const { token } = theme.useToken();
  const aiEmployee = useCurrentAIEmployee();
  const defaultValues = useMemo(() => {
    if (type === 'skills') {
      return aiEmployee?.skillSettings?.skills ?? [];
    }
    return aiEmployee?.skillSettings?.tools?.map((tool) => tool.name) ?? [];
  }, [aiEmployee, type]);
  const radioOptions = useMemo(() => getRadioOptions(t, type), [t, type]);
  const radioValue = Array.isArray(value) ? RadioOptions.custom.value : RadioOptions.preset.value;
  const resourceName = type === 'skills' ? 'aiSkills' : 'aiTools';

  const handleSelectChange = (nextValue: string[]) => {
    onChange?.(nextValue?.filter((item) => defaultValues.includes(item)));
  };

  const handleRadioChange: RadioGroupProps['onChange'] = (event) => {
    if (event.target.value === RadioOptions.preset.value) {
      onChange?.(undefined);
      return;
    }
    onChange?.(defaultValues);
  };

  return (
    <Space style={{ width: '100%' }} direction="vertical" size={token.marginXXS}>
      <Radio.Group value={radioValue} onChange={handleRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value ? (
        <RemoteSelect<string[]>
          key={aiEmployee?.username}
          multiple
          value={value}
          onChange={handleSelectChange}
          manual={false}
          popupMatchSelectWidth
          placeholder={t(type === 'skills' ? 'Leave empty to disable skills.' : 'Leave empty to disable tools.')}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          service={{
            resource: resourceName,
            action: 'listBinding',
            params: {
              username: aiEmployee?.username,
            },
          }}
          optionFilter={isBindingOption}
          optionRender={(option) => {
            const data = option.data;
            if (!isBindingOption(data)) {
              return null;
            }
            return <OptionContent title={data.title} description={data.description} />;
          }}
        />
      ) : null}
    </Space>
  );
});

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  title: tExpr('Task settings'),
  steps: {
    migration: {
      handler: async (ctx: AIShortcutFlowContext) => {
        const tasks = ctx.model?.stepParams?.shortcutSettings?.editTasks?.tasks as ShortcutTask[] | undefined;
        normalizeShortcutTasksSkillSettings(tasks, { dropEmptyLegacyArrays: true });
      },
    },
    editTasks: {
      title: tExpr('Edit tasks'),
      uiMode() {
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
      uiSchema: async (ctx: AIShortcutFlowContext) => {
        await ctx.aiConfigRepository?.getAIEmployees();
        const token = ctx.model?.context?.themeToken;
        const labelStyle = {
          fontWeight: token?.fontWeightStrong,
        };
        return {
          profile: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': Information,
          },
          tasks: {
            type: 'array',
            title: tExpr('Task'),
            'x-component': 'ArrayTabs',
            'x-component-props': {
              size: 'small',
            },
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  title: tExpr('Title'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-decorator-props': {
                    labelStyle,
                    tooltip: tExpr('Label for task selection buttons when multiple tasks exist'),
                  },
                },
                chatBoxUid: {
                  type: 'string',
                  title: tExpr('Chat box uid'),
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    labelStyle,
                  },
                  'x-component': 'Input',
                  'x-component-props': {
                    allowClear: true,
                  },
                },
                message: {
                  type: 'object',
                  properties: {
                    system: {
                      title: tExpr('Background'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        labelStyle,
                        tooltip: tExpr(
                          'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                        ),
                      },
                      'x-component': 'FlowSettingsVariableTextArea',
                    },
                    user: {
                      title: tExpr('Default user message'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        labelStyle,
                      },
                      'x-component': 'FlowSettingsVariableTextArea',
                    },
                    workContext: {
                      title: tExpr('Work context'),
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        labelStyle,
                      },
                      'x-component': WorkContext,
                    },
                  },
                },
                autoSend: {
                  type: 'boolean',
                  'x-content': tExpr('Send default user message automatically'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                },
                skillSettings: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    skills: {
                      title: tExpr('Skills'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        labelStyle,
                        layout: 'horizontal',
                        tooltip: tExpr('Configure the skills available to this task'),
                      },
                      'x-component': TaskCapabilitySelect,
                      'x-component-props': {
                        type: 'skills',
                      },
                    },
                    tools: {
                      title: tExpr('Tools'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-decorator-props': {
                        labelStyle,
                        layout: 'horizontal',
                        tooltip: tExpr('Configure the tools available to this task'),
                      },
                      'x-component': TaskCapabilitySelect,
                      'x-component-props': {
                        type: 'tools',
                      },
                    },
                  },
                },
                model: {
                  title: tExpr('Model'),
                  type: 'object',
                  nullable: true,
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    labelStyle,
                  },
                  'x-component': TaskModelSelect,
                },
                webSearch: {
                  title: tExpr('Web search'),
                  type: 'boolean',
                  default: false,
                  'x-decorator': 'FormItem',
                  'x-decorator-props': {
                    labelStyle,
                  },
                  'x-component': TaskWebSearchSwitch,
                },
              },
            },
          },
        };
      },
      beforeParamsSave(_ctx: AIShortcutFlowContext, params: ShortcutSettingsParams) {
        cleanupEmptyShortcutTaskSkillSettings(params.tasks);
        normalizeShortcutTasksSkillSettings(params.tasks, { onlyExistingSettings: true });
      },
      handler(ctx: AIShortcutFlowContext, params: ShortcutSettingsParams) {
        ctx.model?.setProps({
          tasks: params.tasks,
        });
      },
    },
  },
});
