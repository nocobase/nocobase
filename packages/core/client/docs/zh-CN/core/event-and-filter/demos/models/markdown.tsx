import React from 'react';
import { Divider } from 'antd';
import { BaseModel, useObservableModel, useApplyFilters, Plugin, Application, observableModelManager } from '@nocobase/client';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { observer } from '@formily/react';
import FilterFlowSettings from '../settings/FilterFlowSettings';

const DemoComponent = observer(() => {
    const uid = 'markdown-block';
    const model = useObservableModel(uid);
    useApplyFilters('block:markdown', model);
    const props = model.getProps();

    return (
        <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            <FilterFlowSettings uid={uid} flowKey="block:markdown" />
            <Divider />
            <Markdown content={props.content} height={props.height} />
        </div>
    );
});

const Markdown = ({ content, height }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} style={{ height }} />
}

// 自定义插件类
class DemoPlugin extends Plugin {
    async load() {
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
                    default: 'plain'
                }
            },
            handler: ((model: BaseModel, params) => {
                const { template } = params || {};
                model.setProps('template', template);
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
                    'x-component-props': {
                        addonAfter: 'px',
                        min: 50,
                        max: 1000
                    },
                    default: 200
                }
            },
            handler: ((model: BaseModel, params) => {
                const { height } = params || {};
                model.setProps('height', height);
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
                    'x-component-props': {
                        rows: 6
                    },
                    default: '# 标题\n\n这是一个**Markdown**示例'
                }
            },
            handler: ((model: BaseModel, params) => {
                const { content } = params || {};
                model.setProps('rawContent', content);
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
                model.setProps('content', MarkdownIt().render(content));
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
                    title: '解析',
                },
            ],
        });

        // 添加路由
        this.app.router.add('root', { path: '/', Component: DemoComponent });

        const model = observableModelManager.getModel('markdown-block');
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
