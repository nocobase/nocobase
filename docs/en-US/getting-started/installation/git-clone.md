# Git source code

## 0. Prerequisites

Make sure you have:

- Git, Node.js 14+, Yarn 1.22.x installed
- Configured and started the required database SQLite 3.x, MySQL 8.x, PostgreSQL 10.x choose one

## 1. Download with Git

```bash
git clone https://github.com/nocobase/nocobase.git my-nocobase-app
```

## 2. Switch to the project directory

```bash
cd my-nocobase-app
```

## 3. Install dependencies

```bash
yarn install
```

## 4. Set environment variables

The environment variables required by NocoBase are stored in the root `.env` file, modify the environment variables according to the actual situation, if you don't know how to change them, [click here for environment variables description](../../development/env.md), or you can leave it as default.

```bash
# Using sqlite database
DB_DIALECT=sqlite
# sqlite file path
DB_STORAGE=storage/db/nocobase.sqlite
```

## 5. Install NocoBase

```bash
yarn nocobase install --lang=zh-CN
```

## 6. Start NocoBase

Development

```bash
yarn dev
```

Production

```bash
# Compile
yarn build
# Start
yarn start # Does not support running on win platform
```

## 7. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.
