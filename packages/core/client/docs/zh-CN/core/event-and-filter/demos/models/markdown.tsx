
import React from 'react';
import { Card, Divider, Input, InputNumber, Select } from 'antd';
import { FilterFlowManager, BaseModel, useObservableModel, useApplyFilters } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observableModelManager } from '@nocobase/client';
import { observer } from '@formily/react';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册Markdown渲染过滤器
filterFlowManager.addFilter({
  name: 'block:markdown:options',
  title: 'Markdown区块',
  description: '处理Markdown内容',
  uiSchema: {},
  handler: ((model: BaseModel, params) => {
    // 获取参数
    const { content: srcContent, height, template } = params || {};    
    let content = srcContent;
    if (template === 'handlebars') { // 使用handlebars模板
        content = Handlebars.compile(srcContent)({
            var1: 'variable 1',
            var2: 'variable 2',
            var3: 'variable 3',
        });
    }
    // 使用setProps更新模型的属性
    model.setProps({
      content: MarkdownIt().render(content),
      height,
      template,
    });
  }),
});

// 创建过滤器流
filterFlowManager.addFlow({
  key: 'block:markdown',
  title: 'Markdown区块流程',
  steps: [
    {
      key: 'block:markdown:options',
      filterName: 'block:markdown:options',
      title: 'Markdown选项',
    }
  ],
});

// 新增测试model并设置初始参数
const model = observableModelManager.getModel('markdown-block');
// 设置过滤器参数
model.setFilterParams('block:markdown', {
    'block:markdown:options': {
        content: '# Hello NocoBase\n\n这是一个**响应式**的 {{var1}} 示例',
        height: 200,
        template: 'handlebars',
    }
});

const MarkdownSettings = observer(({ model }: { model: BaseModel }) => {
  const props = model.getProps();
  const filterParams = model.filterParams['block:markdown']?.['block:markdown:options'];
  const updateModelValue = (key, value) => {
    const currentParams = model.filterParams['block:markdown']?.['block:markdown:options'] || {};
    model.setFilterParams('block:markdown', 'block:markdown:options', {
      ...currentParams,
      [key]: value
    });
  };

  return <>
    <Card title="Markdown选项">
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontWeight: 'bold' }}>Markdown内容：</label>
        </div>
        <Input.TextArea 
          value={filterParams.content} 
          onChange={(e) => {
            updateModelValue('content', e.target.value);
          }}
          rows={6}
          placeholder="请输入Markdown内容"
        />
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>高度设置：</label>
        <InputNumber 
          value={filterParams.height} 
          onChange={(value) => {
            updateModelValue('height', value);
          }}
          placeholder="高度"
          style={{ width: 120 }}
          addonAfter="px"
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>模板类型：</label>
        <Select 
          value={filterParams.template} 
          onChange={(value) => {
            updateModelValue('template', value);
          }}
          style={{ width: 200 }}
          placeholder="请选择模板类型"
          options={[
            { label: '普通文本', value: 'plain' },
            { label: 'Handlebars模板', value: 'handlebars' }
          ]}
        />
      </div>
    </Card>
  </>
});

// 修改Markdown渲染组件，支持显示原始内容
const Markdown = ({ content, height }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

// Markdown区块组件 - 使用observer包装以响应数据变化
const MarkdownBlock = observer(({ uid }: { uid: string }) => {
  const model = useObservableModel(uid);
  useApplyFilters(filterFlowManager, 'block:markdown', model);

  const props = model.getProps();
  
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
        <MarkdownSettings model={model} />
        <Divider />
        <Markdown content={props.content} height={props.height} />
    </div>
  );
});

export default function Demo() {
  return <MarkdownBlock uid="markdown-block" />;
}
