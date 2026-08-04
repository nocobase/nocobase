---
title: "Schnellstart Aufbau mit AI Portal"
description: "Beim Aufbau mit AI Portal schreibt ein AI Agent den Code Ihres Geschäftssystems, während NocoBase Authentifizierung, Datenbank, API und Berechtigungen als Basis bereitstellt. Der Code liegt in einem Anwendungseinstieg namens AI Portal."
keywords: "Aufbau mit AI Portal,AI Builder,AI Portal,NocoBase AI,NocoBase-Basis,Frontend-Entwicklung,React,shadcn/ui,AI Agent,Schnellstart"
---

# Schnellstart Aufbau mit AI Portal

Wir haben festgestellt: KI-Vibe-Coding bringt durchaus ansprechende Seiten hervor, tut sich aber schwer damit, an ein reales Geschäftssystem anzudocken – oder es baut Authentifizierung, Berechtigungen und Tabellenentwurf noch einmal von Grund auf nach.

NocoBase als Low-Code-/No-Code-Plattform bringt all das bereits mit. Sie können es als Basis für den Systemkern verwenden: Der AI Agent kümmert sich um die Geschäftslogik, NocoBase liefert die zuverlässige Infrastruktur für Authentifizierung, Datenbank, API und Berechtigungen.

Dafür stellen wir einen Anwendungseinstieg namens **AI Portal** bereit. Dessen Quellcode liegt lokal und ist dem AI Agent zum Schreiben vorbehalten. Der in diesem Einstieg geschriebene Code kann direkt auf die Basisfähigkeiten von NocoBase zugreifen, und die gebauten Seiten sind unmittelbar aufrufbar.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## Was NocoBase bereitstellt

Beim Aufbau eines Geschäftssystems geht die Zeit meist nicht für die Seiten selbst drauf, sondern für alles dahinter – Benutzeranmeldung, Berechtigungsprüfung, Tabellenentwurf, CRUD-Schnittstellen, Datei-Upload und -Download. Das braucht jedes System, und es jedes Mal neu zu bauen lohnt sich nicht.

All das bringt NocoBase bereits mit:

- **Authentifizierungssystem** – Anmeldung mit Benutzername und Passwort funktioniert sofort. OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeCom und weitere Verfahren stehen bereit, sobald sie serverseitig aktiviert sind; das Frontend muss sie nur noch anbinden
- **Datenbank und mehrere Datenquellen** – integrierte Verwaltung von Datentabellen sowie Anbindung externer Datenquellen wie MySQL oder PostgreSQL
- **REST API** – sobald eine Datentabelle existiert, sind ihre CRUD-Schnittstellen automatisch vorhanden, inklusive Filterung, Sortierung, Paginierung und Beziehungsfeldern
- **Berechtigungssteuerung** – rollenbasierte ACL bis auf Feld- und Datensatzebene. Das Frontend kann die Berechtigungen des aktuellen Benutzers auslesen und daraus ableiten, was angezeigt wird
- **Workflow** – Automatisierung von Geschäftsprozessen, ausgelöst aus dem Frontend oder durch Datenänderungen
- **Dateispeicher** – Upload und Download

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Auf Basis dieser Fähigkeiten haben wir einen standardisierten [Systemvorlagen-Code](https://github.com/nocobase/portal-template-default) gebaut, den der AI Agent einfach kopieren kann, um eine lauffähige Grundanwendung zu erhalten. Zusätzlich stellt NocoBase eine Reihe von Skills wie [Datenmodellierung](../data-modeling.md) und [Berechtigungskonfiguration](../acl.md) bereit. Sobald Sie Ihre Geschäftsanforderungen beschreiben, generiert der AI Agent also nicht nur Frontend-Seiten, sondern legt auch die Datentabellen an und konfiguriert die Berechtigungen – am Ende steht ein vollständiges Geschäftssystem.

## Voraussetzungen

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation) – die Portal-Vorlage installiert damit Abhängigkeiten und startet den Entwicklungsserver
- Die Alpha-Version der `nocobase cli` (**Hinweis: derzeit wird nur die Alpha-Version unterstützt**)
  - `npm install -g @nocobase/cli@alpha`
  - sowie eine NocoBase-Anwendung, die bereits über `nb init --ui` initialisiert wurde, siehe [Anbindungsanleitung für AI Agents](../../ai/quick-start.md)
- Ein AI Agent, zum Beispiel Claude Code, Codex oder Cursor

## Schritt 1: Prüfen, ob Sie bereits ein AI Portal haben

Vergewissern Sie sich zunächst, dass das standardmäßige `main` tatsächlich vorhanden ist:

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

Die Ausgabe listet Portal-Name, Zugriffs-URL, Portal-Typ, source storage, Entwicklungspfad, Aktivierungsstatus und Standardstatus auf.

Nachdem Sie den Quellcode gezogen haben, liefert `info` weitere Details, etwa wohin Entwicklungspfad und Deployment-Pfad jeweils zeigen:

```bash
nb portal info main
```

## Schritt 2: Entwicklungsmodus starten

```bash
# Quellcode des Portals ziehen
nb portal pull main
# Entwicklungsserver für den Quellcode starten
nb portal dev main
```

Der Entwicklungsserver läuft standardmäßig unter `http://localhost:5173`.

Die Vorlage bringt eine Benutzerverwaltungsseite auf Basis der NocoBase-Datentabelle `users` mit. Melden Sie sich an und sehen Sie sich das Ergebnis an – zugleich ist es ein gutes Ausgangsbeispiel, an dem sich die KI orientieren kann.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Schritt 3: Die KI eine Seite ändern lassen

Wechseln Sie in den Entwicklungs-Workspace des Portals (`pull` legt ihn standardmäßig unter `./main` an; im Zweifel prüfen Sie den Entwicklungspfad mit `nb portal info main`), öffnen Sie dort Ihren AI Agent – etwa Claude Code, Codex oder Cursor – und geben Sie einen Prompt ein:

```
Füge eine Kundenverwaltungsseite hinzu,
mit einer Kundenliste, einer Suche nach Namen und einem Detail-Drawer, der sich beim Klick auf eine Zeile öffnet
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

Die KI liest die vorhandenen Seiten und Erweiterungen durch, schreibt die neue Seite nach den Konventionen der Vorlage, und Sie sehen das Ergebnis unter `http://localhost:5173`.

Wie Sie effizient mit einem AI Agent zusammenarbeiten, lesen Sie unter [Aufbau mit einem AI Agent](./agent-workflow.md).

## Schritt 4: Deployen

Wenn die lokalen Änderungen passen, pushen Sie den Quellcode auf die Gegenstelle und deployen ihn anschließend:

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

Wohin `push` den Quellcode schickt, hängt von der source-storage-Konfiguration dieses Portals ab. Standard ist `nocobase`, der Quellcode wird also von NocoBase verwaltet. Haben Sie ihn mit [`nb portal config`](../../api/cli/portal/config.md) auf `git` gestellt, committet und pusht `push` den Quellcode in das von Ihnen angegebene Git-Repository, und `--message` wird zur Git-Commit-Message. Details finden Sie unter [Deployment und Quellcodeverwaltung](./deploy.md#source-storage).

Nach dem Deployment rufen Sie `/x/main/` auf und sehen dort Ihre Änderungen.

Damit ist der komplette Kreislauf einmal durchlaufen – Anforderung beschreiben, KI schreibt den Code, lokal das Ergebnis prüfen, pushen und deployen.

## Wenn Sie weitere Einstiege brauchen

Eine Anwendung kann mehrere Portale haben. Zum Beispiel eines für interne Mitarbeiter und eines für externe Kunden: Seiten und Berechtigungen bleiben vollständig getrennt, während die Daten gemeinsam genutzt werden:

```bash
nb portal create customer
```

Beim Erstellen entsteht im aktuellen Verzeichnis `./customer` als Entwicklungs-Workspace; mit `--path` können Sie einen anderen Ort angeben. Ein neues Portal wird genauso mit `nb portal dev` entwickelt und mit `nb portal deploy` deployt – wechseln Sie einfach in seinen Workspace und öffnen Sie dort Ihren AI Agent. Ausführlich beschrieben ist das unter [Deployment und Quellcodeverwaltung](./deploy.md).

## Demo ausprobieren

Wenn Sie den Aufbau mit AI Portal einmal erleben möchten, können Sie unter https://demo.nocobase.com/new eine Demo-Umgebung anfordern. Nachdem Sie das Formular ausgefüllt haben, erzeugen wir für Sie eine eigene Demo-Umgebung – darin enthalten sind mehrere AI-Portal-Anwendungen, die auf der NocoBase-Basis umgesetzt wurden.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Anschließend wählen Sie ein AI Portal aus und rufen es auf:

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

Auf der Willkommensseite des Portals stellen wir außerdem einen Prompt bereit, mit dem sich Ihr AI Agent direkt mit dieser AI-Portal-Anwendung verbinden, den Anwendungscode ziehen, lokal einen Entwicklungsserver starten, Seiten ändern und das Ergebnis zurück in die Demo-Umgebung pushen und deployen kann. Nach erfolgreichem Deployment aktualisieren Sie die Seite und sehen das Ergebnis.

## Wie geht es weiter?

- [Aufbau mit einem AI Agent](./agent-workflow.md) – wie Sie Prompts schreiben und wie Sie zurückrollen, wenn die KI etwas falsch macht
- [Projektstruktur und Technologie-Stack](./project-structure.md) – die Verzeichniskonventionen der Vorlage und die gängigen Befehle
- [Deployment und Quellcodeverwaltung](./deploy.md) – Portal-Quellcode unter Git stellen sowie Deployment über mehrere Umgebungen

## Verwandte Links

- [Aufbau mit einem AI Agent](./agent-workflow.md) – Portal-Seiten in natürlicher Sprache von der KI schreiben lassen
- [Projektstruktur und Technologie-Stack](./project-structure.md) – die Verzeichniskonventionen der Vorlage und die gängigen Befehle
- [Standardkomponenten und Erweiterungen](./components.md) – die shadcn/ui-Komponentenbasis und der Erweiterungsmechanismus
- [Deployment und Quellcodeverwaltung](./deploy.md) – der komplette Ablauf aus Entwicklung, Push und Deployment
- [Anbindungsanleitung für AI Agents](../../ai/quick-start.md) – NocoBase CLI installieren und Initialisierung abschließen
- [Schnellstart KI-Builder](../index.md) – die andere Art des Aufbaus, ohne Code zu schreiben
- [Versionsverwaltung](../version-control.md) – Versions-Snapshots beim No-Code-Aufbau
- [`nb portal` Befehlsreferenz](../../api/cli/portal/index.md) – vollständige Parameterbeschreibung aller Portal-Befehle
