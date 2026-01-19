:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Verwendung von Kontextvariablen

Mit Kontextvariablen können Sie Informationen der aktuellen Seite, des Benutzers, der Zeit und der Filter direkt wiederverwenden, um Diagramme kontextbezogen zu rendern und Interaktionen zu ermöglichen.

## Anwendungsbereich
- Datenabfrage im Builder-Modus: Wählen Sie Variablen für Filterbedingungen aus.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Datenabfrage im SQL-Modus: Wählen Sie Variablen aus und fügen Sie Ausdrücke ein (zum Beispiel `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Diagrammoptionen im Custom-Modus: Schreiben Sie JS-Ausdrücke direkt.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Interaktionsereignisse (zum Beispiel ein Klick, um einen Drilldown-Dialog zu öffnen und Daten zu übergeben): Schreiben Sie JS-Ausdrücke direkt.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Hinweis:**
- Verwenden Sie keine einfachen oder doppelten Anführungszeichen für `{{ ... }}`; das System verarbeitet die Bindung sicher basierend auf dem Variablentyp (Zeichenfolge, Zahl, Zeit, NULL).
- Wenn eine Variable `NULL` oder undefiniert ist, behandeln Sie Nullwerte in SQL explizit mithilfe von `COALESCE(...)` oder `IS NULL`.