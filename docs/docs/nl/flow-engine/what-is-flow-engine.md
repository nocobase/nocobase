:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Wat is FlowEngine?

FlowEngine is een nieuwe front-end no-code/low-code ontwikkelingsengine, geïntroduceerd in NocoBase 2.0. Het combineert Models en Flows om front-end logica te vereenvoudigen en de herbruikbaarheid en onderhoudbaarheid te verbeteren. Tegelijkertijd maakt het gebruik van de configureerbaarheid van Flows om no-code configuratie- en orkestratiemogelijkheden te bieden voor front-end componenten en bedrijfslogica.

## Waarom heet het FlowEngine?

Omdat in FlowEngine de eigenschappen en logica van een component niet langer statisch zijn gedefinieerd, maar worden aangestuurd en beheerd door **Flows**.

*   **Flow**, net als een datastroom, splitst logica op in geordende stappen (Steps) die geleidelijk op de component worden toegepast.
*   **Engine** betekent dat het een engine is die front-end logica en interacties aanstuurt.

Daarom is **FlowEngine = Een front-end logica-engine die wordt aangestuurd door Flows**.

## Wat is een Model?

In FlowEngine is een Model een abstract model van een component, verantwoordelijk voor:

*   Het beheren van de **eigenschappen (Props) en status** van de component;
*   Het definiëren van de **renderingsmethode** van de component;
*   Het hosten en uitvoeren van **Flows**;
*   Het uniform afhandelen van **gebeurtenisafhandeling** en **levenscycli**.

Met andere woorden, **een Model is het logische brein van een component**, dat het transformeert van een statische eenheid in een configureerbare en orkestreerbare dynamische eenheid.

## Wat is een Flow?

In FlowEngine is **een Flow een logische stroom die een Model bedient**.
Het doel ervan is om:

*   Eigenschaps- of gebeurtenislogica op te splitsen in stappen (Steps) en deze sequentieel uit te voeren als een stroom;
*   Eigenschapswijzigingen en gebeurtenisreacties te beheren;
*   Logica **dynamisch, configureerbaar en herbruikbaar** te maken.

## Hoe begrijpt u deze concepten?

U kunt een **Flow** voorstellen als een **waterstroom**:

*   **Een Step is als een knooppunt langs de waterstroom**
    Elke Step voert een kleine taak uit (bijvoorbeeld een eigenschap instellen, een gebeurtenis activeren, een API aanroepen), net zoals een waterstroom een effect heeft wanneer deze door een sluis of een waterrad stroomt.

*   **Flows zijn geordend**
    Een waterstroom volgt een vooraf bepaalde route van stroomopwaarts naar stroomafwaarts, en stroomt achtereenvolgens door alle Steps; op dezelfde manier wordt de logica in een Flow uitgevoerd in de gedefinieerde volgorde.

*   **Flows kunnen vertakt en gecombineerd worden**
    Een waterstroom kan worden opgesplitst in meerdere kleinere stromen of samengevoegd worden; een Flow kan ook worden opgesplitst in meerdere sub-flows of gecombineerd worden tot complexere logische ketens.

*   **Flows zijn configureerbaar en controleerbaar**
    De richting en het volume van een waterstroom kunnen worden aangepast met een sluis; de uitvoeringsmethode en parameters van een Flow kunnen ook worden beheerd via configuratie (stepParams).

Samenvatting van de analogie

*   Een **component** is als een waterrad dat een waterstroom nodig heeft om te draaien;
*   Een **Model** is de basis en controller van dit waterrad, verantwoordelijk voor het ontvangen van de waterstroom en het aansturen van de werking ervan;
*   Een **Flow** is die waterstroom, die achtereenvolgens door elke Step stroomt, waardoor de component continu verandert en reageert.

Dus, in FlowEngine:

*   **Flows laten logica natuurlijk stromen als een waterstroom**;
*   **Models stellen componenten in staat om de dragers en uitvoerders van deze stroom te worden**.