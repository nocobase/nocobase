/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Browser, request } from '@nocobase/test/e2e';

const PORT = process.env.APP_PORT || 20000;
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

// 创建工作流
export const apiCreateWorkflow = async (data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "current": true,
        "options": {
            "deleteExecutionOnStatus": []
        },
        "title": "t3",
        "type": "collection"
    }
    */
  const result = await api.post(`/api/workflows:create`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": {
                "id": 74,
                "key": "il2nu3ovj53",
                "updatedAt": "2023-12-12T06:53:21.232Z",
                "createdAt": "2023-12-12T06:53:21.232Z",
                "title": "t3",
                "type": "collection",
                "enabled": false,
                "description": null,
                "executed": 0,
                "allExecuted": 0,
                "config": {},
                "current": true,
                "options": {
                    "deleteExecutionOnStatus": []
                },
                "useTransaction": true
            }
        }
    */
  return (await result.json()).data;
};

// 更新工作流
export const apiUpdateWorkflow = async (id: number, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
        {
            "id": 74,
            "key": "il2nu3ovj53",
            "updatedAt": "2023-12-12T06:53:21.232Z",
            "createdAt": "2023-12-12T06:53:21.232Z",
            "title": "t3",
            "type": "collection",
            "enabled": false,
            "description": null,
            "executed": 0,
            "allExecuted": 0,
            "current": true,
            "options": {
                "deleteExecutionOnStatus": []
            },
            "useTransaction": true
        }
    */
  const result = await api.post(`/api/workflows:update?filterByTk=${id}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*{
        "data": [
            {
                "id": 72,
                "createdAt": "2023-12-12T02:43:53.793Z",
                "updatedAt": "2023-12-12T05:41:33.300Z",
                "key": "fzk3j2oj4el",
                "title": "a11",
                "enabled": true,
                "description": null,
                "type": "collection",
                "config": {},
                "useTransaction": true,
                "executed": 0,
                "allExecuted": 0,
                "current": true,
                "options": {
                    "deleteExecutionOnStatus": []
                }
            }
        ]
    }*/
  return (await result.json()).data;
};

// 删除工作流
export const apiDeleteWorkflow = async (id: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/workflows:destroy?filterByTk=${id}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  // {"data":1}
  return (await result.json()).data;
};

// 查询工作流
export const apiGetWorkflow = async (id: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.get(
    `/api/workflows:get?filterByTk=${id}&appends[]=stats.executed&appends[]=versionStats.executed`,
    {
      headers,
    },
  );

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": {
            "id": 73,
            "createdAt": "2023-12-12T05:59:52.741Z",
            "updatedAt": "2023-12-12T05:59:52.741Z",
            "key": "1iuin0qchrh",
            "title": "t2",
            "enabled": false,
            "description": null,
            "type": "collection",
            "config": { },
            "useTransaction": true,
            // "executed": 0,
            // "allExecuted": 0,
            "current": true,
            "options": { }
            "versionStats": {
                "executed": 0,
            },
            "stats": {
                "executed": 0,
            }
        }
    }
    */
  return (await result.json()).data;
};

// 更新工作流触发器节点
export const apiUpdateWorkflowTrigger = async (id: number, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "config": {
            "appends": [
                "dept"
            ],
                "collection": "tt_mnt_org",
                    "changed": [],
                        "condition": {
                "$and": [
                    {
                        "id": {
                            "$eq": 1
                        }
                    }
                ]
            },
            "mode": 1
        }
    }
    */
  const result = await api.post(`/api/workflows:update?filterByTk=${id}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": [
            {
                "id": 73,
                "createdAt": "2023-12-12T05:59:52.741Z",
                "updatedAt": "2023-12-12T06:13:36.068Z",
                "key": "1iuin0qchrh",
                "title": "t2",
                "enabled": false,
                "description": null,
                "type": "collection",
                "config": {
                    "appends": [
                        "dept"
                    ],
                    "collection": "tt_mnt_org",
                    "changed": [],
                    "condition": {
                        "$and": [
                            {
                                "id": {
                                    "$eq": 1
                                }
                            }
                        ]
                    },
                    "mode": 1
                },
                "useTransaction": true,
                "executed": 0,
                "allExecuted": 0,
                "current": true,
                "options": {}
            }
        ]
    }
    */
  return (await result.json()).data;
};

// 添加工作流节点
export const apiCreateWorkflowNode = async (workflowId: number, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  /*upstreamId前置节点id ,null代表再触发器节点后面增加节点
        {
        "type": "calculation",
        "upstreamId": 263,
        "branchIndex": null,
        "title": "运算",
        "config": {}
        }
    */
  const result = await api.post(`/api/workflows/${workflowId}/nodes:create`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": {
            "id": 265,
            "type": "calculation",
            "upstreamId": null,
            "branchIndex": null,
            "title": "运算",
            "config": {},
            "workflowId": 76,
            "updatedAt": "2023-12-16T10:56:39.288Z",
            "createdAt": "2023-12-16T10:56:39.281Z",
            "key": "20jz2urt5w7",
            "downstreamId": 263
        }
    }
    */
  return (await result.json()).data;
};

// 查询工作流节点
export const apiGetWorkflowNode = async (id: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.get(`/api/flow_nodes:get?filterByTk=${id}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": {
            "id": 267,
            "createdAt": "2023-12-17T06:56:10.147Z",
            "updatedAt": "2023-12-17T08:53:38.117Z",
            "key": "idr5wibhyqn",
            "title": "查询数据",
            "upstreamId": 269,
            "branchIndex": null,
            "downstreamId": 270,
            "type": "query",
            "config": {
                "collection": "users",
                "params": {
                    "filter": {
                        "$and": [
                            {
                                "id": {
                                    "$eq": "{{$context.data.id}}"
                                }
                            }
                        ]
                    },
                    "sort": [],
                    "page": 1,
                    "pageSize": 20,
                    "appends": []
                }
            },
            "workflowId": 76
        }
    }
    */
  return (await result.json()).data;
};

// 更新工作流节点配置
export const apiUpdateWorkflowNode = async (id: number, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
    "config": {
        "engine": "math.js",
        "expression": "1"
        }
    }
     */
  const result = await api.post(`/api/flow_nodes:update?filterByTk=${id}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": [
            {
                "id": 266,
                "createdAt": "2023-12-16T10:56:58.586Z",
                "updatedAt": "2023-12-16T11:16:32.796Z",
                "key": "atbyvcs5mwc",
                "title": "运算",
                "upstreamId": 263,
                "branchIndex": null,
                "downstreamId": null,
                "type": "calculation",
                "config": {
                    "engine": "math.js",
                    "expression": "1"
                },
                "workflowId": 76
            }
        ]
    }
    */
  return (await result.json()).data;
};

// 查询节点执行历史
export const apiGetWorkflowNodeExecutions = async (id: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  const url = `/api/executions:list?appends[]=jobs&filter[workflowId]=${id}&fields=id,createdAt,updatedAt,key,status,workflowId`;
  const result = await api.get(url, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": [
                {
                    "id": 15,
                    "createdAt": "2023-12-13T02:13:13.737Z",
                    "updatedAt": "2023-12-13T02:13:13.799Z",
                    "key": "yibkv8h2uq6",
                    "useTransaction": false,
                    "status": 1,
                    "workflowId": 16,
                    "jobs": [
                        {
                            "id": 16,
                            "createdAt": "2023-12-13T02:13:13.783Z",
                            "updatedAt": "2023-12-13T02:13:13.783Z",
                            "executionId": 15,
                            "nodeId": 16,
                            "upstreamId": null,
                            "status": 1,
                            "result": false
                        },
                        {
                            "id": 17,
                            "createdAt": "2023-12-13T02:13:13.788Z",
                            "updatedAt": "2023-12-13T02:13:13.788Z",
                            "executionId": 15,
                            "nodeId": 17,
                            "upstreamId": 16,
                            "status": 1,
                            "result": true
                        }
                    ]
                },
                {
                    "id": 14,
                    "createdAt": "2023-12-13T02:09:00.529Z",
                    "updatedAt": "2023-12-13T02:09:00.590Z",
                    "key": "yibkv8h2uq6",
                    "useTransaction": false,
                    "status": 1,
                    "workflowId": 16,
                    "jobs": [
                        {
                            "id": 14,
                            "createdAt": "2023-12-13T02:09:00.575Z",
                            "updatedAt": "2023-12-13T02:09:00.575Z",
                            "executionId": 14,
                            "nodeId": 16,
                            "upstreamId": null,
                            "status": 1,
                            "result": false
                        },
                        {
                            "id": 15,
                            "createdAt": "2023-12-13T02:09:00.583Z",
                            "updatedAt": "2023-12-13T02:09:00.583Z",
                            "executionId": 14,
                            "nodeId": 17,
                            "upstreamId": 14,
                            "status": 1,
                            "result": true
                        }
                    ]
                }
            ],
            "meta": {
                "count": 2,
                "page": 1,
                "pageSize": 20,
                "totalPage": 1
            }
        }
    */
  return (await result.json()).data;
};

// 更新业务表单条数据
export const apiUpdateRecord = async (collectionName: string, id: number, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.post(`/api/${collectionName}:update?filterByTk=${id}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": [
                {
                    "id": 1,
                    "createdAt": "2023-12-12T02:43:53.793Z",
                    "updatedAt": "2023-12-12T05:41:33.300Z",
                    "key": "fzk3j2oj4el",
                    "title": "a11",
                    "enabled": true,
                    "description": null
                }
            ]
        }
    */
  return (await result.json()).data;
};

// 查询业务表单条数据
export const apiGetRecord = async (collectionName: string, id: number) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.get(`/api/${collectionName}:get?filterByTk=${id}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": {
                "id": 1,
                "createdAt": "2023-12-12T02:43:53.793Z",
                "updatedAt": "2023-12-12T05:41:33.300Z",
                "key": "fzk3j2oj4el",
                "title": "a11",
                "enabled": true,
                "description": null
            },
            "meta": {
                "allowedActions": {
                    "view": [
                        1
                    ],
                    "update": [
                        1
                    ],
                    "destroy": [
                        1
                    ]
                }
            }
        }
    */
  return (await result.json()).data;
};

// 查询业务表list
export const apiGetList = async (collectionName: string) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.get(`/api/${collectionName}:list`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": [
                {
                    "id": 1,
                    "createdAt": "2023-12-12T02:43:53.793Z",
                    "updatedAt": "2023-12-12T05:41:33.300Z",
                    "key": "fzk3j2oj4el",
                    "title": "a11",
                    "enabled": true,
                    "description": null
                }
            ],
            "meta": {
                "count": 1,
                "page": 1,
                "pageSize": 20,
                "totalPage": 1
            }
        }
    */
  return await result.json();
};

// 查询业务表list
export const apiFilterList = async (collectionName: string, filter: string) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.get(`/api/${collectionName}:list?${filter}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": [
                {
                    "id": 1,
                    "createdAt": "2023-12-12T02:43:53.793Z",
                    "updatedAt": "2023-12-12T05:41:33.300Z",
                    "key": "fzk3j2oj4el",
                    "title": "a11",
                    "enabled": true,
                    "description": null
                }
            ],
            "meta": {
                "count": 1,
                "page": 1,
                "pageSize": 20,
                "totalPage": 1
            }
        }
    */
  return await result.json();
};

// 添加业务表单条数据触发工作流表单事件,triggerWorkflows=key1!field,key2,key3!field.subfield
export const apiCreateRecordTriggerFormEvent = async (collectionName: string, triggerWorkflows: string, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "title": "a11",
        "enabled": true,
        "description": null
    }
    */
  const result = await api.post(`/api/${collectionName}:create?triggerWorkflows=${triggerWorkflows}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": {
                "id": 1,
                "createdAt": "2023-12-12T02:43:53.793Z",
                "updatedAt": "2023-12-12T05:41:33.300Z",
                "key": "fzk3j2oj4el",
                "title": "a11",
                "enabled": true,
                "description": null
            },
            "meta": {
                "allowedActions": {
                    "view": [
                        1
                    ],
                    "update": [
                        1
                    ],
                    "destroy": [
                        1
                    ]
                }
            }
        }
    */
  return (await result.json()).data;
};

// 提交至工作流触发工作流表单事件
export const apiSubmitRecordTriggerFormEvent = async (triggerWorkflows: string, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "title": "a11",
        "enabled": true,
        "description": null
    }
    */
  const result = await api.post(`/api/workflows:trigger?triggerWorkflows=${triggerWorkflows}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {}
    */
  return await result.json();
};

// 获取数据源个数
export const apiGetDataSourceCount = async () => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  const result = await api.get(`/api/dataSources:list?pageSize=50`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
    {
        "data": 1
    }
    */
  return (await result.json()).meta.count;
};

// 添加业务表单条数据触发工作流表单事件,triggerWorkflows=key1!field,key2,key3!field.subfield
export const apiCreateRecordTriggerActionEvent = async (
  collectionName: string,
  triggerWorkflows: string,
  data: any,
) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "title": "a11",
        "enabled": true,
        "description": null
    }
    */
  const result = await api.post(`/api/${collectionName}:create?triggerWorkflows=${triggerWorkflows}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": {
                "id": 1,
                "createdAt": "2023-12-12T02:43:53.793Z",
                "updatedAt": "2023-12-12T05:41:33.300Z",
                "key": "fzk3j2oj4el",
                "title": "a11",
                "enabled": true,
                "description": null
            },
            "meta": {
                "allowedActions": {
                    "view": [
                        1
                    ],
                    "update": [
                        1
                    ],
                    "destroy": [
                        1
                    ]
                }
            }
        }
    */
  return (await result.json()).data;
};

// 添加业务表单条数据触发工作流表单事件,triggerWorkflows=key1!field,key2,key3!field.subfield
export const apiTriggerCustomActionEvent = async (collectionName: string, triggerWorkflows: string, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "title": "a11",
        "enabled": true,
        "description": null
    }
    */
  const result = await api.post(`/api/${collectionName}:trigger?triggerWorkflows=${triggerWorkflows}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
        {
            "data": {
                "id": 1,
                "createdAt": "2023-12-12T02:43:53.793Z",
                "updatedAt": "2023-12-12T05:41:33.300Z",
                "key": "fzk3j2oj4el",
                "title": "a11",
                "enabled": true,
                "description": null
            },
            "meta": {
                "allowedActions": {
                    "view": [
                        1
                    ],
                    "update": [
                        1
                    ],
                    "destroy": [
                        1
                    ]
                }
            }
        }
    */
  return (await result.json()).data;
};

// 审批中心发起审批
export const apiApplyApprovalEvent = async (data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
    {
        "title": "a11",
        "enabled": true,
        "description": null
    }
    */
  const result = await api.post('/api/approvals:create', {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  /*
  {
      "data": {
          "id": 35,
          "collectionName": "tt_amt_orgREmwr",
          "data": {
              "id": 6,
              "url": null,
              "sort": 3,
              "email": null,
              "phone": null,
              "address": null,
              "orgcode": "区域编码000000006",
              "orgname": "阿三大苏打实打实的",
              "isenable": null,
              "staffnum": null,
              "createdAt": "2024-03-09T11:37:47.620Z",
              "sharesnum": null,
              "updatedAt": "2024-03-09T11:37:47.620Z",
              "insurednum": null,
              "range_json": null,
              "regcapital": null,
              "testdataid": null,
              "createdById": 1,
              "paidcapital": null,
              "range_check": [],
              "updatedById": 1,
              "status_radio": null,
              "establishdate": null,
              "insuranceratio": null,
              "range_markdown": null,
              "range_richtext": null,
              "status_singleselect": null,
              "range_multipleselect": [],
              "insuranceratio_formula": null
          },
          "status": 2,
          "workflowId": 39,
          "dataKey": "6",
          "updatedAt": "2024-03-09T11:37:47.640Z",
          "createdAt": "2024-03-09T11:37:47.640Z",
          "createdById": 1,
          "updatedById": 1,
          "workflowKey": null,
          "latestExecutionId": null
      }
  }
    */
  return (await result.json()).data;
};

// 新增字段
export const apiCreateField = async (collectionName: string, data: any) => {
  const api = await request.newContext({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE,
  });
  const state = await api.storageState();
  const headers = getHeaders(state);
  /*
  {
    "sourceKey": "id",
    "foreignKey": "orgid",
    "onDelete": "SET NULL",
    "name": "dept",
    "type": "hasMany",
    "uiSchema": {
    "x-component": "AssociationField",
    "x-component-props": {
    "multiple": true
    },
    "title": "dept"
    },
    "interface": "o2m",
    "target": "tt_mnt_dept",
    "targetKey": "id"
    }
    */
  const result = await api.post(`/api/collections/${collectionName}/fields:create`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
  return (await result.json()).data;
};
/*
{
    "data": {
        "key": "np4llsa0fsx",
        "name": "dept1",
        "type": "hasMany",
        "interface": "o2m",
        "collectionName": "tt_mnt_org",
        "description": null,
        "parentKey": null,
        "reverseKey": null,
        "sourceKey": "id",
        "foreignKey": "orgid",
        "onDelete": "SET NULL",
        "uiSchema": {
            "x-component": "AssociationField",
            "x-component-props": {
                "multiple": true
            },
            "title": "dept1"
        },
        "target": "tt_mnt_dept",
        "targetKey": "id"
    }
}
 */
const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === APP_BASE_URL)
    ?.localStorage.find((item) => item.name === key)?.value;
};

function getHeaders(storageState: any) {
  const headers: any = {};
  const token = getStorageItem('NOCOBASE_TOKEN', storageState);
  const auth = getStorageItem('NOCOBASE_AUTH', storageState);
  const subAppName = new URL(APP_BASE_URL).pathname.match(/^\/apps\/([^/]*)\/*/)?.[1];
  const hostName = new URL(APP_BASE_URL).host;
  const locale = getStorageItem('NOCOBASE_LOCALE', storageState);
  const timezone = '+08:00';
  const withAclMeta = 'true';
  const role = getStorageItem('NOCOBASE_ROLE', storageState);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (auth) {
    headers['X-Authenticator'] = auth;
  }
  if (subAppName) {
    headers['X-App'] = subAppName;
  }
  if (hostName) {
    headers['X-Hostname'] = hostName;
  }
  if (locale) {
    headers['X-Locale'] = locale;
  }
  if (timezone) {
    headers['X-Timezone'] = timezone;
  }
  if (withAclMeta) {
    headers['X-With-Acl-Meta'] = withAclMeta;
  }
  if (role) {
    headers['X-Role'] = role;
  }

  return headers;
}

// 用户登录新会话
export const approvalUserPassword = '1a2B3c4#';
export const userLogin = async (browser: Browser, approvalUserEmail: string, approvalUser: string) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('signin');
  await page.getByPlaceholder('Email').fill(approvalUserEmail);
  await page.getByPlaceholder('Password').fill(approvalUserPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForLoadState('load');
  return context;
};

export default module.exports = {
  apiCreateWorkflow,
  apiUpdateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflowTrigger,
  apiGetWorkflowNodeExecutions,
  apiCreateWorkflowNode,
  apiUpdateWorkflowNode,
  apiGetWorkflowNode,
  apiUpdateRecord,
  apiGetRecord,
  apiGetList,
  apiCreateRecordTriggerFormEvent,
  apiSubmitRecordTriggerFormEvent,
  apiFilterList,
  apiGetDataSourceCount,
  apiCreateRecordTriggerActionEvent,
  apiApplyApprovalEvent,
  userLogin,
  apiCreateField,
  apiTriggerCustomActionEvent,
  approvalUserPassword,
};
