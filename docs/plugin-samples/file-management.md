# 文件管理示例

本文档将详细介绍如何在 NocoBase 插件中处理文件上传、存储和管理。

## 文件管理基础

### 文件存储概念

NocoBase 提供了灵活的文件存储机制，支持本地存储、云存储（如 AWS S3、阿里云 OSS 等）以及自定义存储方案。

### 文件字段使用

```typescript
// 在集合中定义文件字段
const postsCollection = {
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: '标题',
    },
    {
      type: 'attachment',
      name: 'cover',
      title: '封面图片',
      // 单个文件
      uiSchema: {
        'x-component-props': {
          accept: 'image/*',
          multiple: false,
        },
      },
    },
    {
      type: 'attachment',
      name: 'attachments',
      title: '附件',
      // 多个文件
      uiSchema: {
        'x-component-props': {
          accept: '*',
          multiple: true,
        },
      },
    },
  ],
};
```

## 自定义文件存储

### 创建存储适配器

```typescript
// src/server/storages/CustomStorage.ts
import { StorageAdapter, StorageOptions } from '@nocobase/plugin-file-manager';

interface CustomStorageOptions extends StorageOptions {
  customOption?: string;
  apiKey?: string;
}

export class CustomStorage extends StorageAdapter<CustomStorageOptions> {
  async save(file: any, options: any) {
    try {
      // 实现文件保存逻辑
      const result = await this.uploadToCustomService(file, options);
      
      return {
        // 返回文件信息
        id: result.fileId,
        title: file.originalname,
        filename: file.filename,
        extname: file.extname,
        mimetype: file.mimetype,
        size: file.size,
        // 自定义存储的访问URL
        url: result.url,
        // 存储类型标识
        storage: this.name,
        path: result.path,
        meta: result.meta,
      };
    } catch (error) {
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }
  
  async delete(file: any, options: any) {
    try {
      // 实现文件删除逻辑
      await this.deleteFromCustomService(file, options);
      return true;
    } catch (error) {
      throw new Error(`文件删除失败: ${error.message}`);
    }
  }
  
  async exists(filename: string, options: any) {
    // 检查文件是否存在
    return await this.checkFileExists(filename, options);
  }
  
  private async uploadToCustomService(file: any, options: any) {
    // 实现上传到自定义服务的逻辑
    // 这里可以是任何文件存储服务
    return {
      fileId: 'custom-file-id',
      url: `https://custom-storage.com/files/${file.filename}`,
      path: `/files/${file.filename}`,
      meta: {},
    };
  }
  
  private async deleteFromCustomService(file: any, options: any) {
    // 实现从自定义服务删除文件的逻辑
  }
  
  private async checkFileExists(filename: string, options: any) {
    // 实现检查文件是否存在的逻辑
    return false;
  }
}
```

### 注册自定义存储

```typescript
// src/server/index.ts
import { Plugin } from '@nocobase/server';
import { CustomStorage } from './storages/CustomStorage';

export class FileManagerPlugin extends Plugin {
  async load() {
    // 注册自定义存储适配器
    this.app.storageManager.registerStorageType('custom', CustomStorage);
  }
}
```

## 文件处理中间件

### 图片处理中间件

```typescript
// src/server/middlewares/ImageProcessor.ts
import { Context, Next } from '@nocobase/server';
import sharp from 'sharp';

export class ImageProcessor {
  async resize(ctx: Context, next: Next) {
    const { file } = ctx;
    
    if (file && file.mimetype?.startsWith('image/')) {
      try {
        // 获取处理参数
        const { width, height, quality = 80 } = ctx.request.query;
        
        if (width || height) {
          // 使用 sharp 处理图片
          const processedImage = await sharp(file.buffer)
            .resize(width ? parseInt(width) : null, height ? parseInt(height) : null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: parseInt(quality) })
            .toBuffer();
          
          // 更新文件信息
          file.buffer = processedImage;
          file.size = processedImage.length;
        }
      } catch (error) {
        ctx.logger.error('图片处理失败:', error);
      }
    }
    
    await next();
  }
  
  async watermark(ctx: Context, next: Next) {
    const { file } = ctx;
    
    if (file && file.mimetype?.startsWith('image/')) {
      try {
        // 添加水印逻辑
        const watermarkedImage = await this.addWatermark(file.buffer);
        file.buffer = watermarkedImage;
        file.size = watermarkedImage.length;
      } catch (error) {
        ctx.logger.error('水印添加失败:', error);
      }
    }
    
    await next();
  }
  
  private async addWatermark(buffer: Buffer) {
    // 实现水印添加逻辑
    return buffer;
  }
}
```

### 文件验证中间件

```typescript
// src/server/middlewares/FileValidator.ts
import { Context, Next } from '@nocobase/server';

export class FileValidator {
  private readonly allowedMimeTypes: string[];
  private readonly maxSize: number;
  
  constructor(options: { allowedMimeTypes?: string[]; maxSize?: number }) {
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
  }
  
  async validate(ctx: Context, next: Next) {
    const { file, files } = ctx;
    
    // 验证单个文件
    if (file) {
      this.validateFile(file);
    }
    
    // 验证多个文件
    if (files && Array.isArray(files)) {
      for (const f of files) {
        this.validateFile(f);
      }
    }
    
    await next();
  }
  
  private validateFile(file: any) {
    // 验证文件大小
    if (file.size > this.maxSize) {
      throw new Error(`文件大小不能超过 ${this.maxSize / 1024 / 1024}MB`);
    }
    
    // 验证文件类型
    if (this.allowedMimeTypes && !this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`不支持的文件类型: ${file.mimetype}`);
    }
  }
}
```

## 客户端文件上传组件

### 自定义上传组件

```typescript
// src/client/components/CustomUploader.tsx
import React, { useState } from 'react';
import { Upload, Button, Progress, List, Card } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const CustomUploader: React.FC<{ 
  value?: any; 
  onChange?: (value: any) => void;
  multiple?: boolean;
  accept?: string;
}> = (props) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 上传文件
      const response = await api.axios.post('/attachments:upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setProgress(Math.round((loaded / total) * 100));
        },
      });
      
      // 更新值
      if (props.multiple) {
        const newValue = props.value ? [...props.value, response.data] : [response.data];
        props.onChange?.(newValue);
      } else {
        props.onChange?.(response.data);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  const handleRemove = (fileToRemove) => {
    if (props.multiple) {
      const newValue = props.value?.filter(file => file.id !== fileToRemove.id) || [];
      props.onChange?.(newValue);
    } else {
      props.onChange?.(null);
    }
  };
  
  return (
    <Card>
      <Upload
        beforeUpload={(file) => {
          handleUpload(file);
          return false; // 阻止默认上传行为
        }}
        showUploadList={false}
        multiple={props.multiple}
        accept={props.accept}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          {t('上传文件')}
        </Button>
      </Upload>
      
      {uploading && (
        <Progress percent={progress} style={{ marginTop: 10 }} />
      )}
      
      {props.multiple ? (
        <List
          dataSource={props.value || []}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file)}
                  danger
                />
              ]}
            >
              <List.Item.Meta
                title={file.title}
                description={`${(file.size / 1024).toFixed(2)} KB`}
              />
            </List.Item>
          )}
          style={{ marginTop: 10 }}
        />
      ) : (
        props.value && (
          <div style={{ marginTop: 10 }}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div>{props.value.title}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {(props.value.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(props.value)}
                  danger
                />
              </div>
            </Card>
          </div>
        )
      )}
    </Card>
  );
};
```

## 文件预览和下载

### 文件预览组件

```typescript
// src/client/components/FilePreviewer.tsx
import React from 'react';
import { Image, Button, Space } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const FilePreviewer: React.FC<{ file: any }> = ({ file }) => {
  const { t } = useTranslation();
  
  const isImage = file.mimetype?.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename;
    link.click();
  };
  
  const handlePreview = () => {
    window.open(file.url, '_blank');
  };
  
  if (isImage) {
    return (
      <Space direction="vertical">
        <Image
          src={file.url}
          alt={file.title}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t('下载')}
          </Button>
          <Button icon={<EyeOutlined />} onClick={handlePreview}>
            {t('查看原图')}
          </Button>
        </Space>
      </Space>
    );
  }
  
  if (isPdf) {
    return (
      <Space direction="vertical">
        <div>
          <iframe
            src={file.url}
            style={{ width: '100%', height: '400px' }}
            title={file.title}
          />
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t('下载')}
          </Button>
          <Button icon={<EyeOutlined />} onClick={handlePreview}>
            {t('在新窗口打开')}
          </Button>
        </Space>
      </Space>
    );
  }
  
  return (
    <Space direction="vertical">
      <div>
        <div>{file.title}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {file.mimetype} • {(file.size / 1024).toFixed(2)} KB
        </div>
      </div>
      <Button icon={<DownloadOutlined />} onClick={handleDownload}>
        {t('下载文件')}
      </Button>
    </Space>
  );
};
```

## 文件权限控制

### 基于角色的文件访问控制

```typescript
// src/server/hooks/FileAccessControl.ts
import { HookFn } from '@nocobase/server';

export const FileAccessControl: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  // 只对文件相关操作进行权限检查
  if (resourceName === 'attachments') {
    const user = ctx.state.currentUser;
    
    switch (actionName) {
      case 'upload':
        // 检查上传权限
        if (!user || !this.canUpload(user)) {
          ctx.throw(403, '无文件上传权限');
        }
        break;
        
      case 'download':
        // 检查下载权限
        const fileId = ctx.action.params.filterByTk;
        if (!await this.canDownload(user, fileId)) {
          ctx.throw(403, '无文件下载权限');
        }
        break;
        
      case 'destroy':
        // 检查删除权限
        const deleteFileId = ctx.action.params.filterByTk;
        if (!await this.canDelete(user, deleteFileId)) {
          ctx.throw(403, '无文件删除权限');
        }
        break;
    }
  }
  
  await next();
};

// 权限检查方法
private canUpload(user: any) {
  // 实现上传权限检查逻辑
  return user?.role === 'admin' || user?.role === 'editor';
}

private async canDownload(user: any, fileId: string) {
  // 实现下载权限检查逻辑
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  // 检查用户是否有权访问该文件
  const file = await this.db.getRepository('attachments').findById(fileId);
  return file?.createdById === user.id;
}

private async canDelete(user: any, fileId: string) {
  // 实现删除权限检查逻辑
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const file = await this.db.getRepository('attachments').findById(fileId);
  return file?.createdById === user.id;
}
```

## 文件元数据管理

### 自定义元数据处理

```typescript
// src/server/hooks/FileMetadataProcessor.ts
import { HookFn } from '@nocobase/server';
import { exiftool } from 'exiftool-vendored';

export const FileMetadataProcessor: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'attachments' && actionName === 'upload') {
    const { file } = ctx;
    
    if (file && file.buffer) {
      try {
        // 提取文件元数据
        let metadata = {};
        
        // 对于图片文件，提取EXIF信息
        if (file.mimetype?.startsWith('image/')) {
          metadata = await this.extractImageMetadata(file.buffer);
        }
        
        // 对于PDF文件，提取基本信息
        if (file.mimetype === 'application/pdf') {
          metadata = await this.extractPdfMetadata(file.buffer);
        }
        
        // 将元数据添加到文件记录中
        ctx.action.params.values = {
          ...ctx.action.params.values,
          meta: metadata,
        };
      } catch (error) {
        ctx.logger.warn('元数据提取失败:', error);
      }
    }
  }
  
  await next();
};

private async extractImageMetadata(buffer: Buffer) {
  try {
    const metadata = await exiftool.read(buffer);
    return {
      width: metadata.ImageWidth,
      height: metadata.ImageHeight,
      make: metadata.Make,
      model: metadata.Model,
      dateTime: metadata.DateTimeOriginal,
      gps: metadata.GPSPosition,
    };
  } catch (error) {
    return {};
  }
}

private async extractPdfMetadata(buffer: Buffer) {
  // 实现PDF元数据提取逻辑
  return {
    pageCount: 0, // 需要使用pdf-lib等库来提取
  };
}
```

## 文件搜索和过滤

### 文件搜索功能

```typescript
// src/server/hooks/FileSearch.ts
import { HookFn } from '@nocobase/server';

export const FileSearch: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'attachments' && actionName === 'list') {
    const { filter } = ctx.action.params;
    
    // 处理自定义搜索条件
    if (filter?.$or) {
      const searchConditions = filter.$or.filter(condition => 
        condition.title && condition.title.$includes
      );
      
      if (searchConditions.length > 0) {
        // 扩展搜索条件
        const extendedFilter = {
          ...filter,
          $or: [
            ...filter.$or,
            // 添加文件名搜索
            { filename: { $includes: searchConditions[0].title.$includes } },
            // 添加MIME类型搜索
            { mimetype: { $includes: searchConditions[0].title.$includes } },
          ],
        };
        
        ctx.action.mergeParams({ filter: extendedFilter });
      }
    }
  }
  
  await next();
};
```

## 文件版本管理

### 简单版本控制

```typescript
// src/server/hooks/FileVersioning.ts
import { HookFn } from '@nocobase/server';

export const FileVersioning: HookFn = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'attachments') {
    switch (actionName) {
      case 'upload':
        await this.handleNewUpload(ctx);
        break;
        
      case 'update':
        await this.handleFileUpdate(ctx);
        break;
    }
  }
  
  await next();
};

private async handleNewUpload(ctx) {
  const { values } = ctx.action.params;
  
  // 检查是否是同一文件的更新版本
  if (values.filename) {
    const existingFile = await ctx.db.getRepository('attachments').findOne({
      filter: {
        filename: values.filename,
        createdById: ctx.state.currentUser?.id,
      },
      sort: ['-createdAt'],
    });
    
    if (existingFile) {
      // 创建新版本
      await ctx.db.getRepository('fileVersions').create({
        values: {
          fileId: existingFile.id,
          version: existingFile.version ? existingFile.version + 1 : 2,
          url: existingFile.url,
          meta: existingFile.meta,
        },
      });
      
      // 更新主记录
      ctx.action.mergeParams({
        values: {
          ...values,
          version: existingFile.version ? existingFile.version + 1 : 2,
        },
      });
    }
  }
}

private async handleFileUpdate(ctx) {
  const { filterByTk, values } = ctx.action.params;
  
  // 如果文件内容被更新，创建版本记录
  if (values.buffer || values.url) {
    const file = await ctx.db.getRepository('attachments').findById(filterByTk);
    
    if (file) {
      await ctx.db.getRepository('fileVersions').create({
        values: {
          fileId: file.id,
          version: file.version || 1,
          url: file.url,
          meta: file.meta,
        },
      });
    }
  }
}
```

## 最佳实践

### 1. 文件存储安全

```typescript
// 确保文件存储的安全性
class SecureFileManager {
  private sanitizeFilename(filename: string): string {
    // 清理文件名，防止路径遍历攻击
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }
  
  private validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    // 严格验证文件类型
    return allowedTypes.includes(mimetype);
  }
  
  private async scanForMalware(buffer: Buffer): Promise<boolean> {
    // 实现恶意软件扫描逻辑
    // 可以集成第三方扫描服务
    return true; // 暂时返回true
  }
}
```

### 2. 性能优化

```typescript
// 优化文件处理性能
class OptimizedFileManager {
  private cache = new Map();
  
  async getCachedFileInfo(fileId: string) {
    if (this.cache.has(fileId)) {
      const cached = this.cache.get(fileId);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟缓存
        return cached.data;
      }
    }
    
    const fileInfo = await this.fetchFileInfo(fileId);
    this.cache.set(fileId, {
      data: fileInfo,
      timestamp: Date.now(),
    });
    
    return fileInfo;
  }
  
  private async fetchFileInfo(fileId: string) {
    // 实际获取文件信息的逻辑
    return {};
  }
}
```

### 3. 错误处理和日志记录

```typescript
// 完善的错误处理和日志记录
class RobustFileManager {
  async handleFileOperation(operation: () => Promise<any>) {
    try {
      const result = await operation();
      this.logger.info('文件操作成功');
      return result;
    } catch (error) {
      this.logger.error('文件操作失败:', {
        error: error.message,
        stack: error.stack,
      });
      
      // 根据错误类型返回适当的响应
      if (error.code === 'LIMIT_FILE_SIZE') {
        throw new Error('文件大小超出限制');
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        throw new Error('文件数量超出限制');
      }
      
      throw new Error('文件操作失败');
    }
  }
}
```

## 下一步

- 学习 [认证](./authentication.md) 示例（如果创建了该文档）
- 掌握 [API文档](./api-documentation.md) 示例（如果创建了该文档）
