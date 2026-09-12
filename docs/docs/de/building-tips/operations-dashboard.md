---
title: "Verwenden Sie NocoBase, um ein verlinkbares Betriebs-Dashboard zu erstellen"
description: "Am Beispiel des Arbeitsauftrags-Operations-Dashboards werden der Diagrammblock, der Filterblock und der JS-Block kombiniert, um einheitliche Filterung, KPI, Diagramm-Drilldown und benutzerdefinierte Stile zu erreichen."
keywords: "NocoBase, operatives Dashboard, Datenvisualisierung, Diagrammblock, Filterblock, JS-Block, Diagramm-Drilldown"
---

# Verwenden Sie NocoBase, um ein verlinkbares Betriebs-Dashboard zu erstellen

In diesem Artikel wird das Betriebs-Dashboard des „Arbeitsauftragssystems“ als Beispiel verwendet, um vorzustellen, wie der Diagrammblock, der Filterblock und der JS-Block von NocoBase in Kombination verwendet werden, um ein Daten-Dashboard zu erstellen, das Filterverknüpfung, Diagramm-Drilldown und benutzerdefinierte Stile unterstützt.

Obwohl die Beispiele aus Arbeitsauftragsszenarien stammen, sind diese Methoden auch auf Geschäftssysteme wie CRM, Gerätebetrieb, Projektmanagement, Genehmigungsablauf, Kundenerfolg usw. anwendbar.

:::tip
Was dieser Artikel vorstellen möchte, ist nicht „wie man JS-Blöcke zum Schreiben eines großen Bildschirms verwendet“, sondern wie man die nativen Blockfunktionen von NocoBase und JS-Blöcke kombiniert: Lassen Sie die nativen Blöcke für die Standardfunktionen verantwortlich sein und lassen Sie die JS-Blöcke das personalisierte Erlebnis ergänzen.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## Szenenziel

Wir hoffen, ein Betriebs-Dashboard erstellen zu können, um dem Betriebs- oder Serviceteam dabei zu helfen, schnell die aktuelle Arbeitslast zu ermitteln:

- Wie viele offene Arbeitsaufträge gibt es derzeit?
- Für welche Arbeitsaufträge besteht ein SLA-Risiko?
- Wie ist der Trend bei neuen Arbeitsaufträgen?
- Wie ist der Status und die Prioritätsverteilung der Arbeitsaufträge?
- Nach einem Klick auf ein Diagramm können Sie die entsprechenden Details einsehen

Die Seite kann grob in vier Ebenen unterteilt werden:

1. Oberer Filterbereich: Zeit, Servicegruppe, Anfragetyp, Priorität, SLA-Status
2. KPI-Statistikbereich: Offener Rückstand, Nicht zugewiesen, SLA-Warnung usw.
3. Diagrammanalysebereich: Trend, Status, SLA, Prioritätsverteilung
4. Drilldown-Detailbereich: Klicken Sie auf das Diagramm, um übereinstimmende Datensätze anzuzeigen

## Klären Sie zunächst eine Bauidee

Wenn viele Leute Daten-Dashboards erstellen, neigen sie dazu, das Problem als eine von zwei Optionen zu betrachten:

Verwenden Sie entweder alle nativen Blöcke von NocoBase, die einfach zu konfigurieren sind, befürchten Sie jedoch, dass der Stil und die Interaktion nicht flexibel genug sind. Oder schreiben Sie einfach einen großen JS-Block und steuern Sie die Abfrage, das Diagramm, die Filterung und den Drilldown selbst, aber dadurch geht der Komfort verloren, den die Low-Code-Konfiguration mit sich bringt.

Tatsächlich ist es empfehlenswerter, beides zu kombinieren.

In diesem Operations-Dashboard haben wir nicht die gesamte Seite als großen JS-Bildschirm geschrieben, sondern sie nach Verantwortlichkeiten aufgeteilt:

- Die Top-Filterung nutzt den Filterblock, der mit dem NocoBase-System geliefert wird;
- Trenddiagramme, Statusverteilung und SLA-Verteilung verwenden native Diagrammblöcke;
- KPI-Karten und Drilldown-Details verwenden JS-Blöcke;
- Filterblöcke wirken sich sowohl auf Planblöcke als auch auf JS-Blöcke aus.
- Nachdem auf das Diagramm geklickt wurde, werden die Drilldown-Bedingungen an den JS-Detailblock unten übergeben.

The advantage of this is that standard statistics and filtering still retain the configuration capabilities of NocoBase, while personalized display and complex interactions are completed by JS blocks. Die Seite ist weder „nur konfigurierbar“ noch „vollständiger Code“, aber Konfiguration und Code erfüllen jeweils ihre eigenen Aufgaben.

---

## 1. So passen Sie den Stil des Diagrammblocks an

![](https://static-docs.nocobase.com/202607121920941.png)

Der Diagrammblock von NocoBase kann zunächst den Query Builder verwenden, um das statistische Kaliber zu definieren, und dann die benutzerdefinierte ECharts-Option verwenden, um den Stil anzupassen.

Am Beispiel der „Arbeitsauftragsstatusstatistik“ kann der Abfrage-Generator wie folgt konfiguriert werden:

- Datenblatt: Tickets
- Metriken: ID-Anzahl, Alias-TicketCount
- Abmessungen: Status

Der Schlüssel besteht darin, dass Sie beim Anpassen des Stils die Abfrage nicht neu schreiben müssen, sondern nur die Diagrammanzeige basierend auf `ctx.data.objects` verarbeiten müssen.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Diese Codezeile liest die Ergebnisse der Diagrammabfrage. Definieren Sie dann Statusbeschriftungen und Farben:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Es wird empfohlen, dass bei allen sichtbaren Texten `ctx.t()` verwendet wird, um die spätere Unterstützung mehrerer Sprachen zu erleichtern.

Beim Generieren von Diagrammdaten können Sie jedem Diagrammdatenpunkt Drilldown-Informationen hinzufügen:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

Das Wichtigste hier ist `ticketingDrilldown`. Es handelt sich nicht um ein Standardfeld von ECharts, sondern um einen von uns selbst erstellten Geschäftskontext, der später beim Klicken auf das Diagramm verwendet wird.

Kehren Sie schließlich zur ECharts-Option zurück:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

Die Kernidee dieses Teils ist:

- Der Abfrage-Generator ist für die Statistiken verantwortlich.
- Die benutzerdefinierte Option ist für den visuellen Ausdruck verantwortlich.
- Benutzerdefinierte Felder sind für die Übertragung des Drilldown-Kontexts verantwortlich.

---

## 2. Lassen Sie den Systemfilterblock zum Beobachtungsbereich der gesamten Seite werden

![](https://static-docs.nocobase.com/202607121920687.png)

Der Filterbereich im operativen Dashboard sollte nicht nur eine isolierte Form sein. Es stellt den aktuellen Beobachtungsdurchmesser der gesamten Seite dar.

Wenn der Benutzer beispielsweise eine Servicegruppe, einen Anfragetyp und einen Erstellungszeitpunkt auswählt, sollten KPIs, Trenddiagramme, Statusverteilung und Drilldown-Details alle auf der Grundlage derselben Bedingungen angezeigt werden. Andernfalls kämpfen die Zahlen in verschiedenen Blöcken auf der Seite miteinander und es wird für Benutzer schwierig zu beurteilen, welche Daten das Ergebnis innerhalb des aktuellen Bereichs sind.

Hier verwenden wir direkt den Filterblock, der mit dem NocoBase-System geliefert wird, anstatt selbst eine Filterkomponente zu schreiben. Native Filterblöcke können auf natürliche Weise an Diagrammblöcke gebunden werden, sodass der Diagrammblock weiterhin den Abfrage-Builder, Berechtigungen, Aktualisierungs- und Filtermechanismen verwenden kann.

Top `Dashboard scope` kann diese Filterelemente konfigurieren:

- Created at
- Service group
- Request type
- Priority
- SLA status

Für JS-Blöcke müssen Sie lediglich die gleichen Filterbedingungen im Code lesen und diese dann in Abfragefilter konvertieren. Auf diese Weise können auch KPIs und Drilldown-Details mit dem nativen Diagramm konsistent sein.

Die Kombination von Filterbedingungen kann in einer kleinen Funktion gekapselt werden:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Nach Filter zählen:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Die wichtigsten Punkte hierbei sind:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

Der JS-Block fragt Geschäftsdaten über Ressourcen ab, anstatt SQL direkt zu schreiben. Dies erleichtert die Einhaltung der Berechtigungen, Datenquellen und Seitenlaufzeiten von NocoBase.

---

## 3. Verwenden Sie JS-Blöcke, um KPI-Karten anzuzeigen

![](https://static-docs.nocobase.com/202607121920374.png)

KPIs eignen sich besser für die Verwendung von JS-Blöcken. Denn bei KPI handelt es sich in der Regel nicht um eine einzelne Abfrage, sondern um eine Kombination mehrerer Geschäftsgrößen: unvollendet, nicht zugewiesen, SLA-Warnung, SLA-Verletzung, neu, gelöst usw.

Der JS-Block kann Daten basierend auf dem aktuellen Filterbereich abfragen und in eine Statistikkarte umwandeln.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Die wichtigsten Punkte von JS-Blöcken sind:

- Verwenden Sie `ctx.makeResource()`, um Daten abzufragen.
- Verwenden Sie `ctx.libs.antd`, um die Schnittstelle zu rendern.
- Verwenden Sie `ctx.render()`, um Inhalte auszugeben.
- Rendern Sie JS-Blöcke erneut, nachdem Sie die Änderungen gefiltert haben.

Auf einer echten Seite können die Schaltfläche „Filter“ und die Schaltfläche „Zurücksetzen“ den Ereignisfluss so konfigurieren, dass sie nach Abschluss der nativen Filteraktion gleichzeitig den KPI-JS-Block und den Drilldown-JS-Block aktualisieren. Auf diese Weise klickt der Benutzer einmal, um zu filtern, und sowohl Diagramme als auch benutzerdefinierte Inhalte werden basierend auf demselben Bereich aktualisiert.

---

## 4. Diagrammverknüpfungs-JS-Block für Drilldown

![](https://static-docs.nocobase.com/202607121921577.png)

Das Klicken auf das Diagramm zum Drilldown ist eine sehr praktische Interaktion im Dashboard.

Im Arbeitsauftragsszenario klickt der Benutzer auf die Spalte „Status: Offen“ und alle offenen Arbeitsaufträge werden im Detailbereich unten angezeigt; Wenn der Benutzer auf „SLA-Verletzung“ klickt, werden unten alle Überstunden-Arbeitsaufträge angezeigt.

Die Umsetzungsidee ist:

1. Diagrammdatenpunkte tragen `ticketingDrilldown`;
2. Das Diagrammereignis liest diese Drilldown-Informationen;
3. Schreiben Sie Drilldown-Informationen in den Ziel-JS-Blockkontext.
4. Lösen Sie den Ziel-JS-Block zum erneuten Rendern aus.

Der Schlüsselcode im Diagrammereignis lautet wie folgt. Suchen Sie zuerst den Drilldown-JS-Block:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Schreiben Sie dann die durch Klicken auf das Diagramm erhaltenen Drilldown-Bedingungen in den Zielblock:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

Am kritischsten sind diese beiden Zeilen:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

Die erste Zeile übergibt die Drilldown-Bedingung an den JS-Block und die zweite Zeile löst die Aktualisierung des JS-Blocks aus.

Binden Sie abschließend das Diagrammklickereignis:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

Hier wird empfohlen, dass Sie die Bereinigung zurückgeben müssen:

```javascript
return () => chart.off('click', clickHandler);
```

Auf diese Weise können alte Ereignisse bereinigt werden, wenn das Diagramm neu konfiguriert oder neu gerendert wird, um eine wiederholte Bindung zu vermeiden.

Der obige klickereignisbezogene Code gilt für [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) und höhere Versionen. Verweis auf den alten Versionscode:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. So zeigen Sie Details in Drilldown-JS-Blöcken an

![](https://static-docs.nocobase.com/202607121921601.png)

Führen Sie einen Drilldown in den JS-Block durch, um den gerade geschriebenen `ticketingDashboardDrilldown` zu lesen, und fragen Sie dann die Daten gemäß dem darin enthaltenen Filter ab.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Wenn der Benutzer nicht auf das Diagramm geklickt hat, wird eine Eingabeaufforderung angezeigt. Fragen Sie nach dem Klicken den Arbeitsauftrag basierend auf `drilldown.filter` ab:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Rendern Sie dann die Tabelle:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Wenn Sie Drilldown-Bedingungen löschen müssen, können Sie sich auf Folgendes beziehen:

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Die wichtigsten Punkte in diesem Teil sind:

- Das Diagramm ist nur für das Bestehen des Filters verantwortlich.
- Der JS-Block ist für die Abfrage und Anzeige von Details verantwortlich;
- Klicken Sie auf verschiedene Diagramme, um denselben Drilldown-Block zu teilen.

---

## Praktische Vorschläge

### 1. Beeilen Sie sich nicht, die komplexe Seite als Ganzes zu programmieren

Die wichtigste Lektion dieser Seite ist: Stellen Sie native Fähigkeiten nicht gegen JS-Fähigkeiten aus.

Wenn eine Funktion bereits eine native Funktion von NocoBase ist, wie z. B. Filterung, Diagrammabfrage, Tabellenanzeige und Berechtigungskontrolle, wird zuerst der native Block verwendet. Auf diese Weise können Felder, Filterbedingungen und Diagrammkaliber nachträglich angepasst werden und weiterhin auf der Oberfläche konfiguriert werden.

JS-Blöcke eignen sich besser für die Verarbeitung von Teilen, in denen native Blöcke nicht gut sind, z. B. das Kombinieren mehrerer Indikatoren zu einer Reihe von KPIs, spezielle Kartenstile, die Anzeige einer Reihe benutzerdefinierter Details nach dem Klicken auf das Diagramm oder die Weitergabe von Geschäftskontext zwischen verschiedenen Blöcken.

Mit anderen Worten: Der native Block ist für „konfigurierbare Standardfunktionen“ und der JS-Block für „geschäftsorientierte personalisierte Erfahrungen“ verantwortlich. Dies ist auch die wiederverwendbareste Konstruktionsidee für dieses Armaturenbrett.

### 2. Für einfache Statistiken verwenden Sie zunächst den Diagrammblock-Abfrage-Builder.

Dadurch bleiben die standardmäßigen Abfrage-, Berechtigungen-, Filter- und Aktualisierungsfunktionen von NocoBase erhalten. Nur wenn der Standarddiagrammstil den Geschäftsschwerpunkt nicht ausdrücken kann, verwenden Sie die benutzerdefinierte ECharts-Option zur visuellen Optimierung.

### 3. KPI-Karten geben der Verwendung von JS-Blöcken Vorrang

KPIs erfordern häufig mehrere Abfragen, Bedingungskombinationen und benutzerdefinierte Layouts, und JS-Blöcke sind flexibler. Insbesondere wenn KPIs auf die gleichen Systemfilterbedingungen reagieren müssen, ist es klarer, JS-Blöcke zu verwenden, um sie einheitlich zu verarbeiten.

### 4. Diagrammereignisse sollten eine Bereinigung zurückgeben

Empfohlene Schreibmethode:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

Verwenden Sie `chart.off('click')` nicht direkt zum Löschen aller Klickereignisse, da dies möglicherweise versehentlich den Diagrammblock löscht oder die eigene Überwachung des Panels konfiguriert.

---

## Lassen Sie sich von der KI beim Aufbau unterstützen

Diese Art von Dashboard eignet sich sehr gut für die KI-gestützte Generierung, da sie gleichzeitig Datenmodelle, statistische Kaliber, Diagrammstile und Seiteninteraktionen umfasst. Sie können ihm den Inhalt dieses Artikels weitergeben und Fragen stellen, indem Sie die folgenden Aufforderungswörter verwenden.

Sie können Fragen wie diese stellen:

```markdown
Ich verwende NocoBase, um ein operatives Dashboard für ein Arbeitsauftragssystem zu erstellen.
Bitte nehmen Sie das Arbeitsauftragsszenario als Beispiel und helfen Sie mir beim Entwerfen eines Operations-Dashboards.

Die Datentabelle Tickets enthält:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

Die Seite erfordert:

1. Oberer Filter: Erstellt am, Servicegruppe, Anforderungstyp, Priorität, SLA-Status.
2. KPI-Karten: Offener Rückstand, Nicht zugewiesen, SLA-Warnung, SLA-Verstoß, Neue Tickets, Gelöste Tickets.
3. Diagramm: Trend der erstellten Tickets, Ticketstatus, SLA-Status, Prioritätenmix.
4. Nachdem Sie auf das Diagramm geklickt haben, zeigt der JS-Block unten die entsprechende Ticket-Drilldown-Tabelle an.
5. Der Diagrammstil sollte für den operativen Markt geeignet sein, mit klaren Farben und kompaktem Layout.
6. Verwenden Sie ctx.t() für alle JS-Kopien.
7. Diagrammereignisse verwenden chart.on und geben die Bereinigungsfunktion zurück.
8. Priorisieren Sie mithilfe der nativen Filterblöcke und Diagrammblöcke von NocoBase. Verwenden Sie JS-Blöcke nur für KPIs, Drilldown-Details, spezielle Stile und blockübergreifende Interaktionen. Schreiben Sie nicht die gesamte Seite als einen großen JS-Block.

Bitte geben Sie die Konfigurationsideen für jeden Block an und markieren Sie den Schlüssel-JS-Code.
```

Wenn Sie bereits eine Seite haben, können Sie sich auch von KI bei der Optimierung unterstützen lassen:

```markdown
Das ist mein aktuelles NocoBase-Dashboard-Design:
Oben befindet sich der Filterbereich, in der Mitte vier Diagramme und unten der Drilldown-JS-Block.
Bitte helfen Sie mir bei der Optimierung aus Sicht der Bedienererfahrung:

1. Welche Indikatoren soll der KPI anzeigen?
2. Ob eine Verknüpfung zwischen Diagrammen erforderlich ist;
3. Welche Spalten sollen in den Drilldown-Details angezeigt werden;
4. Wie sollten JS-Block- und Chart-Ereignisse organisiert werden?
5. Welcher Code sollte in der benutzerdefinierten Diagrammoption und welcher im JS-Block platziert werden.
```

Auf diese Weise werden die von der KI generierten Inhalte näher am realen Geschäft sein, anstatt nur isolierten Code bereitzustellen.

:::warning
Wenn Sie sich bei der Erstellung von KI unterstützen lassen möchten, verwenden Sie bitte den Backup-Manager, um das Projekt vor dem Start zu sichern.
:::

## Referenzdokumentation

- [Diagrammkonfiguration ](/data-visualization/guide/chart-options)
- [Frontend RunJS](/runjs/)
- [Filterformular ](/interface-builder/blocks/filter-blocks/form)
- [KI-Konstruktion – Schnittstellenkonstruktion ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
