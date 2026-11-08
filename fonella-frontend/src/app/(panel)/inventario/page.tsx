'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Tag,
  Boxes,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { apiService, Juguete, Usuario, CrearJugueteData } from '@/services/api';

function JugueteThumbnail({ url, nombre }: { url?: string; nombre: string }) {
  const [error, setError] = useState(false);
  if (!url || url === '/images/juguetes/default-toy.jpg' || error) {
    return (
      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 overflow-hidden shrink-0 flex items-center justify-center text-[#0AA896]">
        <Package className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
      <img
        src={url}
        alt={nombre}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function InventarioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [juguetes, setJuguetes] = useState<Juguete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstadoStock, setFiltroEstadoStock] = useState<'TODOS' | 'BAJO_STOCK' | 'DISPONIBLES'>('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);

  const [jugueteSeleccionado, setJugueteSeleccionado] = useState<Juguete | null>(null);
  const [jugueteAEditar, setJugueteAEditar] = useState<Juguete | null>(null);
  const [jugueteAEliminar, setJugueteAEliminar] = useState<Juguete | null>(null);

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
  const fileInputRefCrear = useRef<HTMLInputElement>(null);

  // Formulario de Edición
  const [editSku, setEditSku] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editArea, setEditArea] = useState('Lenguaje y Habla');
  const [editEdad, setEditEdad] = useState('2 a 5 años');
  const [editStock, setEditStock] = useState<number>(5);
  const [editStockMinimo, setEditStockMinimo] = useState<number>(3);
  const [editCosto, setEditCosto] = useState<number>(15000);
  const [editPrecio, setEditPrecio] = useState<number>(25000);
  const [editImagenUrl, setEditImagenUrl] = useState('');
  const fileInputRefEditar = useRef<HTMLInputElement>(null);

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

  // Cálculos matemáticos en tiempo real para Creación (HU-001)
  const gananciaCalculada = precio - costo;
  const margenCalculado = precio > 0 ? Number(((gananciaCalculada / precio) * 100).toFixed(1)) : 0;
  const esRentable = precio > costo;

  // Cálculos matemáticos en tiempo real para Edición
  const editGananciaCalculada = editPrecio - editCosto;
  const editMargenCalculado = editPrecio > 0 ? Number(((editGananciaCalculada / editPrecio) * 100).toFixed(1)) : 0;
  const editEsRentable = editPrecio > editCosto;

  // Manejo de Fotos (JPG/PNG máx 10 MB)
  const procesarArchivoImagen = (
    file: File,
    onSuccess: (dataUrl: string) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const formatosValidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!formatosValidos.includes(file.type.toLowerCase())) {
      mostrarAlerta('error', 'Formato no compatible. Solo se permiten imágenes en formato JPG o PNG.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      mostrarAlerta('error', `La fotografía seleccionada supera el límite máximo permitido de ${MAX_MB} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar suavemente a un máx de 1200px para almacenamiento óptimo en DB
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const formatoSalida = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(formatoSalida, 0.90);
          onSuccess(dataUrl);
        } else {
          onSuccess(reader.result as string);
        }
      };
      img.onerror = () => {
        mostrarAlerta('error', 'No se pudo procesar la imagen seleccionada.');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const abrirModalCrear = () => {
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
    if (fileInputRefCrear.current) fileInputRefCrear.current.value = '';
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

  // Abrir Modal de Edición
  const abrirModalEditar = (j: Juguete) => {
    setJugueteAEditar(j);
    setEditSku(j.codigoSku);
    setEditNombre(j.nombre);
    setEditDescripcion(j.descripcionTerapeutica);
    setEditArea(j.areaEstimulacion);
    setEditEdad(j.edadSugerida);
    setEditStock(j.stockDisponible);
    setEditStockMinimo(j.stockMinimoAlerta);
    setEditCosto(j.costoUnitario || 0);
    setEditPrecio(j.precioVenta);
    setEditImagenUrl(j.imagenUrl || '');
    if (fileInputRefEditar.current) fileInputRefEditar.current.value = '';
    setModalEditarAbierto(true);
  };

  const handleActualizarJuguete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugueteAEditar) return;

    if (!editEsRentable) {
      mostrarAlerta(
        'error',
        'El precio de venta debe ser superior al costo de compra para asegurar rentabilidad comercial.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const data: Partial<CrearJugueteData> = {
        nombre: editNombre.trim(),
        descripcionTerapeutica: editDescripcion.trim(),
        areaEstimulacion: editArea,
        edadSugerida: editEdad,
        stockDisponible: Number(editStock),
        stockMinimoAlerta: Number(editStockMinimo),
        costoUnitario: Number(editCosto),
        precioVenta: Number(editPrecio),
        imagenUrl: editImagenUrl.trim() || undefined,
      };

      const res = await apiService.actualizarJuguete(jugueteAEditar.id, data);
      mostrarAlerta('exito', res.mensaje || `Juguete "${res.nombre}" actualizado correctamente.`);
      setModalEditarAbierto(false);
      cargarDatos();
    } catch (err: any) {
      mostrarAlerta('error', err.message || 'Error al actualizar producto.');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal de Eliminación
  const abrirModalEliminar = (j: Juguete) => {
    setJugueteAEliminar(j);
    setModalEliminarAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!jugueteAEliminar) return;

    setSubmitting(true);
    try {
      const res = await apiService.eliminarJuguete(jugueteAEliminar.id);
      mostrarAlerta('exito', res.mensaje || 'Juguete eliminado exitosamente del inventario.');
      setModalEliminarAbierto(false);
      cargarDatos();
    } catch (err: any) {
      mostrarAlerta('error', err.message || 'Error al eliminar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  // Modal de Venta
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
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Precios Públicos</div>
              <div className="text-sm font-black text-purple-800">Venta Autorizada</div>
            </div>
          </div>
        )}

        {/* Productos en Alerta de Stock Mínimo */}
        <div
          className={`bg-white/95 backdrop-blur-md p-4 rounded-2xl border shadow-xs flex items-center gap-3 ${
            productosBajoStock > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-[#136A7B]/10'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
              productosBajoStock > 0
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Alerta de Stock</div>
            <div className={`text-sm font-black ${productosBajoStock > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
              {productosBajoStock > 0 ? `${productosBajoStock} por reabastecer` : 'Stock saludable'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabla y Filtros */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-[#136A7B]/10 overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar por nombre, SKU o área terapéutica..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF6F0]/60 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-[#0AA896] text-gray-800 font-medium"
            />
          </div>

          {/* Filtros de Pestañas */}
          <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-xl border border-gray-200 text-xs">
            <button
              onClick={() => setFiltroEstadoStock('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroEstadoStock === 'TODOS'
                  ? 'bg-[#0AA896] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({totalProductos})
            </button>
            <button
              onClick={() => setFiltroEstadoStock('BAJO_STOCK')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filtroEstadoStock === 'BAJO_STOCK'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Por Reabastecer ({productosBajoStock})</span>
            </button>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#DC8051] text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Producto y SKU</th>
                <th className="py-3 px-4">Área y Edad</th>
                <th className="py-3 px-4">Stock Disponible</th>
                {esFonoaudiologa && <th className="py-3 px-4">Costo Compra</th>}
                <th className="py-3 px-4">Precio Venta</th>
                {esFonoaudiologa && <th className="py-3 px-4">Ganancia y Margen</th>}
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={esFonoaudiologa ? 7 : 5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#0AA896] border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-xs">Cargando inventario didáctico...</span>
                    </div>
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
                          <JugueteThumbnail url={j.imagenUrl} nombre={j.nombre} />
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

                      {/* Acciones: Vender, Editar y Eliminar */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Vender */}
                          <button
                            onClick={() => abrirModalVenta(j)}
                            disabled={estaAgotado}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                              estaAgotado
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#0AA896] hover:bg-[#136A7B] text-white shadow-xs hover:shadow-md cursor-pointer'
                            }`}
                            title={estaAgotado ? 'Producto agotado' : 'Registrar venta directa'}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Vender</span>
                          </button>

                          {/* Botón Editar (Solo Fonoaudióloga) */}
                          {esFonoaudiologa && (
                            <button
                              onClick={() => abrirModalEditar(j)}
                              className="p-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 transition-all cursor-pointer"
                              title="Editar juguete didáctico"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botón Eliminar (Solo Fonoaudióloga) */}
                          {esFonoaudiologa && (
                            <button
                              onClick={() => abrirModalEliminar(j)}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer"
                              title="Eliminar juguete del inventario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
              {/* Fotografía del Juguete (JPG/PNG max 10MB) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Fotografía del Juguete (JPG o PNG, máx. 10 MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRefCrear}
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      procesarArchivoImagen(f, (dataUrl) => setImagenUrl(dataUrl), fileInputRefCrear);
                    }
                  }}
                  className="hidden"
                />

                {imagenUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-2xl border border-teal-200">
                    <img
                      src={imagenUrl}
                      alt="Vista previa juguete"
                      className="w-14 h-14 object-cover rounded-xl border border-teal-300 shadow-xs"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-gray-800 text-[11px] flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Foto adjuntada exitosamente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefCrear.current?.click()}
                          className="text-[10px] text-teal-700 hover:underline font-bold cursor-pointer"
                        >
                          Cambiar imagen
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImagenUrl('');
                            if (fileInputRefCrear.current) fileInputRefCrear.current.value = '';
                          }}
                          className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefCrear.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#0AA896] hover:bg-teal-50/20 p-3.5 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 bg-[#FAF6F0]/40"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0AA896] flex items-center justify-center border border-teal-100">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-gray-700 text-xs">
                      Haz clic para subir fotografía del juguete
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Formatos compatibles: JPG, JPEG o PNG (hasta 10 MB)
                    </p>
                  </div>
                )}
              </div>

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
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  esRentable ? 'bg-teal-50/80 border-teal-200' : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-[11px] text-gray-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0AA896]" />
                    <span>Rentabilidad Comercial Calculada en Vivo</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[10px] ${
                      esRentable ? 'bg-teal-100 text-[#0E5666]' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Margen: {margenCalculado}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px]">Ganancia Neta Unitaria:</span>
                    <div
                      className={`font-mono font-black text-sm ${
                        esRentable ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
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

      {/* 6. MODAL: Editar Juguete Existente (Solo Fonoaudióloga) */}
      {modalEditarAbierto && jugueteAEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#136A7B]/10 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#0AA896]" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Editar Juguete Didáctico
                </h3>
              </div>
              <button
                onClick={() => setModalEditarAbierto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActualizarJuguete} className="space-y-3.5 text-xs">
              {/* Fotografía del Juguete */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Fotografía del Juguete (JPG o PNG, máx. 10 MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRefEditar}
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      procesarArchivoImagen(f, (dataUrl) => setEditImagenUrl(dataUrl), fileInputRefEditar);
                    }
                  }}
                  className="hidden"
                />

                {editImagenUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-2xl border border-teal-200">
                    <img
                      src={editImagenUrl}
                      alt="Vista previa juguete"
                      className="w-14 h-14 object-cover rounded-xl border border-teal-300 shadow-xs"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-gray-800 text-[11px] flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Foto asignada al producto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefEditar.current?.click()}
                          className="text-[10px] text-teal-700 hover:underline font-bold cursor-pointer"
                        >
                          Cambiar imagen
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditImagenUrl('');
                            if (fileInputRefEditar.current) fileInputRefEditar.current.value = '';
                          }}
                          className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefEditar.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#0AA896] hover:bg-teal-50/20 p-3.5 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 bg-[#FAF6F0]/40"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0AA896] flex items-center justify-center border border-teal-100">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-gray-700 text-xs">
                      Haz clic para subir o actualizar fotografía
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Formatos compatibles: JPG, JPEG o PNG (hasta 10 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* SKU (Solo lectura) y Nombre */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Código SKU</label>
                  <input
                    type="text"
                    disabled
                    value={editSku}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold uppercase bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Nombre del Juguete</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
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
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                />
              </div>

              {/* Área y Edad Sugerida */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Área Terapéutica</label>
                  <select
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
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
                    value={editEdad}
                    onChange={(e) => setEditEdad(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Stock Disponible y Umbral Stock Mínimo */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Umbral Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editStockMinimo}
                    onChange={(e) => setEditStockMinimo(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Costo de Compra y Precio de Venta */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Costo de Compra ($ COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={editCosto}
                    onChange={(e) => setEditCosto(Math.max(0, parseInt(e.target.value) || 0))}
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
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Caja de Rentabilidad Dinámica */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  editEsRentable ? 'bg-teal-50/80 border-teal-200' : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-[11px] text-gray-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0AA896]" />
                    <span>Rentabilidad Actualizada</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[10px] ${
                      editEsRentable ? 'bg-teal-100 text-[#0E5666]' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Margen: {editMargenCalculado}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px]">Ganancia Neta Unitaria:</span>
                    <div
                      className={`font-mono font-black text-sm ${
                        editEsRentable ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      ${editGananciaCalculada.toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px]">Fórmula:</span>
                    <div className="text-[10px] text-gray-600 font-mono">
                      (Precio - Costo) / Precio
                    </div>
                  </div>
                </div>

                {!editEsRentable && (
                  <p className="text-[11px] font-bold text-rose-700 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>El precio de venta debe ser superior al costo de compra.</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editEsRentable || submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                    !editEsRentable || submitting
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#0AA896] hover:bg-[#136A7B]'
                  }`}
                >
                  {submitting ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Confirmar Eliminación (Soft Delete) */}
      {modalEliminarAbierto && jugueteAEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-gray-900">
                ¿Eliminar Juguete del Inventario?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Estás a punto de retirar este producto del inventario activo de FONELLA.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1 text-xs">
              <div className="font-bold text-gray-900">{jugueteAEliminar.nombre}</div>
              <div className="flex items-center justify-between text-gray-600">
                <span>SKU: <strong className="font-mono">{jugueteAEliminar.codigoSku}</strong></span>
                <span>Stock Actual: <strong>{jugueteAEliminar.stockDisponible} un.</strong></span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              El producto pasará a estado inactivo para preservar el historial de movimientos y ventas pasadas.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {submitting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Registrar Venta Directa (Ambos Roles) */}
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
