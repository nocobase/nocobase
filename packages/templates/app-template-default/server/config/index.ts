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
import spa from './spa.js';
import logging from './logging.js';
import drive from './drive.js';
import queue from './queue.js';
import jobs from './jobs.js';
import scheduler from './scheduler.js';
import caching from './caching.js';
import i18n from './i18n.js';
import app from './app.js';
import api from './api.js';
import database from './database.js';
import snowflake from './snowflake.js';
import workflow from './workflow.js';
import users from './users.js';

const defaultConfigs: AppConfigFactory<{
  auth: ReturnType<typeof auth>;
  authorization: ReturnType<typeof authorization>;
  notification: ReturnType<typeof notification>;
  secrets: ReturnType<typeof secrets>;
  session: ReturnType<typeof session>;
  server: ReturnType<typeof server>;
  spa: ReturnType<typeof spa>;
  logging: ReturnType<typeof logging>;
  drive: ReturnType<typeof drive>;
  queue: ReturnType<typeof queue>;
  jobs: ReturnType<typeof jobs>;
  scheduler: ReturnType<typeof scheduler>;
  caching: ReturnType<typeof caching>;
  i18n: ReturnType<typeof i18n>;
  app: ReturnType<typeof app>;
  api: ReturnType<typeof api>;
  database: ReturnType<typeof database>;
  snowflake: ReturnType<typeof snowflake>;
  workflow: ReturnType<typeof workflow>;
  users: ReturnType<typeof users>;
}> = defaultAppConfigs({
  auth,
  authorization,
  notification,
  secrets,
  session,
  server,
  spa,
  logging,
  drive,
  queue,
  jobs,
  scheduler,
  caching,
  i18n,
  app,
  api,
  database,
  snowflake,
  workflow,
  users,
});

export default defaultConfigs;
