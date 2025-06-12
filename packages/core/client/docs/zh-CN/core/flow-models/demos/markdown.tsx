import React from 'react';
import { Application, Plugin } from '@nocobase/client';
import { useFlowModel, FlowContext, BlockModel, withFlowModel, FlowsSettings } from '@nocobase/flow-engine';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';

const Demo = () => {
  const uid = 'markdown-block';
  const model = useFlowModel<BlockModel>(uid, 'MarkdownModel');
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <MarkdownBlock model={model} />
    </div>
  );
};

const Markdown = ({ content, height }) => {
  if (content === undefined || content === null) {
    return <div style={{ height: height || 100 }}>Loading content or no content set...</div>;
  }
  return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />;
};

const MarkdownBlock = withFlowModel(Markdown, {
  settings: {
    component: FlowsSettings,
    props: {
      expandAll: true,
    },
  },
});

const MarkdownModel = BlockModel.extends([
  {
    key: 'default',
    title: 'Markdown',
    auto: true,
    steps: {
      setTemplate: {
        use: 'block:markdown:template',
        title: '模板引擎',
        defaultParams: { template: 'plain' },
      },
      setHeight: {
        use: 'block:markdown:height',
        title: '高度',
        defaultParams: { height: 300 },
      },
      setContent: {
        use: 'block:markdown:content',
        title: '内容',
        defaultParams: { content: 'Hello, NocoBase! {{var1}}' },
      },
      renderMarkdown: {
        handler: async (ctx: FlowContext) => {
          const props = ctx.model.getProps();
          let content = props.content;
          if (props.template === 'handlebars') {
            content = Handlebars.compile(content || '')({
              var1: 'variable 1',
              var2: 'variable 2',
              var3: 'variable 3',
            });
          }

          ctx.model.setProps('content', MarkdownIt().render(content || ''));
        },
      },
    },
  },
]);

class DemoPlugin extends Plugin {
  async load() {
    this.app.flowEngine.registerModels({ MarkdownModel });

    this.app.flowEngine.registerAction({
      name: 'block:markdown:template',
      title: '模板引擎',
      uiSchema: {
        template: {
          type: 'string',
          title: '模板类型',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '普通文本', value: 'plain' },
            { label: 'Handlebars模板', value: 'handlebars' },
          ],
        },
      },
      defaultParams: { template: 'plain' },
      handler: (ctx: FlowContext, params: any) => {
        if (params?.template != null) {
          ctx.model.setProps('template', params.template);
        }
      },
    });

    this.app.flowEngine.registerAction({
      name: 'block:markdown:height',
      title: '高度设置',
      uiSchema: {
        height: {
          type: 'number',
          title: '高度设置',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          'x-component-props': { addonAfter: 'px' },
        },
      },
      handler: (ctx: FlowContext, params: any) => {
        if (params?.height != null) {
          ctx.model.setProps('height', params.height);
        }
      },
    });

    this.app.flowEngine.registerAction({
      name: 'block:markdown:content',
      title: '内容设置',
      uiSchema: {
        content: {
          type: 'string',
          title: 'Markdown内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      handler: (ctx: FlowContext, params: any) => {
        ctx.model.setProps('content', params?.content);
      },
    });

    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
