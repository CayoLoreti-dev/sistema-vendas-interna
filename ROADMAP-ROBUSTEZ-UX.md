# Roadmap de robustez e acabamento

## Objetivo
Deixar o sistema mais confiavel para uso diario e com interface mais madura, sem implementar backup nesta rodada.

## Fase 1 - Base de producao segura
- Criar endpoint `/health` para validar backend, banco e pasta de uploads.
- Adicionar logs estruturados por request com `requestId`, metodo, rota, status e tempo.
- Proteger exclusao de produtos com historico, usando inativacao em vez de apagar dados usados em pedidos, estoque ou movimentacoes.
- Mostrar no painel quando um produto estiver inativo.

## Fase 2 - Operacao sem susto
- Melhorar mensagens de erro de estoque, fatura e pedido.
- Criar estados vazios mais claros em paginas operacionais.
- Adicionar filtros simples em auditoria e pedidos.
- Revisar permissoes de vendedor/master nas telas mais sensiveis.

## Fase 3 - Frontend menos generico
- Padronizar componentes visuais de tabela, badges, botoes e formularios.
- Melhorar o dashboard para ser mais operacional.
- Ajustar densidade visual das telas de estoque, faturas e pedidos.
- Revisar mobile do catalogo, carrinho, faturas e estoque.

## Fase 4 - Observabilidade e manutencao
- Adicionar pagina interna simples de status do sistema para master.
- Padronizar logs de erro inesperado com contexto.
- Criar checklist de deploy e verificacao pos-deploy.

## Fora desta rodada
- Backup automatico.
