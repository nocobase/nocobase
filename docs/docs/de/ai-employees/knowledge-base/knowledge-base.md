:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Wissensdatenbank

## Einführung

Die Wissensdatenbank bildet die Grundlage für die RAG-Retrieval. Sie organisiert Dokumente nach Kategorien und erstellt einen Index. Wenn ein KI-Mitarbeiter eine Frage beantwortet, sucht er die Antworten vorrangig in der Wissensdatenbank.

## Verwaltung der Wissensdatenbank

Navigieren Sie zur Konfigurationsseite des KI-Mitarbeiter-Plugins und klicken Sie auf den Tab `Knowledge base`, um die Seite zur Verwaltung der Wissensdatenbank aufzurufen.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klicken Sie oben rechts auf die Schaltfläche `Add new`, um eine `Lokale` Wissensdatenbank hinzuzufügen.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Geben Sie die erforderlichen Informationen für die neue Wissensdatenbank ein:

- Geben Sie im Eingabefeld `Name` den Namen der Wissensdatenbank ein;
- Wählen Sie unter `File storage` den Dateispeicherort aus;
- Wählen Sie unter `Vector store` den Vektorspeicher aus. Weitere Informationen finden Sie unter [Vektorspeicher](/ai-employees/knowledge-base/vector-store);
- Geben Sie im Eingabefeld `Description` eine Beschreibung der Wissensdatenbank ein;

Klicken Sie auf die Schaltfläche `Submit`, um die Wissensdatenbank zu erstellen.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Dokumentenverwaltung der Wissensdatenbank

Nachdem Sie die Wissensdatenbank erstellt haben, klicken Sie auf der Listenseite der Wissensdatenbanken auf die soeben erstellte Wissensdatenbank, um die Seite zur Dokumentenverwaltung der Wissensdatenbank aufzurufen.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Klicken Sie auf die Schaltfläche `Upload`, um Dokumente hochzuladen. Nach dem Hochladen der Dokumente beginnt die Vektorisierung automatisch. Warten Sie, bis sich der `Status` von `Pending` zu `Success` ändert.

Die Wissensdatenbank unterstützt derzeit folgende Dokumenttypen: txt, pdf, doc, docx, ppt, pptx; PDFs unterstützen nur reinen Text.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Typen von Wissensdatenbanken

### Lokale Wissensdatenbank

Eine Lokale Wissensdatenbank ist eine Wissensdatenbank, die direkt in NocoBase gespeichert wird. Sowohl die Dokumente als auch deren Vektordaten werden von NocoBase lokal gespeichert.

![20251023101620](https://static-docs.nocobase.com/2025101620.png)

### Nur-Lese-Wissensdatenbank

Eine Nur-Lese-Wissensdatenbank ist eine schreibgeschützte Wissensdatenbank. Die Dokumente und Vektordaten werden extern verwaltet. In NocoBase wird lediglich eine Verbindung zur Vektordatenbank hergestellt (derzeit wird nur PGVector unterstützt).

![20251023101743](https://static-docs.nocobase.com/2025101743.png)

### Externe Wissensdatenbank

Eine Externe Wissensdatenbank ist eine Wissensdatenbank, bei der Dokumente und Vektordaten extern verwaltet werden. Die Abfrage der Vektordatenbank erfordert eine Erweiterung durch Entwickler, wodurch auch Vektordatenbanken genutzt werden können, die derzeit von NocoBase nicht direkt unterstützt werden.

![20251023101949](https://static-docs.nocobase.com/2025101949.png)