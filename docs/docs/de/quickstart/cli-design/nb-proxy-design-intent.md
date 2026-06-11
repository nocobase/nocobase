# Die Designabsicht von `nb proxy`

Der Zweck von `nb proxy` besteht darin, Benutzern eine Reihe einfacherer und stabilerer Befehle aus dem ursprünglich komplexen Prozess der Einstiegsebene bereitzustellen.

Wenn wir nur über den Kernprozess sprechen, genügt es, sich diese drei Befehle zu merken:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

In den meisten Szenarien verwenden Sie `nb proxy` im Wesentlichen für die folgenden drei Schritte:

1. Wählen Sie zunächst mit `use` den Laufmodus des aktuellen Anbieters aus
2. Verwenden Sie dann `generate`, um die Eintragskonfiguration entsprechend der Umgebung und dem Domänennamen zu generieren
3. Verwenden Sie abschließend `reload`, damit die Konfiguration wirksam wird

Wenn Sie Caddy verwenden, ersetzen Sie einfach `nginx` im Befehl durch `caddy`.

`use local` und `use docker` können auch direkt so geschrieben werden:

- Wenn Nginx oder Caddy lokal installiert wurde, verwenden Sie `use local`
- Es gibt keine lokale Installation. Wenn Sie zulassen, dass CLI Docker zur Verwaltung des Agenten verwendet, verwenden Sie `use docker`

Dies ist auch die Erfahrung, die diese Schicht von `nb proxy` am meisten bieten möchte: Sie müssen sich nicht zuerst mit den Konfigurationsdetails von Nginx oder Caddy befassen, sondern verbinden einfach den Eingang gemäß dem festgelegten Prozess.

## Warum reicht es aus, sich zuerst diese 3 Dinge zu merken?

Da das von `nb proxy` gelöste Problem tatsächlich sehr konvergent ist: **Geben Sie der Anwendung einen stabilen externen Zugriffseingang. **

Wenn Sie [Übersicht über die Bereitstellung der Produktionsumgebung](../produktion/index.md) bereits gesehen haben, können Sie es sich getrennt von `nb app autostart` wie folgt merken:

- `nb app autostart` ist verantwortlich dafür, „wie die Ausführung der Anwendung nach dem Neustart der Maschine wieder aufgenommen wird“
- `nb proxy` ist verantwortlich dafür, „wie die Anwendung einen stabilen externen Zugriff über Nginx oder Caddy bereitstellen kann“

Im gebräuchlichsten Bereitstellungsprozess erfordert `nb proxy` also keinen großen Kopf. Meistens ist es:

- Betriebsart wählen
- Konfiguration generieren
- Nachladen wird wirksam

Genug.

## Was bewirken diese drei Schritte?

### `use`

`use` löst das Problem, „wie der Agent derzeit verwaltet wird“.

Zum Beispiel:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

Der einfachste Weg zur Beurteilung ist:

- Wenn Nginx oder Caddy lokal installiert wurde, verwenden Sie `use local`
- Wenn es nicht lokal installiert ist, verwenden Sie `use docker`

Sie können sich das auch so vorstellen, dass Sie zunächst den Standardlaufmodus des aktuellen Anbieters auswählen. Die folgenden Befehle `start`, `reload` und `status` funktionieren auf diese Weise.

### `generate`

`generate` löst das Problem des „Renderns der Eintragskonfiguration gemäß der aktuellen Umgebung“.

Zum Beispiel:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

In diesem Schritt werden die Informationen in env mit den von der Einstiegsschicht benötigten Parametern kombiniert, um eine verwendbare Proxy-Konfiguration zu generieren. Der kritischste Input hier ist normalerweise:

– `--env`: Welche CLI verwaltete Umgebung zur Offenlegung
- `--host`: An welchen Domänennamen gebunden werden soll

Mit anderen Worten: `generate` verwaltet Konfigurationsprodukte, nicht den Prozessstatus.

### `reload`

`reload` löst das Problem, „die neu generierte Konfiguration wirklich effektiv zu machen“.

```bash
nb proxy nginx reload
```

Diese Trennung hat einen direkten Vorteil: Konfigurationsgenerierung und Prozessaktionen werden nicht vermischt. Wenn Sie den Domänennamen, den Port oder den öffentlichen Pfad ändern, generieren Sie ihn zuerst neu und entscheiden Sie dann, ob er wirksam werden soll. Der gesamte Prozess wird klarer.

## Warum sollte es als `use → generate → reload` konzipiert sein?

Denn diese drei Schritte entsprechen gerade den drei stabilsten Aktionen der Eingangsschicht:

- Entscheiden Sie zunächst, wie der Agent ausgeführt werden soll
- Entscheiden Sie dann, welcher Eintrag für welche Umgebung generiert werden soll
-Lassen Sie die Konfiguration abschließend wirksam werden

Wenn Sie alle diese Schritte in einem Black-Box-Befehl zusammenfassen, scheint es, dass an der Oberfläche weniger Befehle vorhanden sind. Wenn jedoch ein Problem auftritt, lässt sich nur schwer feststellen, ob der Treiber falsch ausgewählt wurde, die Konfiguration nicht korrekt generiert wurde oder der Agent nicht neu geladen wurde.

Nachdem Sie es nun wie folgt zerlegt haben, wird der Untersuchungspfad klarer:

- `use` Wenn es falsch ist, schneiden Sie einfach den Treiber ab
- `generate` ist falsch, generieren Sie die Konfiguration neu.
- Die Konfiguration ist korrekt, aber noch nicht wirksam, nur `reload`

## Was sind die Vorteile dieser Designebene?

Der Vorteil von `nb proxy` besteht nicht nur darin, die Befehlsformen von Nginx und Caddy zu vereinheitlichen, sondern, was noch wichtiger ist, darin, die hochfrequenten Aktionen der Einstiegsschicht in einen zusammensetzbaren Prozess umzuwandeln.

Sie können zum Beispiel direkt aus dem Agenteneingang starten:

```bash
nb proxy nginx generate --env test2 --reload
```

Sie können auch von der Anwendungskonfiguration aus starten:

```bash
nb env update --env test2 --app-port 13000 --proxy-generate --proxy-reload
```

Diese beiden Beispiele entsprechen zwei sehr häufigen Ausgangspunkten:

- Sie wissen bereits, dass Sie die Eingangsebene ändern, also nur `generate --reload`
– Sie haben zuerst die Umgebung geändert und dann `--proxy-generate --proxy-reload` ausgelöst.

Aber am Ende fallen sie alle in den gleichen stabilen Prozess: Aktualisieren Sie die Konfiguration, generieren Sie den Eingang und lassen Sie den Agenten wirksam werden.

## Warum brauchen wir einen separaten `nb proxy`

Denn was `nb proxy` vereinheitlichen möchte, ist nicht eine bestimmte Nginx-Konfigurationsdatei, sondern die gemeinsamen Aktionen der Einstiegsschicht.

Was Sie wirklich interessiert, ist normalerweise nicht:

-In welchen Pfad fällt die Konfigurationsdatei?
- Befehlsunterschiede zwischen Nginx und Caddy
- Betriebsunterschiede zwischen Local und Docker

Worüber Sie sich mehr Sorgen machen, ist:

- Wie mache ich diese Umgebung sichtbar?
- Wie ändere ich meinen Domainnamen?
- Wie sorge ich dafür, dass die neue Konfiguration wirksam wird?

`nb proxy` besteht darin, diese Aktionen in demselben Satz von CLI-Einträgen zusammenzuführen. Wenn Sie sich zunächst den Kernprozess merken, können Sie auf diese Weise bereits die meisten Szenarien abdecken. Nur wenn Sie die Fehlerbehebung im Detail fortsetzen möchten oder eine spezielle Konfiguration benötigen, schauen Sie einfach auf die Seite des Anbieters.

## Gesamt

- `nb proxy` Der Kerngebrauch des Geistes ist `use → generate → reload`
- Für die meisten Benutzer reicht es aus, sich diese drei Befehle zu merken
- Der Schwerpunkt des Designs liegt nicht darauf, alle Details zu verbergen, sondern zunächst die gängigsten Prozesse auf der Eingangsebene festzulegen.

Wenn Sie sich die spezifischen Befehle weiter ansehen möchten, können Sie direkt zu [`nb proxy`](../../api/cli/proxy/index.md) gehen. Wenn Sie bereit sind, sich mit dem offiziellen Eingang zu verbinden, können Sie sich auch weiterhin [Reverse Proxy](../produktion/reverse-proxy/index.md) ansehen.
