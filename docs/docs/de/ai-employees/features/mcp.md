---
pkg: "@nocobase/plugin-ai"
title: "KI-Mitarbeiter mit MCP verbinden"
description: "Verbinden Sie KI-Mitarbeiter mit MCP-Diensten, testen Sie die Verfügbarkeit von MCP-Diensten und verwalten Sie Berechtigungen für MCP-Tool-Aufrufe."
keywords: "KI-Mitarbeiter Skills,MCP,Model Context Protocol,tools"
---

# MCP-Anbindung

KI-Mitarbeiter können MCP-Dienste anbinden, die dem Model Context Protocol (MCP) entsprechen. Nach der Anbindung eines MCP-Dienstes können KI-Mitarbeiter die vom MCP-Dienst bereitgestellten Tools nutzen, um Aufgaben zu erledigen.


## MCP-Konfiguration

Im MCP-Konfigurationsmodul können Sie neue MCP-Dienste hinzufügen und bereits angebundene MCP-Dienste verwalten.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## MCP-Dienst hinzufügen

Klicken Sie oben rechts in der MCP-Dienstliste auf die Schaltfläche `Hinzufügen` und geben Sie im Dialogfenster die MCP-Dienst-Verbindungsinformationen ein, um den MCP-Dienst hinzuzufügen.

Es werden die beiden MCP-Dienst-Übertragungsprotokolle Stdio und HTTP (Streamable / SSE) unterstützt.

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Beim Hinzufügen eines MCP-Dienstes müssen Sie `Name`, `Titel` und `Beschreibung` eingeben. Der `Name` ist die eindeutige Kennung des MCP-Dienstes; der `Titel` ist der Name, unter dem der MCP-Dienst im System angezeigt wird; die `Beschreibung` ist optional und dient zur kurzen Beschreibung der vom MCP-Dienst bereitgestellten Funktionen.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio

Beim Hinzufügen eines MCP-Dienstes, der das Stdio-Übertragungsprotokoll unterstützt, müssen Sie den `Befehl` zum Ausführen des MCP-Dienstes sowie die `Befehlsargumente` eingeben. Bei Bedarf können Sie `Umgebungsvariablen` hinzufügen, die für den Befehl zum Ausführen des MCP-Dienstes erforderlich sind.

:::warning Hinweis
Befehle zum Ausführen von MCP-Diensten wie node, npx, uvx, go usw. erfordern, dass die Server-Umgebung, auf der NocoBase bereitgestellt wird, diese unterstützt.

Das Docker-Image von NocoBase unterstützt nur Node.js-Umgebungsbefehle wie node und npx.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Beim Hinzufügen eines MCP-Dienstes, der das HTTP-Übertragungsprotokoll unterstützt, müssen Sie die `URL`-Adresse des MCP-Dienstes eingeben. Bei Bedarf können `Request-Header` hinzugefügt werden.

Das HTTP-Übertragungsprotokoll unterstützt zwei Übertragungsarten: Streamable und SSE. Streamable ist die neu hinzugefügte Übertragungsart im MCP-Standard, die SSE-Übertragungsart wird demnächst eingestellt. Wählen Sie die konkrete Übertragungsart gemäß der Dokumentation des verwendeten MCP-Dienstes.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Verfügbarkeitstest

Beim Hinzufügen und Bearbeiten von MCP-Diensten können Sie nach Eingabe der MCP-Konfigurationsinformationen einen Verfügbarkeitstest für den MCP-Dienst durchführen. Wenn die MCP-Konfigurationsinformationen vollständig und korrekt sind und der MCP-Dienst verfügbar ist, wird eine Erfolgsmeldung des Verfügbarkeitstests zurückgegeben.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## MCP-Dienst anzeigen

Klicken Sie in der MCP-Dienstliste auf die Schaltfläche `Anzeigen`, um die Liste der vom MCP-Dienst bereitgestellten Tools einzusehen.

In der Tool-Liste des MCP-Dienstes können Sie auch die Berechtigungskonfiguration für die Nutzung dieses Tools durch KI-Mitarbeiter festlegen. Wenn die Tool-Berechtigung auf `Ask` gesetzt ist, wird vor jedem Aufruf nachgefragt, ob der Aufruf erlaubt ist; bei `Allow` wird das Tool bei Bedarf direkt aufgerufen.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## MCP-Dienst nutzen

Nachdem Sie im MCP-Konfigurationsmodul den gewünschten MCP-Dienst aktiviert haben, nutzen die KI-Mitarbeiter im Gespräch automatisch die vom MCP-Dienst bereitgestellten Tools, um Aufgaben zu erledigen.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
