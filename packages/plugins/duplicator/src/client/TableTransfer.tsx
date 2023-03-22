import { css } from '@emotion/css';
import { Space } from '@nocobase/client';
import { Table, Transfer, Input, Select, Row } from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { TransferItem, TransferProps } from 'antd/es/transfer';
import difference from 'lodash/difference';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Category } from './hooks/useDumpableCollections';
import { getCategories } from './utils/getCategories';

interface TableTransferProps<T> extends TransferProps<TransferItem> {
  dataSource: T[];
  leftColumns: ColumnsType<T>;
  rightColumns: ColumnsType<T>;
  scroll?: { scrollToFirstRowOnChange?: boolean; x?: string | number | true; y?: string | number };
  pagination?: any;
  filterOptionByCategory?: (category: string[], option: any) => boolean;
  onSelectRow?: (item: any, selected: boolean, direction: 'left' | 'right') => void;
  showSearch?: boolean;
}

const hideHeader = css`
  & .ant-transfer-list-header {
    display: none;
  }
`;

const defaultFilterOption = (inputValue: string, option: any) => {
  return option.title?.indexOf(inputValue) > -1 || option.name?.indexOf(inputValue) > -1;
};
const defaultFilterOptionByCategory = (category: string[], option: { category: Category[] }) => {
  return category.length === 0 || category.some((c) => option.category?.some((oc) => oc.name === c));
};

// Customize Table Transfer
export function TableTransfer<T>({
  leftColumns,
  rightColumns,
  scroll,
  pagination,
  showSearch,
  filterOptionByCategory = defaultFilterOptionByCategory,
  onSelectRow,
  ...restProps
}: TableTransferProps<T>) {
  const { titles = [], filterOption = defaultFilterOption } = restProps;

  return (
    <Transfer {...restProps} className={hideHeader}>
      {({
        direction,
        filteredItems,
        onItemSelectAll,
        onItemSelect,
        selectedKeys: listSelectedKeys,
        disabled: listDisabled,
      }) => {
        const columns = direction === 'left' ? leftColumns : rightColumns;
        const title = direction === 'left' ? titles[0] : titles[1];

        const rowSelection: TableRowSelection<TransferItem> = {
          getCheckboxProps: (item) => ({ disabled: listDisabled || item.disabled }),
          onSelectAll(selected, selectedRows) {
            const treeSelectedKeys = selectedRows.filter((item) => !item.disabled).map(({ key }) => key);
            const diffKeys = selected
              ? difference(treeSelectedKeys, listSelectedKeys)
              : difference(listSelectedKeys, treeSelectedKeys);
            onItemSelectAll(diffKeys as string[], selected);
          },
          onSelect({ key }, selected) {
            onItemSelect(key as string, selected);
          },
          selectedRowKeys: listSelectedKeys,
        };

        return (
          <Content
            title={title}
            columns={columns}
            filteredItems={filteredItems}
            listSelectedKeys={listSelectedKeys}
            listDisabled={listDisabled}
            scroll={scroll}
            pagination={pagination}
            onItemSelect={onItemSelect}
            rowSelection={rowSelection}
            filterOption={filterOption}
            filterOptionByCategory={filterOptionByCategory}
            showSearch={showSearch}
            direction={direction}
            onSelectRow={onSelectRow}
          />
        );
      }}
    </Transfer>
  );
}

function Content({
  title,
  columns,
  filteredItems,
  listSelectedKeys,
  listDisabled,
  scroll,
  pagination,
  onItemSelect,
  rowSelection,
  filterOption,
  filterOptionByCategory,
  showSearch,
  direction,
  onSelectRow,
}) {
  const { t } = useTranslation();
  const [items, setItems] = React.useState(filteredItems || []);
  const [inputValue, setInputValue] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  React.useEffect(() => {
    setItems(
      filteredItems.filter((item) => {
        return filterOption(inputValue, item) && filterOptionByCategory(selectedCategories, item);
      }),
    );
  }, [filteredItems.length]);

  const categories = getCategories(filteredItems);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputValue(value);
    setItems(
      filteredItems.filter((item) => {
        return filterOption(value, item);
      }),
    );
  };
  const handleSelectChange = (value: string[]) => {
    setSelectedCategories(value);
    setItems(
      filteredItems.filter((item) => {
        return filterOptionByCategory(value, item);
      }),
    );
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <strong style={{ flexShrink: 0, marginRight: 8 }}>{title}</strong>
        {showSearch ? (
          <Input.Group compact style={{ width: 'fit-content', minWidth: 360 }}>
            <Select
              value={selectedCategories}
              onChange={handleSelectChange}
              mode={'multiple'}
              style={{ minWidth: 126 }}
              size={'middle'}
              placeholder={t('All categories')}
              options={categories.map((category) => ({ label: category, value: category }))}
              allowClear
            />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              style={{ width: 234 }}
              placeholder={t('Enter name or title...')}
              allowClear
            />
          </Input.Group>
        ) : null}
      </div>
      <Table
        bordered
        rowSelection={rowSelection}
        columns={columns}
        dataSource={items}
        size="small"
        style={{ pointerEvents: listDisabled ? 'none' : undefined, minWidth: 0 }}
        scroll={scroll}
        pagination={pagination}
        onRow={(item) => ({
          onClick: () => {
            const { key, disabled: itemDisabled } = item;
            if (itemDisabled || listDisabled) return;
            onItemSelect(key as string, !listSelectedKeys.includes(key as string));
            onSelectRow(item, !listSelectedKeys.includes(key as string), direction);
          },
        })}
      />
    </>
  );
}
