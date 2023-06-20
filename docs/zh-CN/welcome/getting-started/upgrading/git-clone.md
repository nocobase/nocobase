# Git 源码安装的升级

## 1. 切换到 NocoBase 项目目录

```bash
cd my-nocobase-app
```

## 2. 拉取最新代码

```bash
git pull
```

## 3. 删除旧依赖文件（非必须）

v0.10 进行了依赖的重大升级，如果 v0.9 升级 v0.10，需要删掉以下目录之后再升级

```bash
# 删除 .umi 相关缓存
yarn rimraf -rf ./**/{.umi,.umi-production}
# 删除编译文件
yarn rimraf -rf packages/*/*/{lib,esm,es,dist,node_modules}
# 删除全部依赖
yarn rimraf -rf node_modules
```

## 4. 更新依赖

```bash
yarn install
```

## 5. 执行更新命令

```bash
yarn nocobase upgrade
```

## 6. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
# 编译
yarn build
# 启动
yarn start
```
