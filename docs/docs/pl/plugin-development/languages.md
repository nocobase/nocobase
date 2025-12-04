:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Lista języków

NocoBase oferuje wsparcie dla wielu języków (i18n). Poniżej znajdą Państwo listę aktualnie wbudowanych języków. Każda konfiguracja językowa składa się z **kodu języka (Locale Code)** oraz **nazwy wyświetlanej (Label)**.

## Standardy kodów językowych

* Kody języków są zgodne ze standardowym formatem **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Częste formy to `język-region`, na przykład:

  * `en-US` → Angielski (Stany Zjednoczone)
  * `fr-FR` → Francuski (Francja)
  * `zh-CN` → Chiński uproszczony

* **Wielkość liter ma znaczenie**:

  * Część dotycząca języka pisana jest małymi literami (`en`, `fr`, `zh`)
  * Część dotycząca regionu pisana jest wielkimi literami (`US`, `FR`, `CN`)

* Ten sam język może mieć wiele wersji regionalnych, na przykład:

  * `fr-FR` (francuski francuski), `fr-CA` (francuski kanadyjski)

## Wbudowane języki

| Kod języka | Nazwa wyświetlana            |
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
| en-GB      | Angielski (GB)               |
| en-US      | Angielski                    |
| es-ES      | Español                      |
| et-EE      | Estoński (Eesti)             |
| fa-IR      | فارسی                       |
| fi-FI      | Suomi                        |
| fr-BE      | Francuski (BE)               |
| fr-CA      | Francuski (CA)               |
| fr-FR      | Francuski                    |
| ga-IE      | Gaeilge                      |
| gl-ES      | Galego                       |
| he-IL      | עברית                       |
| hi-IN      | हिन्दी                       |
| hr-HR      | Hrvatski jezik               |
| hu-HU      | Magyar                       |
| hy-AM      | Հայերեն                      |
| id-ID      | Bahasa Indonesia             |
| is-IS      | Íslenska                     |
| it-IT      | Italiano                     |
| ja-JP      | Japoński                     |
| ka-GE      | ქართული                      |
| kk-KZ      | Қазақ тілі                   |
| km-KH      | ភាសាខ្មែរ                   |
| kn-IN      | ಕನ್ನಡ                        |
| ko-KR      | Koreański                    |
| ku-IQ      | کوردی                       |
| lt-LT      | lietuvių                     |
| lv-LV      | Latviešu valoda              |
| mk-MK      | македонски јазик             |
| ml-IN      | മലയാളം                      |
| mn-MN      | Монгол хэл                   |
| ms-MY      | بهاس ملايو                  |
| nb-NO      | Norweski (bokmål)            |
| ne-NP      | नेपाली                       |
| nl-BE      | Flamandzki                   |
| nl-NL      | Holenderski                  |
| pl-PL      | Polski                       |
| pt-BR      | Portugalski brazylijski      |
| pt-PT      | Portugalski                  |
| ro-RO      | Rumuński                     |
| ru-RU      | Rosyjski                     |
| si-LK      | සිංහල                       |
| sk-SK      | Słowacki                     |
| sl-SI      | Słoweński                    |
| sr-RS      | Serbski                      |
| sv-SE      | Szwedzki                     |
| ta-IN      | Tamil                        |
| th-TH      | Tajski                       |
| tk-TK      | Turkmen                      |
| tr-TR      | Turecki                      |
| uk-UA      | Ukraiński                    |
| ur-PK      | Oʻzbekcha                    |
| vi-VN      | Tiếng Việt                   |
| zh-CN      | Chiński uproszczony          |
| zh-HK      | Chiński tradycyjny (Hongkong)|
| zh-TW      | Chiński tradycyjny (Tajwan)  |

## Instrukcja użytkowania

* Konfiguracje językowe są zazwyczaj używane do:

  * **Wyświetlania interfejsu**: Wyświetlanie `etykiety` w menu przełączania języków.
  * **Ładowania plików internacjonalizacji**: Ładowanie odpowiednich plików JSON z tłumaczeniami na podstawie `kodu języka`.

* Podczas dodawania nowego języka należy:

  1. Zdefiniować kod języka zgodnie ze standardem BCP 47;
  2. Podać jasną, zlokalizowaną nazwę jako `etykietę`;
  3. Dostarczyć odpowiednie pliki tłumaczeń.