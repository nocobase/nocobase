import { css, cx } from '@emotion/css';
import { Button, Cascader } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function VariableSelect(props) {
  const { options, onInsert } = props;
  const { t } = useTranslation();
  const [selectedVar, setSelectedVar] = useState<string[]>([]);

  useEffect(() => {
    setSelectedVar([]);
  }, [options]);

  return (
    <Button
      className={cx(
        'x-button',
        css`
          position: relative;

          .ant-select.ant-cascader {
            position: absolute;
            top: -1px;
            left: -1px;
            min-width: auto;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            overflow: hidden;
            opacity: 0;
          }
        `,
      )}
    >
      <span
        className={css`
          font-style: italic;
          font-family: 'New York', 'Times New Roman', Times, serif;
        `}
      >
        x
      </span>
      <Cascader
        placeholder={t('Select a variable')}
        value={[]}
        options={options}
        onChange={(keyPaths = [], selectedOptions = []) => {
          setSelectedVar(keyPaths as string[]);
          if (!keyPaths.length) {
            return;
          }
          const option = selectedOptions[selectedOptions.length - 1];
          if (!option?.children?.length) {
            onInsert(keyPaths);
          }
        }}
        changeOnSelect
        onClick={(e: any) => {
          if (e.detail !== 2) {
            return;
          }
          for (let n = e.target; n && n !== e.currentTarget; n = n.parentNode) {
            if (Array.from(n.classList ?? []).includes('ant-cascader-menu-item')) {
              onInsert(selectedVar);
            }
          }
        }}
        popupClassName={css`
          .ant-cascader-menu {
            margin-bottom: 0;
          }
        `}
        dropdownRender={(menu) => (
          <>
            {menu}
            <div
              className={css`
                padding: 0.5em;
                border-top: 1px solid rgba(0, 0, 0, 0.06);
                color: rgba(0, 0, 0, 0.45);
              `}
            >
              {t('Double click to choose entire object')}
            </div>
          </>
        )}
      />
    </Button>
  );
}
