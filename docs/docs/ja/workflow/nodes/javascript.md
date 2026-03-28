:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/workflow/nodes/javascript)をご参照ください。
:::

pkg: '@nocobase/plugin-workflow-javascript'
---

# JavaScript スクリプト

## 紹介

JavaScript スクリプトノードを使用すると、ユーザーはワークフロー内でカスタムのサーバーサイド JavaScript スクリプトを実行できます。スクリプトでは、ワークフローの上流の変数をパラメーターとして使用でき、スクリプトの戻り値を下流のノードに提供して使用できます。

スクリプトは NocoBase アプリケーションのサーバーサイドでワーカースレッドを起動して実行され、Node.js のほとんどの機能をサポートしていますが、ネイティブの実行環境とは一部異なります。詳細は [特性リスト](#特性リスト) を参照してください。

## ノードの作成

ワークフロー設定インターフェースで、フロー内のプラス（「+」）ボタンをクリックし、「JavaScript」ノードを追加します。

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## ノードの設定

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### パラメーター

スクリプト内のコードロジックで使用するために、ワークフローコンテキストの変数や静的な値をスクリプトに渡すために使用します。そのうち `name` はパラメーター名で、スクリプトに渡された後は変数名として使用されます。`value` はパラメーター値で、変数を選択するか定数を入力できます。

### スクリプト内容

スクリプト内容は一つの関数と見なすことができ、Node.js 環境でサポートされている任意の JavaScript コードを記述できます。また、`return` 文を使用してノードの実行結果として値を返し、後続のノードで変数として使用できます。

コードを記述した後、エディタの下にあるテストボタンをクリックしてテスト実行のダイアログを開き、静的な値をパラメーターに入力してシミュレーション実行を行うことができます。実行後、ダイアログで戻り値と出力（ログ）の内容を確認できます。

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### タイムアウト設定

単位はミリ秒で、`0` に設定するとタイムアウトを設定しないことを意味します。

### エラー発生後にフローを継続

チェックを入れると、スクリプトのエラーやタイムアウトエラーが発生しても、後続のノードが実行されます。

:::info{title="ヒント"}
スクリプトがエラーになった後は戻り値がなく、ノードの結果はエラーメッセージで埋められます。後続のノードでスクリプトノードの結果変数を使用する場合は、慎重に処理する必要があります。
:::

## 特性リスト

### Node.js バージョン

メインアプリケーションが実行されている Node.js バージョンと同じです。

### モジュールのサポート

スクリプト内では制限付きでモジュールを使用でき、CommonJS と同様に、コード内で `require()` 命令を使用してモジュールをインポートします。

Node.js ネイティブモジュール、および `node_modules` にインストールされているモジュール（NocoBase が既に使用している依存パッケージを含む）をサポートしています。コードで使用できるようにするモジュールは、アプリケーションの環境変数 `WORKFLOW_SCRIPT_MODULES` で宣言する必要があり、複数のパッケージ名は半角カンマで区切ります。例：

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="ヒント"}
環境変数 `WORKFLOW_SCRIPT_MODULES` で宣言されていないモジュールは、Node.js ネイティブのものや `node_modules` にインストールされているものであっても、スクリプト内で使用することは**できません**。このポリシーは、運用管理層でユーザーが使用できるモジュールリストを制御するために使用でき、一部のシナリオでスクリプトの権限が過剰になるのを防ぐことができます。
:::

ソースコードデプロイではない環境で、特定のモジュールが node_modules にインストールされていない場合、必要なパッケージを storage ディレクトリに手動でインストールできます。例えば、`exceljs` パッケージを使用する必要がある場合は、以下の操作を実行します。

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

その後、アプリケーションの CWD（現在の作業ディレクトリ）を基準とした相対パス（または絶対パス）で、そのパッケージを環境変数 `WORKFLOW_SCRIPT_MODULES` に追加します。

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

これで、スクリプト内で `exceljs` パッケージを使用できるようになります（`require` の名称は環境変数で定義されたものと完全に一致させる必要があります）：

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### グローバル変数

`global`、`process`、`__dirname`、`__filename` などのグローバル変数は**サポートされていません**。

```js
console.log(global); // will throw error: "global is not defined"
```

### パラメーターの入力

ノードで設定されたパラメーターはスクリプト内のグローバル変数として扱われ、直接使用できます。スクリプトに渡されるパラメーターは、`boolean`、`number`、`string`、`object`、配列などの基本型のみをサポートしています。`Date` オブジェクトは渡された後、ISO 形式の文字列に変換されます。カスタムクラスのインスタンスなど、その他の複雑な型は直接渡すことができません。

### 戻り値

`return` 文を使用すると、基本型のデータ（パラメーターのルールと同様）をノードの結果として返すことができます。コード内で `return` 文が呼び出されない場合、ノードの実行に戻り値はありません。

```js
return 123;
```

### 出力（ログ）

`console` を使用したログ出力を**サポートしています**。

```js
console.log('hello world!');
```

ワークフローの実行時、スクリプトノードの出力も対応するワークフローのログファイルに記録されます。

### 非同期

`async` を使用した非同期関数の定義、および `await` を使用した非同期関数の呼び出しを**サポートしています**。`Promise` グローバルオブジェクトの使用を**サポートしています**。

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### タイマー

`setTimeout`、`setInterval`、`setImmediate` などのメソッドを使用する必要がある場合は、Node.js の `timers` パッケージを介してインポートする必要があります。

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```