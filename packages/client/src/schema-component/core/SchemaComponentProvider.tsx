import { createForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import { uid } from '@formily/shared';
import { useCookieState } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponentContext } from '../context';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentOptions } from './SchemaComponentOptions';

const randomString = (prefix: string = '') => {
  return `${prefix}${uid()}`;
};

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  const { components, children } = props;
  const [, setUid] = useState(uid());
  const [formId, setFormId] = useState(uid());
  const form = props.form || useMemo(() => createForm(), [formId]);
  const { t } = useTranslation();
  const scope = { ...props.scope, t, randomString };
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
