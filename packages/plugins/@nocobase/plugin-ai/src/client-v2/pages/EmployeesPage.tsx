/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Collapse,
  Drawer,
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
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { CollapseProps, MenuProps, TableProps } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApp } from '@nocobase/client-v2';
import { observer, randomId } from '@nocobase/flow-engine';
import type { APIClient, SkillsEntry, ToolsEntry } from '@nocobase/client-v2';
import { useT } from '../locale';
import { avatars, avatarsMap } from '../ai-employees/avatars';
import { useAIConfigRepository } from '../repositories/hooks/useAIConfigRepository';
import type { LLMServiceItem } from '../repositories/AIConfigRepository';
import type { AIEmployee as ChatAIEmployee } from '../ai-employees/types';

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
  });
  const data = readResponseData(response);
  const meta = readResponseMeta(response);
  return {
    data: Array.isArray(data) ? data.filter(isAIEmployee) : [],
    total: typeof meta.count === 'number' ? meta.count : undefined,
  };
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
    <Space direction="vertical">
      <Avatar shape="square" size={token.controlHeightLG * 2} src={avatars(current)} />
      {disabled ? null : (
        <List
          grid={{ gutter: token.marginSM, column: 10 }}
          dataSource={avatarList}
          renderItem={(item) => (
            <List.Item>
              <Button
                aria-label={item.seed}
                type="text"
                onClick={() => onChange?.(item.seed)}
                style={{
                  borderColor: current === item.seed ? token.colorPrimary : token.colorBorder,
                  borderStyle: 'solid',
                  borderWidth: token.lineWidth,
                }}
              >
                <Avatar size={token.controlHeightLG} src={item.uri} />
              </Button>
            </List.Item>
          )}
        />
      )}
    </Space>
  );
};

const ProfileSettings: React.FC<{ edit: boolean; builtIn?: boolean }> = ({ edit, builtIn }) => {
  const t = useT();
  return (
    <>
      <Form.Item name="username" label={t('Username')} rules={[{ required: true }]} preserve>
        <Input disabled={edit} />
      </Form.Item>
      <Form.Item name="nickname" label={t('Nickname')} rules={[{ required: true }]} preserve>
        <Input disabled={builtIn} />
      </Form.Item>
      <Form.Item name="position" label={t('Position')} tooltip={t('Position description')} preserve>
        <Input disabled={builtIn} placeholder={t('Position placeholder')} />
      </Form.Item>
      <Form.Item name="avatar" label={t('Avatar')} preserve>
        <AvatarSelect disabled={builtIn} />
      </Form.Item>
      <Form.Item name="bio" label={t('Bio')} preserve>
        <Input.TextArea disabled={builtIn} placeholder={t('Bio placeholder')} />
      </Form.Item>
      <Form.Item name="greeting" label={t('Greeting message')} preserve>
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
        <Form.Item name="about" label={t('Role setting')} preserve>
          <Input.TextArea placeholder={t('Role setting placeholder')} autoSize={{ minRows: 15 }} />
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
  const rawModelSettings = Form.useWatch('modelSettings', form);
  const modelSettings = useMemo(() => rawModelSettings ?? {}, [rawModelSettings]);
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
      form.setFieldValue('modelSettings', {
        ...modelSettings,
        ...values,
      });
    },
    [form, modelSettings],
  );

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
      <Form.Item label={<Typography.Text strong>{t('Enable dedicated model configuration')}</Typography.Text>} preserve>
        <Switch checked={enabled} onChange={(checked) => setModelSettings({ enabled: checked })} />
      </Form.Item>
      <Form.Item label={<Typography.Text strong>{t('Models')}</Typography.Text>} preserve>
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
  const skillSettings = Form.useWatch('skillSettings', form) ?? {};
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
  const translateText = useTranslatedText();
  const repo = useAIConfigRepository();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const skillSettings = Form.useWatch('skillSettings', form) ?? {};
  const selectedTools: EmployeeToolSetting[] = Array.isArray(skillSettings.tools) ? skillSettings.tools : [];
  const permissionOptions = [
    { label: t('Ask'), value: 'ASK' },
    { label: t('Allow'), value: 'ALLOW' },
  ];

  useEffect(() => {
    repo.getAITools().catch((error: unknown) => {
      console.error(error);
    });
  }, [repo]);

  const setTools = (tools: EmployeeToolSetting[]) => {
    form.setFieldValue('skillSettings', {
      ...skillSettings,
      tools,
    });
  };
  const selectedNames = new Set(selectedTools.map((item) => item.name));
  const toolsByName = new Map(repo.aiTools.map((tool) => [tool.definition.name, tool]));
  const generalTools = repo.aiTools.filter((tool) => tool.scope === 'GENERAL' && tool.from === 'loader');
  const specifiedTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope !== 'GENERAL' && tool.scope !== 'CUSTOM';
  });
  const customTools = selectedTools.filter((item) => toolsByName.get(item.name)?.scope === 'CUSTOM');
  const customAddTools: MenuProps['items'] = repo.aiTools
    .filter((tool) => tool.scope === 'CUSTOM' && !selectedNames.has(tool.definition.name))
    .map((tool) => ({
      key: tool.definition.name,
      label: (
        <div>
          <div>{translateText(tool.introduction?.title ?? tool.definition.name, tool.definition.name)}</div>
          <Typography.Text type="secondary">
            {translateText(tool.introduction?.about ?? tool.definition.description)}
          </Typography.Text>
        </div>
      ),
      onClick: () => {
        setTools([...selectedTools, { name: tool.definition.name, autoCall: false }]);
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
    if (!tool) {
      return null;
    }
    return (
      <List.Item
        key={item.name}
        extra={
          <Space>
            <Typography.Text>{t('Permission')}</Typography.Text>
            <Segmented
              size="small"
              options={permissionOptions}
              value={getPermissionValue(tool, item)}
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
        <div>{translateText(tool.introduction?.title ?? tool.definition.name, tool.definition.name)}</div>
        <Typography.Text type="secondary">
          {translateText(tool.introduction?.about ?? tool.definition.description)}
        </Typography.Text>
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
      <Dropdown menu={{ items: customAddTools }} disabled={!customAddTools?.length}>
        <Button type="primary" icon={<PlusOutlined />} onClick={(event) => event.stopPropagation()}>
          {t('Add tool')}
        </Button>
      </Dropdown>
    ),
    children: <List itemLayout="vertical" bordered dataSource={customTools} renderItem={renderCustomTool} />,
  });

  return repo.aiToolsLoading ? (
    <Spin />
  ) : (
    <Collapse
      ghost
      size="small"
      defaultActiveKey={builtIn && !customTools.length ? [] : ['custom-tools']}
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
      <Form.Item name="enableKnowledgeBase" label={t('Enable Knowledge Base')} valuePropName="checked" preserve>
        <Switch />
      </Form.Item>
      <Form.Item name="knowledgeBasePrompt" label={t('Knowledge Base Prompt')} rules={[{ required: true }]} preserve>
        <Input.TextArea disabled={!enableKnowledgeBase} autoSize={{ minRows: 5 }} />
      </Form.Item>
      <Form.Item
        name={['knowledgeBase', 'knowledgeBaseKeys']}
        label={t('Knowledge Base')}
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
      <Form.Item name={['knowledgeBase', 'topK']} label={t('Top K')} rules={[{ required: true }]} preserve>
        <InputNumber disabled={!enableKnowledgeBase} min={1} max={100} />
      </Form.Item>
      <Form.Item name={['knowledgeBase', 'score']} label={t('Score')} rules={[{ required: true }]} preserve>
        <InputNumber disabled={!enableKnowledgeBase} min={0} max={1} step={0.1} />
      </Form.Item>
    </>
  );
};

const EmployeeForm: React.FC<{
  apiClient: APIClientLike;
  edit: boolean;
  record?: SettingsAIEmployee;
  knowledgeBaseEnabled: boolean;
}> = ({ apiClient, edit, record, knowledgeBaseEnabled }) => {
  const t = useT();
  const form = Form.useFormInstance<EmployeeFormValues>();
  const chatSettings = Form.useWatch('chatSettings', form) ?? {};
  const builtIn = !!record?.builtIn;
  const showSkills = chatSettings.enableSkills !== false;
  const showTools = chatSettings.enableTools !== false;

  return (
    <Tabs
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
  const t = useT();
  const { message } = App.useApp();
  const repo = useAIConfigRepository();
  const [form] = Form.useForm<EmployeeFormValues>();
  const [category, setCategory] = useState<EmployeeCategory>('business');
  const [employees, setEmployees] = useState<SettingsAIEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SettingsAIEmployee | undefined>();
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const auth = app.apiClient.auth as { role?: string } | undefined;
  const isRoot = auth?.role === 'root';

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
    setEditingRecord(undefined);
    form.setFieldsValue(createInitialEmployeeValues(t));
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: SettingsAIEmployee) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      _aboutMode: record.builtIn ? (record.about ? 'custom' : 'system') : undefined,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values: EmployeeFormValues) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await updateAIEmployee(app.apiClient, values);
      } else {
        await createAIEmployee(app.apiClient, values);
      }
      message.success(t('Saved successfully'));
      closeDrawer();
      await refresh();
      await repo.refreshAIEmployees();
    } finally {
      setSaving(false);
    }
  };

  const columns: TableProps<SettingsAIEmployee>['columns'] = [
    {
      title: t('Avatar'),
      dataIndex: 'avatar',
      render: (value?: string) => (value ? <Avatar shape="circle" src={avatars(value)} /> : null),
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
        <Space split="|">
          <Button type="link" onClick={() => openEditDrawer(record)}>
            {t('Edit')}
          </Button>
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
            <Button type="link" danger>
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Flex vertical gap="middle">
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
        <Table<SettingsAIEmployee> rowKey="username" loading={loading} columns={columns} dataSource={employees} />
      </Flex>
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingRecord ? t('Edit AI employee') : t('New AI employee')}
        footer={
          <Flex justify="end" gap="small">
            <Button onClick={closeDrawer}>{t('Cancel')}</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {t('Submit')}
            </Button>
          </Flex>
        }
      >
        <Spin spinning={saving}>
          <Form<EmployeeFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <EmployeeForm
              apiClient={app.apiClient}
              edit={!!editingRecord}
              record={editingRecord}
              knowledgeBaseEnabled={knowledgeBaseEnabled}
            />
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
};

export default EmployeesPage;
