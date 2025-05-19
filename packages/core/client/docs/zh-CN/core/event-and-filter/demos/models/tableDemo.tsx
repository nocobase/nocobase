import React from 'react';
import { Space, Button, message, Divider, Modal, Tag } from 'antd';
import {
    Application,
    Plugin,
    TableBlockModel,
    FlowModel,
    FlowContext,
    ISchema,
    useApp,
    FlowEngine
} from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettings from '../settings/FlowSettings';

const {
    useModelById,
    useApplyFlow,
    useContext: useFlowEngineContext
} = FlowEngine;

// Default data/config constants for the demo
const DEMO_DEFAULT_TABLE_DATA = [
  { id: 1, name: '张三', age: 25, address: '北京市朝阳区', tags: ['开发', '前端'] },
  { id: 2, name: '李四', age: 30, address: '上海市浦东新区', tags: ['开发', '后端'] },
  { id: 3, name: '王五', age: 28, address: '广州市天河区', tags: ['测试'] },
];
const DEMO_DEFAULT_COLUMNS = [
  { key: 'id', title: 'ID', dataIndex: 'id', sorter: true },
  { key: 'name', title: '姓名', dataIndex: 'name', sorter: true },
  { key: 'age', title: '年龄', dataIndex: 'age', sorter: true },
  { key: 'address', title: '地址', dataIndex: 'address' },
  { key: 'tags', title: '标签', dataIndex: 'tags' /* Render logic will be in a flow step */ },
];
const DEMO_DEFAULT_ROW_ACTIONS = [
    { name: 'tabledemo:rowEdit', title: '编辑' },
    { name: 'tabledemo:rowDelete', title: '删除' }
];
const DEMO_DEFAULT_HEADER_ACTIONS = [
    { name: 'tabledemo:reload', title: '刷新' },
    { name: 'tabledemo:create', title: '新增' }
];


const Demo = () => {
    const uid = 'table-demo-001';
    return (
        <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            <FlowSettings uid={uid} flowKey="block:tabledemo" modelClassName="TableBlockModel" />
            <Divider />
            <TableBlock uid={uid} />
        </div>
    );
};

const TableBlock = observer(({ uid }: { uid: string }) => {
    const model = useModelById(uid, 'TableBlockModel');
    const flowContext = useFlowEngineContext();
    useApplyFlow('block:tabledemo', model, flowContext);

    const props = model.getProps();
    const columns = props.columns || DEMO_DEFAULT_COLUMNS;
    const data = props.data || DEMO_DEFAULT_TABLE_DATA;
    const headerActions = props.headerActions || DEMO_DEFAULT_HEADER_ACTIONS;
    const rowActions = props.rowActions || DEMO_DEFAULT_ROW_ACTIONS;

    const antTableColumns = (columns as any[]).map(col => ({
        ...col,
        render: col.dataIndex === 'tags' && Array.isArray(col.tags)
            ? (tags: string[]) => tags.map(tag => <Tag color="blue" key={tag}>{tag}</Tag>)
            : col.tagsRenderer
                ? (value, record) => col.tagsRenderer(record[col.dataIndex])
                : undefined
    }));

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                {(headerActions as any[]).map((action: {name: string, title: string}) => (
                    <Button
                        key={action.name}
                        onClick={() => model!.dispatchEvent(action.name, {})}
                    >
                        {action.title}
                    </Button>
                ))}
            </Space>
            <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {antTableColumns.map((col: any) => <th key={col.key || col.dataIndex}>{col.title}</th>)}
                        {rowActions.length > 0 && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {(data as any[]).map((row: any, rowIndex: number) => (
                        <tr key={row.id || rowIndex}>
                            {antTableColumns.map((col: any) => (
                                <td key={col.key || col.dataIndex}>
                                    {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                                </td>
                            ))}
                            {rowActions.length > 0 && (
                                <td>
                                    <Space>
                                        {(rowActions as any[]).map((action: {name: string, title: string}) => (
                                            <Button
                                                key={action.name}
                                                size="small"
                                                onClick={() => model!.dispatchEvent(action.name, { record: row, rowIndex })}
                                            >
                                                {action.title}
                                            </Button>
                                        ))}
                                    </Space>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

class DemoPlugin extends Plugin {
    async load() {
        this.app.flowEngine.registerModelClass('TableBlockModel', TableBlockModel as any);

        this.app.flowEngine.registerAction({
            name: 'tabledemo:config:fields',
            title: '字段配置',
            uiSchema: {
                fieldsJson: {
                    type: 'string', title: '字段 (JSON)', 'x-component': 'Input.TextArea',
                    description: '列配置的JSON数组',
                    default: JSON.stringify(DEMO_DEFAULT_COLUMNS)
                } as ISchema
            },
            handler(ctx: FlowContext, model: FlowModel, params: any) {
                try { model.setProps('columns', JSON.parse(params.fieldsJson || JSON.stringify(DEMO_DEFAULT_COLUMNS))); }
                catch (e) {
                    console.error('Invalid fields JSON, using default:', params.fieldsJson, e);
                    model.setProps('columns', DEMO_DEFAULT_COLUMNS);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'tabledemo:config:data',
            title: '数据源配置',
            uiSchema: {
                dataJson: {
                    type: 'string', title: '数据 (JSON)', 'x-component': 'Input.TextArea',
                    description: '表格数据的JSON数组',
                    default: JSON.stringify(DEMO_DEFAULT_TABLE_DATA)
                } as ISchema
            },
            handler(ctx: FlowContext, model: FlowModel, params: any) {
                try { model.setProps('data', JSON.parse(params.dataJson || JSON.stringify(DEMO_DEFAULT_TABLE_DATA))); }
                catch (e) {
                    console.error('Invalid data JSON, using default:', params.dataJson, e);
                    model.setProps('data', DEMO_DEFAULT_TABLE_DATA);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'tabledemo:config:rowactions',
            title: '行操作配置',
            uiSchema: {
                rowActionsJson: {
                    type: 'string', title: '行操作 (JSON)', 'x-component': 'Input.TextArea',
                    description: '行操作的JSON数组',
                    default: JSON.stringify(DEMO_DEFAULT_ROW_ACTIONS)
                 } as ISchema
            },
            handler(ctx: FlowContext, model: FlowModel, params: any) {
                try { model.setProps('rowActions', JSON.parse(params.rowActionsJson || JSON.stringify(DEMO_DEFAULT_ROW_ACTIONS))); }
                catch (e) {
                    console.error('Invalid rowActions JSON, using default:', params.rowActionsJson, e);
                    model.setProps('rowActions', DEMO_DEFAULT_ROW_ACTIONS);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'tabledemo:config:headeractions',
            title: '头部操作配置',
            uiSchema: {
                headerActionsJson: {
                    type: 'string', title: '头部操作 (JSON)', 'x-component': 'Input.TextArea',
                    description: '头部操作的JSON数组',
                    default: JSON.stringify(DEMO_DEFAULT_HEADER_ACTIONS)
                 } as ISchema
            },
            handler(ctx: FlowContext, model: FlowModel, params: any) {
                try { model.setProps('headerActions', JSON.parse(params.headerActionsJson || JSON.stringify(DEMO_DEFAULT_HEADER_ACTIONS))); }
                catch (e) {
                    console.error('Invalid headerActions JSON, using default:', params.headerActionsJson, e);
                    model.setProps('headerActions', DEMO_DEFAULT_HEADER_ACTIONS);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'action:tabledemo:renderTags',
            title: '渲染标签列',
            handler(ctx: FlowContext, model: FlowModel, params: any) {
                const columns = model.getProps().columns || [];
                const updatedColumns = columns.map(col => {
                    if (col.dataIndex === 'tags') {
                        return { ...col, tagsRenderer: (tags: string[]) => tags.map(tag => <Tag color="blue" key={tag}>{tag}</Tag>) };
                    }
                    return col;
                });
                model.setProps('columns', updatedColumns);
            }
        });

        this.app.flowEngine.registerAction({ name: 'action:tabledemo:reload', title: '执行刷新', handler(ctx,model,params) {
            message.info(`Table [${model.uid}] Reload.`);
            const dataAction = ctx.engine.getAction('tabledemo:config:data');
            if(dataAction?.defaultParams?.dataJson) {
                try { model.setProps('data', JSON.parse(dataAction.defaultParams.dataJson)); }
                catch(e) { model.setProps('data', DEMO_DEFAULT_TABLE_DATA); }
            } else { model.setProps('data', DEMO_DEFAULT_TABLE_DATA); }
        } });
        this.app.flowEngine.registerAction({ name: 'action:tabledemo:create', title: '执行创建', handler(ctx,model,params) {
            const data = model.getProps().data || [];
            const newId = Math.max(0, ...data.map(item => item.id || 0)) + 1;
            const newEntry = {id: newId, name: '新用户', age: Math.floor(Math.random()*40+20), address: '新地址'};
            model.setProps('data', [...data, newEntry]);
            message.success(`Table [${model.uid}] Created: ${newEntry.name}`);
        } });
        this.app.flowEngine.registerAction({ name: 'action:tabledemo:edit', title: '执行编辑', handler(ctx,model,params) {
            message.info(`Table [${model.uid}] Edit: ${JSON.stringify(params.record)}`);
            Modal.info({ title: '编辑记录', content: JSON.stringify(params.record) });
        } });
        this.app.flowEngine.registerAction({ name: 'action:tabledemo:delete', title: '执行删除', handler(ctx,model,params) {
            Modal.confirm({
                title: '确认删除', content: `删除 ${params.record?.name}?`,
                onOk: () => {
                    const data = model.getProps().data || [];
                    model.setProps('data', data.filter(item => item.id !== params.record?.id));
                    message.success(`Table [${model.uid}] Deleted: ${params.record?.name}`);
                }
            });
        } });

        this.app.flowEngine.registerFlow({
            key: 'block:tabledemo',
            title: '表格区块配置流程',
            steps: {
                configureFields: { use: 'tabledemo:config:fields' },
                configureData: { use: 'tabledemo:config:data' },
                configureHeaderActions: { use: 'tabledemo:config:headeractions' },
                configureRowActions: { use: 'tabledemo:config:rowactions' },
                renderTagsStep: { use: 'action:tabledemo:renderTags' }
            },
        });

        this.app.flowEngine.registerFlow({ key: 'flow:tabledemo:reload', title:'表格刷新', on: { eventName: 'tabledemo:reload' }, steps: { run: { use: 'action:tabledemo:reload' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:tabledemo:create', title:'新增记录', on: { eventName: 'tabledemo:create' }, steps: { run: { use: 'action:tabledemo:create' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:tabledemo:edit', title:'编辑记录', on: { eventName: 'tabledemo:rowEdit' }, steps: { run: { use: 'action:tabledemo:edit' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:tabledemo:delete', title:'删除记录', on: { eventName: 'tabledemo:rowDelete' }, steps: { run: { use: 'action:tabledemo:delete' } } });


        this.app.router.add('root', { path: '/', Component: Demo });
    }
}

const app = new Application({
    router: { type: 'memory', initialEntries: ['/'] },
    plugins: [DemoPlugin]
});

export default app.getRootComponent();
