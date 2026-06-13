---
title: "nb app upgrade"
description: "Referenz für den Befehl nb app upgrade: Anwendung stoppen, gespeicherten Quellcode oder das Image ersetzen und die angegebene NocoBase-Anwendung aktualisieren und starten."
keywords: "nb app upgrade,NocoBase CLI,Upgrade,Aktualisieren,Docker-Image"
---

# nb app upgrade

Aktualisiert die angegebene NocoBase-Anwendung. Die CLI stoppt zuerst die aktuelle Anwendung, ersetzt standardmäßig den gespeicherten Quellcode oder das Image, synchronisiert kommerzielle Plugins, aktualisiert und startet die Anwendung und aktualisiert am Ende die env-Laufzeit. Docker-envs erstellen beim Start den Anwendungs-Container anhand der gespeicherten env-Konfiguration neu.

## Verwendung

```bash
nb app upgrade [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu aktualisierenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--force`, `-f` | boolean | Die Upgrade-Bestätigung überspringen. In nicht interaktiven Terminals und AI-Agent-Sitzungen muss dieser Flag explizit gesetzt werden |
| `--skip-download`, `-s` | boolean | Den Download von Quellcode oder Image überspringen und den Upgrade-und-Start-Ablauf mit dem aktuell gespeicherten lokalen Quellcode oder Docker-Image ausführen; überspringt auch `nb license plugins sync` |
| `--version` | string | Überschreibt die Zielversion für dieses Upgrade; bei Erfolg wird die neue Version in `downloadVersion` der env-Konfiguration zurückgeschrieben |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Aktualisierungs- und Neustartbefehle anzeigen |

## Beispiele

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

Bevor das eigentliche Upgrade startet, fragt ein interaktives Terminal zusätzlich nach einer Upgrade-Bestätigung, sofern Sie nicht ausdrücklich `--force` übergeben. In nicht interaktiven Terminals und AI-Agent-Sitzungen verweigert `nb app upgrade` die Ausführung ohne `--force` und gibt einen direkt kopierbaren Befehl zum erneuten Ausführen aus. Wenn es sich gleichzeitig um eine cross-env-Operation handelt, werden sowohl `--yes` als auch `--force` benötigt.

Standardmäßig führt `nb app upgrade` diese Schritte aus:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. Die neue `downloadVersion` bei Bedarf speichern
6. `nb env update`

Wenn `--skip-download` übergeben wird, überspringt die CLI die Schritte 2 und 3 und führt den Upgrade-und-Start-Ablauf direkt mit dem aktuell gespeicherten Quellcode oder Image aus. Wenn zusätzlich `--version` übergeben wird, lädt die CLI diese Version in diesem Durchlauf nicht herunter, sondern speichert sie nach einem erfolgreichen Start nur als neue `downloadVersion`, damit spätere Upgrades sie verwenden können.

Schritt 4 führt auf Basis des aktuellen Codestands automatisch die nötigen Upgrade-Vorbereitungen aus und wartet dann darauf, dass die Anwendung `__health_check` besteht. Währenddessen gibt die CLI zuerst eine Wartezeile und danach alle 10 Sekunden eine Fortschrittszeile aus, bis die Anwendung bereit ist oder der Health-Check ein Timeout erreicht.

Wenn der letzte Schritt `nb env update` fehlschlägt, gilt das Upgrade trotzdem als erfolgreich. Die CLI gibt eine Warnung aus und fordert Sie auf, `nb env update <envName>` anschließend manuell auszuführen.

## Verwandte Befehle

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
