import React, { forwardRef, useState } from 'react';
import {
  observer,
  connect,
  useField,
  RecursionField,
  ISchema,
  Schema,
  useFieldSchema,
  useForm,
  FormConsumer,
} from '@formily/react';
import { ArrayCollapse, FormLayout } from '@formily/antd';
import { uid, isValid } from '@formily/shared';
import '@formily/antd/lib/form-tab/style';
import {
  Collapse,
  Button,
  Dropdown,
  Menu,
  Tag,
  Select,
  Divider,
  Input,
  Badge,
  message,
  Drawer,
  Space,
} from 'antd';
import { options, interfaces, getDefaultFields } from './interfaces';
import {
  DeleteOutlined,
  DatabaseOutlined,
  PlusOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import cls from 'classnames';
import './style.less';
import Modal from 'antd/lib/modal/Modal';
import { clone, cloneDeep, get } from 'lodash';
import { useEffect } from 'react';
import { useRequest } from 'ahooks';
import {
  collectionMoveToAfter,
  createOrUpdateCollection,
  deleteCollection,
} from '..';
import { useCollectionsContext } from '../../constate/Collections';
import {
  DragHandle,
  SortableItem,
  SortableItemContext,
} from '../../components/Sortable';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface SelectOptionProps {
  id: any;
  title: string;
  data?: any;
  onRemove?: any;
  showRemove?: boolean;
}

function SelectOption(props: SelectOptionProps) {
  const { id, data, onRemove, showRemove } = props;
  return (
    <SortableItem id={id} data={data}>
      <div
        style={{
          display: 'flex',
          // justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <DragHandle
          component={forwardRef<any>((props, ref) => {
            return <MenuOutlined {...props} ref={ref} />;
          })}
        />
        <span style={{ width: 8 }} />
        {data.title}
        {showRemove && (
          <DeleteOutlined style={{ marginLeft: 'auto' }} onClick={onRemove} />
        )}
      </div>
    </SortableItem>
  );
}

export const DatabaseCollection = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const schema = useFieldSchema();
  const [activeIndex, setActiveIndex] = useState(0);
  const form = useForm();
  const [newValue, setNewValue] = useState('');
  const { loading, refresh, collections = [] } = useCollectionsContext();
  const [dragOverlayContent, setDragOverlayContent] = useState('');

  useEffect(() => {
    field.setValue(collections);
    console.log('onSuccess', collections);
  }, [collections]);

  return (
    <div>
      <Button
        className={'nb-database-config'}
        style={{
          height: 46,
          borderRadius: 0,
        }}
        onClick={async () => {
          setVisible(true);
          // await run();
          if (field.value?.length === 0) {
            field.push({
              name: `t_${uid()}`,
              unsaved: true,
              generalFields: getDefaultFields(),
            });
          }
        }}
        type={'primary'}
      >
        <DatabaseOutlined />
      </Button>
      <Drawer
        width={'50%'}
        // bodyStyle={{
        //   overflow: 'auto',
        //   maxHeight: 'calc(100vh - 300px)',
        // }}
        title={
          <div style={{ textAlign: 'center' }}>
            <DndContext
              onDragStart={(event) => {
                setDragOverlayContent(event.active?.data?.current?.title || '');
              }}
              onDragEnd={async (event) => {
                const sourceName = event.active?.data?.current?.name;
                const targetName = event.over?.data?.current?.name;
                console.log({ sourceName, targetName });
                await collectionMoveToAfter(sourceName, targetName);
                await refresh();
              }}
            >
              {createPortal(
                <DragOverlay
                  zIndex={2000}
                  style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                  {dragOverlayContent}
                </DragOverlay>,
                document.body,
              )}
              <Select
                loading={loading}
                value={activeIndex}
                style={{ minWidth: 300, textAlign: 'center' }}
                onChange={(value) => {
                  setActiveIndex(value as any);
                }}
                open={open}
                onDropdownVisibleChange={setOpen}
                optionLabelProp={'label'}
                dropdownRender={(menu) => {
                  return (
                    <div>
                      {menu}
                      <Divider style={{ margin: '5px 0 4px' }} />
                      <div
                        style={{
                          cursor: 'pointer',
                          padding: '5px 12px',
                        }}
                      >
                        <Input.Search
                          size={'middle'}
                          placeholder={'创建数据表'}
                          enterButton={<PlusOutlined />}
                          value={newValue}
                          onChange={(e) => {
                            setNewValue(e.target.value);
                          }}
                          onSearch={async (value) => {
                            const data = {
                              name: `t_${uid()}`,
                              title: value,
                              generalFields: getDefaultFields(),
                            };
                            field.push(data);
                            setActiveIndex(field.value.length - 1);
                            setOpen(false);
                            setNewValue('');
                            await createOrUpdateCollection(data);
                            await refresh();
                          }}
                        />
                      </div>
                    </div>
                  );
                }}
              >
                {field.value?.map((item, index) => {
                  return (
                    <Select.Option
                      key={index}
                      value={index}
                      label={`${item.title || '未命名'}${
                        item.unsaved ? ' （未保存）' : ''
                      }`}
                    >
                      <SelectOption
                        id={item.name}
                        title={item.title || '未命名'}
                        data={{
                          title: item.title,
                          name: item.name,
                        }}
                        showRemove={item.privilege !== 'undelete'}
                        onRemove={async (e) => {
                          e.stopPropagation();
                          field.remove(index);
                          if (field.value?.length === 0) {
                            field.push({
                              name: `t_${uid()}`,
                              unsaved: true,
                              generalFields: getDefaultFields(),
                            });
                          }
                          if (activeIndex === index) {
                            setActiveIndex(0);
                          } else if (activeIndex > index) {
                            setActiveIndex(activeIndex - 1);
                          }
                          if (item.name) {
                            await deleteCollection(item.name);
                            await refresh();
                          }
                        }}
                      />
                    </Select.Option>
                  );
                })}
              </Select>
            </DndContext>
          </div>
        }
        visible={visible}
        onClose={() => {
          setVisible(false);
        }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button
              onClick={() => {
                setVisible(false);
              }}
            >
              关闭
            </Button>
            <Button
              type={'primary'}
              onClick={async () => {
                try {
                  form.clearErrors();
                  await form.validate(
                    `${field.address.entire}.${activeIndex}.*`,
                  );
                  delete field.value[activeIndex]['unsaved'];
                  await createOrUpdateCollection(field.value[activeIndex]);
                  await refresh();
                  message.success('保存成功');
                } catch (error) {}
              }}
            >
              保存
            </Button>
          </Space>
        }
        // okText={'保存'}
        // cancelText={'关闭'}
        // onOk={async () => {
        //   try {
        //     form.clearErrors();
        //     await form.validate(`${field.address.entire}.${activeIndex}.*`);
        //     delete field.value[activeIndex]['unsaved'];
        //     await createOrUpdateCollection(field.value[activeIndex]);
        //     await refresh();
        //     message.success('保存成功');
        //   } catch (error) {}
        // }}
      >
        <FormLayout layout={'vertical'}>
          <RecursionField
            name={activeIndex}
            schema={
              new Schema({
                type: 'object',
                properties: schema.properties,
              })
            }
          />
          {/* <FormConsumer>
              {(form) => <pre>{JSON.stringify(form.values, null, 2)}</pre>}
            </FormConsumer> */}
        </FormLayout>
      </Drawer>
    </div>
  );
});

export const DatabaseField: any = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  useEffect(() => {
    if (!field.value) {
      field.setValue([]);
    }
  }, []);
  const [activeKey, setActiveKey] = useState(null);
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <div>
      <DndContext
        onDragStart={(event) => {
          setDragOverlayContent(event.active?.data?.current?.title || '');
        }}
        onDragEnd={async (event) => {
          const fromIndex = event.active?.data?.current?.index;
          const toIndex = event.over?.data?.current?.index;
          if (isValid(fromIndex) && isValid(toIndex)) {
            field.move(fromIndex, toIndex);
          }
        }}
      >
        {createPortal(
          <DragOverlay
            zIndex={2000}
            style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            {dragOverlayContent}
          </DragOverlay>,
          document.body,
        )}
        <Collapse
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
          }}
          className={cls({ empty: !field.value?.length })}
          accordion
        >
          {field.value?.map((item, index) => {
            if (!item.interface) {
              return;
            }
            const schema = cloneDeep(interfaces.get(item.interface));
            if (!schema) {
              console.error('schema invalid');
              return;
            }
            const path = field.address.concat(index);
            const errors = field.form.queryFeedbacks({
              type: 'error',
              address: `*(${path},${path}.*)`,
            });
            return (
              <Collapse.Panel
                header={
                  <SortableItem
                    id={item.key}
                    className={'sortable-item'}
                    data={{
                      index,
                      title: item?.uiSchema?.title,
                    }}
                  >
                    <DragHandle className={'drag-handle'} />
                    {(item.uiSchema && item.uiSchema.title) || (
                      <i style={{ color: 'rgba(0, 0, 0, 0.25)' }}>未命名</i>
                    )}{' '}
                    <Tag
                      className={
                        item.privilege ? cls(item.privilege) : undefined
                      }
                    >
                      {schema.title}
                    </Tag>
                    <span
                      style={{ color: 'rgba(0, 0, 0, 0.25)', fontSize: 14 }}
                    >
                      {item.name}
                    </span>
                  </SortableItem>
                }
                extra={
                  item.privilege === 'undelete'
                    ? []
                    : [
                        <Badge key={'1'} count={errors.length} />,
                        <DeleteOutlined
                          key={'2'}
                          onClick={(e) => {
                            e.stopPropagation();
                            field.remove(index);
                          }}
                        />,
                      ]
                }
                key={item.key}
                forceRender
              >
                <RecursionField
                  key={`${item.key}_${index}`}
                  name={index}
                  schema={
                    new Schema({
                      type: 'object',
                      properties: {
                        layout: {
                          type: 'void',
                          'x-component': 'FormLayout',
                          'x-component-props': {
                            layout: 'vertical',
                            // labelCol: 4,
                            // wrapperCol: 20,
                          },
                          properties: schema.properties,
                        },
                      },
                    })
                  }
                />
              </Collapse.Panel>
            );
          })}
        </Collapse>
      </DndContext>
      <Dropdown
        placement={'bottomCenter'}
        overlayClassName={'all-fields'}
        overlayStyle={{
          minWidth: 200,
        }}
        overlay={
          <Menu
            onClick={(info) => {
              const schema = interfaces.get(info.key);
              if (!schema) {
                return;
              }
              const data = {
                ...cloneDeep(schema.default),
                key: uid(),
                name: `f_${uid()}`,
                interface: info.key,
              };
              if (schema.initialize) {
                schema.initialize(data);
              }
              field.push(data);
              setActiveKey(data.key);
              console.log('info.key', field.value);
            }}
          >
            {options.map(
              (option, groupIndex) =>
                option.children.length > 0 && (
                  <Menu.ItemGroup key={groupIndex} title={option.label}>
                    {option.children.map((item) => (
                      <Menu.Item key={item.name}>{item.title}</Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                ),
            )}
          </Menu>
        }
      >
        <Button
          block
          type={'dashed'}
          icon={<PlusOutlined />}
          style={{ marginTop: 10 }}
        >
          添加字段
        </Button>
      </Dropdown>
    </div>
  );
});
