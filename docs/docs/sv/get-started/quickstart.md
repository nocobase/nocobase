---
versions:
  - label: Senaste (Stabil)
    features: Stabila funktioner, vältestad, endast buggfixar.
    audience: Användare som behöver en stabil upplevelse och för produktionsmiljöer.
    stability: ★★★★★
    production_recommendation: Rekommenderas
  - label: Beta (Testversion)
    features: Innehåller kommande funktioner som har genomgått initiala tester och kan ha några problem.
    audience: Användare som vill testa nya funktioner i förväg och ge feedback.
    stability: ★★★★☆
    production_recommendation: Använd med försiktighet
  - label: Alpha (Utvecklingsversion)
    features: Utvecklingsversion med de senaste funktionerna, som kan vara ofullständiga eller instabila.
    audience: Tekniska användare och bidragsgivare som är intresserade av den senaste utvecklingen.
    stability: ★★☆☆☆
    production_recommendation: Använd med försiktighet

install_methods:
  - label: Docker-installation (Rekommenderas)
    features: Ingen kod krävs; enkel installation; lämplig för snabba tester.
    scenarios: Användare utan kodkunskaper; användare som snabbt vill driftsätta på en server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Hämta den senaste avbildningen och starta om containern.
  - label: create-nocobase-app-installation
    features: Oberoende applikationskodbas; stöder plugin-utökningar och anpassning av gränssnittet.
    scenarios: Frontend-/fullstack-utvecklare; teamprojekt; lågkodutveckling.
    technical_requirement: ★★★☆☆
    upgrade_method: Uppdatera beroenden med yarn.
  - label: Git-källkodsinstallation
    features: Hämta den senaste källkoden direkt; lämplig för bidrag och felsökning.
    scenarios: Tekniska utvecklare; användare som vill testa ej släppta versioner.
    technical_requirement: ★★★★★
    upgrade_method: Synkronisera uppdateringar via Git.
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Installationssätt och versionsjämförelse

Ni kan installera NocoBase på olika sätt.

## Versionsjämförelse

| Post | **Senaste (Stabil)** | **Beta (Testversion)** | **Alpha (Utvecklingsversion)** |
|------|------------------------|----------------------|-----------------------|
| **Egenskaper** | Stabila funktioner, vältestad, endast buggfixar. | Innehåller kommande funktioner som har genomgått initiala tester och kan ha några problem. | Utvecklingsversion med de senaste funktionerna, som kan vara ofullständiga eller instabila. |
| **Målgrupp** | Användare som behöver en stabil upplevelse och för produktionsmiljöer. | Användare som vill testa nya funktioner i förväg och ge feedback. | Tekniska användare och bidragsgivare som är intresserade av den senaste utvecklingen. |
| **Stabilitet** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Rekommenderas för produktion** | Rekommenderas | Använd med försiktighet | Använd med försiktighet |

## Jämförelse av installationssätt

| Post | **Docker-installation (Rekommenderas)** | **create-nocobase-app-installation** | **Git-källkodsinstallation** |
|------|--------------------------|------------------------------|------------------|
| **Egenskaper** | Ingen kod krävs; enkel installation; lämplig för snabba tester. | Oberoende applikationskodbas; stöder plugin-utökningar och anpassning av gränssnittet. | Hämta den senaste källkoden direkt; lämplig för bidrag och felsökning. |
| **Användningsområden** | Användare utan kodkunskaper; användare som snabbt vill driftsätta på en server. | Frontend-/fullstack-utvecklare; teamprojekt; lågkodutveckling. | Tekniska utvecklare; användare som vill testa ej släppta versioner. |
| **Tekniska krav** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Uppgraderingsmetod** | Hämta den senaste avbildningen och starta om containern. | Uppdatera beroenden med yarn. | Synkronisera uppdateringar via Git. |
| **Guider** | [<code>Installation</code>](#) [<code>Uppgradering</code>](#) [<code>Driftsättning</code>](#) | [<code>Installation</code>](#) [<code>Uppgradering</code>](#) [<code>Driftsättning</code>](#) | [<code>Installation</code>](#) [<code>Uppgradering</code>](#) [<code>Driftsättning</code>](#) |