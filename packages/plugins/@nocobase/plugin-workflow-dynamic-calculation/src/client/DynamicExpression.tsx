/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { onFieldInputValueChange, onFormInitialValuesChange } from '@formily/core';
import { connect, mapReadPretty, observer, useField, useForm, useFormEffects } from '@formily/react';
import { Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCollectionManager, useCompile, useRecord, Variable } from '@nocobase/client';
import { getCollectionFieldOptions } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';

const InternalExpression = observer(
  (props: any) => {
    const { onChange } = props;
    const field = useField<any>();
    // TODO(refactor): better to provide another context like useFieldset()
    const form = useForm();
    const basePath = field.path.segments.slice(0, -1);
    const collectionPath = [...basePath, 'sourceCollection'].join('.');
    const [collection, setCollection] = useState(form.getValuesIn(collectionPath));
    const compile = useCompile();
    const collectionManager = useCollectionManager();

    useFormEffects(() => {
      onFormInitialValuesChange((form) => {
        setCollection(form.getValuesIn(collectionPath));
      });
      onFieldInputValueChange(collectionPath, (f) => {
        setCollection(f.value);
        onChange(null);
      });
    });

    const options = getCollectionFieldOptions({ collection, compile, collectionManager });

    return <Variable.TextArea {...props} scope={options} />;
  },
  { displayName: 'InternalExpression' },
);

function Result(props) {
  const { t } = useTranslation();
  const values = useRecord();
  const compile = useCompile();
  const collectionManager = useCollectionManager();
  const options = useMemo(
    () => getCollectionFieldOptions({ collection: values.sourceCollection, compile, collectionManager }),
    [collectionManager, compile, values.sourceCollection],
  );
  return props.value ? (
    <Variable.TextArea {...props} scope={options} />
  ) : (
    <Tag>{t('Unconfigured', { ns: NAMESPACE })}</Tag>
  );
}

export const DynamicExpression = connect(InternalExpression, mapReadPretty(Result));
