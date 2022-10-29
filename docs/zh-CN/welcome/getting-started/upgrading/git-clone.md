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
yarn start # 暂不支持在 win 平台下运行
```

注：生产环境，如果代码有修改，需要执行 `yarn build`，再重新启动 NocoBase。
