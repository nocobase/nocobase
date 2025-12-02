:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Versionsverwaltung

Nachdem ein konfigurierter Workflow mindestens einmal ausgelöst wurde, müssen Sie, wenn Sie die Konfiguration des Workflows oder seine Knoten ändern möchten, zuerst eine neue Version erstellen. Dies stellt gleichzeitig sicher, dass die Ausführungshistorie bereits ausgelöster Workflows bei der Überprüfung nicht durch zukünftige Änderungen beeinflusst wird.

Auf der Konfigurationsseite des Workflows können Sie im Versionsmenü oben rechts die vorhandenen Workflow-Versionen einsehen:

![Workflow-Versionen anzeigen](https://static-docs.nocobase.com/ad93d2c0166b0e3e643fb148713a63f.png)

Im Menü "Weitere Aktionen" ("...") auf der rechten Seite können Sie die aktuell angezeigte Version in eine neue Version kopieren:

![Workflow als neue Version kopieren](https://static-docs.nocobase.com/280798e6caca2af004839a744256.png)

Nachdem Sie eine neue Version kopiert haben, klicken Sie auf den Schalter "Aktivieren"/"Deaktivieren", um die entsprechende Version in den aktivierten Zustand zu versetzen. Danach wird die neue Workflow-Version wirksam.

Wenn Sie eine ältere Version erneut auswählen möchten, wechseln Sie im Versionsmenü zu dieser. Klicken Sie anschließend erneut auf den Schalter "Aktivieren"/"Deaktivieren", um sie in den aktivierten Zustand zu versetzen. Die aktuell angezeigte Version wird dann wirksam, und nachfolgende Auslösungen führen den Prozess dieser Version aus.

Wenn Sie einen Workflow deaktivieren müssen, klicken Sie auf den Schalter "Aktivieren"/"Deaktivieren", um ihn in den deaktivierten Zustand zu versetzen. Danach wird der Workflow nicht mehr ausgelöst.

:::info{title=Tipp}
Im Gegensatz zum "Kopieren" eines Workflows aus der Workflow-Verwaltungsliste wird ein Workflow, der "in eine neue Version kopiert" wurde, weiterhin derselben Workflow-Gruppe zugeordnet, lediglich durch die Version unterschieden. Ein kopierter Workflow wird jedoch als völlig neuer Workflow betrachtet, der unabhängig von den Versionen des vorherigen Workflows ist und dessen Ausführungszähler auf null zurückgesetzt wird.
:::