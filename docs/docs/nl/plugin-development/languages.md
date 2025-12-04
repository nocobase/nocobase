:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Lijst met talen

NocoBase biedt meertalige ondersteuning (i18n). Hieronder vindt u een lijst van de momenteel ingebouwde talen.
Elke taalconfiguratie bestaat uit een **landinstellingcode (Locale Code)** en een **weergavenaam (Label)**.

## Standaarden voor landinstellingcodes

* Landinstellingcodes volgen de standaardindeling van **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Veelvoorkomende vormen zijn `taal-regio`, bijvoorbeeld:

  * `en-US` → Engels (Verenigde Staten)
  * `fr-FR` → Frans (Frankrijk)
  * `zh-CN` → Vereenvoudigd Chinees

* **Hoofdlettergevoelig**:

  * Het taalgedeelte is in kleine letters (`en`, `fr`, `zh`)
  * Het regiogedeelte is in hoofdletters (`US`, `FR`, `CN`)

* Dezelfde taal kan meerdere regionale versies hebben, bijvoorbeeld:

  * `fr-FR` (Frans Frankrijk), `fr-CA` (Canadees Frans)

## Ingebouwde talen

| Landinstellingcode | Weergavenaam                 |
| ----- | -------------------- |
| ar-EG | Arabisch             |
| az-AZ | Azerbeidzjaans       |
| bg-BG | Bulgaars             |
| bn-BD | Bengaals             |
| by-BY | Wit-Russisch         |
| ca-ES | Catalaans/Spanje     |
| cs-CZ | Tsjechisch           |
| da-DK | Deens                |
| de-DE | Duits                |
| el-GR | Grieks               |
| en-GB | Engels (GB)          |
| en-US | Engels               |
| es-ES | Spaans               |
| et-EE | Ests (Eesti)         |
| fa-IR | Perzisch             |
| fi-FI | Fins                 |
| fr-BE | Frans (BE)           |
| fr-CA | Frans (CA)           |
| fr-FR | Frans                |
| ga-IE | Iers                 |
| gl-ES | Galicisch            |
| he-IL | Hebreeuws            |
| hi-IN | Hindi                |
| hr-HR | Kroatisch            |
| hu-HU | Hongaars             |
| hy-AM | Armeens              |
| id-ID | Indonesisch          |
| is-IS | IJslands             |
| it-IT | Italiaans            |
| ja-JP | Japans               |
| ka-GE | Georgisch            |
| kk-KZ | Kazachs              |
| km-KH | Khmer                |
| kn-IN | Kannada              |
| ko-KR | Koreaans             |
| ku-IQ | Koerdisch            |
| lt-LT | Litouws              |
| lv-LV | Lets                 |
| mk-MK | Macedonisch          |
| ml-IN | Malayalam            |
| mn-MN | Mongools             |
| ms-MY | Maleis               |
| nb-NO | Noors Bokmål         |
| ne-NP | Nepalees             |
| nl-BE | Vlaams               |
| nl-NL | Nederlands           |
| pl-PL | Pools                |
| pt-BR | Braziliaans Portugees |
| pt-PT | Portugees            |
| ro-RO | Roemeens             |
| ru-RU | Russisch             |
| si-LK | Singalees            |
| sk-SK | Slowaaks             |
| sl-SI | Sloveens             |
| sr-RS | Servisch             |
| sv-SE | Zweeds               |
| ta-IN | Tamil                |
| th-TH | Thai                 |
| tk-TK | Turkmeens            |
| tr-TR | Turks                |
| uk-UA | Oekraïens            |
| ur-PK | Oezbeeks             |
| vi-VN | Vietnamees           |
| zh-CN | Vereenvoudigd Chinees |
| zh-HK | Traditioneel Chinees (Hongkong) |
| zh-TW | Traditioneel Chinees (Taiwan) |

## Gebruiksaanwijzing

* Taalconfiguraties worden doorgaans gebruikt voor:

  * **Interfaceweergave**: Om de `label` weer te geven in het taalwisselmenu.
  * **Laden van internationalisatiebestanden**: Om de bijbehorende vertaalde JSON-bestanden te laden op basis van de `landinstellingcode`.

* Wanneer u een nieuwe taal toevoegt, moet u het volgende doen:

  1. De BCP 47-standaard volgen om de landinstellingcode te definiëren;
  2. Een duidelijke gelokaliseerde naam opgeven als `label`;
  3. De bijbehorende vertaalbestanden aanleveren.