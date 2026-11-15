import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoDocumento, TipoRemision } from '@prisma/client';

export class CrearPacienteDto {
  @IsEnum(TipoDocumento)
  tipoDocumento: TipoDocumento;

  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @IsString()
  numeroDocumento: string;

  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @IsString()
  nombres: string;

  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @IsString()
  apellidos: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsNotEmpty({ message: 'El teléfono de contacto es obligatorio' })
  @IsString()
  telefonoContacto: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsEnum(TipoRemision)
  tipoRemision?: TipoRemision;

  @IsOptional()
  @IsString()
  institucionRemitente?: string;
}
