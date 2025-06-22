/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Space, Card, Drawer, message } from 'antd';
import { FlowModel, DefaultStructure, FlowModelRenderer } from '@nocobase/flow-engine';
import { SettingOutlined, BranchesOutlined, DownOutlined, UpOutlined, DeleteOutlined } from '@ant-design/icons';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { LightModel } from './LightModel';

interface LightComConfigPageProps {
  componentKey?: string;
  title?: string;
  showTemplateDrawer?: boolean;
  showFlowsDrawer?: boolean;
}

interface LightComConfigPageStructure extends DefaultStructure {
  subModels?: {
    previewComponent?: FlowModel<DefaultStructure>;
  };
}

export class LightComConfigPageModel extends FlowModel<LightComConfigPageStructure> {
  declare props: LightComConfigPageProps;

  public componentKey = '';

  public componentData = observable({
    key: '',
    title: '',
    description: '',
    template: '',
    flows: [] as string[],
  });

  onInit(options: any): void {
    super.onInit(options);
    console.log('LightComConfigPageModel.onInit:', options, 'props:', this.props);
    this.componentKey = this.props.componentKey || '';
    console.log('Stored componentKey:', this.componentKey);
    this.loadComponentData();
  }

  private async loadComponentData() {
    if (!this.componentKey) return;

    try {
      const apiClient = this.flowEngine.getContext()?.api;
      if (!apiClient) return;

      const response = await apiClient.resource('lightComponents').get({
        filterByTk: this.componentKey,
      });

      const data = response.data?.data;
      if (data) {
        Object.assign(this.componentData, data);
      }
      this.updatePreviewComponent();
    } catch (error) {
      console.error('Failed to load component data:', error);
      message.error('Failed to load component data');
    }
  }

  private executeFlowCode(code: string): any {
    try {
      // 创建一个沙箱函数来执行代码
      const func = new Function(code);
      return func();
    } catch (error) {
      console.error('Flow code execution error:', error);
      return null;
    }
  }

  private updatePreviewComponent() {
    if (!this.componentData) return;

    // 1. 如果已存在previewComponent，先销毁它
    if (this.subModels?.previewComponent) {
      try {
        this.subModels.previewComponent.destroy();
      } catch (error) {
        console.error('Failed to destroy preview component:', error);
      }
    }

    // 2. 遍历flows数组，执行每段代码并收集结果
    const flowDefinitions: any[] = [];
    if (this.componentData.flows && this.componentData.flows.length > 0) {
      this.componentData.flows.forEach((flowCode, index) => {
        if (flowCode.trim()) {
          const result = this.executeFlowCode(flowCode);
          if (result) {
            flowDefinitions.push(result);
          }
        }
      });
    }

    console.log('Flow definitions collected:', flowDefinitions);

    // 3. 使用LightModel.extends()创建扩展的PreviewLightModel
    const PreviewLightModel = (LightModel as any).extends(flowDefinitions);

    // 设置模型名称
    PreviewLightModel.name = 'PreviewLightModel';

    // 4. 注册新的模型到flowEngine
    try {
      this.flowEngine.registerModels({
        PreviewLightModel: PreviewLightModel,
      });
    } catch (error) {
      console.warn('Model already registered, continuing...', error);
    }

    // 5. 使用PreviewLightModel创建预览组件
    const previewComponent = this.flowEngine.createModel({
      use: 'PreviewLightModel',
      uid: `preview-${this.componentKey}-${Date.now()}`, // 添加时间戳确保唯一性
      props: {
        componentKey: this.componentKey,
        template: this.componentData?.template || '',
        title: this.componentData?.title || 'Light Component',
      },
    });

    this.setSubModel('previewComponent', previewComponent);
    console.log('Preview component updated with flows:', previewComponent);
  }

  async saveConfiguration() {
    console.log('saveConfiguration called, componentKey:', this.componentKey, 'componentData:', this.componentData);

    if (!this.componentKey || !this.componentData) {
      console.log('Aborting save: missing componentKey or componentData');
      return;
    }

    console.log('Saving configuration:', this.componentData);

    try {
      const apiClient = this.flowEngine.getContext()?.api;
      if (!apiClient) return;

      await apiClient.resource('lightComponents').update({
        filterByTk: this.componentKey,
        values: {
          key: this.componentData.key,
          title: this.componentData.title,
          description: this.componentData.description,
          template: this.componentData.template,
          flows: this.componentData.flows,
        },
      });

      message.success('Configuration saved successfully');
      this.updatePreviewComponent();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      message.error('Failed to save configuration');
    }
  }

  openTemplateDrawer() {
    this.setProps('showTemplateDrawer', true);
  }

  closeTemplateDrawer() {
    this.setProps('showTemplateDrawer', false);
  }

  openFlowsDrawer() {
    this.setProps('showFlowsDrawer', true);
  }

  closeFlowsDrawer() {
    this.setProps('showFlowsDrawer', false);
  }

  updateTemplate(template: string) {
    if (this.componentData) {
      this.componentData.template = template;
      console.log('Template updated:', template);
    }
  }

  updateFlows(flows: string[]) {
    if (this.componentData) {
      this.componentData.flows = flows;
      console.log('Flows updated:', flows);
    }
  }

  render() {
    const { title = 'Light Component Configuration', showTemplateDrawer, showFlowsDrawer } = this.props;

    const RenderComponent = observer(() => (
      <div style={{ padding: '24px' }}>
        {/* Header with action buttons */}
        <Card
          title={title}
          extra={
            <Space>
              <Button icon={<SettingOutlined />} onClick={() => this.openTemplateDrawer()}>
                设置模板
              </Button>
              <Button icon={<BranchesOutlined />} onClick={() => this.openFlowsDrawer()}>
                配置Flows
              </Button>
            </Space>
          }
        >
          {/* Preview area */}
          <div style={{ minHeight: '400px', border: '1px dashed #d9d9d9', borderRadius: '6px', padding: '16px' }}>
            {this.subModels?.previewComponent ? (
              <FlowModelRenderer
                model={this.subModels.previewComponent}
                showFlowSettings={true}
                hideRemoveInSettings={true}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>暂无预览内容</div>
            )}
          </div>
        </Card>

        {/* Template Drawer */}
        <Drawer
          title="设置模板"
          placement="right"
          width={800}
          open={showTemplateDrawer}
          onClose={() => this.closeTemplateDrawer()}
        >
          <TemplateEditor
            template={this.componentData?.template}
            onUpdate={(template) => this.updateTemplate(template)}
            onSave={async () => {
              await this.saveConfiguration();
              this.updatePreviewComponent();
              this.closeTemplateDrawer();
            }}
          />
        </Drawer>

        {/* Flows Drawer */}
        <Drawer
          title="配置Flows"
          placement="right"
          width={800}
          open={showFlowsDrawer}
          onClose={() => this.closeFlowsDrawer()}
        >
          <FlowsEditor
            flows={this.componentData?.flows}
            onUpdate={(flows) => this.updateFlows(flows)}
            onSave={async () => {
              await this.saveConfiguration();
              this.updatePreviewComponent();
              this.closeFlowsDrawer();
            }}
          />
        </Drawer>
      </div>
    ));

    return <RenderComponent />;
  }
}

// Simple Template Editor Component
const TemplateEditor: React.FC<{
  template?: string;
  onUpdate: (template: string) => void;
  onSave: () => void;
}> = ({ template, onUpdate, onSave }) => {
  const [localTemplate, setLocalTemplate] = React.useState(template || '');

  React.useEffect(() => {
    setLocalTemplate(template || '');
  }, [template]);

  const handleUpdate = (value: string) => {
    setLocalTemplate(value);
    onUpdate(value);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>组件模板:</label>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>组件模板编辑</div>
          <textarea
            style={{
              width: '100%',
              height: '400px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.5',
            }}
            value={localTemplate}
            onChange={(e) => handleUpdate(e.target.value)}
            placeholder="请输入组件模板内容..."
          />
        </div>

        <Button
          type="primary"
          onClick={async () => {
            console.log('Template save button clicked');
            await onSave();
          }}
          style={{ width: '100%' }}
        >
          保存模板
        </Button>
      </Space>
    </div>
  );
};

// Enhanced Flows Editor Component with JS Code Support
const FlowsEditor: React.FC<{
  flows?: string[];
  onUpdate: (flows: string[]) => void;
  onSave: () => void;
}> = ({ flows, onUpdate, onSave }) => {
  const [localFlows, setLocalFlows] = React.useState<string[]>(flows || ['']);
  const [collapsedStates, setCollapsedStates] = React.useState<boolean[]>([]);

  React.useEffect(() => {
    const flowsArray = flows || [''];
    setLocalFlows(flowsArray);
    setCollapsedStates(new Array(flowsArray.length).fill(false));
  }, [flows]);

  const handleFlowUpdate = (index: number, code: string) => {
    const updated = [...localFlows];
    updated[index] = code;
    setLocalFlows(updated);
    onUpdate(updated);
  };

  const addFlow = () => {
    const updated = [...localFlows, '// 新的 Flow 代码\nconsole.log("Hello Flow!");'];
    setLocalFlows(updated);
    setCollapsedStates([...collapsedStates, false]);
    onUpdate(updated);
  };

  const removeFlow = (index: number) => {
    if (localFlows.length <= 1) return; // 至少保留一个

    const updated = localFlows.filter((_, i) => i !== index);
    const updatedCollapsed = collapsedStates.filter((_, i) => i !== index);
    setLocalFlows(updated);
    setCollapsedStates(updatedCollapsed);
    onUpdate(updated);
  };

  const toggleCollapse = (index: number) => {
    const updated = [...collapsedStates];
    updated[index] = !updated[index];
    setCollapsedStates(updated);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Flows 代码配置:</label>
              <div style={{ fontSize: '12px', color: '#666' }}>编写 JavaScript 代码，每个 Flow 独立执行</div>
            </div>
            <Button type="dashed" onClick={addFlow} style={{ flexShrink: 0 }}>
              + 添加 Flow
            </Button>
          </div>

          {localFlows.map((flow, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                marginBottom: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Flow Header */}
              <div
                style={{
                  background: '#fafafa',
                  padding: '8px 12px',
                  borderBottom: collapsedStates[index] ? 'none' : '1px solid #d9d9d9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Flow {index + 1}</span>
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={collapsedStates[index] ? <DownOutlined /> : <UpOutlined />}
                    onClick={() => toggleCollapse(index)}
                  />
                  {localFlows.length > 1 && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFlow(index)}
                    />
                  )}
                </Space>
              </div>

              {/* Flow Content */}
              {!collapsedStates[index] && (
                <div style={{ padding: '12px' }}>
                  <textarea
                    style={{
                      width: '100%',
                      height: '200px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '8px',
                      resize: 'vertical',
                    }}
                    value={flow}
                    onChange={(e) => handleFlowUpdate(index, e.target.value)}
                    placeholder={`// Flow ${index + 1} 的 JavaScript 代码\n// 例如:\nconsole.log('Flow ${
                      index + 1
                    } 执行');\n// 在这里编写你的逻辑...`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          type="primary"
          onClick={async () => {
            console.log('Flows save button clicked');
            await onSave();
          }}
          style={{ width: '100%' }}
        >
          保存 Flows 配置
        </Button>
      </Space>
    </div>
  );
};

LightComConfigPageModel.registerFlow({
  key: 'default',
  title: 'Initialize Config Page',
  auto: true,
  sort: 0,
  steps: {
    loadData: {
      title: 'Load Component Data',
      handler: async (ctx, params) => {
        // Simple data loading without complex actions
        const { componentKey } = ctx.model.props;
        if (componentKey) {
          try {
            const apiClient = ctx.globals?.api;
            if (apiClient) {
              const response = await apiClient.resource('lightComponents').get({
                filterByTk: componentKey,
              });

              const componentData = response.data?.data;
              if (componentData) {
                Object.assign((ctx.model as LightComConfigPageModel).componentData, componentData);
                ctx.model.setProps({ title: `配置 ${componentData.title}` });

                // Create simple preview component
                const previewComponent = ctx.model.flowEngine.createModel({
                  use: 'LightModel',
                  uid: `preview-${componentKey}`,
                  props: {
                    componentKey,
                    template: componentData.template || '',
                    title: componentData.title || 'Light Component',
                  },
                });

                ctx.model.setSubModel('previewComponent', previewComponent);
              }
            }
          } catch (error) {
            console.error('Failed to load component data:', error);
          }
        }
      },
    },
  },
});
