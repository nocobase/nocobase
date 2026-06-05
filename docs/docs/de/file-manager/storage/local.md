:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Speicher-Engine: Lokaler Speicher

Hochgeladene Dateien werden direkt auf der lokalen Festplatte des Servers gespeichert. Dies ist ideal für Szenarien, in denen das System eine geringe Gesamtmenge an hochgeladenen Dateien verwaltet oder für experimentelle Zwecke.

## Konfigurationsparameter

![Beispiel für die Konfiguration der Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Hinweis}
Dieser Abschnitt stellt nur die spezifischen Parameter der lokalen Speicher-Engine vor. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#引擎通用参数).
:::

### Pfad

Der Pfad repräsentiert sowohl den relativen Pfad für die Dateispeicherung auf dem Server als auch den URL-Zugriffspfad. Zum Beispiel steht „`user/avatar`“ (ohne führende oder abschließende Schrägstriche „`/`“) für:

1.  Der relative Pfad auf dem Server, unter dem hochgeladene Dateien gespeichert werden: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2.  Das URL-Präfix für den Zugriff auf die Dateien: `http://localhost:13000/storage/uploads/user/avatar`.