-- AlterEnum
ALTER TYPE "TipoRemision" ADD VALUE 'ESCOLAR';

-- AlterTable
ALTER TABLE "juguetes_didacticos" ALTER COLUMN "imagen_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pacientes" ADD COLUMN     "profesional_remitente" VARCHAR(150);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "foto_perfil_url" TEXT,
ADD COLUMN     "oculto_en_panel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_token" VARCHAR(255),
ADD COLUMN     "reset_token_expira" TIMESTAMP(3);
