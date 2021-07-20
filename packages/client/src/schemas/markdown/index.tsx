import React from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  useField,
  useFieldSchema,
} from '@formily/react';
import { Button, Dropdown, Input as AntdInput, Menu, Space } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import { Display } from '../display';
import { LoadingOutlined, MenuOutlined, DragOutlined } from '@ant-design/icons';
import micromark from 'micromark';
import { useDesignable } from '../../components/schema-renderer';
import { useContext, useState } from 'react';
import AddNew from '../add-new';
import cls from 'classnames';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { uid } from '@formily/shared';
import { removeSchema, updateSchema } from '..';
import { isGridRowOrCol } from '../grid';

export const Markdown: any = connect(
  (props) => {
    const { schema } = useDesignable();
    const field = useField<any>();
    const { savedInSchema, ...others } = props;
    console.log('Markdown', props);
    return savedInSchema ? (
      <div className={'mb-markdown'} style={{ position: 'relative' }}>
        <AntdInput.TextArea autoSize={{ minRows: 3 }} {...others} />
        <Button
          style={{ position: 'absolute', bottom: 5, right: 5 }}
          type={'primary'}
          onClick={async () => {
            field.readPretty = true;
            schema['default'] = field.value;
            await updateSchema({
              key: schema['key'],
              default: field.value,
            });
          }}
        >
          保存
        </Button>
      </div>
    ) : (
      <AntdInput.TextArea autoSize={{ minRows: 1 }} {...others} />
    );
  },
  mapProps((props: any, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    console.log('Markdown', props);
    let text = props.value;
    let value = (
      <div dangerouslySetInnerHTML={{ __html: micromark(text || '') }} />
    );
    return <Display.TextArea {...props} text={text} value={value} />;
  }),
);

Markdown.DesignableBar = observer((props) => {
  const field = useField();
  const { schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
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
                  }}
                >
                  修改 Markdown
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
                  删除当前区块
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

export default Markdown;
