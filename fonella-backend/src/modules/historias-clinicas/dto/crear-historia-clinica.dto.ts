import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { EstadoHistoria } from '@prisma/client';

export class CrearHistoriaClinicaDto {
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID válido' })
  pacienteId: string;

  @ValidateIf((o) => o.estado !== EstadoHistoria.BORRADOR)
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio para finalizar la historia' })
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

  @ValidateIf((o) => o.estado !== EstadoHistoria.BORRADOR)
  @IsNotEmpty({ message: 'El código diagnóstico CIE-10 es obligatorio para finalizar' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  diagnosticoCie10Codigo?: string;

  @ValidateIf((o) => o.estado !== EstadoHistoria.BORRADOR)
  @IsNotEmpty({ message: 'La descripción del diagnóstico CIE-10 es obligatoria para finalizar' })
  @IsOptional()
  @IsString()
  diagnosticoCie10Desc?: string;

  @ValidateIf((o) => o.estado !== EstadoHistoria.BORRADOR)
  @IsNotEmpty({ message: 'El plan de tratamiento es obligatorio para finalizar' })
  @IsOptional()
  @IsString()
  planTratamiento?: string;

  @IsOptional()
  @IsEnum(EstadoHistoria)
  estado?: EstadoHistoria;
}
