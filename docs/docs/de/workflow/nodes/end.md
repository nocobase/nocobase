:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Workflow beenden
Dieser Knoten beendet bei Ausführung sofort den aktuellen Workflow mit dem im Knoten konfigurierten Status. Er wird typischerweise für die Ablaufsteuerung basierend auf spezifischer Logik eingesetzt, um den aktuellen Workflow zu verlassen, sobald bestimmte Bedingungen erfüllt sind, und die weitere Ausführung nachfolgender Prozesse zu unterbrechen. Dies ist vergleichbar mit dem `return`-Befehl in Programmiersprachen, der zum Beenden der aktuellen Funktion dient.

## Knoten hinzufügen
In der Workflow-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Workflow, um einen „Workflow beenden“-Knoten hinzuzufügen:

![结束流程_添加](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Knotenkonfiguration

![结束流程_节点配置](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Endstatus
Der Endstatus beeinflusst den finalen Status der Workflow-Ausführung. Er kann als „Erfolgreich“ oder „Fehlgeschlagen“ konfiguriert werden. Wenn die Workflow-Ausführung diesen Knoten erreicht, wird sie sofort mit dem konfigurierten Status beendet.

:::info{title=Hinweis}
Wenn dieser Knoten in einem Workflow vom Typ „Vor Aktionsereignis“ verwendet wird, fängt er die Anfrage ab, die die Aktion ausgelöst hat. Details hierzu finden Sie unter [Verwendung von „Vor Aktionsereignis“](../triggers/pre-action).

Neben dem Abfangen der Anfrage, die die Aktion ausgelöst hat, beeinflusst die Konfiguration des Endstatus auch den Status der Rückmeldung in der „Antwortnachricht“ für diesen Workflow-Typ.
:::