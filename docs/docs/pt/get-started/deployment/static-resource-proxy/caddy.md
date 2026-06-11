---
title: "Proxy de recursos estáticos com Caddy"
description: "Use o Caddy como proxy dos recursos estáticos do NocoBase para simplificar o HTTPS e a configuração de entrada em produção."
keywords: "Caddy,proxy de recursos estáticos,reverse proxy,HTTPS automático,produção,NocoBase"
---

# Caddy

Se você quer configurar hoje o proxy de produção para uma aplicação NocoBase, o melhor ponto de partida é [Reverse proxy em produção](../../../nocobase-cli/production/reverse-proxy/index.md) e, em seguida, a página [Caddy](../../../nocobase-cli/production/reverse-proxy/caddy.md).

Esta seção mais antiga servia principalmente como entrada para o proxy de recursos estáticos. A documentação atual foi reorganizada em torno de `nb proxy caddy`, que cobre de forma unificada a geração de configuração, a execução local ou com Docker, a entrada HTTPS e as rotas `uploads`, `dist`, `api`, `ws` e SPA.
