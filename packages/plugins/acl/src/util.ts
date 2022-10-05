import {Cache} from "@nocobase/cache";
import {Database} from "@nocobase/database";

const CACHE_KEY_SYS_ROLE_NAME_OBJ = 'sys_role_name_obj';

/**
 * get roles name object in system ,etc: {admin:1, member:1}
 * @param {Cache} cache
 * @param {Database} db
 * @returns {Promise<Object>}
 */
export function getRoleNameObj(cache: Cache, db: Database): Promise<Object> {
  return cache.wrap<Object>(CACHE_KEY_SYS_ROLE_NAME_OBJ, async () => {
    const roleNameObj = {};
    const roles = await db.getRepository('roles').find();
    roles.forEach((role) => {
      roleNameObj[role.get('name') as string] = 1
    });
    return roleNameObj;
  });
}

/**
 * del roles name object in cache
 * @param {Cache} cache
 * @returns {Promise<any>}
 */
export function delRoleNameObj(cache: Cache) {
  return cache.del(CACHE_KEY_SYS_ROLE_NAME_OBJ);
}
