ALTER TABLE "produtos"
ADD COLUMN "precoPromocional" DECIMAL(10, 2),
ADD COLUMN "promocaoAtiva" BOOLEAN NOT NULL DEFAULT false;
