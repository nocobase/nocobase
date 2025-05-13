import React, { useState } from 'react';
import { Card, Divider, Form, Input, InputNumber, Select, Button } from 'antd';
import { FilterFlowManager, FilterHandler, BaseModel, useObservableModel, useApplyFilters } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observableModelManager } from '@nocobase/client';

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

// 新增测试model
const model = observableModelManager.getModel('markdown-block');
model.setFilterParams('block:markdown', {
    'block:markdown:options': {
        content: 'Hello, world!',
        height: 200,
        template: 'handlebars',
    }
});

const MarkdownSettings = ({ model }: { model: BaseModel }) => {
  const props = model.getProps();

  return <>
    <Card title="Markdown选项">
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontWeight: 'bold' }}>Markdown内容：</label>
        </div>
        <Input.TextArea 
          value={props.content} 
          onChange={(e) => {
            model.setProps('content', e.target.value);
          }}
          rows={6}
          placeholder="请输入Markdown内容"
        />
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>高度设置：</label>
        <InputNumber 
          value={props.height} 
          onChange={(value) => {
            model.setProps('height', value);
          }}
          placeholder="高度"
          style={{ width: 120 }}
          addonAfter="px"
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>模板类型：</label>
        <Select 
          value={props.template} 
          onChange={(value) => {
            model.setProps('template', value);
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
}

const Markdonw = ({ content, height }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

// Markdown区块组件
const MarkdownBlock = ({ uid }: { uid: string }) => {
  const model = useObservableModel(uid);
  useApplyFilters(filterFlowManager, 'block:markdown', model);
  const props = model.getProps();
  
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
        <MarkdownSettings model={model} />
        <Divider />
        <Markdonw content={props.content} height={props.height} />
    </div>
  );
};

export default function Demo() {
  return <MarkdownBlock uid="markdown-block" />;
}
