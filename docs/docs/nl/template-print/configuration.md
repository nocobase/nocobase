:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Configuratie

### Sjabloonprinten activeren
Sjabloonprinten ondersteunt momenteel detailblokken en tabelblokken. Hieronder beschrijven we hoe u deze twee typen blokken configureert.

#### Detailblokken

1.  **Detailblok openen**:
    -   Ga in de applicatie naar het detailblok waar u de sjabloonprintfunctie wilt gebruiken.

2.  **Configuratiemenu openen**:
    -   Klik bovenaan de interface op het menu "Configuratie-operatie".

3.  **"Sjabloonprinten" selecteren**:
    -   Klik in het dropdownmenu op de optie "Sjabloonprinten" om de plugin te activeren.

![Sjabloonprinten activeren](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Sjablonen configureren

1.  **Naar de sjabloonconfiguratiepagina gaan**:
    -   Selecteer in het configuratiemenu van de knop "Sjabloonprinten" de optie "Sjabloonconfiguratie".

![Sjabloonconfiguratie-optie](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Nieuw sjabloon toevoegen**:
    -   Klik op de knop "Sjabloon toevoegen" om naar de pagina voor het toevoegen van sjablonen te gaan.

![Knop Sjabloon toevoegen](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Sjabloongegevens invullen**:
    -   Vul in het sjabloonformulier de sjabloonnaam in en selecteer het sjabloontype (Word, Excel, PowerPoint).
    -   Upload het bijbehorende sjabloonbestand (ondersteunt `.docx`-, `.xlsx`- en `.pptx`-indelingen).

![Sjabloonnaam en -bestand configureren](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Sjabloon bewerken en opslaan**:
    -   Ga naar de pagina "Veldlijst", kopieer velden en vul deze in het sjabloon in.
    ![Veldlijst](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Nadat u de gegevens hebt ingevuld, klikt u op de knop "Opslaan" om het sjabloon toe te voegen.

5.  **Sjabloonbeheer**:
    -   Klik op de knop "Gebruiken" aan de rechterkant van de sjabloonlijst om het sjabloon te activeren.
    -   Klik op de knop "Bewerken" om de sjabloonnaam te wijzigen of het sjabloonbestand te vervangen.
    -   Klik op de knop "Downloaden" om het geconfigureerde sjabloonbestand te downloaden.
    -   Klik op de knop "Verwijderen" om overbodige sjablonen te verwijderen. Het systeem vraagt om bevestiging om onbedoeld verwijderen te voorkomen.
    ![Sjabloonbeheer](https://static-docs.nocobase.com/20250107140436.png)

#### Tabelblokken

Het gebruik van tabelblokken is in principe hetzelfde als dat van detailblokken, met de volgende verschillen:

1.  **Ondersteuning voor het printen van meerdere records**: U moet eerst de records selecteren die u wilt printen door ze aan te vinken. U kunt maximaal 100 records tegelijk printen.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Gescheiden sjabloonbeheer**: Sjablonen voor tabelblokken en detailblokken zijn niet uitwisselbaar — dit komt doordat de datastructuren verschillen (het ene is een object, het andere is een array).