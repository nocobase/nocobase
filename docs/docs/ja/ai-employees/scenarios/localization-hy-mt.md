---
pkg: '@nocobase/plugin-ai'
title: 'Lina とローカル HY-MT1.5-1.8B でローカライズ項目を翻訳する'
description: 'llama-server で HY-MT1.5 GGUF 翻訳モデルをデプロイし、Lina が NocoBase のローカライズ項目を一括翻訳できるように設定します。'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Lina とローカル HY-MT1.5-1.8B でローカライズ項目を翻訳する

このガイドでは、ローカライズ翻訳の実践例として、翻訳専用の小型モデルをローカルにデプロイし、OpenAI 互換サービスとして公開し、Lina が NocoBase のローカライズ項目を一括翻訳できるように設定する方法を説明します。

この方法は、システム項目、プラグイン文言、メニュー、コレクション名、フィールドラベルなど大量の翻訳に適しています。オンラインモデルと比べて、ローカルモデルは外部 API の RPM、TPM、同時実行制限の影響を受けず、マシンとモデルの能力に合わせて同時実行数を調整できます。

## 概要

このガイドで使用するもの:

- モデル: `tencent/HY-MT1.5-1.8B-GGUF`
- 推論サービス: `llama-server`
- 連携方式: OpenAI-compatible API
- AI 従業員: Lina
- 入口: Localization Management ページ

:::info{title=注記}
HY-MT1.5-1.8B は翻訳専用の小型モデルです。短い項目、UI 文言、一括翻訳に適しています。ローカライズ用途では、汎用チャットモデルを第一候補にすることは推奨しません。
:::

## 前提条件

- **Localization Management** プラグインが有効になっている。
- 対象言語が有効になっている。
- ローカライズ項目が同期済みである。
- ローカルマシンまたはサーバーで [`llama-server`](https://github.com/ggml-org/llama.cpp) を実行できる。
- NocoBase サービスから `llama-server` の HTTP アドレスにアクセスできる。

## HY-MT GGUF をデプロイする

### llama.cpp をインストールする

macOS では Homebrew でインストールできます:

```bash
brew install llama.cpp
```

事前ビルド済みの llama.cpp バイナリを使うか、ソースからビルドすることもできます。最終的に `llama-server` が利用できれば問題ありません。

### OpenAI 互換サービスを起動する

Hugging Face の GGUF モデルでサービスを起動します:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| パラメーター | 説明 |
| --- | --- |
| `-hf` | Hugging Face からモデルを読み込みます。 |
| `--host` | 待ち受けアドレス。ローカルテストでは `127.0.0.1`、コンテナやリモートアクセスでは `0.0.0.0` を使います。 |
| `--port` | HTTP サービスポート。 |
| `-c` | コンテキスト長。ローカライズ項目は通常短いため、`2048` で十分なことが多いです。 |
| `-np` | 並列スロット数。マシン性能に応じて調整します。 |

:::info{title=ヒント}
サーバーリソースが限られる場合は `-np 1` または `-np 2` から始め、安定性を確認してから段階的に増やしてください。
:::

## モデルサービスをテストする

`llama-server` 起動後、サービスの状態を確認します:

```bash
curl http://127.0.0.1:8000/health
```

次に OpenAI 互換 API で翻訳をテストします:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

ローカルモデルファイルから起動する場合は、`model` をサービスが返す、または設定した実際のモデル名に変更してください。

:::warning{title=注記}
リクエストが長時間応答しない場合、モデルが遅すぎる、同時実行数が高すぎる、またはコンテキストが大きすぎる可能性があります。まず `-np` と NocoBase の翻訳同時実行数を下げ、応答時間を確認してください。
:::

## NocoBase で LLM サービスを設定する

`System Settings -> AI Employees -> LLM service` に移動し、LLM サービスを追加します。

| 設定 | 例 |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | `llama-server` に認証がない場合は、`dummy` などのダミー値を使用します。 |
| Enabled Models | `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` を選択するか、実際のモデル名を入力します。 |

設定後、`Test flight` でモデルを検証します。

:::info{title=ヒント}
NocoBase が Docker で動作している場合、`127.0.0.1` はコンテナ自身を指すため、ホストサービスにアクセスできないことがあります。ホスト IP、コンテナネットワークアドレス、または `host.docker.internal` を使用してください。
:::

## Lina の専用モデルを設定する

`System Settings -> AI Employees -> AI employees` に移動して Lina を開き、`Model settings` に切り替えます。

1. `Enable dedicated model configuration` を有効にします。
2. `Models` でローカル HY-MT モデルを選択します。
3. 設定を保存します。

以後、Lina はローカライズ翻訳タスクにこのモデルを使用し、汎用チャットモデルへの切り替えを避けます。

詳細は [AI 従業員モデルの設定](/ai-employees/features/model-settings) を参照してください。

## 翻訳同時実行数を設定する

ローカライズ翻訳タスクの同時実行数は `AI_LOCALIZATION_CONCURRENCY` で制御します:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

ルール:

- デフォルト: `10`
- 最小: `1`
- 最大: `20`
- 範囲外の値はデフォルトを使用

最適な同時実行数は CPU、GPU、メモリ、モデル量子化、`llama-server -np` に依存します。デフォルト値で問題が出る場合:

1. `AI_LOCALIZATION_CONCURRENCY=1` から始め、単一項目の翻訳を確認します。
2. `llama-server -np` と `AI_LOCALIZATION_CONCURRENCY` を `2` または `4` に設定します。
3. 応答時間、CPU/GPU 使用率、タスク進行状況を確認します。
4. 安定している場合のみ段階的に増やします。

:::warning{title=注記}
最初から同時実行数を高くしすぎないでください。モデルの実際の能力を超えると、キュー、タイムアウト、サービス停止によりタスクが遅くなることがあります。
:::

## ローカライズ翻訳を実行する

`System Management -> Localization Management` に移動します。

1. 対象言語に切り替えます。
2. `Synchronize` をクリックして項目が同期されていることを確認します。
3. Lina のアバターをクリックします。
4. タスク範囲を選択します:
   - `Incremental translation`: まだ翻訳がない項目を翻訳します。
   - `Selected translation`: テーブルで選択した項目を翻訳します。
   - `Full translation`: 現在の言語のすべての項目を翻訳します。
5. 確認ダイアログで項目数、プロバイダー、モデルを確認します。
6. 増分翻訳または全量翻訳を選択した場合、翻訳範囲を選択します:
   - `All`
   - `Built-in entries`: システムとプラグインの項目。
   - `Custom entries`: ルート名、コレクション名とフィールド名、UI コンテンツ。
7. 必要に応じて参照翻訳言語を調整します。増分翻訳と全量翻訳では、組み込み項目とカスタム項目の参照言語を個別に設定します。選択項目の翻訳では、汎用の参照言語設定のみ表示されます。
8. 確認して非同期タスクを作成します。
9. 完了を待ち、翻訳を確認して公開します。

増分または全量翻訳の前に、まず数件を `Selected translation` で実行し、出力スタイルと速度を確認してください。

## Lina が翻訳リクエストを構築する方法

Lina は項目と参照翻訳からリクエストを構築します。短い項目では、既存の参照を使って一貫性を高めます:

- 組み込み項目は中国語翻訳をデフォルト参照、日本語をフォールバック参照として使用します。
- カスタム項目はシステム既定言語をデフォルト参照、中国語をフォールバック参照として使用します。
- ユーザーはタスク確認ダイアログでデフォルト言語とフォールバック言語を調整できます。
- システムはまずデフォルト言語の参照翻訳を使用します。存在しない場合はフォールバック言語を試します。
- 翻訳結果は対象言語に書き込まれますが、自動公開はされません。

prompt の意味はおおよそ次のとおりです:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## トラブルシューティング

### タスク作成後に進捗がない

`llama-server` がリクエストを受け取っているか確認してください。サービスログを確認するか、`curl` で `/v1/chat/completions` を呼び出します。

モデルがリクエストを受け取っても返さない場合は、次を下げます:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### モデルが翻訳ではなく説明を返す

ローカル翻訳モデルは通常、汎用チャットモデルより安定しています。それでも説明が出る場合は、同じ prompt を `curl` でテストしてモデルの出力傾向を確認してください。短い項目から翻訳する、temperature などのサンプリングパラメーターを下げる方法もあります。

### NocoBase がモデルサービスに接続できない

確認項目:

- Base URL に `/v1` が含まれているか。
- NocoBase の実行環境からそのアドレスにアクセスできるか。
- ファイアウォールやコンテナネットワークがポートをブロックしていないか。
- `llama-server` がまだ実行中か。

## 公開前の確認

AI 翻訳完了後、公開前に確認してください:

- モジュールでフィルタし、メニュー、ボタン、フィールド名、ステータスなど短い項目を確認します。
- 変数、プレースホルダー、HTML タグ、書式記号を確認します。
- 重要な業務用語の一貫性を確認します。
- 組み込み項目の翻訳が上書きされた場合は、Localization Management で再同期し、`Reset system built-in entry translations` を選択してデフォルトを復元します。システムおよび公式プラグインのデフォルト翻訳に貢献するには、[Translation Contribution](/get-started/translations) を参照してください。
- まずテスト環境で公開し、その後本番に同期します。

## 参考

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [llama-server ドキュメント](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: ローカライズエンジニア](/ai-employees/built-in/lina)
