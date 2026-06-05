:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Was ist FlowEngine?

FlowEngine ist eine neue No-Code- und Low-Code-Entwicklungs-Engine für das Frontend, die mit NocoBase 2.0 eingeführt wurde. Sie kombiniert Modelle (Model) mit Flows (Flow), um die Frontend-Logik zu vereinfachen und die Wiederverwendbarkeit sowie Wartbarkeit zu verbessern. Gleichzeitig ermöglicht sie durch die konfigurierbaren Eigenschaften von Flow die No-Code-Konfiguration und Orchestrierung von Frontend-Komponenten und Geschäftslogik.

## Warum heißt es FlowEngine?

Weil in FlowEngine die Eigenschaften und die Logik von Komponenten nicht mehr statisch definiert sind, sondern durch einen **Flow** gesteuert und verwaltet werden.

*   **Flow** zerlegt, ähnlich einem Datenstrom, die Logik in geordnete Schritte (Step) und wendet diese schrittweise auf die Komponente an;
*   **Engine** bedeutet, dass es sich um eine Engine handelt, die Frontend-Logik und Interaktionen antreibt.

Daher gilt: **FlowEngine = Eine Frontend-Logik-Engine, die von Flows angetrieben wird**.

## Was ist ein Model?

In FlowEngine ist ein Model das abstrakte Modell einer Komponente und zuständig für:

*   Die Verwaltung der **Eigenschaften (Props) und des Zustands** der Komponente;
*   Die Definition der **Rendering-Methode** der Komponente;
*   Das Hosten und Ausführen des **Flow**;
*   Die einheitliche Handhabung von **Ereignisverteilung** und **Lebenszyklen**.

Mit anderen Worten: **Das Model ist das logische Gehirn der Komponente**, das diese von einem statischen Element in eine konfigurierbare und orchestrierbare dynamische Einheit verwandelt.

## Was ist ein Flow?

In FlowEngine ist ein **Flow ein logischer Ablauf, der dem Model dient**.
Seine Aufgabe ist es,:

*   Eigenschaften- oder Ereignislogik in Schritte (Step) zu zerlegen und diese nacheinander in Form eines Flows auszuführen;
*   Eigenschaftsänderungen sowie Ereignisreaktionen zu verwalten;
*   Logik **dynamisch, konfigurierbar und wiederverwendbar** zu gestalten.

## Wie lassen sich diese Konzepte verstehen?

Sie können sich einen **Flow** wie einen **Wasserstrom** vorstellen:

*   **Ein Step ist wie ein Knotenpunkt entlang des Wasserstroms**
    Jeder Step übernimmt eine kleine Aufgabe (z. B. das Setzen einer Eigenschaft, das Auslösen eines Ereignisses, das Aufrufen einer API), so wie Wasser eine Wirkung entfaltet, wenn es ein Wehr oder ein Wasserrad passiert.

*   **Der Flow ist geordnet**
    Wasser fließt auf einem vorgegebenen Weg von der Quelle bis zur Mündung und durchläuft dabei nacheinander alle Steps; ebenso wird die Logik in einem Flow in der definierten Reihenfolge ausgeführt.

*   **Der Flow kann verzweigt und kombiniert werden**
    Ein Wasserstrom kann sich in mehrere kleinere Ströme aufteilen oder sich wieder zu einem größeren Strom vereinen; ein Flow kann ebenfalls in mehrere Sub-Flows zerlegt oder zu komplexeren Logikketten kombiniert werden.

*   **Der Flow ist konfigurierbar und steuerbar**
    Die Richtung und das Volumen eines Wasserstroms können durch ein Wehr reguliert werden; die Ausführungsmethode und die Parameter eines Flows können ebenfalls durch Konfiguration (stepParams) gesteuert werden.

### Zusammenfassung der Analogie

*   **Eine Komponente** ist wie ein Wasserrad, das einen Wasserstrom benötigt, um sich zu drehen;
*   **Das Model** ist die Basis und Steuerung dieses Wasserrads, verantwortlich für den Empfang des Wassers und den Antrieb des Betriebs;
*   **Der Flow** ist dieser Wasserstrom, der nacheinander jeden Step durchläuft und die Komponente dazu bringt, sich kontinuierlich zu ändern und zu reagieren.

In FlowEngine gilt also:

*   **Flow lässt die Logik wie einen Wasserstrom natürlich fließen**;
*   **Model macht die Komponente zum Träger und Ausführer dieses Stroms**.