import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RolUsuario, TipoMovimientoInventario } from "@prisma/client";
import { CrearJugueteDto } from "./dto/crear-juguete.dto";
import { ActualizarJugueteDto } from "./dto/actualizar-juguete.dto";
import { RegistrarVentaDto } from "./dto/registrar-venta.dto";

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listar juguetes con filtrado estricto por RBAC
   * - Fonoaudióloga: Visualiza costos, ganancia unitaria y margen comercial porcentual
   * - Asistente: Oculta columnas financieras por confidencialidad comercial
   */
  async listarJuguetes(rolUsuario: RolUsuario) {
    const juguetes = await this.prisma.jugueteDidactico.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
    });

    const esFonoaudiologa = rolUsuario === RolUsuario.FONOAUDIOLOGA;

    return juguetes.map((j) => {
      const costo = Number(j.costoUnitario);
      const precio = Number(j.precioVenta);
      const ganancia = precio - costo;
      const margen = precio > 0 ? Number(((ganancia / precio) * 100).toFixed(1)) : 0;

      const base = {
        id: j.id,
        codigoSku: j.codigoSku,
        nombre: j.nombre,
        descripcionTerapeutica: j.descripcionTerapeutica,
        areaEstimulacion: j.areaEstimulacion,
        edadSugerida: j.edadSugerida,
        imagenUrl: j.imagenUrl,
        stockDisponible: j.stockDisponible,
        stockMinimoAlerta: j.stockMinimoAlerta,
        precioVenta: precio,
        publicadoCatalogo: j.publicadoCatalogo,
        estado: j.estado,
        createdAt: j.createdAt,
      };

      if (esFonoaudiologa) {
        return {
          ...base,
          costoUnitario: costo,
          gananciaNetaUnitaria: ganancia,
          margenPorcentual: margen,
        };
      }

      return base;
    });
  }

  /**
   * Registrar nuevo juguete didáctico con cálculo en tiempo real
   * Regla de Negocio: precioVenta > costoUnitario obligatorio
   */
  async crearJuguete(dto: CrearJugueteDto, usuarioId: string) {
    if (Number(dto.precioVenta) <= Number(dto.costoUnitario)) {
      throw new BadRequestException(
        "El precio de venta debe ser superior al costo de compra para asegurar rentabilidad comercial.",
      );
    }

    const skuExistente = await this.prisma.jugueteDidactico.findUnique({
      where: { codigoSku: dto.codigoSku.trim().toUpperCase() },
    });

    if (skuExistente) {
      throw new ConflictException(
        `El código SKU "${dto.codigoSku}" ya se encuentra registrado en el inventario.`,
      );
    }

    const stockInicial = dto.stockDisponible || 0;
    const stockMinimo = dto.stockMinimoAlerta ?? 3;

    return this.prisma.$transaction(async (tx) => {
      const nuevoJuguete = await tx.jugueteDidactico.create({
        data: {
          codigoSku: dto.codigoSku.trim().toUpperCase(),
          nombre: dto.nombre.trim(),
          descripcionTerapeutica: dto.descripcionTerapeutica.trim(),
          areaEstimulacion: dto.areaEstimulacion.trim(),
          edadSugerida: dto.edadSugerida.trim(),
          imagenUrl: dto.imagenUrl?.trim() || "/images/juguetes/default-toy.jpg",
          stockDisponible: stockInicial,
          stockMinimoAlerta: stockMinimo,
          costoUnitario: dto.costoUnitario,
          precioVenta: dto.precioVenta,
          publicadoCatalogo: dto.publicadoCatalogo ?? true,
        },
      });

      if (stockInicial > 0) {
        await tx.movimientoInventario.create({
          data: {
            jugueteId: nuevoJuguete.id,
            usuarioId,
            tipoMovimiento: TipoMovimientoInventario.ENTRADA_COMPRA,
            cantidad: stockInicial,
            stockAnterior: 0,
            stockResultante: stockInicial,
            observacion: "Inventario inicial al registrar producto",
          },
        });
      }

      const costo = Number(nuevoJuguete.costoUnitario);
      const precio = Number(nuevoJuguete.precioVenta);
      const ganancia = precio - costo;
      const margen = Number(((ganancia / precio) * 100).toFixed(1));

      return {
        ...nuevoJuguete,
        costoUnitario: costo,
        precioVenta: precio,
        gananciaNetaUnitaria: ganancia,
        margenPorcentual: margen,
        mensaje: "Juguete didáctico registrado exitosamente en el inventario.",
      };
    });
  }

  /**
   * Registrar venta directa en consultorio / recepción
   * Descuenta stock, genera historial de venta y movimiento de inventario
   */
  async registrarVenta(jugueteId: string, dto: RegistrarVentaDto, usuarioId: string) {
    const juguete = await this.prisma.jugueteDidactico.findUnique({
      where: { id: jugueteId },
    });

    if (!juguete) {
      throw new NotFoundException("El juguete didáctico solicitado no existe.");
    }

    if (juguete.stockDisponible < dto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente para completar la venta. Solo quedan ${juguete.stockDisponible} unidades disponibles.`,
      );
    }

    const costo = Number(juguete.costoUnitario);
    const precio = Number(juguete.precioVenta);
    const totalVenta = precio * dto.cantidad;
    const gananciaNeta = (precio - costo) * dto.cantidad;

    return this.prisma.$transaction(async (tx) => {
      // 1. Descontar existencias
      const jugueteActualizado = await tx.jugueteDidactico.update({
        where: { id: jugueteId },
        data: {
          stockDisponible: {
            decrement: dto.cantidad,
          },
        },
      });

      // 2. Registrar movimiento en kardex de inventario
      await tx.movimientoInventario.create({
        data: {
          jugueteId,
          usuarioId,
          tipoMovimiento: TipoMovimientoInventario.SALIDA_VENTA,
          cantidad: dto.cantidad,
          stockAnterior: juguete.stockDisponible,
          stockResultante: jugueteActualizado.stockDisponible,
          observacion: `Venta registrada de ${dto.cantidad} unidad(es)`,
        },
      });

      // 3. Registrar venta financiera
      const venta = await tx.ventaJuguete.create({
        data: {
          jugueteId,
          pacienteId: dto.pacienteId || null,
          vendidoPorId: usuarioId,
          cantidad: dto.cantidad,
          metodoPago: dto.metodoPago,
          costoUnitarioSnapshot: juguete.costoUnitario,
          precioUnitarioVenta: juguete.precioVenta,
          totalVenta,
          gananciaNeta,
        },
      });

      return {
        ventaId: venta.id,
        jugueteId: juguete.id,
        nombre: juguete.nombre,
        cantidadVendida: dto.cantidad,
        stockRestante: jugueteActualizado.stockDisponible,
        totalVenta,
        mensaje: `Venta de ${dto.cantidad} unidad(es) de "${juguete.nombre}" completada exitosamente.`,
      };
    });
  }

  /**
   * Actualizar datos y precios de un juguete didáctico
   */
  async actualizarJuguete(id: string, dto: ActualizarJugueteDto) {
    const juguete = await this.prisma.jugueteDidactico.findUnique({
      where: { id },
    });

    if (!juguete) {
      throw new NotFoundException("El juguete didáctico no existe.");
    }

    const nuevoCosto = dto.costoUnitario !== undefined ? Number(dto.costoUnitario) : Number(juguete.costoUnitario);
    const nuevoPrecio = dto.precioVenta !== undefined ? Number(dto.precioVenta) : Number(juguete.precioVenta);

    if (nuevoPrecio <= nuevoCosto) {
      throw new BadRequestException(
        "El precio de venta debe ser superior al costo de compra para asegurar rentabilidad comercial.",
      );
    }

    const actualizado = await this.prisma.jugueteDidactico.update({
      where: { id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        descripcionTerapeutica: dto.descripcionTerapeutica !== undefined ? dto.descripcionTerapeutica.trim() : undefined,
        areaEstimulacion: dto.areaEstimulacion !== undefined ? dto.areaEstimulacion.trim() : undefined,
        edadSugerida: dto.edadSugerida !== undefined ? dto.edadSugerida.trim() : undefined,
        imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl.trim() : undefined,
        stockDisponible: dto.stockDisponible !== undefined ? dto.stockDisponible : undefined,
        stockMinimoAlerta: dto.stockMinimoAlerta !== undefined ? dto.stockMinimoAlerta : undefined,
        costoUnitario: dto.costoUnitario !== undefined ? dto.costoUnitario : undefined,
        precioVenta: dto.precioVenta !== undefined ? dto.precioVenta : undefined,
        publicadoCatalogo: dto.publicadoCatalogo !== undefined ? dto.publicadoCatalogo : undefined,
      },
    });

    const costo = Number(actualizado.costoUnitario);
    const precio = Number(actualizado.precioVenta);
    const ganancia = precio - costo;
    const margen = Number(((ganancia / precio) * 100).toFixed(1));

    return {
      ...actualizado,
      costoUnitario: costo,
      precioVenta: precio,
      gananciaNetaUnitaria: ganancia,
      margenPorcentual: margen,
      mensaje: "Juguete didáctico actualizado exitosamente.",
    };
  }
}
