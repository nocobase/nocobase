:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Berechnung

Der Berechnungs-Knoten kann einen Ausdruck auswerten. Das Ergebnis wird im jeweiligen Knoten gespeichert und steht nachfolgenden Knoten zur Verfügung. Er ist ein Werkzeug zum Berechnen, Verarbeiten und Transformieren von Daten. Bis zu einem gewissen Grad kann er die Funktion in Programmiersprachen ersetzen, bei der eine Funktion auf einen Wert angewendet und das Ergebnis einer Variablen zugewiesen wird.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol ("+") im Workflow, um einen "Berechnungs"-Knoten hinzuzufügen:

![计算节点_添加](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Knotenkonfiguration

![计算节点_节点配置](https://static-docs.nocobase.com/6a155de3d8cd1881b2d9c33874.png)

### Berechnungs-Engine

Die Berechnungs-Engine definiert die von Ausdrücken unterstützte Syntax. Aktuell werden [Math.js](https://mathjs.org/) und [Formula.js](https://formulajs.info/) unterstützt. Jede Engine enthält eine Vielzahl integrierter, häufig verwendeter Funktionen und Methoden zur Datenverarbeitung. Die genaue Verwendung entnehmen Sie bitte der jeweiligen offiziellen Dokumentation.

:::info{title=Hinweis}
Beachten Sie bitte, dass sich die Engines im Zugriff auf Array-Indizes unterscheiden. Math.js beginnt die Indizierung bei `1`, während Formula.js bei `0` beginnt.
:::

Wenn Sie einfache String-Verkettungen benötigen, können Sie direkt die "String-Vorlage" verwenden. Diese Engine ersetzt die Variablen im Ausdruck durch ihre entsprechenden Werte und gibt dann die verkettete Zeichenkette zurück.

### Ausdruck

Ein Ausdruck ist die String-Repräsentation einer Berechnungsformel. Er kann aus Variablen, Konstanten, Operatoren und unterstützten Funktionen bestehen. Sie können Variablen aus dem Workflow-Kontext verwenden, zum Beispiel das Ergebnis eines vorhergehenden Knotens des Berechnungs-Knotens oder lokale Variablen einer Schleife.

Wenn die Eingabe des Ausdrucks nicht der Syntax entspricht, wird in der Knotenkonfiguration ein Fehler angezeigt. Wenn während der Ausführung eine Variable nicht existiert oder der Typ nicht übereinstimmt, oder wenn eine nicht existierende Funktion verwendet wird, wird der Berechnungs-Knoten vorzeitig mit einem Fehlerstatus beendet.

## Beispiel

### Gesamtpreis der Bestellung berechnen

Eine Bestellung kann mehrere Artikel enthalten, wobei jeder Artikel einen unterschiedlichen Preis und eine unterschiedliche Menge hat. Der Gesamtpreis der Bestellung ergibt sich aus der Summe der Produkte von Preis und Menge aller Artikel. Nachdem Sie die Liste der Bestelldetails (ein 1:n-Beziehungsdatensatz) geladen haben, können Sie einen Berechnungs-Knoten verwenden, um den Gesamtpreis der Bestellung zu berechnen:

![计算节点_示例_节点配置](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Hier kann die `SUMPRODUCT`-Funktion von Formula.js die Summe der Produkte von zwei Arrays gleicher Länge berechnen. Durch die Summierung erhalten Sie den Gesamtpreis der Bestellung.