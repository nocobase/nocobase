:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Vad är FlowEngine?

FlowEngine är en ny frontend-motor för no-code och low-code utveckling som lanserats med NocoBase 2.0. Den kombinerar modeller (Model) med flöden (Flow) för att förenkla frontend-logik och förbättra återanvändbarhet och underhållbarhet. Tack vare Flows konfigurerbara natur möjliggör den no-code konfiguration och orkestrering för frontend-komponenter och affärslogik.

## Varför heter det FlowEngine?

I FlowEngine är komponenternas egenskaper och logik inte längre statiskt definierade, utan drivs och hanteras av ett **flöde (Flow)**.

*   **Flow** delar, likt ett dataflöde, upp logiken i ordnade steg (Step) och tillämpar dem stegvis på komponenten;
*   **Engine** står för att det är en motor som driver frontend-logik och interaktioner.

Därför, **FlowEngine = En frontend-logikmotor driven av flöden**.

## Vad är en Model?

I FlowEngine är en Model en abstrakt modell av en komponent, som ansvarar för:

*   Att hantera komponentens **egenskaper (Props) och tillstånd**;
*   Att definiera komponentens **renderingsmetod**;
*   Att innehålla och exekvera **Flow**;
*   Att enhetligt hantera **händelsedistribution** och **livscykler**.

Med andra ord, **Model är komponentens logiska hjärna**, som förvandlar den från ett statiskt element till en konfigurerbar och orkestrerbar dynamisk enhet.

## Vad är ett Flow?

I FlowEngine är ett **Flow ett logiskt flöde som betjänar Model**.
Dess syfte är att:

*   Att bryta ner egenskaps- eller händelselogik i steg (Step) och exekvera dem sekventiellt i form av ett flöde;
*   Att kunna hantera egenskapsförändringar såväl som händelsesvar;
*   Att göra logiken **dynamisk, konfigurerbar och återanvändbar**.

## Hur förstår man dessa koncept?

Ni kan tänka er ett **Flow** som en **vattenström**:

*   **Ett Step är som en nod längs vattenströmmens väg**
    Varje Step utför en liten uppgift (t.ex. att ställa in en egenskap, utlösa en händelse, anropa ett API), precis som vatten har en effekt när det passerar genom en sluss eller ett vattenhjul.

*   **Flödet är ordnat**
    Vatten strömmar längs en förutbestämd väg från uppströms till nedströms, och passerar alla Step i sekvens; på samma sätt exekveras logiken i ett Flow i den definierade ordningen.

*   **Flödet kan förgrenas och kombineras**
    En vattenström kan delas upp i flera mindre strömmar eller sammanfogas; ett Flow kan också delas upp i flera delflöden eller kombineras till mer komplexa logiska kedjor.

*   **Flödet är konfigurerbart och kontrollerbart**
    Vattenströmmens riktning och volym kan justeras med en slussport; ett Flows exekveringsmetod och parametrar kan också kontrolleras genom konfiguration (stepParams).

Sammanfattning av analogin

*   En **komponent** är som ett vattenhjul som behöver en vattenström för att snurra;
*   **Model** är vattenhjulets bas och styrenhet, ansvarig för att ta emot vattnet och driva dess funktion;
*   **Flow** är den vattenström som passerar genom varje Step i ordning, vilket får komponenten att kontinuerligt förändras och reagera.

Så i FlowEngine:

*   **Flow låter logiken flöda naturligt som en vattenström**;
*   **Model gör komponenten till bäraren och exekutorn av denna ström**.