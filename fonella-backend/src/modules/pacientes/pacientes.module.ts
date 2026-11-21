import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PacientesController } from "./pacientes.controller";
import { PacientesService } from "./pacientes.service";

/**
 * Módulo de dominio para la gestión de pacientes y acudientes.
 */
@Module({
  // AuthModule provee JwtService requerido por JwtAuthGuard en PacientesController
  imports: [AuthModule],
  controllers: [PacientesController],
  providers: [PacientesService],
  // Se exporta PacientesService para que otros módulos (ej. citas) puedan consultarlo
  exports: [PacientesService],
})
export class PacientesModule {}
