import React, { useState } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { RecursionField, useFieldSchema } from '@formily/react';
import { Dropdown, Menu, Button } from 'antd';
import { observer } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager, useCollection, CollectionProvider } from '../../collection-manager';
import { ActionContext, useCompile, Action } from '../../schema-component';
import { useDesignable } from '../../schema-component/hooks';

export const CreateRecordAction = observer(() => {
  const { DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  const collection = useCollection();
  const fieldSchema = useFieldSchema();
  const { getChildrenCollections, refreshCM } = useCollectionManager();
  const inheritsCollections = getChildrenCollections(collection.name);
  const [currentCollection, setCurrentCollection] = useState(collection.name);
  const compile = useCompile();
  const { t } = useTranslation();
  const menu = (
    <Menu>
      {inheritsCollections.map((option) => {
        return (
          <Menu.Item
            key={option.name}
            onClick={(info) => {
              setVisible(true);
              setCurrentCollection(option.name);
            }}
          >
            {compile(option.title)}
          </Menu.Item>
        );
      })}
    </Menu>
  );
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      {inheritsCollections?.length > 0 ? (
        <Dropdown.Button
          type="primary"
          icon={<DownOutlined />}
          buttonsRender={([leftButton, rightButton]) => [
            leftButton,
            React.cloneElement(rightButton as React.ReactElement<any, string>, { loading: false }),
          ]}
          overlay={menu}
          onClick={(info) => {
            setVisible(true);
            setCurrentCollection(collection.name);
          }}
        >
          <PlusOutlined />
          {t('Add new')}
          <DesignableBar />
        </Dropdown.Button>
      ) : (
        <Button
          type={'primary'}
          icon={<PlusOutlined />}
          onClick={(info) => {
            setVisible(true);
            setCurrentCollection(collection.name);
          }}
        >
          {t('Add new')}
          <DesignableBar />
        </Button>
      )}
      <CollectionProvider name={currentCollection}>
        <RecursionField schema={fieldSchema} name="create" onlyRenderProperties />
      </CollectionProvider>
    </ActionContext.Provider>
  );
});
