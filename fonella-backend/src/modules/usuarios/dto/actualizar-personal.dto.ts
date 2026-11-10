import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
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
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
    {
      message:
        "La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%...).",
    },
  )
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

  @IsOptional()
  @IsBoolean({ message: "El estado de oculto debe ser un valor booleano." })
  ocultoEnPanel?: boolean;
}
