import React from 'react';
import { Card, Divider, Input, InputNumber, Select } from 'antd';
import { FilterFlowManager, BaseModel, useObservableModel, useApplyFilters, Plugin, FilterFlowProvider, Application } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observableModelManager } from '@nocobase/client';
import { observer } from '@formily/react';

// Markdown区块组件 - 使用observer包装以响应数据变化
const MarkdownBlock = observer(({ uid }: { uid: string }) => {
  const model = useObservableModel(uid);
  useApplyFilters('block:markdown', model);

  const props = model.getProps();
  
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
        <MarkdownSettings model={model} />
        <Divider />
        <Markdown content={props.content} height={props.height} />
    </div>
  );
});

const MarkdownSettings = observer(({ model }: { model: BaseModel }) => {
  const props = model.getProps();
  const filterParams = model.filterParams['block:markdown'] || {};
  
  const updateModelValue = (filterKey, key, value) => {
    const currentParams = filterParams[filterKey] || {};
    model.setFilterParams('block:markdown', filterKey, {
      ...currentParams,
      [key]: value
    });
  };

  // 从已分解的filter参数中读取值
  const contentValue = filterParams['block:markdown:content']?.content || '';
  const heightValue = filterParams['block:markdown:height']?.height || 200;
  const templateValue = filterParams['block:markdown:template']?.template || 'plain';

  return <>
    <Card title="Markdown选项">
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontWeight: 'bold' }}>Markdown内容：</label>
        </div>
        <Input.TextArea 
          value={contentValue} 
          onChange={(e) => {
            updateModelValue('block:markdown:content', 'content', e.target.value);
          }}
          rows={6}
          placeholder="请输入Markdown内容"
        />
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>高度设置：</label>
        <InputNumber 
          value={heightValue} 
          onChange={(value) => {
            updateModelValue('block:markdown:height', 'height', value);
          }}
          placeholder="高度"
          style={{ width: 120 }}
          addonAfter="px"
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: 8, width: 80 }}>模板类型：</label>
        <Select 
          value={templateValue} 
          onChange={(value) => {
            updateModelValue('block:markdown:template', 'template', value);
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

const Markdown = ({ content, height }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

// 创建Demo组件
const Demo = () => {
  return <MarkdownBlock uid="markdown-block" />;
};

// 自定义插件类
class DemoPlugin extends Plugin {
  async load() {
    // 注册模板过滤器
    this.app.filterFlowManager.addFilter({
      name: 'block:markdown:template',
      title: '模板引擎',
      description: '选择模板引擎',
      uiSchema: {},
      handler: ((model: BaseModel, params) => {
        // 获取参数
        const { template } = params || {};  
        // 使用setProps更新模型的属性
        model.setProps({
          template,
        });
      }),
    });
    
    // 注册高度过滤器
    this.app.filterFlowManager.addFilter({
      name: 'block:markdown:height',
      title: '高度设置',
      description: '设置内容显示区域高度',
      uiSchema: {},
      handler: ((model: BaseModel, params) => {
        // 获取参数
        const { height } = params || {};    
        // 使用setProps更新模型的属性
        model.setProps({
          height,
        });
      }),
    });
    
    // 注册内容过滤器
    this.app.filterFlowManager.addFilter({
      name: 'block:markdown:content',
      title: '内容设置',
      description: '设置Markdown内容',
      uiSchema: {},
      handler: ((model: BaseModel, params) => {
        // 获取参数
        const { content } = params || {};
        // 使用setProps更新模型的属性
        model.setProps({
          rawContent: content,
        });
      }),
    });
    
    // 注册Markdown渲染过滤器
    this.app.filterFlowManager.addFilter({
      name: 'block:markdown:render',
      title: 'Markdown解析',
      description: '解析Markdown内容',
      uiSchema: {},
      handler: ((model: BaseModel, params) => {
        // 获取模型当前属性
        const props = model.getProps();
        let content = props.rawContent;
        
        // 如果使用handlebars模板，先处理模板
        if (props.template === 'handlebars') { 
          content = Handlebars.compile(content)({
            var1: 'variable 1',
            var2: 'variable 2',
            var3: 'variable 3',
          });
        }
        
        // 渲染Markdown内容
        model.setProps({
          content: MarkdownIt().render(content),
        });
      }),
    });
    
    // 创建过滤器流
    this.app.filterFlowManager.addFlow({
      key: 'block:markdown',
      title: 'Markdown区块流程',
      steps: [
        {
          key: 'block:markdown:template',
          filterName: 'block:markdown:template',
          title: '引擎 template',
        },
        {
          key: 'block:markdown:height',
          filterName: 'block:markdown:height',
          title: '高度',
        },
        {
          key: 'block:markdown:content',
          filterName: 'block:markdown:content',
          title: '内容',
        },
        {
          key: 'block:markdown:render',
          filterName: 'block:markdown:render',
          title: '解析，没有 uiSchema MarkdownIt',
        },
      ],
    });
    
    // 添加路由
    this.app.router.add('root', { path: '/', Component: Demo });
    
    // 新增测试model并设置初始参数
    const model = observableModelManager.getModel('markdown-block');
    // 设置FilterFlow的参数
    model.setFilterParams('block:markdown', 'block:markdown:template', {
      template: 'handlebars',
    });
    model.setFilterParams('block:markdown', 'block:markdown:height', {
      height: 200,
    });
    model.setFilterParams('block:markdown', 'block:markdown:content', {
      content: '# Hello NocoBase\n\n这是一个**响应式**的 {{var1}} 示例',
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

// 导出根组件
export default app.getRootComponent();
