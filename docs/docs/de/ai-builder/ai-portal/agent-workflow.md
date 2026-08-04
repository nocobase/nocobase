---
title: "Aufbau mit einem AI Agent"
description: "Lassen Sie einen AI Agent die Frontend-Seiten eines AI Portals in natürlicher Sprache schreiben – inklusive Hinweisen zum Schreiben von Prompts, Tipps zur Zusammenarbeit und dem Umgang mit häufigen Problemen."
keywords: "AI Portal,AI Agent,gemeinsamer Aufbau,Prompts,nocobase-portal-manage,Skills"
---

# Aufbau mit einem AI Agent

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie gemäß dem [Schnellstart Aufbau mit AI Portal](./index.md) Ihr erstes Portal zum Laufen gebracht haben.

:::

Die tägliche Entwicklung an einem AI Portal ist ein Gespräch mit einem AI Agent – Sie beschreiben die gewünschte Seite, er schreibt den Code, und Sie prüfen das Ergebnis im Browser.

## Im Portal-Verzeichnis arbeiten

Wechseln Sie vor dem Start in das Quellcode-Verzeichnis des Portals und öffnen Sie dort Ihren AI Agent. So startet der Agent gleich im richtigen Kontext und hat Zugriff auf `AGENTS.md` und den vorhandenen Code.

Ermitteln Sie zunächst, wo das Verzeichnis liegt:

```bash
nb portal info main
```

Der Entwicklungspfad in der Ausgabe ist der Ort, an dem der Portal-Quellcode liegt. Wechseln Sie mit `cd` dorthin und öffnen Sie anschließend Ihren AI Agent:

```bash
cd <Entwicklungs-Workspace-Verzeichnis>
```

Danach beschreiben Sie einfach, was Sie brauchen:

```
Füge dem main portal meiner nocobase-Anwendung eine Bestellübersichtsseite hinzu
```

## Die KI erst lesen, dann schreiben lassen

Im Wurzelverzeichnis der Vorlage liegt eine `AGENTS.md`, in der die Konventionen dieses Projekts festgehalten sind: vorrangig wiederverwenden, was bereits in `src/extensions` vorhanden ist, UI-Komponenten über Komposition anpassen statt die Basiskomponenten direkt zu ändern, und kein Ant Design einbinden. AI Agents, die diese Datei lesen können, halten sich automatisch daran.

Sie können der `AGENTS.md` auch die Konventionen Ihres eigenen Projekts hinzufügen – Namensgewohnheiten, Fachbegriffe, Verzeichnisse, die unangetastet bleiben sollen. Einmal eingetragen, gelten sie in jedem Gespräch, und Sie müssen sie nicht immer wieder erklären.

Unter `src/extensions` liegen einige integrierte Erweiterungen. Darunter ist `nocobase-users-example` eine vollständige CRUD-Seite mit Liste, Anlegen, Bearbeiten und Detailansicht. Die KI darauf zu verweisen ist deutlich einfacher, als eine neue Seite von Grund auf zu beschreiben:

```
Bau eine Produktverwaltungsseite nach dem Muster von nocobase-users-example
```

## Beispiel-Prompts

### Szenario A: Eine neue Geschäftsseite anlegen

Drei Angaben genügen – was auf der Seite steht, woher die Daten kommen und wie sie sich verhält:

```
Füge eine Kundenverwaltungsseite hinzu:
Die Tabelle zeigt Name, Telefon, E-Mail und Erstellungszeit, mit Suche nach Namen,
und ein Klick auf eine Zeile öffnet einen Detail-Drawer, in dem der Datensatz bearbeitet und gespeichert werden kann
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Szenario B: Eine bestehende Seite umbauen

Bei Änderungswünschen benennen Sie genau, was sich ändern soll. Die gesamte Seite noch einmal zu beschreiben, ist nicht nötig:

```
Ergänze die Kundenliste um einen Statusfilter
mit den Optionen „in Bearbeitung“, „gewonnen“ und „verloren“, standardmäßig ohne Filterung
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Szenario C: Eine neue Datentabelle anbinden

Sobald eine Datentabelle existiert, lassen Sie die KI die passenden Seiten generieren. Sie liest die Felddefinitionen aus und wählt danach die Formularelemente und Listenspalten:

```
Ich habe gerade eine contracts-Tabelle angelegt, bau mir dazu einen passenden Satz CRUD-Seiten
```

Existiert die Tabelle noch nicht, lassen Sie die KI zunächst über [Datenmodellierung](../data-modeling.md) die Datenstruktur entwerfen und kehren dann zu den Seiten zurück.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Szenario D: Ein Design nachbauen

Wenn Sie einen Entwurf oder ein fertiges HTML-Prototyp haben, geben Sie es der KI direkt:

```
Bau die Startseite nach diesem Prototyp,
Farbgebung und Layout bleiben gleich, die Daten kommen aus der orders-Tabelle
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Szenario E: Ein Authentifizierungsverfahren ergänzen

Sobald serverseitig ein Authentifizierungsverfahren aktiviert ist, braucht die Anmeldeseite die passende Frontend-Unterstützung:

```
In NocoBase ist die DingTalk-Anmeldung aktiviert, ergänze die Anmeldeseite um einen DingTalk-Anmeldebutton
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Tipps zur Zusammenarbeit

**In kleinen Schritten iterieren.** Lassen Sie die KI eine Seite oder eine Änderung nach der anderen erledigen und prüfen Sie das Ergebnis, bevor es weitergeht. Wenn Sie fünf Seiten auf einmal beschreiben, lässt sich bei einem Fehler kaum noch sagen, an welcher Stelle es aus dem Ruder gelaufen ist.

**Den Entwicklungsserver laufen lassen.** `nb portal dev main` lädt Änderungen sofort nach, sodass Sie das Ergebnis unmittelbar nach jeder Änderung der KI sehen. Kürzer wird die Rückkopplungsschleife nicht.

**Die genaue Fehlermeldung liefern.** Weiße Seite, fehlgeschlagener Build, 403 von einer Schnittstelle – geben Sie der KI die vollständige Fehlermeldung und einen Screenshot, statt sie raten zu lassen. Meist ist die Sache nach wenigen Runden erledigt. Sie müssen auch nicht selbst herausfinden, in welcher Schicht das Problem liegt.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Häufige Fragen

**Wie rolle ich zurück, wenn die KI etwas falsch macht?**

Liegt der Portal-Quellcode unter Git, genügt ein `git checkout`. Beim standardmäßigen source storage `nocobase` können Sie eine frische Kopie aus dem source storage über den lokalen Stand ziehen:

```bash
nb portal pull main --force
```

`--force` löscht den Entwicklungs-Workspace und zieht ihn neu. Vergewissern Sie sich vor der Ausführung, dass es nichts gibt, was Sie behalten möchten. Um diese Abwägung zu vermeiden, sollten Sie den Quellcode früh unter Git stellen – siehe [Deployment und Quellcodeverwaltung](./deploy.md).

**Wie gehe ich einem fehlgeschlagenen Build auf den Grund?**

Führen Sie zuerst lokal einen Build aus, um die vollständige Fehlermeldung zu sehen:

```bash
nb portal deploy main
```

TypeScript-Typfehler und fehlende Abhängigkeiten sind die beiden häufigsten Ursachen. Geben Sie die Fehlermeldung an die KI weiter und lassen Sie sie beheben.

**Kollidieren meine manuellen Änderungen mit denen der KI?**

Nein. Der Portal-Quellcode ist ein ganz normales Frontend-Projekt – Sie können jederzeit selbst Hand anlegen und die KI anschließend weitermachen lassen. Solange Sie nicht beide im selben Moment dieselbe Datei bearbeiten, gibt es keine Probleme.

## Verwandte Links

- [Schnellstart Aufbau mit AI Portal](./index.md) – bringen Sie Ihren ersten von der KI geschriebenen Frontend-Einstieg zum Laufen
- [Deployment und Quellcodeverwaltung](./deploy.md) – Portal-Quellcode unter Git stellen sowie der Deployment-Ablauf
- [Projektstruktur und Technologie-Stack](./project-structure.md) – die Verzeichniskonventionen der Vorlage, damit Sie beurteilen können, ob die KI richtig gearbeitet hat
- [Standardkomponenten und Erweiterungen](./components.md) – die shadcn/ui-Komponentenbasis und der Erweiterungsmechanismus
- [Datenmodellierung](../data-modeling.md) – die KI erst die Datentabellen entwerfen lassen, dann die Seiten bauen
- [`nb portal info`](../../api/cli/portal/info.md) – nachsehen, wo der Entwicklungs-Workspace eines Portals liegt
- [`nb portal pull`](../../api/cli/portal/pull.md) – den Quellcode erneut aus dem source storage ziehen
