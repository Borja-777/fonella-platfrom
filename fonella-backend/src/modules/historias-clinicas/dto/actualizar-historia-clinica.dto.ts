import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EstadoHistoria } from '@prisma/client';

export class ActualizarHistoriaClinicaDto {
  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  antecedentesPerinatales?: string;

  @IsOptional()
  @IsObject({ message: 'La evaluación OFA debe ser un objeto estructurado' })
  evaluacionOfa?: Record<string, any>;

  @IsOptional()
  @IsString()
  evaluacionHabla?: string;

  @IsOptional()
  @IsString()
  evaluacionLenguaje?: string;

  @IsOptional()
  @IsString()
  evaluacionVoz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  diagnosticoCie10Codigo?: string;

  @IsOptional()
  @IsString()
  diagnosticoCie10Desc?: string;

  @IsOptional()
  @IsString()
  planTratamiento?: string;

  @IsOptional()
  @IsEnum(EstadoHistoria)
  estado?: EstadoHistoria;
}
