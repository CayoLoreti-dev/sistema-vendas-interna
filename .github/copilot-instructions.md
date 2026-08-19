# Instruções para agentes de IA neste repositório

Este é o `sistema-vendas-interna`: um PWA interno para uma colega vender
lanches (biscoitos, pão etc.) para funcionários da empresa, substituindo
uma planilha manual. Dois papéis: ADMIN (a vendedora) e FUNCIONARIO (quem
compra).

## Antes de qualquer tarefa
1. Leia `roadmap-sistema-vendas.md` na raiz do repo — mostra o que já foi
   feito (`[x]`) e o que falta (`[ ]`).
2. Rode `git log --oneline -15` para confirmar o histórico real de commits.
3. Explore o código relevante à tarefa antes de escrever qualquer coisa —
   nunca assuma que uma tela, rota ou componente não existe sem checar
   primeiro.
4. Se o que está descrito no roadmap não bater com o que você encontra no
   código, PARE e avise o usuário antes de continuar. Não presuma qual dos
   dois está certo, e não tente "corrigir" a divergência sozinho.

## Regras de escopo (não negociáveis)
- Trabalhe SOMENTE no que foi pedido explicitamente na tarefa atual. Não
  implemente fases futuras do roadmap por conta própria, mesmo que pareça
  o próximo passo óbvio.
- Não crie versões paralelas ou duplicadas de componentes que já existem
  (ex: não crie `AdminDashboard.jsx` se `DashboardPage.jsx` já existe e
  faz a mesma coisa). Edite o que já existe, não recomece do zero.
- Nunca renomeie, exclua ou reescreva do zero uma tela/arquivo que já
  funciona, a menos que seja exatamente essa a tarefa pedida.
- Não afrouxe configurações de segurança (CORS, JWT, validação de entrada)
  como atalho para "fazer funcionar local". Se travar por causa disso,
  avise o usuário em vez de contornar silenciosamente.
- Nunca resolva conflito de merge escolhendo "manter minha versão" sem
  mostrar ao usuário o que está sendo descartado primeiro.

## Stack e convenções do projeto
- Backend: Node/Express + Prisma (v6.19.3) + PostgreSQL (Neon).
- Frontend: React + Vite, como PWA (vite-plugin-pwa, estratégia
  `injectManifest`).
- Commits em português, estilo Conventional Commits (`feat:`, `fix:`,
  `chore:`), um commit por tarefa concluída e já testada — nunca várias
  tarefas diferentes misturadas num commit só.
- Nunca commitar `.env`, `node_modules/`, `dist/`, arquivos `*.log`,
  `frontend/dev-dist/`.
- Identidade visual (tema escuro): fundo `#1C1815`, superfície `#241E18`,
  borda `#3A322A`, destaque `#D9A441`, alerta `#C9622B`, sucesso
  `#6B8F5C`, texto `#F2E9DD`. Tipografia: Newsreader (títulos de página),
  IBM Plex Sans (corpo/UI), IBM Plex Mono (todo valor em dinheiro e
  quantidade, classe `.valor-mono`). Qualquer tela nova segue essa mesma
  linguagem visual, nunca cores hardcoded soltas fora dessas variáveis.

## Antes de finalizar qualquer tarefa
- Rode `npm run build` (e `npm run lint`, se existir) nos pacotes que
  você alterou, e confirme que passam sem erro.
- Teste manualmente o fluxo que você implementou antes de dar a tarefa
  por concluída — build passar sem erro não significa que funciona.
- NÃO dê `git push` sem antes mostrar ao usuário o resultado dos testes
  e esperar confirmação — a menos que a tarefa tenha pedido explicitamente
  para commitar e enviar ao final dela.
