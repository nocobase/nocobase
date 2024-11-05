/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, CheckList, Popup, SearchBar, Space, Input } from 'antd-mobile';
import { connect, mapProps } from '@formily/react';

const MobilePicker = connect(
  (props) => {
    const { value, onChange, options = [], mode, ...rest } = props;
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(value || []); // 默认值为空数组
    const [searchText, setSearchText] = useState('');

    // 过滤选项
    const filteredItems = useMemo(() => {
      if (searchText) {
        return options.filter((item) => item.label.toLowerCase().includes(searchText.toLowerCase()));
      }
      return options;
    }, [options, searchText]);

    // 确认选择并更新父组件的状态
    const handleConfirm = () => {
      onChange(selected); // 更新选中的值
      setVisible(false); // 关闭弹窗
    };

    return (
      <>
        <Space align="center">
          <Input
            onClick={() => setVisible(true)}
            placeholder="选择"
            value={value?.length > 0 ? value.join(', ') : ''}
          />
        </Space>
        <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose>
          <div>
            <SearchBar placeholder="输入文字过滤选项" value={searchText} onChange={(v) => setSearchText(v)} />
          </div>
          <div>
            <CheckList
              multiple={mode === 'multiple'}
              value={selected} // 使用 value 而非 defaultValue 以反映当前选择
              onChange={(val) => {
                if (mode === 'multiple') {
                  setSelected(val); // 仅更新选中的项，不立即通知父组件
                } else {
                  setSelected(val);
                  onChange(val); // 更新选中的值
                  setVisible(false); // 关闭弹窗
                }
              }}
            >
              {filteredItems.map((item) => (
                <CheckList.Item key={item.value} value={item.value}>
                  {item.label}
                </CheckList.Item>
              ))}
            </CheckList>
          </div>
          {mode === 'multiple' && (
            <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
              确认
            </Button>
          )}
        </Popup>
      </>
    );
  },
  mapProps({ dataSource: 'options' }),
);

export { MobilePicker };
