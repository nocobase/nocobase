# Kontextsystem im Überblick

Das Kontextsystem der NocoBase FlowEngine ist in drei Schichten unterteilt, die jeweils einem unterschiedlichen Geltungsbereich entsprechen. Durch den gezielten Einsatz lassen sich Dienste, Konfigurationen und Daten flexibel teilen und isolieren, was die Wartbarkeit und Skalierbarkeit Ihrer Anwendungen verbessert.

- **FlowEngineContext (Globaler Kontext)**: Global einzigartig und für alle Modelle und Workflows zugänglich. Ideal für die Registrierung globaler Dienste, Konfigurationen und Ähnliches.
- **FlowModelContext (Modellkontext)**: Dient dem Teilen von Kontext innerhalb eines Modellbaums. Untergeordnete Modelle delegieren automatisch an den Kontext des übergeordneten Modells und unterstützen das Überschreiben gleichnamiger Einträge. Geeignet für die Isolation von Logik und Daten auf Modellebene.
- **FlowRuntimeContext (Workflow-Laufzeitkontext)**: Wird bei jeder Ausführung eines Workflows erstellt und bleibt während des gesamten Workflow-Lebenszyklus bestehen. Geeignet für die Datenübergabe, Variablenspeicherung und die Aufzeichnung des Laufzeitstatus innerhalb des Workflows. Unterstützt zwei Modi: `mode: 'runtime' | 'settings'`, die dem Laufzeitmodus bzw. dem Konfigurationsmodus entsprechen.

Alle `FlowEngineContext` (Globaler Kontext), `FlowModelContext` (Modellkontext), `FlowRuntimeContext` (Workflow-Laufzeitkontext) und weitere sind Unterklassen oder Instanzen von `FlowContext`.

---

## 🗂️ Hierarchiediagramm

```text
FlowEngineContext (Globaler Kontext)
│
├── FlowModelContext (Modellkontext)
│     ├── Sub FlowModelContext (Untermodell)
│     │     ├── FlowRuntimeContext (Workflow-Laufzeitkontext)
│     │     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│
├── FlowModelContext (Modellkontext)
│     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│
└── FlowModelContext (Modellkontext)
      ├── Sub FlowModelContext (Untermodell)
      │     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
      └── FlowRuntimeContext (Workflow-Laufzeitkontext)
```

- Der `FlowModelContext` kann über einen Delegationsmechanismus auf die Eigenschaften und Methoden des `FlowEngineContext` zugreifen, was die gemeinsame Nutzung globaler Funktionen ermöglicht.
- Der `FlowModelContext` eines Untermodells kann über einen Delegationsmechanismus auf den Kontext des übergeordneten Modells (synchrone Beziehung) zugreifen und unterstützt das Überschreiben gleichnamiger Einträge.
- Asynchrone Eltern-Kind-Modelle stellen keine Delegationsbeziehung her, um eine Statusverschmutzung zu vermeiden.
- Der `FlowRuntimeContext` greift immer über einen Delegationsmechanismus auf seinen entsprechenden `FlowModelContext` zu, gibt Änderungen jedoch nicht nach oben weiter.

---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



## 🧭 Laufzeit- und Konfigurationsmodus (mode)

Der `FlowRuntimeContext` unterstützt zwei Modi, die durch den Parameter `mode` unterschieden werden:

- `mode: 'runtime'` (Laufzeitmodus): Wird während der tatsächlichen Ausführungsphase des Workflows verwendet. Eigenschaften und Methoden geben reale Daten zurück. Zum Beispiel:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Konfigurationsmodus): Wird während der Design- und Konfigurationsphase des Workflows verwendet. Der Zugriff auf Eigenschaften gibt einen Variablentemplate-String zurück, was die Auswahl von Ausdrücken und Variablen erleichtert. Zum Beispiel:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Dieses Dual-Modus-Design gewährleistet die Datenverfügbarkeit zur Laufzeit und erleichtert gleichzeitig die Variablenreferenzierung und Ausdrucksgenerierung während der Konfiguration, wodurch die Flexibilität und Benutzerfreundlichkeit der FlowEngine verbessert wird.