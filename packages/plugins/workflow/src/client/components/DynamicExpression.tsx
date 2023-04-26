import { onFieldInputValueChange, onFormInitialValuesChange } from '@formily/core';
import { connect, mapReadPretty, observer, useForm, useFormEffects } from '@formily/react';
import { Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRecord, Variable } from '@nocobase/client';

import { NAMESPACE } from '../locale';
import { useCollectionFieldOptions } from '../variable';

const InternalExpression = observer((props: any) => {
  const { onChange, sourceCollection } = props;
  const { values } = useForm();
  const [collection, setCollection] = useState(values?.sourceCollection);

  useFormEffects(() => {
    onFormInitialValuesChange((form) => {
      setCollection(form.values.sourceCollection);
    });
    onFieldInputValueChange('sourceCollection', (f) => {
      setCollection(f.value);
      onChange(null);
    });
  });

  const options = useCollectionFieldOptions({ collection: sourceCollection || collection });

  return <Variable.TextArea {...props} scope={options} />;
});

function Result(props) {
  const { sourceCollection } = props;
  const { t } = useTranslation();
  const values = useRecord();
  const options = useMemo(
    () => useCollectionFieldOptions({ collection: sourceCollection || values.sourceCollection }),
    [values.sourceCollection, values.sourceCollection, sourceCollection],
  );
  return props.value ? (
    <Variable.TextArea {...props} scope={options} />
  ) : (
    <Tag>{t('Unconfigured', { ns: NAMESPACE })}</Tag>
  );
}

export const DynamicExpression = connect(InternalExpression, mapReadPretty(Result));
