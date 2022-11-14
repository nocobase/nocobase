# Upgrading for Git source code

## 1. switch to the NocoBase project directory

```bash
cd my-nocobase-app
```

## 2. Pull the latest code

```bash
git pull
```

## 3. Update dependencies

```bash
yarn install
```

## 4. Execute the update command

```bash
yarn nocobase upgrade
```

## 5. Start NocoBase

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

