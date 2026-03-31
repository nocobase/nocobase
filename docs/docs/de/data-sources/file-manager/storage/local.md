:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Lokaler Speicher

Hochgeladene Dateien werden in einem lokalen Verzeichnis auf dem Server gespeichert. Dies ist ideal für Szenarien, in denen die Gesamtanzahl der vom System verwalteten Dateien gering ist, oder für experimentelle Zwecke.

## Konfigurationsoptionen

![Beispiel für Konfigurationsoptionen der Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Hinweis}
Dieser Abschnitt behandelt ausschließlich die spezifischen Optionen für die lokale Speicher-Engine. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#allgemeine-engine-parameter).
:::

### Pfad

Der Pfad repräsentiert sowohl den relativen Speicherort der Datei auf dem Server als auch den URL-Zugriffspfad. Zum Beispiel steht "`user/avatar`" (ohne führenden und abschließenden „`/`“) für:

1. Der relative Pfad der hochgeladenen Datei auf dem Server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Das URL-Präfix für den Zugriff auf die Datei: `http://localhost:13000/storage/uploads/user/avatar`.