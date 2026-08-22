# Список языков

NocoBase поддерживает мультиязычность (i18n). Ниже приведен список встроенных языков.
Каждая языковая конфигурация состоит из **кода локали** и **отображаемого имени**.

## Стандарты кодов языков

* Коды языков следуют стандарту **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Наиболее частая форма — `language-region`, например:

  * `en-US` → английский (США)
  * `fr-FR` → французский (Франция)
  * `zh-CN` → упрощенный китайский

* **С учетом регистра**:

  * языковая часть — в нижнем регистре (`en`, `fr`, `zh`)
  * региональная часть — в верхнем регистре (`US`, `FR`, `CN`)

* Один и тот же язык может иметь несколько региональных вариантов, например:

  * `fr-FR` (французский Франции), `fr-CA` (французский, Канада)

## Встроенные языки

| Код локали | Отображаемое имя |
| ------------------------ | -------------------------------- |
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

## Инструкции по использованию

* Языковые конфигурации обычно используются для:

  * **Отображение интерфейса**: показывать `label` в меню переключения языка.
  * **Загрузка файлов интернационализации**: загружать соответствующие JSON-файлы переводов на основе Locale Code.

* При добавлении нового языка необходимо:

  1. Следовать стандарту BCP 47 при определении Locale Code;
  2. Указать понятное локализованное имя в `label`;
  3. Подготовить соответствующие файлы переводов.