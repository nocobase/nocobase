:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Validierungsregeln festlegen

## Einführung

Validierungsregeln stellen sicher, dass die von Benutzern eingegebenen Daten den Erwartungen entsprechen.

## Wo Sie Feld-Validierungsregeln festlegen können

### Validierungsregeln für Sammlungsfelder konfigurieren

Die meisten Felder unterstützen die Konfiguration von Validierungsregeln. Sobald für ein Feld Validierungsregeln konfiguriert sind, wird beim Übermitteln von Daten eine Backend-Validierung ausgelöst. Verschiedene Feldtypen unterstützen unterschiedliche Validierungsregeln.

- **Datumsfeld**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Zahlenfeld**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Textfeld**

  Textfelder können nicht nur die Textlänge begrenzen, sondern unterstützen auch benutzerdefinierte reguläre Ausdrücke für eine präzisere Validierung.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Frontend-Validierung in der Feldkonfiguration

Validierungsregeln, die Sie in der Feldkonfiguration festlegen, lösen eine Frontend-Validierung aus, um sicherzustellen, dass die Benutzereingaben den Vorgaben entsprechen.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Textfelder** unterstützen auch benutzerdefinierte Regex-Validierungen, um spezifische Formatanforderungen zu erfüllen.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)