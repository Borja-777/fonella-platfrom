import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { TipoDocumento, TipoRemision } from "@prisma/client";

/**
 * Datos del acudiente o responsable del paciente.
 * Es obligatorio cuando el paciente es menor de 18 años (RN-06).
 */
export class AcudienteInputDto {
  @IsEnum(TipoDocumento, {
    message: "El tipo de documento del acudiente debe ser RC, TI, CC, CE o PA.",
  })
  tipoDocumento: TipoDocumento;

  @IsString()
  @IsNotEmpty({ message: "El número de documento del acudiente es obligatorio." })
  @MaxLength(30)
  numeroDocumento: string;

  @IsString()
  @IsNotEmpty({ message: "Los nombres del acudiente son obligatorios." })
  @MaxLength(100)
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: "Los apellidos del acudiente son obligatorios." })
  @MaxLength(100)
  apellidos: string;

  @IsString()
  @IsNotEmpty({ message: "El parentesco del acudiente es obligatorio." })
  @MaxLength(50)
  parentesco: string;

  @IsString()
  @IsNotEmpty({ message: "El teléfono principal del acudiente es obligatorio." })
  @MaxLength(25)
  telefonoPrincipal: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefonoRespaldo?: string;

  @IsOptional()
  @IsEmail({}, { message: "El correo electrónico del acudiente no es válido." })
  @MaxLength(150)
  email?: string;
}

/**
 * Payload de entrada para registrar un nuevo paciente.
 * ValidationPipe (con whitelist: true) descarta cualquier propiedad no declarada aquí.
 */
export class CrearPacienteDto {
  @IsEnum(TipoDocumento, {
    message: "El tipo de documento debe ser RC, TI, CC, CE o PA.",
  })
  tipoDocumento: TipoDocumento;

  @IsString()
  @IsNotEmpty({ message: "El número de documento del paciente es obligatorio." })
  @MaxLength(30)
  numeroDocumento: string;

  @IsString()
  @IsNotEmpty({ message: "Los nombres del paciente son obligatorios." })
  @MaxLength(100)
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: "Los apellidos del paciente son obligatorios." })
  @MaxLength(100)
  apellidos: string;

  @IsDateString(
    {},
    { message: "La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)." },
  )
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  genero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefonoContacto?: string;

  @IsOptional()
  @IsEmail({}, { message: "El correo electrónico del paciente no es válido." })
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsEnum(TipoRemision, {
    message: "El tipo de remisión debe ser PARTICULAR, REMISION_EXTERNA o ESCOLAR.",
  })
  tipoRemision?: TipoRemision;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  institucionRemitente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  profesionalRemitente?: string;

  // Acudiente opcional en el DTO; el servicio lo exige si edad < 18 (RN-06)
  @IsOptional()
  @ValidateNested()
  @Type(() => AcudienteInputDto)
  acudiente?: AcudienteInputDto;
}

/**
 * Payload de entrada para actualizar los datos de un paciente existente.
 * Todos los campos son opcionales; solo se actualizan los enviados.
 */
export class ActualizarPacienteDto {
  @IsOptional()
  @IsEnum(TipoDocumento, {
    message: "El tipo de documento debe ser RC, TI, CC, CE o PA.",
  })
  tipoDocumento?: TipoDocumento;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "El número de documento del paciente no puede estar vacío." })
  @MaxLength(30)
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Los nombres del paciente no pueden estar vacíos." })
  @MaxLength(100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Los apellidos del paciente no pueden estar vacíos." })
  @MaxLength(100)
  apellidos?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: "La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)." },
  )
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  genero?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "El teléfono de contacto no puede estar vacío." })
  @MaxLength(25)
  telefonoContacto?: string;

  @IsOptional()
  @IsEmail({}, { message: "El correo electrónico del paciente no es válido." })
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsEnum(TipoRemision, {
    message: "El tipo de remisión debe ser PARTICULAR, REMISION_EXTERNA o ESCOLAR.",
  })
  tipoRemision?: TipoRemision;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  institucionRemitente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  profesionalRemitente?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AcudienteInputDto)
  acudiente?: AcudienteInputDto;
}
