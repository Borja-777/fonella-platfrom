import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./modules/mail/mail.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { InventarioModule } from "./modules/inventario/inventario.module";
import { PacientesModule } from "./modules/pacientes/pacientes.module";
import { CitasModule } from "./modules/citas/citas.module";
import { HistoriasClinicasModule } from "./modules/historias-clinicas/historias-clinicas.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UsuariosModule,
    InventarioModule,
    PacientesModule,
    CitasModule,
    HistoriasClinicasModule,
  ],
})
export class AppModule {}
