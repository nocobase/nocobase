# 插件设置示例

本文档将详细介绍如何为 NocoBase 插件添加设置页面和配置选项。

## 插件设置基础

### 设置页面结构

插件设置页面允许用户配置插件的行为和选项。每个插件可以有一个或多个设置页面。

### 基本设置页面

```typescript
// src/client/index.tsx
import { Plugin } from '@nocobase/client';
import { PluginSettingsPage } from './pages/PluginSettingsPage';

class PluginSettingsPlugin extends Plugin {
  async load() {
    // 添加插件设置页面
    this.app.pluginSettingsManager.add('my-plugin', {
      title: '我的插件设置',
      icon: 'SettingOutlined',
      Component: PluginSettingsPage,
      aclSnippet: 'pm.my-plugin.settings',
    });
  }
}
```

## 设置页面组件

### 基础设置页面

```typescript
// src/client/pages/PluginSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Form,
  Input,
  Switch,
  Button,
  Space,
  message,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const PluginSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  
  // 获取当前设置
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // 从服务器获取设置
      const settings = await getPluginSettings();
      setInitialValues(settings);
      form.setFieldsValue(settings);
    } catch (error) {
      message.error(t('获取设置失败'));
    } finally {
      setLoading(false);
    }
  };
  
  const onFinish = async (values) => {
    try {
      setLoading(true);
      // 保存设置
      await savePluginSettings(values);
      message.success(t('设置保存成功'));
    } catch (error) {
      message.error(t('设置保存失败'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Page>
      <Card title={t('插件设置')}>
        <Form
          form={form}
          initialValues={initialValues}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="apiKey"
            label={t('API密钥')}
            rules={[{ required: true, message: t('请输入API密钥') }]}
          >
            <Input.Password placeholder={t('请输入API密钥')} />
          </Form.Item>
          
          <Form.Item
            name="enableFeature"
            label={t('启用功能')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="maxRetries"
            label={t('最大重试次数')}
            rules={[{ required: true, message: t('请输入最大重试次数') }]}
          >
            <Input type="number" min={0} max={10} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('保存设置')}
              </Button>
              <Button onClick={fetchSettings} loading={loading}>
                {t('刷新')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Page>
  );
};

// 模拟API函数
async function getPluginSettings() {
  // 实际应该调用服务器API
  return {
    apiKey: '',
    enableFeature: true,
    maxRetries: 3,
  };
}

async function savePluginSettings(settings) {
  // 实际应该调用服务器API
  console.log('保存设置:', settings);
}
```

## 多标签设置页面

### 选项卡式设置页面

```typescript
// src/client/pages/MultiTabSettingsPage.tsx
import React, { useState } from 'react';
import {
  Page,
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  message,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs;

export const MultiTabSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [forms] = useState({
    general: Form.useForm()[0],
    advanced: Form.useForm()[0],
    security: Form.useForm()[0],
  });
  
  const handleSave = async (tabKey) => {
    try {
      const values = await forms[tabKey].validateFields();
      await saveSettings(tabKey, values);
      message.success(t('设置保存成功'));
    } catch (error) {
      message.error(t('设置保存失败'));
    }
  };
  
  return (
    <Page>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button type="primary" onClick={() => handleSave(activeTab)}>
              {t('保存')}
            </Button>
          }
        >
          <TabPane tab={t('通用设置')} key="general">
            <Form
              form={forms.general}
              layout="vertical"
            >
              <Form.Item
                name="appName"
                label={t('应用名称')}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="description"
                label={t('描述')}
              >
                <Input.TextArea />
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab={t('高级设置')} key="advanced">
            <Form
              form={forms.advanced}
              layout="vertical"
            >
              <Form.Item
                name="timeout"
                label={t('超时时间(秒)')}
                rules={[{ required: true }]}
              >
                <Input type="number" min={1} max={300} />
              </Form.Item>
              
              <Form.Item
                name="concurrency"
                label={t('并发数')}
                rules={[{ required: true }]}
              >
                <Input type="number" min={1} max={10} />
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab={t('安全设置')} key="security">
            <Form
              form={forms.security}
              layout="vertical"
            >
              <Form.Item
                name="enableSSL"
                label={t('启用SSL')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="allowedIPs"
                label={t('允许的IP地址')}
              >
                <Input.TextArea placeholder={t('每行一个IP地址')} />
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
        
        <Space style={{ marginTop: 20 }}>
          <Button type="primary" onClick={() => handleSave(activeTab)}>
            {t('保存设置')}
          </Button>
          <Button onClick={() => forms[activeTab].resetFields()}>
            {t('重置')}
          </Button>
        </Space>
      </Card>
    </Page>
  );
};
```

## 表格配置设置

### 数据表格设置

```typescript
// src/client/pages/TableSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export const TableSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      // 获取配置项列表
      const data = await getConfigurationItems();
      setItems(data);
    } catch (error) {
      message.error(t('获取配置项失败'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };
  
  const handleDelete = async (record) => {
    try {
      await deleteConfigurationItem(record.id);
      message.success(t('删除成功'));
      fetchItems();
    } catch (error) {
      message.error(t('删除失败'));
    }
  };
  
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingItem) {
        // 更新
        await updateConfigurationItem(editingItem.id, values);
      } else {
        // 创建
        await createConfigurationItem(values);
      }
      
      message.success(t('保存成功'));
      setModalVisible(false);
      fetchItems();
    } catch (error) {
      message.error(t('保存失败'));
    }
  };
  
  const columns = [
    {
      title: t('名称'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('值'),
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: t('启用'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (enabled ? t('是') : t('否')),
    },
    {
      title: t('操作'),
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];
  
  return (
    <Page>
      <Card
        title={t('配置项管理')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('添加配置项')}
          </Button>
        }
      >
        <Table
          dataSource={items}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      </Card>
      
      <Modal
        title={editingItem ? t('编辑配置项') : t('添加配置项')}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('名称')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="value"
            label={t('值')}
            rules={[{ required: true }]}
          >
            <Input.TextArea />
          </Form.Item>
          
          <Form.Item
            name="enabled"
            label={t('启用')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
};

// 模拟API函数
async function getConfigurationItems() {
  return [
    { id: 1, name: 'setting1', value: 'value1', enabled: true },
    { id: 2, name: 'setting2', value: 'value2', enabled: false },
  ];
}

async function createConfigurationItem(data) {
  console.log('创建配置项:', data);
}

async function updateConfigurationItem(id, data) {
  console.log('更新配置项:', id, data);
}

async function deleteConfigurationItem(id) {
  console.log('删除配置项:', id);
}
```

## 表单配置设置

### 动态表单设置

```typescript
// src/client/pages/FormSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  List,
  Typography,
  Popconfirm,
  message,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const FormSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [fields, setFields] = useState([]);
  const [fieldTypes] = useState([
    { value: 'string', label: t('字符串') },
    { value: 'number', label: t('数字') },
    { value: 'boolean', label: t('布尔值') },
    { value: 'date', label: t('日期') },
    { value: 'select', label: t('选择框') },
  ]);
  
  useEffect(() => {
    // 加载现有字段配置
    loadFieldConfig();
  }, []);
  
  const loadFieldConfig = async () => {
    try {
      // 从服务器加载字段配置
      const config = await getFieldConfiguration();
      setFields(config.fields || []);
    } catch (error) {
      message.error(t('加载配置失败'));
    }
  };
  
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: Date.now(),
        name: '',
        label: '',
        type: 'string',
        required: false,
      },
    ]);
  };
  
  const handleRemoveField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };
  
  const handleFieldChange = (id, field, value) => {
    setFields(
      fields.map(f => 
        f.id === id ? { ...f, [field]: value } : f
      )
    );
  };
  
  const handleSave = async () => {
    try {
      // 保存字段配置
      await saveFieldConfiguration({ fields });
      message.success(t('配置保存成功'));
    } catch (error) {
      message.error(t('配置保存失败'));
    }
  };
  
  return (
    <Page>
      <Card title={t('表单字段配置')}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <List
            dataSource={fields}
            renderItem={(field) => (
              <List.Item
                actions={[
                  <Popconfirm
                    title={t('确定要删除这个字段吗？')}
                    onConfirm={() => handleRemoveField(field.id)}
                  >
                    <Button type="text" icon={<DeleteOutlined />} danger />
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Input
                      placeholder={t('字段名')}
                      value={field.name}
                      onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                      style={{ width: 150 }}
                    />
                    <Input
                      placeholder={t('标签')}
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      style={{ width: 150 }}
                    />
                    <Select
                      value={field.type}
                      options={fieldTypes}
                      onChange={(value) => handleFieldChange(field.id, 'type', value)}
                      style={{ width: 120 }}
                    />
                    <Space>
                      <Text>{t('必填')}:</Text>
                      <Select
                        value={field.required}
                        options={[
                          { value: true, label: t('是') },
                          { value: false, label: t('否') },
                        ]}
                        onChange={(value) => handleFieldChange(field.id, 'required', value)}
                        style={{ width: 80 }}
                      />
                    </Space>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
          
          <Space>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddField}
            >
              {t('添加字段')}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {t('保存配置')}
            </Button>
          </Space>
        </Space>
      </Card>
    </Page>
  );
};

// 模拟API函数
async function getFieldConfiguration() {
  return {
    fields: [
      { id: 1, name: 'name', label: '姓名', type: 'string', required: true },
      { id: 2, name: 'email', label: '邮箱', type: 'string', required: true },
    ],
  };
}

async function saveFieldConfiguration(config) {
  console.log('保存字段配置:', config);
}
```

## 服务端设置处理

### 设置存储和验证

```typescript
// src/server/settings.ts
import { Repository } from '@nocobase/database';

export class PluginSettings {
  private repository: Repository;
  
  constructor(repository: Repository) {
    this.repository = repository;
  }
  
  async get(key: string) {
    const setting = await this.repository.findOne({
      filter: { key },
    });
    
    return setting ? setting.value : null;
  }
  
  async set(key: string, value: any) {
    const existing = await this.repository.findOne({
      filter: { key },
    });
    
    if (existing) {
      await this.repository.update({
        filter: { key },
        values: { value },
      });
    } else {
      await this.repository.create({
        values: { key, value },
      });
    }
  }
  
  async getAll() {
    const settings = await this.repository.find();
    const result = {};
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }
  
  async validate(settings: any) {
    const errors = [];
    
    // 验证必填字段
    if (!settings.apiKey) {
      errors.push('API密钥不能为空');
    }
    
    // 验证数字范围
    if (settings.maxRetries !== undefined) {
      const maxRetries = parseInt(settings.maxRetries);
      if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 10) {
        errors.push('最大重试次数必须是0-10之间的数字');
      }
    }
    
    return errors;
  }
}
```

### 设置API接口

```typescript
// src/server/routes/settings.ts
import { Context, Next } from '@nocobase/server';
import { PluginSettings } from '../settings';

export class SettingsController {
  private settings: PluginSettings;
  
  constructor(settings: PluginSettings) {
    this.settings = settings;
  }
  
  async getSettings(ctx: Context, next: Next) {
    try {
      const settings = await this.settings.getAll();
      ctx.body = { data: settings };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
    
    await next();
  }
  
  async updateSettings(ctx: Context, next: Next) {
    try {
      const { settings } = ctx.action.params;
      
      // 验证设置
      const errors = await this.settings.validate(settings);
      if (errors.length > 0) {
        ctx.status = 400;
        ctx.body = { errors };
        return;
      }
      
      // 保存设置
      for (const [key, value] of Object.entries(settings)) {
        await this.settings.set(key, value);
      }
      
      ctx.body = { result: 'success' };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
    
    await next();
  }
}
```

### 在插件中集成设置

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { PluginSettings } from './settings';
import { SettingsController } from './routes/settings';

export class PluginSettingsPlugin extends Plugin {
  private settings: PluginSettings;
  private controller: SettingsController;
  
  async load() {
    // 初始化设置管理器
    this.settings = new PluginSettings(
      this.app.db.getRepository('pluginSettings')
    );
    
    // 初始化控制器
    this.controller = new SettingsController(this.settings);
    
    // 注册API路由
    this.app.resource({
      name: 'pluginSettings',
      actions: {
        async get(ctx, next) {
          await this.controller.getSettings(ctx, next);
        },
        async update(ctx, next) {
          await this.controller.updateSettings(ctx, next);
        },
      },
    });
    
    // 设置权限
    this.app.acl.allow('pluginSettings', 'get', 'loggedIn');
    this.app.acl.allow('pluginSettings', 'update', 'admin');
  }
}
```

## 设置数据模型

### 设置表结构

```typescript
// src/server/collections/pluginSettings.ts
import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'pluginSettings',
  title: '插件设置',
  fields: [
    {
      type: 'string',
      name: 'key',
      title: '键名',
      unique: true,
      required: true,
    },
    {
      type: 'json',
      name: 'value',
      title: '值',
    },
    {
      type: 'string',
      name: 'plugin',
      title: '插件名',
      required: true,
    },
    {
      type: 'text',
      name: 'description',
      title: '描述',
    },
  ],
} as CollectionOptions;
```

## 设置权限控制

### ACL权限设置

```typescript
// src/server/acl.ts
class PluginSettingsACL {
  setup(app) {
    // 管理员可以管理所有插件设置
    app.acl.allow('pluginSettings', '*', 'admin');
    
    // 普通用户可以查看自己的插件设置
    app.acl.allow('pluginSettings', 'get', 'loggedIn');
    
    // 特定角色可以管理特定插件设置
    app.acl.define('plugin-manager', (ctx) => {
      // 检查用户是否有插件管理权限
      return this.checkPluginManagerRole(ctx);
    });
    
    app.acl.allow('pluginSettings', 'update', 'plugin-manager');
  }
  
  private checkPluginManagerRole(ctx) {
    // 实现角色检查逻辑
    return ctx.state.user?.role === 'plugin-manager';
  }
}
```

## 设置测试

### 编写设置测试

```typescript
// src/client/__tests__/pages/PluginSettingsPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PluginSettingsPage } from '../../pages/PluginSettingsPage';

// Mock API函数
jest.mock('../../api/settings', () => ({
  getPluginSettings: jest.fn().mockResolvedValue({
    apiKey: 'test-key',
    enableFeature: true,
    maxRetries: 3,
  }),
  savePluginSettings: jest.fn().mockResolvedValue({}),
}));

describe('PluginSettingsPage', () => {
  it('should load and display settings', async () => {
    render(<PluginSettingsPage />);
    
    // 等待设置加载完成
    await waitFor(() => {
      expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });
  
  it('should save settings when form is submitted', async () => {
    render(<PluginSettingsPage />);
    
    // 等待设置加载
    await waitFor(() => {
      expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
    });
    
    // 修改设置
    const apiKeyInput = screen.getByDisplayValue('test-key');
    fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });
    
    // 提交表单
    const saveButton = screen.getByText('保存设置');
    fireEvent.click(saveButton);
    
    // 验证保存调用
    await waitFor(() => {
      expect(require('../../api/settings').savePluginSettings)
        .toHaveBeenCalledWith({
          apiKey: 'new-key',
          enableFeature: true,
          maxRetries: 3,
        });
    });
  });
});
```

## 设置最佳实践

### 1. 设置验证

```typescript
// 始终验证用户输入
async validateSettings(settings) {
  const errors = [];
  
  // 验证必填字段
  if (!settings.requiredField) {
    errors.push('必填字段不能为空');
  }
  
  // 验证数据类型
  if (settings.numberField && isNaN(Number(settings.numberField))) {
    errors.push('数字字段必须是有效数字');
  }
  
  // 验证格式
  if (settings.email && !this.isValidEmail(settings.email)) {
    errors.push('邮箱格式不正确');
  }
  
  return errors;
}

private isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 2. 设置缓存

```typescript
// 缓存频繁访问的设置
class CachedPluginSettings extends PluginSettings {
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟
  
  async get(key: string) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }
    
    const value = await super.get(key);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    
    return value;
  }
  
  async set(key: string, value: any) {
    await super.set(key, value);
    // 清除缓存
    this.cache.delete(key);
  }
}
```

### 3. 设置迁移

```typescript
// 处理设置版本迁移
class MigratablePluginSettings extends PluginSettings {
  private version = 2;
  
  async getSettings() {
    const settings = await this.getAll();
    const currentVersion = settings.version || 1;
    
    // 执行迁移
    if (currentVersion < this.version) {
      const migrated = await this.migrateSettings(settings, currentVersion);
      await this.setAll(migrated);
      return migrated;
    }
    
    return settings;
  }
  
  private async migrateSettings(settings, fromVersion) {
    let migrated = { ...settings };
    
    // 从版本1迁移到版本2
    if (fromVersion < 2) {
      // 迁移逻辑
      migrated.newField = migrated.oldField || 'default';
      delete migrated.oldField;
    }
    
    migrated.version = this.version;
    return migrated;
  }
}
```

## 总结

通过以上示例，您可以为 NocoBase 插件创建功能完整的设置页面，包括：

1. 基础设置页面
2. 多标签设置页面
3. 表格配置设置
4. 表单配置设置
5. 服务端设置处理
6. 权限控制
7. 测试和验证

这些示例涵盖了插件设置的各个方面，您可以根据具体需求进行调整和扩展。
