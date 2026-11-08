import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class CrearJugueteDto {
  @IsString({ message: "El código SKU debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El código SKU es obligatorio" })
  codigoSku!: string;

  @IsString({ message: "El nombre del juguete debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre del juguete es obligatorio" })
  nombre!: string;

  @IsString({ message: "La descripción terapéutica debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La descripción terapéutica es obligatoria" })
  descripcionTerapeutica!: string;

  @IsString({ message: "El área de estimulación debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El área de estimulación es obligatoria" })
  areaEstimulacion!: string;

  @IsString({ message: "La edad sugerida debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La edad sugerida es obligatoria" })
  edadSugerida!: string;

  @IsOptional()
  @IsString({ message: "La URL de la imagen debe ser una cadena de texto" })
  imagenUrl?: string;

  @IsNumber({}, { message: "El stock disponible debe ser un número" })
  @Min(0, { message: "El stock disponible no puede ser negativo" })
  stockDisponible!: number;

  @IsOptional()
  @IsNumber({}, { message: "El stock mínimo de alerta debe ser un número" })
  @Min(0, { message: "El stock mínimo de alerta no puede ser negativo" })
  stockMinimoAlerta?: number;

  @IsNumber({}, { message: "El costo unitario de compra debe ser un número" })
  @IsPositive({ message: "El costo unitario debe ser un valor positivo" })
  costoUnitario!: number;

  @IsNumber({}, { message: "El precio de venta debe ser un número" })
  @IsPositive({ message: "El precio de venta debe ser un valor positivo" })
  precioVenta!: number;

  @IsOptional()
  @IsBoolean({ message: "publicadoCatalogo debe ser un valor booleano" })
  publicadoCatalogo?: boolean;
}
