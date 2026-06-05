:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sprachliste

NocoBase bietet Mehrsprachigkeit (i18n) an. Hier finden Sie eine Liste der aktuell integrierten Sprachen. Jede Sprachkonfiguration besteht aus einem **Sprachcode (Locale Code)** und einem **Anzeigenamen (Label)**.

## Standards für Sprachcodes

* Sprachcodes folgen dem **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** Standardformat:

  ```
  language[-script][-region][-variant]
  ```

  Häufige Formen sind `Sprache-Region`, zum Beispiel:

  * `en-US` → Englisch (USA)
  * `fr-FR` → Französisch (Frankreich)
  * `zh-CN` → Vereinfachtes Chinesisch

* **Groß- und Kleinschreibung wird beachtet**:

  * Der Sprachanteil ist kleingeschrieben (`en`, `fr`, `zh`)
  * Der Regionsanteil ist großgeschrieben (`US`, `FR`, `CN`)

* Eine Sprache kann mehrere regionale Versionen haben, zum Beispiel:

  * `fr-FR` (Französisch, Frankreich), `fr-CA` (Französisch, Kanada)

## Integrierte Sprachen

| Sprachcode | Anzeigename                  |
| ---------- | ---------------------------- |
| ar-EG      | العربية                     |
| az-AZ      | Azərbaycan dili              |
| bg-BG      | Български                    |
| bn-BD      | Bengali                      |
| by-BY      | Беларускі                    |
| ca-ES      | Сatalà/Espanya               |
| cs-CZ      | Česky                        |
| da-DK      | Dansk                        |
| de-DE      | Deutsch                      |
| el-GR      | Ελληνικά                     |
| en-GB      | Englisch (GB)                |
| en-US      | Englisch                     |
| es-ES      | Español                      |
| et-EE      | Estonian (Eesti)             |
| fa-IR      | فارسی                        |
| fi-FI      | Suomi                        |
| fr-BE      | Französisch (BE)             |
| fr-CA      | Französisch (CA)             |
| fr-FR      | Französisch                  |
| ga-IE      | Gaeilge                      |
| gl-ES      | Galego                       |
| he-IL      | עברית                        |
| hi-IN      | हिन्दी                       |
| hr-HR      | Hrvatski jezik               |
| hu-HU      | Magyar                       |
| hy-AM      | Հայերեն                      |
| id-ID      | Bahasa Indonesia             |
| is-IS      | Íslenska                     |
| it-IT      | Italiano                     |
| ja-JP      | 日本語                       |
| ka-GE      | ქართული                      |
| kk-KZ      | Қазақ тілі                   |
| km-KH      | ភាសាខ្មែរ                    |
| kn-IN      | ಕನ್ನಡ                        |
| ko-KR      | 한국어                       |
| ku-IQ      | کوردی                        |
| lt-LT      | lietuvių                     |
| lv-LV      | Latviešu valoda              |
| mk-MK      | македонски јазик             |
| ml-IN      | മലയാളം                       |
| mn-MN      | Монгол хэл                   |
| ms-MY      | بهاس ملايو                   |
| nb-NO      | Norsk bokmål                 |
| ne-NP      | नेपाली                       |
| nl-BE      | Vlaams                       |
| nl-NL      | Nederlands                   |
| pl-PL      | Polski                       |
| pt-BR      | Brasilianisches Portugiesisch |
| pt-PT      | Portugiesisch                |
| ro-RO      | Rumänisch                    |
| ru-RU      | Русский                      |
| si-LK      | සිංහල                        |
| sk-SK      | Slovenčina                   |
| sl-SI      | Slovenščina                  |
| sr-RS      | српски језик                 |
| sv-SE      | Svenska                      |
| ta-IN      | Tamil                        |
| th-TH      | ภาษาไทย                      |
| tk-TK      | Turkmen                      |
| tr-TR      | Türkçe                       |
| uk-UA      | Українська                   |
| ur-PK      | Oʻzbekcha                    |
| vi-VN      | Tiếng Việt                   |
| zh-CN      | Vereinfachtes Chinesisch     |
| zh-HK      | Traditionelles Chinesisch (Hongkong) |
| zh-TW      | Traditionelles Chinesisch (Taiwan) |

## Hinweise zur Verwendung

* Sprachkonfigurationen werden typischerweise verwendet für:

  * **Benutzeroberfläche**: Anzeigen des `label` im Sprachwechselmenü.
  * **Laden von Internationalisierungsdateien**: Laden der entsprechenden Übersetzungs-JSON-Dateien basierend auf dem `Sprachcode`.

* Wenn Sie eine neue Sprache hinzufügen möchten, müssen Sie:

  1. Den Sprachcode gemäß dem BCP 47 Standard definieren;
  2. Einen klaren, lokalisierten Namen als `label` bereitstellen;
  3. Die entsprechenden Übersetzungsdateien bereitstellen.