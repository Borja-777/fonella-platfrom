import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RestablecerPasswordDto {
  @IsString({ message: 'El token de recuperación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El token de recuperación es obligatorio.' })
  token!: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe contener al menos 8 caracteres.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
    {
      message:
        'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%...).',
    },
  )
  nuevaPassword!: string;
}
