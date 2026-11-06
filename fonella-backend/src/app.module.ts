import { Module } from '@nestjs/common';
import { CitasModule } from './citas/citas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CitasModule,
  ],
})
export class AppModule {}
