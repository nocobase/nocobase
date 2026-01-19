# 翻译贡献

NocoBase 的默认语言是英语。目前，主应用程序支持英语、意大利语、荷兰语、简体中文和日语。我们诚挚邀请您为其他语言贡献翻译，让全球用户都能享受更便捷的 NocoBase 体验。

---

## 一、系统本地化

### 1. 系统界面和插件翻译

#### 1.1 翻译范围
仅适用于 NocoBase 系统界面和插件的本地化，不包括其他自定义内容（如数据表或 Markdown 区块）。

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 本地化内容概述
NocoBase 使用 Git 管理本地化内容。主要仓库为：
https://github.com/nocobase/nocobase/tree/main/locales

每种语言由一个以语言代码命名的 JSON 文件表示（例如 de-DE.json、fr-FR.json）。文件结构按插件模块组织，使用键值对存储翻译。例如：

```json
{
  // 客户端插件
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...其他键值对
  },
  "@nocobase/plugin-acl": {
    // 此插件的键值对
  }
  // ...其他插件模块
}
```

翻译时，请逐步将其转换为类似以下的结构：

```json
{
  // 客户端插件
  "@nocobase/client": {
    "(Fields only)": "(仅字段 - 已翻译)",
    "12 hour": "12 小时",
    "24 hour": "24 小时"
    // ...其他键值对
  },
  "@nocobase/plugin-acl": {
    // 此插件的键值对
  }
  // ...其他插件模块
}
```

#### 1.3 翻译测试和同步
- 完成翻译后，请测试并验证所有文本是否正确显示。
我们还发布了一个翻译验证插件 - 在插件市场中搜索 `Locale tester`。
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
安装后，从 git 仓库中的相应本地化文件复制 JSON 内容，粘贴到里面，然后点击确定以验证翻译内容是否生效。
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- 提交后，系统脚本将自动将本地化内容同步到代码仓库。

#### 1.4 NocoBase 2.0 本地化插件

> **注意：** 此部分正在开发中。NocoBase 2.0 的本地化插件与 1.x 版本有一些差异。详细信息将在后续更新中提供。

<!-- TODO: 添加 2.0 本地化插件差异的详细信息 -->

## 二、文档本地化（NocoBase 2.0）

NocoBase 2.0 的文档采用新的结构管理。文档源文件位于 NocoBase 主仓库中：

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 文档结构

文档使用 [Rspress](https://rspress.dev/) 作为静态站点生成器，支持 22 种语言。结构组织如下：

```
docs/
├── docs/
│   ├── en/                    # 英语（源语言）
│   ├── cn/                    # 简体中文
│   ├── ja/                    # 日语
│   ├── ko/                    # 韩语
│   ├── de/                    # 德语
│   ├── fr/                    # 法语
│   ├── es/                    # 西班牙语
│   ├── pt/                    # 葡萄牙语
│   ├── ru/                    # 俄语
│   ├── it/                    # 意大利语
│   ├── tr/                    # 土耳其语
│   ├── uk/                    # 乌克兰语
│   ├── vi/                    # 越南语
│   ├── id/                    # 印度尼西亚语
│   ├── th/                    # 泰语
│   ├── pl/                    # 波兰语
│   ├── nl/                    # 荷兰语
│   ├── cs/                    # 捷克语
│   ├── ar/                    # 阿拉伯语
│   ├── he/                    # 希伯来语
│   ├── hi/                    # 印地语
│   ├── sv/                    # 瑞典语
│   └── public/                # 共享资源（图片等）
├── theme/                     # 自定义主题
├── rspress.config.ts          # Rspress 配置
└── package.json
```

### 2.2 翻译工作流

1. **与英文源同步**：所有翻译应基于英文文档（`docs/en/`）。当英文文档更新时，翻译应相应更新。

2. **分支策略**：
   - 使用 `develop` 或 `next` 分支作为最新英文内容的参考
   - 从目标分支创建您的翻译分支

3. **文件结构**：每个语言目录应镜像英文目录结构。例如：
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 贡献翻译

1. Fork 仓库：https://github.com/nocobase/nocobase
2. 克隆您的 fork 并检出 `develop` 或 `next` 分支
3. 导航到 `docs/docs/` 目录
4. 找到您想贡献的语言目录（例如，日语为 `ja/`）
5. 翻译 markdown 文件，保持与英文版本相同的文件结构
6. 在本地测试您的更改：
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. 向主仓库提交 Pull Request

### 2.4 翻译指南

- **保持格式一致**：保持与源文件相同的 markdown 结构、标题、代码块和链接
- **保留 frontmatter**：保持文件顶部的任何 YAML frontmatter 不变，除非它包含可翻译的内容
- **图片引用**：使用来自 `docs/public/` 的相同图片路径 - 图片在所有语言之间共享
- **内部链接**：更新内部链接以指向正确的语言路径
- **代码示例**：通常，代码示例不应翻译，但代码中的注释可以翻译

### 2.5 导航配置

每种语言的导航结构在每个语言目录中的 `_nav.json` 和 `_meta.json` 文件中定义。添加新页面或章节时，请确保更新这些配置文件。

## 三、官网本地化

官网页面和所有内容存储在：
https://github.com/nocobase/website

### 3.1 入门和参考资源

添加新语言时，请参考现有的语言页面：
- 英语：https://github.com/nocobase/website/tree/main/src/pages/en
- 中文：https://github.com/nocobase/website/tree/main/src/pages/cn
- 日语：https://github.com/nocobase/website/tree/main/src/pages/ja

![官网本地化图示](https://static-docs.nocobase.com/20250319121600.png)

全局样式修改位于：
- 英语：https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- 中文：https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- 日语：https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![全局样式图示](https://static-docs.nocobase.com/20250319121501.png)

官网的全局组件本地化位于：
https://github.com/nocobase/website/tree/main/src/components

![官网组件图示](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 内容结构和本地化方法

我们采用混合内容管理方法。英语、中文和日语的内容和资源会定期从 CMS 系统同步并覆盖，而其他语言可以直接在本地文件中编辑。本地内容存储在 `content` 目录中，组织如下：

```
/content
  /articles        # 博客文章
    /article-slug
      index.md     # 英语内容（默认）
      index.cn.md  # 中文内容
      index.ja.md  # 日语内容
      metadata.json # 元数据和其他本地化属性
  /tutorials       # 教程
  /releases        # 发布信息
  /pages           # 一些静态页面
  /categories      # 分类信息
    /article-categories.json  # 文章分类列表
    /category-slug            # 单个分类详情
      /category.json
  /tags            # 标签信息
    /article-tags.json        # 文章标签列表
    /release-tags.json        # 发布标签列表
    /tag-slug                 # 单个标签详情
      /tag.json
  /help-center     # 帮助中心内容
    /help-center-tree.json    # 帮助中心导航结构
  ....
```

### 3.3 内容翻译指南

- 关于 Markdown 内容翻译

1. 基于默认文件创建新的语言文件（例如，`index.md` 到 `index.fr.md`）
2. 在 JSON 文件的相应字段中添加本地化属性
3. 保持文件结构、链接和图片引用的一致性

- JSON 内容翻译
许多内容元数据存储在 JSON 文件中，通常包含多语言字段：

```json
{
  "id": 123,
  "title": "English Title",       // 英语标题（默认）
  "title_cn": "中文标题",          // 中文标题
  "title_ja": "日本語タイトル",    // 日语标题
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL 路径（通常不翻译）
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**翻译注意事项：**

1. **字段命名约定**：翻译字段通常使用 `{原字段}_{语言代码}` 格式
   - 例如：title_fr（法语标题）、description_de（德语描述）

2. **添加新语言时**：
   - 为每个需要翻译的字段添加相应的语言后缀版本
   - 不要修改原字段值（如 title、description 等），因为它们作为默认语言（英语）内容

3. **CMS 同步机制**：
   - CMS 系统定期更新英语、中文和日语内容
   - 系统只会更新/覆盖这三种语言的内容（JSON 中的某些属性），**不会删除**其他贡献者添加的语言字段
   - 例如：如果您添加了法语翻译（title_fr），CMS 同步不会影响此字段


### 3.4 配置新语言支持

要添加对新语言的支持，需要修改 `src/utils/index.ts` 文件中的 `SUPPORTED_LANGUAGES` 配置：

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // 添加新语言示例：
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 布局文件和样式

每种语言需要相应的布局文件：

1. 创建新的布局文件（例如，对于法语，创建 `src/layouts/BaseFR.astro`）
2. 您可以复制现有的布局文件（如 `BaseEN.astro`）并翻译它
3. 布局文件包含导航菜单、页脚等全局元素的翻译
4. 确保更新语言切换器配置以正确切换到新添加的语言

### 3.6 创建语言页面目录

为新语言创建独立的页面目录：

1. 在 `src` 目录中创建一个以语言代码命名的文件夹（例如 `src/fr/`）
2. 从其他语言目录复制页面结构（例如 `src/en/`）
3. 更新页面内容，将标题、描述和文本翻译成目标语言
4. 确保页面使用正确的布局组件（例如 `.layout: '@/layouts/BaseFR.astro'`）

### 3.7 组件本地化

一些通用组件也需要翻译：

1. 检查 `src/components/` 目录中的组件
2. 特别注意带有固定文本的组件（如导航栏、页脚等）
3. 组件可能使用条件渲染来显示不同语言的内容：

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 测试和验证

完成翻译后，进行全面测试：

1. 在本地运行网站（通常使用 `yarn dev`）
2. 检查所有页面在新语言中的显示效果
3. 验证语言切换功能是否正常工作
4. 确保所有链接指向正确的语言版本页面
5. 检查响应式布局，确保翻译文本不会破坏页面设计

## 四、如何开始翻译

如果您想为 NocoBase 贡献新语言翻译，请按照以下步骤操作：

| 组件 | 仓库 | 分支 | 备注 |
|------|------|------|------|
| 系统界面 | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON 本地化文件 |
| 文档（2.0） | https://github.com/nocobase/nocobase | develop / next | `docs/docs/<lang>/` 目录 |
| 官网 | https://github.com/nocobase/website | main | 参见第三节 |

完成翻译后，请向 NocoBase 提交 Pull Request。新语言将出现在系统配置中，允许您选择要显示的语言。

![启用语言图示](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x 文档

关于 NocoBase 1.x 的翻译指南，请参考：

https://docs-cn.nocobase.com/welcome/community/translations
