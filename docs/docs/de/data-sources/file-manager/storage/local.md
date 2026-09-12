---
title: "Lokaler Speicher"
description: "Die lokale Speicher-Engine speichert Dateien auf der Festplatte des Servers. Sie eignet sich für Einzelserver-Bereitstellungen und ermöglicht die Konfiguration des Speicherpfads und der Zugriffs-URL."
keywords: "Lokaler Speicher,Local Storage,Dateispeicher,Serverfestplatte,NocoBase"
---

# Lokaler Speicher

Hochgeladene Dateien werden in einem lokalen Verzeichnis auf der Festplatte des Servers gespeichert. Dies eignet sich für Szenarien, in denen die Gesamtmenge der vom System verwalteten hochgeladenen Dateien gering ist oder zu Testzwecken.

## Konfigurationsparameter

![Beispiel für die Konfiguration der Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter der lokalen Speicher-Engine vorgestellt. Informationen zu den allgemeinen Parametern finden Sie unter [Allgemeine Parameter der Engine](./index.md#引擎通用参数).
:::

### Path

Gibt sowohl den relativen Pfad an, unter dem Dateien auf dem Server gespeichert werden, als auch den URL-Pfad für den Zugriff. Beispiel: „`user/avatar`“ (ohne ein führendes oder abschließendes „`/`“) steht für:

1. Relativer Pfad, unter dem hochgeladene Dateien auf dem Server gespeichert werden: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. URL-Präfix für den Zugriff: `http://localhost:13000/storage/uploads/user/avatar`.
