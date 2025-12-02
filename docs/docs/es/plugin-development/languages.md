:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Lista de idiomas

NocoBase ofrece soporte multilingüe (i18n). A continuación, encontrará la lista de idiomas integrados actualmente. Cada configuración de idioma se compone de un **código de idioma (Locale Code)** y un **nombre de visualización (Label)**.

## Estándares de los códigos de idioma

* Los códigos de idioma siguen el formato estándar **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Las formas comunes son `idioma-región`, por ejemplo:

  * `en-US` → Inglés (Estados Unidos)
  * `fr-FR` → Francés (Francia)
  * `zh-CN` → Chino simplificado

* **Sensible a mayúsculas y minúsculas**:

  * La parte del idioma va en minúsculas (`en`, `fr`, `zh`)
  * La parte de la región va en mayúsculas (`US`, `FR`, `CN`)

* Un mismo idioma puede tener varias versiones regionales, por ejemplo:

  * `fr-FR` (francés de Francia), `fr-CA` (francés de Canadá)

## Idiomas integrados

| Código de idioma | Nombre de visualización      |
| ---------------- | ---------------------------- |
| ar-EG            | العربية                     |
| az-AZ            | Azərbaycan dili              |
| bg-BG            | Български                    |
| bn-BD            | Bengali                      |
| by-BY            | Беларускі                    |
| ca-ES            | Сatalà/Espanya               |
| cs-CZ            | Česky                        |
| da-DK            | Dansk                        |
| de-DE            | Deutsch                      |
| el-GR            | Ελληνικά                     |
| en-GB            | English(GB)                  |
| en-US            | English                      |
| es-ES            | Español                      |
| et-EE            | Estonian (Eesti)             |
| fa-IR            | فارسی                        |
| fi-FI            | Suomi                        |
| fr-BE            | Français(BE)                 |
| fr-CA            | Français(CA)                 |
| fr-FR            | Français                     |
| ga-IE            | Gaeilge                      |
| gl-ES            | Galego                       |
| he-IL            | עברית                        |
| hi-IN            | हिन्दी                       |
| hr-HR            | Hrvatski jezik               |
| hu-HU            | Magyar                       |
| hy-AM            | Հայերեն                      |
| id-ID            | Bahasa Indonesia             |
| is-IS            | Íslenska                     |
| it-IT            | Italiano                     |
| ja-JP            | 日本語                       |
| ka-GE            | ქართული                      |
| kk-KZ            | Қазақ тілі                   |
| km-KH            | ភាសាខ្មែរ                    |
| kn-IN            | ಕನ್ನಡ                        |
| ko-KR            | 한국어                       |
| ku-IQ            | کوردی                        |
| lt-LT            | lietuvių                     |
| lv-LV            | Latviešu valoda              |
| mk-MK            | македонски јазик             |
| ml-IN            | മലയാളം                       |
| mn-MN            | Монгол хэл                   |
| ms-MY            | بهاس ملايو                   |
| nb-NO            | Norsk bokmål                 |
| ne-NP            | नेपाली                       |
| nl-BE            | Vlaams                       |
| nl-NL            | Nederlands                   |
| pl-PL            | Polski                       |
| pt-BR            | Português brasileiro         |
| pt-PT            | Português                    |
| ro-RO            | România                      |
| ru-RU            | Русский                      |
| si-LK            | සිංහල                        |
| sk-SK            | Slovenčina                   |
| sl-SI            | Slovenščina                  |
| sr-RS            | српски језик                 |
| sv-SE            | Svenska                      |
| ta-IN            | Tamil                        |
| th-TH            | ภาษาไทย                      |
| tk-TK            | Turkmen                      |
| tr-TR            | Türkçe                       |
| uk-UA            | Українська                   |
| ur-PK            | Oʻzbekcha                    |
| vi-VN            | Tiếng Việt                   |
| zh-CN            | 简体中文                     |
| zh-HK            | 繁體中文（香港）             |
| zh-TW            | 繁體中文（台湾）             |

## Instrucciones de uso

* Las configuraciones de idioma se utilizan normalmente para:

  * **Visualización de la interfaz**: Mostrar el `label` en el menú de cambio de idioma.
  * **Carga de archivos de internacionalización**: Cargar los archivos JSON de traducción correspondientes según el `código de idioma`.

* Al añadir un nuevo idioma, usted necesita:

  1. Seguir el estándar BCP 47 para definir el código de idioma;
  2. Proporcionar un nombre localizado claro como `label`;
  3. Proporcionar los archivos de traducción correspondientes.