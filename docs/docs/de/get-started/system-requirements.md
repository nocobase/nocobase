:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/get-started/system-requirements).
:::

# Systemanforderungen

Die in diesem Dokument beschriebenen Systemanforderungen beziehen sich **ausschließlich auf den NocoBase-Anwendungsdienst selbst** und decken die für die Anwendungsprozesse erforderlichen Rechen- und Speicherressourcen ab. Sie **umfassen keine abhängigen Drittanbieter-Dienste**, einschließlich, aber nicht beschränkt auf:

- API-Gateways / Reverse Proxies
- Datenbankdienste (z. B. MySQL, PostgreSQL)
- Cache-Dienste (z. B. Redis)
- Middleware wie Message Queues, Objektspeicher usw.

Außer für reine Funktionsprüfungen oder experimentelle Szenarien wird **dringend empfohlen, die oben genannten Drittanbieter-Dienste separat** auf dedizierten Servern oder in Containern bereitzustellen oder direkt entsprechende Cloud-Dienste zu nutzen.

Die Systemkonfiguration und Kapazitätsplanung dieser Dienste sollte basierend auf der **tatsächlichen Datenmenge, der Geschäftslast und dem Grad der Nebenläufigkeit** individuell bewertet und optimiert werden.

## Einzelknoten-Bereitstellungsmodus

Der Einzelknoten-Bereitstellungsmodus bedeutet, dass der NocoBase-Anwendungsdienst auf einem einzigen Server oder einer einzelnen Container-Instanz ausgeführt wird.

### Mindestanforderungen an die Hardware

| Ressource | Anforderung |
|---|---|
| CPU | 1 Kern |
| Arbeitsspeicher | 2 GB |

**Anwendungsbereiche**:

- Kleinstunternehmen
- Funktionsprüfungen (POC)
- Entwicklungs- / Testumgebungen
- Szenarien mit nahezu keinem gleichzeitigen Zugriff

:::info{title=Hinweis}

- Diese Konfiguration stellt nur die Lauffähigkeit des Systems sicher, garantiert jedoch keine Performance.
- Bei steigender Datenmenge oder zunehmenden gleichzeitigen Anfragen können Systemressourcen schnell zum Engpass werden.
- Für die **Quellcode-Entwicklung, Plugin-Entwicklung oder das Erstellen und Bereitstellen aus dem Quellcode** wird empfohlen, **mindestens 4 GB freien Arbeitsspeicher** zu reservieren, um eine reibungslose Installation der Abhängigkeiten sowie Kompilierungs- und Build-Prozesse zu gewährleisten.

:::

### Empfohlene Hardware-Anforderungen

| Ressource | Empfohlene Konfiguration |
|---|---|
| CPU | 2 Kerne |
| Arbeitsspeicher | ≥ 4 GB |

**Anwendungsbereiche**:

Geeignet für kleine bis mittlere Unternehmen sowie Produktionsumgebungen mit geringer Nebenläufigkeit.

:::info{title=Hinweis}

- Mit dieser Konfiguration kann das System routinemäßige Administrationsaufgaben und leichtgewichtige Geschäftslasten bewältigen.
- Wenn die Geschäftskomplexität, die gleichzeitigen Zugriffe oder die Hintergrundaufgaben zunehmen, sollte ein Upgrade der Hardware-Spezifikationen oder ein Wechsel in den Cluster-Modus in Betracht gezogen werden.

:::

## Cluster-Modus

Der Cluster-Modus ist für mittlere bis große Szenarien mit hoher Nebenläufigkeit konzipiert. Die Verfügbarkeit und der Durchsatz des Systems können durch horizontale Skalierung verbessert werden (Details finden Sie unter: [Cluster-Modus](/cluster-mode)).

### Hardware-Anforderungen pro Knoten

Im Cluster-Modus wird empfohlen, die Hardware-Konfiguration für jeden Anwendungsknoten (Pod / Instanz) analog zum Einzelknoten-Bereitstellungsmodus zu wählen.

**Mindestkonfiguration pro Knoten:**

- CPU: 1 Kern
- Arbeitsspeicher: 2 GB

**Empfohlene Konfiguration pro Knoten:**

- CPU: 2 Kerne
- Arbeitsspeicher: 4 GB

### Planung der Knotenanzahl

- Die Anzahl der Knoten im Cluster kann nach Bedarf erweitert werden (2–N).
- Die tatsächlich benötigte Anzahl der Knoten hängt ab von:
  - Anzahl der gleichzeitigen Zugriffe
  - Komplexität der Geschäftslogik
  - Last durch Hintergrundaufgaben und asynchrone Verarbeitung
  - Reaktionsfähigkeit externer abhängiger Dienste

Empfehlungen für Produktionsumgebungen:

- Passen Sie die Knotenzahl dynamisch basierend auf Überwachungsmetriken (CPU, Arbeitsspeicher, Anfragelatenz usw.) an.
- Reservieren Sie eine gewisse Ressourcenredundanz, um Lastspitzen abzufangen.