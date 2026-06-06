# Nginx

Se você já usa Nginx no servidor para gerenciar sites ou ainda quer manter certificados, cache e controle de acesso por conta própria, continuar com Nginx é o caminho mais direto.

Para envs do NocoBase gerenciados pela CLI, o caminho padrão é usar `nb env proxy nginx`. A CLI mantém o arquivo de entrada editável, as páginas de fallback SPA, a configuração principal compartilhada e os snippets compartilhados.

## Caminho padrão

```bash
nb env proxy nginx --env demo --host demo.example.com
```

Se você já está no env atual, também pode omitir `--env`.

## Quando escrever à mão

Se o app não é gerenciado pela CLI ou você quer manter toda a configuração do Nginx manualmente, use um `server` block normal e aponte `proxy_pass` para o endereço interno real do NocoBase.
