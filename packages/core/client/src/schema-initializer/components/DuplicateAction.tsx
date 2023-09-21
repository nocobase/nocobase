import { css, cx } from '@emotion/css';
import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { App, Button } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionContextProvider,
  CollectionProvider,
  RecordProvider,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useDesignable,
  useRecord,
} from '../../';
import { fetchTemplateData } from '../../schema-component/antd/form-v2/Templates';
import { actionDesignerCss } from './CreateRecordAction';

const DuplicatefieldsContext = createContext(null);

export const useDuplicatefieldsContext = () => {
  return useContext(DuplicatefieldsContext);
};

export const DuplicateAction = observer((props: any) => {
  const { children } = props;
  const { message } = App.useApp();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const disabled: boolean = field.disabled || props.disabled;
  const { designable } = useDesignable();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { service, __parent, block } = useBlockRequestContext();
  const { duplicateFields, duplicateMode = 'quickDulicate', duplicateCollection } = fieldSchema['x-component-props'];
  const record = useRecord();
  const { id, __collection } = record;
  const ctx = useActionContext();
  const { name } = useCollection();
  const { getCollectionFields } = useCollectionManager();
  const { t } = useTranslation();
  const collectionFields = getCollectionFields(__collection || name);
  const template = {
    key: 'duplicate',
    dataId: id,
    default: true,
    fields:
      duplicateFields?.filter((v) => {
        return collectionFields.find((k) => v.includes(k.name));
      }) || [],
    collection: __collection || name,
  };
  const isLinkBtn = fieldSchema['x-component'] === 'Action.Link';
  const handelQuickDuplicate = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplateData(api, template, t);
      await api.resource(__collection || name).create({
        values: {
          ...data,
        },
      });
      message.success(t('Saved successfully'));
      if (block === 'form') {
        __parent?.service?.refresh?.();
      } else {
        await service?.refresh?.();
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error); // Handle or log the error appropriately
    }
  };
  const handelDuplicate = () => {
    if (!disabled && !loading) {
      if (duplicateFields?.length > 0) {
        if (duplicateMode === 'quickDulicate') {
          handelQuickDuplicate();
        } else {
          setVisible(true);
        }
      } else {
        message.error(t('Please configure the duplicate fields'));
      }
    }
  };
  return (
    <div
      className={cx(actionDesignerCss, {
        [css`
          .general-schema-designer {
            top: -10px;
            bottom: -10px;
            left: -10px;
            right: -10px;
          }
        `]: isLinkBtn,
      })}
    >
      <DuplicatefieldsContext.Provider
        value={{
          display: false,
          enabled: true,
          defaultTemplate: template,
        }}
      >
        <div>
          {isLinkBtn ? (
            <a
              //@ts-ignore
              disabled={disabled}
              style={{
                opacity: designable && field?.data?.hidden && 0.1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handelDuplicate}
            >
              {loading ? t('Duplicating') : children || t('Duplicate')}
            </a>
          ) : (
            <Button
              data-testid={'duplicate-action'}
              disabled={disabled}
              style={{
                opacity: designable && field?.data?.hidden && 0.1,
              }}
              {...props}
              onClick={handelDuplicate}
            >
              {loading ? t('Duplicating') : children || t('Duplicate')}
            </Button>
          )}
          <CollectionProvider name={duplicateCollection || name}>
            <RecordProvider record={{ ...record, __collection: duplicateCollection || __collection }}>
              <ActionContextProvider value={{ ...ctx, visible, setVisible }}>
                <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
              </ActionContextProvider>
            </RecordProvider>
          </CollectionProvider>
        </div>
      </DuplicatefieldsContext.Provider>
    </div>
  );
});
