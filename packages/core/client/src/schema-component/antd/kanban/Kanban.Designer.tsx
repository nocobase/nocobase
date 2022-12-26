import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useKanbanBlockContext } from '../../../block-provider';
import { useCollection } from '../../../collection-manager';
import { useCollectionFilterOptions } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { useFixedBlockDesignerSetting } from '../page';
import {Select} from "antd";

export const KanbanDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const { service } = useKanbanBlockContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.params?.filter || {};
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const template = useSchemaTemplate();
  const fixedBlockDesignerSetting = useFixedBlockDesignerSetting();

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.ModalItem
        title={t('Set the data scope')}
        schema={
          {
            type: 'object',
            title: t('Set the data scope'),
            properties: {
              filter: {
                default: defaultFilter,
                enum: dataSource,
                'x-component': 'Filter',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          service.run({ ...service.params?.[0], filter });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      {fixedBlockDesignerSetting}
      <SchemaSettings.Divider />
      <SchemaSettings.SelectItem
        title={t('Open mode')}
        options={[
          { label: t('Drawer'), value: 'drawer' },
          { label: t('Dialog'), value: 'modal' },
        ]}
        value={fieldSchema?.['x-component-props']?.['openMode'] ?? 'drawer'}
        onChange={(value) => {
          if(fieldSchema['x-component-props']){
            fieldSchema['x-component-props']['openMode'] = value;
          }else{
            fieldSchema['x-component-props'] = {
              openMode: value
            }
          }

          // when openMode change, set openSize value to default
          delete fieldSchema['x-component-props']['openSize'];

          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': fieldSchema['x-component-props'],
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.Item>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          {t('Popup size')}
          <Select
            bordered={false}
            options={[
              { label: t('Small'), value: 'small' },
              { label: t('Middle'), value: 'middle' },
              { label: t('Large'), value: 'large' },
            ]}
            value={
              fieldSchema?.['x-component-props']?.['openSize'] ??
              (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle')
            }
            onChange={(value) => {
              if(fieldSchema['x-component-props']){
                fieldSchema['x-component-props']['openSize'] = value;
              }else{
                fieldSchema['x-component-props'] = {
                  openSize: value
                }
              }

              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-component-props': fieldSchema['x-component-props'],
                },
              });
              dn.refresh();
            }}
            style={{ textAlign: 'right', minWidth: 100 }}
          />
        </div>
      </SchemaSettings.Item>
      <SchemaSettings.Divider />
      <SchemaSettings.Template componentName={'Kanban'} collectionName={name} resourceName={defaultResource} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
