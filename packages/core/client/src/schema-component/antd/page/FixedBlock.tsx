import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css } from '@emotion/css';
import { SchemaSettings } from '../../../schema-settings';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks';
import { useRecord } from '../../../record-provider';

const FixedBlockContext = React.createContext<{
  setFixedBlock: (value: string | false) => void;
  height: number;
  fixedBlockUID: boolean | string;
}>({
  setFixedBlock: () => {},
  height: 0,
  fixedBlockUID: false,
});

export const useFixedSchema = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { setFixedBlock, fixedBlockUID } = useFixedBlock();
  const hasSet = useRef(false);

  useEffect(() => {
    if (!fixedBlockUID || hasSet.current) {
      setFixedBlock(field?.decoratorProps?.fixedBlock ? fieldSchema['x-uid'] : false);
      hasSet.current = true;
    }
  }, [field?.decoratorProps?.fixedBlock]);

  return fieldSchema['x-uid'] === fixedBlockUID;
};

export const useFixedBlock = () => {
  return useContext(FixedBlockContext);
};

export const FixedBlockWrapper: React.FC = (props) => {
  const fixedBlock = useFixedSchema();
  const { height, fixedBlockUID } = useFixedBlock();
  // The fixedBlockUID of false means that the page has no fixed blocks
  if (!fixedBlock && fixedBlockUID) return null;
  return (
    <div
      className="nb-fixed-block"
      style={{
        height: fixedBlockUID !== false ? `calc(100vh - ${height}px)` : undefined,
      }}
    >
      {props.children}
    </div>
  );
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
        checked={fieldSchema['x-decorator-props']?.fixedBlock}
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

const fixedBlockCss = css`
  overflow: hidden;
  position: relative;
  .noco-card-item {
    height: 100%;
    .ant-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      .ant-card-body {
        height: 1px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }
  }
`;

const FixedBlock: React.FC<FixedBlockProps> = (props) => {
  const { height } = props;
  const [fixedBlockUID, setFixedBlock] = useState<false | string>(false);
  return (
    <FixedBlockContext.Provider value={{ height, setFixedBlock, fixedBlockUID }}>
      <div
        className={fixedBlockUID ? fixedBlockCss : ''}
        style={{
          height: fixedBlockUID ? `calc(100vh - ${height}px)` : undefined,
        }}
      >
        {props.children}
      </div>
    </FixedBlockContext.Provider>
  );
};

export default FixedBlock;
