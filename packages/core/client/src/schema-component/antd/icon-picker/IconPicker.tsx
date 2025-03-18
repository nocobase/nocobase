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
import { Button, Empty, Input, Space, theme, Radio, Flex } from 'antd';
import { debounce, groupBy } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, hasIcon, icons } from '../../../icon';
import { StablePopover } from '../popover';

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

const groupByIconName = (data) => {
  return groupBy(data, (str) => {
    if (str.endsWith('outlined')) return 'Outlined';
    if (str.endsWith('filled')) return 'Filled';
    if (str.endsWith('twotone')) return 'TwoTone';
  });
};

function IconField(props: IconPickerProps) {
  const { fontSizeXL } = theme.useToken().token;
  const availableIcons = [...icons.keys()];
  const layout = useFormLayout();
  const { value, onChange, disabled, iconSize = fontSizeXL, searchable = true } = props;
  const [visible, setVisible] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState(availableIcons);
  const [type, setType] = useState('Outlined');
  const { t } = useTranslation();
  const groupIconData = groupByIconName(availableIcons);

  const style: any = {
    width: '26em',
    [`${searchable ? 'height' : 'maxHeight'}`]: '20em',
    overflowY: 'auto',
  };

  const filterIcons = debounce((value) => {
    const searchValue = value?.trim() ?? '';
    setFilteredIcons(
      searchValue.length
        ? availableIcons.filter((i) => i.split(' ').some((val) => val.includes(searchValue)))
        : availableIcons,
    );
  }, 250);

  const IconContent = () => {
    return (
      <Flex vertical gap="middle">
        <Radio.Group
          options={[
            {
              label: t('Outlined'),
              value: 'Outlined',
            },
            {
              label: t('Filled'),
              value: 'Filled',
            },
            {
              label: t('Two tone'),
              value: 'TwoTone',
            },
          ]}
          value={type}
          optionType="button"
          onChange={(e) => {
            setType(e.target.value);
          }}
        />
        <div>
          {groupIconData[type].map((key) => {
            if (filteredIcons.includes(key)) {
              return (
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
              );
            }
          })}
        </div>
      </Flex>
    );
  };
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
            <div style={style}>
              {filteredIcons.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <IconContent />}
            </div>
          }
          title={
            <div>
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
