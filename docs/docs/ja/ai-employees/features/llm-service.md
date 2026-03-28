:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/ai-employees/features/llm-service)をご参照ください。
:::

# LLM サービスの設定

AI 従業員を使用する前に、まず利用可能な LLM サービスを設定する必要があります。

現在、OpenAI、Gemini、Claude、DeepSeek、Qwen、Kimi、および Ollama のローカルモデルをサポートしています。

## サービスの新規作成

`システム設定 -> AI 従業員 -> LLM サービス` に移動します。

1. `Add New` をクリックして、新規作成ダイアログを開きます。
2. `Provider` を選択します。
3. `Title`、`API Key`、`Base URL`（任意）を入力します。
4. `Enabled Models` を設定します：
   - `Recommended models`：公式の推奨モデルを使用します。
   - `Select models`：プロバイダーから返されたリストから選択します。
   - `Manual input`：モデル ID と表示名を手動で入力します。
5. `Submit` をクリックして保存します。

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## サービスの有効化と並べ替え

LLM サービスリストでは、以下の操作が可能です：

- `Enabled` スイッチを使用して、サービスの有効化/無効化を切り替えます。
- ドラッグ＆ドロップでサービスの順序を並べ替えます（モデルの表示順に影響します）。

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## 可用性テスト

サービス設定ダイアログの下部にある `Test flight` を使用して、サービスとモデルの可用性をテストします。

実際の業務で使用する前に、まずテストを行うことをお勧めします。