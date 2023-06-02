import React, { createContext, useContext, useState } from 'react';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { RecordProvider, ActionContext, useActionContext, useRecord, useCollection } from '../../';
import { useTranslation } from 'react-i18next';
import { css, cx } from '@emotion/css';
import { useAPIClient, useBlockRequestContext } from '../../';
import { actionDesignerCss } from './CreateRecordAction';
import { fetchTemplateData } from '../../schema-component/antd/form-v2/Templates';
import { message } from 'antd';

const DuplicatefieldsContext = createContext(null);

export const useDuplicatefieldsContext = () => {
  return useContext(DuplicatefieldsContext);
};

export const DuplicateAction = observer((props) => {
  const { children } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const [visible, setVisible] = useState(false);
  const { resource, service } = useBlockRequestContext();

  const { duplicateFields, duplicateMode = 'quickDulicate' } = field.componentProps;
  const { id } = useRecord();
  const ctx = useActionContext();
  const { name } = useCollection();
  const { t } = useTranslation();
  console.log(duplicateFields)
  const template = { key: 'duplicate', dataId: id, default: true, fields: duplicateFields || [], collection: name };
  const handelQuickDuplicate = () => {
    fetchTemplateData(api, template, t).then(async (data) => {
      await resource.create({
        values: {
          ...data,
        },
      });
      message.success(t('Saved successfully'));
      await service?.refresh?.();
    });
  };
  return (
    <div
      className={cx(
        actionDesignerCss,
        css`
          .general-schema-designer {
            top: -10px;
            bottom: -10px;
            left: -10px;
            right: -10px;
          }
        `,
      )}
    >
      <DuplicatefieldsContext.Provider
        value={{
          display: false,
          enabled: true,
          defaultTemplate: template,
        }}
      >
        <RecordProvider record={null}>
          <a
            onClick={async () => {
              if (duplicateMode === 'quickDulicate') {
                handelQuickDuplicate();
              } else {
                setVisible(true);
              }
            }}
          >
            {children || t('Duplicate')}
          </a>
          <ActionContext.Provider value={{ ...ctx, visible, setVisible }}>
            <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
          </ActionContext.Provider>
        </RecordProvider>
      </DuplicatefieldsContext.Provider>
    </div>
  );
});
