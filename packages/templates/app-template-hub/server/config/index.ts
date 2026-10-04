import users from './users.js';
import {
  defaultAppConfigs,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import auth from './auth.js';
import authorization from './authorization.js';
import session from './session.js';
import server from './server.js';
import spa from './spa.js';
import logging from './logging.js';
import drive from './drive.js';
import queue from './queue.js';
import jobs from './jobs.js';
import caching from './caching.js';
import i18n from './i18n.js';
import app from './app.js';
import api from './api.js';
import database from './database.js';
import snowflake from './snowflake.js';
import hub from './hub.js';

const defaultConfigs: AppConfigFactory<{
  users: ReturnType<typeof users>;
  auth: ReturnType<typeof auth>;
  authorization: ReturnType<typeof authorization>;
  session: ReturnType<typeof session>;
  server: ReturnType<typeof server>;
  spa: ReturnType<typeof spa>;
  logging: ReturnType<typeof logging>;
  drive: ReturnType<typeof drive>;
  queue: ReturnType<typeof queue>;
  jobs: ReturnType<typeof jobs>;
  caching: ReturnType<typeof caching>;
  i18n: ReturnType<typeof i18n>;
  app: ReturnType<typeof app>;
  api: ReturnType<typeof api>;
  database: ReturnType<typeof database>;
  snowflake: ReturnType<typeof snowflake>;
  hub: ReturnType<typeof hub>;
}> = defaultAppConfigs({
  users,
  auth,
  authorization,
  session,
  server,
  spa,
  logging,
  drive,
  queue,
  jobs,
  caching,
  i18n,
  app,
  api,
  database,
  snowflake,
  hub,
});

export default defaultConfigs;
