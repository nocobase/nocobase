# 使用 API Keys 获取数据

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

亲爱的小伙伴们，欢迎来到本次教程。
在这篇文档中，我将一步步引导大家如何在 NocoBase 中使用 API 密钥来获取数据，以“待办事项”为例，帮助你理解每个环节的细节。请仔细阅读下面的内容，并跟随步骤进行操作。

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 了解 API 密钥的概念

在开始之前，我们首先要弄清楚：什么是 API 密钥？这就像是一张入场券，用来确认 API 请求是否来自合法的用户。当你通过网页、手机应用或后台脚本访问 NocoBase 系统时，这把“秘密钥匙”就能帮系统快速验证你的身份。

在 HTTP 请求头中，我们会看到这样的格式：

```txt
Authorization: Bearer {API 密钥}
```

这里的 “Bearer” 表示后面紧跟的是经过验证的 API 密钥，从而可以快速确认请求者的权限。

在实际应用中，API 密钥常用于以下场景：

1. **客户端应用访问**：当用户通过浏览器或移动应用调用 API 时，系统会用 API 密钥来验证用户身份，确保只有授权用户能够获取数据。
2. **自动化任务执行**：后台定时任务或脚本在更新数据或记录日志时，会使用 API 密钥来保障请求的安全性和合法性。
3. **开发与测试**：开发者在调试和测试过程中，利用 API 密钥来模拟真实请求，确保接口能正确响应。

简而言之，API 密钥不仅帮助我们确认请求者的身份，还能监控调用情况、限制请求频率，并防止潜在的安全威胁，从而为 NocoBase 的稳定运行保驾护航.

## 2 在 NocoBase 中创建 API 密钥

### 2.1 开启 [API 密钥](https://docs-cn.nocobase.com/handbook/api-keys) 插件

首先，请确保已开启 NocoBase 内置的 “认证：API 密钥” 插件。开启后，系统设置中心会新增一个[API 密钥](https://docs-cn.nocobase.com/handbook/api-keys) 的配置页面.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 创建用于测试的待办记录表

为了便于测试，我们提前创建一张名为 `待办记录表(todos)` 的表，字段包括：

- `id`
- `标题（title）`
- `是否完成（completed）`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

然后在这张表中随机输入几条待办内容，例如：

- 吃饭
- 睡觉
- 打游戏

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 创建并绑定角色

由于 API 密钥与用户角色是绑定的，系统会根据角色判断请求的权限。因此，在创建 API 密钥前，我们需要先创建一个角色并分配相应权限.
建议创建一个叫 “待办API角色” 的测试角色，给该角色分配待办记录表的所有权限.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

如果在创建 API 密钥时无法选择 “待办系统API角色”，可能是因为当前用户尚未拥有该角色. 此时，请先为当前用户分配此角色:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

分配角色后，刷新页面，进入 API 密钥管理页面，点击 “添加 API 密钥”，你就可以看到 “待办系统API角色” 已经出现了.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

为了更精确的进行管理，我们也可以创建一个专门的 “待办API 用户” 来登陆系统，进行权限测试、管理 API 密钥，给该用户分配单独的 “待办API角色” 即可.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 创建 API 密钥并保存

点击提交后，系统会弹出提示，告知 API 密钥创建成功，并在弹窗中显示该密钥. 请务必复制并保存这把密钥，因为出于安全考虑，系统以后将不会再次展示.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

比如，你可能会获得如下 API 密钥:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 注意事项

- API 密钥的有效期取决于你申请时选择的时长。
- API 密钥的生成和校验逻辑与环境变量中的 `APP_KEY` 密切相关，请勿随意修改，否则系统中的所有 API 密钥都将失效.

## 3 测试 API 密钥的有效性

### 3.1 使用 [API 文档](https://docs-cn.nocobase.com/handbook/api-doc) 插件

打开 API 文档插件，你可以查看到每个 API 的请求方式、地址、参数以及请求头信息.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 了解基本的增删改查接口

以下是 NocoBase 提供的基本 API 示例：

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

其中，`{baseURL}` 是你的 NocoBase 系统地址，`{collectionName}` 是数据表名称。例如，当本地测试时，地址为 `localhost:13000`，表名为 `todos`，请求地址为:

```txt
http://localhost:13000/todos:list
```

### 3.3 使用 Postman 进行测试（以 List 接口举例）

打开 Postman，新建一个 GET 请求，输入上面的请求地址，并在请求头中添加 `Authorization`，值为你的 API 密钥:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
发送请求后，如果一切正常，你会收到类似如下的响应:

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

如果 API 密钥没有正确授权，你可能会看到如下错误信息:

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

遇到这种情况，请检查角色权限设置、API 密钥绑定情况以及密钥格式是否正确.

### 3.4 复制 Postman 中的请求代码

测试成功后，你可以复制 List 接口的请求代码. 比如，下面这个 curl 请求示例就是从 Postman中复制的:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 在 [iframe 区块](https://docs-cn.nocobase.com/handbook/block-iframe) 中展示待办事项

为了让大家更直观地感受 API 请求的效果，我们可以通过一个简单的 HTML 页面 来展示从 NocoBase 获取的待办事项列表. 请参考下面的示例代码:

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

上面的代码会在 iframe 区块 中展示一个简单的 “Todo List”，页面加载后，它会调用 API 获取待办记录，并将结果以格式化 JSON 的形式展示在页面上.

同时，通过下面这个动画，你可以看到整个请求的动态效果:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 总结

通过以上步骤，我们已经详细讲解了如何在 NocoBase 中创建和使用 API 密钥。从开启插件、创建数据表、绑定角色，到测试接口并在 iframe 区块中展示数据，每个步骤都至关重要. 最终，我们还通过 DeepSeek 的帮助，实现了一个简单的待办事项页面. 大家可以根据自己的需求，对代码进行适当修改和扩展.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[本示例页面的代码](https://forum.nocobase.com/t/api-api-key/3314)已在社区帖子中提供，欢迎大家参考和讨论. 希望这篇文档能为你提供清晰的指导，学习愉快，操作顺利!
