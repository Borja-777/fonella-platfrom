import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class ActualizarJugueteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcionTerapeutica?: string;

  @IsOptional()
  @IsString()
  areaEstimulacion?: string;

  @IsOptional()
  @IsString()
  edadSugerida?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockDisponible?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimoAlerta?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  costoUnitario?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  precioVenta?: number;

  @IsOptional()
  @IsBoolean()
  publicadoCatalogo?: boolean;
}
