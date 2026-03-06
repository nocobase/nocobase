:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/blocks/filter-blocks/form) voor nauwkeurige informatie.
:::

# Filterformulier

## Introductie

Het filterformulier stelt gebruikers in staat om gegevens te filteren door formuliervelden in te vullen. Het kan worden gebruikt om tabelblokken, grafiekblokken, lijstblokken, enz. te filteren.

## Hoe te gebruiken

Laten we eerst via een eenvoudig voorbeeld snel begrijpen hoe u het filterformulier gebruikt. Stel dat we een tabelblok hebben met gebruikersinformatie en dat we de gegevens willen filteren via een filterformulier. Zoals hieronder:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

De configuratiestappen zijn als volgt:

1. Schakel de configuratiemodus in, voeg een "Filterformulier"-blok en een "Tabelblok" toe aan de pagina.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Voeg het veld "Bijnaam" toe aan het tabelblok en het filterformulierblok.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Nu is het klaar voor gebruik.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Geavanceerd gebruik

Het filterformulierblok ondersteunt meer geavanceerde configuraties. Hieronder volgen enkele veelvoorkomende toepassingen.

### Meerdere blokken koppelen

Eén enkel formulierveld kan tegelijkertijd gegevens van meerdere blokken filteren. De specifieke handelingen zijn als volgt:

1. Klik op de configuratieoptie "Connect fields" van het veld.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Voeg de doelblokken toe die moeten worden gekoppeld; hier selecteren we het lijstblok op de pagina.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Selecteer een of meer velden in het lijstblok om te koppelen. Hier selecteren we het veld "Bijnaam".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klik op de knop Opslaan om de configuratie te voltooien. Het effect is als volgt:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Grafiekblokken koppelen

Referentie: [Paginafilters en koppeling](../../../data-visualization/guide/filters-and-linkage.md)

### Aangepaste velden

Naast het selecteren van velden uit de collectie, kunt u ook formuliervelden maken via "Aangepaste velden". U kunt bijvoorbeeld een dropdown-veld maken en de opties aanpassen. De specifieke handelingen zijn als volgt:

1. Klik op de optie "Aangepaste velden" om de configuratie-interface te openen.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Vul de veldtitel in, kies "Selecteren" bij "Veldtype" en configureer de opties.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nieuw toegevoegde aangepaste velden moeten handmatig worden gekoppeld aan de velden van het doelblok. De methode is als volgt:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuratie voltooid, het effect is als volgt:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Momenteel ondersteunde veldtypen zijn:

- Tekstvak
- Getal
- Datum
- Selecteren
- Keuzerondje
- Selectievakje
- Relatie

#### Relatie (Aangepast relatieveld)

"Relatie" is geschikt voor scenario's zoals "filteren op records uit een gekoppelde tabel". Bijvoorbeeld in een orderlijst filteren op "Klant", of in een takenlijst filteren op "Verantwoordelijke".

Uitleg van configuratie-items:

- **Doelcollectie**: Geeft aan uit welke collectie de selecteerbare records moeten worden geladen.
- **Titelveld**: Gebruikt voor de weergavetekst in de dropdown-opties en geselecteerde tags (zoals naam, titel).
- **Waardeveld**: Gebruikt voor de daadwerkelijk ingediende waarde bij het filteren, meestal het primaire sleutelveld (zoals `id`).
- **Meervoudige selectie toestaan**: Indien ingeschakeld, kunnen meerdere records tegelijk worden geselecteerd.
- **Operator**: Definieert hoe de filtervoorwaarden overeenkomen (zie "Operator" hieronder).

Aanbevolen configuratie:

1. Kies voor het `Titelveld` een goed leesbaar veld (zoals "Naam") om te voorkomen dat het gebruik van pure ID's de bruikbaarheid beïnvloedt.
2. Geef bij het `Waardeveld` de voorkeur aan het primaire sleutelveld om een stabiele en unieke filtering te garanderen.
3. Schakel bij enkelvoudige selectie meestal `Meervoudige selectie toestaan` uit, en schakel het in bij meervoudige selectie in combinatie met een geschikte `Operator`.

#### Operator

`Operator` wordt gebruikt om de matchingsrelatie tussen de "waarde van het filterformulierveld" en de "waarde van het doelblokveld" te definiëren.

### Inklappen

Voeg een inklapknop toe om de inhoud van het filterformulier in en uit te klappen, wat paginaruimte bespaart.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Ondersteunt de volgende configuraties:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Aantal weergegeven rijen bij inklappen**: Stelt het aantal rijen met formuliervelden in dat in de ingeklapte staat wordt getoond.
- **Standaard ingeklapt**: Indien ingeschakeld, wordt het filterformulier standaard in ingeklapte staat weergegeven.