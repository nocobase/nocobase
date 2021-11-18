import React from 'react';
import {
  connect,
  mapProps,
  observer,
  useField,
  useFieldSchema,
  mapReadPretty,
} from '@formily/react';
import { Button, Dropdown, Input as AntdInput, Menu, Modal, Space } from 'antd';
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
import './style.less';
import { DragHandle } from '../../components/Sortable';
import { useTranslation } from 'react-i18next';

export const Markdown: any = connect(
  AntdInput.TextArea,
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
    let text = props.value;
    let value = (
      <div
        className={'nb-markdown'}
        dangerouslySetInnerHTML={{ __html: micromark(text || '') }}
      />
    );
    return <Display.TextArea {...props} text={text} value={value} />;
  }),
);

function MarkdownTextArea(props: any) {
  const { t } = useTranslation();
  const [value, setValue] = useState(props.defaultValue);
  return (
    <div className={'mb-markdown'} style={{ position: 'relative' }}>
      <AntdInput.TextArea
        autoSize={{ minRows: 3 }}
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <Space style={{ position: 'absolute', bottom: 5, right: 5 }}>
        <Button
          onClick={(e) => {
            props.onCancel && props.onCancel(e);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type={'primary'}
          onClick={() => {
            props.onSubmit && props.onSubmit(value);
          }}
        >
          {t('Save')}
        </Button>
      </Space>
    </div>
  );
}

Markdown.Void = observer((props: any) => {
  const { schema } = useDesignable();
  const field = useField<any>();
  const text = schema['default'];
  let value = (
    <div
      className={'nb-markdown'}
      dangerouslySetInnerHTML={{ __html: micromark(text || '') }}
    />
  );
  return field?.pattern !== 'readPretty' ? (
    <MarkdownTextArea
      {...props}
      defaultValue={schema['default']}
      onCancel={() => {
        field.readPretty = true;
      }}
      onSubmit={async (value) => {
        field.readPretty = true;
        schema['default'] = value;
        await updateSchema({
          key: schema['key'],
          default: value,
        });
      }}
    />
  ) : (
    <Display.TextArea {...props} text={text} value={value} />
  );
});

Markdown.Void.DesignableBar = observer((props) => {
  const { t } = useTranslation();
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
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            // visible={visible}
            // onVisibleChange={(visible) => {
            //   setVisible(visible);
            // }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'update'}
                  onClick={() => {
                    field.readPretty = false;
                    setVisible(false);
                  }}
                >
                  {t('Edit')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    Modal.confirm({
                      title: t('Delete block'),
                      content: t('Are you sure you want to delete it?'),
                      onOk: async () => {
                        const removed = deepRemove();
                        const last = removed.pop();
                        console.log({ last });
                        await removeSchema(last);
                      },
                    });
                  }}
                >
                  {t('Delete')}
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
