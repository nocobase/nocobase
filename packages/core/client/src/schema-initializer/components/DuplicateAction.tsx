import React, { createContext, useContext, useState } from 'react';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { RecordProvider, ActionContext, useActionContext, useRecord, useCollection } from '../../';
import { t } from 'i18next';
import { actionDesignerCss } from './CreateRecordAction';

const DuplicatefieldsContext = createContext(null);

export const useDuplicatefieldsContext = () => {
  return useContext(DuplicatefieldsContext);
};

export const DuplicateAction = observer((props) => {
  const { children } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  const { duplicateFields, duplicateMode } = field.componentProps;
  const { id } = useRecord();
  const ctx = useActionContext();
  const { name } = useCollection();
  return (
    <div className={actionDesignerCss}>
      <DuplicatefieldsContext.Provider
        value={{
          display: false,
          enabled: true,
          defaultTemplate: { key: 'duplicate', dataId: id, default: true, fields: duplicateFields, collection: name },
        }}
      >
        <RecordProvider record={null}>
          <a
            onClick={async () => {
              if (duplicateMode === 'quickDulicate') {
                console.log(duplicateMode);
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
