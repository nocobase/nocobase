import React, { useContext } from 'react';
import {
  Column,
  ColumnConfig,
  Line,
  LineConfig,
  Pie,
  PieConfig,
  Bar,
  BarConfig,
} from '@ant-design/charts';
import {
  connect,
  mapProps,
  observer,
  useField,
  useFieldSchema,
  mapReadPretty,
} from '@formily/react';
import { Button, Dropdown, Input as AntdInput, Menu, Space } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import { Display } from '../display';
import { LoadingOutlined, MenuOutlined, DragOutlined } from '@ant-design/icons';
import micromark from 'micromark';
import { useDesignable } from '../../components/schema-renderer';
import { useState } from 'react';
import AddNew from '../add-new';
import cls from 'classnames';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { uid } from '@formily/shared';
import { removeSchema, updateSchema } from '..';
import { isGridRowOrCol } from '../grid';

export const Chart: any = {};

Chart.Column = observer((props: any) => {
  return <Column {...props.config} />;
});

Chart.Line = observer((props: any) => {
  return <Line {...props.config} />;
});

Chart.Pie = observer((props: any) => {
  return <Pie {...props.config} />;
});

Chart.Bar = observer((props: any) => {
  return <Bar {...props.config} />;
});

Chart.DesignableBar = observer((props) => {
  const field = useField();
  const { designable, schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  if (!designable) {
    return null;
  }
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.CardItem defaultAction={'insertAfter'} ghost />
          {dragRef && <DragOutlined ref={dragRef} />}
          <Dropdown
            trigger={['click']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'update'}
                  onClick={() => {
                    field.readPretty = false;
                    setVisible(false);
                  }}
                >
                  修改文本段
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    const removed = deepRemove();
                    // console.log({ removed })
                    const last = removed.pop();
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                  }}
                >
                  删除当前文本
                </Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
});