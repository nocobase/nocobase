---
title: MenuEditor - 菜单编辑器
nav:
  title: 组件
  path: /client
group:
  order: 3
  title: 其他
  path: /client/others
---

# MenuEditor - 菜单编辑器

## 代码演示

### 竖向菜单

```tsx
import React from 'react';
import MenuEditor from './';

const items = [
  {
    icon: 'AimOutlined',
    name: 'name1',
    title: '菜单组1',
    children: [
      {
        icon: 'CiOutlined',
        name: 'name3',
        title: '子菜单1',
      },
      {
        icon: 'CiOutlined',
        name: 'name4',
        title: '子菜单2',
      },
      {
        icon: 'CiOutlined',
        name: 'name5',
        title: '子菜单组1',
        children: [
          {
            icon: 'CiOutlined',
            name: 'name6',
            title: '子菜单6',
          },
          {
            icon: 'CiOutlined',
            name: 'name7',
            title: '子菜单7',
          },
          {
            icon: 'CiOutlined',
            name: 'name8',
            title: '子菜单8',
          },
        ],
      },
    ],
  },
  {
    icon: 'CiOutlined',
    name: 'name2',
    title: '菜单1',
  },
];

export default () => {
  return (
    <MenuEditor style={{ width: 256 }} items={items} mode={'vertical'}/>
  )
}
```

### 混合菜单

```tsx
import React from 'react';
import MenuEditor from './';

const items = [
  {
    name: 'name1',
    title: '菜单组1',
    children: [
      {
        name: 'name3',
        title: '子菜单1',
      },
      {
        name: 'name4',
        title: '子菜单2',
      },
      {
        name: 'name5',
        title: '子菜单组1',
        children: [
          {
            name: 'name6',
            title: '子菜单6',
          },
          {
            name: 'name7',
            title: '子菜单7',
          },
          {
            name: 'name8',
            title: '子菜单8',
          },
        ],
      },
    ],
  },
  {
    name: 'name9',
    title: '菜单组2',
    children: [
      {
        name: 'name10',
        title: '子菜单10',
      },
      {
        name: 'name11',
        title: '子菜单11',
      },
      {
        name: 'name12',
        title: '子菜单12',
      },
      {
        name: 'name13',
        title: '子菜单13',
      },
    ],
  },
  {
    name: 'name2',
    title: '菜单1',
  },
];

export default () => {
  const [key, setKey] = React.useState('name1');
  return (
    <MenuEditor onSelect={(info) => {
      setKey(info.key);
    }} defaultValue={key} items={items} mode={'mix'}>
      <div style={{ padding: 24 }}>这是正文 {key}</div>
    </MenuEditor>
  )
}
```
