import http from 'http';
import url from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

class DBManager {
  aquiredDBs: Set<string> = new Set();

  aquire(name: string) {
    console.log('aquire', name);
    this.aquiredDBs.add(name);
  }

  relase(name: string) {
    this.aquiredDBs.delete(name);
    console.log(`release ${name}, current used ${this.aquiredDBs.size}`);
  }

  isAquired(name: string) {
    return this.aquiredDBs.has(name);
  }
}

const getDBNames = (size: number, name: string) => {
  const names = [];
  for (let i = 0; i < 100; i++) {
    names.push(`auto_named_${name}_${i}`);
  }
  return names;
};

abstract class BasePool {
  dbManager: DBManager = new DBManager();
  constructor(protected size: number) {}

  abstract createDatabase(name: string): Promise<void>;
  abstract getConfiguredDatabaseName(): string;
  abstract getDatabaseConfiguration(): any;

  async init() {
    const promises = [];
    for (const name of getDBNames(this.size, this.getConfiguredDatabaseName())) {
      promises.push(
        (async () => {
          console.log('create database', name);
          await this.createDatabase(name);
        })(),
      );
    }

    await Promise.all(promises);
  }

  async aquire() {
    const name = getDBNames(this.size, this.getConfiguredDatabaseName()).find(
      (name) => !this.dbManager.isAquired(name),
    );
    if (!name) {
      throw new Error('No available database');
    }
    this.dbManager.aquire(name);
    return name;
  }

  async release(name: string) {
    this.dbManager.relase(name);
  }
}

class PostgresPool extends BasePool {
  async createDatabase(name: string): Promise<void> {
    const config = this.getDatabaseConfiguration();
    const databaseName = this.getConfiguredDatabaseName();
    const client = new pg.Client({
      host: config['host'],
      port: config['port'],
      user: config['username'],
      password: config['password'],
      database: databaseName,
    });

    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS ${name}`);
    await client.query(`CREATE DATABASE ${name}`);
    await client.end();
  }

  getDatabaseConfiguration() {
    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    };
  }

  getConfiguredDatabaseName() {
    return process.env.DB_DATABASE;
  }
}

const pools = {
  postgres: PostgresPool,
};

(async () => {
  const poolSize = process.env.TEST_DB_POOL_SIZE || 10;
  const poolClass = pools[process.env.DB_DIALECT];

  if (!poolClass) {
    throw new Error(`Unknown pool class ${process.env.DB_DIALECT}`);
  }

  const pool = new poolClass(poolSize);
  await pool.init();

  return pool;
})()
  .then((pool) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;
      const trimmedPath = path.replace(/^\/+|\/+$/g, '');

      if (trimmedPath === 'aquire') {
        pool
          .aquire()
          .then((name) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ name }));
          })
          .catch((err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          });
      } else if (trimmedPath === 'release') {
        pool
          .release(parsedUrl.query.name as string)
          .then(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end();
          })
          .catch((err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
      }
    });

    server.listen(23450, '127.0.0.1', () => {
      console.log('Server is running at http://127.0.0.1:23450/');
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
