:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 言語リスト

NocoBaseは多言語対応（i18n）を提供しています。現在組み込まれている言語のリストは以下の通りです。
各言語設定は、**言語コード（Locale Code）** と **表示名（Label）** で構成されています。

## 言語コードの標準

* 言語コードは、**[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** 標準形式に従っています。

  ```
  language[-script][-region][-variant]
  ```

  一般的な形式は `言語-地域` で、例えば以下のようになります。

  * `en-US` → 英語（米国）
  * `fr-FR` → フランス語（フランス）
  * `zh-CN` → 簡体字中国語

* **大文字と小文字の区別**：

  * 言語部分は小文字 (`en`, `fr`, `zh`)
  * 地域部分は大文字 (`US`, `FR`, `CN`)

* 同じ言語でも複数の地域バージョンが存在する場合があります。例えば、

  * `fr-FR`（フランス語（フランス））、`fr-CA`（フランス語（カナダ））

## 組み込み言語

| 言語コード  | 表示名                 |
| ----- | -------------------- |
| ar-EG | العربية              |
| az-AZ | Azərbaycan dili      |
| bg-BG | Български            |
| bn-BD | Bengali              |
| by-BY | ベラルーシ語            |
| ca-ES | カタルーニャ語/スペイン       |
| cs-CZ | Česky                |
| da-DK | Dansk                |
| de-DE | Deutsch              |
| el-GR | ギリシャ語             |
| en-GB | English(GB)          |
| en-US | English              |
| es-ES | Español              |
| et-EE | Estonian (Eesti)     |
| fa-IR | ペルシャ語                |
| fi-FI | Suomi                |
| fr-BE | Français(BE)         |
| fr-CA | Français(CA)         |
| fr-FR | Français             |
| ga-IE | Gaeilge              |
| gl-ES | Galego               |
| he-IL | ヘブライ語                |
| hi-IN | हिन्दी               |
| hr-HR | Hrvatski jezik       |
| hu-HU | Magyar               |
| hy-AM | アルメニア語              |
| id-ID | Bahasa Indonesia     |
| is-IS | Íslenska             |
| it-IT | Italiano             |
| ja-JP | 日本語                  |
| ka-GE | グルジア語              |
| kk-KZ | Қазақ тілі           |
| km-KH | クメール語            |
| kn-IN | ಕನ್ನಡ                |
| ko-KR | 韓国語                  |
| ku-IQ | クルド語                |
| lt-LT | lietuvių             |
| lv-LV | Latviešu valoda      |
| mk-MK | マケドニア語     |
| ml-IN | മലയാളം               |
| mn-MN | モンゴル語           |
| ms-MY | بهاس ملايو           |
| nb-NO | Norsk bokmål         |
| ne-NP | नेपाली               |
| nl-BE | Vlaams               |
| nl-NL | Nederlands           |
| pl-PL | Polski               |
| pt-BR | Português brasileiro |
| pt-PT | Português            |
| ro-RO | România              |
| ru-RU | Русский              |
| si-LK | シンハラ語                |
| sk-SK | Slovenčina           |
| sl-SI | Slovenščina          |
| sr-RS | セルビア語         |
| sv-SE | Svenska              |
| ta-IN | Tamil                |
| th-TH | タイ語              |
| tk-TK | Turkmen              |
| tr-TR | Türkçe               |
| uk-UA | Українська           |
| ur-PK | ウズベク語            |
| vi-VN | ベトナム語           |
| zh-CN | 簡体字中国語                 |
| zh-HK | 繁体字中国語（香港）             |
| zh-TW | 繁体字中国語（台湾）             |

## 使用方法

* 言語設定は通常、以下の目的で使用されます。

  * **インターフェース表示**：言語切り替えメニューに `label` を表示します。
  * **国際化ファイルの読み込み**：`言語コード` に基づいて、対応する翻訳JSONファイルを読み込みます。

* 新しい言語を追加する際には、以下の点が必要です。

  1. BCP 47標準に従って言語コードを定義します。
  2. `label` として明確なローカライズされた名称を提供します。
  3. 対応する翻訳ファイルを提供します。