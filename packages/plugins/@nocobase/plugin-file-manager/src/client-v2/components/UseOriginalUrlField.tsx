/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Form, Radio, Tag, theme } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useT } from '../locale';
import { PublicAccessField } from './PublicAccessField';

type Translate = (key: string) => string;

export interface UseOriginalUrlRadioProps {
  id?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  originalUrlExample?: string;
  publicAccessControl?: React.ReactNode;
  t: Translate;
}

export interface UseOriginalUrlFieldProps {
  originalUrlExample?: string;
}

const PROXY_URL_EXAMPLE = '/files/main/main/attachments/1.png';
const DEFAULT_ORIGINAL_URL_EXAMPLE = 'https://storage.example.com/path/to/file.png';

export function UseOriginalUrlRadio({
  id,
  value,
  onChange,
  disabled,
  originalUrlExample,
  publicAccessControl,
  t,
}: UseOriginalUrlRadioProps) {
  const { token } = theme.useToken();
  const className = useMemo(
    () => css`
      width: 100%;

      .ant-radio-wrapper {
        width: 100%;
      }

      .file-url-proxy-option {
        position: relative;
        width: 100%;
      }

      .file-url-proxy-option > .ant-radio-wrapper {
        width: 100%;
      }

      .file-url-public-access {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1;
      }

      .ant-radio {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        align-self: flex-start;
        padding-top: ${token.paddingXXS}px;
      }

      .ant-tag {
        max-width: 100%;
        overflow-wrap: anywhere;
        white-space: normal;
      }
    `,
    [token.paddingXXS],
  );
  const usesOriginalUrl = value ?? false;

  return (
    <Radio.Group
      id={id}
      value={usesOriginalUrl}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled}
      className={className}
    >
      <div className="file-url-proxy-option">
        <Radio value={false}>
          <div>{t('NocoBase URL')}</div>
          <div className="ant-form-item-explain">
            {t('Uses a NocoBase file URL and follows the view permissions configured for the file record.')}
          </div>
          <div className="ant-form-item-explain">
            <Tag bordered={false}>{PROXY_URL_EXAMPLE}</Tag>
          </div>
        </Radio>
        {!usesOriginalUrl && publicAccessControl ? (
          <div className="file-url-public-access">{publicAccessControl}</div>
        ) : null}
      </div>
      <Radio value={true}>
        <div>{t('Original URL')}</div>
        <div className="ant-form-item-explain">
          {t('The URL points directly to the storage service and does not pass through NocoBase.')}
        </div>
        <div className="ant-form-item-explain">
          <Tag bordered={false}>{originalUrlExample || DEFAULT_ORIGINAL_URL_EXAMPLE}</Tag>
        </div>
      </Radio>
    </Radio.Group>
  );
}

export function UseOriginalUrlField(props: UseOriginalUrlFieldProps) {
  const t = useT();
  const form = Form.useFormInstance();
  const useOriginalUrl = Form.useWatch(['options', 'useOriginalUrl'], form);

  useEffect(() => {
    if (useOriginalUrl) {
      form.setFieldValue(['options', 'public'], false);
    }
  }, [form, useOriginalUrl]);

  return (
    <Form.Item name={['options', 'useOriginalUrl']} label={`${t('File URL')} :`}>
      <UseOriginalUrlRadio
        t={t}
        originalUrlExample={props.originalUrlExample}
        publicAccessControl={<PublicAccessField />}
      />
    </Form.Item>
  );
}
