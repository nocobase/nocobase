import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css } from '@emotion/css';
import { SchemaSettings } from '../../../schema-settings';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks';
import { useRecord } from '../../../record-provider';

const FixedBlockContext = React.createContext({
  setFixedBlock: (value: boolean) => {},
  height: 0,
  isFixedBlock: false,
});

export const useFixedSchema = () => {
  const field = useField();
  const { setFixedBlock } = useFixedBlock();

  useEffect(() => {
    setFixedBlock(field?.decoratorProps?.fixedBlock);
  }, [field?.decoratorProps?.fixedBlock]);

  return field?.decoratorProps?.fixedBlock;
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

const FixedBlock: React.FC<FixedBlockProps> = (props) => {
  const { height } = props;
  const [isFixedBlock, setFixedBlock] = useState<boolean>(false);
  const fixedBlockCss = useMemo(
    () => css`
      overflow: hidden;
      position: relative;
      height: calc(100vh - ${height}px);
      .ant-spin-nested-loading,
      .ant-spin-container {
        height: 100%;
      }
      .nb-page {
        height: 100%;
        > .nb-grid {
          height: 100%;
          > .nb-grid-row {
            height: 100%;
            > .nb-grid-col {
              height: 100%;
              > div,
              .nb-block-wrap {
                height: 100%;
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
              }
            }
          }
        }
      }
    `,
    [height],
  );
  return (
    <FixedBlockContext.Provider value={{ height, setFixedBlock, isFixedBlock }}>
      <div className={isFixedBlock ? fixedBlockCss : ''}>{props.children}</div>
    </FixedBlockContext.Provider>
  );
};

export default FixedBlock;
