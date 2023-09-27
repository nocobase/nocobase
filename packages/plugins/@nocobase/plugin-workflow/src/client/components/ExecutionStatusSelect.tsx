import { Select, Tag } from 'antd';
import React, { useCallback } from 'react';

import { useCompile } from '@nocobase/client';
import { EXECUTION_STATUS, ExecutionStatusOptions, ExecutionStatusOptionsMap } from '../constants';

function LabelTag(props) {
  const compile = useCompile();
  const label = compile(props.label);
  const onPreventMouseDown = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  const { color } = ExecutionStatusOptionsMap[props.value] ?? {};
  return (
    <Tag color={color} onMouseDown={onPreventMouseDown} closable={props.closable} onClose={props.onClose}>
      {label}
    </Tag>
  );
}

function ExecutionStatusOption(props) {
  const compile = useCompile();
  return (
    <>
      <LabelTag {...props} />
      {props.description ? <span>{compile(props.description)}</span> : null}
    </>
  );
}

export function ExecutionStatusSelect({ ...props }) {
  return (
    <Select
      data-testid="antd-select"
      {...props}
      mode={props.multiple ? 'multiple' : null}
      optionLabelProp="label"
      tagRender={LabelTag}
    >
      {ExecutionStatusOptions.filter((item) => Boolean(item.value) && item.value !== EXECUTION_STATUS.ABORTED).map(
        (option) => (
          <Select.Option key={option.value} {...option}>
            <ExecutionStatusOption {...option} />
          </Select.Option>
        ),
      )}
    </Select>
  );
}
