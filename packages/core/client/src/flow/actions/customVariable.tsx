/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr, useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { Table, Button, Dropdown, Modal, Form, Input, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';

export const customVariable = defineAction({
  name: 'customVariable',
  title: tExpr('Custom variable'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 100,
  uiSchema: {
    variables: {
      type: 'array',
      'x-component': VariableEditor,
      'x-component-props': {},
    },
  },
  async handler(ctx, params) {
    const { variables = [] } = params;

    variables.forEach((variable) => {
      const getFunction = () => {
        const modelInstance = ctx.model.flowEngine.getModel(variable.formUid);
        return modelInstance?.form?.getFieldsValue(true);
      };
      const metaFunction = () => {
        const modelInstance = ctx.model.flowEngine.getModel(variable.formUid);
        const gridModel = modelInstance?.subModels?.grid;
        const properties = {};

        if (!gridModel) {
          console.warn(`Not found form or form has no grid: ${variable.formUid}`);
          return;
        }

        gridModel.mapSubModels('items', (item) => {
          properties[item.props.name] = { title: item.props.label, type: 'string' };
        });

        return {
          title: variable.title,
          type: 'object',
          properties,
        };
      };

      // 解决一开始不显示 title 的问题
      metaFunction.title = variable.title;

      ctx.model.context.defineProperty(variable.key, {
        get: getFunction,
        cache: false,
        meta: metaFunction,
      });
    });
  },
});

type FlowVariableType = 'formValue';

interface FormValueVariable {
  key: string;
  title: string;
  type: 'formValue';
  formUid: string;
}

type FlowVariable = FormValueVariable;

interface VariableEditorProps {
  value?: FlowVariable[];
  onChange?: (value: FlowVariable[]) => void;
  disabled?: boolean;
}

interface VariableFormValues {
  key: string;
  title: string;
  formUid: string;
}

const VARIABLE_TYPE_LABELS: Record<FlowVariableType, string> = {
  formValue: tExpr('Form variable'),
};

const generateVariableKey = () => `var_${uid().slice(0, 4)}`;

function VariableEditor(props: VariableEditorProps) {
  const { value = [], onChange, disabled } = props;
  const ctx = useFlowContext();
  const t = React.useMemo(() => ctx.model.translate.bind(ctx.model), [ctx.model]);
  const [form] = Form.useForm<VariableFormValues>();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [currentType, setCurrentType] = React.useState<FlowVariableType>('formValue');

  const resetForm = React.useCallback(() => {
    form.resetFields();
    form.setFieldsValue({ key: generateVariableKey(), title: '', formUid: '' });
  }, [form]);

  const openModal = React.useCallback(
    (type: FlowVariableType, index: number | null) => {
      setCurrentType(type);
      setEditingIndex(index);

      if (index === null) {
        resetForm();
      } else {
        const target = value[index];
        if (!target) {
          return;
        }
        form.setFieldsValue({
          key: target.key,
          title: target.title,
          formUid: target.type === 'formValue' ? target.formUid : '',
        });
      }

      setModalVisible(true);
    },
    [form, resetForm, value],
  );

  const closeModal = React.useCallback(() => {
    setModalVisible(false);
    setEditingIndex(null);
    resetForm();
  }, [resetForm]);

  const handleSubmit = React.useCallback(async () => {
    const formValues = await form.validateFields();
    const nextVariable: FlowVariable = {
      key: formValues.key,
      title: formValues.title,
      type: currentType,
      formUid: formValues.formUid,
    };

    const nextVariables = [...value];

    if (editingIndex === null) {
      nextVariables.push(nextVariable);
    } else {
      nextVariables.splice(editingIndex, 1, nextVariable);
    }

    onChange?.(nextVariables);
    closeModal();
  }, [closeModal, currentType, editingIndex, form, onChange, value]);

  const handleDelete = React.useCallback(
    (index: number) => {
      Modal.confirm({
        title: t('Delete variable'),
        content: t('Are you sure you want to delete this variable?'),
        okText: t('Confirm'),
        cancelText: t('Cancel'),
        onOk: () => {
          const nextVariables = value.filter((_, idx) => idx !== index);
          onChange?.(nextVariables);
        },
      });
    },
    [onChange, t, value],
  );

  const handleAdd = React.useCallback(
    (type: FlowVariableType) => {
      if (disabled) {
        return;
      }
      openModal(type, null);
    },
    [disabled, openModal],
  );

  const handleEdit = React.useCallback(
    (index: number) => {
      if (disabled) {
        return;
      }
      const target = value[index];
      if (!target) {
        return;
      }
      openModal(target.type, index);
    },
    [disabled, openModal, value],
  );

  const columns = React.useMemo<ColumnsType<FlowVariable>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
      },
      {
        title: t('Identifier'),
        dataIndex: 'key',
        key: 'key',
        ellipsis: true,
        render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
      },
      {
        title: t('Type'),
        dataIndex: 'type',
        key: 'type',
        ellipsis: true,
        render: (type: FlowVariableType) => (
          <Tag style={{ whiteSpace: 'nowrap' }}>{t(VARIABLE_TYPE_LABELS[type] || type)}</Tag>
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        render: (_: unknown, __: FlowVariable, index: number) => (
          <Space size={12} style={{ whiteSpace: 'nowrap' }}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(index)}
              disabled={disabled}
              title={t('Edit')}
            />
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(index)}
              disabled={disabled}
              title={t('Delete')}
            />
          </Space>
        ),
      },
    ],
    [disabled, handleDelete, handleEdit, t],
  );

  const menu = React.useMemo(
    () => ({
      items: [
        {
          key: 'formValue',
          label: t(VARIABLE_TYPE_LABELS.formValue),
        },
      ],
      onClick: ({ key }: { key: string }) => handleAdd(key as FlowVariableType),
    }),
    [handleAdd, t],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={value}
        pagination={false}
        locale={{ emptyText: t('No data') }}
        size="small"
        scroll={{ x: 'max-content' }}
        bordered
      />
      <Dropdown menu={menu} trigger={['hover']} disabled={disabled}>
        <Button type="dashed" block icon={<PlusOutlined />} disabled={disabled}>
          {t('Add variable')}
        </Button>
      </Dropdown>

      <Modal
        open={modalVisible}
        title={editingIndex === null ? t('Add variable') : t('Edit variable')}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={t('Confirm')}
        cancelText={t('Cancel')}
        destroyOnClose
        maskClosable={false}
        okButtonProps={{ disabled }}
        cancelButtonProps={{ disabled }}
      >
        <Form<VariableFormValues> form={form} layout="vertical" disabled={disabled}>
          <Form.Item
            label={t('Variable title')}
            name="title"
            rules={[{ required: true, message: t('Please enter variable title') }]}
          >
            <Input placeholder={t('Please enter variable title')} />
          </Form.Item>
          <Form.Item
            label={t('Variable identifier')}
            name="key"
            rules={[{ required: true, message: t('Please enter variable identifier') }]}
          >
            <Input placeholder={t('Please enter variable identifier')} />
          </Form.Item>
          {currentType === 'formValue' ? (
            <Form.Item
              label={t('Form UID')}
              name="formUid"
              rules={[{ required: true, message: t('Please enter form uid') }]}
            >
              <Input placeholder={t('Please enter form uid')} />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
