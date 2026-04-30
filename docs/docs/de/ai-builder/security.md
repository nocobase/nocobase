---
title: 'Sicherheit und Audit'
description: 'Erfahren Sie, welche Authentifizierungsverfahren und Berechtigungsstrategien beim Aufbau von NocoBase durch einen AI Agent zum Einsatz kommen, welche Praktiken empfohlen werden und wie sich jede einzelne Operation nachvollziehen lässt.'
keywords: 'KI-Builder,Sicherheit,Berechtigung,Authentifizierung,Token,OAuth,Operationsprotokoll,Audit'
---

# Sicherheit und Audit

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

Wenn Benutzer NocoBase über die [NocoBase CLI](../ai/quick-start.md) durch einen AI Agent steuern, sollten Authentifizierung, Berechtigungssteuerung und Audit besondere Aufmerksamkeit erhalten, damit klare Operationsgrenzen sichergestellt sind und der gesamte Vorgang nachvollziehbar bleibt.

## Authentifizierung

Für die Verbindung eines AI Agent mit NocoBase stehen im Wesentlichen zwei Authentifizierungsverfahren zur Verfügung:

- **API-Key-Authentifizierung**: Mit dem Plugin [API keys](/auth-verification/api-keys/index.md) wird ein API Key erzeugt, in der CLI-Umgebung konfiguriert und für nachfolgende Anfragen direkt zur API-Nutzung verwendet
- **OAuth-Authentifizierung**: Über den Browser wird einmalig eine OAuth-Anmeldung durchgeführt; danach erfolgt der API-Zugriff im Namen des aktuellen Benutzers

Beide Verfahren lassen sich in Verbindung mit dem `nb`-Befehl nutzen. Die Unterschiede liegen in Identitätsherkunft, Anwendungsszenario und Risikosteuerungsstrategie.

### API-Key-Authentifizierung

API Keys eignen sich vor allem für automatisierte, skriptbasierte und langfristig laufende Aufgaben, zum Beispiel:

- Lassen Sie einen AI Agent regelmäßig Daten synchronisieren
- In der Entwicklungsumgebung häufiges Aufrufen von `nb api`
- Ausführung einer eindeutigen, stabilen Aufbauaufgabe mit fester Rolle

Der grundlegende Ablauf:

1. Aktivieren Sie in NocoBase das API-keys-Plugin und erstellen Sie einen API Key
2. Weisen Sie diesem API Key eine dedizierte Rolle zu, statt direkt die vollen Berechtigungen von `root` oder eines Administrators zu vergeben
3. Speichern Sie API-Adresse und Token mit `nb env add` in der CLI-Umgebung

Beispiel:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Nach Abschluss der Konfiguration kann der AI Agent über diese Umgebung API-Aufrufe durchführen:

```bash
nb api resource list --env local --resource users
```

Dieses Verfahren ist stabil, eignet sich für Automatisierung und der Benutzer muss sich nicht jedes Mal erneut anmelden. Solange das Token nicht abgelaufen ist, kann jeder, der es besitzt, dauerhaft mit den Berechtigungen der zugewiesenen Rolle auf das System zugreifen. Daher ist besonders zu beachten:

- Token nur an dedizierte Rollen binden
- Nur in den notwendigen CLI-Umgebungen speichern
- Regelmäßig rotieren – „läuft nie ab" sollte nicht die Standardeinstellung sein
- Bei Verdacht auf Kompromittierung sofort löschen und neu erzeugen

Weitere allgemeine Hinweise finden Sie im [NocoBase-Sicherheitsleitfaden](../security/guide.md).

### OAuth-Authentifizierung

OAuth eignet sich vor allem für Aufgaben, die im Namen des aktuell angemeldeten Benutzers ausgeführt werden sollen, zum Beispiel:

- Die KI nimmt für den aktuellen Administrator eine einmalige Konfigurationsanpassung vor
- Operationen sollen einem klar identifizierten angemeldeten Benutzer zugeordnet sein
- Hochberechtigte Token sollen nicht langfristig gespeichert werden

Der grundlegende Ablauf:

1. Fügen Sie zunächst die CLI-Umgebung hinzu und wählen Sie als Authentifizierungstyp `oauth`
2. Führen Sie `nb env auth` aus
3. Der Browser öffnet die Authentifizierungsseite – Anmelden und Authentifizierung abschließen
4. Die CLI speichert die Authentifizierungsinformationen; nachfolgende `nb api`-Anfragen greifen dann im Namen des aktuellen Benutzers auf NocoBase zu
5. Falls der Benutzer mehrere Rollen hat, lässt sich die Rolle über `--role` festlegen

Beispiel:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` startet den Browser-Anmeldevorgang. Nach Erfolg speichert die CLI die Authentifizierungsinformationen in der aktuellen Umgebungskonfiguration, und der AI Agent kann anschließend weiterhin `nb api` aufrufen.

In der derzeitigen Standardimplementierung gilt:

- Die Gültigkeitsdauer des OAuth-Access-Tokens beträgt **10 Minuten**
- Die Gültigkeitsdauer des OAuth-Refresh-Tokens beträgt **30 Tage**

Die CLI nutzt, sobald das Access-Token abzulaufen droht, vorrangig das Refresh-Token, um die Sitzung automatisch zu erneuern. Ist das Refresh-Token bereits abgelaufen, nicht verfügbar oder gibt der Server keines zurück, müssen Sie `nb env auth` erneut ausführen.

Charakteristisch für OAuth ist, dass Anfragen typischerweise im Rolle-Kontext des aktuell angemeldeten Benutzers ausgeführt werden und sich Audit-Aufzeichnungen leichter konkreten Akteuren zuordnen lassen. Dieses Verfahren eignet sich besser für Operationen mit menschlicher Beteiligung und erforderlicher Identitätsbestätigung.

### Empfohlene Praxis

Wir empfehlen folgende Auswahlprinzipien:

- **Entwicklungs-, Test- und Automatisierungsaufgaben**: bevorzugt API Keys verwenden, aber unbedingt an dedizierte Rollen binden
- **Produktionsumgebung, Aufgaben mit menschlicher Beteiligung, starker Identitätszuschreibung**: bevorzugt OAuth verwenden
- **Risikoreiche Operationen**: Auch wenn technisch ein Token möglich wäre, sollten Sie auf OAuth umsteigen und die Authentifizierung von einem Benutzer mit entsprechenden Berechtigungen durchführen lassen

Falls keine eindeutigen Anforderungen vorliegen, können Sie sich an folgenden Standardprinzipien orientieren:

- **Standardmäßig OAuth verwenden**
- **Nur dann API Keys verwenden, wenn ausdrücklich Automatisierung, unbeaufsichtigter Betrieb oder Stapelverarbeitung erforderlich sind**

## Berechtigungssteuerung

Ein AI Agent verfügt selbst über keine „zusätzlichen Berechtigungen". Was er tun kann, hängt vollständig von der aktuell genutzten Identität und Rolle ab.

Anders gesagt:

- Beim Zugriff per API Key wird die Berechtigungsgrenze durch die diesem Token zugewiesene Rolle bestimmt
- Beim Zugriff per OAuth wird die Berechtigungsgrenze durch den aktuell angemeldeten Benutzer und dessen aktuelle Rolle bestimmt

Die KI umgeht das ACL-System von NocoBase nicht. Wenn eine Rolle keine Berechtigung für eine bestimmte Datentabelle, ein Feld, eine Seite oder eine Plugin-Konfiguration hat, kann der AI Agent den entsprechenden Befehl auch dann nicht erfolgreich ausführen, wenn er ihn kennt.

### Rollen und Berechtigungsstrategie

Es wird empfohlen, für den AI Agent eine eigene Rolle einzurichten, statt eine bestehende Administratorrolle wiederzuverwenden.

Diese Rolle benötigt in der Regel nur Berechtigungen in folgenden Bereichen:

- Welche Datentabellen darf sie bearbeiten
- Welche Aktionen darf sie ausführen, etwa Anzeigen, Erstellen, Aktualisieren, Löschen
- Darf sie auf bestimmte Seiten oder Menüs zugreifen
- Darf sie Hochrisikobereiche wie Systemeinstellungen, Plugin-Verwaltung oder Berechtigungskonfiguration betreten

Beispielsweise können Sie eine Rolle `ai_builder_editor` anlegen, die nur Folgendes darf:

- CRM-bezogene Datentabellen verwalten
- Bestimmte Seiten bearbeiten
- Einen Teil der Workflows auslösen
- Keine Änderung der Rollenberechtigungen
- Keine Aktivierung, Deaktivierung oder Installation von Plugins
- Kein Löschen kritischer Datentabellen

Wenn die KI bei der Konfiguration von Berechtigungen helfen soll, können Sie dies in Verbindung mit der [Berechtigungskonfiguration](./acl.md) tun. Es wird jedoch empfohlen, die Berechtigungsgrenzen weiterhin zunächst manuell festzulegen.

### Prinzip der minimalen Berechtigung

Das Prinzip der minimalen Berechtigung ist im KI-Builder-Szenario besonders wichtig. Sie können wie folgt vorgehen:

1. Erstellen Sie zunächst eine dedizierte Rolle für die KI
2. Gewähren Sie ihr anfangs nur Leseberechtigungen
3. Ergänzen Sie schrittweise die für die Aufgabe notwendigen Berechtigungen wie Erstellen oder Bearbeiten
4. Behalten Sie für risikoreiche Operationen wie Löschen, Berechtigungsänderungen oder Plugin-Verwaltung die manuelle Kontrolle

Beispiele:

- Eine KI für die Inhaltspflege benötigt nur Anzeige- und Erstellungsberechtigungen für die Zieldatentabelle
- Eine KI für den Seitenaufbau benötigt nur die zugehörigen Seiten- und UI-Konfigurationsberechtigungen
- Einer KI zur Datenmodellierung gewähren Sie Strukturänderungen nur in der Testumgebung, nicht direkt in der Produktion

Es wird nicht empfohlen, dem AI Agent direkt Rollen wie `root`, `admin` oder Rollen mit globalen Systemkonfigurationsrechten zuzuweisen. Auch wenn dies die Bereitstellung vereinfacht, vergrößert es die Angriffsfläche der Berechtigungen erheblich.

## Protokolle

Im KI-Builder-Szenario dienen Protokolle der Operationsnachverfolgung und der Problemlokalisierung.

Im Fokus stehen zwei Protokollarten:

- **Anfrageprotokolle**: erfassen Pfad, Methode, Statuscode, Dauer und Quelle der API-Anfragen
- **Audit-Protokolle**: erfassen den Akteur, das Operationsobjekt, das Ergebnis und zugehörige Metadaten kritischer Ressourcenoperationen

Beim Aufruf über `nb api` fügt die CLI automatisch den Header `x-request-source: cli` hinzu, sodass der Server erkennen kann, dass die Anfrage von der CLI stammt.

### Anfrageprotokolle

Anfrageprotokolle dienen dazu, Informationen zu API-Aufrufen festzuhalten, einschließlich Anfragepfad, Antwortstatus, Dauer und Herkunftskennzeichnung.

Die Protokolldateien befinden sich üblicherweise unter:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

Im Szenario eines `nb api`-Aufrufs enthält das Anfrageprotokoll Folgendes:

- `req.header.x-request-source`

Daran lassen sich CLI-Anfragen von gewöhnlichen Browseranfragen unterscheiden.

Erläuterungen zu Verzeichnis und Feldern der Anfrageprotokolle finden Sie unter [NocoBase-Serverprotokolle](../log-and-monitor/logger/index.md).

### Audit-Protokolle

Audit-Protokolle erfassen Akteure, Zielressourcen, Ausführungsergebnisse und zugehörige Anfrageinformationen kritischer Operationen.

Für Operationen, die in den Auditbereich aufgenommen wurden, werden im Protokoll folgende Felder erfasst:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Wenn die KI beispielsweise über die CLI `collections:apply`, `fields:apply` oder andere mit aktiviertem Audit versehene Schreiboperationen aufruft, wird im Audit-Protokoll `x-request-source: cli` erfasst, sodass sich Operationen aus der Oberfläche und über die CLI klar unterscheiden lassen.

Eine ausführliche Beschreibung der Audit-Protokolle finden Sie unter [Audit-Protokoll](../security/audit-logger/index.md).

## Sicherheitsempfehlungen

Im Folgenden finden Sie einige Praxisempfehlungen, die besser zum KI-Builder-Szenario passen:

- Weisen Sie dem AI Agent nicht direkt Rollen wie `root`, `admin` oder Rollen mit globaler Systemkonfiguration zu
- Erstellen Sie eine dedizierte Rolle für den AI Agent und gliedern Sie die Berechtigungsgrenzen aufgabenspezifisch
- Rotieren Sie API Keys regelmäßig und vermeiden Sie die langfristige Wiederverwendung desselben hochberechtigten Tokens
- Validieren Sie Änderungen an Datenmodell, Seitenstruktur und Workflows zunächst in der Testumgebung, bevor Sie sie in die Produktion übertragen
- Aktivieren und prüfen Sie regelmäßig Anfrage- und Audit-Protokolle, um die Nachvollziehbarkeit kritischer Operationen sicherzustellen
- Bei Hochrisikooperationen wie Datenlöschung, Berechtigungsänderung, Aktivierung/Deaktivierung von Plugins oder Anpassung von Systemkonfigurationen wird eine manuelle Bestätigung vor der Ausführung empfohlen
- Wenn die KI langfristig laufen muss, teilen Sie sie vorzugsweise auf mehrere Umgebungen mit niedrigeren Berechtigungen auf, statt sich auf eine zentrale Hochberechtigungsumgebung zu verlassen

## Verwandte Links

- [Schnellstart KI-Builder](./index.md) – Installation und Umgebungsvorbereitung
- [Umgebungsverwaltung](./env-bootstrap) – Umgebungsprüfung, Hinzufügen von Umgebungen und Fehlerdiagnose
- [Berechtigungskonfiguration](./acl.md) – Konfiguration von Rollen, Berechtigungsstrategien und Risikobewertung
- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
- [NocoBase-Sicherheitsleitfaden](../security/guide.md) – Umfassendere Empfehlungen zur Sicherheitskonfiguration
- [NocoBase-Serverprotokolle](../log-and-monitor/logger/index.md) – Verzeichnis und Felder der Anfrageprotokolle
- [Audit-Protokoll](../security/audit-logger/index.md) – Felder der Audit-Aufzeichnungen und Nutzungshinweise
- [NocoBase MCP](../ai/mcp/index.md) – Anbindung von AI Agents über das MCP-Protokoll
