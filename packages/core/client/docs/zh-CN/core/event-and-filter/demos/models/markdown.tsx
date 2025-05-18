import React from 'react';
import { Divider } from 'antd';
import { BaseModel, Application, BlockModel, useModel, useApplyFlow, FlowContext, Plugin } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observer } from '@formily/react';
import FlowSettings from '../settings/FlowSettings';

const Demo = () => {
    const uid = 'markdown-block';
    return (
        <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            <FlowSettings uid={uid} flowKey="block:markdown" modelClassName="BlockModel" />
            <Divider />
            <MarkdownBlock uid={uid} />
        </div>
    );
}

// Markdown区块组件，通过 useModel 获取 model 实例，并应用 flow
const MarkdownBlock = observer(({ uid }: { uid: string }) => {
    const model = useModel('BlockModel', uid);

    useApplyFlow(model, 'block:markdown');
    
    const props = model.getProps();

    return <Markdown content={props.content} height={props.height} />
});

const Markdown = ({ content, height }) => {
    if (content === undefined || content === null) {
        return <div style={{ height: height || 100 }}>Loading content or no content set...</div>;
    }
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

class DemoPlugin extends Plugin {
    async load() {
        this.app.flowEngine.registerModelClass('BlockModel', BlockModel as any);

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
                        { label: 'Handlebars模板', value: 'handlebars' }
                    ],
                }
            },
            defaultParams: { template: 'plain' },
            handler: ((ctx: FlowContext, model: BaseModel, params: any) => {
                if (params?.template != null) {
                    model.setProps('template', params.template);
                }
            }),
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
                }
            },
            handler: ((ctx: FlowContext, model: BaseModel, params: any) => {
                if (params?.height != null) {
                    model.setProps('height', params.height);
                }
            }),
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
                }
            },
            handler: ((ctx: FlowContext, model: BaseModel, params: any) => {
                model.setProps('content', params?.content);
            }),
        });

        this.app.flowEngine.registerFlow({
            key: 'block:markdown',
            title: 'Markdown区块流程',
            steps: [
                {
                    key: 'template_config',
                    use: 'block:markdown:template',
                    title: '模板引擎',
                },
                {
                    key: 'height_config',
                    use: 'block:markdown:height',
                    title: '高度',
                    defaultParams: { height: 300 }
                },
                {
                    key: 'content_config',
                    use: 'block:markdown:content',
                    title: '内容',
                    defaultParams: { content: "Hello, NocoBase! {{var1}}" }
                },
                {
                    handler: async (ctx: FlowContext, model: BaseModel, params: any) => {
                        const props = model.getProps();
                        let content = props.content;
        
                        if (props.template === 'handlebars') {
                            content = Handlebars.compile(content || '')({
                                var1: 'variable 1',
                                var2: 'variable 2',
                                var3: 'variable 3',
                            });
                        }
        
                        model.setProps('content', MarkdownIt().render(content || ''));
                    }
                }
            ],
        });

        this.app.router.add('root', { path: '/', Component: Demo });
    }
}

const app = new Application({
    router: { type: 'memory', initialEntries: ['/'] },
    plugins: [DemoPlugin],
});

export default app.getRootComponent();
