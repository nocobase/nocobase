:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Förhandsgranska och spara

*   **Förhandsgranska:** Renderar tillfälligt ändringar från konfigurationspanelen till sidans diagram för att verifiera resultatet.
*   **Spara:** Sparar ändringar från konfigurationspanelen permanent till databasen.

## Åtkomstpunkter

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   I det visuella (grundläggande) läget tillämpas ändringar automatiskt i förhandsgranskningen som standard.
*   I SQL- och anpassade lägen klickar ni på knappen "Förhandsgranska" till höger för att tillämpa ändringar i förhandsgranskningen.
*   En enhetlig "Förhandsgranska"-knapp finns längst ner i konfigurationspanelen.

## Förhandsgranskningens beteende
*   Visar tillfälligt konfigurationen på sidan utan att skriva till databasen. Efter en uppdatering eller avbrytning behålls inte förhandsgranskningsresultatet.
*   Inbyggd fördröjningsfunktion: Om ni utlöser flera uppdateringar inom kort tid, körs endast den senaste för att undvika frekventa förfrågningar.
*   Om ni klickar på "Förhandsgranska" igen, skrivs det föregående förhandsgranskningsresultatet över.

## Felmeddelanden
*   Frågefel eller valideringsfel: Visas i området "Visa data".
*   Fel i diagramkonfigurationen (saknad grundläggande mappning, undantag från anpassad JS): Visas i diagramområdet eller konsolen samtidigt som sidan förblir användbar.
*   Bekräfta kolumnnamn och datatyper i "Visa data" innan ni utför fältmappning eller skriver anpassad kod för att effektivt minska fel.

## Spara och avbryt
*   **Spara:** Skriver de aktuella ändringarna till blockkonfigurationen och tillämpar dem omedelbart på sidan.
*   **Avbryt:** Ångrar aktuella osparade ändringar och återställer till det senast sparade tillståndet.
*   **Omfattning av sparning:**
    *   **Datafråga:** Builder-parametrar; i SQL-läge sparas även SQL-texten.
    *   **Diagramalternativ:** Grundläggande typ, fältmappning och egenskaper; anpassad JS-text.
    *   **Interaktionshändelser:** JS-text och bindningslogik.
*   Efter sparning träder blocket i kraft för alla besökare (beroende på sidans behörighetsinställningar).

## Rekommenderat arbetsflöde
*   Konfigurera datafråga → Kör fråga → Visa data för att bekräfta kolumnnamn och typer → Konfigurera diagramalternativ för att mappa kärnfält → Förhandsgranska för att validera → Spara för att tillämpa.