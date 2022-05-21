import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionField, useCollection } from '../../../collection-manager';
import { useCompile, useFilterOptions } from '../../../schema-component';

export const AssignedField = (props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const [type, setType] = useState<string>('constantValue');
  const [value, setValue] = useState(field?.value?.value ?? '');
  const [options, setOptions] = useState<any[]>([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const { uiSchema } = collectionField;
  const currentUser = useFilterOptions('users');
  const currentRecord = useFilterOptions(collectionField.collectionName);

  useEffect(() => {
    const opt = [
      {
        name: 'currentUser',
        title: t('Current user'),
        children: [...currentUser],
      },
      {
        name: 'currentRecord',
        title: t('Current record'),
        children: [...currentRecord],
      },
    ];
    setOptions(compile(opt));
  }, []);

  const valueChangeHandler = (val) => {
    setValue(val);
  };

  return <CollectionField {...props} value={field.value} onChange={valueChangeHandler} />;

  // return (
  //   <Space>
  //     <Select defaultValue={type} value={type} style={{ width: 120 }} onChange={typeChangeHandler}>
  //       <Select.Option value="constantValue">{t('Constant value')}</Select.Option>
  //       <Select.Option value="dynamicValue">{t('Dynamic value')}</Select.Option>
  //     </Select>

  //     {type === 'constantValue' ? (
  //       <CollectionField {...props} onChange={valueChangeHandler} />
  //     ) : (
  //       <Cascader
  //         fieldNames={{
  //           label: 'title',
  //           value: 'name',
  //           children: 'children',
  //         }}
  //         style={{
  //           width: 150,
  //         }}
  //         options={options}
  //         onChange={valueChangeHandler}
  //         defaultValue={value}
  //       />
  //     )}
  //   </Space>
  // );
};
