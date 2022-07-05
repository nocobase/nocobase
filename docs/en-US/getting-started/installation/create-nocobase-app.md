# `create-nocobase-app`

## 0. Prerequisites

Make sure you have:

- Installed Node.js 14+, Yarn 1.22.x
- Configured and started one of the required database SQLite 3.x, MySQL 8.x, PostgreSQL 10.x

Please make sure you have Node.js 14.x or above installed. You can download and install the latest LTS version from the official website. It is recommended to use nvm (or nvm-windows for Win systems) to manage Node.js versions if you plan to work with Node.js for a long time.

```bash
$ node -v

v16.13.2
```

Install yarn package manager

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

## 1. Create a NocoBase project

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3306 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres \
   -e DB_HOST=localhost \
   -e DB_PORT=5432 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
```

## 2. Switch to the project directory

```bash
cd my-nocobase-app
```

## 3. Install dependencies

📢 This next step may take more than ten minutes due to network environment, system configuration, and other factors.  

```bash
yarn install
```

## 4. Install NocoBase

```bash
yarn nocobase install --lang=zh-CN
```

## 5. Start NocoBase

Development

```bash
yarn dev
```

Production

```bash
yarn start # Does not support running on win platform
```

Note: For production, if the code has been modified, you need to execute `yarn build` and restart NocoBase.

## 6. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.
