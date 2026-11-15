import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HistoriasClinicasController } from './historias-clinicas.controller';
import { HistoriasClinicasService } from './historias-clinicas.service';

@Module({
  imports: [AuthModule],
  controllers: [HistoriasClinicasController],
  providers: [HistoriasClinicasService],
  exports: [HistoriasClinicasService],
})
export class HistoriasClinicasModule {}
