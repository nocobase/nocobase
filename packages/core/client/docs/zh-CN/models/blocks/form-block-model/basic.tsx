import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Form, Input, Table } from 'antd';
import React, { useEffect } from 'react';

class InputFieldModel extends FlowModel {
  render() {
    return <Input {...this.props} />;
  }
}

function FieldModelRenderer(props) {
  const { model, id, value, onChange, ['aria-describedby']: ariaDescribedby, ...rest } = props;
  useEffect(() => {
    model.setProps({ id, value, onChange, ['aria-describedby']: ariaDescribedby });
  }, [model, id, value, ariaDescribedby, onChange]);
  return <FlowModelRenderer model={model} {...rest} />;
}

export function SubTableField(props) {
  const { value = [], onChange, columns } = props;
  // 新增一行
  const handleAdd = () => {
    const newRow = {};
    columns.forEach((col) => (newRow[col.dataIndex] = ''));
    onChange?.([...(value || []), newRow]);
  };

  // 编辑单元格
  const handleCellChange = (rowIdx, dataIndex, cellValue) => {
    const newData = value.map((row, idx) => (idx === rowIdx ? { ...row, [dataIndex]: cellValue } : row));
    onChange?.(newData);
  };

  // 渲染可编辑单元格
  const editableColumns = columns.map((col) => ({
    ...col,
    render: (text, record, rowIdx) => {
      return col.render({
        id: `field-${col.dataIndex}-${rowIdx}`,
        value: text,
        onChange: (e) => handleCellChange(rowIdx, col.dataIndex, e.target.value),
        ['aria-describedby']: `field-${col.dataIndex}-${rowIdx}`,
      });
    },
  }));

  return (
    <Form.Item>
      <Table dataSource={value} columns={editableColumns} rowKey={(row, idx) => idx} pagination={false} />
      <Button type="dashed" onClick={handleAdd} style={{ marginTop: 8 }}>
        新增一行
      </Button>
    </Form.Item>
  );
}

class SubTableFieldModel extends FlowModel {
  render() {
    return (
      <SubTableField
        columns={[
          {
            title: '姓名',
            dataIndex: 'name',
            model: this.subModels.field,
            render: (props) => {
              const fork = (this.subModels.field as FlowModel).createFork({}, props.id);
              return <FieldModelRenderer model={fork} {...props} />;
            },
          },
          // { title: '年龄', dataIndex: 'age' },
        ]}
        {...this.props}
      />
    );
  }
}

class FormBlockModel extends FlowModel {
  render() {
    return (
      <Form layout="vertical" initialValues={{ arr: [{ name: '张三', age: 18 }] }}>
        <Form.Item label="姓名" name={'arr'}>
          <FieldModelRenderer model={this.subModels.field} />
        </Form.Item>
      </Form>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ FormBlockModel, SubTableFieldModel, InputFieldModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'FormBlockModel',
      subModels: {
        field: {
          use: 'SubTableFieldModel',
          subModels: {
            field: {
              use: 'InputFieldModel',
            },
          },
        },
      },
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
