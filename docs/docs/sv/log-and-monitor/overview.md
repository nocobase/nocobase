:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Serverloggar, Granskningsloggar och Posthistorik

## Serverloggar

### Systemloggar

> Se [Systemloggar](#)

- Registrerar körningsinformation för applikationssystemet, spårar exekveringskedjor för kod och spårar undantag eller körningsfel.
- Loggarna kategoriseras efter allvarlighetsgrader och funktionsmoduler.
- Utmatas via terminalen eller lagras som filer.
- Används främst för att diagnostisera och felsöka systemfel under drift.

### Begärandeloggar

> Se [Begärandeloggar](#)

- Registrerar detaljer om HTTP API-begäranden och svar, med fokus på begärande-ID, API-sökväg, rubriker, svarsstatuskod och varaktighet.
- Utmatas via terminalen eller lagras som filer.
- Används främst för att spåra API-anrop och exekveringsprestanda.

## Granskningsloggar

> Se [Granskningsloggar](/security/audit-logger/index.md)

- Registrerar användares (eller API:ers) åtgärder på systemresurser, med fokus på resurstyp, målobjekt, åtgärdstyp, användarinformation och åtgärdsstatus.
- För att bättre spåra vad användare gjorde och vilka resultat som producerades, lagras begärandeparametrar och svar som metadata. Detta överlappar delvis med begärandeloggar men är inte identiskt — till exempel inkluderar begärandeloggar vanligtvis inte fullständiga begärandekroppar.
- Begärandeparametrar och svar är **inte likvärdiga** med datasnapshots. De kan avslöja vilken typ av operationer som utfördes men inte de exakta data före ändringen, och kan därför inte användas för versionskontroll eller återställning av data efter felaktiga operationer.
- Lagras som både filer och databastabeller.

![](https://static-docs.nocobase.com/202501031627922.png)

## Posthistorik

> Se [Posthistorik](/record-history/index.md)

- Registrerar **ändringshistoriken** för datainnehåll.
- Spårar resurstyp, resursobjekt, åtgärdstyp, ändrade fält och värden före/efter ändring.
- Användbart för **datajämförelse och granskning**.
- Lagras i databastabeller.

![](https://static-docs.nocobase.com/202511011338499.png)