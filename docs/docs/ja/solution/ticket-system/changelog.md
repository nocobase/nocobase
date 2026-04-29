# 更新履歴

このページでは、チケットソリューションの各バージョンの更新内容を記録しています。新しいバックアップがリリースされるたびに、このページの上部にレコードが追加されます。

---

## 2026-03-24

**バックアップファイル**：
- [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)
- [nocobase_tickets_v2_sql_260324.zip](https://static-docs.nocobase.com/nocobase_tickets_v2_sql_260324.zip)

**更新内容**：
- チケットで「完了」をクリックした際に SLA Config が見つからないエラーが発生する問題を修正しました
- すべての JS Block のテーマ対応を完了しました（ライト/ダークテーマの自動切換えに対応）
- すべての JS Block の多言語対応を完了しました（システム言語設定に連動）

---

## 2026-03-02

**バックアップファイル**：
- nocobase_tts_v2_backup_260302.nbdata
- nocobase_tts_v2_sql_260302.zip

**更新内容**：
- チケットシステム v2 初回リリース
- T 字型データアーキテクチャ：コアチケットテーブル + 業務タイプ拡張テーブル
- 4 名の AI スタッフ：Sam（インテリジェント振り分け）、Grace（カスタマーサクセス）、Max（ナレッジアシスタント）、Lexi（翻訳）
- SLA モニタリング、顧客満足度評価、ナレッジベースの自己循環
