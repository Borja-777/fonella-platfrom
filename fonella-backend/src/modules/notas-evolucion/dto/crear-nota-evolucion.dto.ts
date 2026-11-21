import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CrearNotaEvolucionDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de sesión debe tener formato ISO válido' })
  fechaSesion?: string;

  @IsNotEmpty({ message: 'Los objetivos terapéuticos abordados son obligatorios' })
  @IsString()
  objetivosTrabajados: string;

  @IsNotEmpty({ message: 'La descripción de la evolución y respuesta del paciente es obligatoria' })
  @IsString()
  descripcionEvolucion: string;

  @IsOptional()
  @IsString()
  planSiguienteSesion?: string;
}
