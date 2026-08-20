# Roadmap — sistema de vendas interno (nome provisório: `sistema-vendas`)

Objetivo: sair do zero até a vendedora e os funcionários usando de verdade, no caminho mais curto que não sacrifica qualidade. Prioridade: MVP funcionando ponta a ponta primeiro, polimento depois.

## Decisões já tomadas
- Plataforma: PWA (React + Vite) — instalável no celular, sem loja de app
- Stack: Node/Express + Prisma (v6.19.3) + PostgreSQL (Neon)
- Papéis: vendedora (admin) e funcionários (compradores)
- Autenticação: PIN numérico (4-6 dígitos), hash com bcryptjs, JWT (30 dias)
- Hospedagem: mesma VPS via CloudPanel, em subdomínio próprio, isolado do `sistema-tec-tel`

---

## ✅ Fase 0 — Setup do projeto — **concluída**
- [x] Repositório `sistema-vendas-interna`, branch `developer`
- [x] `.gitignore` configurado antes de instalar dependências, `.env` nunca commitado

## ✅ Fase 1 — Autenticação: decisão — **concluída**
- [x] PIN numérico por usuário

## ✅ Fase 2 — Backend esqueleto + primeiro deploy local — **concluída**
- [x] Express + Prisma conectado ao Neon
- [x] Estrutura `backend/src/{controllers,routes,middlewares,lib}`

## ✅ Fase 3 — Modelo de dados — **concluída**
- [x] `schema.prisma`: `Usuario`, `Produto`, `Pedido`, `ItemPedido`
- [x] Migration `20260814203210_init` aplicada no Neon
- [x] `JWT_SECRET` forte gerado (sem placeholder)

## ✅ Fase 4 — Backend: regras de negócio — **concluída**
- [x] Login por telefone + PIN, JWT com papel embutido
- [x] `authMiddleware` + `adminOnly`
- [x] CRUD de produtos (GET aberto pra ambos os papéis, resto admin-only)
- [x] Criar usuário (admin-only, PIN validado e hasheado)
- [x] Pedidos: criação transacional com desconto de estoque à prova de race condition (`updateMany` com checagem `gte` dentro da transaction), snapshot de preço por item
- [x] Marcar pedido como pago (idempotente — recusa se já pago)
- [x] Saldo de fiado (próprio e por usuário, admin-only nesse segundo caso)
- [x] Seed de admin bootstrap (telefone `00000000000`, trocar o PIN)

**Backend do MVP está funcionalmente completo.** Dá pra testar tudo hoje via curl/Postman. O que falta agora é só o frontend.

---

## ✅ Fase 5 — Frontend: esqueleto e autenticação — **concluída**
- [x] `react-router-dom`: rotas base da aplicação
- [x] Serviço de API (`src/services/api.js`) — wrapper de fetch/axios que injeta o token JWT automaticamente e trata erro 401 (desloga e redireciona pro login)
- [x] `AuthContext`: guarda usuário logado + token, expõe `login()`/`logout()`, persiste sessão (ex: localStorage do token, ok nesse caso por não ser dado sensível como senha)
- [x] Tela de login (telefone + PIN)
- [x] Rotas protegidas: redireciona pro login se não autenticado; redireciona admin ↔ funcionário para os respectivos painéis
- [x] Config PWA: manifest, ícones, service worker básico (`vite-plugin-pwa`) — instalável no Android desde essa fase, mesmo com telas simples

## ✅ Fase 6 — Painel da vendedora (admin) — **concluída**
- [x] Layout/navegação do admin
- [x] Dashboard: produtos com estoque baixo, total em aberto (fiado), pedidos recentes
- [x] CRUD de produtos (listar, criar, editar, excluir) — página completa consumindo `/produtos`
- [x] Cadastro de funcionário (consome `POST /usuarios`)
- [x] Lista de pedidos com filtro por status (fiado/pago)
- [x] Marcar pedido como pago
- [x] Ver saldo em aberto por funcionário (`GET /pedidos/saldo/:usuarioId`)

## ✅ Fase 7 — Painel do funcionário — **concluída**
- [x] Layout/navegação do funcionário
- [x] Catálogo de produtos (view-only, mostra estoque disponível)
- [x] Montar pedido (carrinho simples) e enviar (`POST /pedidos`)
- [x] Meu saldo + histórico de pedidos próprios (`GET /pedidos/meu-saldo`)

## 🔲 Fase 8 — Integração e teste ponta a ponta
- [ ] Testar sozinho o fluxo completo: cadastra produto → funcionário pede → estoque desconta → marca como pago
- [ ] Instalar o PWA num celular de verdade e testar por lá
- [ ] Testar o que acontece na UI quando o backend recusa (estoque insuficiente, pedido já pago, PIN errado) — tratar erro, não só o caminho feliz

## 🔲 Fase 9 — Deploy final + revisão de segurança
- [ ] Build de produção do frontend (`npm run build`)
- [ ] Servir no CloudPanel (mesmo subdomínio da API ou estático separado — decidir na hora)
- [ ] `VITE_API_URL` de produção configurada corretamente no build
- [ ] Checklist de segurança: CORS restrito, `JWT_SECRET` de produção (diferente do local), `.env` fora do git, trocar o PIN do admin bootstrap

## 🔲 Fase 10 — Rollout
- [ ] Vendedora testa por alguns dias com dados reais
- [ ] Ajustes com base no uso real
- [ ] Libera para os funcionários

---

## O que cortar do MVP pra ganhar velocidade
- Relatórios/gráficos bonitos (um total simples no dashboard já resolve no início)
- E-mail de cobrança de fiado (notificações push foram implementadas como extra)
- Edição de pedido já feito (por enquanto: cancelar e criar de novo)

## Funcionalidades extras implementadas fora do escopo original
- Notificações push
- Tela de Faturas agrupada por cliente
- Redesign com tema escuro
- Helmet e rate limiting no login
