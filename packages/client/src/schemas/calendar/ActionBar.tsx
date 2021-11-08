import { DndContext, DragOverlay } from '@dnd-kit/core';
import { observer, RecursionField, Schema } from '@formily/react';
import React, { useState } from 'react';
import { ISchema } from '..';
import {
  findPropertyByPath,
  getSchemaPath,
  useDesignable,
} from '../../components/schema-renderer';
import {
  useClient,
  DisplayedMapProvider,
  useDisplayedMapContext,
} from '../../constate';
import cls from 'classnames';
import { Button, Dropdown, Menu, Space } from 'antd';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { uid } from '@formily/shared';
import { SettingOutlined } from '@ant-design/icons';
import { Droppable, SortableItem } from '../../components/Sortable';
import { useTranslation } from 'react-i18next';

export const ActionBar = observer((props: any) => {
  const { align = 'top' } = props;
  // const { schema, designable } = useDesignable();
  const { root, schema, insertAfter, remove, appendChild } = useDesignable();
  const moveToAfter = (path1, path2, extra = {}) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(
      {
        ...data.toJSON(),
        ...extra,
      },
      path2,
    );
  };
  const { updateSchema } = useClient();

  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <DndContext
      onDragStart={(event) => {
        setDragOverlayContent(event.active.data?.current?.title || '');
        // const previewRef = event.active.data?.current?.previewRef;
        // if (previewRef) {
        //   setDragOverlayContent(previewRef?.current?.innerHTML);
        // } else {
        //   setDragOverlayContent('');
        // }
      }}
      onDragEnd={async (event) => {
        const path1 = event.active?.data?.current?.path;
        const path2 = event.over?.data?.current?.path;
        const align = event.over?.data?.current?.align;
        const draggable = event.over?.data?.current?.draggable;
        if (!path1 || !path2) {
          return;
        }
        if (path1.join('.') === path2.join('.')) {
          return;
        }
        if (!draggable) {
          console.log('alignalignalignalign', align);
          const p = findPropertyByPath(root, path1);
          if (!p) {
            return;
          }
          remove(path1);
          const data = appendChild(
            {
              ...p.toJSON(),
              'x-align': align,
            },
            path2,
          );
          await updateSchema(data);
        } else {
          const data = moveToAfter(path1, path2, {
            'x-align': align,
          });
          await updateSchema(data);
        }
      }}
    >
      <DragOverlay style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        {dragOverlayContent}
        {/* <div style={{ transform: 'translateX(-100%)' }} dangerouslySetInnerHTML={{__html: dragOverlayContent}}></div> */}
      </DragOverlay>
      <DisplayedMapProvider>
        <div className={cls('nb-action-bar', `align-${align}`)}>
          <div style={{ width: '50%' }}>
            <Actions align={'left'} />
          </div>
          <div style={{ marginLeft: 'auto', width: '50%', textAlign: 'right' }}>
            <Actions align={'right'} />
          </div>
          <AddActionButton />
        </div>
      </DisplayedMapProvider>
    </DndContext>
  );
});

function generateActionSchema(type) {
  const actions: { [key: string]: ISchema } = {
    today: {
      type: 'void',
      title: '{{t("Today")}}',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Calendar.Today',
      'x-align': 'left',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'today',
      },
    },
    nav: {
      type: 'void',
      title: '{{t("Navigate")}}',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Calendar.Nav',
      'x-align': 'left',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'nav',
      },
    },
    title: {
      type: 'void',
      title: '{{t("Title")}}',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Calendar.Title',
      'x-align': 'left',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'title',
      },
    },
    viewSelect: {
      type: 'void',
      title: '{{t("Select view")}}',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Calendar.ViewSelect',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'viewSelect',
      },
    },
    filter: {
      type: 'void',
      title: '{{t("Filter")}}',
      'x-align': 'right',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Calendar.Filter',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'filter',
      },
    },
    create: {
      type: 'void',
      title: '{{t("Add new")}}',
      'x-align': 'right',
      'x-designable-bar': 'Calendar.ActionDesignableBar',
      'x-component': 'Action',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'create',
      },
      'x-component-props': {
        type: 'primary',
        icon: 'PlusOutlined',
      },
      properties: {
        modal: {
          type: 'void',
          title: '{{t("Add record")}}',
          'x-decorator': 'Form',
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Calendar.useCreateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
  };
  return actions[type];
}

function AddActionButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { appendChild, remove } = useDesignable();
  const { schema, designable } = useDesignable();
  const { createSchema, removeSchema } = useClient();

  if (!designable) {
    return null;
  }
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup title={t('Enable actions')}>
            {[
              { title: t('Today'), name: 'today' },
              { title: t('Navigate'), name: 'nav' },
              { title: t('Title'), name: 'title' },
              { title: t('Select view'), name: 'viewSelect' },
              { title: t('Filter'), name: 'filter' },
              { title: t('Add new'), name: 'create' },
            ].map((item) => (
              <SwitchMenuItem
                key={item.name}
                checked={displayed.has(item.name)}
                title={item.title}
                onChange={async (checked) => {
                  if (!checked) {
                    const s = displayed.get(item.name) as Schema;
                    const path = getSchemaPath(s);
                    displayed.remove(item.name);
                    const removed = remove(path);
                    await removeSchema(removed);
                  } else {
                    const s = generateActionSchema(item.name);
                    const data = appendChild(s);
                    await createSchema(data);
                  }
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu disabled title={t('Customize')}>
            <Menu.Item style={{ minWidth: 120 }}>{t('Function')}</Menu.Item>
            <Menu.Item>{t('Popup form')}</Menu.Item>
            <Menu.Item>{t('Flexible popup')}</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button
        className={'designable-btn designable-btn-dash'}
        style={{ marginLeft: 8 }}
        type={'dashed'}
        icon={<SettingOutlined />}
      >
        {t('Configure actions')}
      </Button>
    </Dropdown>
  );
}

function Actions(props: any) {
  const { align = 'left' } = props;
  const { schema, designable } = useDesignable();
  return (
    <Droppable
      id={`${schema.name}-${align}`}
      className={`action-bar-align-${align}`}
      data={{ align, path: getSchemaPath(schema) }}
    >
      <Space>
        {schema.mapProperties((s) => {
          const currentAlign = s['x-align'] || 'left';
          if (currentAlign !== align) {
            return null;
          }
          return (
            <SortableItem
              id={s.name}
              data={{
                align,
                draggable: true,
                title: s.title,
                path: getSchemaPath(s),
              }}
            >
              <RecursionField name={s.name} schema={s} />
            </SortableItem>
          );
        })}
      </Space>
    </Droppable>
  );
}
