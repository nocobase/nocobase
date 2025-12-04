:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Vad är FlowEngine?

FlowEngine är en helt ny utvecklingsmotor för frontend, med stöd för no-code och low-code, som NocoBase 2.0 lanserar. Den kombinerar modeller (Model) med flöden (Flow) för att förenkla frontend-logik och förbättra återanvändbarhet och underhållbarhet. Samtidigt, tack vare flödenas konfigurerbarhet, ger den frontend-komponenter och affärslogik möjlighet till no-code-konfiguration och orkestrering.

## Varför heter det FlowEngine?

I FlowEngine definieras komponenters egenskaper och logik inte längre statiskt, utan drivs och hanteras av **flöden (Flow)**.

*   **Flow**, likt ett dataflöde, bryter ner logiken i ordnade steg (Step) som successivt appliceras på komponenten.
*   **Engine** (motor) signalerar att det är en motor som driver frontend-logik och interaktioner.

Därför är **FlowEngine = En frontend-logikmotor driven av flöden**.

## Vad är en Model?

I FlowEngine är en Model en abstrakt modell av en komponent, ansvarig för att:

*   Hantera komponentens **egenskaper (Props) och tillstånd**.
*   Definiera komponentens **renderingsmetod**.
*   Vara värd för och exekvera **flöden (Flow)**.
*   Enhetligt hantera **händelsedistribution** och **livscykler**.

Med andra ord är **en Model komponentens logiska hjärna**, som förvandlar den från en statisk enhet till en konfigurerbar och orkestrerbar dynamisk enhet.

## Vad är ett Flow?

I FlowEngine är **ett Flow ett logikflöde som tjänar en Model**.
Dess syfte är att:

*   Bryta ner egenskap- eller händelselogik i steg (Step) och exekvera dem sekventiellt i ett flöde.
*   Hantera både egenskapförändringar och händelsereaktioner.
*   Göra logiken **dynamisk, konfigurerbar och återanvändbar**.

## Hur kan man förstå dessa koncept?

Ni kan föreställa er ett **Flow** som ett **vattenflöde**:

*   **Ett Step är som en nod längs vattenflödet**
    Varje Step utför en liten uppgift (till exempel att ställa in en egenskap, trigga en händelse, anropa ett API), precis som ett vattenflöde påverkar när det passerar genom en sluss eller ett vattenhjul.

*   **Flöden är ordnade**
    Ett vattenflöde följer en förutbestämd väg från uppströms till nedströms och passerar alla Step i sekvens; på samma sätt exekveras logiken i ett Flow i den definierade ordningen.

*   **Flöden kan förgrenas och kombineras**
    Ett vattenflöde kan delas upp i flera mindre strömmar eller slås samman; ett Flow kan också delas upp i flera underflöden eller kombineras till mer komplexa logiska kedjor.

*   **Flöden är konfigurerbara och kontrollerbara**
    Vattenflödets riktning och volym kan justeras med en slussport; exekveringsmetoden och parametrarna för ett Flow kan också kontrolleras genom konfiguration (stepParams).

Sammanfattning av analogin

*   En **komponent** är som ett vattenhjul som behöver ett vattenflöde för att snurra.
*   En **Model** är detta vattenhjuls bas och styrenhet, ansvarig för att ta emot vattenflödet och driva dess funktion.
*   Ett **Flow** är det vattenflödet, som passerar genom varje Step i ordning och driver komponenten att kontinuerligt förändras och reagera.

I FlowEngine gäller alltså att:

*   **Flöden låter logiken röra sig naturligt som ett vattenflöde**.
*   **Modeller gör att komponenter blir bärare och exekutörer av detta flöde**.