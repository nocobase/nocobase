:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ビルド

## カスタムビルド設定

カスタムビルド設定を行いたい場合は、プラグインのルートディレクトリに `build.config.ts` ファイルを作成してください。内容は以下の通りです。

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite は `src/client` 側のコードをバンドルするために使用されます。

    // Vite の設定を変更します。詳細は以下を参照してください： https://vite.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup は `src/server` 側のコードをバンドルするために使用されます。

    // tsup の設定を変更します。詳細は以下を参照してください： https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // ビルド開始前に実行されるコールバック関数です。ビルド開始前に何らかの操作を行うことができます。
  },
  afterBuild: (log: PkgLog) => {
    // ビルド完了後に実行されるコールバック関数です。ビルド完了後に何らかの操作を行うことができます。
  };
});
```