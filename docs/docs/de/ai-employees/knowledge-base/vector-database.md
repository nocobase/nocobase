:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Vektordatenbank

## Einführung

In einer Wissensdatenbank speichert die Vektordatenbank vektorisierte Dokumente. Diese vektorisierten Dokumente fungieren als Index für die eigentlichen Inhalte.

Wenn die RAG-Retrieval-Funktion in einer KI-Agenten-Konversation aktiviert ist, wird die Nachricht des Benutzers vektorisiert. Anschließend werden relevante Fragmente aus den Wissensdatenbank-Dokumenten in der Vektordatenbank gesucht, um passende Dokumentenabschnitte und den Originaltext zu finden.

Aktuell unterstützt das AI Wissensdatenbank Plugin nativ nur PGVector als Vektordatenbank. PGVector ist ein Plugin für PostgreSQL-Datenbanken.

## Vektordatenbank-Verwaltung

Navigieren Sie zur Konfigurationsseite des AI Agenten Plugins. Klicken Sie dort auf den Tab `Vector store` und wählen Sie anschließend `Vector database`, um zur Verwaltungsseite der Vektordatenbank zu gelangen.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klicken Sie oben rechts auf den Button `Add new`, um eine neue `PGVector` Vektordatenbank-Verbindung hinzuzufügen:

- Geben Sie im Feld `Name` den Verbindungsnamen ein.
- Geben Sie im Feld `Host` die IP-Adresse der Vektordatenbank ein.
- Geben Sie im Feld `Port` die Portnummer der Vektordatenbank ein.
- Geben Sie im Feld `Username` den Benutzernamen für die Vektordatenbank ein.
- Geben Sie im Feld `Password` das Passwort für die Vektordatenbank ein.
- Geben Sie im Feld `Database` den Namen der Vektordatenbank ein.
- Geben Sie im Feld `Table name` den Tabellennamen ein. Dieser wird verwendet, wenn Sie eine neue Tabelle zum Speichern von Vektordaten erstellen.

Nachdem Sie alle erforderlichen Informationen eingegeben haben, klicken Sie auf den Button `Test`, um die Verfügbarkeit des Vektordatenbankdienstes zu prüfen. Klicken Sie anschließend auf den Button `Submit`, um die Verbindungsinformationen zu speichern.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)