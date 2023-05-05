import React, { createContext, useContext } from 'react';
import { ISchema } from '@formily/react';

const OptionsSchemaContext = createContext<{
  [authType: string]: ISchema;
}>({});

export const OptionsSchemaProvider: React.FC<{ authType: string; schema: ISchema }> = (props) => {
  const schemas = useContext(OptionsSchemaContext);
  schemas[props.authType] = props.schema;
  return <OptionsSchemaContext.Provider value={schemas}>{props.children}</OptionsSchemaContext.Provider>;
};

export const useOptionsSchema = (authType: string) => {
  const schemas = useContext(OptionsSchemaContext);
  return schemas[authType] || {};
};
