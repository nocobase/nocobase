import React, { useState } from 'react';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { RecordProvider, ActionContext, useActionContext } from '../../';
import { t } from 'i18next';
import { actionDesignerCss } from './CreateRecordAction';

export const DuplicateAction = observer((props) => {
  const { children } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  const { depulicateFields, duplicateMode } = field.componentProps;
  const ctx = useActionContext();

  return (
    <div className={actionDesignerCss}>
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
    </div>
  );
});
