# 文件管理器插件示例

## 概述

文件管理器插件 (`@nocobase/plugin-file-manager`) 提供了文件存储服务，并提供了文件表模板和附件字段。支持多种存储后端，包括本地存储、阿里云 OSS、腾讯云 COS、AWS S3 等。

## 功能特性

- 支持多种存储后端（本地、OSS、COS、S3等）
- 提供文件表模板和附件字段
- 支持文件预览和下载
- 支持文件类型限制和大小限制
- 与 NocoBase 数据表无缝集成
- 提供文件管理界面

## 安装和启用

```bash
yarn add @nocobase/plugin-file-manager
```

在插件管理器中启用插件：

```ts
// src/application.ts
import { Application } from '@nocobase/server';
import FileManagerPlugin from '@nocobase/plugin-file-manager';

export class MyApplication extends Application {
  constructor(options) {
    super(options);
    this.plugin(FileManagerPlugin);
  }
}
```

## 基本使用

### 1. 配置存储后端

```ts
// src/server/file-storage-config.ts
import { StorageManager } from '@nocobase/plugin-file-manager';

export function configureStorage(storageManager: StorageManager) {
  // 配置本地存储
  storageManager.registerStorage('local', {
    type: 'local',
    options: {
      documentRoot: '/path/to/uploads',
      baseUrl: 'http://localhost:13000/uploads'
    }
  });
  
  // 配置阿里云 OSS
  storageManager.registerStorage('oss', {
    type: 'oss',
    options: {
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      endpoint: process.env.OSS_ENDPOINT
    }
  });
}
```

### 2. 在数据表中使用附件字段

```ts
// src/server/document-collection.ts
import { CollectionOptions } from '@nocobase/database';

export const documentCollection: CollectionOptions = {
  name: 'documents',
  title: '文档',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题'
    },
    {
      type: 'attachment',
      name: 'file',
      title: '附件',
      // 配置附件字段
      storage: 'local', // 使用的存储后端
      accept: 'image/*,.pdf,.doc,.docx', // 允许的文件类型
      maxSize: 10 * 1024 * 1024 // 最大文件大小 (10MB)
    }
  ]
};
```

### 3. 在表单中使用文件上传

```tsx
// src/client/components/FileUploadForm.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { ISchema } from '@formily/react';

const documentSchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-component': 'Form',
      properties: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input'
        },
        file: {
          type: 'array',
          title: '附件',
          'x-decorator': 'FormItem',
          'x-component': 'Upload.Attachment',
          'x-component-props': {
            action: '/api/attachments:upload',
            multiple: false,
            accept: 'image/*,.pdf,.doc,.docx'
          }
        },
        submit: {
          type: 'void',
          'x-component': 'Submit'
        }
      }
    }
  }
};

export default function FileUploadForm() {
  return <SchemaComponent schema={documentSchema} />;
}
```

## 高级用法

### 1. 自定义存储适配器

```ts
// src/server/custom-storage.ts
import { StorageAdapter } from '@nocobase/plugin-file-manager';

class CustomStorageAdapter extends StorageAdapter {
  async save(file: any, options: any) {
    // 实现自定义存储逻辑
    const result = await this.uploadToCustomStorage(file);
    
    return {
      id: result.id,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: result.url,
      storage: this.name
    };
  }
  
  async delete(file: any) {
    // 实现自定义删除逻辑
    await this.deleteFromCustomStorage(file);
  }
  
  async preview(file: any) {
    // 实现自定义预览逻辑
    return this.getPreviewUrl(file);
  }
  
  private async uploadToCustomStorage(file: any) {
    // 实现上传到自定义存储的逻辑
  }
  
  private async deleteFromCustomStorage(file: any) {
    // 实现从自定义存储删除的逻辑
  }
  
  private getPreviewUrl(file: any) {
    // 实现获取预览 URL 的逻辑
  }
}

// 注册自定义存储适配器
import { StorageManager } from '@nocobase/plugin-file-manager';

export function registerCustomStorage(storageManager: StorageManager) {
  storageManager.registerStorage('custom', new CustomStorageAdapter('custom'));
}
```

### 2. 文件预览组件

```tsx
// src/client/components/FilePreviewer.tsx
import React from 'react';
import { useFilePreview } from '@nocobase/plugin-file-manager/client';

export default function FilePreviewer({ file }) {
  const { previewUrl, loading, error } = useFilePreview(file);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;
  
  // 根据文件类型显示不同的预览
  if (file.mimetype.startsWith('image/')) {
    return <img src={previewUrl} alt={file.filename} style={{ maxWidth: '100%' }} />;
  }
  
  if (file.mimetype === 'application/pdf') {
    return (
      <iframe 
        src={previewUrl} 
        style={{ width: '100%', height: '500px' }}
        title={file.filename}
      />
    );
  }
  
  return (
    <div>
      <h4>{file.filename}</h4>
      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
        下载文件
      </a>
    </div>
  );
}
```

## 最佳实践

1. **存储策略**：
   - 根据文件类型选择合适的存储后端
   - 实施适当的文件命名策略
   - 定期清理无用文件

2. **安全性**：
   - 验证文件类型和大小
   - 实施病毒扫描
   - 控制文件访问权限
   - 使用安全的文件 URL

3. **性能优化**：
   - 使用 CDN 加速文件访问
   - 实施文件缓存策略
   - 压缩图片文件
   - 使用流式上传处理大文件

## 扩展示例

### 1. 图片管理器

```ts
// src/server/image-collection.ts
export const imageCollection: CollectionOptions = {
  name: 'images',
  title: '图片',
  template: 'file', // 使用文件模板
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题'
    },
    {
      type: 'attachment',
      name: 'image',
      title: '图片',
      storage: 'oss',
      accept: 'image/*',
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    {
      type: 'json',
      name: 'metadata',
      title: '元数据',
      defaultValue: {}
    }
  ]
};
```

```tsx
// src/client/components/ImageGallery.tsx
import React from 'react';
import { SchemaComponent } from '@nocobase/client';

const imageGallerySchema: ISchema = {
  type: 'object',
  properties: {
    gallery: {
      type: 'void',
      'x-component': 'CollectionField',
      'x-component-props': {
        collection: 'images',
        field: 'list'
      }
    },
    upload: {
      type: 'void',
      'x-component': 'Action',
      'x-content': '上传图片',
      properties: {
        drawer: {
          type: 'void',
          'x-component': 'Action.Drawer',
          title: '上传图片',
          properties: {
            form: {
              type: 'void',
              'x-component': 'Form',
              properties: {
                title: {
                  type: 'string',
                  title: '标题',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input'
                },
                image: {
                  type: 'array',
                  title: '图片',
                  'x-decorator': 'FormItem',
                  'x-component': 'Upload.Attachment',
                  'x-component-props': {
                    action: '/api/attachments:upload',
                    multiple: true,
                    accept: 'image/*'
                  }
                },
                submit: {
                  type: 'void',
                  'x-component': 'Submit'
                }
              }
            }
          }
        }
      }
    }
  }
};

export default function ImageGallery() {
  return <SchemaComponent schema={imageGallerySchema} />;
}
```

### 2. 文档版本管理

```ts
// src/server/document-versioning.ts
export const documentCollection: CollectionOptions = {
  name: 'documents',
  title: '文档',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题'
    },
    {
      type: 'hasMany',
      name: 'versions',
      title: '版本',
      target: 'documentVersions'
    }
  ]
};

export const documentVersionCollection: CollectionOptions = {
  name: 'documentVersions',
  title: '文档版本',
  fields: [
    {
      type: 'belongsTo',
      name: 'document',
      title: '文档',
      target: 'documents'
    },
    {
      type: 'attachment',
      name: 'file',
      title: '文件',
      storage: 'local'
    },
    {
      type: 'string',
      name: 'version',
      title: '版本号'
    },
    {
      type: 'belongsTo',
      name: 'createdBy',
      title: '创建者',
      target: 'users'
    }
  ]
};
```

### 3. 文件访问统计

```ts
// src/server/file-analytics.ts
export const fileAnalyticsCollection: CollectionOptions = {
  name: 'fileAnalytics',
  title: '文件访问统计',
  fields: [
    {
      type: 'belongsTo',
      name: 'file',
      title: '文件',
      target: 'attachments'
    },
    {
      type: 'integer',
      name: 'downloadCount',
      title: '下载次数',
      defaultValue: 0
    },
    {
      type: 'date',
      name: 'lastAccessed',
      title: '最后访问时间'
    }
  ]
};

// 中间件记录文件访问
export function fileAccessLogger() {
  return async (ctx, next) => {
    await next();
    
    if (ctx.path.startsWith('/api/attachments') && ctx.method === 'GET') {
      const fileId = ctx.params.id;
      if (fileId) {
        // 更新访问统计
        await updateFileAnalytics(fileId);
      }
    }
  };
}
```

## 常见问题

### 1. 大文件上传

```ts
// src/server/large-file-upload.ts
import multer from 'multer';

export function configureLargeFileUpload() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    }
  });
}
```

### 2. 文件权限控制

```ts
// src/server/file-permissions.ts
import { CollectionOptions } from '@nocobase/database';

export const attachmentCollection: CollectionOptions = {
  name: 'attachments',
  title: '附件',
  fields: [
    // 字段定义
  ],
  // 添加权限控制
  acl: {
    'download': {
      condition: {
        // 只允许拥有者或管理员下载
        $or: [
          { createdBy: '{{ currentUser.id }}' },
          { 'createdBy.roles.name': 'admin' }
        ]
      }
    }
  }
};
```

## 参考资源

- [官方文档](https://docs-cn.nocobase.com/handbook/file-manager)
- [插件源码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/file-manager)
- [文件预览插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins/file-previewer-*)
