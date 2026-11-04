import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { RolUsuario } from "@prisma/client";

export class ActualizarPersonalDto {
  @IsOptional()
  @IsString({ message: "El nombre completo debe ser una cadena de texto." })
  @IsNotEmpty({ message: "El nombre completo no puede estar vacío." })
  nombreCompleto?: string;

  @IsOptional()
  @IsEmail({}, { message: "El formato del correo institucional es inválido." })
  email?: string;

  @IsOptional()
  @IsString({ message: "La contraseña debe ser una cadena de texto." })
  @MinLength(8, { message: "La contraseña debe contener al menos 8 caracteres." })
  password?: string;

  @IsOptional()
  @IsEnum(RolUsuario, {
    message: "El rol asignado no es válido (FONOAUDIOLOGA o ASISTENTE).",
  })
  rol?: RolUsuario;

  @IsOptional()
  @IsString({ message: "El registro ReTHUS debe ser una cadena de texto." })
  registroRethus?: string;

  @IsOptional()
  @IsString({ message: "La URL de la foto de perfil debe ser una cadena de texto." })
  fotoPerfilUrl?: string;
}
