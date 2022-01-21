import React, { useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import { useCookieState } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { FormProvider, createSchemaField } from '@formily/react';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentContext } from '../context';

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  const { components, children } = props;
  const [, setUid] = useState(uid());
  const [formId, setFormId] = useState(uid());
  const form = props.form || useMemo(() => createForm(), [formId]);
  const { t } = useTranslation();
  const scope = { ...props.scope, t };
  const SchemaField = useMemo(
    () =>
      createSchemaField({
        scope,
        components,
      }),
    [],
  );
  const [active, setActive] = useCookieState('useCookieDesignable');
  return (
    <SchemaComponentContext.Provider
      value={{
        SchemaField,
        components,
        scope,
        reset: () => setFormId(uid()),
        refresh: () => setUid(uid()),
        designable: active === 'true',
        setDesignable(value) {
          setActive(value ? 'true' : 'false');
        },
      }}
    >
      <FormProvider form={form}>{children}</FormProvider>
    </SchemaComponentContext.Provider>
  );
};
