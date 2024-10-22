# Contributing

[English](./CONTRIBUTING.md) | 中文 

感谢你有兴趣为 NocoBase 做出贡献！💖   
本文档将介绍相关的信息，帮助你快速上手。在你开始之前，请阅读相关的内容。我们非常期待你为 NocoBase 贡献自己的力量。

## 贡献方式

我们欢迎以下几种不同的贡献方式：

- [反馈缺陷](#反馈缺陷)
- 开发[新插件](#新插件)
- [贡献源代码](#贡献源代码)
- 撰写[文档](#撰写文档)和[文章](#撰写文章)
- [翻译](#翻译)
- 帮助他人解决和 NocoBase 有关的问题

## 反馈缺陷

提交[缺陷报告](https://github.com/nocobase/nocobase/issues/new?template=bug_report.md).

请按照 issue 模板填写内容，并尽可能地提供更多信息，帮助我们复现缺陷。

### 安全漏洞

如果你发现的是一个安全漏洞，请通过提交[安全漏洞](https://github.com/nocobase/nocobase/security/advisories/new)的方式来报告。

## 新插件

如果你想给 NocoBase 增加新特性，最好的方式是通过开发一个新插件来实现无侵入式的扩展。

你可以参考[开发文档](https://docs-cn.nocobase.com/development/)来开发你的第一个插件。

对于其中一些模块的插件开发，你还可以查阅以下文档获得更多的信息：

- [用户认证](https://docs-cn.nocobase.com/handbook/auth/dev/guide)
- [工作流](https://docs-cn.nocobase.com/handbook/workflow/development)

同时，我们也提供了一系列的[插件示例](https://docs-cn.nocobase.com/plugin-samples)。

如果你想将你的插件作为商业插件出售，欢迎联系我们。

## 贡献源代码

- Fork NocoBase 源代码仓库。
- 参考[文档](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone)配置本地环境。
- 修改源代码，提交 pull request.

**请注意**:    
- 如果是修复缺陷，或者其他不涉及新特性的修改，请基于 `main` 分支进行修改。
- 如果是新特性，或 API 变更，请基于 `next` 分支进行修改。

### Contributor License Agreement (CLA)

在我们合并你的 PR 之前，你需要签署 [Contributor License Agreement](https://cla-assistant.io/nocobase/nocobase).

## 撰写文档

NocoBase 的文档目前在 [nocobase/docs](https://github.com/nocobase/docs) 维护。

你可以通过提交 PR 来贡献文档。

## 撰写文章

我们非常欢迎你为我们撰写文章，包括但不限于以下内容：

- 有关NocoBase 在实际应用场景下的最佳实践
- 分享你和 NocoBase 的故事
- 有关 NocoBase 的高级使用技巧
- ……

如果你感兴趣的话，请和我们联系。

## 翻译

NocoBase 的本地化资源放置在以下目录：

- `packages/core/client/src/locale`
- `packages/plugins/**/src/locale`

你可以：
- 对现有的翻译文件进行订正。
- 添加新的语言包：复制 `en-US.json`, 重命名为对应的 Language Culture Name. 

在完成修改后，提交 PR.
