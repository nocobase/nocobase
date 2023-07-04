import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo } from 'react';
import { useCompile } from '../../schema-component';
import { Variable } from '.././../schema-component';
import { useFormVariable } from '../VariableInput/hooks/useFormVariable';

export const ChildDynamicComponent = observer(
  (props: { collectionName: string; form: any; onChange; value; default }) => {
    const { form, collectionName, onChange, value } = props;
    const formVariabele = useFormVariable({ blockForm: form, rootCollection: collectionName });
    const compile = useCompile();
    const result = useMemo(() => [formVariabele].filter(Boolean), [formVariabele]);
    const scope = compile(result);
    const fieldSchema = useFieldSchema();
    useEffect(() => {
      onChange(fieldSchema.default);
    }, []);
    return (
      <Variable.Input
        value={value}
        onChange={(v) => onChange(v)}
        scope={scope}
        style={{ minWidth: '400px', marginRight: 15 }}
        className={css`
          .ant-input {
            width: 100% !important;
          }
        `}
      />
    );
  },
  { displayName: 'ChildDynamicComponent' },
);
