---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Schleife

## Einführung

Eine Schleife entspricht Programmiersprachen-Konstrukten wie `for`, `while` oder `forEach`. Sie können einen Schleifen-Knoten verwenden, wenn Sie bestimmte Operationen eine bestimmte Anzahl von Malen oder für eine Daten-Sammlung (Array) wiederholt ausführen müssen.

## Installation

Dies ist ein integriertes Plugin und erfordert keine Installation.

## Einen Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Ablauf, um einen „Schleife“-Knoten hinzuzufügen:

![Schleifen-Knoten erstellen](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Nachdem Sie einen Schleifen-Knoten erstellt haben, wird ein interner Zweig für die Schleife generiert. Sie können in diesem Zweig beliebig viele Knoten hinzufügen. Diese Knoten können nicht nur Variablen aus dem Workflow-Kontext verwenden, sondern auch lokale Variablen aus dem Schleifen-Kontext. Dazu gehören beispielsweise das Datenobjekt, das in jeder Iteration der Schleifen-Sammlung verarbeitet wird, oder der Index der Schleifen-Anzahl (der Index beginnt bei `0`). Der Gültigkeitsbereich lokaler Variablen ist auf die Schleife beschränkt. Bei verschachtelten Schleifen können Sie die lokalen Variablen der jeweiligen Schleife auf jeder Ebene verwenden.

## Knoten-Konfiguration

![Knoten-Konfiguration](https://static-docs.nocobase.com/20241016135326.png)

### Schleifen-Objekt

Die Schleife verarbeitet verschiedene Daten-Typen des Schleifen-Objekts unterschiedlich:

1.  **Array**: Dies ist der häufigste Fall. Normalerweise können Sie eine Variable aus dem Workflow-Kontext auswählen, wie zum Beispiel die mehreren Daten-Ergebnisse eines Abfrage-Knotens oder vorab geladene 1:n-Beziehungsdaten. Wenn ein Array ausgewählt wird, durchläuft der Schleifen-Knoten jedes Element im Array. Bei jeder Iteration wird das aktuelle Element einer lokalen Variable im Schleifen-Kontext zugewiesen.

2.  **Zahl**: Wenn die ausgewählte Variable eine Zahl ist, wird diese Zahl als Anzahl der Iterationen verwendet. Der Wert der Zahl muss eine positive ganze Zahl sein; negative Zahlen führen nicht zu einer Schleife, und der Dezimalteil einer Zahl wird ignoriert. Der Index der Schleifen-Anzahl in der lokalen Variable ist auch der Wert des Schleifen-Objekts. Dieser Wert beginnt bei **0**. Wenn die Zahl des Schleifen-Objekts beispielsweise 5 ist, sind das Objekt und der Index in jeder Schleife nacheinander: 0, 1, 2, 3, 4.

3.  **Zeichenkette**: Wenn die ausgewählte Variable eine Zeichenkette ist, wird deren Länge als Anzahl der Iterationen verwendet, wobei jedes Zeichen der Zeichenkette nach Index verarbeitet wird.

4.  **Andere**: Werte anderer Typen (einschließlich Objekt-Typen) werden nur als Schleifen-Objekt für eine einmalige Verarbeitung behandelt und die Schleife wird nur einmal durchlaufen. In der Regel ist in diesem Fall keine Schleife erforderlich.

Neben der Auswahl einer Variable können Sie für Zahlen- und Zeichenketten-Typen auch Konstanten direkt eingeben. Geben Sie beispielsweise `5` (Zahlen-Typ) ein, wird der Schleifen-Knoten 5 Mal durchlaufen. Geben Sie `abc` (Zeichenketten-Typ) ein, wird der Schleifen-Knoten 3 Mal durchlaufen, wobei die Zeichen `a`, `b` und `c` einzeln verarbeitet werden. Wählen Sie im Werkzeug zur Variablen-Auswahl den gewünschten Typ für die Konstante aus.

### Schleifen-Bedingung

Ab Version `v1.4.0-beta` wurden Optionen für Schleifen-Bedingungen hinzugefügt. Sie können Schleifen-Bedingungen in der Knoten-Konfiguration aktivieren.

**Bedingung**

Ähnlich der Bedingungs-Konfiguration in einem Bedingungs-Knoten können Sie Konfigurationen kombinieren und Variablen aus der aktuellen Schleife verwenden, wie zum Beispiel das Schleifen-Objekt, den Schleifen-Index usw.

**Prüfzeitpunkt**

Ähnlich den `while`- und `do/while`-Konstrukten in Programmiersprachen können Sie wählen, ob die konfigurierte Bedingung vor jeder Schleifen-Iteration oder nach jeder Schleifen-Iteration ausgewertet werden soll. Eine nachträgliche Bedingungs-Auswertung ermöglicht es, dass die anderen Knoten innerhalb des Schleifen-Körpers einmal ausgeführt werden, bevor die Bedingung geprüft wird.

**Wenn die Bedingung nicht erfüllt ist**

Ähnlich den `break`- und `continue`-Anweisungen in Programmiersprachen können Sie wählen, ob die Schleife beendet werden soll oder ob die nächste Iteration fortgesetzt werden soll.

### Fehlerbehandlung in Schleifen-Knoten

Ab Version `v1.4.0-beta` können Sie bei einem Fehler in einem Knoten innerhalb der Schleife (z. B. wenn Bedingungen nicht erfüllt sind oder ein Fehler auftritt) den weiteren Ablauf konfigurieren. Es werden drei Verarbeitungs-Methoden unterstützt:

*   Workflow beenden (wie `throw` in der Programmierung)
*   Schleife beenden und Workflow fortsetzen (wie `break` in der Programmierung)
*   Nächstes Schleifen-Objekt fortsetzen (wie `continue` in der Programmierung)

Standardmäßig ist „Workflow beenden“ ausgewählt. Sie können dies bei Bedarf ändern.

## Beispiel

Wenn beispielsweise eine Bestellung aufgegeben wird, muss der Lagerbestand für jedes Produkt in der Bestellung geprüft werden. Ist der Lagerbestand ausreichend, wird er abgezogen; andernfalls wird das Produkt in der Bestell-Position als ungültig aktualisiert.

1.  Erstellen Sie drei Sammlungen: Produkte <-(1:n)-- Bestell-Positionen --(n:1)-> Bestellungen. Das Daten-Modell sieht wie folgt aus:

    **Sammlung „Bestellungen“**
    | Feld-Name           | Feld-Typ             |
    | ------------------- | -------------------- |
    | Bestell-Positionen  | 1:n (Bestell-Positionen) |
    | Bestell-Gesamtpreis | Zahl                 |

    **Sammlung „Bestell-Positionen“**
    | Feld-Name | Feld-Typ       |
    | --------- | -------------- |
    | Produkt   | n:1 (Produkt)  |
    | Menge     | Zahl           |

    **Sammlung „Produkte“**
    | Feld-Name    | Feld-Typ         |
    | ------------ | ---------------- |
    | Produkt-Name | Einzeiliger Text |
    | Preis        | Zahl             |
    | Lagerbestand | Ganze Zahl       |

2.  Erstellen Sie einen Workflow. Wählen Sie als Auslöser „Sammlungs-Ereignis“. Wählen Sie die Sammlung „Bestellungen“ und den Auslöser „Nach Datensatz hinzugefügt“. Sie müssen außerdem die Beziehungsdaten der Sammlung „Bestell-Positionen“ und der Sammlung „Produkte“ unter den Positionen vorab laden:

    ![Schleifen-Knoten_Beispiel_Auslöser-Konfiguration](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Erstellen Sie einen Schleifen-Knoten. Wählen Sie als Schleifen-Objekt „Auslöser-Daten / Bestell-Positionen“. Das bedeutet, dass jede Datenzeile in der Sammlung „Bestell-Positionen“ verarbeitet wird:

    ![Schleifen-Knoten_Beispiel_Schleifen-Knoten-Konfiguration](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Innerhalb des Schleifen-Knotens erstellen Sie einen „Bedingungs“-Knoten, um zu prüfen, ob der Lagerbestand des Produkts ausreichend ist:

    ![Schleifen-Knoten_Beispiel_Bedingungs-Knoten-Konfiguration](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Ist der Lagerbestand ausreichend, erstellen Sie im „Ja“-Zweig einen „Berechnungs-Knoten“ und einen „Datensatz aktualisieren“-Knoten, um den berechneten, abgezogenen Lagerbestand im entsprechenden Produkt-Datensatz zu aktualisieren:

    ![Schleifen-Knoten_Beispiel_Berechnungs-Knoten-Konfiguration](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Schleifen-Knoten_Beispiel_Lagerbestand aktualisieren-Knoten-Konfiguration](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Andernfalls erstellen Sie im „Nein“-Zweig einen „Datensatz aktualisieren“-Knoten, um den Status der Bestell-Position auf „ungültig“ zu aktualisieren:

    ![Schleifen-Knoten_Beispiel_Bestell-Position aktualisieren-Knoten-Konfiguration](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Die gesamte Workflow-Struktur ist wie folgt dargestellt:

![Schleifen-Knoten_Beispiel_Workflow-Struktur](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Nachdem Sie diesen Workflow konfiguriert und aktiviert haben, wird beim Erstellen einer neuen Bestellung automatisch der Lagerbestand der Produkte in den Bestell-Positionen geprüft. Ist der Lagerbestand ausreichend, wird er abgezogen; andernfalls wird das Produkt in der Bestell-Position als ungültig aktualisiert (damit ein gültiger Bestell-Gesamtpreis berechnet werden kann).