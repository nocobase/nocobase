:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Klusterläge

## Introduktion

Från och med version v1.6.0 stöder NocoBase att köra applikationer i klusterläge. När en applikation körs i klusterläge kan den förbättra sin prestanda vid hantering av samtidiga åtkomster genom att använda flera instanser och ett flerkärnigt läge.

## Systemarkitektur

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Applikationskluster**: Ett kluster som består av flera NocoBase-applikationsinstanser. Det kan distribueras på flera servrar eller köras som flera processer i flerkärnigt läge på en enda server.
*   **Databas**: Lagrar applikationens data. Det kan vara en enkelnoddatabas eller en distribuerad databas.
*   **Delad lagring**: Används för att lagra applikationsfiler och data, och stöder läs-/skrivåtkomst från flera instanser.
*   **Middleware**: Inkluderar komponenter som cache, synkroniseringssignaler, meddelandekö och distribuerade lås för att stödja kommunikation och koordinering inom applikationsklustret.
*   **Lastbalanserare**: Ansvarar för att distribuera klientförfrågningar till olika instanser i applikationsklustret, samt utföra hälsokontroller och failover.

## Läs mer

Detta dokument introducerar endast de grundläggande koncepten och komponenterna i NocoBase klusterläge. För specifika distributionsdetaljer och fler konfigurationsalternativ kan ni se följande dokument:

- Distribution
  - [Förberedelser](./preparations)
  - [Kubernetes-distribution](./kubernetes)
  - [Drift](./operations)
- Avancerat
  - [Uppdelning av tjänster](./services-splitting)
- [Utvecklingsreferens](./development)