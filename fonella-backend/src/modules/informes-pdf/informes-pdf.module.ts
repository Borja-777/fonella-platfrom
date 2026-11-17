import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InformesPdfController } from './informes-pdf.controller';
import { InformesPdfService } from './informes-pdf.service';

@Module({
  imports: [AuthModule],
  controllers: [InformesPdfController],
  providers: [InformesPdfService],
  exports: [InformesPdfService],
})
export class InformesPdfModule {}
