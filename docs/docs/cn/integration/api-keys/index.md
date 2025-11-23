# 在 NocoBase 中使用 API 密钥

本指南通过实际的"待办事项"示例，演示如何在 NocoBase 中使用 API 密钥来获取数据。请按照以下分步说明理解完整的工作流程。

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 理解 API 密钥

API 密钥是一种安全令牌，用于验证来自授权用户的 API 请求。它作为凭据，在通过 Web 应用程序、移动应用或后端脚本访问 NocoBase 系统时验证请求者的身份。

在 HTTP 请求头中的格式：

```txt
Authorization: Bearer {API 密钥}
```

"Bearer" 前缀表示后面跟随的是用于验证请求者权限的已认证 API 密钥。

### 常见使用场景

API 密钥通常用于以下场景：

1. **客户端应用访问**：Web 浏览器和移动应用使用 API 密钥验证用户身份，确保只有授权用户能够访问数据。
2. **自动化任务执行**：后台进程和定时任务使用 API 密钥安全地执行更新、数据同步和日志记录操作。
3. **开发与测试**：开发者在调试和测试期间使用 API 密钥模拟已认证的请求并验证 API 响应。

API 密钥提供多重安全优势：身份验证、使用监控、请求速率限制和威胁防范，确保 NocoBase 的稳定和安全运行。

## 2 在 NocoBase 中创建 API 密钥

### 2.1 启用认证：API 密钥插件

确保已启用内置的[认证：API 密钥](/plugins/@nocobase/plugin-api-keys/)插件。启用后，系统设置中将出现新的 API 密钥配置页面。

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 创建测试数据表

为演示目的，创建一个名为 `todos` 的数据表，包含以下字段：

- `id`
- `标题（title）`
- `是否完成（completed）`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

向数据表中添加一些示例记录：

- 吃饭
- 睡觉
- 打游戏

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 创建和分配角色

API 密钥绑定到用户角色，系统根据分配的角色确定请求权限。在创建 API 密钥之前，必须创建角色并配置适当的权限。创建名为"待办 API 角色"的角色，并授予其对 `todos` 数据表的完全访问权限。

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

如果创建 API 密钥时"待办 API 角色"不可用，请确保当前用户已被分配此角色：

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

分配角色后，刷新页面并导航到 API 密钥管理页面。点击"添加 API 密钥"以验证"待办 API 角色"出现在角色选择中。

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

为了更好的访问控制，可以考虑创建专用的用户账号（例如"待办 API 用户"）专门用于 API 密钥管理和测试。将"待办 API 角色"分配给此用户。
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 生成并保存 API 密钥

提交表单后，系统将显示确认消息和新生成的 API 密钥。**重要提示**：立即复制并安全存储此密钥，出于安全原因，该密钥不会再次显示。

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

API 密钥示例：

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 重要说明

- API 密钥的有效期由创建时配置的过期设置决定。
- API 密钥的生成和验证依赖于 `APP_KEY` 环境变量。**请勿修改此变量**，否则将使系统中所有现有 API 密钥失效。

## 3 测试 API 密钥认证

### 3.1 使用 API 文档插件

打开 [API 文档](/plugins/@nocobase/plugin-api-doc/)插件，查看每个 API 端点的请求方法、URL、参数和请求头。

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 理解基本 CRUD 操作

NocoBase 提供标准的 CRUD（创建、读取、更新、删除）API 用于数据操作：

- **列表查询（list 接口）：**

  ```txt
  GET {baseURL}/{collectionName}:list
  请求头：
  - Authorization: Bearer <API密钥>

  ```
- **新增记录（create 接口）：**

  ```txt
  POST {baseURL}/{collectionName}:create

  请求头：
  - Authorization: Bearer <API密钥>

  请求体（JSON格式），例如：
      {
          "title": "123"
      }
  ```
- **修改记录（update 接口）：**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  请求头：
  - Authorization: Bearer <API密钥>

  请求体（JSON格式），例如：
      {
          "title": "123",
          "completed": true
      }
  ```
- **删除记录（delete 接口）：**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  请求头：
  - Authorization: Bearer <API密钥>
  ```

其中：
- `{baseURL}`：NocoBase 系统 URL
- `{collectionName}`：数据表名称

示例：本地实例 `localhost:13000`，数据表名称 `todos`：

```txt
http://localhost:13000/api/todos:list
```

### 3.3 使用 Postman 测试

在 Postman 中创建 GET 请求，配置如下：
- **URL**：请求端点（例如 `http://localhost:13000/api/todos:list`）
- **Headers**：添加 `Authorization` 请求头，值为：

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**成功响应：**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**错误响应（无效/过期的 API 密钥）：**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**故障排除**：如果认证失败，请验证角色权限、API 密钥绑定和令牌格式。

### 3.4 导出请求代码

Postman 允许以各种格式导出请求。cURL 命令示例：

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 在 Iframe 区块中显示数据

此示例演示如何在 [Iframe 区块](/plugins/@nocobase/plugin-block-iframe/)中显示通过 API 密钥检索的数据。以下 HTML 页面获取并显示待办事项列表：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

此代码创建了一个简单的 HTML 页面：
1. 使用带 API 密钥认证的 `fetch` API 调用 NocoBase API
2. 检索待办事项列表数据
3. 在格式化视图中显示 JSON 响应

以下动画展示了完整的工作流程：

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 总结

本指南涵盖了在 NocoBase 中使用 API 密钥的完整工作流程：

1. **设置**：启用 API 密钥插件并创建测试数据表
2. **配置**：创建具有适当权限的角色并生成 API 密钥
3. **测试**：使用 Postman 和 API 文档插件验证 API 密钥认证
4. **集成**：在 Iframe 区块中显示检索的数据

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

有关完整代码示例和社区讨论，请访问 [NocoBase 论坛帖子](https://forum.nocobase.com/t/api-api-key/3314)。

**其他资源：**
- [API 密钥插件文档](/plugins/@nocobase/plugin-api-keys/)
- [API 文档插件](/plugins/@nocobase/plugin-api-doc/)
- [Iframe 区块文档](/plugins/@nocobase/plugin-block-iframe/)