import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { Card, Divider, Tooltip } from 'antd';
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
    <Card
      bordered={true}
      style={{ position: 'relative' }}
      className={css`
        > .ant-card-body > .ant-divider:last-child {
          display: none;
        }
      `}
    >
      {(field.value || []).map((value, index) => {
        let allowed = allowDissociate;
        if (!allowDissociate) {
          allowed = !value?.[options.targetKey];
        }
        return (
          <>
            {!field.readPretty && allowed && (
              <div style={{ textAlign: 'right' }}>
                {[
                  field.editable && allowMultiple && (
                    <Tooltip key={'add'} title={t('Add new')}>
                      <PlusOutlined
                        style={{ zIndex: 1000, marginRight: '10px', color: '#a8a3a3' }}
                        onClick={() => {
                          action(() => {
                            if (!Array.isArray(field.value)) {
                              field.value = [];
                            }
                            spliceArrayState(field as any, {
                              startIndex: index + 1,
                              insertCount: 1,
                            });
                            field.value.splice(index + 1, 0, null);
                            return field.onInput(field.value);
                          });
                        }}
                      />
                    </Tooltip>
                  ),
                  <Tooltip key={'remove'} title={t('Remove')}>
                    <CloseOutlined
                      style={{ zIndex: 1000, color: '#a8a3a3' }}
                      onClick={() => {
                        action(() => {
                          spliceArrayState(field as any, {
                            startIndex: index,
                            deleteCount: 1,
                          });
                          field.value.splice(index, 1);
                          return field.onInput(field.value);
                        });
                      }}
                    />
                  </Tooltip>,
                ]}
              </div>
            )}
            <RecursionField onlyRenderProperties basePath={field.address.concat(index)} schema={fieldSchema} />
            <Divider />
          </>
        );
      })}
      {/* {field.editable && allowMultiple && (
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
      )} */}
    </Card>
  );
});
