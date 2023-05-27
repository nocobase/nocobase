import { CloseCircleOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { Button, Card, Divider } from 'antd';
import React, { useContext } from 'react';
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

const ToManyNester = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { options, field, allowMultiple, allowDissociate } = useAssociationFieldContext<ArrayField>();
  const { t } = useTranslation();
  return (
    <Card bordered={true} style={{ position: 'relative' }}>
      {(field.value || []).map((value, index) => {
        let allowed = allowDissociate;
        if (!allowDissociate) {
          allowed = !value?.[options.targetKey];
        }
        return (
          <>
            {!field.readPretty && allowed && (
              <div style={{ textAlign: 'right' }}>
                <CloseCircleOutlined
                  style={{ zIndex: 1000, position: 'absolute', color: '#a8a3a3' }}
                  onClick={() => {
                    const result = field.value;
                    result.splice(index, 1);
                    field.value = result;
                  }}
                />
              </div>
            )}
            <RecursionField onlyRenderProperties basePath={field.address.concat(index)} schema={fieldSchema} />
            <Divider />
          </>
        );
      })}
      {field.editable && allowMultiple && (
        <Button
          type={'dashed'}
          block
          onClick={() => {
            const result = field.value;
            result.push({});
            field.value = result;
          }}
        >
          {t('Add new')}
        </Button>
      )}
    </Card>
  );
});
