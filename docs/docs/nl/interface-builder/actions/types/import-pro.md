---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Import Pro

## Introductie

De Import Pro plugin biedt uitgebreide functionaliteit bovenop de standaard importfunctie.

## Installatie

Deze plugin is afhankelijk van de Asynchronous Task Management plugin. U dient de Asynchronous Task Management plugin eerst in te schakelen voordat u deze kunt gebruiken.

## Functieverbeteringen

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Ondersteunt asynchrone importbewerkingen, die in een afzonderlijke thread worden uitgevoerd en de import van grote hoeveelheden data mogelijk maken.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Ondersteunt geavanceerde importopties.

## Gebruikershandleiding

### Asynchrone import

Nadat u een import heeft gestart, wordt het importproces uitgevoerd in een afzonderlijke achtergrondthread, zonder dat u handmatig configuratie hoeft uit te voeren. In de gebruikersinterface wordt, na het starten van een importbewerking, de momenteel actieve importtaak rechtsboven weergegeven, inclusief de realtime voortgang van de taak.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Nadat de import is voltooid, kunt u de resultaten bekijken in de importtaken.

#### Over prestaties

Om de prestaties van grootschalige data-imports te evalueren, hebben we vergelijkende tests uitgevoerd onder verschillende scenario's, veldtypen en triggerconfiguraties (resultaten kunnen variëren afhankelijk van server- en databaseconfiguraties en zijn alleen ter referentie):

| Hoeveelheid data | Veldtypen | Importconfiguratie | Verwerkingstijd |
|------|---------|---------|---------|
| 1 miljoen records | Tekst, Getal, Datum, E-mail, Lange tekst | • Workflow triggeren: Nee<br>• Duplicaat identificatie: Geen | Ongeveer 1 minuut |
| 500.000 records | Tekst, Getal, Datum, E-mail, Lange tekst, Vele-op-vele | • Workflow triggeren: Nee<br>• Duplicaat identificatie: Geen | Ongeveer 16 minuten|
| 500.000 records | Tekst, Getal, Datum, E-mail, Lange tekst, Vele-op-vele, Vele-op-één | • Workflow triggeren: Nee<br>• Duplicaat identificatie: Geen | Ongeveer 22 minuten |
| 500.000 records | Tekst, Getal, Datum, E-mail, Lange tekst, Vele-op-vele, Vele-op-één | • Workflow triggeren: Asynchrone notificatie<br>• Duplicaat identificatie: Geen | Ongeveer 22 minuten |
| 500.000 records | Tekst, Getal, Datum, E-mail, Lange tekst, Vele-op-vele, Vele-op-één | • Workflow triggeren: Asynchrone notificatie<br>• Duplicaat identificatie: Duplicaten bijwerken, met 50.000 dubbele records | Ongeveer 3 uur |

Op basis van de bovenstaande prestatietestresultaten en enkele bestaande ontwerpen, volgen hier enkele verklaringen en suggesties met betrekking tot beïnvloedende factoren:

1.  **Mechanisme voor het verwerken van dubbele records**: Wanneer u de opties **Dubbele records bijwerken** of **Alleen dubbele records bijwerken** selecteert, voert het systeem rij voor rij zoek- en updatebewerkingen uit, wat de importefficiëntie aanzienlijk vermindert. Als uw Excel-bestand onnodige dubbele data bevat, zal dit de importsnelheid verder beïnvloeden. Het wordt aanbevolen om onnodige dubbele data in het Excel-bestand op te schonen (bijvoorbeeld met behulp van professionele deduplicatietools) voordat u het in het systeem importeert, om zo onnodige tijd te besparen.

2.  **Efficiëntie van de verwerking van relatievelden**: Het systeem verwerkt relatievelden door associaties rij voor rij op te vragen, wat een prestatieknelpunt kan worden bij grote hoeveelheden data. Voor eenvoudige relatiestructuren (zoals een één-op-veel-associatie tussen twee collecties) wordt een gefaseerde importstrategie aanbevolen: importeer eerst de basisdata van de hoofdcollectie en leg daarna de relatie tussen de collecties vast. Als bedrijfseisen vereisen dat relatiegegevens gelijktijdig worden geïmporteerd, raadpleeg dan de prestatietestresultaten in de bovenstaande tabel om uw importtijd redelijk te plannen.

3.  **Workflow trigger mechanisme**: Het wordt afgeraden om workflow triggers in te schakelen bij grootschalige data-importscenario's, voornamelijk om de volgende twee redenen:
    -   Zelfs wanneer de status van de importtaak 100% aangeeft, is deze nog niet onmiddellijk voltooid. Het systeem heeft nog extra tijd nodig om de uitvoeringsplannen van de workflow te creëren. Gedurende deze fase genereert het systeem voor elke geïmporteerde record een corresponderend workflow uitvoeringsplan, wat de importthread in beslag neemt, maar het gebruik van de reeds geïmporteerde data niet beïnvloedt.
    -   Nadat de importtaak volledig is voltooid, kan de gelijktijdige uitvoering van een groot aantal workflows de systeembronnen belasten, wat de algehele responssnelheid van het systeem en de gebruikerservaring beïnvloedt.

De bovenstaande 3 beïnvloedende factoren zullen in de toekomst verder worden geoptimaliseerd.

### Importconfiguratie

#### Importopties - Workflow triggeren

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

U kunt tijdens het importeren kiezen of u workflows wilt triggeren. Als deze optie is aangevinkt en de collectie is gekoppeld aan een workflow (collectie-event), zal de import de workflow-uitvoering voor elke rij triggeren.

#### Importopties - Dubbele records identificeren

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Vink deze optie aan en selecteer de corresponderende modus om dubbele records tijdens het importeren te identificeren en te verwerken.

De opties in de importconfiguratie worden als standaardwaarden toegepast. Beheerders kunnen bepalen of de uploader deze opties mag wijzigen (met uitzondering van de optie 'Workflow triggeren').

**Instellingen voor uploadrechten**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Uploader toestaan importopties te wijzigen

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Uploader verbieden importopties te wijzigen

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Modusbeschrijving

- Dubbele records overslaan: Zoekt naar bestaande records op basis van de inhoud van het "Identificatieveld". Als de record al bestaat, wordt deze rij overgeslagen; als deze niet bestaat, wordt deze als een nieuwe record geïmporteerd.
- Dubbele records bijwerken: Zoekt naar bestaande records op basis van de inhoud van het "Identificatieveld". Als de record al bestaat, wordt deze record bijgewerkt; als deze niet bestaat, wordt deze als een nieuwe record geïmporteerd.
- Alleen dubbele records bijwerken: Zoekt naar bestaande records op basis van de inhoud van het "Identificatieveld". Als de record al bestaat, wordt deze record bijgewerkt; als deze niet bestaat, wordt deze overgeslagen.

##### Identificatieveld

Het systeem identificeert of een rij een dubbele record is op basis van de waarde van dit veld.

- [Koppelingsregel](/interface-builder/actions/action-settings/linkage-rule): Knoppen dynamisch tonen/verbergen;
- [Knop bewerken](/interface-builder/actions/action-settings/edit-button): De titel, het type en het pictogram van de knop bewerken;