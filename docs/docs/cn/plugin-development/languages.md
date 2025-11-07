# 语言列表

NocoBase 提供了多语言支持（i18n），以下为当前内置的语言列表。
每个语言配置由 **语言代码（Locale Code）** 和 **显示名称（Label）** 组成。

## 语言代码规范

* 语言代码采用 **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** 标准格式：

  ```
  language[-script][-region][-variant]
  ```

  常见形式为 `语言-地区`，例如：

  * `en-US` → 英语（美国）
  * `fr-FR` → 法语（法国）
  * `zh-CN` → 简体中文

* **区分大小写**：

  * 语言部分小写 (`en`, `fr`, `zh`)
  * 地区部分大写 (`US`, `FR`, `CN`)

* 同一语言可能有多个地区版本，例如：

  * `fr-FR`（法国法语）、`fr-CA`（加拿大法语）

## 内置语言

| 语言代码  | 显示名称                 |
| ----- | -------------------- |
| ar-EG | العربية              |
| az-AZ | Azərbaycan dili      |
| bg-BG | Български            |
| bn-BD | Bengali              |
| by-BY | Беларускі            |
| ca-ES | Сatalà/Espanya       |
| cs-CZ | Česky                |
| da-DK | Dansk                |
| de-DE | Deutsch              |
| el-GR | Ελληνικά             |
| en-GB | English(GB)          |
| en-US | English              |
| es-ES | Español              |
| et-EE | Estonian (Eesti)     |
| fa-IR | فارسی                |
| fi-FI | Suomi                |
| fr-BE | Français(BE)         |
| fr-CA | Français(CA)         |
| fr-FR | Français             |
| ga-IE | Gaeilge              |
| gl-ES | Galego               |
| he-IL | עברית                |
| hi-IN | हिन्दी               |
| hr-HR | Hrvatski jezik       |
| hu-HU | Magyar               |
| hy-AM | Հայերեն              |
| id-ID | Bahasa Indonesia     |
| is-IS | Íslenska             |
| it-IT | Italiano             |
| ja-JP | 日本語                  |
| ka-GE | ქართული              |
| kk-KZ | Қазақ тілі           |
| km-KH | ភាសាខ្មែរ            |
| kn-IN | ಕನ್ನಡ                |
| ko-KR | 한국어                  |
| ku-IQ | کوردی                |
| lt-LT | lietuvių             |
| lv-LV | Latviešu valoda      |
| mk-MK | македонски јазик     |
| ml-IN | മലയാളം               |
| mn-MN | Монгол хэл           |
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
| si-LK | සිංහල                |
| sk-SK | Slovenčina           |
| sl-SI | Slovenščina          |
| sr-RS | српски језик         |
| sv-SE | Svenska              |
| ta-IN | Tamil                |
| th-TH | ภาษาไทย              |
| tk-TK | Turkmen              |
| tr-TR | Türkçe               |
| uk-UA | Українська           |
| ur-PK | Oʻzbekcha            |
| vi-VN | Tiếng Việt           |
| zh-CN | 简体中文                 |
| zh-HK | 繁體中文（香港）             |
| zh-TW | 繁體中文（台湾）             |

## 使用说明

* 语言配置通常用于：

  * **界面显示**：在语言切换菜单中展示 `label`。
  * **国际化文件加载**：根据 `语言代码` 加载对应的翻译 JSON 文件。

* 添加新语言时需要：

  1. 遵循 BCP 47 标准定义语言代码；
  2. 提供清晰的本地化名称作为 `label`；
  3. 提供对应的翻译文件。
