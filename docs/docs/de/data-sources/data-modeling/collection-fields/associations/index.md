:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Beziehungsfelder

In NocoBase sind Beziehungsfelder keine echten Felder, sondern dienen dazu, Verbindungen zwischen Sammlungen herzustellen. Dieses Konzept entspricht den Beziehungen in relationalen Datenbanken.

In relationalen Datenbanken gibt es hauptsächlich die folgenden gängigen Beziehungstypen:

- [Eins-zu-Eins](./o2o/index.md): Jede Entität in zwei Sammlungen entspricht nur einer Entität in der anderen Sammlung. Diese Art von Beziehung wird typischerweise verwendet, um verschiedene Aspekte einer Entität in separaten Sammlungen zu speichern, um Redundanz zu reduzieren und die Datenkonsistenz zu verbessern.
- [Eins-zu-Viele](./o2m/index.md): Jede Entität in einer Sammlung kann mit mehreren Entitäten in einer anderen Sammlung verknüpft sein. Dies ist einer der häufigsten Beziehungstypen. Zum Beispiel kann ein Autor mehrere Artikel schreiben, aber ein Artikel hat immer nur einen Autor.
- [Viele-zu-Eins](./m2o/index.md): Mehrere Entitäten in einer Sammlung können mit einer Entität in einer anderen Sammlung verknüpft sein. Dieser Beziehungstyp ist auch in der Datenmodellierung weit verbreitet. Zum Beispiel können mehrere Studenten derselben Klasse angehören.
- [Viele-zu-Viele](./m2m/index.md): Mehrere Entitäten in zwei Sammlungen können miteinander verknüpft sein. Dieser Beziehungstyp erfordert typischerweise eine Zwischensammlung, um die Verknüpfungen zwischen den Entitäten zu erfassen. Ein Beispiel ist die Beziehung zwischen Studenten und Kursen: Ein Student kann sich für mehrere Kurse einschreiben, und ein Kurs kann von mehreren Studenten belegt werden.

Diese Beziehungstypen spielen eine wichtige Rolle im Datenbankdesign und in der Datenmodellierung. Sie helfen dabei, komplexe Beziehungen und Datenstrukturen der realen Welt zu beschreiben.