import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsUUID,
} from "class-validator";
import { MetodoPago } from "@prisma/client";

export class RegistrarVentaDto {
  @IsInt({ message: "La cantidad vendida debe ser un número entero" })
  @IsPositive({ message: "La cantidad vendida debe ser mayor a 0" })
  @IsNotEmpty({ message: "La cantidad es obligatoria" })
  cantidad!: number;

  @IsEnum(MetodoPago, { message: "El método de pago debe ser EFECTIVO, TRANSFERENCIA o TARJETA" })
  @IsNotEmpty({ message: "El método de pago es obligatorio" })
  metodoPago!: MetodoPago;

  @IsOptional()
  @IsUUID("4", { message: "El ID del paciente debe ser un UUID válido" })
  pacienteId?: string;
}
