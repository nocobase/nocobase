import React from 'react';
import { Space, Button, message, Divider } from 'antd';
import { 
    Application, 
    Plugin, 
    TableBlockModel, 
    BaseFlowModel,
    useModel, 
    useApplyFlow,
    FlowContext,
    ISchema,
} from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettings from './settings/FlowSettings';

// Default data/config constants for the demo
const DEMO_DEFAULT_TABLE_DATA = [
  { id: 1, name: '张三', age: 25, address: '北京市朝阳区' },
  { id: 2, name: '李四', age: 30, address: '上海市浦东新区' },
];
const DEMO_DEFAULT_COLUMNS = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'age', title: 'Age', dataIndex: 'age' },
  { key: 'address', title: 'Address', dataIndex: 'address' },
];
const DEMO_DEFAULT_ROW_ACTIONS = [{ name: 'table:edit', title: 'Edit' }, { name: 'table:delete', title: 'Delete' }];
const DEMO_DEFAULT_HEADER_ACTIONS = [{name: 'table:reload', title: 'Reload'}, {name: 'table:create', title: 'Create'}];

const Demo = () => {
    const uid = 'table-block-demo';
    return (
        <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            <FlowSettings uid={uid} flowKey="block:table" modelClassName="TableBlockModel" />
            <Divider />
            <TableBlock uid={uid} />
        </div>
    );
};

const TableBlock = observer(({ uid }: { uid: string }) => {
    const model = useModel('TableBlockModel', uid);
    useApplyFlow(model, 'block:table'); 

    const props = model.getProps();
    const columns = props.columns || DEMO_DEFAULT_COLUMNS;
    const data = props.data || DEMO_DEFAULT_TABLE_DATA;
    const headerActions = props.headerActions || DEMO_DEFAULT_HEADER_ACTIONS;
    const rowActions = props.rowActions || DEMO_DEFAULT_ROW_ACTIONS;

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                {(headerActions as any[]).map((action: any) => (
                    <Button 
                        key={action.name} 
                        onClick={() => model.dispatchEvent(action.name, {})}
                    >
                        {action.title}
                    </Button>
                ))}
            </Space>
            <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {(columns as any[]).map((col: any) => <th key={col.key || col.dataIndex}>{col.title}</th>)}
                        {rowActions.length > 0 && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {(data as any[]).map((row: any, rowIndex: number) => (
                        <tr key={row.id || rowIndex}>
                            {(columns as any[]).map((col: any) => <td key={col.key || col.dataIndex}>{row[col.dataIndex]}</td>)}
                            {rowActions.length > 0 && (
                                <td>
                                    <Space>
                                        {(rowActions as any[]).map((action: any) => (
                                            <Button 
                                                key={action.name} 
                                                size="small"
                                                onClick={() => model.dispatchEvent(action.name, { record: row, rowIndex })}
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

        // Configuration Actions (replacing filters)
        this.app.flowEngine.registerAction({
            name: 'table:config:fields',
            title: '字段配置',
            uiSchema: { 
                fieldsJson: { 
                    type: 'string', title: '字段 (JSON)', 'x-component': 'Input.TextArea',
                    description: '列配置的JSON数组, e.g., [{key: \'name\', title: \'Name\', dataIndex: \'name\'}]'
                } as ISchema
            },
            defaultParams: { fieldsJson: JSON.stringify(DEMO_DEFAULT_COLUMNS) },            
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                try { model.setProps('columns', JSON.parse(params.fieldsJson)); } 
                catch (e) { 
                    console.error('Invalid fields JSON, using default:', params.fieldsJson, e); 
                    model.setProps('columns', DEMO_DEFAULT_COLUMNS);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'table:config:data',
            title: '数据源配置',
            uiSchema: { 
                dataJson: { 
                    type: 'string', title: '数据 (JSON)', 'x-component': 'Input.TextArea',
                    description: '表格数据的JSON数组, e.g., [{id:1, name: \'John\'}]'
                } as ISchema 
            },
            defaultParams: { dataJson: JSON.stringify(DEMO_DEFAULT_TABLE_DATA) },
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                try { model.setProps('data', JSON.parse(params.dataJson)); } 
                catch (e) { 
                    console.error('Invalid data JSON, using default:', params.dataJson, e); 
                    model.setProps('data', DEMO_DEFAULT_TABLE_DATA);
                }
            },
        });

        this.app.flowEngine.registerAction({
            name: 'table:config:rowActions',
            title: '行操作配置',
            uiSchema: { 
                rowActionsJson: { 
                    type: 'string', title: '行操作 (JSON)', 'x-component': 'Input.TextArea',
                    description: '行操作的JSON数组, e.g., [{name: \'table:edit\', title: \'Edit\'}]'
                 } as ISchema
            },
            defaultParams: { rowActionsJson: JSON.stringify(DEMO_DEFAULT_ROW_ACTIONS) },
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                try { model.setProps('rowActions', JSON.parse(params.rowActionsJson)); }
                catch (e) { 
                    console.error('Invalid rowActions JSON, using default:', params.rowActionsJson, e); 
                    model.setProps('rowActions', DEMO_DEFAULT_ROW_ACTIONS);
                }
            },
        });
        
        this.app.flowEngine.registerAction({
            name: 'table:config:headerActions',
            title: '头部操作配置',
            uiSchema: { 
                headerActionsJson: { 
                    type: 'string', title: '头部操作 (JSON)', 'x-component': 'Input.TextArea',
                    description: '头部操作的JSON数组, e.g., [{name: \'table:reload\', title: \'Reload\'}]'
                 } as ISchema
            },
            defaultParams: { headerActionsJson: JSON.stringify(DEMO_DEFAULT_HEADER_ACTIONS) },
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                try { model.setProps('headerActions', JSON.parse(params.headerActionsJson)); }
                catch (e) { 
                    console.error('Invalid headerActions JSON, using default:', params.headerActionsJson, e); 
                    model.setProps('headerActions', DEMO_DEFAULT_HEADER_ACTIONS);
                }
            },
        });

        // Event-Handling Actions (replacing events from EventFlowManager)
        this.app.flowEngine.registerAction({
            name: 'action:table:reload',
            title: '执行表格刷新',
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                message.info(`Table [${model.uid}] reload action triggered.`);
                const dataAction = ctx.engine.getAction('table:config:data');
                if(dataAction?.defaultParams?.dataJson) {
                    try { model.setProps('data', JSON.parse(dataAction.defaultParams.dataJson)); }
                    catch(e) { model.setProps('data', DEMO_DEFAULT_TABLE_DATA); }
                }
            },
        });
        this.app.flowEngine.registerAction({
            name: 'action:table:create',
            title: '执行创建操作',
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                message.info(`Create action for table [${model.uid}]`);
                // Example: Add a new dummy row
                // const currentData = model.getProps().data || [];
                // const newData = [...currentData, {id: Date.now(), name: 'New Entry', age: 0, address: 'N/A'}];
                // model.setProps('data', newData);
            },
        });
        this.app.flowEngine.registerAction({
            name: 'action:table:edit',
            title: '执行编辑操作',
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                message.info(`Edit action for table [${model.uid}], record: ${JSON.stringify(params.record)}`);
            },
        });
        this.app.flowEngine.registerAction({
            name: 'action:table:delete',
            title: '执行删除操作',
            handler(ctx: FlowContext, model: BaseFlowModel, params: any) {
                message.info(`Delete action for table [${model.uid}], record: ${JSON.stringify(params.record)}`);
                // Example: Remove the row
                // const currentData = model.getProps().data || [];
                // model.setProps('data', currentData.filter(item => item.id !== params.record?.id));
            },
        });

        // Main Configuration Flow
        this.app.flowEngine.registerFlow({
            key: 'block:table',
            title: '表格区块配置流程',
            steps: {
                configureFields: { use: 'table:config:fields' },
                configureData: { use: 'table:config:data' },
                configureHeaderActions: { use: 'table:config:headerActions' },
                configureRowActions: { use: 'table:config:rowActions' },
            },
        });

        // Event-Triggered Flows
        this.app.flowEngine.registerFlow({ key: 'flow:table:reload', title:'表格刷新', on: { eventName: 'table:reload' }, steps: { run: { use: 'action:table:reload' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:table:create', title:'创建记录', on: { eventName: 'table:create' }, steps: { run: { use: 'action:table:create' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:table:edit', title:'编辑记录', on: { eventName: 'table:edit' }, steps: { run: { use: 'action:table:edit' } } });
        this.app.flowEngine.registerFlow({ key: 'flow:table:delete', title:'删除记录', on: { eventName: 'table:delete' }, steps: { run: { use: 'action:table:delete' } } });

        this.app.router.add('root', { path: '/', Component: Demo });
    }
}

const app = new Application({
    router: { type: 'memory', initialEntries: ['/'] },
    plugins: [DemoPlugin]
});

export default app.getRootComponent(); 