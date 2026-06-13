---
title: 'nb app stop'
description: 'Referenz für den Befehl nb app stop: Stoppt die NocoBase-Anwendung der angegebenen env und bereinigt bei Bedarf auch den von der CLI verwalteten integrierten Datenbank-Container.'
keywords: 'nb app stop,NocoBase CLI,Anwendung stoppen,Docker,with-db,integrierte Datenbank'
---

# nb app stop

Stoppt die NocoBase-Anwendung der angegebenen env. Bei npm-/Git-Installationen wird der lokale Anwendungsprozess gestoppt, bei Docker-Installationen wird der gespeicherte Anwendungs-Container bereinigt.

Wenn du `--with-db` angibst und diese env eine von der CLI verwaltete integrierte Datenbank verwendet, bereinigt der Befehl auch den Datenbank-Container. Wenn diese env eine externe Datenbank verwendet, werden die Datenbankressourcen nicht angerührt.

## Verwendung

```bash
nb app stop [flags]
```

## Parameter

| Parameter     | Typ     | Beschreibung                                                                                                               |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Name der CLI-env, die gestoppt werden soll; wenn weggelassen, wird die aktuelle env verwendet                              |
| `--yes`, `-y` | boolean | Überspringt die interaktive Bestätigung, wenn die durch `--env` explizit angegebene env nicht der aktuellen env entspricht |
| `--with-db`   | boolean | Bereinigt auch den Datenbank-Container, wenn eine von der CLI verwaltete integrierte Datenbank vorhanden ist               |
| `--verbose`   | boolean | Zeigt die Ausgabe der zugrunde liegenden lokalen oder Docker-Befehle an                                                    |

## Beispiele

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Hinweise

Die CLI prüft nur dann, ob die angegebene env mit der aktuellen env übereinstimmt, wenn du `--env` explizit übergibst. Wenn du explizit eine andere env angibst, wird in einem interaktiven Terminal zuerst eine Bestätigung abgefragt; in einem nicht interaktiven Terminal oder in einem KI-Agent-Szenario musst du selbst explizit `--yes` hinzufügen oder zuerst `nb env use <name>` ausführen und es dann erneut versuchen.

`--with-db` wirkt sich nur auf von der CLI verwaltete integrierte Datenbank-Container aus. Wenn du normalerweise nur die Anwendung selbst stoppen möchtest, brauchst du dieses Flag nicht; füge es nur hinzu, wenn du auch die Laufzeit der integrierten Datenbank auf dem aktuellen Rechner stoppen möchtest.

Dieser Befehl kann nur lokale oder Docker-Runtimes auf dem aktuellen Rechner bedienen. Wenn eine env nur eine HTTP-API-Verbindung ist oder eine reservierte SSH-env darstellt, kann `nb app stop` sie nicht für dich remote stoppen.

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
