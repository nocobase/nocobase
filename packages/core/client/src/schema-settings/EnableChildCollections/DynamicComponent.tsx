import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo } from 'react';
import { useCompile } from '../../schema-component';
import { Variable } from '.././../schema-component';
import { useFormVariable } from '../VariableInput/hooks/useFormVariable';
import { useIterationVariable } from '../VariableInput/hooks/useIterationVariable';

export const ChildDynamicComponent = observer(
  (props: { rootCollection: string; onChange; value; default; collectionField }) => {
    const { rootCollection, onChange, value, collectionField } = props;
    const fieldSchema = useFieldSchema();
    const formVariable = useFormVariable({ collectionName: rootCollection, collectionField });
    const iterationVariable = useIterationVariable({
      currentCollection: collectionField?.collectionName,
      schema: collectionField?.uiSchema,
      collectionField,
    });

    const compile = useCompile();
    const result = useMemo(() => [formVariable, iterationVariable].filter(Boolean), [formVariable, iterationVariable]);
    const scope = compile(result);
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
