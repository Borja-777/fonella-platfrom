import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('citas')
export class Cita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipoPaciente: string;

  @Column({ nullable: true })
  acudiente: string;

  @Column({ nullable: true })
  parentesco: string;

  @Column()
  paciente: string;

  @Column()
  edad: string;

  @Column()
  servicio: string;

  @Column()
  jornada: string;

  @Column({ nullable: true })
  motivo: string;

  @Column({ default: 'PENDIENTE' })
  estado: string;
}
