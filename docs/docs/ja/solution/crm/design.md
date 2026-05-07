:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/solution/crm/design)をご参照ください。
:::

# CRM 2.0 システム詳細設計


## 1. システム概要と設計理念

### 1.1 システムのポジショニング

本システムは、NocoBase 構成済みのノーコードプラットフォームをベースに構築された **CRM 2.0 営業管理プラットフォーム**です。主な目標は以下の通りです：

```
営業担当者がデータ入力や繰り返しの分析ではなく、顧客との関係構築に集中できるようにする
```

システムはワークフローを通じて定型業務を自動化し、AI の補助を借りてリードスコアリングや商機分析などを行うことで、営業チームの効率向上を支援します。

### 1.2 設計理念

#### 理念 1：完全なセールスファネル

**エンドツーエンドの営業プロセス：**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**なぜこのように設計するのか？**

| 従来の方法 | 統合型 CRM |
|---------|-----------|
| 段階ごとに異なるシステムを使用 | 単一システムでライフサイクル全体をカバー |
| システム間での手動データ転送 | 自動的なデータフローと変換 |
| 顧客ビューの不一致 | 統一された顧客 360 度ビュー |
| 分散したデータ分析 | エンドツーエンドのセールスパイプライン分析 |

#### 理念 2：設定可能なセールスパイプライン
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

業界ごとにセールスパイプラインのステージをカスタマイズでき、コードの修正は不要です。

#### 理念 3：モジュール化設計

- コアモジュール（顧客 + 商機）は必須、その他のモジュールは必要に応じて有効化可能
- モジュールの無効化にコードの修正は不要で、NocoBase のインターフェース設定から行えます
- 各モジュールは独立して設計されており、結合度を低く保っています

---

## 2. モジュールアーキテクチャとカスタマイズ

### 2.1 モジュールの概要

CRM システムは**モジュール化アーキテクチャ**を採用しており、各モジュールはビジネスニーズに応じて独立して有効化または無効化できます。
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 モジュールの依存関係

| モジュール | 必須か | 依存先 | 無効化の条件 |
|-----|---------|--------|---------|
| **顧客管理** | ✅ はい | - | 無効化不可（コア） |
| **商機管理** | ✅ はい | 顧客管理 | 無効化不可（コア） |
| **リード管理** | 任意 | - | リード獲得が不要な場合 |
| **見積管理** | 任意 | 商機、製品 | 正式な見積を必要としない簡易取引の場合 |
| **注文管理** | 任意 | 商機（または見積） | 注文や支払いの追跡が不要な場合 |
| **製品管理** | 任意 | - | 製品カタログが不要な場合 |
| **メール連携** | 任意 | 顧客、連絡先 | 外部メールシステムを使用する場合 |

### 2.3 プリセットバージョン

| バージョン | 含まれるモジュール | 利用シーン | コレクション数 |
|-----|---------|---------|-----------|
| **ライト版** | 顧客 + 商機 | 簡易的な取引追跡 | 6 |
| **標準版** | ライト版 + リード + 見積 + 注文 + 製品 | 完全な営業サイクル | 15 |
| **エンタープライズ版** | 標準版 + メール連携 | メールを含む全機能 | 17 |

### 2.4 モジュールとコレクションのマッピング

#### コアモジュールのコレクション（常に必須）

| コレクション | モジュール | 説明 |
|-------|------|------|
| nb_crm_customers | 顧客管理 | 顧客/会社レコード |
| nb_crm_contacts | 顧客管理 | 連絡先 |
| nb_crm_customer_shares | 顧客管理 | 顧客共有権限 |
| nb_crm_opportunities | 商機管理 | 営業商機 |
| nb_crm_opportunity_stages | 商機管理 | ステージ設定 |
| nb_crm_opportunity_users | 商機管理 | 商機共同作業者 |
| nb_crm_activities | 活動管理 | 活動記録 |
| nb_crm_comments | 活動管理 | コメント/備考 |
| nb_crm_tags | コア | 共有タグ |
| nb_cbo_currencies | 基礎データ | 通貨辞書 |
| nb_cbo_regions | 基礎データ | 国/地域辞書 |

### 2.5 モジュールの無効化方法

NocoBase 管理画面で該当モジュールのメニューエントリを非表示にするだけです。コードの修正やコレクションの削除は必要ありません。

---

## 3. コアエンティティとデータモデル

### 3.1 エンティティ関係の概要
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 コアコレクションの詳細

#### 3.2.1 リードテーブル（nb_crm_leads）

簡略化された 4 ステージのワークフローによるリード管理。

**ステージプロセス：**
```
新規 → 対応中 → 検証済み → 顧客/商機へ変換
         ↓          ↓
      不適格      不適格
```

**主要フィールド：**

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| lead_no | VARCHAR | リード番号（自動生成） |
| name | VARCHAR | 連絡先氏名 |
| company | VARCHAR | 会社名 |
| title | VARCHAR | 役職 |
| email | VARCHAR | メールアドレス |
| phone | VARCHAR | 電話番号 |
| mobile_phone | VARCHAR | 携帯電話 |
| website | TEXT | ウェブサイト |
| address | TEXT | 住所 |
| source | VARCHAR | リードソース：website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | 業界 |
| annual_revenue | VARCHAR | 年商規模 |
| number_of_employees | VARCHAR | 従業員数規模 |
| status | VARCHAR | ステータス：new/working/qualified/unqualified |
| rating | VARCHAR | 評価：hot/warm/cold |
| owner_id | BIGINT | 担当者（FK → users） |
| ai_score | INTEGER | AI 品質スコア 0-100 |
| ai_convert_prob | DECIMAL | AI 変換確率 |
| ai_best_contact_time | VARCHAR | AI 推奨連絡時間 |
| ai_tags | JSONB | AI 生成タグ |
| ai_scored_at | TIMESTAMP | AI スコアリング時間 |
| ai_next_best_action | TEXT | AI 次の最善アクション提案 |
| ai_nba_generated_at | TIMESTAMP | AI 提案生成時間 |
| is_converted | BOOLEAN | 変換済みフラグ |
| converted_at | TIMESTAMP | 変換時間 |
| converted_customer_id | BIGINT | 変換後の顧客 ID |
| converted_contact_id | BIGINT | 変換後の連絡先 ID |
| converted_opportunity_id | BIGINT | 変換後の商機 ID |
| lost_reason | TEXT | 紛失理由 |
| disqualification_reason | TEXT | 不適格理由 |
| description | TEXT | 説明 |

#### 3.2.2 顧客テーブル（nb_crm_customers）

海外取引にも対応した顧客/会社管理。

**主要フィールド：**

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| name | VARCHAR | 顧客名（必須） |
| account_number | VARCHAR | 顧客番号（自動生成、一意） |
| phone | VARCHAR | 電話番号 |
| website | TEXT | ウェブサイト |
| address | TEXT | 住所 |
| industry | VARCHAR | 業界 |
| type | VARCHAR | タイプ：prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | 従業員数規模 |
| annual_revenue | VARCHAR | 年商規模 |
| level | VARCHAR | レベル：normal/important/vip |
| status | VARCHAR | ステータス：potential/active/dormant/churned |
| country | VARCHAR | 国 |
| region_id | BIGINT | 地域（FK → nb_cbo_regions） |
| preferred_currency | VARCHAR | 推奨通貨：CNY/USD/EUR |
| owner_id | BIGINT | 担当者（FK → users） |
| parent_id | BIGINT | 親会社（FK → self） |
| source_lead_id | BIGINT | ソースリード ID |
| ai_health_score | INTEGER | AI ヘルススコア 0-100 |
| ai_health_grade | VARCHAR | AI ヘルスグレード：A/B/C/D |
| ai_churn_risk | DECIMAL | AI 離脱リスク 0-100% |
| ai_churn_risk_level | VARCHAR | AI 離脱リスクレベル：low/medium/high |
| ai_health_dimensions | JSONB | AI ヘルス各次元スコア |
| ai_recommendations | JSONB | AI 提案リスト |
| ai_health_assessed_at | TIMESTAMP | AI ヘルス評価時間 |
| ai_tags | JSONB | AI 生成タグ |
| ai_best_contact_time | VARCHAR | AI 推奨連絡時間 |
| ai_next_best_action | TEXT | AI 次の最善アクション提案 |
| ai_nba_generated_at | TIMESTAMP | AI 提案生成時間 |
| description | TEXT | 説明 |
| is_deleted | BOOLEAN | 論理削除フラグ |

#### 3.2.3 商機テーブル（nb_crm_opportunities）

設定可能なセールスパイプラインステージを採用した商機管理。

**主要フィールド：**

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| opportunity_no | VARCHAR | 商機番号（自動生成、一意） |
| name | VARCHAR | 商機名（必須） |
| amount | DECIMAL | 予想金額 |
| currency | VARCHAR | 通貨 |
| exchange_rate | DECIMAL | 為替レート |
| amount_usd | DECIMAL | 米ドル換算額 |
| customer_id | BIGINT | 顧客（FK） |
| contact_id | BIGINT | 主要連絡先（FK） |
| stage | VARCHAR | ステージコード（FK → stages.code） |
| stage_sort | INTEGER | ステージ順序（ソート用冗長フィールド） |
| stage_entered_at | TIMESTAMP | 現在のステージに入った時間 |
| days_in_stage | INTEGER | 現在のステージの滞在日数 |
| win_probability | DECIMAL | 手動成約率 |
| ai_win_probability | DECIMAL | AI 予測成約率 |
| ai_analyzed_at | TIMESTAMP | AI 分析時間 |
| ai_confidence | DECIMAL | AI 予測信頼度 |
| ai_trend | VARCHAR | AI 予測トレンド：up/stable/down |
| ai_risk_factors | JSONB | AI が特定したリスク要因 |
| ai_recommendations | JSONB | AI 提案リスト |
| ai_predicted_close | DATE | AI 予測成約日 |
| ai_next_best_action | TEXT | AI 次の最善アクション提案 |
| ai_nba_generated_at | TIMESTAMP | AI 提案生成時間 |
| expected_close_date | DATE | 完了予定日 |
| actual_close_date | DATE | 実際の完了日 |
| owner_id | BIGINT | 担当者（FK → users） |
| last_activity_at | TIMESTAMP | 最終活動時間 |
| stagnant_days | INTEGER | 無活動日数 |
| loss_reason | TEXT | 失注理由 |
| competitor_id | BIGINT | 競合他社（FK） |
| lead_source | VARCHAR | リードソース |
| campaign_id | BIGINT | キャンペーン ID |
| expected_revenue | DECIMAL | 予想収益 = amount × probability |
| description | TEXT | 説明 |

#### 3.2.4 見積テーブル（nb_crm_quotations）

多通貨と承認フローをサポートする見積管理。

**ステータスフロー：**
```
下書き → 承認待ち → 承認済み → 送付済み → 承諾/却下/期限切れ
           ↓
        却下済み → 修正 → 下書き
```

**主要フィールド：**

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| quotation_no | VARCHAR | 見積番号（自動生成、一意） |
| name | VARCHAR | 見積名 |
| version | INTEGER | バージョン番号 |
| opportunity_id | BIGINT | 商機（FK、必須） |
| customer_id | BIGINT | 顧客（FK） |
| contact_id | BIGINT | 連絡先（FK） |
| owner_id | BIGINT | 担当者（FK → users） |
| currency_id | BIGINT | 通貨（FK → nb_cbo_currencies） |
| exchange_rate | DECIMAL | 為替レート |
| subtotal | DECIMAL | 小計 |
| discount_rate | DECIMAL | 割引率 |
| discount_amount | DECIMAL | 割引額 |
| shipping_handling | DECIMAL | 送料/手数料 |
| tax_rate | DECIMAL | 税率 |
| tax_amount | DECIMAL | 税額 |
| total_amount | DECIMAL | 合計金額 |
| total_amount_usd | DECIMAL | 米ドル換算額 |
| status | VARCHAR | ステータス：draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | 提出時間 |
| approved_by | BIGINT | 承認者（FK → users） |
| approved_at | TIMESTAMP | 承認時間 |
| rejected_at | TIMESTAMP | 却下時間 |
| sent_at | TIMESTAMP | 送付時間 |
| customer_response_at | TIMESTAMP | 顧客応答時間 |
| expired_at | TIMESTAMP | 期限切れ時間 |
| valid_until | DATE | 有効期限 |
| payment_terms | TEXT | 支払条件 |
| terms_condition | TEXT | 規約条件 |
| address | TEXT | 配送先住所 |
| description | TEXT | 説明 |

#### 3.2.5 注文テーブル（nb_crm_orders）

入金追跡を含む注文管理。

**主要フィールド：**

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| order_no | VARCHAR | 注文番号（自動生成、一意） |
| customer_id | BIGINT | 顧客（FK） |
| contact_id | BIGINT | 連絡先（FK） |
| opportunity_id | BIGINT | 商機（FK） |
| quotation_id | BIGINT | 見積（FK） |
| owner_id | BIGINT | 担当者（FK → users） |
| currency | VARCHAR | 通貨 |
| exchange_rate | DECIMAL | 為替レート |
| order_amount | DECIMAL | 注文金額 |
| paid_amount | DECIMAL | 支払済金額 |
| unpaid_amount | DECIMAL | 未払金額 |
| status | VARCHAR | ステータス：pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | 支払ステータス：unpaid/partial/paid |
| order_date | DATE | 注文日 |
| delivery_date | DATE | 配送予定日 |
| actual_delivery_date | DATE | 実際の配送日 |
| shipping_address | TEXT | 配送先住所 |
| logistics_company | VARCHAR | 物流会社 |
| tracking_no | VARCHAR | 追跡番号 |
| terms_condition | TEXT | 規約条件 |
| description | TEXT | 説明 |

### 3.3 コレクション一覧

#### CRM 業務コレクション

| 番号 | コレクション名 | 説明 | タイプ |
|-----|------|------|------|
| 1 | nb_crm_leads | リード管理 | 業務 |
| 2 | nb_crm_customers | 顧客/会社 | 業務 |
| 3 | nb_crm_contacts | 連絡先 | 業務 |
| 4 | nb_crm_opportunities | 営業商機 | 業務 |
| 5 | nb_crm_opportunity_stages | ステージ設定 | 設定 |
| 6 | nb_crm_opportunity_users | 商機共同作業者（営業チーム） | 関連 |
| 7 | nb_crm_quotations | 見積書 | 業務 |
| 8 | nb_crm_quotation_items | 見積明細 | 業務 |
| 9 | nb_crm_quotation_approvals | 承認記録 | 業務 |
| 10 | nb_crm_orders | 注文 | 業務 |
| 11 | nb_crm_order_items | 注文明細 | 業務 |
| 12 | nb_crm_payments | 入金記録 | 業務 |
| 13 | nb_crm_products | 製品カタログ | 業務 |
| 14 | nb_crm_product_categories | 製品カテゴリ | 設定 |
| 15 | nb_crm_price_tiers | 段階的価格設定 | 設定 |
| 16 | nb_crm_activities | 活動記録 | 業務 |
| 17 | nb_crm_comments | コメント/備考 | 業務 |
| 18 | nb_crm_competitors | 競合他社 | 業務 |
| 19 | nb_crm_tags | タグ | 設定 |
| 20 | nb_crm_lead_tags | リード-タグ関連 | 関連 |
| 21 | nb_crm_contact_tags | 連絡先-タグ関連 | 関連 |
| 22 | nb_crm_customer_shares | 顧客共有権限 | 関連 |
| 23 | nb_crm_exchange_rates | 為替レート履歴 | 設定 |

#### 基礎データコレクション（共通モジュール）

| 番号 | コレクション名 | 説明 | タイプ |
|-----|------|------|------|
| 1 | nb_cbo_currencies | 通貨辞書 | 設定 |
| 2 | nb_cbo_regions | 国/地域辞書 | 設定 |

### 3.4 補助テーブル

#### 3.4.1 コメントテーブル（nb_crm_comments）

多様な業務オブジェクトに関連付け可能な汎用コメント/備考テーブル。

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| content | TEXT | コメント内容 |
| lead_id | BIGINT | 関連リード（FK） |
| customer_id | BIGINT | 関連顧客（FK） |
| opportunity_id | BIGINT | 関連商機（FK） |
| order_id | BIGINT | 関連注文（FK） |

#### 3.4.2 顧客共有テーブル（nb_crm_customer_shares）

顧客の複数人での共同作業と権限共有を実現します。

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| customer_id | BIGINT | 顧客（FK、必須） |
| shared_with_user_id | BIGINT | 共有先ユーザー（FK、必須） |
| shared_by_user_id | BIGINT | 共有実行者（FK） |
| permission_level | VARCHAR | 権限レベル：read/write/full |
| shared_at | TIMESTAMP | 共有時間 |

#### 3.4.3 商機共同作業者テーブル（nb_crm_opportunity_users）

商機の営業チームによる共同作業をサポートします。

| フィールド | タイプ | 説明 |
|-----|------|------|
| opportunity_id | BIGINT | 商機（FK、複合主キー） |
| user_id | BIGINT | ユーザー（FK、複合主キー） |
| role | VARCHAR | ロール：owner/collaborator/viewer |

#### 3.4.4 地域テーブル（nb_cbo_regions）

国/地域の基礎データ辞書。

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| code_alpha2 | VARCHAR | ISO 3166-1 2文字コード（一意） |
| code_alpha3 | VARCHAR | ISO 3166-1 3文字コード（一意） |
| code_numeric | VARCHAR | ISO 3166-1 数字コード |
| name | VARCHAR | 国/地域名 |
| is_active | BOOLEAN | 有効か |
| sort_order | INTEGER | ソート順 |

---

## 4. リードのライフサイクル

リード管理は簡略化された 4 ステージのワークフローを採用しています。新規リード作成時にワークフローを通じて AI スコアリングを自動実行し、営業担当者が高品質なリードを迅速に特定できるよう支援します。

### 4.1 ステータスの定義

| ステータス | 名称 | 説明 |
|-----|------|------|
| new | 新規 | 作成直後、連絡待ち |
| working | 対応中 | 積極的にフォローアップ中 |
| qualified | 検証済み | 変換の準備完了 |
| unqualified | 不適格 | 適合しない |

### 4.2 ステータスフロー図

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 リード変換プロセス

変換インターフェースでは 3 つのオプションを同時に提供し、ユーザーは作成または関連付けを選択できます：

- **顧客**：新規顧客を作成、または既存顧客に関連付け
- **連絡先**：新規連絡先を作成（顧客に関連付け）
- **商機**：商機の作成は必須
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**変換後の記録：**
- `converted_customer_id`：関連付けられた顧客 ID
- `converted_contact_id`：関連付けられた連絡先 ID
- `converted_opportunity_id`：作成された商機 ID

---

## 5. 商機のライフサイクル

商機管理は設定可能なセールスパイプラインステージを採用しています。商機のステージ変更時に AI 成約率予測を自動実行し、営業担当者がリスクとチャンスを特定できるよう支援します。

### 5.1 設定可能なステージ

ステージは `nb_crm_opportunity_stages` テーブルに保存され、カスタマイズ可能です：

| コード | 名称 | 順序 | デフォルト成約率 |
|-----|------|------|---------|
| prospecting | 初期アプローチ | 1 | 10% |
| analysis | ニーズ分析 | 2 | 30% |
| proposal | 提案/見積提示 | 3 | 60% |
| negotiation | 商談/交渉 | 4 | 80% |
| won | 受注完了 | 5 | 100% |
| lost | 失注 | 6 | 0% |

### 5.2 パイプラインフロー
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 停滞検知

活動のない商機にはフラグが立てられます：

| 無活動日数 | アクション |
|-----------|------|
| 7 日 | 黄色の警告 |
| 14 日 | 担当者へオレンジ色の通知 |
| 30 日 | マネージャーへ赤色の通知 |

```sql
-- 停滞日数の計算
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 受注/失注処理

**受注時：**
1. ステージを 'won' に更新
2. 実際の完了日を記録
3. 顧客ステータスを 'active' に更新
4. 注文作成をトリガー（見積が承諾されている場合）

**失注時：**
1. ステージを 'lost' に更新
2. 失注理由を記録
3. 競合他社 ID を記録（競合に負けた場合）
4. マネージャーに通知

---

## 6. 見積のライフサイクル

### 6.1 ステータスの定義

| ステータス | 名称 | 説明 |
|-----|------|------|
| draft | 下書き | 準備中 |
| pending_approval | 承認待ち | 承認を待機中 |
| approved | 承認済み | 送付可能 |
| sent | 送付済み | 顧客に送付済み |
| accepted | 承諾 | 顧客が承諾 |
| rejected | 却下 | 顧客が拒否 |
| expired | 期限切れ | 有効期限を過ぎた |

### 6.2 承認ルール（検討中）

承認フローは以下の条件に基づいてトリガーされます：

| 条件 | 承認レベル |
|------|---------|
| 割引率 > 10% | 営業マネージャー |
| 割引率 > 20% | 営業部長 |
| 金額 > $100K | 財務 + 総支配人 |

### 6.3 多通貨対応

#### 設計理念

すべてのレポートと分析において **米ドル（USD）を統一基準通貨** として使用します。各金額レコードには以下を保存します：
- 元の通貨と金額（顧客に提示するもの）
- 取引時の為替レート
- 米ドル換算額（内部比較用）

#### 通貨辞書テーブル（nb_cbo_currencies）

通貨設定は共通基礎データテーブルを使用し、動的な管理をサポートします。`current_rate` フィールドは現在の為替レートを保持し、定期タスクによって `nb_crm_exchange_rates` の最新レコードから更新されます。

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| code | VARCHAR | 通貨コード（一意）：USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | 通貨名 |
| symbol | VARCHAR | 通貨記号 |
| decimal_places | INTEGER | 小数点以下桁数 |
| current_rate | DECIMAL | 現在の対米ドルレート（履歴から同期） |
| is_active | BOOLEAN | 有効か |
| sort_order | INTEGER | ソート順 |

#### 為替レート履歴テーブル（nb_crm_exchange_rates）

過去の為替レートデータを記録します。定期タスクが最新レートを `nb_cbo_currencies.current_rate` に同期します。

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| currency_code | VARCHAR | 通貨コード（CNY/EUR/GBP/JPY） |
| rate_to_usd | DECIMAL(10,6) | 対米ドルレート |
| effective_date | DATE | 発効日 |
| source | VARCHAR | レートソース：manual/api |
| createdAt | TIMESTAMP | 作成時間 |

> **説明**：見積書は `currency_id` 外鍵を通じて `nb_cbo_currencies` テーブルに関連付けられ、為替レートは `current_rate` フィールドから直接取得されます。商機と注文は `currency` VARCHAR フィールドを使用して通貨コードを保存します。

#### 金額フィールドのパターン

金額を含むテーブルはこのパターンに従います：

| フィールド | タイプ | 説明 |
|-----|------|------|
| currency | VARCHAR | 取引通貨 |
| amount | DECIMAL | 元通貨金額 |
| exchange_rate | DECIMAL | 取引時の対米ドルレート |
| amount_usd | DECIMAL | 米ドル換算額（計算値） |

**適用対象：**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### ワークフロー連携
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**為替レート取得ロジック：**
1. 業務操作時に `nb_cbo_currencies.current_rate` からレートを直接取得
2. 米ドル取引：レート = 1.0、検索不要
3. `current_rate` は定期タスクにより `nb_crm_exchange_rates` の最新レコードから同期

### 6.4 バージョン管理

見積が却下または期限切れになった場合、新しいバージョンとしてコピーできます：

```
QT-20260119-001 v1 → 却下済み
QT-20260119-001 v2 → 送付済み
QT-20260119-001 v3 → 承諾
```

---

## 7. 注文のライフサイクル

### 7.1 注文の概要

注文は見積が承諾されたときに作成され、確定したビジネス上の約束を表します。
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 注文ステータスの定義

| ステータス | コード | 説明 | 許可される操作 |
|-----|------|------|---------|
| 下書き | `draft` | 注文作成済み、未確定 | 編集、確定、キャンセル |
| 確認済み | `confirmed` | 注文確定、履行待ち | 履行開始、キャンセル |
| 処理中 | `in_progress` | 注文処理/生産中 | 進捗更新、出荷、キャンセル（承認要） |
| 出荷済み | `shipped` | 製品を顧客に出荷済み | 配送完了マーク |
| 配送済み | `delivered` | 顧客が商品を受領済み | 注文完了 |
| 完了 | `completed` | 注文が完全に完了 | なし |
| キャンセル | `cancelled` | 注文キャンセル済み | なし |

### 7.3 注文データモデル

#### nb_crm_orders

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| order_no | VARCHAR | 注文番号（自動生成、一意） |
| customer_id | BIGINT | 顧客（FK） |
| contact_id | BIGINT | 連絡先（FK） |
| opportunity_id | BIGINT | 商機（FK） |
| quotation_id | BIGINT | 見積（FK） |
| owner_id | BIGINT | 担当者（FK → users） |
| status | VARCHAR | 注文ステータス |
| payment_status | VARCHAR | 支払ステータス：unpaid/partial/paid |
| order_date | DATE | 注文日 |
| delivery_date | DATE | 配送予定日 |
| actual_delivery_date | DATE | 実際の配送日 |
| currency | VARCHAR | 注文通貨 |
| exchange_rate | DECIMAL | 対米ドルレート |
| order_amount | DECIMAL | 注文総額 |
| paid_amount | DECIMAL | 支払済金額 |
| unpaid_amount | DECIMAL | 未払金額 |
| shipping_address | TEXT | 配送先住所 |
| logistics_company | VARCHAR | 物流会社 |
| tracking_no | VARCHAR | 追跡番号 |
| terms_condition | TEXT | 規約条件 |
| description | TEXT | 説明 |

#### nb_crm_order_items

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| order_id | FK | 親注文 |
| product_id | FK | 製品参照 |
| product_name | VARCHAR | 製品名スナップショット |
| quantity | INT | 注文数量 |
| unit_price | DECIMAL | 単価 |
| discount_percent | DECIMAL | 割引率 |
| line_total | DECIMAL | 行合計 |
| notes | TEXT | 行備考 |

### 7.4 入金追跡

#### nb_crm_payments

| フィールド | タイプ | 説明 |
|-----|------|------|
| id | BIGINT | 主キー |
| order_id | BIGINT | 関連注文（FK、必須） |
| customer_id | BIGINT | 顧客（FK） |
| payment_no | VARCHAR | 入金番号（自動生成、一意） |
| amount | DECIMAL | 入金額（必須） |
| currency | VARCHAR | 入金通貨 |
| payment_method | VARCHAR | 支払方法：transfer/check/cash/credit_card/lc |
| payment_date | DATE | 入金日 |
| bank_account | VARCHAR | 銀行口座番号 |
| bank_name | VARCHAR | 銀行名 |
| notes | TEXT | 入金備考 |

---

## 8. 顧客のライフサイクル

### 8.1 顧客の概要

顧客はリード変換時または商機受注時に作成されます。システムは獲得から推奨者（アドボケイト）までのライフサイクル全体を追跡します。
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 顧客ステータスの定義

| ステータス | コード | 健全性 | 説明 |
|-----|------|--------|------|
| 潜在 | `prospect` | なし | 変換されたリード、注文なし |
| アクティブ | `active` | ≥70 | 支払い済み顧客、良好な交流 |
| 成長中 | `growing` | ≥80 | 拡大の機会がある顧客 |
| リスクあり | `at_risk` | <50 | 離脱の兆候がある顧客 |
| 離脱 | `churned` | なし | 活動がなくなった顧客 |
| 再獲得 | `win_back` | なし | 再活性化中の元顧客 |
| 推奨者 | `advocate` | ≥90 | 高い満足度、紹介を提供 |

### 8.3 顧客健全性スコアリング

複数の要因に基づいて顧客健全性を計算します：

| 要因 | 重み | 指標 |
|-----|------|---------|
| 購入の最新性 | 25% | 最終注文からの日数 |
| 購入頻度 | 20% | 期間あたりの注文数 |
| 金銭的価値 | 20% | 総注文額と平均注文額 |
| エンゲージメント | 15% | メールの開封率、会議への参加 |
| サポート健全性 | 10% | チケット数と解決率 |
| 製品の使用状況 | 10% | アクティブ使用指標（該当する場合） |

**健全性しきい値：**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 顧客セグメンテーション

#### 自動セグメンテーション

| セグメント | 条件 | 推奨アクション |
|-----|------|---------|
| VIP | LTV > $100K | 特別な個別対応、役員によるサポート |
| エンタープライズ | 会社規模 > 500人 | 専任アカウントマネージャー |
| 中堅企業 | 会社規模 50-500人 | 定期的なフォロー、標準化されたサポート |
| スタートアップ | 会社規模 < 50人 | セルフサービスリソース、コミュニティ |
| 休眠 | 90日以上活動なし | 再活性化マーケティング |

---

## 9. メール連携

### 9.1 概要

NocoBase は Gmail と Outlook をサポートする組み込みのメール連携プラグインを提供しています。メールがシステムに同期されると、ワークフローを通じて AI がメールの感情や意図を自動分析し、営業担当者が顧客の態度を迅速に把握できるよう支援します。

### 9.2 メールの同期

**サポートされているプロバイダー：**
- Gmail（OAuth 2.0 経由）
- Outlook/Microsoft 365（OAuth 2.0 経由）

**同期動作：**
- 送受信メールの双方向同期
- メールの CRM レコード（リード、連絡先、商機）への自動関連付け
- 添付ファイルは NocoBase ファイルシステムに保存

### 9.3 メール-CRM 関連付け (検討中)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 メールテンプレート

営業担当者はプリセットされたテンプレートを使用できます：

| テンプレートカテゴリ | 例 |
|---------|------|
| 初回アプローチ | コールドメール、紹介、イベントフォローアップ |
| フォローアップ | 会議後、提案後、無反応へのリマインド |
| 見積 | 見積書送付、見積修正、期限間近の通知 |
| 注文 | 注文確認、出荷通知、配送完了確認 |
| カスタマーサクセス | 歓迎、定期確認、レビュー依頼 |

---

## 10. AI 補助機能

### 10.1 AI 社員チーム

CRM システムは NocoBase AI プラグインを統合し、以下の組み込み AI 社員を CRM シナリオ専用のタスクで活用します：

| ID | 名前 | 組み込みの役割 | CRM 拡張能力 |
|----|------|---------|-------------|
| viz | Viz | データ分析担当 | 営業データ分析、パイプライン予測 |
| dara | Dara | チャート専門家 | データ可視化、レポート作成、ダッシュボード設計 |
| ellis | Ellis | エディター | メール返信案作成、やり取りの要約、ビジネスメール作成 |
| lexi | Lexi | 翻訳担当 | 多言語顧客対応、コンテンツ翻訳 |
| orin | Orin | オーガナイザー | 日々の優先順位付け、次のアクション提案、フォロー計画 |

### 10.2 AI タスクリスト

AI 機能は、相互に独立した 2 つのカテゴリに分かれます：

#### 1. AI 社員（フロントエンドブロックからトリガー）

ユーザーはフロントエンドの AI 社員ブロックを通じて AI と直接対話し、分析や提案を取得します。

| 社員 | タスク | 説明 |
|------|------|------|
| Viz | 営業データ分析 | パイプラインのトレンド、変換率の分析 |
| Viz | パイプライン予測 | 重み付けされたパイプラインに基づく収益予測 |
| Dara | チャート生成 | 営業レポート用チャートの生成 |
| Dara | ダッシュボード設計 | データダッシュボードのレイアウト設計 |
| Ellis | 返信案作成 | プロフェッショナルなメール返信の生成 |
| Ellis | やり取りの要約 | メールスレッドの要約 |
| Ellis | ビジネスメール作成 | 会議依頼、フォローアップ、お礼メールなど |
| Orin | 日々の優先順位 | その日の優先タスクリストの生成 |
| Orin | 次のアクション提案 | 各商機に対する次のアクションの推奨 |
| Lexi | コンテンツ翻訳 | マーケティング資料、提案書、メールの翻訳 |

#### 2. ワークフロー LLM ノード（バックエンドで自動実行）

ワークフロー内に組み込まれた LLM ノードで、テーブルイベント、操作イベント、定期タスクなどによって自動的にトリガーされます。AI 社員とは無関係に動作します。

| タスク | トリガー方法 | 説明 | 書き込みフィールド |
|------|---------|------|---------|
| リードスコアリング | テーブルイベント（作成/更新） | リードの品質を評価 | ai_score, ai_convert_prob |
| 成約率予測 | テーブルイベント（ステージ変更） | 商機の成功可能性を予測 | ai_win_probability, ai_risk_factors |

> **説明**：ワークフロー LLM ノードはプロンプトと Schema 出力を使用して構造化された JSON を生成し、解析後に業務データフィールドへ書き込みます。ユーザーの介入は不要です。

### 10.3 データベース内の AI フィールド

| テーブル | AI フィールド | 説明 |
|----|--------|------|
| nb_crm_leads | ai_score | AI スコア 0-100 |
| | ai_convert_prob | 変換確率 |
| | ai_best_contact_time | 最善の連絡時間 |
| | ai_tags | AI 生成タグ (JSONB) |
| | ai_scored_at | スコアリング時間 |
| | ai_next_best_action | 次の最善アクション提案 |
| | ai_nba_generated_at | 提案生成時間 |
| nb_crm_opportunities | ai_win_probability | AI 予測成約率 |
| | ai_analyzed_at | 分析時間 |
| | ai_confidence | 予測信頼度 |
| | ai_trend | トレンド：up/stable/down |
| | ai_risk_factors | リスク要因 (JSONB) |
| | ai_recommendations | 提案リスト (JSONB) |
| | ai_predicted_close | 予測成約日 |
| | ai_next_best_action | 次の最善アクション提案 |
| | ai_nba_generated_at | 提案生成時間 |
| nb_crm_customers | ai_health_score | 健全性スコア 0-100 |
| | ai_health_grade | 健全性グレード：A/B/C/D |
| | ai_churn_risk | 離脱リスク 0-100% |
| | ai_churn_risk_level | 離脱リスクレベル：low/medium/high |
| | ai_health_dimensions | 各次元のスコア (JSONB) |
| | ai_recommendations | 提案リスト (JSONB) |
| | ai_health_assessed_at | 健全性評価時間 |
| | ai_tags | AI 生成タグ (JSONB) |
| | ai_best_contact_time | 最善の連絡時間 |
| | ai_next_best_action | 次の最善アクション提案 |
| | ai_nba_generated_at | 提案生成時間 |

---

## 11. ワークフローエンジン

### 11.1 実装済みワークフロー

| ワークフロー名 | トリガータイプ | ステータス | 説明 |
|-----------|---------|------|------|
| Leads Created | テーブルイベント | 有効 | リード作成時にトリガー |
| CRM Overall Analytics | AI 社員イベント | 有効 | CRM 全体のデータ分析 |
| Lead Conversion | 操作後イベント | 有効 | リード変換プロセス |
| Lead Assignment | テーブルイベント | 有効 | リードの自動割り当て |
| Lead Scoring | テーブルイベント | 無効 | リードスコアリング（検討中） |
| Follow-up Reminder | 定期タスク | 無効 | フォローアップリマインド（検討中） |

### 11.2 未実装ワークフロー

| ワークフロー | トリガータイプ | 説明 |
|-------|---------|------|
| 商機ステージ推進 | テーブルイベント | ステージ変更時に成約率を更新、時間を記録 |
| 商機停滞検知 | 定期タスク | 無活動の商機を検出し、通知を送信 |
| 見積承認 | 操作後イベント | 多段階承認フロー |
| 注文生成 | 操作後イベント | 見積承諾後に注文を自動生成 |

---

## 12. メニューとインターフェース設計

### 12.1 管理画面の構造

| メニュー | タイプ | 説明 |
|------|------|------|
| **Dashboards** | グループ | ダッシュボード |
| - Dashboard | ページ | デフォルトダッシュボード |
| - SalesManager | ページ | 営業マネージャービュー |
| - SalesRep | ページ | 営業担当者ビュー |
| - Executive | ページ | 経営層ビュー |
| **Leads** | ページ | リード管理 |
| **Customers** | ページ | 顧客管理 |
| **Opportunities** | ページ | 商機管理 |
| - Table | タブ | 商機リスト |
| **Products** | ページ | 製品管理 |
| - Categories | タブ | 製品カテゴリ |
| **Orders** | ページ | 注文管理 |
| **Settings** | グループ | 設定 |
| - Stage Settings | ページ | 商機ステージ設定 |
| - Exchange Rate | ページ | 為替レート設定 |
| - Activity | ページ | 活動記録 |
| - Emails | ページ | メール管理 |
| - Contacts | ページ | 連絡先管理 |
| - Data Analysis | ページ | データ分析 |

### 12.2 ダッシュボードビュー

#### 営業マネージャービュー

| コンポーネント | タイプ | データ |
|-----|------|------|
| パイプライン価値 | KPI カード | ステージごとのパイプライン総額 |
| チームランキング | テーブル | 担当者別の実績ランキング |
| リスクアラート | アラートリスト | 高リスクな商機 |
| 成約率トレンド | 折れ線グラフ | 月次成約率 |
| 停滞案件 | リスト | 注意が必要な案件 |

#### 営業担当者ビュー

| コンポーネント | タイプ | データ |
|-----|------|------|
| ノルマ進捗 | 進捗バー | 月次実績 vs ノルマ |
| 未処理の商機 | KPI カード | 自分の未処理商機数 |
| 今週の完了予定 | リスト | 間もなく完了する案件 |
| 期限切れ活動 | アラート | 期限を過ぎたタスク |
| クイックアクション | ボタン | 活動記録、商機作成 |

#### 経営層ビュー

| コンポーネント | タイプ | データ |
|-----|------|------|
| 年間収益 | KPI カード | 年初来収益 |
| パイプライン価値 | KPI カード | パイプライン総額 |
| 成約率 | KPI カード | 全体の成約率 |
| 顧客健全性 | 分布図 | 健全性スコアの分布 |
| 予測 | チャート | 月次収益予測 |


---

*ドキュメントバージョン: v2.0 | 更新日: 2026-02-06*