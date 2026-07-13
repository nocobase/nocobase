---
pkg: '@nocobase/plugin-file-manager'
title: "Stabile URL (Proxy-URL)"
description: "Beschreibt Format, Berechtigungen, Weiterleitungen und das Verhalten stabiler Datei-URLs in NocoBase."
keywords: "stabile URL,Proxy-URL,permanente URL,Dateizugriff,Office-Vorschau,NocoBase"
---

# Stabile URL

Dateien, die von einer NocoBase-Speicher-Engine verwaltet werden, sind über eine **stabile URL** erreichbar. NocoBase prüft zuerst den Dateidatensatz und die Berechtigungen und leitet anschließend zur tatsächlichen Speicher-URL weiter.

## Format

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Bei `APP_PUBLIC_PATH=/nocobase` beginnt der Pfad mit `/nocobase/files/`. ID und Erweiterung können nach dem Erstellen nicht geändert werden. Daher bleibt die URL stabil, solange der Datensatz existiert.

| Zweck | URL | Verhalten |
|---|---|---|
| Öffnen | `/files/.../42.pdf` | Prüft die Berechtigung und leitet zur Datei weiter |
| Vorschau | `/files/.../42.png?preview=1` | Leitet zur Vorschau oder Miniaturansicht weiter |
| Download | `/files/.../42.pdf?download=1` | Leitet mit Download-Semantik weiter |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Kurzzeitiger Zugriff für Office Online Viewer |

## Verhalten in NocoBase

- Anhangsfelder, Dateitabellen und die [HTTP API](./http-api.md) geben stabile URLs in `url` und `preview` zurück
- Markdown speichert die stabile URL und unterstützt private S3-, OSS-, COS- und S3-Pro-Speicher
- Das Anhang-URL-Feld behält manuell eingegebene externe URLs bei und verwendet für verwaltete Uploads die stabile URL
- Normale Vorschauen verwenden die aktuelle NocoBase-Sitzung und die Dateiberechtigungen
- Öffentliche Formulare gewähren nur begrenzten Zugriff auf Dateien, die in der aktuellen Formularsitzung hochgeladen wurden

## Office-Vorschau

Microsoft Office Online Viewer kann das NocoBase-Cookie des Benutzers nicht verwenden. Beim Öffnen prüft NocoBase zuerst die Berechtigung und stellt dann eine temporäre, an die Datei gebundene URL aus. Sie gilt standardmäßig 10 Minuten und kann mit `TEMPORARY_FILE_ACCESS_EXPIRES_IN` auf 5 bis 10 Minuten eingestellt werden.

Speichere diese URL nicht in Feldern, Markdown oder Geschäftsdaten und verwende sie nicht als Freigabelink.

## Hinweise

- Stabil bedeutet nicht öffentlich; der Empfänger benötigt weiterhin eine Berechtigung
- Löschen oder Verschieben des Datensatzes macht die alte URL ungültig
- Die Antwort ist eine `302`-Weiterleitung, der Clients folgen müssen
- `302 Location` und `temporaryAccessToken` dürfen nicht dauerhaft gespeichert werden
- Der Reverse Proxy muss `/files/` unter `APP_PUBLIC_PATH` an NocoBase weiterleiten. Bei einer Bereitstellung unter einem Unterpfad sollte zusätzlich die kompatible Route `/files/` auf Root-Ebene erhalten bleiben. Von der NocoBase CLI erzeugte Konfigurationen enthalten beide Regeln automatisch
- Verwende für jeden unabhängigen NocoBase-Dienst einen eigenen `hostname`, statt die Dienste nur durch Ports zu unterscheiden. Browser-Cookies werden nicht nach Port getrennt; weitere Informationen findest du unter [Bereitstellung in einer Produktionsumgebung](../get-started/deployment/production.md)
- Unteranwendungen innerhalb derselben NocoBase-Bereitstellung werden anhand des Anwendungsnamens unterschieden und benötigen keine eigenen Hostnames. Ein unabhängiger Dienst auf einem anderen Port muss jedoch weiterhin über einen eigenen Hostname isoliert werden, wenn er eine Haupt- oder Unteranwendung mit demselben Namen enthält

## Verwandte Links

- [HTTP API](./http-api.md) — Dateien hochladen und abfragen
- [Dateivorschau](./file-preview/index.md) — Unterstützte Vorschauformate
- [Office-Dateivorschau](./file-preview/ms-office.md) — Office Viewer konfigurieren
- [Speicher-Engines](./storage/index.md) — Speicher konfigurieren
