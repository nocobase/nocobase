/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef, useState } from 'react';
import { VariableSelect } from '@nocobase/client';
import { useT } from '../../../locale';
import { connect } from '@formily/react';
import { Button, Input, Space } from 'antd';
import { BuildOutlined, BlockOutlined } from '@ant-design/icons';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { css } from '@emotion/css';
import { useOnInsert } from '../../useOnInsert';
import { useAIEmployeeButtonVariableOptions } from './useVariableOptions';

export const UISchemaSelector: React.FC<{
  onSelect?: (value: any) => void;
  currentSchema?: any;
}> = ({ onSelect, currentSchema }) => {
  const { startSelect, selectable } = useAISelectionContext();
  const t = useT();

  const handleSelect = () => {
    startSelect('blocks', {
      onSelect: ({ uid }) => {
        if (!uid) {
          return;
        }
        onSelect?.(['$UISchema', uid]);
      },
    });
  };

  const handleInsert = () => {
    const uid = currentSchema?.['x-uid'];
    if (!uid) {
      return;
    }
    onSelect?.(['$UISchema', uid]);
  };

  return (
    <Space.Compact>
      <Button size="small" icon={<BlockOutlined />} onClick={handleInsert}>
        {t('Insert current block UI schema')}
      </Button>
      <Button
        size="small"
        color={selectable === 'blocks' ? 'primary' : 'default'}
        icon={<BuildOutlined />}
        onClick={handleSelect}
      >
        {t('Select block UI schemas')}
      </Button>
    </Space.Compact>
  );
};

export function RawTextArea(props: any): JSX.Element {
  const { changeOnSelect, fieldNames, scope, buttonClass, inputRef, onInsert, ...others } = props;
  const dataScope = typeof scope === 'function' ? scope() : scope;
  const [options, setOptions] = useState(dataScope ? dataScope : []);

  return (
    <div
      className={css`
        position: relative;
        .ant-input {
          width: 100%;
        }
      `}
    >
      <Input.TextArea {...others} ref={inputRef} />
      <Space.Compact
        className={css`
          position: absolute;
          right: 0;
          top: 0;
          .ant-btn-sm {
            font-size: 85%;
          }
        `}
      >
        <VariableSelect
          className={
            buttonClass ??
            css`
              &:not(:hover) {
                border-right-color: transparent;
                border-top-color: transparent;
              }
              background-color: transparent;
            `
          }
          fieldNames={fieldNames}
          options={options}
          setOptions={setOptions}
          onInsert={onInsert}
          changeOnSelect={changeOnSelect}
        />
      </Space.Compact>
    </div>
  );
}

export const AIVariableRawTextArea: React.FC = connect((props) => {
  const { currentSchema, messageType, ...rest } = props;
  const inputRef = useRef<any>(null);
  const { onInsert: onInsertValue } = useOnInsert();
  const scope = useAIEmployeeButtonVariableOptions(messageType);

  const onInsert = useCallback(
    (selected) => {
      const variable = `{{${selected.join('.')}}}`;
      onInsertValue(() => {
        if (!inputRef.current) {
          return;
        }

        const { textArea } = inputRef.current.resizableTextArea;
        return textArea;
      }, variable);
    },
    [onInsertValue],
  );

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <RawTextArea
        scope={scope}
        changeOnSelect={true}
        autoSize={{ minRows: 3 }}
        onInsert={onInsert}
        inputRef={inputRef}
        {...rest}
      />
      {/* <div */}
      {/*   style={{ */}
      {/*     marginTop: 8, */}
      {/*   }} */}
      {/* > */}
      {/*   <UISchemaSelector onSelect={(v) => onInsert(v)} currentSchema={currentSchema} /> */}
      {/* </div> */}
    </div>
  );
});
