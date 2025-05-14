import React from 'react';
import { Divider } from 'antd';
import { BaseModel, useObservableModel, useApplyFilters, Plugin, Application, observableModelManager } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observer } from '@formily/react';
import FilterFlowSettings from '../settings/FilterFlowSettings';

const Demo = () => {
    const uid = 'markdown-block';
    return (
        <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            {/* 配置 filterflow 的组件， 为通用组件，动态渲染配置输入框 */}
            <FilterFlowSettings uid={uid} flowKey="block:markdown" />
            <Divider />
            <MarkdownBlock uid={uid} content="Hello, NocoBase!" height={300} />
        </div>
    );
}

// Markdown区块组件，通过 useObservableModel 获取 model 实例，并应用 filterflow
const MarkdownBlock = observer(({ uid, ...defaultProps }: { uid: string, [key: string]: any }) => {
    const model = useObservableModel(uid, { initialProps: defaultProps });
    useApplyFilters('block:markdown', model);
    const props = model.getProps();

    return <Markdown content={props.content} height={props.height} />
});

const Markdown = ({ content, height }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

class DemoPlugin extends Plugin {
    async load() {
        // 注册filterflow的相关信息
        this.app.filterFlowManager.addFilter({
            name: 'block:markdown:template',
            title: '模板引擎',
            description: '选择模板引擎',
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
            handler: ((model: BaseModel, params) => {
                if (params?.template != null) {
                    model.setProps('template', params?.template);
                }
            }),
        });

        this.app.filterFlowManager.addFilter({
            name: 'block:markdown:height',
            title: '高度设置',
            description: '设置内容显示区域高度',
            uiSchema: {
                height: {
                    type: 'number',
                    title: '高度设置',
                    'x-decorator': 'FormItem',
                    'x-component': 'InputNumber',
                    'x-component-props': { addonAfter: 'px' },
                }
            },
            handler: ((model: BaseModel, params) => {
                if (params?.height != null) {
                    model.setProps('height', params?.height);
                }
            }),
        });

        this.app.filterFlowManager.addFilter({
            name: 'block:markdown:content',
            title: '内容设置',
            description: '设置Markdown内容',
            uiSchema: {
                content: {
                    type: 'string',
                    title: 'Markdown内容',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                }
            },
            handler: ((model: BaseModel, params) => {
                if (params?.content != null) {
                    model.setProps('content', params?.content);
                }
            }),
        });

        this.app.filterFlowManager.addFilter({
            name: 'block:markdown:render',
            title: 'Markdown解析',
            description: '解析Markdown内容',
            uiSchema: {},
            handler: ((model: BaseModel, params) => {
                const props = model.getProps();
                let content = props.content;

                if (props.template === 'handlebars') {
                    content = Handlebars.compile(content)({
                        var1: 'variable 1',
                        var2: 'variable 2',
                        var3: 'variable 3',
                    });
                }

                model.setProps('content', MarkdownIt().render(content));
            }),
        });

        this.app.filterFlowManager.addFlow({
            key: 'block:markdown',
            title: 'Markdown区块流程',
            steps: [
                {
                    key: 'block:markdown:template',
                    filterName: 'block:markdown:template',
                    title: '模板引擎',
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
                },
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
