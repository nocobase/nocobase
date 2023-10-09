import { cx } from '@emotion/css';
import { Button, Cascader } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToken } from '../__builtins__';
import useStyles from './VariableSelect.style';

export function VariableSelect({ options, setOptions, onInsert, changeOnSelect = false }): JSX.Element {
  const { t } = useTranslation();
  const [selectedVar, setSelectedVar] = useState<string[]>([]);
  const { wrapSSR, componentCls, hashId } = useStyles();
  const { token } = useToken();

  async function loadData(selectedOptions) {
    const option = selectedOptions[selectedOptions.length - 1];
    if (!option.children?.length && !option.isLeaf && option.loadChildren) {
      await option.loadChildren(option);
      setOptions((prev) => [...prev]);
    }
  }

  return wrapSSR(
    <Button className={cx('x-button', componentCls, hashId)}>
      <span className={'variable-btn'}>x</span>
      <Cascader
        placeholder={t('Select a variable')}
        value={[]}
        options={options}
        loadData={loadData}
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
        changeOnSelect={changeOnSelect}
        onClick={(e: any) => {
          if (e.detail !== 2 || !changeOnSelect) {
            return;
          }
          for (let n = e.target; n && n !== e.currentTarget; n = n.parentNode) {
            if (Array.from(n.classList ?? []).includes('ant-cascader-menu-item')) {
              onInsert(selectedVar);
            }
          }
        }}
        popupClassName={'Cascader-popupClassName'}
        dropdownRender={
          changeOnSelect
            ? (menu) => (
                <>
                  {menu}
                  <div
                    style={{
                      padding: '0.5em',
                      borderTop: `1px solid ${token.colorBorder}`,
                      color: token.colorTextDescription,
                    }}
                  >
                    {t('Double click to choose entire object')}
                  </div>
                </>
              )
            : null
        }
      />
    </Button>,
  );
}
