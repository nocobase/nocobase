# Git 源码安装的升级

## 1. 切换到 NocoBase 项目目录

```bash
cd my-nocobase-app
```

## 2. 拉取最新代码

```bash
git pull
```

## 3. 删除缓存和旧依赖（非必须）

如果正常的升级流程失败，可以尝试清空缓存和依赖之后重新下载

```bash
# 删除 nocobase 缓存
yarn nocobase clean
# 删除依赖
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
