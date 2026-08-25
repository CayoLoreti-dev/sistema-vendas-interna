CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'COLOCOU_PRA_VENDA');

CREATE TABLE "estoques_internos" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoques_internos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "estoques_internos_vendedorId_produtoId_key" ON "estoques_internos"("vendedorId", "produtoId");

CREATE INDEX "movimentacoes_estoque_estoqueId_idx" ON "movimentacoes_estoque"("estoqueId");
CREATE INDEX "movimentacoes_estoque_vendedorId_idx" ON "movimentacoes_estoque"("vendedorId");
CREATE INDEX "movimentacoes_estoque_produtoId_idx" ON "movimentacoes_estoque"("produtoId");

ALTER TABLE "estoques_internos" ADD CONSTRAINT "estoques_internos_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estoques_internos" ADD CONSTRAINT "estoques_internos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "estoques_internos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
