import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearSolicitudPublicaDto {
  @IsEnum(['MENOR', 'ADULTO'])
  tipoPaciente!: 'MENOR' | 'ADULTO';

  @IsOptional()
  @IsString()
  acudiente?: string;

  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsNotEmpty()
  @IsString()
  paciente!: string;

  @IsNotEmpty()
  @IsString()
  edad!: string;

  @IsNotEmpty()
  @IsString()
  servicio!: string;

  @IsNotEmpty()
  @IsString()
  jornada!: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
