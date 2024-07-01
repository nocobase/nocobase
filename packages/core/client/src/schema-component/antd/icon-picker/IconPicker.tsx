/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { useFormLayout } from '@formily/antd-v5';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid } from '@formily/shared';
import { Button, Empty, Space, Input, theme } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, hasIcon, icons } from '../../../icon';
import { StablePopover } from '../popover';
import { debounce } from 'lodash';
import { createStyles } from 'antd-style';

const { Search } = Input;

export interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  suffix?: React.ReactNode;
  iconSize?: number;
  searchable?: boolean;
}

interface IconPickerReadPrettyProps {
  value?: string;
}

const useStyle = (isSearchable: IconPickerProps['searchable']) =>
  createStyles(({ css }) => {
    return {
      popoverContent: css`
        width: 26em;
        ${!isSearchable && 'max-'}height: 20em;
        overflow-y: auto;
      `,
    };
  })();

function IconField(props: IconPickerProps) {
  const { fontSizeXL } = theme.useToken().token;
  const availableIcons = [...icons.keys()];
  const layout = useFormLayout();
  const { value, onChange, disabled, iconSize = fontSizeXL, searchable = true } = props;
  const [visible, setVisible] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState(availableIcons);
  const { t } = useTranslation();
  const { styles } = useStyle(searchable);

  const filterIcons = debounce((value) => {
    const searchValue = value?.trim() ?? '';
    setFilteredIcons(
      searchValue.length
        ? availableIcons.filter((i) => i.split(' ').some((val) => val.includes(searchValue)))
        : availableIcons,
    );
  }, 250);

  return (
    <div>
      <Space.Compact>
        <StablePopover
          placement={'bottom'}
          open={visible}
          onOpenChange={(val) => {
            if (disabled) {
              return;
            }
            setVisible(val);
          }}
          content={
            <div className={styles.popoverContent}>
              {filteredIcons.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                filteredIcons.map((key) => (
                  <span
                    key={key}
                    title={key.replace(/outlined|filled|twotone$/i, '')}
                    style={{ fontSize: iconSize, marginRight: 10, cursor: 'pointer' }}
                    onClick={() => {
                      onChange(key);
                      setVisible(false);
                    }}
                  >
                    <Icon type={key} />
                  </span>
                ))
              )}
            </div>
          }
          title={
            <div>
              <div>{t('Icon')}</div>
              {searchable && (
                <Search
                  style={{ marginTop: 8 }}
                  role="search"
                  name="icon-search"
                  placeholder={t('Search')}
                  allowClear
                  onSearch={filterIcons}
                  onChange={(event) => filterIcons(event.target?.value)}
                />
              )}
            </div>
          }
          trigger="click"
        >
          <Button size={layout.size as any} disabled={disabled}>
            {hasIcon(value) ? <Icon type={value} /> : t('Select icon')}
          </Button>
        </StablePopover>
        {value && !disabled && (
          <Button
            size={layout.size as any}
            icon={<CloseOutlined />}
            onClick={(e) => {
              onChange(null);
            }}
          ></Button>
        )}
      </Space.Compact>
    </div>
  );
}

export const IconPicker = connect(
  IconField,
  mapProps((props: IconPickerProps, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props: IconPickerReadPrettyProps) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    return <Icon type={props.value} />;
  }),
);

export default IconPicker;
