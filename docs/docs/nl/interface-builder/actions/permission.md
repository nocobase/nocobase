:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Actiebevoegdheden

## Introductie

In NocoBase 2.0 worden actiebevoegdheden momenteel voornamelijk beheerd via collectie-resourcebevoegdheden:

- **Collectie-resourcebevoegdheid**: Hiermee beheert u uniform de basisactiebevoegdheden (zoals aanmaken, bekijken, bijwerken en verwijderen) voor verschillende rollen binnen een `collectie`. Deze bevoegdheid is van toepassing op de gehele `collectie` onder de `gegevensbron`. Dit zorgt ervoor dat de bijbehorende actiebevoegdheden van een rol voor die `collectie` consistent blijven, ongeacht de pagina, pop-up of het blok waarin de actie wordt uitgevoerd.

### Collectie-resourcebevoegdheid

Binnen het NocoBase-bevoegdhedensysteem zijn `collectie`-actiebevoegdheden in principe onderverdeeld volgens de CRUD-dimensies (Create, Read, Update, Delete). Dit garandeert consistentie en standaardisatie in het beheer van bevoegdheden. Bijvoorbeeld:

- **Aanmaakbevoegdheid (Create)**: Hiermee beheert u alle aanmaakgerelateerde acties voor de `collectie`, inclusief toevoegen, dupliceren, enzovoort. Zodra een rol de aanmaakbevoegdheid voor deze `collectie` heeft, zijn de acties voor toevoegen, dupliceren en andere aanmaakgerelateerde acties zichtbaar op alle pagina's en in alle pop-ups.
- **Verwijderbevoegdheid (Delete)**: Hiermee beheert u de verwijderactie voor deze `collectie`. De bevoegdheid blijft consistent, of het nu gaat om een bulkverwijderactie in een tabelblok of een verwijderactie voor een enkel record in een detailblok.
- **Bijwerkbevoegdheid (Update)**: Hiermee beheert u bijwerkgerelateerde acties voor deze `collectie`, zoals bewerkingsacties en acties voor het bijwerken van records.
- **Bekijkbevoegdheid (View)**: Hiermee beheert u de zichtbaarheid van gegevens in deze `collectie`. Gerelateerde gegevensblokken (tabel, lijst, details, enz.) zijn alleen zichtbaar wanneer de rol de bekijkbevoegdheid voor deze `collectie` heeft.

Deze universele methode voor bevoegdhedenbeheer is geschikt voor gestandaardiseerde controle van `gegevensbevoegdheden`. Het zorgt ervoor dat voor dezelfde `collectie` en dezelfde actie `consistente` bevoegdheidsregels gelden, ongeacht de `pagina`, `pop-up` of het `blok`. Dit bevordert uniformiteit en onderhoudbaarheid.

#### Globale bevoegdheden

Globale actiebevoegdheden zijn van toepassing op alle `collecties` onder de `gegevensbron` en zijn als volgt ingedeeld per resourcetype:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Specifieke `collectie`-actiebevoegdheden

Specifieke `collectie`-actiebevoegdheden overschrijven de algemene bevoegdheden van de `gegevensbron`. Ze verfijnen de actiebevoegdheden verder en maken aangepaste bevoegdheidsconfiguraties mogelijk voor toegang tot resources van een specifieke `collectie`. Deze bevoegdheden zijn verdeeld in twee aspecten:

1.  Actiebevoegdheden: Deze omvatten acties voor toevoegen, bekijken, bewerken, verwijderen, exporteren en importeren. Deze bevoegdheden configureert u op basis van de dimensie van de gegevensbereik:
    -   Alle records: Hiermee kunnen gebruikers acties uitvoeren op alle records in de `collectie`.
    -   Eigen records: Beperkt gebruikers tot het uitvoeren van acties alleen op de records die zij zelf hebben aangemaakt.

2.  Veldbevoegdheden: Veldbevoegdheden maken het mogelijk om voor elk veld bevoegdheden te configureren voor verschillende acties. Zo kunt u bijvoorbeeld bepaalde velden configureren als alleen-lezen, zodat ze niet bewerkbaar zijn.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Gerelateerde documentatie

[Bevoegdheden configureren]