import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotasEvolucionController } from './notas-evolucion.controller';
import { NotasEvolucionService } from './notas-evolucion.service';

@Module({
  imports: [AuthModule],
  controllers: [NotasEvolucionController],
  providers: [NotasEvolucionService],
  exports: [NotasEvolucionService],
})
export class NotasEvolucionModule {}
