import { IsEnum, IsNotEmpty } from "class-validator";
import { EstadoRegistro } from "@prisma/client";

export class ActualizarEstadoDto {
  @IsEnum(EstadoRegistro, {
    message: "El estado debe ser estrictamente ACTIVO o INACTIVO",
  })
  @IsNotEmpty({ message: "El estado es obligatorio" })
  estado!: EstadoRegistro;
}
