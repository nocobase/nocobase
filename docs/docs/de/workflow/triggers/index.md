:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

Ein Trigger ist der Einstiegspunkt für einen Workflow. Wenn während der Ausführung der Anwendung ein Ereignis eintritt, das die Bedingungen des Triggers erfüllt, wird der Workflow ausgelöst und ausgeführt. Der Typ des Triggers bestimmt auch den Typ des Workflows. Sie wählen ihn bei der Erstellung des Workflows aus, und er kann danach nicht mehr geändert werden. Die aktuell unterstützten Trigger-Typen sind:

- [Sammlungsereignisse](./collection) (Integriert)
- [Zeitplan](./schedule) (Integriert)
- [Vor-Aktion](./pre-action) (Bereitgestellt vom @nocobase/plugin-workflow-request-interceptor Plugin)
- [Nach-Aktion](./post-action) (Bereitgestellt vom @nocobase/plugin-workflow-action-trigger Plugin)
- [Benutzerdefinierte Aktion](./custom-action) (Bereitgestellt vom @nocobase/plugin-workflow-custom-action-trigger Plugin)
- [Genehmigung](./approval) (Bereitgestellt vom @nocobase/plugin-workflow-approval Plugin)
- [Webhook](./webhook) (Bereitgestellt vom @nocobase/plugin-workflow-webhook Plugin)

Der Zeitpunkt, zu dem jedes Ereignis ausgelöst wird, ist in der folgenden Abbildung dargestellt:

![Workflow-Ereignisse](https://static-docs.nocobase.com/20251029221709.png)

Wenn ein Benutzer beispielsweise ein Formular absendet, oder wenn sich Daten in einer Sammlung durch Benutzeraktionen oder einen Programmaufruf ändern, oder wenn eine geplante Aufgabe ihre Ausführungszeit erreicht, kann ein konfigurierter Workflow ausgelöst werden.

Datenbezogene Trigger (wie Aktionen, Sammlungsereignisse) führen in der Regel Kontextdaten mit sich. Diese Daten dienen als Variablen und können von Knoten im Workflow als Verarbeitungsparameter genutzt werden, um die automatisierte Datenverarbeitung zu ermöglichen. Wenn ein Benutzer beispielsweise ein Formular absendet und der Absende-Button mit einem Workflow verknüpft ist, wird dieser Workflow ausgelöst und ausgeführt. Die übermittelten Daten werden in die Kontextumgebung des Ausführungsplans injiziert, damit nachfolgende Knoten sie als Variablen verwenden können.

Nachdem Sie einen Workflow erstellt haben, wird der Trigger auf der Workflow-Ansichtsseite als Einstiegsknoten am Anfang des Prozesses angezeigt. Ein Klick auf diese Karte öffnet den Konfigurations-Drawer. Je nach Trigger-Typ können Sie die entsprechenden Bedingungen konfigurieren.

![Trigger_Einstiegsknoten](https://static-docs.nocobase.com/20251029222231.png)