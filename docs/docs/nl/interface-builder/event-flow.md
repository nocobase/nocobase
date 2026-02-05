:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gebeurtenissenstroom

## Introductie

Als u aangepaste acties wilt activeren wanneer er wijzigingen optreden in een formulier, kunt u hiervoor een gebeurtenissenstroom gebruiken. Naast formulieren kunnen ook pagina's, blokken, knoppen en velden een gebeurtenissenstroom gebruiken om aangepaste bewerkingen te configureren.

## Hoe te gebruiken

Hieronder leggen we aan de hand van een eenvoudig voorbeeld uit hoe u een gebeurtenissenstroom configureert. We gaan een koppeling maken tussen twee tabellen, waarbij het klikken op een rij in de linker tabel automatisch de gegevens in de rechter tabel filtert.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

De configuratiestappen zijn als volgt:

1. Klik op het "bliksem"-icoon in de rechterbovenhoek van het linker tabelblok om het configuratiescherm van de gebeurtenissenstroom te openen.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klik op "Gebeurtenissenstroom toevoegen" (Add event flow), kies "Rij klikken" (Row click) als de "Triggergebeurtenis" (Trigger event). Dit betekent dat de stroom wordt geactiveerd wanneer op een tabelrij wordt geklikt.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. De "Triggerconditie" (Trigger condition) wordt gebruikt om voorwaarden in te stellen. De gebeurtenissenstroom wordt alleen geactiveerd als aan deze voorwaarden is voldaan. In dit voorbeeld hoeven we geen voorwaarden te configureren; de stroom wordt geactiveerd bij elke rijklik.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Beweeg de muis over "Stap toevoegen" (Add step) om bewerkingsstappen toe te voegen. We kiezen "Gegevensbereik instellen" (Set data scope) om het gegevensbereik voor de rechter tabel te configureren.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Kopieer de UID van de rechter tabel en plak deze in het invoerveld "Doelblok UID" (Target block UID). Hieronder verschijnt direct een conditieconfiguratiescherm, waar u het gegevensbereik voor de rechter tabel kunt instellen.
![202510092915](https://static-docs.nocobase.com/20251031092915.png)
6. Laten we een conditie configureren, zoals hieronder weergegeven:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Nadat u het gegevensbereik hebt geconfigureerd, moet u het blok vernieuwen om de gefilterde resultaten weer te geven. Laten we vervolgens het vernieuwen van het rechter tabelblok configureren. Voeg een stap "Doelblokken vernieuwen" (Refresh target blocks) toe en vul de UID van de rechter tabel in.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Klik tot slot op de opslaan-knop in de rechterbenedenhoek om de configuratie te voltooien.

## Gebeurtenistypen

### Voor renderen (Before render)

Een universele gebeurtenis die kan worden gebruikt in pagina's, blokken, knoppen of velden. Gebruik deze gebeurtenis voor initialisatietaken, zoals het configureren van verschillende gegevensbereiken op basis van verschillende voorwaarden.

### Rij klikken (Row click)

Een tabelblok-specifieke gebeurtenis. Wordt geactiveerd wanneer op een tabelrij wordt geklikt. Bij activering wordt een "Clicked row record" aan de context toegevoegd, dat als variabele kan worden gebruikt in voorwaarden en stappen.

### Formulierwaarden wijzigen (Form values change)

Een formulierblok-specifieke gebeurtenis. Wordt geactiveerd wanneer de waarden van formuliervelden wijzigen. U kunt formulierwaarden benaderen via de variabele "Current form" in voorwaarden en stappen.

### Klikken (Click)

Een knop-specifieke gebeurtenis. Wordt geactiveerd wanneer op de knop wordt geklikt.

## Stappen

### Aangepaste variabele (Custom variable)

Hiermee definieert u een aangepaste variabele die u vervolgens in de context kunt gebruiken.

#### Bereik

Aangepaste variabelen hebben een bereik. Een variabele die bijvoorbeeld is gedefinieerd in de gebeurtenissenstroom van een blok, kan alleen binnen dat specifieke blok worden gebruikt. Als u wilt dat een variabele beschikbaar is in alle blokken op de huidige pagina, moet u deze configureren in de gebeurtenissenstroom van de pagina.

#### Formuliervariabele (Form variable)

Gebruik waarden van een formulierblok als variabele. De configuratie is als volgt:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variabele titel: Variabele titel
- Variabele-ID: Variabele-ID
- Formulier UID: Formulier UID

#### Overige variabelen

Meer variabele typen zullen in de toekomst worden ondersteund. Houd onze updates in de gaten.

### Gegevensbereik instellen (Set data scope)

Stel het gegevensbereik in voor een doelblok. De configuratie is als volgt:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Doelblok UID: Doelblok UID
- Conditie: Filterconditie

### Doelblokken vernieuwen (Refresh target blocks)

Vernieuw doelblokken. U kunt meerdere blokken configureren. De configuratie is als volgt:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Doelblok UID: Doelblok UID

### Navigeren naar URL (Navigate to URL)

Navigeer naar een specifieke URL. De configuratie is als volgt:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Doel-URL, ondersteunt variabelen
- Zoekparameters: Queryparameters in de URL
- Openen in nieuw venster: Indien aangevinkt, wordt de URL in een nieuw browsertabblad geopend bij het navigeren.

### Bericht weergeven (Show message)

Toont wereldwijd feedbackberichten over bewerkingen.

#### Wanneer te gebruiken

- Biedt feedback, zoals succes-, waarschuwings- en foutmeldingen.
- Wordt bovenaan gecentreerd weergegeven en verdwijnt automatisch. Dit is een lichte manier van informeren die de gebruiker niet onderbreekt.

#### Configuratie

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Berichttype: Berichttype
- Berichtinhoud: Berichtinhoud
- Duur: Hoe lang het bericht wordt weergegeven (in seconden)

### Melding weergeven (Show notification)

Toont wereldwijd meldingen.

#### Wanneer te gebruiken

Toont meldingen in de vier hoeken van het systeem. Wordt vaak gebruikt voor de volgende situaties:

- Complexere meldingsinhoud.
- Interactieve meldingen die gebruikers de volgende stappen bieden.
- Door het systeem geïnitieerde meldingen.

#### Configuratie

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Meldingstype: Meldingstype
- Meldingstitel: Meldingstitel
- Meldingsbeschrijving: Meldingsbeschrijving
- Plaatsing: Positie, opties zijn: linksboven, rechtsboven, linksonder, rechtsonder

### JavaScript uitvoeren (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Voert JavaScript-code uit.