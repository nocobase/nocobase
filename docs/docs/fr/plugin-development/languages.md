:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Liste des langues

NocoBase offre un support multilingue (i18n). Vous trouverez ci-dessous la liste des langues intégrées actuellement.
Chaque configuration linguistique se compose d'un **code de langue (Locale Code)** et d'un **nom d'affichage (Label)**.

## Normes des codes de langue

* Les codes de langue suivent le format standard **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** :

  ```
  language[-script][-region][-variant]
  ```

  Les formes courantes sont `langue-région`, par exemple :

  * `en-US` → Anglais (États-Unis)
  * `fr-FR` → Français (France)
  * `zh-CN` → Chinois simplifié

* **Sensible à la casse** :

  * La partie langue est en minuscules (`en`, `fr`, `zh`)
  * La partie région est en majuscules (`US`, `FR`, `CN`)

* Une même langue peut avoir plusieurs versions régionales, par exemple :

  * `fr-FR` (Français de France), `fr-CA` (Français canadien)

## Langues intégrées

| Code de langue | Nom d'affichage              |
| -------------- | ---------------------------- |
| ar-EG          | العربية                     |
| az-AZ          | Azərbaycan dili              |
| bg-BG          | Български                    |
| bn-BD          | Bengali                      |
| by-BY          | Беларускі                    |
| ca-ES          | Сatalà/Espanya               |
| cs-CZ          | Česky                        |
| da-DK          | Dansk                        |
| de-DE          | Deutsch                      |
| el-GR          | Ελληνικά                     |
| en-GB          | English(GB)                  |
| en-US          | English                      |
| es-ES          | Español                      |
| et-EE          | Estonian (Eesti)             |
| fa-IR          | فارسی                       |
| fi-FI          | Suomi                        |
| fr-BE          | Français(BE)                 |
| fr-CA          | Français(CA)                 |
| fr-FR          | Français                     |
| ga-IE          | Gaeilge                      |
| gl-ES          | Galego                       |
| he-IL          | עברית                       |
| hi-IN          | हिन्दी                      |
| hr-HR          | Hrvatski jezik               |
| hu-HU          | Magyar                       |
| hy-AM          | Հայերեն                      |
| id-ID          | Bahasa Indonesia             |
| is-IS          | Íslenska                     |
| it-IT          | Italiano                     |
| ja-JP          | 日本語                       |
| ka-GE          | ქართული                      |
| kk-KZ          | Қазақ тілі                   |
| km-KH          | ភាសាខ្មែរ                    |
| kn-IN          | ಕನ್ನಡ                        |
| ko-KR          | 한국어                       |
| ku-IQ          | کوردی                       |
| lt-LT          | lietuvių                     |
| lv-LV          | Latviešu valoda              |
| mk-MK          | македонски јазик             |
| ml-IN          | മലയാളം                      |
| mn-MN          | Монгол хэл                   |
| ms-MY          | بهاس ملايو                   |
| nb-NO          | Norsk bokmål                 |
| ne-NP          | नेपाली                      |
| nl-BE          | Vlaams                       |
| nl-NL          | Nederlands                   |
| pl-PL          | Polski                       |
| pt-BR          | Português brasileiro         |
| pt-PT          | Português                    |
| ro-RO          | România                      |
| ru-RU          | Русский                      |
| si-LK          | සිංහල                       |
| sk-SK          | Slovenčina                   |
| sl-SI          | Slovenščina                  |
| sr-RS          | српски језик                 |
| sv-SE          | Svenska                      |
| ta-IN          | Tamil                        |
| th-TH          | ภาษาไทย                      |
| tk-TK          | Turkmen                      |
| tr-TR          | Türkçe                       |
| uk-UA          | Українська                   |
| ur-PK          | Oʻzbekcha                    |
| vi-VN          | Tiếng Việt                   |
| zh-CN          | Chinois simplifié            |
| zh-HK          | Chinois traditionnel (Hong Kong) |
| zh-TW          | Chinois traditionnel (Taïwan) |

## Instructions d'utilisation

* Les configurations linguistiques sont généralement utilisées pour :

  * **Affichage de l'interface** : Afficher le `label` dans le menu de changement de langue.
  * **Chargement des fichiers d'internationalisation** : Charger les fichiers JSON de traduction correspondants en fonction du `code de langue`.

* Lorsque vous ajoutez une nouvelle langue, vous devez :

  1. Suivre la norme BCP 47 pour définir le code de langue ;
  2. Fournir un nom localisé clair comme `label` ;
  3. Fournir les fichiers de traduction correspondants.