import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ArchivosAdjuntosController } from './archivos-adjuntos.controller';
import { ArchivosAdjuntosService } from './archivos-adjuntos.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ArchivosAdjuntosController],
  providers: [ArchivosAdjuntosService],
  exports: [ArchivosAdjuntosService],
})
export class ArchivosAdjuntosModule {}