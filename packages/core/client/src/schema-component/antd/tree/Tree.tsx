import { MoreOutlined } from '@ant-design/icons';
import { createForm, Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema, useForm } from '@formily/react';
import { Dropdown, Menu, Tree as AntdTree } from 'antd';
import React, { useMemo, useState } from 'react';
import { RecordProvider } from '../../../record-provider';
import { useProps } from '../../hooks/useProps';
import { ActionContext } from '../action';

const RecordViewer = (props) => {
  const { schema, visible, setVisible, record } = props;
  const form = useMemo(() => createForm(), [record]);
  const field = useField<Field>();
  return (
    schema && (
      <ActionContext.Provider value={{ visible, setVisible }}>
        <RecordProvider record={record}>
          <RecursionField basePath={field.address} name={schema.name} schema={schema} onlyRenderProperties />
        </RecordProvider>
      </ActionContext.Provider>
    )
  );
};

export const Tree: any = observer((props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const { hideNodeActionBar, fieldNames, ...restProps } = useProps(props);
  const actionBarSchema: Schema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Tree.NodeActionBar') {
      return s;
    }
    return buf;
  }, null);
  const form = useForm();
  const [schema, setSchema] = useState(null);
  const [record, setRecord] = useState({});
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <RecordViewer visible={visible} setVisible={setVisible} schema={schema} record={record} />
      <AntdTree
        defaultExpandAll
        fieldNames={fieldNames}
        {...restProps}
        treeData={field.value}
        titleRender={(node) => {
          const menu = (
            <Menu>
              {actionBarSchema &&
                actionBarSchema.mapProperties((s) => {
                  return (
                    <Menu.Item
                      onClick={() => {
                        form.clearFormGraph(field.address.concat('*'));
                        setSchema(s);
                        // TODO: 当前行记录
                        setRecord({});
                        setVisible(true);
                      }}
                    >
                      {s.title}
                    </Menu.Item>
                  );
                })}
            </Menu>
          );
          return !actionBarSchema || hideNodeActionBar ? (
            node.title
          ) : (
            <div>
              {node.title}
              <span style={{ width: 10, display: 'inline-block' }} />
              <span onClick={(e) => e.stopPropagation()}>
                <Dropdown overlay={menu}>
                  <a onClick={(e) => e.preventDefault()}>
                    <MoreOutlined />
                  </a>
                </Dropdown>
              </span>
            </div>
          );
        }}
      />
    </div>
  );
});
