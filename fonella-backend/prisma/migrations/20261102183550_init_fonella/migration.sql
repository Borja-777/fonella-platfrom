-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('FONOAUDIOLOGA', 'ASISTENTE');

-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('RC', 'TI', 'CC', 'CE', 'PA');

-- CreateEnum
CREATE TYPE "TipoRemision" AS ENUM ('PARTICULAR', 'REMISION_EXTERNA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('CONFIRMADA', 'ATENDIDA', 'CANCELADA_A_TIEMPO', 'CANCELADA_TARDIA', 'INASISTENCIA');

-- CreateEnum
CREATE TYPE "EstadoHistoria" AS ENUM ('BORRADOR', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_INVENTARIO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "registro_rethus" VARCHAR(50),
    "firma_digital_url" VARCHAR(500),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" UUID NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "numero_documento" VARCHAR(30) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "genero" VARCHAR(30),
    "telefono_contacto" VARCHAR(25) NOT NULL,
    "email" VARCHAR(150),
    "ciudad" VARCHAR(100) NOT NULL DEFAULT 'Palmira',
    "direccion" VARCHAR(200),
    "tipo_remision" "TipoRemision" NOT NULL DEFAULT 'PARTICULAR',
    "institucion_remitente" VARCHAR(150),
    "total_faltas_tardias" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acudientes" (
    "id" UUID NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "numero_documento" VARCHAR(30) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "telefono_principal" VARCHAR(25) NOT NULL,
    "telefono_respaldo" VARCHAR(25),
    "email" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acudientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes_acudientes" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "acudiente_id" UUID NOT NULL,
    "parentesco" VARCHAR(50) NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pacientes_acudientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_terapeuticos" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "publico_objetivo" VARCHAR(100) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL DEFAULT 45,
    "precio_referencia" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "servicios_terapeuticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "creado_por_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'CONFIRMADA',
    "recordatorio_24h_enviado" BOOLEAN NOT NULL DEFAULT false,
    "recordatorio_2h_enviado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_cancelacion" TEXT,
    "fecha_cancelacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_clinicas" (
    "id" UUID NOT NULL,
    "numero_expediente" VARCHAR(30) NOT NULL,
    "paciente_id" UUID NOT NULL,
    "creado_por_id" UUID NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo_consulta" TEXT NOT NULL,
    "antecedentes_perinatales" TEXT,
    "evaluacion_ofa" JSONB NOT NULL,
    "evaluacion_habla" TEXT,
    "evaluacion_lenguaje" TEXT,
    "evaluacion_voz" TEXT,
    "diagnostico_cie10_codigo" VARCHAR(15) NOT NULL,
    "diagnostico_cie10_desc" TEXT NOT NULL,
    "plan_tratamiento" TEXT NOT NULL,
    "estado" "EstadoHistoria" NOT NULL DEFAULT 'CERRADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_evolucion" (
    "id" UUID NOT NULL,
    "historia_clinica_id" UUID NOT NULL,
    "cita_id" UUID,
    "creado_por_id" UUID NOT NULL,
    "numero_sesion" INTEGER NOT NULL,
    "fecha_hora_sesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objetivo_sesion" TEXT NOT NULL,
    "actividades_desarrolladas" TEXT NOT NULL,
    "desempeno_observado" TEXT NOT NULL,
    "plan_casero_tareas" TEXT NOT NULL,
    "firma_profesional_snapshot" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_evolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_adjuntos" (
    "id" UUID NOT NULL,
    "historia_clinica_id" UUID NOT NULL,
    "subido_por_id" UUID NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "archivo_uuid" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juguetes_didacticos" (
    "id" UUID NOT NULL,
    "codigo_sku" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion_terapeutica" TEXT NOT NULL,
    "area_estimulacion" VARCHAR(100) NOT NULL,
    "edad_sugerida" VARCHAR(50) NOT NULL,
    "imagen_url" VARCHAR(500) NOT NULL,
    "stock_disponible" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo_alerta" INTEGER NOT NULL DEFAULT 3,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "publicado_catalogo" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "juguetes_didacticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "juguete_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo_movimiento" "TipoMovimientoInventario" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_resultante" INTEGER NOT NULL,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_juguetes" (
    "id" UUID NOT NULL,
    "juguete_id" UUID NOT NULL,
    "paciente_id" UUID,
    "vendido_por_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "costo_unitario_snapshot" DECIMAL(10,2) NOT NULL,
    "precio_unitario_venta" DECIMAL(10,2) NOT NULL,
    "total_venta" DECIMAL(10,2) NOT NULL,
    "ganancia_neta" DECIMAL(10,2) NOT NULL,
    "fecha_venta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_juguetes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");

-- CreateIndex
CREATE INDEX "pacientes_apellidos_nombres_idx" ON "pacientes"("apellidos", "nombres");

-- CreateIndex
CREATE UNIQUE INDEX "acudientes_numero_documento_key" ON "acudientes"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_acudientes_paciente_id_acudiente_id_key" ON "pacientes_acudientes"("paciente_id", "acudiente_id");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_terapeuticos_codigo_key" ON "servicios_terapeuticos"("codigo");

-- CreateIndex
CREATE INDEX "citas_fecha_estado_idx" ON "citas"("fecha", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "historias_clinicas_numero_expediente_key" ON "historias_clinicas"("numero_expediente");

-- CreateIndex
CREATE UNIQUE INDEX "historias_clinicas_paciente_id_key" ON "historias_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "historias_clinicas_diagnostico_cie10_codigo_idx" ON "historias_clinicas"("diagnostico_cie10_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "notas_evolucion_cita_id_key" ON "notas_evolucion"("cita_id");

-- CreateIndex
CREATE UNIQUE INDEX "archivos_adjuntos_archivo_uuid_key" ON "archivos_adjuntos"("archivo_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "juguetes_didacticos_codigo_sku_key" ON "juguetes_didacticos"("codigo_sku");

-- CreateIndex
CREATE INDEX "ventas_juguetes_fecha_venta_idx" ON "ventas_juguetes"("fecha_venta");

-- AddForeignKey
ALTER TABLE "pacientes_acudientes" ADD CONSTRAINT "pacientes_acudientes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes_acudientes" ADD CONSTRAINT "pacientes_acudientes_acudiente_id_fkey" FOREIGN KEY ("acudiente_id") REFERENCES "acudientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios_terapeuticos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_evolucion" ADD CONSTRAINT "notas_evolucion_historia_clinica_id_fkey" FOREIGN KEY ("historia_clinica_id") REFERENCES "historias_clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_evolucion" ADD CONSTRAINT "notas_evolucion_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_evolucion" ADD CONSTRAINT "notas_evolucion_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_adjuntos" ADD CONSTRAINT "archivos_adjuntos_historia_clinica_id_fkey" FOREIGN KEY ("historia_clinica_id") REFERENCES "historias_clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_adjuntos" ADD CONSTRAINT "archivos_adjuntos_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_juguete_id_fkey" FOREIGN KEY ("juguete_id") REFERENCES "juguetes_didacticos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_juguetes" ADD CONSTRAINT "ventas_juguetes_juguete_id_fkey" FOREIGN KEY ("juguete_id") REFERENCES "juguetes_didacticos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_juguetes" ADD CONSTRAINT "ventas_juguetes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_juguetes" ADD CONSTRAINT "ventas_juguetes_vendido_por_id_fkey" FOREIGN KEY ("vendido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
