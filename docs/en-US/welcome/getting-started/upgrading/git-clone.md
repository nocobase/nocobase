# Upgrading for Git source code

## 1. switch to the NocoBase project directory

```bash
cd my-nocobase-app
```

## 2. Pull the latest code

```bash
git pull
```

## 3. 删除旧依赖文件（非必须）

v0.10 进行了依赖的重大升级，如果 v0.9 升级 v0.10，需要删掉以下目录之后再升级

```bash
# Remove .umi cache
yarn rimraf -rf "./**/{.umi,.umi-production}"
# Delete compiled files
yarn rimraf -rf "./packages/*/*/{lib,esm,es,dist,node_modules}"
# Remove dependencies
yarn rimraf -rf node_modules
```

## 4. Update dependencies

```bash
yarn install
```

## 5. Execute the update command

```bash
yarn nocobase upgrade
```

## 6. Start NocoBase

development environment

```bash
yarn dev
```

Production environment

```bash
# compile
yarn build

# Start
yarn start # Not supported on Windows platforms yet
```
