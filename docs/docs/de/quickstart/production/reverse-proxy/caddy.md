# Caddy

Wenn du bereits eine Domain hast und HTTPS möglichst schnell mit einrichten willst, ist Caddy normalerweise der unkompliziertere Weg. In den meisten Fällen reicht schon ein sehr kurzes `Caddyfile`.

## Minimale lauffähige Konfiguration

Bearbeite `/etc/caddy/Caddyfile`:

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

Dabei gilt:

- Ersetze `your-domain.com` durch deine Domain
- Ersetze `127.0.0.1:13000` durch die tatsächliche Adresse, auf der NocoBase lauscht

Wenn die Domain bereits korrekt auf den aktuellen Server zeigt, kümmert sich Caddy normalerweise automatisch um Ausstellung und Erneuerung des HTTPS-Zertifikats.

## Konfiguration prüfen und neu laden

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Wenn du Caddy nicht mit `systemd` verwaltest, verwende stattdessen deinen eigenen Start- und Reload-Workflow.

## Wenn du erst einmal nur HTTP willst

Wenn du noch keine Domain hast, kannst du zum Testen zunächst auch einfach einen Port lauschen lassen:

```shell
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

Für eine echte Produktionsumgebung solltest du aber möglichst bald zu einer Konfiguration mit Domain wechseln.

## Wann Caddy meist besser passt

- Du möchtest HTTPS schneller aktivieren
- Du willst nicht zu viele Reverse-Proxy-Details selbst pflegen
- Du brauchst im Moment nur eine einfache und stabile Einstiegsschicht

## Wohin du als Nächstes gehen kannst

- Wenn deine App noch nicht läuft, lies zuerst [Installation mit Docker Compose](../../installation/docker-compose.md)
- Wenn du noch Ports oder Schlüssel prüfen musst, lies weiter unter [App-Umgebungsvariablen](../../installation/env.md)
