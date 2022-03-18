import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAPIClient, useCollectionManager, useCompile, useSchemaTemplateManager } from '..';
import { createTableBlockSchema } from '../schema-initializer/Initializers/Items';

export const AddBlockTemplate = (props: any) => {
  const { t } = useTranslation();
  const history = useHistory();
  const api = useAPIClient();
  const { refresh } = useSchemaTemplateManager();
  const { collections } = useCollectionManager();
  const compile = useCompile();
  const insert = ({ uiSchema, collectionName }) => {
    const key = uid();
    api
      .resource('uiSchemaTemplates')
      .create({
        values: {
          key,
          collectionName,
          uiSchema,
        },
      })
      .then((res) => {
        refresh();
        history.push(`/admin/block-templates/${key}`);
      });
  };
  return (
    <>
      <Dropdown
        overlay={
          <Menu>
            <Menu.SubMenu title={'Table'}>
              {collections?.map((collection) => {
                return (
                  <Menu.Item
                    key={collection.name}
                    onClick={() => {
                      const uiSchema = createTableBlockSchema(collection.name);
                      insert({ uiSchema, collectionName: collection.name });
                    }}
                  >
                    {compile(collection.title)}
                  </Menu.Item>
                );
              })}
            </Menu.SubMenu>
          </Menu>
        }
      >
        <Button type={'primary'}>{t('Add block template')}</Button>
      </Dropdown>
    </>
  );
};
