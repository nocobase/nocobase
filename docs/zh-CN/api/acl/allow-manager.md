# AllowManager

开放权限管理

## 类方法
### `constructor(public acl: ACL)`

实例化 AllowManger

### `allow(resourceName: string, actionName: string, condition?: string | ConditionFunc)`

注册开放权限

```typescript
// users:login 可以被公开访问
allowManager.allow('users', 'login');
```

**参数**
* resourceName - 资源名称
* actionName - 资源动作名
* condition? - 配置生效条件
  * 传入 `string`，表示使用已定义的条件，注册条件使用 `acl.allowManager.registerCondition` 方法。
    ```typescript
    acl.allowManager.registerAllowCondition('superUser', async () => {
      return ctx.state.user?.id === 1;
    });
    
    // 开放 users:list 的权限，条件为 superUser
    acl.allow('users', 'list', 'superUser');
    ```
  * 传入 ConditionFunc，可接收 `ctx` 参数，返回 `boolean`，表示是否生效。
    ```typescript
    // 当用户ID为1时，可以访问 user:list 
    acl.allow('users', 'list', (ctx) => {
      return ctx.state.user?.id === 1;
    });
    ```

### `registerAllowCondition(name: string, condition: ConditionFunc)`

注册开放权限条件

### `getAllowedConditions(resourceName: string, actionName: string): Array<ConditionFunc | true>`

获取已注册的开放条件

**参数**
* resourceName - 资源名称
* actionName - 资源动作名

### `aclMiddleware()`

中间件，注入于 `acl` 实例中，用于判断是否开放权限，若根据条件判断为开放权限，则在 `acl` middleware 中会跳过权限检查。

