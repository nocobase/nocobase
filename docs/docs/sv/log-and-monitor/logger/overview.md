:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/log-and-monitor/logger/overview).
:::

# Serverloggar, granskningsloggar och historik

## Serverloggar

### Systemloggar

> Se [Systemloggar](./index.md#system-logs)

- Registrerar driftinformation för applikationssystemet, spårar exekveringskedjor i koden och spårar undantag eller körningsfel.
- Loggar är kategoriserade efter allvarlighetsgrad och funktionsmoduler.
- Matas ut via terminalen eller lagras som filer.
- Används främst för att ni ska kunna diagnostisera och felsöka systemfel under drift.

### Begäransloggar

> Se [Begäransloggar](./index.md#request-logs)

- Registrerar detaljer om HTTP API-begäranden och svar, med fokus på begärande-ID, API-sökväg, rubriker (headers), svarsstatuskod och tidsåtgång.
- Matas ut via terminalen eller lagras som filer.
- Används främst för att spåra API-anrop och exekveringsprestanda.

## Granskningsloggar

> Se [Granskningsloggar](/security/audit-logger/index.md)

- Registrerar användares (eller API:ers) åtgärder på systemresurser, med fokus på resurstyp, målobjekt, typ av åtgärd, användarinformation och status för åtgärden.
- För att ni bättre ska kunna spåra vad användare har gjort och vilka resultat som genererats, lagras parametrar och svar som metadata. Denna information överlappar delvis med begäransloggar men är inte identisk – till exempel innehåller begäransloggar vanligtvis inte hela innehållet i en begäran (request body).
- Parametrar och svar för en begäran är **inte likställda** med ögonblicksbilder (snapshots) av data. De kan visa vilken typ av ändringar som gjorts, men inte det exakta innehållet före ändringen. Därför kan de inte användas för versionskontroll eller för att återställa data efter felaktiga åtgärder.
- Lagras som både filer och databastabeller.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historik

> Se [Historik](/record-history/index.md)

- Registrerar ändringshistorik för datainnehåll.
- Spårar resurstyp, resursobjekt, typ av åtgärd, ändrade fält samt värden före och efter ändringen.
- Kan användas för datajämförelse och granskning.
- Lagras i databastabeller.

![](https://static-docs.nocobase.com/202511011338499.png)