# 贡献

- Fork 源代码到自己的仓库
- 修改源代码
- 提交 Pull Request

## 下载项目

```bash
# 替换为自己的仓库地址
git clone https://github.com/nocobase/nocobase.git
cd nocobase
yarn install
```

## 应用开发与测试

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

## 文档预览

```bash
# 启动文档
yarn doc --lang=zh-CN
yarn doc --lang=en-US
```

文档在 docs 目录下，遵循 Markdown 语法

```bash
|- /docs/
  |- en-US
  |- zh-CN
```

## 其他

更多 Commands 使用说明 [参考 NocoBase CLI 章节](./development/nocobase-cli.md)