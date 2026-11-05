-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "foto_perfil_url" TEXT,
ADD COLUMN     "oculto_en_panel" BOOLEAN NOT NULL DEFAULT false;
