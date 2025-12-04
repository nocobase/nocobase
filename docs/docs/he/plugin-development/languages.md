:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# רשימת שפות

NocoBase מספקת תמיכה בריבוי שפות (i18n). להלן רשימת השפות המובנות כרגע. כל הגדרת שפה מורכבת מ**קוד לוקאל (Locale Code)** ו**שם תצוגה (Label)**.

## תקנים לקודי שפה

* קודי שפה עוקבים אחר פורמט התקן **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  צורות נפוצות הן `language-region`, לדוגמה:

  * `en-US` → אנגלית (ארצות הברית)
  * `fr-FR` → צרפתית (צרפת)
  * `zh-CN` → סינית מפושטת

* **רגיש לאותיות רישיות/קטנות**:

  * חלק השפה הוא באותיות קטנות (`en`, `fr`, `zh`)
  * חלק האזור הוא באותיות רישיות (`US`, `FR`, `CN`)

* לאותה שפה יכולות להיות מספר גרסאות אזוריות, לדוגמה:

  * `fr-FR` (צרפתית צרפתית), `fr-CA` (צרפתית קנדית)

## שפות מובנות

| קוד לוקאל | שם תצוגה                 |
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

## הוראות שימוש

* תצורות שפה משמשות בדרך כלל עבור:

  * **תצוגת ממשק**: הצגת ה-`label` בתפריט החלפת השפות.
  * **טעינת קבצי בינאום**: טעינת קבצי JSON מתאימים לתרגום בהתבסס על `קוד לוקאל`.

* בעת הוספת שפה חדשה, עליכם:

  1. לעקוב אחר תקן BCP 47 כדי להגדיר את קוד הלוקאל;
  2. לספק שם מקומי ברור כ-`label`;
  3. לספק קבצי תרגום מתאימים.