import { LoadingOutlined, MenuOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, observer, useField, useFieldSchema } from '@formily/react';
import { Button, Dropdown, Input as AntdInput, Menu, Modal, Space } from 'antd';
import cls from 'classnames';
import { marked } from 'marked';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DraggableBlockContext } from '../../../components/drag-and-drop';
import { DragHandle } from '../../../components/sortable';
import { useDesignable } from '../../hooks';
import { TextAreaDisplay } from '../input';

export function markdown(text) {
  if (!text) {
    return '';
  }
  return marked.parse(text);
}

export const Markdown: any = connect(
  AntdInput.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    let text = props.value;
    let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
    return <TextAreaDisplay {...props} text={text} value={value} />;
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
  const schema = useFieldSchema();
  const field = useField<any>();
  const text = schema['default'];
  let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
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
    <TextAreaDisplay {...props} text={text} value={value} />
  );
});

Markdown.Void.DesignableBar = observer((props) => {
  const { t } = useTranslation();
  const field = useField();
  const { designable } = useDesignable();
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
