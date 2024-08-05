/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { UserData, IUserDataResource } from './user-data-resource';
import { SyncSource } from './sync-source';
import { Logger } from '@nocobase/logger';
import { AuthModel } from '@nocobase/plugin-auth';

function maskValues(obj, keysToMask) {
  return Object.assign({}, obj, ...keysToMask.map((key) => ({ [key]: '***' })));
}

function buildDepartmentForest(departments: any[]) {
  // Create a map with department id as key
  const departmentMap = new Map(departments.map((dept) => [dept.id, { ...dept, children: [] }]));

  // Build the tree structure of departments
  function buildTree(parentId) {
    const parentDept = departmentMap.get(parentId);
    if (!parentDept) return {}; // If the parent department does not exist, return an empty array

    const children = [];
    departments.forEach((dept) => {
      if (dept.parentId === parentDept.id) {
        children.push(buildTree(dept.id)); // Recursively build the tree of child departments
      }
    });

    parentDept.children = children; // Assign the subtree to the children property of the parent department
    return parentDept; // Return an array containing the current department as the root of the tree
  }

  // Build the forest, including all top-level departments and those departments whose parentId does not exist
  const forest = [];
  departments.forEach((dept) => {
    if (!dept.parentId || dept.parentId === 1) {
      forest.push(buildTree(dept.id)); // Add top-level departments
    }
  });

  return forest; // Return the entire forest structure
}

async function traverseForestBFS(forest: any[], action) {
  const queue = [...forest]; // Put the root nodes of the forest into the queue

  while (queue.length > 0) {
    const currentNode = queue.shift(); // Dequeue a node from the queue
    await action(currentNode); // Perform the operation
    // Add all child nodes of the current node to the queue
    if (currentNode.children && currentNode.children.length > 0) {
      queue.push(...currentNode.children);
    }
  }
}

export class DefaultUserDataResource implements IUserDataResource {
  accepts: ('user' | 'department')[];
  db: Database;
  logger: Logger;

  constructor(db: Database, logger: Logger) {
    this.accepts = ['user', 'department'];
    this.db = db;
    this.logger = logger;
  }

  get userRepository() {
    return this.db.getRepository('users');
  }

  get departmentRepository() {
    return this.db.getRepository('departments');
  }

  async updateOrCreate(data: UserData) {
    if (data) {
      switch (data.type) {
        case 'user':
          await this.updateOrCreateUsers(data);
          break;
        case 'department':
          await this.updateOrCreateDepartments(data);
          break;
      }
    }
  }

  async updateOrCreateUsers(data: UserData) {
    if (!data.data || !data.data.length) {
      return;
    }
    if (!this.userRepository) {
      return;
    }
    const { uniqueKey, data: records, source } = data;
    this.logger.info(`updateOrCreateUsers: there is ${records.length} records waiting for processing`);
    const authenticator = (await source.instance.getAuthenticator()) as AuthModel;
    this.logger.info(`updateOrCreateUsers: authenticator: ${authenticator ? authenticator.name : 'none'}`);
    if (uniqueKey === 'id' && !authenticator) {
      this.logger.error(`updateOrCreateUsers: authenticator is not found`);
      throw new Error(`updateOrCreateUsers: authenticator is not found`);
    }
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      this.logger.info(
        `updateOrCreateUsers: ${i + 1}/${records.length} record is processing, record: ${JSON.stringify(
          maskValues(record, ['phone', 'email']),
        )}`,
      );
      let user: any;
      // 判断uniqueKey是否为id
      if (uniqueKey === 'id') {
        user = await authenticator.findUser(record[uniqueKey]);
        if (!user) {
          // 查询数据源关联用户
          user = await source.instance.findUser(record[uniqueKey]);
          if (!user) {
            // 创建用户
            this.logger.info(`updateOrCreateUsers: create user for record`);
            user = await authenticator.newUser(record[uniqueKey], {
              nickname: record.nickname === undefined ? record[uniqueKey] : record.nickname,
            });
            // 关联数据源
            this.logger.info(`updateOrCreateUsers: add user to source`);
            await source.instance.addUser(user.id, {
              through: {
                uuid: record[uniqueKey],
              },
            });
          } else {
            // 查询数据源关联用户
            user = await source.instance.findUser(record[uniqueKey]);
            if (!user) {
              // 关联数据源
              this.logger.info(`updateOrCreateUsers: add user to source`);
              await source.instance.addUser(user.id, {
                through: {
                  uuid: record[uniqueKey],
                },
              });
            } else {
              this.logger.info(`updateOrCreateUsers: user is already exists`);
            }
          }
        }
      } else {
        user = await this.userRepository.findOne({ filter: { [uniqueKey]: record[uniqueKey] } });
        if (!user) {
          // create user if not exists
          if (authenticator) {
            // 创建用户
            this.logger.info(`updateOrCreateUsers: create user for record`);
            user = await authenticator.newUser(record[uniqueKey], {
              username: record.username,
              nickname: record.nickname == null ? record.id : record.nickname,
              phone: record.phone,
              email: record.email,
            });
            // 关联数据源
            this.logger.info(`updateOrCreateUsers: add user to source`);
            await source.instance.addUser(user.id, {
              through: {
                uuid: record[uniqueKey],
              },
            });
          } else {
            // 创建用户
            this.logger.info(`updateOrCreateUsers: create user for record`);
            user = await source.instance.newUser(record[uniqueKey], {
              username: record.username,
              nickname: record.nickname == null ? record.id : record.nickname,
              phone: record.phone,
              email: record.email,
            });
          }
        } else {
          if (authenticator) {
            user = await authenticator.findUser(record[uniqueKey]);
            if (!user) {
              // 关联认证器
              this.logger.info(`updateOrCreateUsers: add user to authenticator`);
              await authenticator.addUser(user.id, {
                through: {
                  uuid: record[uniqueKey],
                },
              });
            }
          }
          user = await source.instance.findUser(record[uniqueKey]);
          if (!user) {
            // 关联数据源
            this.logger.info(`updateOrCreateUsers: add user to source`);
            await source.instance.addUser(user.id, {
              through: {
                uuid: record[uniqueKey],
              },
            });
          } else {
            this.logger.info(`updateOrCreateUsers: user is already exists`);
          }
        }
      }
      // add departments
      if (this.departmentRepository && record.departments && record.departments.length) {
        for (const deptId of record.departments) {
          if (deptId === 1) {
            continue;
          }
          const sourceDepartments = await source.instance.getDepartments({
            through: { where: { uuid: deptId } },
          });
          if (sourceDepartments && sourceDepartments.length) {
            const sourceDepartment = sourceDepartments[0];
            const userDepartments = await user.getDepartments({ where: { id: sourceDepartment.id } });
            if (!userDepartments || !userDepartments.length) {
              await user.addDepartments(sourceDepartment);
              this.logger.info(
                `updateOrCreateUsers: add department to user: id: ${sourceDepartment.id} name: ${sourceDepartment.title}`,
              );
            }
          }
        }
      }
      this.logger.info(`updateOrCreateUsers: ${i + 1}/${records.length} record is processed`);
      await this.createOrUpdateRecord('user', uniqueKey, record, source);
    }
  }

  async updateOrCreateDepartments(data: UserData) {
    if (!data.data || !data.data.length) {
      this.logger.info(`updateOrCreateDepartments: no departments found`);
      return;
    }
    if (!this.departmentRepository) {
      this.logger.error(`updateOrCreateDepartments: department repository is not found`);
      return;
    }
    const { uniqueKey, data: departments, source } = data;
    this.logger.info(`updateOrCreateDepartments: there is ${departments.length} departments waiting for processing`);
    const departmentForest = buildDepartmentForest(departments);
    await traverseForestBFS(departmentForest, async (department) => {
      this.logger.info(`updateOrCreateDepartments: department is processing, record: ${JSON.stringify(department)}`);
      let sourceDepartment = await source.instance.getDepartments({
        through: { where: { uuid: department[uniqueKey] } },
      });
      this.logger.info(`updateOrCreateDepartments: uuid: ${department[uniqueKey]}`);
      // convert to department forest
      if (!sourceDepartment || !sourceDepartment.length) {
        // create department if not exists
        this.logger.info(`updateOrCreateDepartments: create department for record`);
        sourceDepartment = await source.instance.createDepartment(
          {
            title: department.name,
          },
          { through: { uuid: department[uniqueKey] } },
        );
        // add parent department
        if (department.parentId && department.parentId !== 1) {
          const parentSourceDepartments = await source.instance.getDepartments({
            through: { where: { uuid: department.parentId } },
          });
          if (parentSourceDepartments && parentSourceDepartments.length) {
            const parentSourceDepartment = parentSourceDepartments[0];
            await sourceDepartment.setParent(parentSourceDepartment);
          }
        }
      } else {
        // update department, not supported yet
        this.logger.info(`updateOrCreateDepartments: update department for record`);
      }
      await this.createOrUpdateRecord('department', uniqueKey, department, source);
    });
  }

  // create or update sync record
  async createOrUpdateRecord(type: string, uniqueKey: string, data: any, source: SyncSource) {
    this.logger.info(
      `createOrUpdateRecord: type: ${type} uniqueKey: ${uniqueKey} data: ${JSON.stringify(data)} data uniqueKey: ${
        data[uniqueKey]
      }`,
    );
    const syncRecords = await source.instance.getRecords({
      where: { resourceId: data[uniqueKey], resource: type },
    });
    if (syncRecords && syncRecords.length) {
      const syncRecord = syncRecords[0];
      syncRecord.lastMetaData = syncRecord.metaData;
      syncRecord.metaData = JSON.stringify(data);
      await syncRecord.save();
    } else {
      await source.instance.createRecord({
        resourceId: data[uniqueKey],
        resource: type,
        resourcePk: uniqueKey,
        metaData: JSON.stringify(data),
      });
    }
  }
}
