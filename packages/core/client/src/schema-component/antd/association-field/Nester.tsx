import { ArrayField } from '@formily/core';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { Button, Card, Divider } from 'antd';
import React, { useContext, useMemo } from 'react';
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
  const values = useMemo(() => toArr(field.value), field.value);
  return (
    <Card bordered={true}>
      {values.map((_, index) => {
        return (
          <>
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
            field.value.push({});
          }}
        >
          Add new
        </Button>
      )}
    </Card>
  );
});
