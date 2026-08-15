-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('FIADO', 'PIX');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "metodoPagamento" "MetodoPagamento" NOT NULL DEFAULT 'FIADO';
ALTER TABLE "pedidos" ALTER COLUMN "metodoPagamento" DROP DEFAULT;
