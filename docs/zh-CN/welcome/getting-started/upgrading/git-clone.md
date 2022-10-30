# Git 源码安装的升级

## 1. 切换到 NocoBase 项目目录

```bash
cd my-nocobase-app
```

## 2. 拉取最新代码

```bash
git pull
```

## 3. 更新依赖

```
yarn install
```

## 4. 执行更新命令

```bash
yarn nocobase upgrade
```

## 5. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
# 编译
yarn build
# 启动
yarn start # 暂不支持在 win 平台下运行
```

