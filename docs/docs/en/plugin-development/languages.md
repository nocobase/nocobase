# Language List

NocoBase provides multi-language support (i18n). Below is the list of currently built-in languages.
Each language configuration consists of a **Locale Code** and a **Display Name (Label)**.

## Language Code Standards

* Language codes follow the **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** standard format:

  ```
  language[-script][-region][-variant]
  ```

  Common forms are `language-region`, for example:

  * `en-US` → English (United States)
  * `fr-FR` → French (France)
  * `zh-CN` → Simplified Chinese

* **Case sensitive**:

  * Language part is lowercase (`en`, `fr`, `zh`)
  * Region part is uppercase (`US`, `FR`, `CN`)

* The same language may have multiple regional versions, for example:

  * `fr-FR` (French French), `fr-CA` (Canadian French)

## Built-in Languages

| Locale Code | Display Name                 |
| ----------- | ---------------------------- |
| ar-EG       | العربية                      |
| az-AZ       | Azərbaycan dili              |
| bg-BG       | Български                    |
| bn-BD       | Bengali                      |
| by-BY       | Беларускі                    |
| ca-ES       | Сatalà/Espanya               |
| cs-CZ       | Česky                        |
| da-DK       | Dansk                        |
| de-DE       | Deutsch                      |
| el-GR       | Ελληνικά                     |
| en-GB       | English(GB)                  |
| en-US       | English                      |
| es-ES       | Español                      |
| et-EE       | Estonian (Eesti)             |
| fa-IR       | فارسی                        |
| fi-FI       | Suomi                        |
| fr-BE       | Français(BE)                 |
| fr-CA       | Français(CA)                 |
| fr-FR       | Français                     |
| ga-IE       | Gaeilge                      |
| gl-ES       | Galego                       |
| he-IL       | עברית                        |
| hi-IN       | हिन्दी                       |
| hr-HR       | Hrvatski jezik               |
| hu-HU       | Magyar                       |
| hy-AM       | Հայերեն                      |
| id-ID       | Bahasa Indonesia             |
| is-IS       | Íslenska                     |
| it-IT       | Italiano                     |
| ja-JP       | 日本語                       |
| ka-GE       | ქართული                      |
| kk-KZ       | Қазақ тілі                   |
| km-KH       | ភាសាខ្មែរ                    |
| kn-IN       | ಕನ್ನಡ                        |
| ko-KR       | 한국어                       |
| ku-IQ       | کوردی                        |
| lt-LT       | lietuvių                     |
| lv-LV       | Latviešu valoda              |
| mk-MK       | македонски јазик             |
| ml-IN       | മലയാളം                       |
| mn-MN       | Монгол хэл                   |
| ms-MY       | بهاس ملايو                   |
| nb-NO       | Norsk bokmål                 |
| ne-NP       | नेपाली                       |
| nl-BE       | Vlaams                       |
| nl-NL       | Nederlands                   |
| pl-PL       | Polski                       |
| pt-BR       | Português brasileiro         |
| pt-PT       | Português                    |
| ro-RO       | România                      |
| ru-RU       | Русский                      |
| si-LK       | සිංහල                        |
| sk-SK       | Slovenčina                   |
| sl-SI       | Slovenščina                 |
| sr-RS       | српски језик                 |
| sv-SE       | Svenska                      |
| ta-IN       | Tamil                        |
| th-TH       | ภาษาไทย                      |
| tk-TK       | Turkmen                      |
| tr-TR       | Türkçe                       |
| uk-UA       | Українська                   |
| ur-PK       | Oʻzbekcha                    |
| vi-VN       | Tiếng Việt                   |
| zh-CN       | 简体中文                     |
| zh-HK       | 繁體中文（香港）             |
| zh-TW       | 繁體中文（台湾）             |

## Usage Instructions

* Language configurations are typically used for:

  * **Interface Display**: Display the `label` in the language switching menu.
  * **Internationalization File Loading**: Load corresponding translation JSON files based on the `Locale Code`.

* When adding a new language, you need to:

  1. Follow the BCP 47 standard to define the Locale Code;
  2. Provide a clear localized name as the `label`;
  3. Provide corresponding translation files.

