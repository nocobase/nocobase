---
pkg: '@nocobase/plugin-workflow-javascript'
---

# JavaScript 脚本

## 介绍

JavaScript 脚本节点允许用户在工作流中执行一段自定义的服务端 JavaScript 脚本。脚本中可以使用流程上游的变量作为参数，并且可以将脚本的返回值提供给下游节点使用。

脚本会在 NocoBase 应用的服务端开启一个工作线程执行，并支持 Node.js 的大部分特性，但与原生的执行环境仍有部分差异，详见 [特性列表](#特性列表)。

## 创建节点

在工作流配置界面中，点击流程中的加号（“+”）按钮，添加“JavaScript”节点：

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## 节点配置

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### 参数

用于向脚本中传入流程上下文的变量或静态值，以供脚本中的代码逻辑使用。其中 `name` 为参数名，传入脚本后即作为变量名。`value` 为参数值，可以选择变量或输入常量。

### 脚本内容

脚本内容可以看做一个函数，可以编写任意符合 Node.js 环境中支持的 JavaScript 代码，且可以使用 `return` 语句返回一个值作为节点的运行结果，以供后续节点作为变量使用。

编写代码后可以通过编辑框下方的测试按钮，打开测试执行的对话框，用静态值填入参数进行模拟执行。执行后可以在对话框中看到返回值和输出（日志）的内容。

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### 超时设置

单位以毫秒计算，当设置为 `0` 时表示不设置超时。

### 出错后继续流程

勾选后，脚本出错或者超时出错时仍然会执行后续的节点。

:::info{title="提示"}
脚本出错后将没有返回值，节点的结果会以错误信息填充。如后续节点中使用了脚本节点的结果变量，需要谨慎处理。
:::

## 特性列表

### Node.js 版本

与主应用运行的 Node.js 版本一致。

### 模块支持

在脚本中可以有限制的使用模块，与 CommonJS 一致，代码中使用 `require()` 指令引入模块。

支持 Node.js 原生模块，和 `node_modules` 中已安装的模块（含 NocoBase 已使用的依赖包）。要提供给代码使用的模块需在应用环境变量 `WORKFLOW_SCRIPT_MODULES` 中声明，多个包名以半角逗号分隔，例如：

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="提示"}
在环境变量 `WORKFLOW_SCRIPT_MODULES` 中未声明的模块，即使是 Node.js 原生的或 `node_modules` 中已安装的，也**不能**在脚本中使用。该策略可以用于在运维层管控用户可使用的模块列表，在一些场景下避免脚本权限过高。
:::

在非源码部署的环境下，如果某个模块未在 node_modules 中安装，可以将需要的包手动安装到 storage 目录中。例如需要使用 `exceljs` 包时，可以执行如下操作：

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

然后将该包基于应用 CWD（当前工作目录）的相对（或绝对路径）添加到环境变量 `WORKFLOW_SCRIPT_MODULES` 中：

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

即可在脚本中使用 `exceljs` 包（`require` 的名称需要与环境变量中定义的完全一致）：

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### 全局变量

**不支持** `global`、`process`、`__dirname` 和 `__filename` 等全局变量。

```js
console.log(global); // will throw error: "global is not defined"
```

### 传入参数

节点中配置的参数会作为脚本中的全局变量，可以直接使用。传入脚本的参数仅支持基本类型，如 `boolean`、`number`、`string`、`number`、`object` 和数组。`Date` 对象传入后会被转换为基于 ISO 格式的字符串。其他复杂类型无法直接传递，如自定义类的实例等。

### 返回值

通过 `return` 语句可以返回基本类型的数据（同参数规则）回到节点作为结果。如代码中没有调用 `return` 语句，则节点执行没有返回值。

```js
return 123;
```

### 输出（日志）

**支持**使用 `console` 输出日志。

```js
console.log('hello world!');
```

工作流执行时，脚本节点的输出也会记录到对应工作流的日志文件中。

### 异步

**支持**使用 `async` 定义异步函数，以及 `await` 调用异步函数。**支持**使用 `Promise` 全局对象。

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### 计时器

如需使用 `setTimeout`、`setInterval` 或 `setImmediate` 等方法，需要通过 Node.js 的 `timers` 包引入。

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```
