import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { spliceArrayState } from '@formily/core/esm/shared/internals';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { action } from '@formily/reactive';
import { each } from '@formily/shared';
import { Button, Card, Divider, Tooltip } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AssociationFieldContext } from './context';
import { useAssociationFieldContext } from './hooks';
import { RecordProvider, useRecord } from '../../../record-provider';

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

const ToManyNester = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const { options, field, allowMultiple, allowDissociate } = useAssociationFieldContext<ArrayField>();
    const { t } = useTranslation();
    return (field.value || []).length > 0 ? (
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
            <React.Fragment key={index}>
              <div style={{ textAlign: 'right' }}>
                {field.editable && allowMultiple && (
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
                          field.value.splice(index + 1, 0, {});
                          each(field.form.fields, (targetField, key) => {
                            if (!targetField) {
                              delete field.form.fields[key];
                            }
                          });
                          return field.onInput(field.value);
                        });
                      }}
                    />
                  </Tooltip>
                )}
                {!field.readPretty && allowed && (
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
                  </Tooltip>
                )}
              </div>
              <RecordProvider record={value}>
                <RecursionField onlyRenderProperties basePath={field.address.concat(index)} schema={fieldSchema} />
              </RecordProvider>
              <Divider />
            </React.Fragment>
          );
        })}
      </Card>
    ) : (
      <>
        {field.editable && allowMultiple && (
          <Tooltip key={'add'} title={t('Add new')}>
            <Button
              type={'default'}
              className={css`
                border: 1px solid #f0f0f0 !important;
                box-shadow: none;
              `}
              block
              icon={<PlusOutlined />}
              onClick={() => {
                const result = field.value;
                result.push({});
                field.value = result;
              }}
            ></Button>
          </Tooltip>
        )}
      </>
    );
  },
  { displayName: 'ToManyNester' },
);
