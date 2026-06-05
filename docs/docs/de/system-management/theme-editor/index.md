:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Themen-Editor

> Die aktuelle Themenfunktion basiert auf Ant Design 5.x. Wir empfehlen Ihnen, sich vor dem Lesen dieses Dokuments mit den Konzepten zur [Anpassung von Themen](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) vertraut zu machen.

## Einführung

Das Themen-Editor-**Plugin** dient dazu, die Stile der gesamten Frontend-Seite anzupassen. Aktuell können Sie globale [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken) und [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken) bearbeiten. Zudem können Sie zwischen dem `Dark Mode` und dem `Compact Mode` [wechseln](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95). Zukünftig ist möglicherweise auch eine thematische Anpassung auf [Komponentenebene](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token) geplant.

## Anwendungsanleitung

### Das Themen-Editor-Plugin aktivieren

Aktualisieren Sie NocoBase zunächst auf die neueste Version (v0.11.1 oder höher). Suchen Sie anschließend auf der Seite der **Plugin**-Verwaltung nach der Karte `Themen-Editor`. Klicken Sie unten rechts auf der Karte auf die Schaltfläche `Aktivieren` und warten Sie, bis die Seite aktualisiert wird.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Zur Themenkonfigurationsseite navigieren

Nachdem Sie das **Plugin** aktiviert haben, klicken Sie auf die Einstellungen-Schaltfläche unten links auf der Karte, um zur Themenbearbeitungsseite zu gelangen. Standardmäßig stehen Ihnen vier Themenoptionen zur Verfügung: `Standard-Thema`, `Dark-Thema`, `Kompaktes Thema` und `Kompaktes Dark-Thema`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Ein neues Thema hinzufügen

Klicken Sie auf die Schaltfläche `Neues Thema hinzufügen` und wählen Sie `Ein brandneues Thema erstellen`. Auf der rechten Seite der Seite öffnet sich dann der Themen-Editor, in dem Sie Optionen wie `Farben`, `Größen`, `Stile` und mehr bearbeiten können. Geben Sie nach der Bearbeitung einen Themennamen ein und klicken Sie auf `Speichern`, um das neue Thema zu erstellen.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Ein neues Thema anwenden

Bewegen Sie den Mauszeiger in die obere rechte Ecke der Seite, um die Themenauswahl zu sehen. Klicken Sie darauf, um zu anderen Themen zu wechseln, beispielsweise zu dem gerade hinzugefügten Thema.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Ein bestehendes Thema bearbeiten

Klicken Sie unten links auf der Karte auf die Schaltfläche `Bearbeiten`. Auf der rechten Seite der Seite öffnet sich dann der Themen-Editor (ähnlich wie beim Hinzufügen eines neuen Themas). Klicken Sie nach der Bearbeitung auf `Speichern`, um die Änderungen am Thema abzuschließen.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Benutzerdefinierte Themen festlegen

Neu hinzugefügte Themen können Benutzer standardmäßig wechseln. Wenn Sie nicht möchten, dass Benutzer zu einem bestimmten Thema wechseln können, deaktivieren Sie den Schalter `Vom Benutzer wählbar` unten rechts auf der Themenkarte. Dadurch wird verhindert, dass Benutzer zu diesem Thema wechseln können.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Als Standard-Thema festlegen

Im Ausgangszustand ist das Standard-Thema das `Standard-Thema`. Wenn Sie ein bestimmtes Thema als Standard festlegen möchten, aktivieren Sie den Schalter `Standard-Thema` unten rechts auf der Themenkarte. Dadurch wird sichergestellt, dass Benutzer dieses Thema sehen, wenn sie die Seite zum ersten Mal öffnen. Beachten Sie: Das Standard-Thema kann nicht gelöscht werden.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Ein Thema löschen

Klicken Sie unterhalb der Karte auf die Schaltfläche `Löschen` und bestätigen Sie im daraufhin erscheinenden Dialogfeld, um das Thema zu löschen.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)