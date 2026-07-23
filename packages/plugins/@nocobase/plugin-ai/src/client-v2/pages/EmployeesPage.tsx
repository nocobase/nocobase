/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Collapse,
  Dropdown,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Radio,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { CollapseProps, MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { arrayMove } from '@dnd-kit/sortable';
import { css } from '@emotion/css';
import { Table, useApp, VariableTextArea } from '@nocobase/client-v2';
import { observer, randomId, useFlowContext } from '@nocobase/flow-engine';
import type { APIClient, SkillsEntry, ToolsEntry } from '@nocobase/client-v2';
import { useT } from '../locale';
import { avatars, avatarsMap } from '../ai-employees/avatars';
import { useAIConfigRepository } from '../repositories/hooks/useAIConfigRepository';
import type { LLMServiceItem } from '../repositories/AIConfigRepository';
import type { AIEmployee as ChatAIEmployee } from '../ai-employees/types';
import { AI_SETTINGS_DRAWER_WIDTH } from './drawerWidth';
import { useUnsavedChangesBeforeClose } from './useUnsavedChangesBeforeClose';

type EmployeeCategory = 'business' | 'developer';
type APIClientLike = Pick<APIClient, 'resource'>;
type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;
type APIResponse = {
  data?: {
    data?: unknown;
  };
};
type EmployeeListResult = {
  data: SettingsAIEmployee[];
  total?: number;
};
type KnowledgeBaseOption = {
  key: string;
  name: string;
};
type EmployeeToolSetting = {
  name: string;
  autoCall?: boolean;
};
type EmployeeModelSettings = {
  enabled?: boolean;
  llmService?: string;
  model?: string;
  models?: Array<{
    llmService?: string;
    model?: string;
  }>;
};
type EmployeeSkillSettings = {
  skills?: string[];
  tools?: EmployeeToolSetting[];
};
type SettingsAIEmployee = ChatAIEmployee & {
  about?: string | null;
  dataSourceSettings?: unknown;
  defaultPrompt?: string;
  enableKnowledgeBase?: boolean;
  enabled?: boolean;
  knowledgeBasePrompt?: string;
  knowledgeBase?: {
    topK?: number;
    score?: string | number;
    knowledgeBaseKeys?: string[];
  };
  missingKnowledgeBaseKeys?: string[];
};
type EmployeeFormValues = SettingsAIEmployee & {
  _aboutMode?: 'system' | 'custom';
};

const defaultAvatar = Object.keys(avatarsMap)[0];
const EMPLOYEE_SORT_FIELD = 'sort';

export const EMPLOYEE_PROMPT_VARIABLE_NAMESPACES = ['user', 'roleName', 'locale', 'now', 'timestamp'];

const formLabel = (label: string) => `${label}:`;

const fillHeightTableClassName = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .ant-spin-nested-loading,
  .ant-spin-container,
  .ant-table,
  .ant-table-container {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-table-content {
    flex: 1;
    min-height: 0;
  }

  .ant-table-body {
    flex: 1;
    min-height: 0;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
  }

  .ant-pagination {
    flex: 0 0 auto;
  }
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isResourceAction = (value: unknown): value is ResourceAction => typeof value === 'function';

const readResponseData = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }
  return (response as APIResponse).data?.data;
};

const readResponseMeta = (response: unknown): Record<string, unknown> => {
  if (!isRecord(response)) {
    return {};
  }
  const data = response.data;
  return isRecord(data) ? data : {};
};

const isAIEmployee = (value: unknown): value is SettingsAIEmployee =>
  isRecord(value) && typeof value.username === 'string';

const isKnowledgeBaseOption = (value: unknown): value is KnowledgeBaseOption =>
  isRecord(value) && typeof value.key === 'string' && typeof value.name === 'string';

const callResourceAction = async (
  apiClient: APIClientLike,
  resourceName: string,
  actionName: string,
  params?: Record<string, unknown>,
): Promise<unknown> => {
  const resource = apiClient.resource(resourceName) as Record<string, unknown>;
  const action = resource[actionName];
  if (!isResourceAction(action)) {
    throw new Error(`Missing resource action: ${resourceName}.${actionName}`);
  }
  return action(params);
};

const normalizeEmployeeFormValues = (values: EmployeeFormValues, options: { edit: boolean }) => {
  const nextValues: Record<string, unknown> = { ...values };
  if (options.edit) {
    if (values._aboutMode === 'system') {
      nextValues.about = null;
    }
    delete nextValues._aboutMode;
    delete nextValues.enabled;
  }
  return nextValues;
};

export async function listAIEmployees(
  apiClient: APIClientLike,
  params: { category: EmployeeCategory; page?: number; pageSize?: number },
): Promise<EmployeeListResult> {
  const response = await callResourceAction(apiClient, 'aiEmployees', 'list', {
    page: params.page,
    pageSize: params.pageSize,
    filter: {
      category: params.category,
    },
    sort: [EMPLOYEE_SORT_FIELD],
  });
  const data = readResponseData(response);
  const meta = readResponseMeta(response);
  return {
    data: Array.isArray(data) ? data.filter(isAIEmployee) : [],
    total: typeof meta.count === 'number' ? meta.count : undefined,
  };
}

export async function moveAIEmployee(apiClient: APIClientLike, sourceUsername: string, targetUsername: string) {
  await callResourceAction(apiClient, 'aiEmployees', 'move', {
    sourceId: sourceUsername,
    targetId: targetUsername,
    sortField: EMPLOYEE_SORT_FIELD,
  });
}

export async function createAIEmployee(apiClient: APIClientLike, values: EmployeeFormValues) {
  await callResourceAction(apiClient, 'aiEmployees', 'create', {
    values: normalizeEmployeeFormValues(values, { edit: false }),
  });
}

export async function updateAIEmployee(apiClient: APIClientLike, values: EmployeeFormValues) {
  if (!values.username) {
    throw new Error('Missing AI employee username.');
  }
  await callResourceAction(apiClient, 'aiEmployees', 'update', {
    values: normalizeEmployeeFormValues(values, { edit: true }),
    filterByTk: values.username,
  });
}

export async function deleteAIEmployee(apiClient: APIClientLike, username: string) {
  await callResourceAction(apiClient, 'aiEmployees', 'destroy', {
    filterByTk: username,
  });
}

export async function updateAIEmployeeEnabled(apiClient: APIClientLike, username: string, enabled: boolean) {
  await callResourceAction(apiClient, 'aiEmployees', 'update', {
    filterByTk: username,
    values: { enabled },
  });
}

export async function isKnowledgeBaseEnabled(apiClient: APIClientLike): Promise<boolean> {
  const response = await callResourceAction(apiClient, 'aiSettings', 'isKnowledgeBaseEnabled');
  const data = readResponseData(response);
  return isRecord(data) && data.enabled === true;
}

export async function listKnowledgeBases(apiClient: APIClientLike): Promise<KnowledgeBaseOption[]> {
  const response = await callResourceAction(apiClient, 'aiKnowledgeBase', 'list', {
    fields: ['key', 'name'],
    filter: {
      enabled: true,
    },
  });
  const data = readResponseData(response);
  return Array.isArray(data) ? data.filter(isKnowledgeBaseOption) : [];
}

const createInitialEmployeeValues = (t: ReturnType<typeof useT>): EmployeeFormValues => ({
  username: randomId(),
  enabled: true,
  enableKnowledgeBase: false,
  knowledgeBase: {
    knowledgeBaseKeys: [],
    topK: 3,
    score: '0.6',
  },
  knowledgeBasePrompt: t('knowledge Base Prompt default'),
  avatar: defaultAvatar,
  builtIn: false,
  category: 'business',
});

const AvatarSelect: React.FC<{ disabled?: boolean; value?: string; onChange?: (value: string) => void }> = ({
  disabled,
  value,
  onChange,
}) => {
  const { token } = theme.useToken();
  const current = value || defaultAvatar;
  const avatarList = useMemo(
    () =>
      Object.keys(avatarsMap).map((seed) => ({
        seed,
        uri: avatars(seed),
      })),
    [],
  );

  return (
    <>
      <div style={{ marginBottom: token.marginLG + token.margin }}>
        <Avatar size={token.controlHeightLG * 2 + token.paddingSM + token.lineWidth * 2} src={avatars(current)} />
      </div>
      {disabled ? null : (
        <List
          grid={{ gutter: token.margin, column: 10 }}
          dataSource={avatarList}
          renderItem={(item) => (
            <List.Item>
              <button
                aria-label={item.seed}
                type="button"
                onClick={() => onChange?.(item.seed)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onChange?.(item.seed);
                  }
                }}
                style={{
                  background: 'transparent',
                  borderColor: current === item.seed ? token.colorPrimary : 'transparent',
                  borderStyle: 'solid',
                  borderWidth: token.lineWidth * 2,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  padding: 0,
                }}
              >
                <Avatar size={token.controlHeightLG + token.paddingSM + token.lineWidth * 2} src={item.uri} />
              </button>
            </List.Item>
          )}
        />
      )}
    </>
  );
};

const ProfileSettings: React.FC<{ edit: boolean; builtIn?: boolean }> = ({ edit, builtIn }) => {
  const t = useT();
  return (
    <>
      <Form.Item name="username" label={formLabel(t('Username'))} rules={[{ required: true }]} preserve>
        <Input disabled={edit} />
      </Form.Item>
      <Form.Item name="nickname" label={formLabel(t('Nickname'))} rules={[{ required: true }]} preserve>
        <Input disabled={builtIn} />
      </Form.Item>
      <Form.Item name="position" label={formLabel(t('Position'))} extra={t('Position description')} preserve>
        <Input disabled={builtIn} placeholder={t('Position placeholder')} />
      </Form.Item>
      <Form.Item name="avatar" label={formLabel(t('Avatar'))} preserve>
        <AvatarSelect disabled={builtIn} />
      </Form.Item>
      <Form.Item name="bio" label={formLabel(t('Bio'))} preserve>
        <Input.TextArea disabled={builtIn} placeholder={t('Bio placeholder')} />
      </Form.Item>
      <Form.Item name="greeting" label={formLabel(t('Greeting message'))} preserve>
        <Input.TextArea disabled={builtIn} placeholder={t('Greeting message placeholder')} />
      </Form.Item>
    </>
  );
};

const SystemPromptSettings: React.FC<{ builtIn?: boolean; record?: SettingsAIEmployee }> = ({ builtIn, record }) => {
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const aboutMode = Form.useWatch('_aboutMode', form) ?? (record?.about ? 'custom' : 'system');

  useEffect(() => {
    if (builtIn && !form.getFieldValue('_aboutMode')) {
      form.setFieldValue('_aboutMode', record?.about ? 'custom' : 'system');
    }
  }, [builtIn, form, record?.about]);

  return (
    <>
      <Alert message={t('Role setting description')} type="info" showIcon />
      {builtIn ? (
        <Form.Item name="_aboutMode" preserve>
          <Radio.Group>
            <Radio value="system">{t('System default')}</Radio>
            <Radio value="custom">{t('Custom')}</Radio>
          </Radio.Group>
        </Form.Item>
      ) : null}
      {builtIn && aboutMode === 'system' ? (
        <Typography.Paragraph
          copyable
          style={{
            backgroundColor: token.colorFillQuaternary,
            borderColor: token.colorBorder,
            borderRadius: token.borderRadius,
            borderStyle: 'solid',
            borderWidth: token.lineWidth,
            margin: 0,
            maxHeight: token.controlHeightLG * 12,
            overflowY: 'auto',
            paddingBlock: token.paddingSM,
            paddingInline: token.padding,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {record?.defaultPrompt || ''}
        </Typography.Paragraph>
      ) : (
        <Form.Item name="about" label={formLabel(t('Role setting'))} preserve>
          <VariableTextArea
            namespaces={EMPLOYEE_PROMPT_VARIABLE_NAMESPACES}
            placeholder={t('Role setting placeholder')}
            rows={15}
          />
        </Form.Item>
      )}
    </>
  );
};

const parseModelValue = (value: string) => {
  const [llmService, ...modelParts] = value.split(':');
  return {
    llmService,
    model: modelParts.join(':'),
  };
};

const toModelValue = (model: { llmService?: string; model?: string }) =>
  model.llmService && model.model ? `${model.llmService}:${model.model}` : undefined;

const normalizeModelSettings = (value: unknown): EmployeeModelSettings =>
  isRecord(value) ? (value as EmployeeModelSettings) : {};

const normalizeToolSetting = (value: unknown): EmployeeToolSetting | undefined => {
  if (typeof value === 'string') {
    return { name: value, autoCall: false };
  }
  if (!isRecord(value) || typeof value.name !== 'string') {
    return undefined;
  }
  return {
    name: value.name,
    autoCall: value.autoCall === true,
  };
};

export const normalizeSkillSettings = (value: unknown): EmployeeSkillSettings => {
  if (!isRecord(value)) {
    return {};
  }
  const skills = Array.isArray(value.skills)
    ? value.skills.filter((skill): skill is string => typeof skill === 'string')
    : [];
  const tools = Array.isArray(value.tools)
    ? value.tools.map(normalizeToolSetting).filter((tool): tool is EmployeeToolSetting => !!tool)
    : [];
  return {
    skills,
    tools,
  };
};

export const buildEmployeeSubmitValues = (
  values: EmployeeFormValues,
  allValues: EmployeeFormValues,
): EmployeeFormValues => {
  const submitValues: EmployeeFormValues = {
    ...values,
    skillSettings: normalizeSkillSettings(allValues.skillSettings),
  };
  if (isRecord(allValues.modelSettings)) {
    submitValues.modelSettings = normalizeModelSettings(allValues.modelSettings);
  }
  return submitValues;
};

const useLLMServices = () => {
  const repo = useAIConfigRepository();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadLLMServices = async () => {
      setLoading(true);
      try {
        await repo.getLLMServices();
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    loadLLMServices().catch((error: unknown) => {
      console.error(error);
    });
    return () => {
      ignore = true;
    };
  }, [repo]);

  return {
    services: repo.llmServices,
    loading: loading || repo.llmServicesLoading,
  };
};

const ModelSettings: React.FC = observer(() => {
  const t = useT();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const watchedModelSettings = Form.useWatch('modelSettings', { form, preserve: true });
  const [modelSettings, setModelSettingsState] = useState<EmployeeModelSettings>(() =>
    normalizeModelSettings(form.getFieldValue('modelSettings')),
  );
  const { services, loading } = useLLMServices();
  const enabled = !!modelSettings.enabled;
  const selectedValues = useMemo(() => {
    const models = Array.isArray(modelSettings.models) ? modelSettings.models : [];
    if (models.length) {
      return models.map(toModelValue).filter((value): value is string => !!value);
    }
    const legacyValue = toModelValue(modelSettings);
    return legacyValue ? [legacyValue] : [];
  }, [modelSettings]);
  const options = useMemo(
    () =>
      services.map((service: LLMServiceItem) => ({
        label: service.llmServiceTitle,
        options: service.enabledModels.map((model) => ({
          label: `${service.llmServiceTitle} / ${model.label}`,
          value: `${service.llmService}:${model.value}`,
        })),
      })),
    [services],
  );
  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((group) => {
      group.options.forEach((option) => map.set(option.value, option.label));
    });
    return map;
  }, [options]);
  const setModelSettings = useCallback(
    (values: Record<string, unknown>) => {
      const current = form.getFieldValue('modelSettings');
      const next = {
        ...normalizeModelSettings(current),
        ...values,
      };
      setModelSettingsState(next);
      form.setFieldsValue({
        modelSettings: next,
      });
    },
    [form],
  );

  useEffect(() => {
    setModelSettingsState(normalizeModelSettings(watchedModelSettings));
  }, [watchedModelSettings]);

  useEffect(() => {
    if (!enabled || selectedValues.length || !options.length) {
      return;
    }
    const first = options[0]?.options?.[0]?.value;
    if (first) {
      setModelSettings({ models: [parseModelValue(first)] });
    }
  }, [enabled, options, selectedValues.length, setModelSettings]);

  return (
    <>
      <Alert type="info" showIcon message={t('Restrict this AI employee to the selected models.')} />
      <Form.Item
        label={<Typography.Text strong>{formLabel(t('Enable dedicated model configuration'))}</Typography.Text>}
        preserve
      >
        <Switch checked={enabled} onChange={(checked) => setModelSettings({ enabled: checked })} />
      </Form.Item>
      <Form.Item label={<Typography.Text strong>{formLabel(t('Models'))}</Typography.Text>} preserve>
        <Select
          allowClear
          disabled={!enabled}
          loading={loading}
          mode="multiple"
          notFoundContent={loading ? <Spin size="small" /> : null}
          optionFilterProp="label"
          options={options}
          placeholder={t('Select models')}
          showSearch
          tagRender={(props) => (
            <Tag closable={props.closable} onClose={props.onClose}>
              {labelMap.get(String(props.value)) || props.label}
            </Tag>
          )}
          value={selectedValues}
          onChange={(values: string[]) => {
            if (!values.length) {
              setModelSettings({ llmService: undefined, model: undefined, models: [] });
              return;
            }
            setModelSettings({
              llmService: undefined,
              model: undefined,
              models: values.map(parseModelValue),
            });
          }}
        />
      </Form.Item>
    </>
  );
});

const useTranslatedText = () => {
  const t = useT();
  return (value?: string, fallback = '') => (value ? t(value) : fallback);
};

const SectionLabel: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const { token } = theme.useToken();
  return (
    <div>
      <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>{title}</div>
      <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{description}</div>
    </div>
  );
};

const SkillSettings: React.FC<{ builtIn?: boolean }> = observer(({ builtIn }) => {
  const t = useT();
  const translateText = useTranslatedText();
  const repo = useAIConfigRepository();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const skillSettings = Form.useWatch('skillSettings', { form, preserve: true }) ?? {};
  const selectedSkills = Array.isArray(skillSettings.skills) ? skillSettings.skills : [];

  useEffect(() => {
    repo.getAISkills().catch((error: unknown) => {
      console.error(error);
    });
  }, [repo]);

  const skillsByName = new Map(repo.aiSkills.map((skill) => [skill.name, skill]));
  const generalSkills = repo.aiSkills.filter((skill) => skill.scope === 'GENERAL');
  const specifiedSkills = selectedSkills
    .map((name: string) => skillsByName.get(name))
    .filter((skill): skill is SkillsEntry => !!skill && skill.scope === 'SPECIFIED');
  const renderSkill = (skill: SkillsEntry) => (
    <List.Item key={skill.name}>
      <div>{translateText(skill.title ?? skill.name, skill.name)}</div>
      <Typography.Text type="secondary">{translateText(skill.about ?? skill.description)}</Typography.Text>
    </List.Item>
  );
  const items: CollapseProps['items'] = [
    {
      key: 'general-skills',
      label: <SectionLabel title={t('General skills')} description={t('Shared by all AI employees.')} />,
      children: <List itemLayout="vertical" size="small" dataSource={generalSkills} renderItem={renderSkill} />,
    },
  ];

  if (builtIn && specifiedSkills.length) {
    items.push({
      key: 'specific-skills',
      label: (
        <SectionLabel title={t('Employee-specific skills')} description={t('Only available to this AI employee.')} />
      ),
      children: <List itemLayout="vertical" size="small" dataSource={specifiedSkills} renderItem={renderSkill} />,
    });
  }

  return repo.aiSkillsLoading ? <Spin /> : <Collapse ghost size="small" defaultActiveKey={[]} items={items} />;
});

const getPermissionValue = (tool: ToolsEntry, item?: EmployeeToolSetting) => {
  if (tool.scope === 'CUSTOM') {
    return item?.autoCall ? 'ALLOW' : 'ASK';
  }
  return tool.defaultPermission === 'ALLOW' ? 'ALLOW' : 'ASK';
};

const ToolSettings: React.FC<{ builtIn?: boolean }> = observer(({ builtIn }) => {
  const t = useT();
  const { token } = theme.useToken();
  const translateText = useTranslatedText();
  const repo = useAIConfigRepository();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const watchedSkillSettings = Form.useWatch('skillSettings', { form, preserve: true });
  const [skillSettings, setSkillSettingsState] = useState<EmployeeSkillSettings>(() =>
    normalizeSkillSettings(form.getFieldValue('skillSettings')),
  );
  const selectedTools: EmployeeToolSetting[] = Array.isArray(skillSettings.tools) ? skillSettings.tools : [];
  const [customActiveKeys, setCustomActiveKeys] = useState<string[]>(
    builtIn && !selectedTools.length ? [] : ['custom-tools'],
  );
  const previousCustomToolsLength = React.useRef(selectedTools.length);
  const permissionOptions = [
    { label: t('Ask'), value: 'ASK' },
    { label: t('Allow'), value: 'ALLOW' },
  ];

  useEffect(() => {
    repo.refreshAITools().catch((error: unknown) => {
      console.error(error);
    });
  }, [repo]);

  useEffect(() => {
    setSkillSettingsState(normalizeSkillSettings(watchedSkillSettings));
  }, [watchedSkillSettings]);

  const setTools = (tools: EmployeeToolSetting[]) => {
    const current = form.getFieldValue('skillSettings');
    const next = {
      ...normalizeSkillSettings(current),
      tools,
    };
    setSkillSettingsState(next);
    form.setFieldsValue({
      skillSettings: next,
    });
  };
  const selectedNames = new Set(selectedTools.map((item) => item.name));
  const toolsByName = new Map(repo.aiTools.map((tool) => [tool.definition.name, tool]));
  const generalTools = repo.aiTools.filter((tool) => tool.scope === 'GENERAL' && tool.from === 'loader');
  const specifiedTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope !== 'GENERAL' && tool.scope !== 'CUSTOM';
  });
  const customTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return !tool || tool.scope === 'CUSTOM';
  });

  useEffect(() => {
    const wasEmpty = previousCustomToolsLength.current === 0;
    if (builtIn && customTools.length === 0) {
      setCustomActiveKeys([]);
    } else if (wasEmpty && customTools.length > 0) {
      setCustomActiveKeys(['custom-tools']);
    }
    previousCustomToolsLength.current = customTools.length;
  }, [builtIn, customTools.length]);

  const customAddTools: MenuProps['items'] = repo.aiTools
    .filter((tool) => tool.scope === 'CUSTOM' && !selectedNames.has(tool.definition.name))
    .map((tool) => ({
      key: tool.definition.name,
      label: (
        <div
          style={{
            maxWidth: token.controlHeightLG * 8,
            minWidth: token.controlHeightLG * 4,
          }}
        >
          <Flex justify="space-between">
            <div>{translateText(tool.introduction?.title ?? tool.definition.name, tool.definition.name)}</div>
          </Flex>
          <Typography.Text type="secondary">
            {translateText(tool.introduction?.about ?? tool.definition.description)}
          </Typography.Text>
        </div>
      ),
      onClick: () => {
        const currentSettings = normalizeSkillSettings(form.getFieldValue('skillSettings'));
        const currentTools = Array.isArray(currentSettings.tools) ? currentSettings.tools : [];
        if (currentTools.some((item) => item.name === tool.definition.name)) {
          return;
        }
        setTools([...currentTools, { name: tool.definition.name, autoCall: false }]);
      },
    }));
  const renderReadonlyTool = (item: EmployeeToolSetting | ToolsEntry) => {
    const tool = 'definition' in item ? item : toolsByName.get(item.name);
    if (!tool) {
      return null;
    }
    const selectedItem = 'definition' in item ? undefined : item;
    return (
      <List.Item
        key={tool.definition.name}
        extra={
          <Flex vertical justify="end">
            <Space>
              <Typography.Text type="secondary">{t('Permission')}</Typography.Text>
              <Segmented
                size="small"
                options={permissionOptions}
                value={getPermissionValue(tool, selectedItem)}
                disabled
              />
            </Space>
          </Flex>
        }
      >
        <div>{translateText(tool.introduction?.title ?? tool.definition.name, tool.definition.name)}</div>
        <Typography.Text type="secondary">
          {translateText(tool.introduction?.about ?? tool.definition.description)}
        </Typography.Text>
      </List.Item>
    );
  };
  const renderCustomTool = (item: EmployeeToolSetting) => {
    const tool = toolsByName.get(item.name);
    const title = tool
      ? translateText(tool.introduction?.title ?? tool.definition.name, tool.definition.name)
      : item.name;
    const description = tool ? translateText(tool.introduction?.about ?? tool.definition.description) : null;
    return (
      <List.Item
        key={item.name}
        extra={
          <Space>
            <Typography.Text>{t('Permission')}</Typography.Text>
            <Segmented
              size="small"
              options={permissionOptions}
              value={tool ? getPermissionValue(tool, item) : item.autoCall ? 'ALLOW' : 'ASK'}
              onChange={(value) => {
                setTools(
                  selectedTools.map((toolItem) =>
                    toolItem.name === item.name ? { ...toolItem, autoCall: value === 'ALLOW' } : toolItem,
                  ),
                );
              }}
            />
            <Button
              aria-label={t('Delete')}
              icon={<DeleteOutlined />}
              type="text"
              onClick={() => {
                setTools(selectedTools.filter((toolItem) => toolItem.name !== item.name));
              }}
            />
          </Space>
        }
      >
        <div>{title}</div>
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      </List.Item>
    );
  };
  const items: CollapseProps['items'] = [
    {
      key: 'general-tools',
      label: <SectionLabel title={t('General tools')} description={t('Shared by all AI employees.')} />,
      children: <List itemLayout="vertical" size="small" dataSource={generalTools} renderItem={renderReadonlyTool} />,
    },
  ];

  if (builtIn && specifiedTools.length) {
    items.push({
      key: 'specific-tools',
      label: (
        <SectionLabel title={t('Employee-specific tools')} description={t('Only available to this AI employee.')} />
      ),
      children: <List itemLayout="vertical" size="small" dataSource={specifiedTools} renderItem={renderReadonlyTool} />,
    });
  }

  items.push({
    key: 'custom-tools',
    label: (
      <SectionLabel
        title={t('Custom tools')}
        description={t('Created by workflow. You can add/remove and set default permissions.')}
      />
    ),
    extra: (
      <div
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        <Dropdown menu={{ items: customAddTools }} disabled={!customAddTools?.length} placement="bottomRight">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!customAddTools?.length}
            style={{ pointerEvents: customAddTools?.length ? undefined : 'none' }}
          >
            {t('Add tool')}
          </Button>
        </Dropdown>
      </div>
    ),
    children: <List itemLayout="vertical" bordered dataSource={customTools} renderItem={renderCustomTool} />,
  });

  return repo.aiToolsLoading ? (
    <Spin />
  ) : (
    <Collapse
      ghost
      size="small"
      activeKey={customActiveKeys}
      onChange={(keys) => setCustomActiveKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])}
      items={items}
    />
  );
});

const KnowledgeBaseSettings: React.FC<{ apiClient: APIClientLike }> = ({ apiClient }) => {
  const t = useT();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const enableKnowledgeBase = Form.useWatch('enableKnowledgeBase', form);
  const [options, setOptions] = useState<KnowledgeBaseOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadKnowledgeBases = async () => {
      setLoading(true);
      try {
        const items = await listKnowledgeBases(apiClient);
        if (!ignore) {
          setOptions(items);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    loadKnowledgeBases().catch((error: unknown) => {
      console.error(error);
    });
    return () => {
      ignore = true;
    };
  }, [apiClient]);

  return (
    <>
      <Form.Item
        name="enableKnowledgeBase"
        label={formLabel(t('Enable Knowledge Base'))}
        valuePropName="checked"
        preserve
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="knowledgeBasePrompt"
        label={formLabel(t('Knowledge Base Prompt'))}
        rules={[{ required: true }]}
        preserve
      >
        <Input.TextArea disabled={!enableKnowledgeBase} autoSize={{ minRows: 5 }} />
      </Form.Item>
      <Form.Item
        name={['knowledgeBase', 'knowledgeBaseKeys']}
        label={formLabel(t('Knowledge Base'))}
        rules={[{ required: !!enableKnowledgeBase }]}
        preserve
      >
        <Select
          disabled={!enableKnowledgeBase}
          fieldNames={{ label: 'name', value: 'key' }}
          loading={loading}
          mode="multiple"
          options={options}
        />
      </Form.Item>
      <Form.Item name={['knowledgeBase', 'topK']} label={formLabel(t('Top K'))} rules={[{ required: true }]} preserve>
        <InputNumber disabled={!enableKnowledgeBase} min={1} max={100} />
      </Form.Item>
      <Form.Item name={['knowledgeBase', 'score']} label={formLabel(t('Score'))} rules={[{ required: true }]} preserve>
        <InputNumber disabled={!enableKnowledgeBase} min={0} max={1} step={0.1} />
      </Form.Item>
    </>
  );
};

const EmployeeForm: React.FC<{
  apiClient: APIClientLike;
  activeTab: string;
  edit: boolean;
  onTabChange: (key: string) => void;
  record?: SettingsAIEmployee;
  knowledgeBaseEnabled: boolean;
}> = ({ apiClient, activeTab, edit, onTabChange, record, knowledgeBaseEnabled }) => {
  const t = useT();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const chatSettings = Form.useWatch('chatSettings', form) ?? {};
  const builtIn = !!record?.builtIn;
  const showSkills = chatSettings.enableSkills !== false;
  const showTools = chatSettings.enableTools !== false;

  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      items={[
        {
          key: 'profile',
          label: t('Profile'),
          children: <ProfileSettings edit={edit} builtIn={builtIn} />,
          forceRender: true,
        },
        {
          key: 'roleSetting',
          label: t('Role setting'),
          children: <SystemPromptSettings builtIn={builtIn} record={record} />,
          forceRender: true,
        },
        {
          key: 'modelSettings',
          label: t('Model settings'),
          children: <ModelSettings />,
          forceRender: true,
        },
        ...(showSkills
          ? [
              {
                key: 'skills',
                label: t('Skills'),
                children: <SkillSettings builtIn={builtIn} />,
                forceRender: true,
              },
            ]
          : []),
        ...(showTools
          ? [
              {
                key: 'tools',
                label: t('Tools'),
                children: <ToolSettings builtIn={builtIn} />,
                forceRender: true,
              },
            ]
          : []),
        ...(knowledgeBaseEnabled
          ? [
              {
                key: 'knowledgeBase',
                label: t('KnowledgeBase'),
                children: <KnowledgeBaseSettings apiClient={apiClient} />,
                forceRender: true,
              },
            ]
          : []),
      ]}
    />
  );
};

const EnableSwitch: React.FC<{
  record: SettingsAIEmployee;
  onUpdated: () => Promise<void>;
}> = ({ record, onUpdated }) => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const repo = useAIConfigRepository();
  const [loading, setLoading] = useState(false);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      await updateAIEmployeeEnabled(app.apiClient, record.username, checked);
      message.success(t('Saved successfully'));
      await onUpdated();
      await repo.refreshAIEmployees();
    } catch (error) {
      console.error(error);
      message.error(t('Failed to update'));
    } finally {
      setLoading(false);
    }
  };

  return <Switch checked={!!record.enabled} onChange={handleChange} loading={loading} size="small" />;
};

export const EmployeesPage: React.FC = () => {
  const app = useApp();
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const repo = useAIConfigRepository();
  const [category, setCategory] = useState<EmployeeCategory>('business');
  const [employees, setEmployees] = useState<SettingsAIEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const auth = app.apiClient.auth as { role?: string } | undefined;
  const isRoot = auth?.role === 'root';
  const actionLinkStyle = useMemo<React.CSSProperties>(
    () => ({
      color: token.colorPrimary,
      marginInline: -token.paddingSM,
      paddingBlock: token.paddingSM,
      paddingInlineEnd: token.paddingXS + token.paddingSM,
      paddingInlineStart: token.paddingSM,
    }),
    [token.colorPrimary, token.paddingSM, token.paddingXS],
  );

  const refresh = useCallback(
    async (nextCategory = category) => {
      setLoading(true);
      try {
        const result = await listAIEmployees(app.apiClient, { category: nextCategory });
        setEmployees(result.data);
      } finally {
        setLoading(false);
      }
    },
    [app.apiClient, category],
  );

  useEffect(() => {
    refresh().catch((error: unknown) => {
      console.error(error);
      setLoading(false);
    });
  }, [refresh]);

  useEffect(() => {
    const loadKnowledgeBaseFeature = async () => {
      try {
        setKnowledgeBaseEnabled(await isKnowledgeBaseEnabled(app.apiClient));
      } catch (error) {
        console.error(error);
      }
    };
    loadKnowledgeBaseFeature().catch((error: unknown) => {
      console.error(error);
    });
  }, [app.apiClient]);

  const openCreateDrawer = () => {
    ctx.viewer.open({
      type: 'drawer',
      width: AI_SETTINGS_DRAWER_WIDTH,
      closable: true,
      content: (
        <AIEmployeeDrawerContent
          knowledgeBaseEnabled={knowledgeBaseEnabled}
          onSubmitted={async () => {
            await refresh();
            await repo.refreshAIEmployees();
          }}
        />
      ),
    });
  };

  const openEditDrawer = (record: SettingsAIEmployee) => {
    ctx.viewer.open({
      type: 'drawer',
      width: AI_SETTINGS_DRAWER_WIDTH,
      closable: true,
      content: (
        <AIEmployeeDrawerContent
          editingRecord={record}
          knowledgeBaseEnabled={knowledgeBaseEnabled}
          onSubmitted={async () => {
            await refresh();
            await repo.refreshAIEmployees();
          }}
        />
      ),
    });
  };

  const handleSortEnd = async (from: SettingsAIEmployee, to: SettingsAIEmployee) => {
    if (!from.username || !to.username || from.username === to.username) {
      return;
    }
    const previousEmployees = employees;
    const fromIndex = employees.findIndex((employee) => employee.username === from.username);
    const toIndex = employees.findIndex((employee) => employee.username === to.username);
    if (fromIndex >= 0 && toIndex >= 0) {
      setEmployees(arrayMove(employees, fromIndex, toIndex));
    }
    try {
      await moveAIEmployee(app.apiClient, from.username, to.username);
      message.success(t('Saved successfully'));
      await refresh();
      await repo.refreshAIEmployees();
    } catch (error) {
      console.error(error);
      setEmployees(previousEmployees);
      message.error(t('Failed to update'));
    }
  };

  const columns: ColumnsType<SettingsAIEmployee> = [
    {
      title: t('Avatar'),
      dataIndex: 'avatar',
      render: (value?: string) => (value ? <Avatar shape="circle" size="large" src={avatars(value)} /> : null),
    },
    {
      title: t('Username'),
      dataIndex: 'username',
      render: (value: string, record) => {
        const missingKeys = record.missingKnowledgeBaseKeys || [];
        if (!missingKeys.length) {
          return value;
        }
        return (
          <Space size="small">
            <span>{value}</span>
            <Tooltip
              title={t(
                'Missing knowledge base configuration for keys: {{keys}}. Create knowledge bases with the same keys to enable this employee normally.',
                { keys: missingKeys.join(', ') },
              )}
            >
              <ExclamationCircleOutlined />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: t('Nickname'),
      dataIndex: 'nickname',
    },
    {
      title: t('Position'),
      dataIndex: 'position',
    },
    {
      title: t('Enabled'),
      dataIndex: 'enabled',
      render: (_, record) => <EnableSwitch record={record} onUpdated={() => refresh()} />,
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size={token.marginXS}>
          <a style={actionLinkStyle} onClick={() => openEditDrawer(record)}>
            {t('Edit')}
          </a>
          <Popconfirm
            title={t('Delete AI employee')}
            description={t('Are you sure you want to delete this AI employee?')}
            onConfirm={async () => {
              if (record.builtIn && !isRoot) {
                message.warning(t('Cannot delete built-in ai employees'));
                return;
              }
              await deleteAIEmployee(app.apiClient, record.username);
              message.success(t('Saved successfully'));
              await refresh();
              await repo.refreshAIEmployees();
            }}
          >
            <a style={actionLinkStyle}>{t('Delete')}</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
      styles={{
        body: {
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
        },
      }}
    >
      <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
        <Flex justify="space-between" wrap="wrap" gap="middle">
          <Radio.Group
            optionType="button"
            value={category}
            options={[
              { label: t('Business'), value: 'business' },
              { label: t('Developer'), value: 'developer' },
            ]}
            onChange={(event) => setCategory(event.target.value)}
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
              {t('Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
              {t('New AI employee')}
            </Button>
          </Space>
        </Flex>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
          <Table<SettingsAIEmployee>
            rowKey="username"
            loading={loading}
            columns={columns}
            dataSource={employees}
            className={fillHeightTableClassName}
            isDraggable
            onSortEnd={handleSortEnd}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              defaultPageSize: 20,
              showTotal: (total) => t('Total {{count}} items', { count: total }),
            }}
            scroll={{ x: 'max-content', y: '100%' }}
          />
        </div>
      </Flex>
    </Card>
  );
};

const AIEmployeeDrawerContent: React.FC<{
  editingRecord?: SettingsAIEmployee;
  knowledgeBaseEnabled: boolean;
  onSubmitted: () => Promise<void>;
}> = ({ editingRecord, knowledgeBaseEnabled, onSubmitted }) => {
  const app = useApp();
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<EmployeeFormValues>();
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('profile');
  const [formDirty, setFormDirty] = useState(false);
  const initialValuesRef = useRef<EmployeeFormValues>();
  if (!initialValuesRef.current) {
    initialValuesRef.current = editingRecord
      ? {
          ...editingRecord,
          _aboutMode: editingRecord.builtIn ? (editingRecord.about ? 'custom' : 'system') : undefined,
        }
      : createInitialEmployeeValues(t);
  }
  const initialValues = initialValuesRef.current;
  const { Header, Footer } = ctx.view;

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const requestClose = useUnsavedChangesBeforeClose({
    view: ctx.view,
    form,
    initialValues,
    dirty: formDirty,
    title: t('Unsaved changes'),
    content: t("Are you sure you don't want to save?"),
  });

  const handleFinish = async (values: EmployeeFormValues) => {
    setSaving(true);
    try {
      const allValues = form.getFieldsValue(true);
      const submitValues = buildEmployeeSubmitValues(values, allValues);
      if (editingRecord) {
        await updateAIEmployee(app.apiClient, submitValues);
      } else {
        await createAIEmployee(app.apiClient, submitValues);
      }
      message.success(t('Saved successfully'));
      await onSubmitted();
      await ctx.view.close(undefined, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title={editingRecord ? t('Edit AI employee') : t('New AI employee')} />
      <Spin spinning={saving}>
        <Form<EmployeeFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={() => setFormDirty(true)}
        >
          <EmployeeForm
            apiClient={app.apiClient}
            activeTab={activeFormTab}
            edit={!!editingRecord}
            onTabChange={setActiveFormTab}
            record={editingRecord}
            knowledgeBaseEnabled={knowledgeBaseEnabled}
          />
        </Form>
      </Spin>
      <Footer>
        <Flex justify="end" gap="small">
          <Button onClick={requestClose}>{t('Cancel')}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t('Submit')}
          </Button>
        </Flex>
      </Footer>
    </>
  );
};

export default EmployeesPage;
