:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Wat is FlowEngine?

FlowEngine is een nieuwe no-code en low-code ontwikkelingsengine voor de frontend, geïntroduceerd in NocoBase 2.0. Het combineert modellen (Model) met stromen (Flow) om de frontend-logica te vereenvoudigen en de herbruikbaarheid en onderhoudbaarheid te verbeteren. Tegelijkertijd, door gebruik te maken van de configureerbare aard van Flow, biedt het no-code configuratie- en orkestratiemogelijkheden voor frontend-componenten en bedrijfslogica.

## Waarom heet het FlowEngine?

Omdat in FlowEngine de eigenschappen en logica van componenten niet langer statisch zijn gedefinieerd, maar worden aangestuurd en beheerd door een **Flow**.

*   **Flow**, net als een datastroom, splitst logica op in geordende stappen (Step) en past deze sequentieel toe op de component;
*   **Engine** staat voor een engine die frontend-logica en interacties aanstuurt.

Daarom is **FlowEngine = Een frontend-logica engine die wordt aangestuurd door stromen**.

## Wat is een Model?

In FlowEngine is een Model een abstract model van een component, verantwoordelijk voor:

*   Het beheren van de **eigenschappen (Props) en status** van de component;
*   Het definiëren van de **renderingsmethode** van de component;
*   Het hosten en uitvoeren van de **Flow**;
*   Het uniform afhandelen van **gebeurtenisafhandeling** en **levenscycli**.

Met andere woorden, **het Model is het logische brein van de component**, waardoor het verandert van een statisch element in een configureerbare en orkestreerbare dynamische eenheid.

## Wat is een Flow?

In FlowEngine is een **Flow een logische stroom die het Model bedient**.
Het doel ervan is om:

*   Eigenschaps- of gebeurtenislogica op te splitsen in stappen (Step) en deze sequentieel uit te voeren als een stroom;
*   Zowel eigenschapswijzigingen als gebeurtenisreacties te beheren;
*   Logica **dynamisch, configureerbaar en herbruikbaar** te maken.

## Hoe deze concepten te begrijpen?

U kunt een **Flow** voorstellen als een **waterstroom**:

*   **Een Step is als een knooppunt langs het pad van de waterstroom**
    Elke Step voert een kleine taak uit (bijvoorbeeld een eigenschap instellen, een gebeurtenis activeren, een API aanroepen), net zoals water een effect heeft wanneer het door een sluis of een waterrad stroomt.

*   **De stroom is geordend**
    Water stroomt langs een vooraf bepaald pad van stroomopwaarts naar stroomafwaarts, waarbij het alle Steps in volgorde passeert; op dezelfde manier wordt de logica in een Flow uitgevoerd in de gedefinieerde volgorde.

*   **De stroom kan vertakt en gecombineerd worden**
    Een waterstroom kan worden opgesplitst in meerdere kleinere stromen of samengevoegd; een Flow kan ook worden opgesplitst in meerdere sub-flows of worden gecombineerd tot complexere logische ketens.

*   **De stroom is configureerbaar en controleerbaar**
    De richting en het volume van een waterstroom kunnen worden aangepast met een sluis; de uitvoeringsmethode en parameters van een Flow kunnen ook worden gecontroleerd via configuratie (`stepParams`).

Analogie Samenvatting

*   Een **component** is als een waterrad dat een waterstroom nodig heeft om te draaien;
*   Het **Model** is de basis en controller van dit waterrad, verantwoordelijk voor het ontvangen van het water en het aansturen van de werking ervan;
*   De **Flow** is die waterstroom die in volgorde door elke Step stroomt, waardoor de component continu verandert en reageert.

Dus in FlowEngine:

*   **Flow laat logica natuurlijk stromen als een waterstroom**;
*   **Model maakt de component de drager en uitvoerder van deze stroom**.