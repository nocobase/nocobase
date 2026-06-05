:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Was ist FlowEngine?

FlowEngine ist eine neue Frontend-No-Code-/Low-Code-Entwicklungs-Engine, die mit NocoBase 2.0 eingeführt wurde. Sie kombiniert Modelle (Models) und Flüsse (Flows), um die Frontend-Logik zu vereinfachen und die Wiederverwendbarkeit sowie Wartbarkeit zu verbessern. Gleichzeitig nutzt sie die Konfigurierbarkeit von Flows, um Frontend-Komponenten und Geschäftslogik No-Code-Konfigurations- und Orchestrierungsfunktionen zu verleihen.

## Warum heißt es FlowEngine?

In FlowEngine sind die Eigenschaften und die Logik von Komponenten nicht mehr statisch definiert, sondern werden durch **Flüsse (Flows)** gesteuert und verwaltet.

*   Ein **Flow** zerlegt, ähnlich einem Datenstrom, die Logik in geordnete Schritte (Steps), die schrittweise auf die Komponente angewendet werden.
*   **Engine** drückt aus, dass es sich um eine Engine handelt, die Frontend-Logik und Interaktionen steuert.

Daher gilt: **FlowEngine = Eine Frontend-Logik-Engine, die von Flows gesteuert wird**.

## Was ist ein Model?

In FlowEngine ist ein Model ein abstraktes Modell einer Komponente, das für Folgendes verantwortlich ist:

*   Die Verwaltung der **Eigenschaften (Props) und des Zustands** der Komponente.
*   Die Definition der **Rendering-Methode** der Komponente.
*   Das Hosten und Ausführen von **Flows**.
*   Die einheitliche Handhabung von **Ereignisverteilung** und **Lebenszyklen**.

Mit anderen Worten: **Ein Model ist das logische Gehirn einer Komponente**, das sie von einer statischen Einheit in eine konfigurierbare und orchestrierbare dynamische Einheit verwandelt.

## Was ist ein Flow?

In FlowEngine ist **ein Flow ein Logikstrom, der einem Model dient**.
Seine Aufgabe ist es:

*   Eigenschaften- oder Ereignislogik in Schritte (Steps) zu zerlegen und diese sequenziell als Strom auszuführen.
*   Eigenschaftenänderungen sowie Ereignisreaktionen zu verwalten.
*   Logik **dynamisch, konfigurierbar und wiederverwendbar** zu gestalten.

## Wie lassen sich diese Konzepte verstehen?

Stellen Sie sich einen **Flow** wie einen **Wasserstrom** vor:

*   **Ein Step ist wie ein Knotenpunkt entlang des Wasserstroms**
    Jeder Step erfüllt eine kleine Aufgabe (z. B. eine Eigenschaft setzen, ein Ereignis auslösen, eine API aufrufen), genau wie ein Wasserstrom eine entsprechende Wirkung entfaltet, wenn er ein Schleusentor oder ein Wasserrad passiert.

*   **Flüsse sind geordnet**
    Ein Wasserstrom folgt einem vorgegebenen Pfad von der Quelle bis zur Mündung und durchläuft alle Steps nacheinander; ebenso wird die Logik in einem Flow in der definierten Reihenfolge ausgeführt.

*   **Flüsse können verzweigt und kombiniert werden**
    Ein Wasserstrom kann sich in mehrere kleinere Ströme aufteilen oder sich wieder vereinen; ein Flow kann ebenfalls in mehrere Unter-Flows aufgeteilt oder zu komplexeren Logikketten kombiniert werden.

*   **Flüsse sind konfigurierbar und steuerbar**
    Die Richtung und das Volumen eines Wasserstroms können durch ein Schleusentor angepasst werden; die Ausführungsmethode und die Parameter eines Flows können ebenfalls durch Konfiguration (stepParams) gesteuert werden.

### Analogie-Zusammenfassung

*   Eine **Komponente** ist wie ein Wasserrad, das einen Wasserstrom benötigt, um sich zu drehen.
*   Ein **Model** ist die Basis und Steuerung dieses Wasserrads, verantwortlich für den Empfang des Wasserstroms und den Antrieb seines Betriebs.
*   Ein **Flow** ist dieser Wasserstrom, der nacheinander jeden Step durchläuft und die Komponente dazu bringt, sich kontinuierlich zu ändern und zu reagieren.

In FlowEngine gilt also:

*   **Flows lassen die Logik wie einen Wasserstrom natürlich fließen**.
*   **Models ermöglichen es Komponenten, die Träger und Ausführenden dieses Stroms zu werden**.