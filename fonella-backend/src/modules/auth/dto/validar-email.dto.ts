import { IsEmail, IsNotEmpty } from 'class-validator';

export class ValidarEmailDto {
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email!: string;
}
