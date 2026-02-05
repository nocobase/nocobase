:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Filterformulier

## Introductie

Met het filterformulier kunnen gebruikers gegevens filteren door formuliervelden in te vullen. U kunt het gebruiken om tabelblokken, grafiekblokken, lijstblokken en meer te filteren.

## Hoe te gebruiken

Laten we beginnen met een eenvoudig voorbeeld om snel te begrijpen hoe u het filterformulier gebruikt. Stel dat we een tabelblok hebben met gebruikersinformatie en dat we de gegevens willen filteren met behulp van een filterformulier, zoals hieronder:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Configuratiestappen:

1. Schakel de bewerkingsmodus in en voeg een "Filterformulier"-blok en een "Tabel"-blok toe aan de pagina.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Voeg het veld "Bijnaam" toe aan zowel het tabelblok als het filterformulierblok.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. U kunt het nu gaan gebruiken.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Geavanceerd gebruik

Het filterformulierblok ondersteunt meer geavanceerde configuraties. Hier zijn enkele veelvoorkomende toepassingen.

### Meerdere blokken verbinden

Eén enkel formulierveld kan tegelijkertijd gegevens filteren over meerdere blokken. Dit doet u als volgt:

1. Klik op de configuratieoptie "Velden verbinden" voor het veld.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Voeg de doelblokken toe die u wilt verbinden. In dit voorbeeld selecteren we het lijstblok op de pagina.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Selecteer een of meer velden uit het lijstblok om te verbinden. Hier selecteren we het veld "Bijnaam".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klik op de opslaan-knop om de configuratie te voltooien. Het resultaat ziet er als volgt uit:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Grafiekblokken verbinden

Referentie: [Paginafilters en koppeling](../../../data-visualization/guide/filters-and-linkage.md)

### Aangepaste velden

Naast het selecteren van velden uit collecties, kunt u ook formuliervelden aanmaken met "Aangepaste velden". U kunt bijvoorbeeld een dropdown-selectieveld met aangepaste opties maken. Dit doet u als volgt:

1. Klik op de optie "Aangepaste velden" om het configuratiepaneel te openen.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Vul de veldtitel in, selecteer "Select" als veldmodel en configureer de opties.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nieuw toegevoegde aangepaste velden moeten handmatig worden verbonden met velden in doelblokken. Dit doet u als volgt:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuratie voltooid. Het resultaat ziet er als volgt uit:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Momenteel ondersteunde veldmodellen:

- Input: Tekstinvoer voor één regel
- Number: Numerieke invoer
- Date: Datumkiezer
- Select: Dropdown (kan worden geconfigureerd voor enkelvoudige of meervoudige selectie)
- Radio group: Keuzerondjes
- Checkbox group: Selectievakjes

### Inklappen

Voeg een inklapknop toe om de inhoud van het filterformulier in en uit te klappen, wat paginaruimte bespaart.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Ondersteunde configuraties:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Ingeklapte rijen**: Bepaalt hoeveel rijen formuliervelden worden weergegeven in de ingeklapte staat.
- **Standaard ingeklapt**: Indien ingeschakeld, wordt het filterformulier standaard in ingeklapte staat weergegeven.