# Caddy

Se você já tem um domínio e quer colocar o HTTPS no ar rapidamente, o Caddy costuma ser a opção mais simples.

O caminho padrão é executar `nb env proxy caddy` diretamente.

## Caminho padrão

```bash
nb env proxy caddy --env demo --host demo.example.com
```

Se você já está no env atual, também pode omitir `--env`.

## Quando escrever à mão

Se o app não é gerenciado pela CLI ou você quer manter todo o `Caddyfile` manualmente, use uma configuração mínima com `reverse_proxy` apontando para o endereço interno real do NocoBase.
