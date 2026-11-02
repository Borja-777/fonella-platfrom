import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { RolUsuario } from "@prisma/client";

export class CrearPersonalDto {
  @IsString({ message: "El nombre completo debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre completo es obligatorio" })
  nombreCompleto!: string;

  @IsEmail({}, { message: "El formato de correo electrónico no es válido" })
  @IsNotEmpty({ message: "El correo electrónico es obligatorio" })
  email!: string;

  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La contraseña es obligatoria" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  password!: string;

  @IsEnum(RolUsuario, {
    message: "El rol debe ser FONOAUDIOLOGA o ASISTENTE",
  })
  @IsNotEmpty({ message: "El rol es obligatorio" })
  rol!: RolUsuario;

  @IsOptional()
  @IsString({ message: "El registro ReTHUS debe ser una cadena de texto" })
  registroRethus?: string;
}
