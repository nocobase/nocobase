/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { FlowModel, FlowModelRenderer, observer } from '@nocobase/flow-engine';
import { Divider, Dropdown, Empty, Select, Spin, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { createAclSnippetAllow } from '../../../acl/createAclSnippetAllow';
import { TopbarActionModel } from './TopbarActionModel';

export const USER_CENTER_ACTION_ID = 'user-center';

export type UserCenterSection = 'profile' | 'preferences' | 'system' | 'danger';

export type UserCenterSelectOption = {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
};

const USER_CENTER_SECTION_SORT: Record<UserCenterSection, number> = {
  profile: 100,
  preferences: 200,
  system: 300,
  danger: 400,
};

const userCenterTriggerClassName = css`
  display: inline-flex;
  align-items: center;
  height: 100%;
`;

const userCenterDropdownClassName = css`
  width: max-content;
  min-width: 204px;
  max-width: min(240px, calc(100vw - 24px));
  padding: var(--nb-user-center-overlay-padding);
  border-radius: var(--nb-user-center-border-radius);
  background: var(--nb-user-center-bg);
  box-shadow: var(--nb-user-center-shadow);

  .nb-user-center-loading,
  .nb-user-center-empty {
    padding: var(--nb-user-center-section-padding);
  }

  .nb-user-center-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--nb-user-center-item-gap);
    width: 100%;
    padding: var(--nb-user-center-item-padding);
    border: 0;
    border-radius: calc(var(--nb-user-center-border-radius) - 2px);
    background: none;
    color: var(--nb-user-center-text);
    font-size: var(--nb-user-center-font-size);
    line-height: var(--nb-user-center-line-height);
    text-align: left;
  }

  .nb-user-center-item-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: 0;
  }

  .nb-user-center-item-label,
  .nb-user-center-item-description,
  .nb-user-center-item-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nb-user-center-item-label {
    color: var(--nb-user-center-text);
  }

  .nb-user-center-item-description,
  .nb-user-center-item-value {
    color: var(--nb-user-center-text-secondary);
  }

  .nb-user-center-item-action {
    cursor: pointer;
  }

  .nb-user-center-item-action:hover:not(:disabled),
  .nb-user-center-item-action:focus-visible:not(:disabled) {
    background: var(--nb-user-center-hover-bg);
    outline: none;
  }

  .nb-user-center-item-action:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .nb-user-center-item-text {
    cursor: default;
  }

  .nb-user-center-item-text .nb-user-center-item-label {
    color: var(--nb-user-center-text-secondary);
  }

  .nb-user-center-item-text .nb-user-center-item-main {
    gap: 0;
  }

  .nb-user-center-item-select {
    cursor: pointer;
  }

  .nb-user-center-item-select:hover {
    background: var(--nb-user-center-hover-bg);
  }

  .nb-user-center-item-select .ant-select {
    min-width: 100px;
    color: var(--nb-user-center-text);
    text-align: right;
  }

  .nb-user-center-item-select .ant-select-selector {
    padding: 0 11px !important;
    text-align: right;
  }

  .nb-user-center-item-select .ant-select-selection-item {
    padding: 0 18px 0 0 !important;
    height: 30px;
    line-height: 30px;
    text-align: right;
  }

  .nb-user-center-item-select .ant-select-selection-wrap {
    justify-content: flex-end;
  }

  .ant-divider {
    margin: var(--nb-user-center-divider-margin) 0;
  }
`;

function getUserCenterDropdownVars(token: ReturnType<typeof theme.useToken>['token']): React.CSSProperties {
  return {
    '--nb-user-center-bg': token.colorBgElevated,
    '--nb-user-center-hover-bg': token.colorFillTertiary,
    '--nb-user-center-text': token.colorText,
    '--nb-user-center-text-secondary': token.colorTextDescription,
    '--nb-user-center-shadow': token.boxShadowSecondary,
    '--nb-user-center-border-radius': `${token.borderRadiusLG}px`,
    '--nb-user-center-overlay-padding': `${token.paddingXXS}px`,
    '--nb-user-center-section-padding': `${token.paddingSM}px`,
    '--nb-user-center-item-gap': `${token.marginXS}px`,
    '--nb-user-center-item-padding': `${token.paddingXS}px ${token.paddingSM}px`,
    '--nb-user-center-font-size': `${token.fontSize}px`,
    '--nb-user-center-line-height': String(token.lineHeight),
    '--nb-user-center-divider-margin': `${token.marginXXS}px`,
  } as React.CSSProperties;
}

function getUserCenterItemClassId(ModelClass: typeof UserCenterItemModel) {
  return String((ModelClass as any).itemId || '');
}

function UserCenterItemErrorFallback() {
  return null;
}

export class UserCenterItemModel extends FlowModel {
  static itemId?: string;

  declare aclSnippet?: string;
  declare label?: React.ReactNode;
  declare description?: React.ReactNode;
  declare value?: React.ReactNode;
  declare closeDropdown?: () => void;

  itemId = getUserCenterItemClassId(this.constructor as typeof UserCenterItemModel);
  section: UserCenterSection = 'system';
  sort = 0;
  ready = true;

  getItemId() {
    return this.itemId || getUserCenterItemClassId(this.constructor as typeof UserCenterItemModel);
  }

  getSectionSort() {
    return USER_CENTER_SECTION_SORT[this.section] || USER_CENTER_SECTION_SORT.system;
  }

  isVisible() {
    return !this.hidden;
  }

  isReady() {
    return this.ready !== false;
  }

  setCloseDropdown(closeDropdown?: () => void) {
    this.closeDropdown = closeDropdown;
  }

  resolveNode(node?: React.ReactNode) {
    if (typeof node === 'string') {
      return this.context.t(node);
    }

    return node;
  }

  getLabelNode() {
    return this.resolveNode(this.label);
  }

  getDescriptionNode() {
    return this.resolveNode(this.description);
  }

  getValueNode() {
    return this.resolveNode(this.value);
  }

  async prepare() {}

  render() {
    return <UserCenterTextItemView model={this as UserCenterTextItemModel} />;
  }
}

export class UserCenterTextItemModel extends UserCenterItemModel {
  render() {
    return <UserCenterTextItemView model={this} />;
  }
}

export class UserCenterActionItemModel extends UserCenterItemModel {
  danger = false;
  disabled = false;
  closeOnClick = true;

  async onClick() {}

  render() {
    return <UserCenterActionItemView model={this} />;
  }
}

export class UserCenterSelectItemModel extends UserCenterItemModel {
  options: UserCenterSelectOption[] = [];
  disabled = false;
  closeOnChange = true;

  async onChange(_value: string) {}

  render() {
    return <UserCenterSelectItemView model={this} />;
  }
}

const UserCenterTextItemView = observer(
  (props: { model: UserCenterTextItemModel }) => {
    const { model } = props;

    return (
      <div className="nb-user-center-item nb-user-center-item-text">
        <div className="nb-user-center-item-main">
          <span className="nb-user-center-item-label">{model.getLabelNode()}</span>
          {model.description ? (
            <span className="nb-user-center-item-description">{model.getDescriptionNode()}</span>
          ) : null}
        </div>
        {model.value ? <span className="nb-user-center-item-value">{model.getValueNode()}</span> : null}
      </div>
    );
  },
  { displayName: 'UserCenterTextItemView' },
);

const UserCenterActionItemView = observer(
  (props: { model: UserCenterActionItemModel }) => {
    const { model } = props;
    const [loading, setLoading] = useState(false);

    return (
      <button
        type="button"
        className={cx(
          'nb-user-center-item',
          'nb-user-center-item-action',
          model.danger && 'nb-user-center-item-danger',
        )}
        disabled={loading || model.disabled}
        onClick={async () => {
          setLoading(true);
          try {
            await model.onClick();
            if (model.closeOnClick !== false) {
              model.closeDropdown?.();
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="nb-user-center-item-main">
          <span className="nb-user-center-item-label">{model.getLabelNode()}</span>
          {model.description ? (
            <span className="nb-user-center-item-description">{model.getDescriptionNode()}</span>
          ) : null}
        </div>
        {loading ? <Spin size="small" /> : null}
      </button>
    );
  },
  { displayName: 'UserCenterActionItemView' },
);

const UserCenterSelectItemView = observer(
  (props: { model: UserCenterSelectItemModel }) => {
    const { model } = props;
    const [loading, setLoading] = useState(false);

    return (
      <div className="nb-user-center-item nb-user-center-item-select">
        <div className="nb-user-center-item-main">
          <span className="nb-user-center-item-label">{model.getLabelNode()}</span>
          {model.description ? (
            <span className="nb-user-center-item-description">{model.getDescriptionNode()}</span>
          ) : null}
        </div>
        <Select
          bordered={false}
          value={model.value}
          popupMatchSelectWidth={false}
          options={(model.options || []).map((option) => ({
            ...option,
            label: model.resolveNode(option.label),
          }))}
          disabled={loading || model.disabled}
          onChange={async (value) => {
            setLoading(true);
            try {
              await model.onChange(String(value));
              if (model.closeOnChange !== false) {
                model.closeDropdown?.();
              }
            } finally {
              setLoading(false);
            }
          }}
        />
      </div>
    );
  },
  { displayName: 'UserCenterSelectItemView' },
);

const UserCenterDropdownPanel = (props: {
  model: UserCenterTopbarActionModel;
  open: boolean;
  closeDropdown: () => void;
}) => {
  const { model, open, closeDropdown } = props;
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UserCenterItemModel[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setItems([]);

    void model
      .getPreparedItems(closeDropdown)
      .then((preparedItems) => {
        if (!cancelled) {
          setItems(preparedItems);
        }
      })
      .catch((error) => {
        console.error('[NocoBase] User center prepare failed.', error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [closeDropdown, model, open]);

  return (
    <div className={userCenterDropdownClassName} style={getUserCenterDropdownVars(token)}>
      {loading ? (
        <div className="nb-user-center-loading">
          <Spin size="small" />
        </div>
      ) : null}
      {!loading && !items.length ? (
        <div className="nb-user-center-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={model.context.t('No data')} />
        </div>
      ) : null}
      {!loading
        ? items.map((item, index) => {
            const previous = items[index - 1];
            const showDivider = previous && previous.section !== item.section;

            return (
              <React.Fragment key={item.uid}>
                {showDivider ? <Divider /> : null}
                <ErrorBoundary
                  FallbackComponent={UserCenterItemErrorFallback}
                  onError={(error) => {
                    console.error('[NocoBase] User center item render failed.', error);
                  }}
                >
                  <FlowModelRenderer model={item} />
                </ErrorBoundary>
              </React.Fragment>
            );
          })
        : null}
    </div>
  );
};

const UserCenterTopbarActionView = observer(
  (props: { model: UserCenterTopbarActionModel }) => {
    const { model } = props;
    const [open, setOpen] = useState(false);

    return model.renderWrapper(
      <Dropdown
        trigger={['hover']}
        placement="bottomRight"
        open={open}
        onOpenChange={setOpen}
        dropdownRender={() => (
          <UserCenterDropdownPanel model={model} open={open} closeDropdown={() => setOpen(false)} />
        )}
      >
        <span className={userCenterTriggerClassName}>{model.renderButton()}</span>
      </Dropdown>,
    );
  },
  { displayName: 'UserCenterTopbarActionView' },
);

export class UserCenterTopbarActionModel extends TopbarActionModel {
  private itemCache = new Map<string, UserCenterItemModel>();

  sort = 1000;
  actionId = USER_CENTER_ACTION_ID;
  testId = 'user-center-button';
  icon = (<UserOutlined />);

  private async discoverItems() {
    const subclasses = await this.flowEngine.getSubclassesOfAsync('UserCenterItemModel', (ModelClass) => {
      return Boolean(getUserCenterItemClassId(ModelClass as typeof UserCenterItemModel));
    });
    const usedItemIds = new Set<string>();
    const discovered: Array<{ itemId: string; ModelClass: typeof UserCenterItemModel; discoveryOrder: number }> = [];
    let discoveryOrder = 0;

    for (const [className, ModelClass] of subclasses) {
      const itemId = getUserCenterItemClassId(ModelClass as typeof UserCenterItemModel);

      if (!itemId) {
        continue;
      }

      if (usedItemIds.has(itemId)) {
        console.warn(`[NocoBase] Duplicate user center itemId '${itemId}' from '${className}' was ignored.`);
        continue;
      }

      usedItemIds.add(itemId);
      discovered.push({
        itemId,
        ModelClass: ModelClass as typeof UserCenterItemModel,
        discoveryOrder: discoveryOrder++,
      });
    }

    return discovered;
  }

  async getPreparedItems(closeDropdown: () => void) {
    const discoveredItems = await this.discoverItems();
    const nextItemIds = new Set(discoveredItems.map((item) => item.itemId));

    for (const [itemId, cachedItem] of this.itemCache.entries()) {
      if (!nextItemIds.has(itemId)) {
        await cachedItem.destroy();
        this.itemCache.delete(itemId);
      }
    }

    const preparedEntries = await Promise.all(
      discoveredItems.map(async (discoveredItem) => {
        const cachedItem = this.itemCache.get(discoveredItem.itemId);

        if (cachedItem && cachedItem.constructor !== discoveredItem.ModelClass) {
          await cachedItem.destroy();
          this.itemCache.delete(discoveredItem.itemId);
        }

        const item =
          this.itemCache.get(discoveredItem.itemId) ||
          this.flowEngine.createModel<UserCenterItemModel>({
            use: discoveredItem.ModelClass,
            uid: `user-center-item-${discoveredItem.itemId}`,
          });

        item.itemId = discoveredItem.itemId;
        item.hidden = false;
        item.ready = true;
        item.setCloseDropdown(closeDropdown);
        this.itemCache.set(discoveredItem.itemId, item);

        return {
          item,
          discoveryOrder: discoveredItem.discoveryOrder,
        };
      }),
    );

    const prepareResults = await Promise.allSettled(
      preparedEntries.map(async ({ item }) => {
        await item.prepare();
      }),
    );
    const aclData = this.context.acl?.data || {};
    const allow = createAclSnippetAllow(aclData.snippets || [], !!aclData.allowAll);

    return preparedEntries
      .filter(({ item }, index) => {
        const prepareResult = prepareResults[index];

        if (prepareResult.status === 'rejected') {
          console.error(`[NocoBase] User center item '${item.getItemId()}' prepare failed.`, prepareResult.reason);
          return false;
        }

        if (!allow(item.aclSnippet)) {
          return false;
        }

        return item.isReady() && item.isVisible();
      })
      .sort((left, right) => {
        if (left.item.getSectionSort() !== right.item.getSectionSort()) {
          return left.item.getSectionSort() - right.item.getSectionSort();
        }

        if ((left.item.sort || 0) !== (right.item.sort || 0)) {
          return (left.item.sort || 0) - (right.item.sort || 0);
        }

        return left.discoveryOrder - right.discoveryOrder;
      })
      .map(({ item }) => item);
  }

  render() {
    return <UserCenterTopbarActionView model={this} />;
  }
}
