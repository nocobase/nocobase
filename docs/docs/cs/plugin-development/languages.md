:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Seznam jazyků

NocoBase nabízí vícejazyčnou podporu (i18n). Níže naleznete seznam aktuálně vestavěných jazyků.
Každá konfigurace jazyka se skládá z **kódu lokality (Locale Code)** a **zobrazovaného názvu (Label)**.

## Standardy pro kódy jazyků

* Kódy jazyků se řídí standardním formátem **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Běžnou formou je `jazyk-oblast`, například:

  * `en-US` → Angličtina (Spojené státy)
  * `fr-FR` → Francouzština (Francie)
  * `zh-CN` → Zjednodušená čínština

* **Rozlišování velkých a malých písmen**:

  * Jazyková část je malými písmeny (`en`, `fr`, `zh`)
  * Regionální část je velkými písmeny (`US`, `FR`, `CN`)

* Stejný jazyk může mít více regionálních verzí, například:

  * `fr-FR` (francouzština – Francie), `fr-CA` (francouzština – Kanada)

## Vestavěné jazyky

| Locale Code | Zobrazovaný název            |
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
| sl-SI       | Slovenščina                  |
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

## Pokyny k použití

* Konfigurace jazyka se obvykle používají pro:

  * **Zobrazení rozhraní**: Zobrazení `label` v nabídce pro přepínání jazyků.
  * **Načítání internacionalizačních souborů**: Načítání odpovídajících JSON souborů s překlady na základě `kódu lokality`.

* Při přidávání nového jazyka je potřeba:

  1. Dodržet standard BCP 47 pro definování kódu lokality;
  2. Poskytnout jasný lokalizovaný název jako `label`;
  3. Poskytnout odpovídající soubory s překlady.