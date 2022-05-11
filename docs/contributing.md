---
order: 9999
---

# Contributing

- Fork 源代码到自己的仓库
- 修改源代码
- 提交 Pull Request

## 下载项目

---

```bash
# 替换为自己的仓库地址
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
```

## 应用开发与测试

---

```bash
# 安装并启动应用
yarn dev
# 运行所有测试
yarn test
# 运行文件夹下所有测试文件
yarn test <dir>
# 运行单个测试文件
yarn test <file>
```

## 开发文档

---

```bash
# 启动文档
yarn doc
```

文档在 docs 目录下，遵循 Markdown 语法，默认为英文，中文以 .zh-CN.md 结尾，如：

```bash
|- /docs/
  |- index.md # 英文文档
  |- index.zh-CN.md 中文文档，缺失时，显示为 index.md 的内容
```
