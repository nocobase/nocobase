import React from 'react';
import LazyDropdown, { Item } from './LazyDropdown';

const items: () => Promise<Item[]> = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟延迟
  return [
    {
      key: 'dashboard',
      label: '仪表盘',
      children: [
        { key: 'overview', label: '概览' },
        { key: 'analytics', label: '分析' },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      label: '设置',
      type: 'group',
      children: async () => {
        console.log('Loading settings...');
        await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟延迟
        return [
          { key: 'profile', label: '个人资料' },
          { key: 'preferences', label: '偏好设置' },
        ];
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'reports',
      label: '报表',
      children: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟延迟
        return [
          {
            key: 'sales',
            label: '销售报表',
            children: async () => {
              await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟延迟
              return [
                { key: 'sales-1', label: '销售 子项 1' },
                { key: 'sales-2', label: '销售 子项 2' },
              ];
            },
          },
          {
            key: 'finance',
            label: '财务报表',
            children: async () => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              return [
                { key: 'finance-1', label: '财务 子项 1' },
                { key: 'finance-2', label: '财务 子项 2' },
              ];
            },
          },
        ];
      },
    },
  ];
};

export default function App() {
  console.log('App rendered');
  return (
    <LazyDropdown
      menu={{
        onClick(info) {
          console.log('Menu item clicked:', info);
        },
        items,
      }}
    >
      <a>AA</a>
    </LazyDropdown>
  );
}
