/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dotenv from 'dotenv';
import http from 'http';
import mariadb from 'mariadb';
import mysql from 'mysql2/promise';
import path from 'path';
import pg from 'pg';
import url from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

abstract class BaseClient<Client> {
  protected _client: Client | null = null;
  private createdDBs: Set<string> = new Set();

  abstract _createDB(name: string): Promise<void>;
  abstract _createConnection(): Promise<Client>;
  abstract _removeDB(name: string): Promise<void>;

  async createDB(name: string) {
    if (this.createdDBs.has(name)) {
      return;
    }

    if (!this._client) {
      this._client = await this._createConnection();
    }

    await this._createDB(name);
    this.createdDBs.add(name);

    // remove db after 3 minutes
    setTimeout(
      async () => {
        await this.removeDB(name);
      },
      3 * 60 * 1000,
    );
  }

  async releaseAll() {
    if (!this._client) {
      return;
    }

    const dbNames = Array.from(this.createdDBs);

    for (const name of dbNames) {
      console.log(`Removing database: ${name}`);
      await this._removeDB(name);
      this.createdDBs.delete(name);
    }
  }

  async removeDB(name: string) {
    if (!this._client) {
      return;
    }
    if (this.createdDBs.has(name)) {
      await this._removeDB(name);
      this.createdDBs.delete(name);
    }
  }
}

class PostgresClient extends BaseClient<pg.Client> {
  async _removeDB(name: string): Promise<void> {
    await this._client.query(`DROP DATABASE IF EXISTS ${name}`);
  }

  async _createDB(name: string): Promise<void> {
    await this._client.query(`DROP DATABASE IF EXISTS ${name}`);
    await this._client.query(`CREATE DATABASE ${name};`);
  }

  async _createConnection(): Promise<pg.Client> {
    const client = new pg.Client({
      host: process.env['DB_HOST'],
      port: Number(process.env['DB_PORT']),
      user: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_DATABASE'],
    });

    await client.connect();
    return client;
  }
}

class MySQLClient extends BaseClient<any> {
  async _removeDB(name: string): Promise<void> {
    await this._client.query(`DROP DATABASE IF EXISTS ${name}`);
  }

  async _createDB(name: string): Promise<void> {
    await this._client.query(`CREATE DATABASE IF NOT EXISTS ${name}`);
  }

  async _createConnection(): Promise<mysql.Connection> {
    return mysql.createConnection({
      host: process.env['DB_HOST'],
      port: Number(process.env['DB_PORT']),
      user: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_DATABASE'],
    });
  }
}

class MariaDBClient extends BaseClient<any> {
  async _removeDB(name: string): Promise<void> {
    await this._client.query(`DROP DATABASE IF EXISTS ${name}`);
  }

  async _createDB(name: string): Promise<void> {
    await this._client.query(`CREATE DATABASE IF NOT EXISTS ${name}`);
  }

  async _createConnection(): Promise<mariadb.Connection> {
    return await mariadb.createConnection({
      host: process.env['DB_HOST'],
      port: Number(process.env['DB_PORT']),
      user: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_DATABASE'],
    });
  }
}

const client = {
  postgres: () => {
    return new PostgresClient();
  },
  mysql: () => {
    return new MySQLClient();
  },
  mariadb: () => {
    return new MariaDBClient();
  },
};

const dialect = process.env['DB_DIALECT'];

if (!client[dialect]) {
  throw new Error(`Unknown dialect: ${dialect}`);
}

const dbClient = client[dialect]();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  if (trimmedPath === 'acquire') {
    const name = parsedUrl.query.name as string | undefined;

    dbClient
      .createDB(name)
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end();
      })
      .catch((error: Error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error }));
      });
  } else if (trimmedPath === 'release') {
    const name = parsedUrl.query.name as string | undefined;
    dbClient
      .removeDB(name)
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end();
      })
      .catch((error: Error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error }));
      });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
  }
});

server.listen(23450, '127.0.0.1', () => {
  console.log('Server is running at http://127.0.0.1:23450/');
});
