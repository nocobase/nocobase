---
pkg: '@nocobase/plugin-ai'
title: 'AI Chat box-Block'
description: 'Benutzerhandbuch für NocoBase-Administratoren und Seitenersteller zum Hinzufügen eines AI Chat box-Blocks, Konfigurieren der Chatfunktionen, Festlegen des Work context, Verwalten von Unterhaltungen und Hinzufügen von Actions.'
keywords: 'AI Chat box,KI-Mitarbeiter,Seitenblock,Work context,Scope,Actions,NocoBase'
---

# AI Chat box-Block

In NocoBase ist die **AI Chat box** ein KI-Chatblock, der direkt zu einer Seite hinzugefügt werden kann. Sie können ihn auf einer Geschäftsseite platzieren, um einen festen Zugang zu einem KI-Assistenten für diese Seite bereitzustellen.

Jeder AI Chat box-Block besitzt einen eigenen aktuellen Chat- und Eingabestatus. Seitenersteller können außerdem die verfügbaren KI-Mitarbeiter, Modelle, Datei-Uploads, Websuche und den Arbeitskontext passend zum jeweiligen Geschäftsszenario einschränken.

:::tip Vorbereitungen

[Konfigurieren Sie zunächst einen LLM-Dienst](../features/llm-service.md) und [aktivieren Sie mindestens einen KI-Mitarbeiter](../features/enable-ai-employee.md).

:::

## AI Chat box-Block hinzufügen

1. Öffnen Sie die Seite, die Sie konfigurieren möchten.
2. Klicken Sie oben rechts auf `UI Editor`, um den Seitenbearbeitungsmodus zu öffnen.
3. Klicken Sie auf `Add block`.
4. Wählen Sie unter `Other blocks` den Eintrag `AI chat box` aus.

![AI chat box im Menü Add block auswählen](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Aufbau des Blocks

![AI Chat box-Block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

Die AI Chat box besteht von oben nach unten aus drei Bereichen:

- **Oberer Aktionsbereich** — Zugang zur Chatliste, Actions, benutzerdefinierte Aktionen und Schaltfläche für einen neuen Chat; bei ausgeblendetem Nachrichtenbereich erscheint zusätzlich eine Nachrichtenschaltfläche
- **Nachrichtenbereich** — zeigt die Nachrichten des aktuellen Entwurfs oder Chats an
- **Sendebereich** — Eingabefeld, Kontextauswahl, Datei-Upload, Websuche, Auswahl des KI-Mitarbeiters, Modellauswahl, Sendeschaltfläche und Haftungsausschluss

### Anzeigeinhalte im Block-body hinzufügen

Klicken Sie im Seitenbearbeitungsmodus innerhalb der AI Chat box auf `Add block`, um oberhalb des Chatbereichs einen der folgenden Blöcke hinzuzufügen:

- JS block
- Iframe
- Markdown

Diese Blöcke eignen sich für Anleitungen, externe Seiten oder ergänzende Informationen. Das interne Menü stellt nur diese drei Blocktypen bereit und erlaubt keine weitere verschachtelte AI Chat box.

## AI Chat box konfigurieren

Bewegen Sie den Mauszeiger über den Block und öffnen Sie das Einstellungsmenü. Klicken Sie auf `Edit chat box`, um Chatbereich, Standardnachricht, Work context, KI-Mitarbeiter und Modelle zu konfigurieren.

![Dialog Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Einstellungen unter Edit chat box

| Einstellung | Beschreibung |
| --- | --- |
| `Scope` | Steuert, welche AI Chat boxes eine Chatliste gemeinsam verwenden. Ein neuer Block nutzt standardmäßig seine eigene Block-UID, um Chats voneinander zu trennen. |
| `Background` | Fügt nach der Definition des KI-Mitarbeiters einen System-Prompt hinzu, um Rolle, Ziel oder Antwortanforderungen der aktuellen Seite festzulegen. |
| `Default user message` | Füllt beim Start eines neuen Chats eine Standardbenutzernachricht im Sendebereich vor. |
| `Work context` | Wählt Seitenblöcke aus, die standardmäßig in einen neuen Entwurf aufgenommen werden. |
| `AI employees` | Beschränkt die geschäftlichen KI-Mitarbeiter, die in diesem Block ausgewählt werden können. Leer lassen, um alle verfügbaren geschäftlichen KI-Mitarbeiter zuzulassen. |
| `Models` | Beschränkt die Modelle, die in diesem Block ausgewählt werden können. Leer lassen, um alle verfügbaren Modelle zuzulassen. |

### Weitere Blockeinstellungen

| Einstellung | Beschreibung |
| --- | --- |
| `Show messages` | Steuert, ob der Nachrichtenbereich direkt im Block angezeigt wird. Wenn deaktiviert, öffnen Sie das rechte Panel über die Nachrichtenschaltfläche im oberen Bereich. |
| `Sender placeholder` | Ändert den Platzhaltertext im Sendebereich. |
| `Enable add context` | Blendet den Einstieg zur Kontextauswahl im Sendebereich ein oder aus. |
| `Enable upload files` | Blendet den Datei-Upload ein oder aus. Wenn deaktiviert, startet auch das Einfügen einer Datei keinen Upload. |
| `Enable web search` | Blendet den Schalter für die Websuche ein oder aus. Beim Deaktivieren wird auch die Websuche des aktuellen Entwurfs ausgeschaltet. |
| `Enable employee select` | Blendet die Auswahl des KI-Mitarbeiters ein oder aus. |
| `Enable model select` | Blendet die Modellauswahl ein oder aus. |
| `Show disclaimer` | Blendet den KI-Haftungsausschluss unter dem Sendebereich ein oder aus. |

## Work context konfigurieren

Klicken Sie unter `Edit chat box` bei `Work context` auf die Schaltfläche zum Hinzufügen eines Kontexts, wählen Sie `Pick block` und anschließend den Seitenblock aus, den Sie der KI bereitstellen möchten. Nach dem Speichern wird der ausgewählte Block zum Standardarbeitskontext neuer Chats und kann vor dem Senden im Sendebereich entfernt werden.

## Nachrichten ausblenden und das rechte Panel verwenden

Nach dem Deaktivieren von `Show messages` bleibt im Block-body nur der Sendebereich sichtbar. Oben erscheint eine Nachrichtenschaltfläche, über die Sie das Nachrichtenpanel von rechts öffnen können.

![Rechtes Nachrichtenpanel bei ausgeblendetem Nachrichtenbereich](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Wenn das Panel geöffnet ist, wird der restliche Block von einer Überlagerung abgedeckt. Klicken Sie auf die Überlagerung oder erneut auf die Nachrichtenschaltfläche, um das Panel zu schließen.

Dieses Layout eignet sich, wenn die AI Chat box als kompakter Eingabeeinstieg auf einer Seite verwendet wird: Normalerweise bleibt nur der Sendebereich sichtbar, und das Panel wird bei Bedarf zum Lesen der Nachrichten geöffnet.

## Chatverlauf verwalten

Klicken Sie oben links im Block auf die Schaltfläche für die Chatliste, um den Verlauf im aktuellen Scope anzuzeigen.

Beachten Sie dabei folgende Regeln:

- Mehrere AI Chat boxes mit demselben Scope können dieselbe Chatliste anzeigen
- Jeder Block besitzt weiterhin einen eigenen aktuellen Chat, Sendeentwurf, KI-Mitarbeiter, ein eigenes Modell sowie eigene Anhänge und Kontextzustände
- Die globale schwebende Chatbox filtert nicht nach dem Block-Scope und blendet Chats mit Scope daher nicht aus
- Nach dem Leeren von Scope wird die Chatliste nicht mehr nach Scope gefiltert und zeigt sowohl Chats ohne Scope als auch Chats mit anderen Scopes an

Normalerweise reicht es aus, den für einen neuen Block erzeugten Scope beizubehalten, um die Verläufe der Seitenassistenten voneinander zu trennen. Konfigurieren Sie denselben Scope nur, wenn mehrere Blöcke dieselbe Chatliste gemeinsam verwenden sollen.

## Actions hinzufügen

Klicken Sie im Seitenbearbeitungsmodus oben im Block auf `Actions`, um eine der folgenden Aktionen hinzuzufügen:

- JS Action
- AI employee

Nach dem Hinzufügen eines AI employee können Sie Shortcut-Aufgaben für diesen Mitarbeiter konfigurieren.

Die Einstellung `Chat box uid` einer Shortcut-Aufgabe legt fest, in welcher AI Chat box die Aufgabe ausgeführt wird. Ein direkt innerhalb einer AI Chat box hinzugefügter AI employee verweist standardmäßig auf die UID des aktuellen Blocks.

Wenn die angegebene AI Chat box nicht eingebunden ist, meldet NocoBase, dass der Zielblock nicht gefunden wurde, und weicht nicht auf die globale schwebende Chatbox aus. Ausführliche Informationen finden Sie unter [Shortcut-Aufgaben für KI-Mitarbeiter](../features/task.md).

## Seitenspezifischen Assistenten konfigurieren

Mit den folgenden Schritten erstellen Sie einen kompakten KI-Assistenten für eine Seite:

1. Fügen Sie einen AI Chat box-Block hinzu und verschieben Sie ihn an die passende Position auf der Seite.
2. Geben Sie unter `Edit chat box` einen seitenspezifischen Background ein.
3. Wählen Sie einen oder mehrere Work contexts aus.
4. Beschränken Sie unter `AI employees` und `Models` die verfügbaren Mitarbeiter und Modelle.
5. Beenden Sie den Bearbeitungsmodus, geben Sie eine Frage ein und senden Sie sie.

## Hinweise

- Der AI Chat box-Block und die globale schwebende Chatbox unten rechts sind getrennte Einstiegspunkte; der aktuelle Chat und der Eingabestatus werden nicht automatisch synchronisiert
- Innerhalb einer AI Chat box können über `Add block` nur JS block, Iframe und Markdown hinzugefügt werden
- Eine Änderung von Scope beeinflusst den Abfragebereich der Chatliste und kopiert weder den aktuell in einem anderen Block geöffneten Chat noch dessen Entwurf
