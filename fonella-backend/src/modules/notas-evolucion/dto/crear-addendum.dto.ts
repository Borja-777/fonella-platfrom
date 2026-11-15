import { IsNotEmpty, IsString } from 'class-validator';

export class CrearAddendumDto {
  @IsNotEmpty({ message: 'El texto aclaratorio del addendum es obligatorio' })
  @IsString()
  textoAddendum: string;
}
