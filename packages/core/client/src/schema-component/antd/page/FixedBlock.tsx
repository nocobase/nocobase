import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { css } from '@emotion/css';
import { SchemaSettings } from '../../../schema-settings';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks';
import { useGridContext } from '../grid';
import { useRecord } from '../../../record-provider';

const FixedBlockContext = React.createContext({
  setFixedSchema: (schema: Schema) => {},
  height: 0,
  schema: {} as unknown as Schema,
});

export const useFixedSchema = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { setFixedSchema } = useFixedBlock();
  const hasSet = useRef(false);

  useEffect(() => {
    if (fieldSchema?.['x-decorator-props']?.fixedBlock) {
      setFixedSchema(fieldSchema);
      hasSet.current = true;
    }
  }, [field?.decoratorProps?.fixedBlock, fieldSchema?.['x-decorator-props']?.fixedBlock]);

  useEffect(
    () => () => {
      if (hasSet.current) {
        setFixedSchema(null);
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
        onChange={(fixedBlock) => {
          field.decoratorProps.fixedBlock = fixedBlock;
          fieldSchema['x-decorator-props'].fixedBlock = fixedBlock;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
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
  const [fixedSchema, setFixedSchema] = useState<Schema>();
  const schema = useMemo<Schema>(() => {
    if (!fixedSchema || fixedSchema['x-decorator-props']?.fixedBlock !== true) return;
    return fixedSchema.parent;
  }, [fixedSchema, fixedSchema?.['x-decorator-props']['fixedBlock']]);

  return (
    <FixedBlockContext.Provider value={{ schema: fixedSchema, height, setFixedSchema }}>
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
