:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Språklista

NocoBase erbjuder stöd för flera språk (i18n). Nedan hittar ni en lista över de språk som för närvarande är inbyggda. Varje språkkonfiguration består av en **språkkod (Locale Code)** och ett **visningsnamn (Label)**.

## Standarder för språkkoder

* Språkkoder följer standardformatet **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Vanliga former är `språk-region`, till exempel:

  * `en-US` → Engelska (USA)
  * `fr-FR` → Franska (Frankrike)
  * `zh-CN` → Förenklad kinesiska

* **Skiftlägeskänsligt**:

  * Språkdelen skrivs med små bokstäver (`en`, `fr`, `zh`)
  * Regionsdelen skrivs med stora bokstäver (`US`, `FR`, `CN`)

* Samma språk kan ha flera regionala versioner, till exempel:

  * `fr-FR` (franska, Frankrike), `fr-CA` (franska, Kanada)

## Inbyggda språk

| Språkkod | Visningsnamn                 |
| -------- | ---------------------------- |
| ar-EG    | Arabiska                     |
| az-AZ    | Azerbajdzjanska              |
| bg-BG    | Bulgariska                   |
| bn-BD    | Bengali                      |
| by-BY    | Vitryska                     |
| ca-ES    | Katalanska (Spanien)         |
| cs-CZ    | Tjeckiska                    |
| da-DK    | Danska                       |
| de-DE    | Tyska                        |
| el-GR    | Grekiska                     |
| en-GB    | Engelska (Storbritannien)    |
| en-US    | Engelska                     |
| es-ES    | Spanska                      |
| et-EE    | Estniska                     |
| fa-IR    | Persiska                     |
| fi-FI    | Finska                       |
| fr-BE    | Franska (Belgien)            |
| fr-CA    | Franska (Kanada)             |
| fr-FR    | Franska                      |
| ga-IE    | Irländska                    |
| gl-ES    | Galiciska                    |
| he-IL    | Hebreiska                    |
| hi-IN    | Hindi                        |
| hr-HR    | Kroatiska                    |
| hu-HU    | Ungerska                     |
| hy-AM    | Armeniska                    |
| id-ID    | Indonesiska                  |
| is-IS    | Isländska                    |
| it-IT    | Italienska                   |
| ja-JP    | Japanska                     |
| ka-GE    | Georgiska                    |
| kk-KZ    | Kazakiska                    |
| km-KH    | Khmer                        |
| kn-IN    | Kannada                      |
| ko-KR    | Koreanska                    |
| ku-IQ    | Kurdiska                     |
| lt-LT    | Litauiska                    |
| lv-LV    | Lettiska                     |
| mk-MK    | Makedonska                   |
| ml-IN    | Malayalam                    |
| mn-MN    | Mongoliska                   |
| ms-MY    | Malaysiska                   |
| nb-NO    | Norska (bokmål)              |
| ne-NP    | Nepali                       |
| nl-BE    | Nederländska (Belgien)       |
| nl-NL    | Nederländska                 |
| pl-PL    | Polska                       |
| pt-BR    | Portugisiska (Brasilien)     |
| pt-PT    | Portugisiska                 |
| ro-RO    | Rumänska                     |
| ru-RU    | Ryska                        |
| si-LK    | Singalesiska                 |
| sk-SK    | Slovakiska                   |
| sl-SI    | Slovenska                    |
| sr-RS    | Serbiska                     |
| sv-SE    | Svenska                      |
| ta-IN    | Tamil                        |
| th-TH    | Thailändska                  |
| tk-TK    | Turkmeniska                  |
| tr-TR    | Turkiska                     |
| uk-UA    | Ukrainska                    |
| ur-PK    | Uzbekiska                    |
| vi-VN    | Vietnamesiska                |
| zh-CN    | Förenklad kinesiska          |
| zh-HK    | Traditionell kinesiska (Hongkong) |
| zh-TW    | Traditionell kinesiska (Taiwan) |

## Användningsinstruktioner

* Språkkonfigurationer används vanligtvis för:

  * **Visning i gränssnittet**: Visa `label` i menyn för språkbyte.
  * **Laddning av internationaliseringsfiler**: Ladda motsvarande JSON-filer för översättning baserat på `språkkoden`.

* När ni lägger till ett nytt språk behöver ni:

  1. Följa BCP 47-standarden för att definiera språkkoden;
  2. Tillhandahålla ett tydligt lokaliserat namn som `label`;
  3. Tillhandahålla motsvarande översättningsfiler.