:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Lista de Idiomas

NocoBase oferece suporte a múltiplos idiomas (i18n). Abaixo, você encontra a lista dos idiomas atualmente integrados.
Cada configuração de idioma é composta por um **Código de Localidade (Locale Code)** e um **Nome de Exibição (Label)**.

## Padrões para Códigos de Idioma

* Os códigos de idioma seguem o formato padrão **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  A forma comum é `idioma-região`, por exemplo:

  * `en-US` → Inglês (Estados Unidos)
  * `fr-FR` → Francês (França)
  * `zh-CN` → Chinês Simplificado

* **Diferencia maiúsculas e minúsculas**:

  * A parte do idioma é em minúsculas (`en`, `fr`, `zh`)
  * A parte da região é em maiúsculas (`US`, `FR`, `CN`)

* O mesmo idioma pode ter várias versões regionais, por exemplo:

  * `fr-FR` (Francês da França), `fr-CA` (Francês do Canadá)

## Idiomas Integrados

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

## Instruções de Uso

* As configurações de idioma são geralmente usadas para:

  * **Exibição da Interface**: Para mostrar o `label` no menu de troca de idioma.
  * **Carregamento de Arquivos de Internacionalização**: Para carregar os arquivos JSON de tradução correspondentes com base no `Código de Localidade`.

* Ao adicionar um novo idioma, você precisa:

  1. Definir o Código de Localidade seguindo o padrão BCP 47;
  2. Fornecer um nome localizado claro como `label`;
  3. Fornecer os arquivos de tradução correspondentes.