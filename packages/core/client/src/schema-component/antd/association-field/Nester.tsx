import { ArrayField } from '@formily/core';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { Button, Card, Divider } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import React, { useContext } from 'react';
import { AssociationFieldContext } from './context';
import { useAssociationFieldContext } from './hooks';
import { useTranslation } from 'react-i18next';
// import { useRemoveActionProps } from '../../../block-provider/hooks';

export const Nester = (props) => {
  const { options } = useContext(AssociationFieldContext);
  if (['hasOne', 'belongsTo'].includes(options.type)) {
    return <ToOneNester {...props} />;
  }
  if (['hasMany', 'belongsToMany'].includes(options.type)) {
    return <ToManyNester {...props} />;
  }
  return null;
};

const ToOneNester = (props) => {
  return <Card bordered={true}>{props.children}</Card>;
};

const toArr = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const ToManyNester = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { field } = useAssociationFieldContext<ArrayField>();
  const values = toArr(field.value);
  const { t } = useTranslation();
  // const { onClick } = useRemoveActionProps(`${collectionField.collectionName}.${collectionField.target}`);
  return (
    <Card bordered={true} style={{ position: 'relative' }}>
      {values.map((value, index) => {
        return (
          <>
            {!field.readPretty && (
              <div style={{ textAlign: 'right' }}>
                <CloseCircleOutlined
                  style={{ zIndex: 1000, position: 'absolute', color: '#a8a3a3' }}
                  onClick={() => {
                    field.value.splice(index, 1);
                  }}
                />
              </div>
            )}
            <RecursionField onlyRenderProperties basePath={field.address.concat(index)} schema={fieldSchema} />
            <Divider />
          </>
        );
      })}
      {field.editable && (
        <Button
          type={'dashed'}
          block
          onClick={() => {
            field.value = field.value || [];
            field.value.push({});
          }}
        >
            {t('Add new')}
        </Button>
      )}
    </Card>
  );
});
