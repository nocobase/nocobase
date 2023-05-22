import { CloseCircleOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { Button, Card, Divider } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssociationFieldContext } from './context';
import { useAssociationFieldContext } from './hooks';

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

const toArr = (value, isReadpretty) => {
  if (!value) {
    return isReadpretty ? [] : [{}];
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value : isReadpretty ? [] : [{}];
  }
  return [value];
};

const ToManyNester = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { field } = useAssociationFieldContext<ArrayField>();
  const [values, setValues] = useState([]);
  useEffect(() => {
    const values = toArr(field.value, field.readPretty);
    setValues(values);
  }, []);
  const { t } = useTranslation();
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
                    const data = values.concat();
                    data.splice(index, 1);
                    setValues(data);
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
            const data = values.concat();
            data.push({});
            setValues(data);
          }}
        >
          {t('Add new')}
        </Button>
      )}
    </Card>
  );
});
