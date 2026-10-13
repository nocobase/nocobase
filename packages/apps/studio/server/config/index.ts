import {
  defaultAppConfigs,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import auth from './auth.js';
import authorization from './authorization.js';
import notification from './notification.js';
import secrets from './secrets.js';
import session from './session.js';
import server from './server.js';
import api from './api.js';
import spa from './spa.js';
import logging from './logging.js';
import drive from './drive.js';
import queue from './queue.js';
import jobs from './jobs.js';
import scheduler from './scheduler.js';
import caching from './caching.js';
import i18n from './i18n.js';
import app from './app.js';
import database from './database.js';
import snowflake from './snowflake.js';
import users from './users.js';
import releases from './releases.js';
import apiKeys from './api-keys.js';
import agents from './agents.js';

const defaultConfigs: AppConfigFactory<{
  auth: ReturnType<typeof auth>;
  authorization: ReturnType<typeof authorization>;
  notification: ReturnType<typeof notification>;
  secrets: ReturnType<typeof secrets>;
  session: ReturnType<typeof session>;
  server: ReturnType<typeof server>;
  api: ReturnType<typeof api>;
  spa: ReturnType<typeof spa>;
  logging: ReturnType<typeof logging>;
  drive: ReturnType<typeof drive>;
  queue: ReturnType<typeof queue>;
  jobs: ReturnType<typeof jobs>;
  scheduler: ReturnType<typeof scheduler>;
  caching: ReturnType<typeof caching>;
  i18n: ReturnType<typeof i18n>;
  app: ReturnType<typeof app>;
  database: ReturnType<typeof database>;
  snowflake: ReturnType<typeof snowflake>;
  users: ReturnType<typeof users>;
  releases: ReturnType<typeof releases>;
  apiKeys: ReturnType<typeof apiKeys>;
  agents: ReturnType<typeof agents>;
}> = defaultAppConfigs({
  auth,
  authorization,
  notification,
  secrets,
  session,
  server,
  api,
  spa,
  logging,
  drive,
  queue,
  jobs,
  scheduler,
  caching,
  i18n,
  app,
  database,
  snowflake,
  users,
  releases,
  apiKeys,
  agents,
});

export default defaultConfigs;
