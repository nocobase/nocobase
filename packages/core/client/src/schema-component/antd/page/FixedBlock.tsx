import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { css } from '@emotion/css';
import { SchemaSettings } from '../../../schema-settings';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks';
import { useRecord } from '../../../record-provider';
import { useBlockTemplateContext } from '../../../schema-templates/BlockTemplate';

const FixedBlockContext = React.createContext({
  setFixedSchema: (schema: Schema) => {},
  height: 0,
  fixedSchemaRef: {} as unknown as React.MutableRefObject<Schema>,
});

export const useFixedSchema = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { setFixedSchema, fixedSchemaRef } = useFixedBlock();
  const { fieldSchema: templateFieldSchema } = useBlockTemplateContext();
  const hasSet = useRef(false);

  useEffect(() => {
    if (fieldSchema?.['x-decorator-props']?.fixedBlock) {
      const nextSchema = templateFieldSchema || fieldSchema;
      setFixedSchema(nextSchema);
      hasSet.current = true;
    } else if (hasSet.current) {
      setFixedSchema(null);
    }
  }, [field?.decoratorProps?.fixedBlock, fieldSchema?.['x-decorator-props']?.fixedBlock]);

  useEffect(
    () => () => {
      if (hasSet.current && fixedSchemaRef.current) {
        setFixedSchema(null);
        fixedSchemaRef.current = null;
      }
    },
    [],
  );
};

export const useFixedBlock = () => {
  return useContext(FixedBlockContext);
};

export const useFixedBlockDesignerSetting = () => {
  const field = useField();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const record = useRecord();

  return useMemo(() => {
    if (Object.keys(record).length) {
      return;
    }
    return (
      <SchemaSettings.SwitchItem
        title={t('Fix block')}
        checked={fieldSchema['x-decorator-props']['fixedBlock']}
        onChange={async (fixedBlock) => {
          const decoratorProps = {
            ...fieldSchema['x-decorator-props'],
            fixedBlock,
          };
          await dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': decoratorProps,
            },
          });
          field.decoratorProps = fieldSchema['x-decorator-props'] = decoratorProps;
        }}
      />
    );
  }, [fieldSchema['x-decorator-props'], field.decoratorProps?.fixedBlock, dn, record]);
};

interface FixedBlockProps {
  height: number;
}

const FixedBlock: React.FC<FixedBlockProps> = (props) => {
  const { height } = props;
  const [fixedSchema, _setFixedSchema] = useState<Schema>();
  const fixedSchemaRef = useRef(fixedSchema);

  const setFixedSchema = (next) => {
    if (fixedSchema && next) {
      fixedSchemaRef.current = next;
    }
    _setFixedSchema(next);
  };

  const schema = useMemo<Schema>(() => {
    return fixedSchema?.parent;
  }, [fixedSchema]);

  return (
    <FixedBlockContext.Provider value={{ height, setFixedSchema, fixedSchemaRef }}>
      {schema ? (
        <div
          className={css`
            height: 100%;
            overflow: hidden;
            .noco-card-item {
              height: 100%;
              .ant-card {
                display: flex;
                flex-direction: column;
                height: 100%;
                .ant-card-body {
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  overflow: hidden;
                  // padding-bottom: 0;
                }
              }
              & .ant-spin-nested-loading {
                height: 100%;
                overflow: hidden;
              }
              & .ant-spin-container {
                height: 100%;
              }
            }
          `}
          style={{
            height: `calc(100vh - ${height}px)`,
          }}
        >
          <RecursionField onlyRenderProperties={false} schema={schema} />
        </div>
      ) : (
        props.children
      )}
    </FixedBlockContext.Provider>
  );
};

export default FixedBlock;
