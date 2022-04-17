import { observer, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useMemo } from 'react';
import { RemoteSchemaComponent, useDesignable } from '..';
import { useSchemaTemplateManager } from './SchemaTemplateManagerProvider';

const BlockTemplateContext = createContext<any>({});

export const useBlockTemplateContext = () => {
  return useContext(BlockTemplateContext);
};

export const BlockTemplate = observer((props: any) => {
  const { templateId } = props;
  const { getTemplateById } = useSchemaTemplateManager();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  return (
    <div>
      <BlockTemplateContext.Provider value={{ dn, field, fieldSchema, template }}>
        <RemoteSchemaComponent noForm uid={template?.uid} />
      </BlockTemplateContext.Provider>
    </div>
  );
});
