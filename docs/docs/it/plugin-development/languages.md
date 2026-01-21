:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Elenco delle Lingue

NocoBase offre supporto multilingue (i18n). Di seguito trova l'elenco delle lingue attualmente integrate.
Ogni configurazione linguistica è composta da un **codice locale (Locale Code)** e un **nome visualizzato (Label)**.

## Standard per i Codici Lingua

* I codici lingua seguono il formato standard **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Le forme più comuni sono `lingua-regione`, ad esempio:

  * `en-US` → Inglese (Stati Uniti)
  * `fr-FR` → Francese (Francia)
  * `zh-CN` → Cinese Semplificato

* **Sensibile alle maiuscole/minuscole**:

  * La parte relativa alla lingua è in minuscolo (`en`, `fr`, `zh`)
  * La parte relativa alla regione è in maiuscolo (`US`, `FR`, `CN`)

* La stessa lingua può avere più versioni regionali, ad esempio:

  * `fr-FR` (Francese di Francia), `fr-CA` (Francese Canadese)

## Lingue Integrate

| Codice Locale | Nome Visualizzato    |
| ------------- | -------------------- |
| ar-EG         | العربية              |
| az-AZ         | Azərbaycan dili      |
| bg-BG         | Български            |
| bn-BD         | Bengali              |
| by-BY         | Беларускі            |
| ca-ES         | Сatalà/Espanya       |
| cs-CZ         | Česky                |
| da-DK         | Dansk                |
| de-DE         | Deutsch              |
| el-GR         | Ελληνικά             |
| en-GB         | English(GB)          |
| en-US         | English              |
| es-ES         | Español              |
| et-EE         | Estonian (Eesti)     |
| fa-IR         | فارسی                |
| fi-FI         | Suomi                |
| fr-BE         | Français(BE)         |
| fr-CA         | Français(CA)         |
| fr-FR         | Français             |
| ga-IE         | Gaeilge              |
| gl-ES         | Galego               |
| he-IL         | עברית                |
| hi-IN         | हिन्दी               |
| hr-HR         | Hrvatski jezik       |
| hu-HU         | Magyar               |
| hy-AM         | Հայերեն              |
| id-ID         | Bahasa Indonesia     |
| is-IS         | Íslenska             |
| it-IT         | Italiano             |
| ja-JP         | 日本語                  |
| ka-GE         | ქართული              |
| kk-KZ         | Қазақ тілі           |
| km-KH         | ភាសាខ្មែរ            |
| kn-IN         | ಕನ್ನಡ                |
| ko-KR         | 한국어                  |
| ku-IQ         | کوردی                |
| lt-LT         | lietuvių             |
| lv-LV         | Latviešu valoda      |
| mk-MK         | македонски јазик     |
| ml-IN         | മലയാളം               |
| mn-MN         | Монгол хэл           |
| ms-MY         | بهاس ملايو           |
| nb-NO         | Norsk bokmål         |
| ne-NP         | नेपाली               |
| nl-BE         | Vlaams               |
| nl-NL         | Nederlands           |
| pl-PL         | Polski               |
| pt-BR         | Português brasileiro |
| pt-PT         | Português            |
| ro-RO         | România              |
| ru-RU         | Русский              |
| si-LK         | සිංහල                |
| sk-SK         | Slovenčina           |
| sl-SI         | Slovenščina          |
| sr-RS         | српски језик         |
| sv-SE         | Svenska              |
| ta-IN         | Tamil                |
| th-TH         | ภาษาไทย              |
| tk-TK         | Turkmen              |
| tr-TR         | Türkçe               |
| uk-UA         | Українська           |
| ur-PK         | Oʻzbekcha            |
| vi-VN         | Tiếng Việt           |
| zh-CN         | 简体中文                 |
| zh-HK         | 繁體中文（香港）             |
| zh-TW         | 繁體中文（台湾）             |

## Istruzioni per l'Uso

* Le configurazioni linguistiche sono tipicamente utilizzate per:

  * **Visualizzazione dell'interfaccia**: per mostrare la `label` nel menu di cambio lingua.
  * **Caricamento dei file di internazionalizzazione**: per caricare i file JSON di traduzione corrispondenti in base al `codice locale`.

* Quando aggiunge una nuova lingua, deve:

  1. Seguire lo standard BCP 47 per definire il codice locale;
  2. Fornire un nome localizzato chiaro come `label`;
  3. Fornire i file di traduzione corrispondenti.