---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Anwendungsblock und App-Wechsler'
description: 'Anwendungsblock und App-Wechsler in Multi-App: Sub-App-Einstiege im Frontend anzeigen, App-Symbole, Sichtbarkeit und den App-Wechsler oben links konfigurieren.'
keywords: 'Multi-App,Anwendungsblock,App-Wechsler,Sub-App-Einstieg,NocoBase'
---

# Anwendungsblock und App-Wechsler

Neben der zentralen Verwaltung von Sub-Apps im Admin-Bereich kann Multi-App auch Anwendungseinstiege im Frontend bereitstellen. Typische Möglichkeiten sind:

- Einen Block „Anwendungen“ auf einer Seite hinzufügen, um erreichbare Sub-Apps gesammelt anzuzeigen
- Den App-Wechsler oben links aktivieren, damit Benutzer zwischen Haupt-App und Sub-Apps wechseln können

## Anwendungsblock

![](https://static-docs.nocobase.com/202605271350840.png)

Der Block „Anwendungen“ zeigt eine Liste von Sub-Apps auf einer Frontend-Seite an. Er eignet sich als einfaches App-Portal, über das Endbenutzer verschiedene Geschäftsanwendungen von einer Seite aus öffnen können.

Jede Anwendung im Block zeigt:

- Anwendungssymbol
- Anwendungsname
- Zugriffseinstieg

Beim Anklicken wird die entsprechende Sub-App geöffnet.

### Anwendungssymbol konfigurieren

Beim Erstellen oder Bearbeiten einer Anwendung im App Supervisor können Sie unter „Anzeigekonfiguration“ ein Anwendungssymbol hochladen.

Wenn kein Symbol hochgeladen wurde, erzeugt das System ein Standardsymbol aus dem Anfangsbuchstaben des Anwendungsnamens, damit Anwendungen in der Liste leichter unterscheidbar sind.

![](https://static-docs.nocobase.com/202605271402603.png)

### Anwendungen ausblenden

Wenn eine Anwendung nicht im Frontend-Block „Anwendungen“ erscheinen soll, aktivieren Sie in der Anwendungskonfiguration „Im Anwendungsblock ausblenden“.

Nach dem Ausblenden gilt:

- Die Anwendung kann weiterhin im Admin-Bereich verwaltet werden
- Die Anwendung kann weiterhin direkt über ihre Adresse geöffnet werden
- Sie erscheint lediglich nicht mehr im Frontend-Block „Anwendungen“

![](https://static-docs.nocobase.com/202605271403980.png)

## App-Wechsler

![](https://static-docs.nocobase.com/202605271403304.png)

Der App-Wechsler wird oben links angezeigt und dient zum schnellen Wechsel zu anderen Anwendungen.

Wenn eine Anwendung im App-Wechsler erscheinen soll, aktivieren Sie in der Anwendungskonfiguration „Im App-Wechsler anzeigen“.

Danach sehen Benutzer den App-Wechsler oben links in der Haupt-App oder in Sub-Apps und können andere Anwendungen aus der Liste öffnen.

![](https://static-docs.nocobase.com/202605271404322.png)

### Öffnungsverhalten

Der App-Wechsler öffnet Anwendungen wie folgt:

- Von der Haupt-App zu einer Sub-App: in einem neuen Tab
- Von einer Sub-App zu einer anderen Sub-App: im aktuellen Tab

So wird die Arbeit in der Haupt-App nicht unterbrochen, während der Wechsel zwischen Sub-Apps natürlich bleibt.
