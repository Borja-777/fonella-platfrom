import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
} from "class-validator";

export class RegistroAdministradorDto {
  @IsNotEmpty({ message: "El nombre completo es obligatorio" })
  @IsString({ message: "El nombre completo debe ser una cadena de texto" })
  nombreCompleto: string;

  @IsNotEmpty({ message: "El correo electrónico es obligatorio" })
  @IsEmail({}, { message: "El formato de correo no es válido" })
  email: string;

  @IsNotEmpty({ message: "La contraseña es obligatoria" })
  @MinLength(8, { message: "La contraseña debe tener mínimo 8 caracteres" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        "La contraseña debe contener al menos 1 letra mayúscula, 1 minúscula, 1 número y 1 carácter especial",
    },
  )
  password: string;

  @IsOptional()
  @IsString({ message: "El código ReTHUS debe ser una cadena de texto" })
  registroRethus?: string;

  @IsOptional()
  @IsString({ message: "La fotografía de perfil debe ser una URL o Base64 válido" })
  fotoPerfilUrl?: string;
}
