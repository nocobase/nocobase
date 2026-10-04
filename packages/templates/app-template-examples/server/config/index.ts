import {
  defaultAppConfigs,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import auth from './auth.js';
import authorization from './authorization.js';
import notification from './notification.js';
import session from './session.js';
import server from './server.js';
import spa from './spa.js';
import heartbeat from './heartbeat.js';
import logging from './logging.js';
import drive from './drive.js';
import queue from './queue.js';
import queueExample from './queue-example.js';
import jobs from './jobs.js';
import scheduler from './scheduler.js';
import caching from './caching.js';
import i18n from './i18n.js';
import app from './app.js';
import api from './api.js';
import database from './database.js';
import snowflake from './snowflake.js';
import ai from './ai.js';
import workflow from './workflow.js';

const defaultConfigs: AppConfigFactory<{
  auth: ReturnType<typeof auth>;
  authorization: ReturnType<typeof authorization>;
  notification: ReturnType<typeof notification>;
  session: ReturnType<typeof session>;
  server: ReturnType<typeof server>;
  spa: ReturnType<typeof spa>;
  heartbeat: ReturnType<typeof heartbeat>;
  logging: ReturnType<typeof logging>;
  drive: ReturnType<typeof drive>;
  queue: ReturnType<typeof queue>;
  queueExample: ReturnType<typeof queueExample>;
  jobs: ReturnType<typeof jobs>;
  scheduler: ReturnType<typeof scheduler>;
  caching: ReturnType<typeof caching>;
  i18n: ReturnType<typeof i18n>;
  app: ReturnType<typeof app>;
  api: ReturnType<typeof api>;
  database: ReturnType<typeof database>;
  snowflake: ReturnType<typeof snowflake>;
  ai: ReturnType<typeof ai>;
  workflow: ReturnType<typeof workflow>;
}> = defaultAppConfigs({
  auth,
  authorization,
  notification,
  session,
  server,
  spa,
  heartbeat,
  logging,
  drive,
  queue,
  queueExample,
  jobs,
  scheduler,
  caching,
  i18n,
  app,
  api,
  database,
  snowflake,
  ai,
  workflow,
});

export default defaultConfigs;
