---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Parallelle Vertakking

Het knooppunt 'Parallelle Vertakking' kan een workflow verdelen in meerdere takken. Elke tak kunt u configureren met verschillende knooppunten, en de manier waarop de takken worden uitgevoerd, hangt af van de gekozen modus. Gebruik het knooppunt 'Parallelle Vertakking' in scenario's waarin u meerdere acties tegelijkertijd wilt uitvoeren.

## Installatie

Dit is een ingebouwde plugin, dus installatie is niet nodig.

## Knooppunt aanmaken

In de configuratie-interface van de workflow klikt u op de plusknop ('+') in de flow om een knooppunt 'Parallelle Vertakking' toe te voegen:

![Parallelle Vertakking toevoegen](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Nadat u een knooppunt 'Parallelle Vertakking' aan de workflow hebt toegevoegd, worden er standaard twee sub-takken toegevoegd. U kunt ook meer takken toevoegen door op de knop 'Tak toevoegen' te klikken. Elke tak kan een willekeurig aantal knooppunten bevatten. Onnodige takken kunt u verwijderen door op de verwijderknop aan het begin van de tak te klikken.

![Takken van Parallelle Vertakking beheren](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Knooppuntconfiguratie

### Takmodus

Het knooppunt 'Parallelle Vertakking' heeft de volgende drie modi:

- **Alle succesvol**: De workflow wordt pas voortgezet met de knooppunten na de takken als *alle* takken succesvol zijn uitgevoerd. Als een tak voortijdig stopt, door een fout, mislukking of een andere niet-succesvolle status, zal het gehele knooppunt 'Parallelle Vertakking' voortijdig stoppen met die status. Dit staat ook bekend als de "Alle modus".
- **Elke succesvol**: De workflow wordt voortgezet met de knooppunten na de takken zodra *één* tak succesvol is uitgevoerd. Het gehele knooppunt 'Parallelle Vertakking' stopt alleen voortijdig als *alle* takken voortijdig stoppen (door een fout, mislukking of een andere niet-succesvolle status). Dit staat ook bekend als de "Elke modus".
- **Elke succesvol of mislukt**: De workflow wordt voortgezet met de knooppunten na de takken zodra *één* tak succesvol is uitgevoerd. Echter, als *een* knooppunt in *een* tak mislukt, zal de gehele parallelle vertakking voortijdig stoppen met die status. Dit staat ook bekend als de "Race modus".

Ongeacht de modus, wordt elke tak van links naar rechts geprobeerd uit te voeren. Dit gaat door totdat aan de voorwaarden van de ingestelde takmodus is voldaan, waarna de workflow wordt voortgezet met de volgende knooppunten of voortijdig wordt afgesloten.

## Voorbeeld

Raadpleeg het voorbeeld in [Vertragingsknooppunt](./delay.md).