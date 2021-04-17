---
title: '@nocobase/plugin-file-manager'
---

# @nocobase/plugin-file-manager

文件管理器

## 安装

```bash
yarn nocobase pull file-manager --start
```

## Field Interfaces

### attachment

附件字段

## Action API

### upload

文件上传

```ts
// 文件管理器接口
await api.resource('attachments').upload({});

// 附件字段接口
await api.resource('users.avatar').upload({
  associatedKey: 1,
});
```

## Storages

### local

本地存储

### ali-oss

阿里云 OSS