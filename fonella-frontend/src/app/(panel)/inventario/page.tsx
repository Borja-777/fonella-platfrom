'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  Tag,
  Boxes,
} from 'lucide-react';
import { apiService, Juguete, Usuario, CrearJugueteData } from '@/services/api';

export default function InventarioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [juguetes, setJuguetes] = useState<Juguete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstadoStock, setFiltroEstadoStock] = useState<'TODOS' | 'BAJO_STOCK' | 'DISPONIBLES'>('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);
  const [jugueteSeleccionado, setJugueteSeleccionado] = useState<Juguete | null>(null);

  // Formulario de Creación
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [area, setArea] = useState('Lenguaje y Habla');
  const [edad, setEdad] = useState('2 a 5 años');
  const [stock, setStock] = useState<number>(5);
  const [stockMinimo, setStockMinimo] = useState<number>(3);
  const [costo, setCosto] = useState<number>(15000);
  const [precio, setPrecio] = useState<number>(25000);
  const [imagenUrl, setImagenUrl] = useState('');

  // Formulario de Venta
  const [cantidadVenta, setCantidadVenta] = useState<number>(1);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');

  // Feedback y Errores
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [perfilRes, juguetesRes] = await Promise.all([
        apiService.getMe(),
        apiService.getJuguetes(),
      ]);
      setUsuario(perfilRes.usuario);
      setJuguetes(juguetesRes);
    } catch (err: any) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  const mostrarAlerta = (tipo: 'exito' | 'error', texto: string) => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Cálculos matemáticos en tiempo real para el modal de creación (HU-001)
  const gananciaCalculada = precio - costo;
  const margenCalculado = precio > 0 ? Number(((gananciaCalculada / precio) * 100).toFixed(1)) : 0;
  const esRentable = precio > costo;

  const abrirModalCrear = () => {
    // Generar SKU sugerido automáticamente
    const randomSku = `JUG-${Math.floor(100 + Math.random() * 900)}`;
    setSku(randomSku);
    setNombre('');
    setDescripcion('');
    setArea('Lenguaje y Habla');
    setEdad('2 a 5 años');
    setStock(5);
    setStockMinimo(3);
    setCosto(15000);
    setPrecio(25000);
    setImagenUrl('');
    setModalCrearAbierto(true);
  };

  const handleCrearJuguete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!esRentable) {
      mostrarAlerta(
        'error',
        'El precio de venta debe ser superior al costo de compra para asegurar rentabilidad comercial.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const data: CrearJugueteData = {
        codigoSku: sku.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcionTerapeutica: descripcion.trim(),
        areaEstimulacion: area,
        edadSugerida: edad,
        stockDisponible: Number(stock),
        stockMinimoAlerta: Number(stockMinimo),
        costoUnitario: Number(costo),
        precioVenta: Number(precio),
        imagenUrl: imagenUrl.trim() || undefined,
        publicadoCatalogo: true,
      };

      const res = await apiService.crearJuguete(data);
      mostrarAlerta('exito', res.mensaje || `Juguete "${res.nombre}" registrado exitosamente.`);
      setModalCrearAbierto(false);
      cargarDatos();
    } catch (err: any) {
      mostrarAlerta('error', err.message || 'Error al registrar producto en inventario.');
    } finally {
      setSubmitting(false);
    }
  };

  const abrirModalVenta = (juguete: Juguete) => {
    setJugueteSeleccionado(juguete);
    setCantidadVenta(1);
    setMetodoPago('EFECTIVO');
    setModalVentaAbierto(true);
  };

  const handleRegistrarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugueteSeleccionado) return;

    if (cantidadVenta <= 0 || cantidadVenta > jugueteSeleccionado.stockDisponible) {
      mostrarAlerta('error', `Cantidad inválida. Solo hay ${jugueteSeleccionado.stockDisponible} unidades disponibles.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.registrarVentaJuguete(jugueteSeleccionado.id, {
        cantidad: cantidadVenta,
        metodoPago,
      });

      mostrarAlerta('exito', res.mensaje || 'Venta registrada con éxito.');
      setModalVentaAbierto(false);
      cargarDatos();
    } catch (err: any) {
      mostrarAlerta('error', err.message || 'Error al procesar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  const esFonoaudiologa = usuario?.rol === 'FONOAUDIOLOGA';

  // Filtros de búsqueda
  const juguetesFiltrados = juguetes.filter((j) => {
    const coincideTexto =
      j.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      j.codigoSku.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      j.areaEstimulacion.toLowerCase().includes(filtroBusqueda.toLowerCase());

    if (!coincideTexto) return false;

    if (filtroEstadoStock === 'BAJO_STOCK') {
      return j.stockDisponible <= j.stockMinimoAlerta;
    }
    if (filtroEstadoStock === 'DISPONIBLES') {
      return j.stockDisponible > j.stockMinimoAlerta;
    }
    return true;
  });

  // Métricas de inventario
  const totalProductos = juguetes.length;
  const unidadesTotales = juguetes.reduce((acc, j) => acc + j.stockDisponible, 0);
  const valorTotalCosto = juguetes.reduce((acc, j) => acc + (j.costoUnitario || 0) * j.stockDisponible, 0);
  const productosBajoStock = juguetes.filter((j) => j.stockDisponible <= j.stockMinimoAlerta).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Feedback Global Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-fade-in shadow-xl border backdrop-blur-lg ${
            feedback.tipo === 'exito'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white border-emerald-400/40'
              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white border-rose-400/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.tipo === 'exito' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-200" />
            )}
            <span className="font-bold">{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* 2. Cabecera Principal */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-[#136A7B]/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-center text-[#0AA896] shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#094A57] tracking-tight">
                Control de Inventario y Margen de Ganancia
              </h1>
              {esFonoaudiologa ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Control Financiero Total</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0E5666] text-[10px] font-black uppercase tracking-wider border border-teal-200">
                  Modo Operativo Recepción
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Gestión de stock didáctico, precios al público, costos de adquisición y márgenes de rentabilidad neta.
            </p>
          </div>
        </div>

        {/* Botón de Acción Principal (Solo Fonoaudióloga) */}
        {esFonoaudiologa && (
          <button
            onClick={abrirModalCrear}
            className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Nuevo Juguete</span>
          </button>
        )}
      </div>

      {/* 3. Tarjetas Resumen de Métricas (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Productos */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0AA896] font-black text-sm">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Catálogo</div>
            <div className="text-sm font-black text-[#094A57]">{totalProductos} Productos</div>
          </div>
        </div>

        {/* Unidades Disponibles */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-black text-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stock Total</div>
            <div className="text-sm font-black text-sky-800">{unidadesTotales} Unidades</div>
          </div>
        </div>

        {/* Valor Total Inventario (Solo Fonoaudióloga) */}
        {esFonoaudiologa ? (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Inversión Costo</div>
              <div className="text-sm font-black text-emerald-700">
                ${valorTotalCosto.toLocaleString('es-CO')}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0AA896] font-black text-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Estado Venta</div>
              <div className="text-sm font-black text-teal-800">Recepción Activa</div>
            </div>
          </div>
        )}

        {/* Alertas de Stock Bajo / Agotado */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
            productosBajoStock > 0
              ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stock Mínimo</div>
            <div className={`text-sm font-black ${productosBajoStock > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
              {productosBajoStock > 0 ? `${productosBajoStock} por reabastecer` : 'Stock Saludable'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabla de Inventario y Márgenes */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/70 overflow-hidden w-full">
        {/* Barra de Filtro y Búsqueda */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o área terapéutica..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0AA896] transition-all bg-[#FAF6F0]/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroEstadoStock('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstadoStock === 'TODOS'
                  ? 'bg-[#0AA896] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({totalProductos})
            </button>
            <button
              onClick={() => setFiltroEstadoStock('BAJO_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filtroEstadoStock === 'BAJO_STOCK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Por Reabastecer ({productosBajoStock})</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#DF9B78] to-[#D68B66] text-white text-[11px] font-black uppercase tracking-wider">
                <th className="py-3 px-4">Producto y SKU</th>
                <th className="py-3 px-4 border-l border-white/20">Área y Edad</th>
                <th className="py-3 px-4 border-l border-white/20">Stock Disponible</th>
                {esFonoaudiologa && (
                  <th className="py-3 px-4 border-l border-white/20">Costo Compra</th>
                )}
                <th className="py-3 px-4 border-l border-white/20">Precio Venta</th>
                {esFonoaudiologa && (
                  <th className="py-3 px-4 border-l border-white/20">Ganancia y Margen</th>
                )}
                <th className="py-3 px-4 border-l border-white/20 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={esFonoaudiologa ? 7 : 5} className="py-16 text-center text-gray-500">
                    <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-[#136A7B]">
                      Consultando inventario de juguetes en PostgreSQL...
                    </p>
                  </td>
                </tr>
              ) : juguetesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={esFonoaudiologa ? 7 : 5} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-center text-[#0AA896] mx-auto shadow-xs">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-800">
                          {filtroBusqueda ? 'No se encontraron productos con ese filtro' : 'No hay juguetes registrados en el inventario'}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {filtroBusqueda
                            ? 'Intenta con otro término o borra la búsqueda.'
                            : 'Registra los juguetes didácticos del consultorio para controlar el stock y calcular márgenes.'}
                        </p>
                      </div>
                      {esFonoaudiologa && !filtroBusqueda && (
                        <button
                          onClick={abrirModalCrear}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0AA896] hover:bg-[#136A7B] text-white text-xs font-bold transition-all shadow-sm cursor-pointer mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Registrar Primer Juguete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                juguetesFiltrados.map((j) => {
                  const estaAgotado = j.stockDisponible === 0;
                  const stockBajo = j.stockDisponible <= j.stockMinimoAlerta && !estaAgotado;

                  return (
                    <tr key={j.id} className="hover:bg-teal-50/40 transition-colors">
                      {/* Producto y SKU */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-gray-400">
                            {j.imagenUrl && j.imagenUrl !== '/images/juguetes/default-toy.jpg' ? (
                              <img src={j.imagenUrl} alt={j.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-[#0AA896]" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 leading-tight">{j.nombre}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-semibold border border-gray-200">
                                {j.codigoSku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Área y Edad */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <div className="font-semibold text-gray-800">{j.areaEstimulacion}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{j.edadSugerida}</div>
                      </td>

                      {/* Stock Disponible con Alertas (HU-002) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {estaAgotado ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase tracking-wide border border-rose-300 flex items-center gap-1 w-max">
                            <span>⛔ Agotado (0 un.)</span>
                          </span>
                        ) : stockBajo ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wide border border-amber-300 flex items-center gap-1 w-max animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>⚠️ Stock Bajo ({j.stockDisponible} un.)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wide border border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{j.stockDisponible} en stock</span>
                          </span>
                        )}
                      </td>

                      {/* Costo de Compra (Solo Fonoaudióloga) */}
                      {esFonoaudiologa && (
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-600 whitespace-nowrap">
                          ${(j.costoUnitario || 0).toLocaleString('es-CO')}
                        </td>
                      )}

                      {/* Precio de Venta (Ambos Roles) */}
                      <td className="py-3.5 px-4 font-mono font-black text-[#094A57] whitespace-nowrap">
                        ${j.precioVenta.toLocaleString('es-CO')}
                      </td>

                      {/* Ganancia y Margen Comercial (Solo Fonoaudióloga) */}
                      {esFonoaudiologa && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-emerald-700 text-xs">
                              +${(j.gananciaNetaUnitaria || 0).toLocaleString('es-CO')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-100 text-[#0E5666] font-mono font-black text-[10px] border border-teal-200 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5 text-[#0AA896]" />
                              <span>{j.margenPorcentual}%</span>
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Acciones: Vender Directo */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => abrirModalVenta(j)}
                          disabled={estaAgotado}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 mx-auto transition-all ${
                            estaAgotado
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#0AA896] hover:bg-[#136A7B] text-white shadow-xs hover:shadow-md cursor-pointer'
                          }`}
                          title={estaAgotado ? 'Producto agotado' : 'Registrar venta directa'}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Vender</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: Registrar Nuevo Juguete Didáctico (Solo Fonoaudióloga) */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#136A7B]/10 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0AA896]" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Registrar Juguete en Inventario
                </h3>
              </div>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearJuguete} className="space-y-3.5 text-xs">
              {/* SKU y Nombre */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Código SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold uppercase focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Nombre del Juguete</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Mordedor Sensorial de Silicona"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Descripción Terapéutica */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Finalidad y Descripción Terapéutica</label>
                <textarea
                  required
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Estimulación propioceptiva orofacial para control de mordida y deglución atípica..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                />
              </div>

              {/* Área y Edad Sugerida */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Área Terapéutica</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-white cursor-pointer"
                  >
                    <option value="Lenguaje y Habla">Lenguaje y Habla</option>
                    <option value="Motricidad Orofacial">Motricidad Orofacial</option>
                    <option value="Sensorial y Auditiva">Sensorial y Auditiva</option>
                    <option value="Cognitiva y Memoria">Cognitiva y Memoria</option>
                    <option value="Fluidez y Respiración">Fluidez y Respiración</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Edad Sugerida</label>
                  <input
                    type="text"
                    required
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    placeholder="Ej. 2 a 5 años"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Stock Inicial y Stock Mínimo Alerta */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Umbral Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Precios Financieros: Costo de Compra y Precio de Venta */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Costo de Compra ($ COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={costo}
                    onChange={(e) => setCosto(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Precio de Venta ($ COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* CAJA DE CÁLCULO DE MARGEN EN TIEMPO REAL (DoD HU-001) */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                esRentable
                  ? 'bg-teal-50/80 border-teal-200'
                  : 'bg-rose-50 border-rose-300'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-[11px] text-gray-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0AA896]" />
                    <span>Rentabilidad Comercial Calculada en Vivo</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[10px] ${
                    esRentable ? 'bg-teal-100 text-[#0E5666]' : 'bg-rose-100 text-rose-800'
                  }`}>
                    Margen: {margenCalculado}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px]">Ganancia Neta Unitaria:</span>
                    <div className={`font-mono font-black text-sm ${esRentable ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ${gananciaCalculada.toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px]">Fórmula Aplicada:</span>
                    <div className="text-[10px] text-gray-600 font-mono">
                      (Precio - Costo) / Precio
                    </div>
                  </div>
                </div>

                {!esRentable && (
                  <p className="text-[11px] font-bold text-rose-700 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>El precio de venta debe ser superior al costo de compra.</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!esRentable || submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                    !esRentable || submitting
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#0AA896] hover:bg-[#136A7B]'
                  }`}
                >
                  {submitting ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Registrar Venta Directa (Ambos Roles) */}
      {modalVentaAbierto && jugueteSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-[#136A7B]/10">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#0AA896]" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Registrar Venta Directa
                </h3>
              </div>
              <button
                onClick={() => setModalVentaAbierto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del Producto */}
            <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#136A7B]/10 space-y-1">
              <div className="font-black text-gray-900 text-sm">{jugueteSeleccionado.nombre}</div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>SKU: <strong className="font-mono">{jugueteSeleccionado.codigoSku}</strong></span>
                <span>Stock: <strong>{jugueteSeleccionado.stockDisponible} un.</strong></span>
              </div>
              <div className="text-xs font-bold text-[#094A57]">
                Precio Unitario: ${jugueteSeleccionado.precioVenta.toLocaleString('es-CO')}
              </div>
            </div>

            <form onSubmit={handleRegistrarVenta} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Cantidad a Vender</label>
                <input
                  type="number"
                  min="1"
                  max={jugueteSeleccionado.stockDisponible}
                  required
                  value={cantidadVenta}
                  onChange={(e) =>
                    setCantidadVenta(
                      Math.max(1, Math.min(jugueteSeleccionado.stockDisponible, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold focus:outline-none focus:border-[#0AA896]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-white cursor-pointer"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia (Nequi / Bancolombia)</option>
                  <option value="TARJETA">Tarjeta Débito / Crédito</option>
                </select>
              </div>

              {/* Total a Cobrar */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <span className="font-bold text-gray-700">Total a Cobrar:</span>
                <span className="font-mono font-black text-base text-[#094A57]">
                  ${(jugueteSeleccionado.precioVenta * cantidadVenta).toLocaleString('es-CO')}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalVentaAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0AA896] hover:bg-[#136A7B] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {submitting ? 'Procesando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
