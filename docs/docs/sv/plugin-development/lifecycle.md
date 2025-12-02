:::tip AI-översättningsmeddelande
Denna dokumentation har översatts automatiskt av AI.
:::

# Livscykel

Detta avsnitt organiserar livscykelkrokarna för **plugin** på både serversidan och klientsidan, för att hjälpa utvecklare att korrekt registrera och frisläppa resurser.

Ni kan jämföra med FlowModel-livscykeln för att belysa gemensamma koncept.

## Föreslaget innehåll

- Återanrop som utlöses när **plugin** installeras, aktiveras, inaktiveras eller avinstalleras.
- Tidpunkter för montering, uppdatering och förstörelse av komponenter på klientsidan.
- Rekommendationer för hantering av asynkrona uppgifter och fel inom livscykeln.