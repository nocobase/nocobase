import React, { useCallback } from 'react';
import { Button, Modal, Select, Tag, Tooltip, message } from 'antd';
import { ExclamationCircleFilled, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { Action, css, useCompile, useRecord, useResourceActionContext, useResourceContext } from '@nocobase/client';

import { EXECUTION_STATUS, ExecutionStatusOptions, ExecutionStatusOptionsMap } from '../constants';
import { lang } from '../locale';

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
  const mode = props.multiple ? 'multiple' : null;

  return (
    <Select
      // @ts-ignore
      role="button"
      data-testid={`select-${mode || 'single'}`}
      {...props}
      mode={mode}
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

export function ExecutionStatusColumn(props) {
  const { t } = useTranslation();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const record = useRecord();
  const onCancel = useCallback(() => {
    Modal.confirm({
      title: lang('Cancel the execution'),
      icon: <ExclamationCircleFilled />,
      content: lang('Are you sure you want to cancel the execution?'),
      onOk: () => {
        resource
          .cancel({
            filterByTk: record.id,
          })
          .then(() => {
            message.success(t('Operation succeeded'));
            refresh();
          })
          .catch((response) => {
            console.error(response.data.error);
          });
      },
    });
  }, [record]);
  return (
    <div
      className={css`
        display: flex;
      `}
    >
      {props.children}
      {record.status ? null : (
        <Tooltip title={lang('Cancel the execution')}>
          <Button type="link" danger onClick={onCancel} shape="circle" size="small" icon={<StopOutlined />} />
        </Tooltip>
      )}
    </div>
  );
}
