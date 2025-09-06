/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Card, Button, Empty, Modal, Collapse, Form, Input, Switch, Select, List, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { useField } from '@formily/react';
import { ArrayField } from '@formily/core';
import { FormItem, FormLayout } from '@formily/antd-v5';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const inputSourceLabels = {
  manual: 'Manual input',
  blocks: 'Blocks',
  fields: 'Field values',
  collections: 'Data sources & collections',
};

const InputsEditModal: React.FC<{
  title: string;
  open: boolean;
  onOk: (value: any) => void;
  onCancel: () => void;
}> = ({ open, title, onOk, onCancel }) => {
  const t = useT();
  const [inputField, setInputField] = useState({
    title: '',
    sources: {
      manual: {
        enabled: true,
        value: '',
      },
      blocks: {
        enabled: false,
        value: [],
      },
      fields: {
        enabled: false,
        value: [],
      },
      collections: {
        enabled: false,
        value: [],
      },
    },
  });

  const handleTitleChange = (value: string) => {
    setInputField((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handleSwitchChange = (key: string, value: boolean) => {
    setInputField((prev) => ({
      ...prev,
      sources: {
        ...prev.sources,
        [key]: {
          ...prev.sources[key],
          enabled: value,
        },
      },
    }));
  };

  const handleValueChange = (key: string, value: any) => {
    setInputField((prev) => ({
      ...prev,
      sources: {
        ...prev.sources,
        [key]: {
          ...prev.sources[key],
          value,
        },
      },
    }));
  };

  return (
    <Modal open={open} title={title} onOk={() => onOk(inputField)} onCancel={onCancel}>
      <FormLayout layout="vertical">
        <FormItem label={t('Title')}>
          <Input value={inputField.title} onChange={(e) => handleTitleChange(e.target.value)} />
        </FormItem>
        <FormItem label={t('Input sources')}>
          <Collapse
            size="small"
            items={[
              {
                key: 'manual',
                label: t('Manual input'),
                children: (
                  <Form.Item>
                    <Input placeholder={t('Placeholder')} onChange={(v) => handleValueChange('manual', v)} />
                  </Form.Item>
                ),
                extra: <Switch size="small" defaultChecked onChange={(v) => handleSwitchChange('manual', v)} />,
              },
              {
                key: 'blocks',
                label: t('Blocks'),
                children: (
                  <Form.Item>
                    <Select
                      allowClear
                      mode="multiple"
                      options={[
                        {
                          key: 'table',
                          value: 'table',
                          label: t('Table'),
                        },
                        {
                          key: 'form',
                          value: 'form',
                          label: t('Form'),
                        },
                      ]}
                      onChange={(v) => handleValueChange('blocks', v)}
                    />
                  </Form.Item>
                ),
                extra: <Switch size="small" onChange={(v) => handleSwitchChange('blocks', v)} />,
              },
              {
                key: 'fields',
                label: t('Field values'),
                children: (
                  <Form.Item>
                    <Select
                      mode="multiple"
                      allowClear
                      options={[
                        {
                          key: 'input',
                          value: 'input',
                          label: t('Single line text'),
                        },
                      ]}
                      onChange={(v) => handleValueChange('fields', v)}
                    />
                  </Form.Item>
                ),
                extra: <Switch size="small" onChange={(v) => handleSwitchChange('fields', v)} />,
              },
              {
                key: 'collections',
                label: t('Data sources & collections'),
                children: (
                  <Form.Item>
                    <Select onChange={(v) => handleValueChange('collections', v)} />
                  </Form.Item>
                ),
                extra: <Switch size="small" onChange={(v) => handleSwitchChange('collections', v)} />,
              },
            ]}
          />
        </FormItem>
      </FormLayout>
    </Modal>
  );
};

export const InputsFormSettings: React.FC = () => {
  const t = useT();
  const field = useField<ArrayField>();
  const [open, setOpen] = React.useState(false);

  const handleAdd = (value: any) => {
    const enabledSources = {};
    for (const key in value.sources) {
      if (value.sources[key].enabled) {
        enabledSources[key] = value.sources[key];
      }
    }
    value.sources = enabledSources;
    field.value = [...(field.value || []), value];
    setOpen(false);
  };

  return (
    <Card
      styles={{
        body: {
          padding: 0,
        },
      }}
      extra={
        <>
          <Button size="small" variant="dashed" color="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            {t('Add field')}
          </Button>
          <InputsEditModal title={t('Add field')} open={open} onOk={handleAdd} onCancel={() => setOpen(false)} />
        </>
      }
    >
      {field.value && field.value.length ? (
        <List
          size="small"
          dataSource={field.value}
          renderItem={(item) => {
            return (
              <List.Item
                actions={[
                  <Button key="edit" icon={<EditOutlined />} type="text" />,
                  <Button key="delete" icon={<DeleteOutlined />} type="text" />,
                ]}
              >
                <List.Item.Meta title={item.title} />
                <>
                  {Object.keys(item.sources || {}).map((source) => {
                    return (
                      <Tag
                        style={{
                          marginBottom: '3px',
                        }}
                        key={source}
                      >
                        {t(inputSourceLabels[source])}
                      </Tag>
                    );
                  })}
                </>
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};
