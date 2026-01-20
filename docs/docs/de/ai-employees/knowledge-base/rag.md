:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# RAG-Abruf

## Einführung

Nachdem Sie die Wissensdatenbank konfiguriert haben, können Sie die RAG-Funktion in den Einstellungen des KI-Mitarbeiters aktivieren.

Wenn RAG aktiviert ist, nutzt der KI-Mitarbeiter beim Dialog mit einem Benutzer den RAG-Abruf. Er ruft Dokumente aus der Wissensdatenbank basierend auf der Nachricht des Benutzers ab und antwortet dann auf Grundlage dieser abgerufenen Dokumente.

## RAG aktivieren

Navigieren Sie zur Konfigurationsseite des KI-Mitarbeiter-Plugins und klicken Sie auf den Tab `AI employees`, um zur Verwaltungsseite der KI-Mitarbeiter zu gelangen.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Wählen Sie den KI-Mitarbeiter aus, für den Sie RAG aktivieren möchten, und klicken Sie auf die Schaltfläche `Edit`, um die Bearbeitungsseite des KI-Mitarbeiters aufzurufen.

Im Tab `Knowledge base` schalten Sie den `Enable`-Schalter ein.

- Geben Sie im Feld `Knowledge Base Prompt` den Prompt ein, der auf die Wissensdatenbank verweist. `{knowledgeBaseData}` ist ein fester Platzhalter und darf nicht geändert werden.
- Wählen Sie unter `Knowledge Base` die konfigurierte Wissensdatenbank aus. Siehe: [Wissensdatenbank](/ai-employees/knowledge-base/knowledge-base).
- Geben Sie im Eingabefeld `Top K` die Anzahl der abzurufenden Dokumente ein; der Standardwert ist 3.
- Im Eingabefeld `Score` geben Sie den Schwellenwert für die Dokumentrelevanz beim Abruf ein.

Klicken Sie auf die Schaltfläche `Submit`, um die Einstellungen des KI-Mitarbeiters zu speichern.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)