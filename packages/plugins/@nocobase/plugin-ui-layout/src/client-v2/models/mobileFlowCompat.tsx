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
import { Icon as CoreIcon, hasIcon, icons, isFlowPageRoute as isCoreFlowPageRoute } from '@nocobase/client-v2';
import { Button, Empty, Flex, Input, Popover, Radio, Space, theme } from 'antd';
import { debounce, groupBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Search } = Input;

export enum NocoBaseDesktopRouteType {
  group = 'group',
  page = 'page',
  flowRoute = 'flowRoute',
  link = 'link',
  tabs = 'tabs',
  flowPage = 'flowPage',
}

export type NocoBaseDesktopRouteTypeValue = NocoBaseDesktopRouteType | (string & {});

export interface NocoBaseDesktopRouteOptions {
  hasPersistedMenuInstanceFlow?: boolean;
  [key: string]: unknown;
}

export interface NocoBaseDesktopRoute {
  id?: number;
  parentId?: number;
  children?: NocoBaseDesktopRoute[];
  title?: string;
  tooltip?: string;
  icon?: string;
  schemaUid?: string;
  menuSchemaUid?: string;
  tabSchemaName?: string;
  pageSchemaUid?: string;
  type?: NocoBaseDesktopRouteTypeValue;
  options?: NocoBaseDesktopRouteOptions;
  sort?: number;
  hideInMenu?: boolean;
  enableTabs?: boolean;
  hidden?: boolean;
  roles?: Array<{
    name: string;
    title: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: unknown;
  updatedBy?: unknown;
}

export function isFlowPageRoute(route: NocoBaseDesktopRoute | undefined) {
  return isCoreFlowPageRoute(route);
}

export const zIndexContext = React.createContext(100);

export interface IconPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  suffix?: React.ReactNode;
  iconSize?: number;
  searchable?: boolean;
}

interface IconPickerReadPrettyProps {
  value?: string;
}

type IconProps = React.ComponentProps<typeof CoreIcon>;

function getZIndex(type: 'page' | 'drawer' | 'modal', basicZIndex: number, level: number) {
  let result = basicZIndex;

  if (type === 'page' && !window.location.pathname.includes('/embed/')) {
    result = basicZIndex + level;
    return result > 200 ? result - 200 : result;
  }

  result = basicZIndex + level;
  return result < 200 ? result + 200 : result;
}

function isRenderableIcon(type?: string) {
  if (!type || !/(outlined|filled|twotone)$/i.test(type) || !hasIcon(type)) {
    return false;
  }
  const IconComponent = icons.get(type.toLowerCase());
  return (
    typeof IconComponent === 'function' ||
    typeof IconComponent?.render === 'function' ||
    typeof IconComponent?.['$$typeof'] === 'symbol'
  );
}

export function Icon(props: IconProps) {
  return isRenderableIcon(props.type) ? <CoreIcon {...props} /> : null;
}

function groupByIconName(data: string[]) {
  return groupBy(data, (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith('outlined')) return 'Outlined';
    if (lowerName.endsWith('filled')) return 'Filled';
    if (lowerName.endsWith('twotone')) return 'TwoTone';
    return 'Outlined';
  });
}

function IconField(props: IconPickerProps) {
  const { token } = theme.useToken();
  const layout = useFormLayout();
  const popoverZIndex = getZIndex('drawer', useContext(zIndexContext), 1);
  const { t } = useTranslation();
  const { value, onChange, disabled, iconSize = token.fontSizeXL, searchable = true } = props;
  const availableIcons = useMemo(() => [...icons.keys()].filter(isRenderableIcon), []);
  const groupedIcons = useMemo(() => groupByIconName(availableIcons), [availableIcons]);
  const [open, setOpen] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState(availableIcons);
  const [type, setType] = useState('Outlined');
  const buttonSize = layout.size === 'default' ? undefined : layout.size;

  const filterIcons = useMemo(
    () =>
      debounce((search?: string) => {
        const searchValue = search?.trim().toLowerCase() ?? '';
        setFilteredIcons(
          searchValue.length
            ? availableIcons.filter((iconName) => iconName.toLowerCase().includes(searchValue))
            : availableIcons,
        );
      }, 250),
    [availableIcons],
  );

  const iconContent = (
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
        onChange={(event) => setType(event.target.value)}
      />
      <div>
        {(groupedIcons[type] || []).map((key) => {
          if (!filteredIcons.includes(key)) {
            return null;
          }
          const iconLabel = key.replace(/outlined|filled|twotone$/i, '');

          return (
            <button
              key={key}
              type="button"
              aria-label={iconLabel}
              title={iconLabel}
              style={{
                padding: 0,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                fontSize: iconSize,
                marginRight: token.marginSM,
                cursor: 'pointer',
              }}
              onClick={() => {
                onChange?.(key);
                setOpen(false);
              }}
            >
              <Icon type={key} />
            </button>
          );
        })}
      </div>
    </Flex>
  );

  return (
    <div>
      <Space.Compact>
        <Popover
          placement="bottom"
          open={open}
          onOpenChange={(nextOpen) => {
            if (disabled) {
              return;
            }
            setOpen(nextOpen);
          }}
          zIndex={popoverZIndex}
          content={
            <div
              style={{
                width: '26em',
                [searchable ? 'height' : 'maxHeight']: '20em',
                overflowY: 'auto',
              }}
            >
              {filteredIcons.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : iconContent}
            </div>
          }
          title={
            searchable ? (
              <Search
                style={{ marginTop: token.marginXS }}
                role="search"
                name="icon-search"
                placeholder={t('Search')}
                allowClear
                onSearch={filterIcons}
                onChange={(event) => filterIcons(event.target?.value)}
              />
            ) : null
          }
          trigger="click"
        >
          <Button size={buttonSize} disabled={disabled}>
            {isRenderableIcon(value) ? <Icon type={value || ''} /> : t('Select icon')}
          </Button>
        </Popover>
        {value && !disabled ? (
          <Button size={buttonSize} icon={<CloseOutlined />} onClick={() => onChange?.(undefined)} />
        ) : null}
      </Space.Compact>
    </div>
  );
}

export const IconPicker = connect(
  IconField,
  mapProps((props: IconPickerProps, field) => ({
    ...props,
    suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
  })),
  mapReadPretty((props: IconPickerReadPrettyProps) => {
    if (!isValid(props.value)) {
      return <div />;
    }
    return <Icon type={props.value || ''} />;
  }),
);
