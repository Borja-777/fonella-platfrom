import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmarCuentaDto {
  @IsNotEmpty({ message: "El token de confirmación es obligatorio" })
  @IsString({ message: "El token debe ser una cadena de texto" })
  token: string;
}
