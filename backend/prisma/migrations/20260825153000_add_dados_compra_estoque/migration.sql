CREATE TYPE "TipoCompraEstoque" AS ENUM ('CAIXA', 'PACOTE');

ALTER TABLE "movimentacoes_estoque"
ADD COLUMN "fornecedor" TEXT,
ADD COLUMN "precoPago" DECIMAL(10, 2),
ADD COLUMN "tipoCompra" "TipoCompraEstoque",
ADD COLUMN "quantidadeCaixas" INTEGER,
ADD COLUMN "quantidadePacotes" INTEGER;
