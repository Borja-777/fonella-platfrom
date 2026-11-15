import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

@Module({
  imports: [AuthModule],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
