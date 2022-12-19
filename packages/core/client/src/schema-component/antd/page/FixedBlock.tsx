import React, { useContext, useMemo, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { SchemaComponent } from '../../core';
import { css } from '@emotion/css';

const FixedBlockContext = React.createContext({
  setFixedSchema: (schema: Schema) => {},
  onFixedSchema: (schema: Schema) => {},
  height: 0,
  schema: {} as unknown as Schema,
});

export const useFixedBlock = () => {
  return useContext(FixedBlockContext);
};

interface FixedBlockProps {
  height: number;
}

const FixedBlock: React.FC<FixedBlockProps> = (props) => {
  const { height } = props;
  const [fixedSchema, setFixedSchema] = useState<Schema>();
  const schema = useMemo<Schema>(() => {
    if (!fixedSchema || fixedSchema['x-decorator-props']['fixedBlock'] !== true) return;
    const parent = fixedSchema.parent;
    return parent;
  }, [fixedSchema, fixedSchema?.['x-decorator-props']['fixedBlock']]);

  const onFixedSchema = (s) => {
    if (s?.['x-decorator-props'].fixedBlock) {
      setFixedSchema(s);
    }
  };
  return (
    <FixedBlockContext.Provider value={{ schema: fixedSchema, height, setFixedSchema, onFixedSchema }}>
      {schema ? (
        <div
          className={css`
            height: 100%;
            overflow: hidden;
            .noco-card-item {
              height: 100%;
              .ant-card {
                height: 100%;
                .ant-card-body {
                  height: 100%;
                }
              }
              .ant-spin-nested-loading {
                height: 100%;
              }
              .ant-spin-container {
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
        <div style={{ marginBottom: 24 }}>{props.children}</div>
      )}
    </FixedBlockContext.Provider>
  );
};

export default FixedBlock;
