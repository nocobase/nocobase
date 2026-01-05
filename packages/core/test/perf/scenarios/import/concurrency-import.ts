import { sleep, check } from 'k6';
import { vu } from 'k6/execution';
import http from 'k6/http';

import { setup as baseSetup } from './setup.js';

const appCount = Number.parseInt(__ENV.IMPORT_APP_COUNT, 10);
const iterations = Number.parseInt(__ENV.IMPORT_CONCURRENCY_PER_APP, 10);

const appNames = [...Array(appCount).keys()].map((index) => `import-test-apps-${index}`);
const importDataTestCollection = JSON.parse(open(__ENV.COLLECTION_DEFINED_JSON_PATH));
const importDataTestData = open(__ENV.IMPORT_TEMPLATE_WITH_MOCK_DATA, 'b');

export const options = {
  setupTimeout: '30m',
  scenarios: {
    'import-async': {
      executor: 'per-vu-iterations',
      vus: appNames.length,
      iterations,
      maxDuration: '30m',
    },
  },
};

export function setup() {
  const { token } = baseSetup();

  let appList = getAppList({ token, appNames });
  const appMap = Object.fromEntries(appList.data.map((app) => [app.name, app]));
  for (const appName of appNames) {
    if (appMap[appName]) {
      startApp({ token, name: appName });
      continue;
    }
    createApp({ token, name: appName });
    startApp({ token, name: appName });
  }
  do {
    appList = getAppList({ token, appNames });
    sleep(15);
  } while (!appList.data.every((app) => app.status === 'running'));

  for (const appName of appNames) {
    enablePlugins({ token, appName, pluginNames: ['action-import-pro'] });
    let enabledPluginNames = [];
    do {
      const enabledPluginList = listEnabledPlugin({ token, appName });
      enabledPluginNames = (enabledPluginList.data ?? []).map(({ name }) => name);
      sleep(15);
    } while (!enabledPluginNames.includes('action-import-pro'));
  }

  for (const appName of appNames) {
    const collectionList = findCollection({ token, appName, collectionName: 'importDataTest' });
    const [testCollection] = collectionList.data;
    if (testCollection?.name === importDataTestCollection.name) {
      destroyCollection({ token, appName });
    }
    createCollection({ token, appName });
  }

  return { token };
}

const getAppList = ({ token, appNames = [] }) => {
  const filterName = appNames.length ? `&${appNames.map((name) => `filter[name][$in]=${name}`).join('&')}` : '';
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/applications:list?pageSize=50&sort[]=-createdAt${filterName}`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
    },
    cookies: {},
  };
  const resp = http.request('GET', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const createApp = ({ token, name }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/applications:create`;
  const payload = JSON.stringify({
    name,
    options: { autoStart: false, authManager: {} },
    displayName: name,
  });
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, payload, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const enablePlugins = ({ token, appName, pluginNames = [] }) => {
  if (!appNames.length) {
    return;
  }
  const filterByTk = `${pluginNames.map((name) => `filterByTk[]=${name}`).join('&')}`;
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/pm:enable?${filterByTk}`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const listEnabledPlugin = ({ token, appName }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/pm:listEnabled`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('GET', url, null, params);
  return JSON.parse(resp.body);
};

const startApp = ({ token, name }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/applications:start?filterByTk=${name}`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const findCollection = ({ token, appName, collectionName }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/collections:list?pageSize=50&filter[name]=${collectionName}`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('GET', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const destroyCollection = ({ token, appName }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/collections:destroy?filterByTk=${importDataTestCollection.name}&cascade=true`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const createCollection = ({ token, appName }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/collections:create`;
  const payload = JSON.stringify({
    name: importDataTestCollection.name,
    title: importDataTestCollection.title,
    template: importDataTestCollection.template,
    autoGenId: importDataTestCollection.autoGenId,
    fields: importDataTestCollection.fields,
    logging: true,
    view: false,
  });
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, payload, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const importData = ({ token, appName }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/importDataTest:importXlsx?mode=auto`;
  const columns = JSON.stringify(
    importDataTestCollection.fields
      .filter((field) => field.name.startsWith('column') || field.name === 'id')
      .map((field) => ({
        dataIndex: [field.name],
        defaultTitle: field.uiSchema.title,
      })),
  );
  const payload = {
    file: http.file(
      importDataTestData,
      'importDataTest-import-template.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ),
    columns,
    explain: '',
  };
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('POST', url, payload, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

const getTask = ({ token, appName, taskId }) => {
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/asyncTasks:list?sort=-createdAt&filter[id]=${taskId}`;
  const params = {
    headers: {
      'Proxy-Connection': `keep-alive`,
      Authorization: `Bearer ${token}`,
      Accept: `application/json, text/plain, */*`,
      'X-Timezone': `+08:00`,
      'Content-Type': `application/json`,
      'X-With-ACL-Meta': `true`,
      'X-Locale': `en-US`,
      Origin: `${__ENV.ORIGIN}`,
      Referer: `${__ENV.ORIGIN}/admin/settings/multi-app-manager`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9`,
      'X-App': appName,
    },
    cookies: {},
  };
  const resp = http.request('GET', url, null, params);
  check(resp, { 'status equals 200': (r) => r.status === 200 });
  return JSON.parse(resp.body);
};

export default function ({ token }) {
  const appName = appNames[vu.idInTest - 1];
  const receipt = importData({ token, appName });
  console.log(`app id: ${appName} taskId: ${receipt.data.taskId}`);
  let status;
  do {
    const taskResp = getTask({ token, appName, taskId: receipt.data.taskId });
    const [task] = taskResp.data ?? [];
    status = task?.status;
    sleep(60);
  } while (status !== 1);
}
