:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/blocks/block-settings/block-height) voor nauwkeurige informatie.
:::

# Blokhoogte

## Introductie

Blokhoogte ondersteunt drie modi: **Standaardhoogte**, **Opgegeven hoogte** en **Volledige hoogte**. De meeste blokken ondersteunen hoogte-instellingen.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Hoogtemodi

### Standaardhoogte

De strategie voor de standaardhoogte verschilt per type blok. Tabel- en formulierblokken passen hun hoogte bijvoorbeeld automatisch aan op basis van de inhoud, waardoor er geen scrollbalken binnen het blok verschijnen.

### Opgegeven hoogte

U kunt handmatig de totale hoogte van het buitenste kader van het blok opgeven. Het blok berekent en verdeelt de beschikbare interne hoogte vervolgens automatisch.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Volledige hoogte

De modus voor volledige hoogte is vergelijkbaar met de opgegeven hoogte, maar de blokhoogte wordt berekend op basis van de huidige **viewport** van de browser om de maximale schermvullende hoogte te bereiken. Er verschijnen geen scrollbalken op de browserpagina; scrollbalken verschijnen alleen binnen het blok.

De interne verwerking van scrollen in de modus voor volledige hoogte verschilt enigszins per blok:

- **Tabel**: Intern scrollen binnen `tbody`;
- **Formulier / Details**: Intern scrollen binnen de Grid (inhoud scrollt, met uitzondering van het actiegebied);
- **Lijst / Rasterkaart**: Intern scrollen binnen de Grid (inhoud scrollt, met uitzondering van het actiegebied en de pagineringsbalk);
- **Kaart / Kalender**: Volledig aanpasbare hoogte, geen scrollbalken;
- **Iframe / Markdown**: Beperkt de totale hoogte van het blokkader, waarbij scrollbalken binnen het blok verschijnen.

#### Tabel met volledige hoogte

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulier met volledige hoogte

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)