import React, { useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import { useCookieState } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { FormProvider } from '@formily/react';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentContext } from '../context';
import { SchemaComponentOptions } from './SchemaComponentOptions';

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  const { components, children } = props;
  const [, setUid] = useState(uid());
  const [formId, setFormId] = useState(uid());
  const form = props.form || useMemo(() => createForm(), [formId]);
  const { t } = useTranslation();
  const scope = { ...props.scope, t };
  const [active, setActive] = useCookieState('useCookieDesignable');
  return (
    <SchemaComponentContext.Provider
      value={{
        scope,
        components,
        reset: () => setFormId(uid()),
        refresh: () => setUid(uid()),
        designable: active === 'true',
        setDesignable(value) {
          setActive(value ? 'true' : 'false');
        },
      }}
    >
      <FormProvider form={form}>
        <SchemaComponentOptions inherit scope={scope} components={components}>
          {children}
        </SchemaComponentOptions>
      </FormProvider>
    </SchemaComponentContext.Provider>
  );
};
