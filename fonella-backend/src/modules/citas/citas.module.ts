import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CitasController } from "./citas.controller";
import { CitasService } from "./citas.service";

/**
 * Módulo de dominio para agenda clínica y gestión de citas.
 */
@Module({
  // AuthModule provee JwtService requerido por JwtAuthGuard en CitasController
  imports: [AuthModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}
