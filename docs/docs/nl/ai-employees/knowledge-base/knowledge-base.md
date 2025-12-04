:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Kennisbank

## Introductie

De kennisbank vormt de basis voor RAG-retrieval. Het organiseert documenten per categorie en bouwt een index op. Wanneer een AI-medewerker een vraag beantwoordt, zoekt deze eerst in de kennisbank naar antwoorden.

## Kennisbankbeheer

Ga naar de configuratiepagina van de AI-medewerker **plugin**, klik op het tabblad `Knowledge base` om de kennisbankbeheerpagina te openen.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klik op de knop `Add new` rechtsboven om een `Local` kennisbank toe te voegen.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Voer de benodigde informatie in voor de nieuwe kennisbank:

- Voer in het invoerveld `Name` de naam van de kennisbank in;
- Selecteer bij `File storage` de opslaglocatie voor bestanden;
- Selecteer bij `Vector store` de vectoropslag. Raadpleeg [Vectoropslag](/ai-employees/knowledge-base/vector-store);
- Voer in het invoerveld `Description` de beschrijving van de kennisbank in;

Klik op de knop `Submit` om de kennisbank aan te maken.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Kennisbankdocumentbeheer

Nadat u de kennisbank heeft aangemaakt, klikt u op de kennisbanklijstpagina op de zojuist aangemaakte kennisbank om de documentbeheerpagina van de kennisbank te openen.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Klik op de knop `Upload` om documenten te uploaden. Na het uploaden van de documenten start de vectorisatie automatisch. Wacht tot de `Status` verandert van `Pending` naar `Success`.

Momenteel ondersteunt de kennisbank de volgende documenttypen: txt, pdf, doc, docx, ppt, pptx; pdf ondersteunt alleen platte tekst.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Typen kennisbanken

### Lokale kennisbank

Een lokale kennisbank is een kennisbank die lokaal in NocoBase wordt opgeslagen. De documenten en hun vectorgegevens worden allemaal lokaal door NocoBase opgeslagen.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Alleen-lezen kennisbank

Een alleen-lezen kennisbank is een kennisbank waarvan de documenten en vectorgegevens extern worden beheerd. Alleen een vector databaseverbinding wordt in NocoBase aangemaakt (momenteel wordt alleen PGVector ondersteund).

![20251023101743](https://static-docs.nocobase.com/2025101743.png)

### Externe kennisbank

Een externe kennisbank is een kennisbank waarvan de documenten en vectorgegevens extern worden beheerd. Het ophalen van gegevens uit de vector database moet door ontwikkelaars worden uitgebreid, waardoor het gebruik van vector databases die momenteel niet door NocoBase worden ondersteund, mogelijk wordt.

![20251023101949](https://static-docs.nocobase.com/2025101949.png)