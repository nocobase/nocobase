# v0.15：文档能力


## 文档

- 文档目录
  - `README.md` 和 `CHANGELOG.md` 放在文档根目录
  - 其他文档放在 `/docs` 目录下
- 多语言
  - `README.md` 和 `CHANGELOG.md` 的多语言规则为：`README.zh-CN.md`、`README.en-US.md`、`CHANGELOG.zh-CN.md`、`CHANGELOG.en-US.md`
  - `docs`目录的多语言则照 `/docs/zh-CN`、`/docs/en-US` 这样的目录结构来写
- 可以通过 frontmatter 的 `tags` 实现文档的聚合
- 可通过 frontmatter 的 `order` 实现文档的排序


### 文档聚合

```markdown
---
tags: tag1
---

# My Custom Page
```

或者

```markdown
---
tags:
  - tag1
  - tag2
---

# My Custom Page
```

或者

```markdown
---
tags:
  - key: tag1
    title: '中文 TAG'
---

# My Custom Page
```

### 文档排序

order 越小越靠前，默认为 0

```markdown
---
order: 1
---

# My Custom Page
```
