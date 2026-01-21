:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 「create-nocobase-app」のインストールをアップグレードする

:::warning アップグレード前の準備

- 必ずデータベースをバックアップしてください。
- 実行中のNocoBaseインスタンスを停止してください。

:::

## 1. 実行中のNocoBaseインスタンスを停止する

バックグラウンドで実行されていないプロセスの場合、`Ctrl + C` で停止します。プロダクション環境では、`pm2-stop` コマンドを実行して停止してください。

```bash
yarn nocobase pm2-stop
```

## 2. アップグレードコマンドを実行する

「yarn nocobase upgrade」コマンドを実行するだけでアップグレードできます。

```bash
# 該当ディレクトリに移動します
cd my-nocobase-app
# アップグレードコマンドを実行します
yarn nocobase upgrade
# 起動します
yarn dev
```

### 特定のバージョンにアップグレードする

プロジェクトのルートディレクトリにある「package.json」ファイルを編集し、「@nocobase/cli」と「@nocobase/devtools」のバージョン番号を変更します（ダウングレードはできず、アップグレードのみ可能です）。例：

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

その後、アップグレードコマンドを実行します。

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```