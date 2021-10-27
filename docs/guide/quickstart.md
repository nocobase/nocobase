---
order: 2
toc: menu
---

# Quick Start
## 创建新的 NocoBase 项目

### 预先要求
确认你的系统内已正确安装了 [Node.js](https://nodejs.org) 。

### 步骤一：运行安装脚本

```shell
yarn create nocobase-app my-nocobase-project --quickstart
```

> 若安装时遇到网络问题，请使用[淘宝 NPM 镜像](https://npmmirror.com/)

```shell
yarn config set registry https://registry.npm.taobao.org/
```
![Screenshot 2021-10-21 at 11.18.58 AM.png](https://cdn.nlark.com/yuque/0/2021/png/104018/1634786343932-8f1363d2-3fbe-4429-827a-f9f6e923e2d3.png#clientId=u34063dfa-0722-4&from=drop&id=LQlYu&margin=%5Bobject%20Object%5D&name=Screenshot%202021-10-21%20at%2011.18.58%20AM.png&originHeight=1174&originWidth=1794&originalType=binary&ratio=1&size=820956&status=done&style=none&taskId=udca8d038-c7da-4052-ab3c-f1fec383be0)
### 步骤二：打开系统


安装脚本执行完毕之后，系统将自行启动。


使用浏览器打开 http://localhost:8000，进入系统登录页面，初始登录用户名为`admin@nocobase.com`，密码为`admin`。![Screenshot 2021-10-20 at 2.48.48 PM.png](https://cdn.nlark.com/yuque/0/2021/png/104018/1634713358667-e53afbb9-e022-491c-a8a1-5caa0790d32c.png#clientId=ubcd6255f-eb74-4&from=drop&id=sgHYg&margin=%5Bobject%20Object%5D&name=Screenshot%202021-10-20%20at%202.48.48%20PM.png&originHeight=1884&originWidth=3104&originalType=binary&ratio=1&size=584354&status=done&style=none&taskId=u546e0066-3a1e-4db6-8cf4-32a365926d0)
> 若你的服务未运行，可以在终端执行命令来启动它。

```bash
cd my-nocobase-app && yarn start
```


## 构建内容


快速启动程序创建了一个包含演示数据的 NocoBase 项目，你可以随意浏览。


我们接下来将会使用数据表配置功能创建数据库结构，之后在界面上配置区块，演示如何使用 NocoBase 管理你的数据，最后我们使用 NocoBase 提供的 Restful API 进行数据操作。


我们将要构建一个简单的内容管理系统，包含文章、标签两个模型，文章与标签为多对多关联。


### 创建数据表


首先，我们使用数据表配置功能创建数据库结构。


1. 在顶部导航栏，右侧功能区域，点击`数据表配置`图标。
1. 在弹出的窗口中，点击`创建数据表`按钮。
1. 输入数据表名称`标签`，修改数据表标识为`tags`，点击`确定`按钮。
1. 标签数据表创建完成后，会自动返回数据表配置界面，在此界面点击标签数据表的`配置字段` 。
1. 在新弹出的`配置「标签」表字段`界面中，点击`添加`按钮。在弹出的下拉选项中选择`基本类型 > 单行文本`。
1. 输入字段名称为`名称`, 字段标识为`name`。点击`确定`按钮。点击右上角的`X`图标，返回数据库表配置界面。至此`标签`模型创建完成。
1. 继续以同样的方式创建`文章`模型，数据表标识为`posts`。添加单行文本类型字段`标题`，字段标识为`title`；添加`多媒体类型 > Markdown`类型字段`内容`，字段标识为`content`。
1. 添加`关系类型 > 关联字段`，字段名称为`标签`，字段标识`tags`，要关联的数据表选项，选择先前添加的`标签`模型。勾选`允许关联多条记录`选项，点击确定。



至此，我们的数据模型创建完成，接下来我们使用界面配置功能，使我们可以使用 NocoBase 提供的界面进行数据交互。
​

[https://www.bilibili.com/video/BV1av411u7fG/](https://www.bilibili.com/video/BV1av411u7fG/)![create-tags-low.gif](https://cdn.nlark.com/yuque/0/2021/gif/104018/1635081747625-d85ad882-c614-47dc-a1c1-8e9c51b94edb.gif#clientId=u8c18188f-eb10-4&from=drop&id=uef4493c6&margin=%5Bobject%20Object%5D&name=create-tags-low.gif&originHeight=756&originWidth=1398&originalType=binary&ratio=1&size=10439567&status=done&style=none&taskId=u5d001148-ea57-47a6-83e4-83480bab14a)
### 界面配置


在顶部导航栏的右侧功能区域，点击`界面配置`图标进入界面配置功能。


1. 在顶部导航栏的左侧，将鼠标移至`添加菜单项`按钮上方，在弹出的下拉菜单中，点击`分组`。
1. 在弹出的窗口中，输入名称为`内容管理`，图标任意选择。
1. 在顶部导航栏左侧，点击新添加的`内容管理`导航，点击界面上的`添加菜单项`按钮，选择添加`页面`，页面名称输入`标签管理`，点击确认。
1. 点击新添加的`标签管理`导航，在界面中点击`创建区块`按钮，选择`表格`类型，选择数据源为`标签`。
1. 在新出现的表格模板中，继续配置表格将要展示的字段，点击`配置字段`按钮，将`名称`字段打开；点击表格模板中的`添加`按钮，配置添加标签的表格，在添加数据弹窗中，选择`配置字段`按钮，打开名称字段，点击右上角`X`图标关闭弹窗。
1. 以同样的方式继续添加`文章管理`界面，点击`添加菜单项`按钮，选择`页面`类型，输入名称为`文章管理`，点击确认，点击新生成的文章管理导航。
1. 在文章管理中，点击创建区块，选择数据源为`表格 > 文章`，配置展示字段为`标题`, `内容`和`标签`，将鼠标放置在表格`标签`栏目上方，点击`字段配置`，将标签字段修改为`名称`。
1. 点击`添加`按钮，配置创建文章表单，点击配置字段按钮，将所有字段打开。点击`标签`字段， 弹出关联数据配置界面，点击`配置字段`，打开`名称`，点击右上角`X`关闭关联数据配置弹窗。
1. 点击右上角`X`关闭表单配置弹出，再次点击顶部导航栏的右侧功能区域的`界面配置`按钮，退出界面配置。



一个可以实现基础功能的界面交互已经完成，下面我们使用它来添加一些测试数据。
[https://www.bilibili.com/video/BV1Cb4y1b75R/](https://www.bilibili.com/video/BV1Cb4y1b75R/)
### 添加数据
首先创建两个标签：点击标签管理，点击添加按钮，输入任意标签名称，点击确定；重复操作再创建一个标签。
切换到文章管理创建文章：点击添加按钮，填写标题和内容，点击标签输入框，在弹出的窗口中选择文章所关联的标签，点击确认。
### 使用API
在创建完数据模型之后，就可以通过 NocoBase 提供的 Restful API 接口进行数据操作了。
#### 列出标签
访问 [http://localhost:13001/api/tags](http://localhost:23000/api/tags)，可列出系统内的标签数据。除去自行添加的数据字段之外，NocoBase 也记录了数据的创建时间、更新时间以及创建用户、最后修改的用户，更多内容可参考 [NocoBase Restful API ](https://www.baidu.com)文档。
```json
{
  "data": [
    {
      "id": 1,
      "name": "低代码",
      "sort": 1,
      "created_at": "2021-10-24T09:23:29.901Z",
      "updated_at": "2021-10-24T09:23:29.901Z",
      "created_by_id": 1,
      "updated_by_id": 1
    },
    {
      "id": 2,
      "name": "Javascript",
      "sort": 2,
      "created_at": "2021-10-24T09:23:38.265Z",
      "updated_at": "2021-10-24T09:23:38.265Z",
      "created_by_id": 1,
      "updated_by_id": 1
    }
  ],
  "meta": {
    "count": 2,
    "page": 1,
    "per_page": 20
  }
}
```
#### 创建文章
可以通过向接口提交POST请求，来创建数据。通过指定关联字段的ID可以补充数据的关联字段信息。更多内容可参考 [NocoBase Restful API ](https://www.baidu.com)文档。
```shell
curl -X "POST" "http://127.0.0.1:13001/api/posts" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d '{"title": "NocoBase quickstart test","content": "This is content", "tags": [1]}'
```
接口将会响应新创建的数据内容。
```shell
{
  "data": {
    "id": 3,
    "title": "NocoBase quickstart test",
    "content": "This is content",
    "updated_at": "2021-10-24T12:11:59.902Z",
    "created_at": "2021-10-24T12:11:59.902Z",
    "sort": 3
  }
}
```
此时访问 NocoBase 后台的文章管理，也可以看见新创建的文章数据。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/104018/1635088837229-cca7c467-6ab2-465e-b718-6b1acf941945.png#clientId=u499255cf-7862-4&from=paste&height=560&id=u53153bbf&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1120&originWidth=2880&originalType=binary&ratio=1&size=665144&status=done&style=none&taskId=u433015ef-aa0b-4390-b829-2cd0fe6aee3&width=1440)
#### 筛选文章
Restful API 资源列表接口提供了丰富的筛选、字段控制接口，详情请查看 [NocoBase Restful API ](https://www.baidu.com)文档。在此我们通过API接口筛选出包含某个标签的文章列表。
```shell
curl "http://127.0.0.1:13001/api/posts?filter[tags][name][eq]=Javascript"
```
```shell
{
  "data": [
    {
      "id": 2,
      "title": "Hello NocoBase",
      "content": "Hello World",
      "sort": 1,
      "created_at": "2021-10-24T15:13:16.004Z",
      "updated_at": "2021-10-24T15:13:16.004Z",
      "created_by_id": 1,
      "updated_by_id": 1,
      "tags": [
        {
          "id": 4,
          "name": "Javascript",
          "sort": 2,
          "created_at": "2021-10-24T15:12:57.341Z",
          "updated_at": "2021-10-24T15:12:57.341Z",
          "created_by_id": 1,
          "updated_by_id": 1,
          "posts_tags": {
            "createdAt": "2021-10-24T15:13:16.020Z",
            "updatedAt": "2021-10-24T15:13:16.020Z",
            "tag_id": 4,
            "post_id": 2
          }
        }
      ]
    },
    {
      "id": 3,
      "title": "Javascript is Fun",
      "content": "Love Javascript",
      "sort": 2,
      "created_at": "2021-10-24T15:13:40.116Z",
      "updated_at": "2021-10-24T15:13:40.116Z",
      "created_by_id": 1,
      "updated_by_id": 1,
      "tags": [
        {
          "id": 4,
          "name": "Javascript",
          "sort": 2,
          "created_at": "2021-10-24T15:12:57.341Z",
          "updated_at": "2021-10-24T15:12:57.341Z",
          "created_by_id": 1,
          "updated_by_id": 1,
          "posts_tags": {
            "createdAt": "2021-10-24T15:13:40.130Z",
            "updatedAt": "2021-10-24T15:13:40.130Z",
            "tag_id": 4,
            "post_id": 3
          }
        }
      ]
    }
  ],
  "meta": {
    "count": 2,
    "page": 1,
    "per_page": 20
  }
}
```
## 下一步
我们已经简单体验过 NocoBase 的魅力了，通过 NocoBase 你可以快速、简单地构建一个功能完备的管理系统。 下一步，你可以进一步了解 NocoBase 的插件系统，看看如何扩展 NocoBase ，或者查阅文档的其它章节。
