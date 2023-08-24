# Upgrading for Git source code

## 1. switch to the NocoBase project directory

```bash
cd my-nocobase-app
```

## 2. Pull the latest code

```bash
git pull
```

## 3. Delete cache and dependencies (optional)

```bash
# delete nocobase cache
yarn nocobase clean
# delete dependencies
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
