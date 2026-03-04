:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/flow-engine/flow-context).
:::

# Kontextsystem-Übersicht

Das Kontextsystem der NocoBase Workflow-Engine ist in drei Ebenen unterteilt, die jeweils unterschiedlichen Geltungsbereichen entsprechen. Die angemessene Verwendung ermöglicht die flexible gemeinsame Nutzung und Isolierung von Diensten, Konfigurationen und Daten, was die Wartbarkeit und Erweiterbarkeit des Geschäfts verbessert.

- **FlowEngineContext (Globaler Kontext)**: Global eindeutig, alle Modelle und Workflows können darauf zugreifen; geeignet für die Registrierung globaler Dienste, Konfigurationen usw.
- **FlowModelContext (Modellkontext)**: Wird für die gemeinsame Nutzung des Kontextes innerhalb eines Modellbaums verwendet; Untermodelle delegieren automatisch an den Kontext des Elternmodells, unterstützt das Überschreiben bei Namensgleichheit; geeignet für die Isolierung von Logik und Daten auf Modellebene.
- **FlowRuntimeContext (Workflow-Laufzeitkontext)**: Wird bei jeder Workflow-Ausführung erstellt und durchläuft den gesamten Workflow-Laufzeitzyklus; geeignet für die Datenübertragung, Variablenspeicherung und Aufzeichnung des Laufzeitstatus im Workflow. Unterstützt die zwei Modi `mode: 'runtime' | 'settings'`, die jeweils dem Laufzeitstatus und dem Konfigurationsstatus entsprechen.

Alle `FlowEngineContext` (Globaler Kontext), `FlowModelContext` (Modellkontext), `FlowRuntimeContext` (Workflow-Laufzeitkontext) usw. sind Unterklassen oder Instanzen von `FlowContext`.

---

## 🗂️ Hierarchiediagramm

```text
FlowEngineContext (Globaler Kontext)
│
├── FlowModelContext (Modellkontext)
│     ├── Unter-FlowModelContext (Untermodell)
│     │     ├── FlowRuntimeContext (Workflow-Laufzeitkontext)
│     │     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│
├── FlowModelContext (Modellkontext)
│     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
│
└── FlowModelContext (Modellkontext)
      ├── Unter-FlowModelContext (Untermodell)
      │     └── FlowRuntimeContext (Workflow-Laufzeitkontext)
      └── FlowRuntimeContext (Workflow-Laufzeitkontext)
```

- `FlowModelContext` kann über einen Proxy-Mechanismus (delegate) auf die Eigenschaften und Methoden von `FlowEngineContext` zugreifen, um die gemeinsame Nutzung globaler Fähigkeiten zu realisieren.
- Der `FlowModelContext` eines Untermodells kann über einen Proxy-Mechanismus (delegate) auf den Kontext des Elternmodells zugreifen (synchrone Beziehung) und unterstützt das Überschreiben bei Namensgleichheit.
- Asynchrone Eltern-Kind-Modelle bauen keine Proxy-Beziehung (delegate) auf, um Status-Kontaminationen zu vermeiden.
- `FlowRuntimeContext` greift immer über einen Proxy-Mechanismus (delegate) auf seinen entsprechenden `FlowModelContext` zu, gibt jedoch keine Informationen nach oben zurück.

---

## 🧭 Laufzeitstatus und Konfigurationsstatus (mode)

`FlowRuntimeContext` unterstützt zwei Modi, die durch den Parameter `mode` unterschieden werden:

- `mode: 'runtime'` (Laufzeitstatus): Wird für die tatsächliche Ausführungsphase des Workflows verwendet; Eigenschaften und Methoden geben reale Daten zurück. Beispiel:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Konfigurationsstatus): Wird für die Design- und Konfigurationsphase des Workflows verwendet; der Zugriff auf Eigenschaften gibt Variablen-Template-Strings zurück, was die Auswahl von Ausdrücken und Variablen erleichtert. Beispiel:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Dieses Dual-Modus-Design stellt sowohl die Datenverfügbarkeit zur Laufzeit sicher als auch die einfache Variablenreferenzierung und Ausdrucksgenerierung bei der Konfiguration, was die Flexibilität und Benutzerfreundlichkeit der Workflow-Engine verbessert.

---

## 🤖 Kontextinformationen für Tools/Große Sprachmodelle

In bestimmten Szenarien (z. B. RunJS-Code-Bearbeitung im JS*Model, AI-Coding) muss der „Aufrufer“ ohne Code-Ausführung Folgendes verstehen:

- Welche **statischen Fähigkeiten** unter dem aktuellen `ctx` vorhanden sind (API-Dokumentation, Parameter, Beispiele, Dokumentationslinks usw.).
- Welche **optionalen Variablen** in der aktuellen Oberfläche/im Laufzeitstatus vorhanden sind (z. B. dynamische Strukturen wie „Aktueller Datensatz“, „Aktueller Popup-Datensatz“ usw.).
- Ein **Snapshot mit geringem Volumen** der aktuellen Laufzeitumgebung (für Prompts).

### 1) `await ctx.getApiInfos(options?)` (Statische API-Informationen)

### 2) `await ctx.getVarInfos(options?)` (Variablenstruktur-Informationen)

- Aufbau der Variablenstruktur basierend auf `defineProperty(...).meta` (einschließlich Meta-Factory).
- Unterstützt `path`-Zuschneiden und `maxDepth`-Tiefenkontrolle.
- Wird nur bei Bedarf nach unten ausgeklappt.

Häufig verwendete Parameter:

- `maxDepth`: Maximale Ausklapptiefe (Standard 3).
- `path: string | string[]`: Zuschneiden, gibt nur den Teilbaum des angegebenen Pfads aus.

### 3) `await ctx.getEnvInfos()` (Snapshot der Laufzeitumgebung)

Knotenstruktur (vereinfacht):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Kann direkt für await ctx.getVar(getVar) verwendet werden, beginnt mit "ctx."
  value?: any; // Aufgelöster/serialisierbarer statischer Wert
  properties?: Record<string, EnvNode>;
};
```