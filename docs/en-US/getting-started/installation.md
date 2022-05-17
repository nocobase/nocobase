---
order: 1
---

# Installation

NocoBase supports both Docker and CLI installation methods. Docker is recommended if you are new to NocoBase.

## Docker (👍Recommended)

### 0. Before start

⚡⚡ Please make sure you have installed [Docker](https://docs.docker.com/get-docker/)

### 1. Download NocoBase

Download with Git (or Download Zip，and extract it to the nocobase directory)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

### 2. Select database (choose one)

Supports SQLite, MySQL, PostgreSQL

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

### 3. Install and start NocoBase

It may take dozens of seconds

```bash
# run in the background
$ docker-compose up -d
# view app logs
$ docker-compose logs app

app-sqlite-app-1  | nginx started
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ cross-env DOTENV_CONFIG_PATH=.env node -r dotenv/config packages/app/server/lib/index.js install -s
app-sqlite-app-1  | Done in 2.72s.
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ pm2-runtime start --node-args="-r dotenv/config" packages/app/server/lib/index.js -- start
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: Launching in no daemon mode
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] starting in -fork mode-
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] online
app-sqlite-app-1  | 🚀 NocoBase server running at: http://localhost:13000/
```

### 4. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.


## CLI

### 0. Before start

Please make sure you have Node.js 12.x or above installed. You can download and install the latest LTS version from the official website. It is recommended to use nvm (or nvm-windows for Win systems) to manage Node.js versions if you plan to work with Node.js for a long time.

```bash
$ node -v

v16.13.2
```

yarn package manager is recommend.

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

Also, make sure you have configured and started the required database, which supports SQLite, MySQL, PostgreSQL.

### 1. Create a NocoBase project

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3356 \
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

### 2. switch to the project directory

```bash
cd my-nocobase-app
```

### 3. Install dependencies

📢 This next step may take more than ten minutes due to network environment, system configuration, and other factors.  

```bash
# For production deployments, you can install only the necessary dependencies to reduce the dependency size and download time
yarn install --production
# Or, install the full dependencies
yarn install
```

### 4. Install & Start NocoBase

```bash
# Start the application in a production environment. Recompile it if the source code has been modified (yarn build)
yarn start
# Start the application in the development environment. The code will be compiled in real time
yarn dev
```
