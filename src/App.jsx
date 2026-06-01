import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, PlusCircle, ShoppingCart, User, Share2, RefreshCw, DollarSign, Edit3, Check, X, Users, Trash2, Package, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const api = {
    getClientes: () => axios.get(`${API}/clientes`).then(res => res.data),
    crearCliente: (c) => axios.post(`${API}/clientes`, c).then(res => res.data),
    eliminarCliente: (id) => axios.delete(`${API}/clientes/${id}`).then(res => res.data),
    getProductos: () => axios.get(`${API}/productos`).then(res => res.data),
    crearProducto: (p) => axios.post(`${API}/productos`, p).then(res => res.data),
    actualizarPrecio: (id, precio) => axios.put(`${API}/productos/${id}`, { precio_usd: precio }).then(res => res.data),
    eliminarProducto: (id) => axios.delete(`${API}/productos/${id}`).then(res => res.data),
    registrarConsumo: (o) => axios.post(`${API}/fiar`, o).then(res => res.data),
    getConsumosCliente: (clienteId) => axios.get(`${API}/consumos/${clienteId}`).then(res => res.data),
    registrarPago: (pago) => axios.post(`${API}/pagos`, pago).then(res => res.data),
    getTasa: () => axios.get(`${API}/tasa`).then(res => res.data),
};

function App() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState({ tasa: 45.65, fuente: 'Cargando...' });
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [consumosCliente, setConsumosCliente] = useState([]); 

  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '' });
  const [formProducto, setFormProducto] = useState({ nombre: '', categoria: 'Snacks', precio_usd: '' });
  const [formFiar, setFormFiar] = useState({ producto_id: '', cantidad: 1 });
  
  const [montoAbono, setMontoAbono] = useState('');
  const [monedaAbono, setMonedaAbono] = useState('USD'); 
  
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [nuevoPrecioInput, setNuevoPrecioInput] = useState('');

  // ESTADO PARA EL FILTRO DE BÚSQUEDA DE CLIENTES
  const [busquedaCliente, setBusquedaCliente] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorLog(null);
      const [resClientes, resProductos, resTasa] = await Promise.all([
        api.getClientes(),
        api.getProductos(),
        api.getTasa()
      ]);
      setClientes(resClientes);
      setProductos(resProductos);
      setTasa(resTasa);
    } catch (err) {
      setErrorLog("Error de comunicación con el servidor backend o Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const seleccionarYVerCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setConsumosCliente([]); 
    setBusquedaCliente(''); // Limpia el buscador al seleccionar uno para dejarlo listo
    try {
      const consumos = await api.getConsumosCliente(cliente.id);
      setConsumosCliente(consumos);
    } catch (err) {
      console.error("Error al obtener los artículos que debe el cliente", err);
    }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!formCliente.nombre.trim()) return;
    try {
      await api.crearCliente(formCliente);
      setFormCliente({ nombre: '', telefono: '' });
      cargarDatos();
      alert("¡Cliente guardado con éxito!");
    } catch (err) { alert("Error al guardar cliente"); }
  };

  const handleEliminarCliente = async (id, nombre) => {
    if (!window.confirm(`¿Estás completamente segura de eliminar a "${nombre}" de la base de datos? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarCliente(id);
      setClienteSeleccionado(null);
      setConsumosCliente([]);
      cargarDatos();
      alert("Cliente removido con éxito.");
    } catch (err) { alert("No se pudo eliminar el cliente."); }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!formProducto.nombre.trim() || !formProducto.precio_usd) return;
    try {
      await api.crearProducto(formProducto);
      setFormProducto({ nombre: '', categoria: 'Snacks', precio_usd: '' });
      cargarDatos();
      alert("Artículo guardado en el inventario.");
    } catch (err) { alert("Error al guardar artículo"); }
  };

  const GuardarNuevoPrecio = async (id) => {
    if (!nuevoPrecioInput || parseFloat(nuevoPrecioInput) <= 0) return;
    try {
      await api.actualizarPrecio(id, parseFloat(nuevoPrecioInput));
      setEditandoProductoId(null);
      setNuevoPrecioInput('');
      cargarDatos();
    } catch (err) { alert("No se pudo actualizar el precio"); }
  };

  const handleEliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Quieres eliminar "${nombre}" del inventario?`)) return;
    try {
      await api.eliminarProducto(id);
      cargarDatos();
    } catch (err) { alert("No se pudo eliminar el artículo."); }
  };

  const handleRegistrarConsumo = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado || !formFiar.producto_id) return;
    try {
      await api.registrarConsumo({
        cliente_id: clienteSeleccionado.id,
        producto_id: parseInt(formFiar.producto_id),
        cantidad: formFiar.cantidad
      });
      setFormFiar({ producto_id: '', cantidad: 1 });
      
      const dataClientes = await api.getClientes();
      setClientes(dataClientes);
      
      const clienteActualizado = dataClientes.find(c => c.id === clienteSeleccionado.id);
      if (clienteActualizado) {
        seleccionarYVerCliente(clienteActualizado);
      }
    } catch (err) { alert("Error al procesar el fiado"); }
  };

  const ejecutarAbonoBimonetario = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado || !montoAbono || parseFloat(montoAbono) <= 0) return;
    try {
      await api.registrarPago({
        cliente_id: clienteSeleccionado.id,
        monto: parseFloat(montoAbono),
        moneda: monedaAbono,
        tasa: tasa.tasa
      });
      
      setMontoAbono('');
      const dataClientes = await api.getClientes();
      setClientes(dataClientes);
      
      const clienteActualizado = dataClientes.find(c => c.id === clienteSeleccionado.id);
      if (!clienteActualizado || parseFloat(clienteActualizado.deuda_usd) === 0) {
        setClienteSeleccionado(null);
        setConsumosCliente([]);
        alert("¡Deuda saldada por completo!");
      } else {
        seleccionarYVerCliente(clienteActualizado);
        alert("¡Abono cargado con éxito!");
      }
    } catch (err) { alert("Error al procesar el abono"); }
  };

  const liquidarDeudaTotal = async (cliente) => {
    if (!window.confirm(`¿Confirmas que "${cliente.nombre}" ha pagado la totalidad de su saldo ($${parseFloat(cliente.deuda_usd).toFixed(2)}) y quieres cerrar su cuenta pendiente?`)) return;
    try {
      await api.registrarPago({
        cliente_id: cliente.id,
        monto: parseFloat(cliente.deuda_usd),
        moneda: 'USD',
        tasa: tasa.tasa
      });

      setClienteSeleccionado(null);
      setConsumosCliente([]);
      const dataClientes = await api.getClientes();
      setClientes(dataClientes);
      alert("¡Cuenta saldada y archivada con éxito!");
    } catch (err) {
      alert("Error al liquidar la deuda del cliente.");
    }
  };

  const enviarWhatsApp = (c) => {
    if (!c.telefono) {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }

    let mensaje = `*🛍️ DETALLE DE TU CUENTA PENDIENTE*\n\n`;
    mensaje += `Hola *${c.nombre}*, espero que estés bien. Aquí tienes el desglose de tus consumos y abonos realizados:\n\n`;

    let sumaProductosUSD = 0;

    if (consumosCliente && consumosCliente.length > 0) {
      mensaje += `*📦 Productos Fiados:*\n`;
      consumosCliente.forEach((item) => {
        const cant = parseInt(item.cantidad) || 1;
        const precioUSD = parseFloat(item.precio_unitario_usd) || 0;
        const subtotalItemUSD = precioUSD * cant;
        sumaProductosUSD += subtotalItemUSD;

        const subtotalItemBS = subtotalItemUSD * tasa.tasa;
        mensaje += `• ${item.producto} (${cant}x) -> $${subtotalItemUSD.toFixed(2)} (_${subtotalItemBS.toFixed(2)} Bs._)\n`;
      });
      mensaje += `\n`;
    }

    const deudaActualRealUSD = parseFloat(c.deuda_usd || 0);
    let abonoEfectuadoUSD = sumaProductosUSD - deudaActualRealUSD;
    if (abonoEfectuadoUSD < 0) abonoEfectuadoUSD = 0;

    if (abonoEfectuadoUSD > 0.01) {
      const abonoEfectuadoBS = abonoEfectuadoUSD * tasa.tasa;
      mensaje += `*📉 Abonos y Pagos Registrados:*\n`;
      mensaje += `• Abono acumulado: -$${abonoEfectuadoUSD.toFixed(2)} (_${abonoEfectuadoBS.toFixed(2)} Bs._)\n\n`;
    }

    const totalGeneralBS = deudaActualRealUSD * tasa.tasa;

    mensaje += `──────────────────────\n`;
    mensaje += `💵 *MONTO NETO RESTANTE A PAGAR:*\n`;
    mensaje += `• *Saldo en Dólares:* $${deudaActualRealUSD.toFixed(2)}\n`;
    mensaje += `• *Saldo en Bolívares:* ${totalGeneralBS.toFixed(2)} Bs.\n`;
    mensaje += `──────────────────────\n\n`;
    mensaje += `*Tasa de cambio aplicada:* ${tasa.tasa.toFixed(2)} Bs./$ *(BCV)*\n\n`;
    mensaje += `📌 _Si realizas el pago por Pago Móvil, por favor validar la tasa oficial del día. ¡Muchas gracias!_ 😊`;

    const numeroLimpio = c.telefono.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const deudoresActivos = clientes.filter(c => parseFloat(c.deuda_usd) > 0);

  // LÓGICA FILTRADORA DE CLIENTES EN TIEMPO REAL
  const clientesFiltrados = clientes.filter(c => {
    const termino = busquedaCliente.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(termino) || 
      (c.telefono && c.telefono.includes(termino))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">La Bodega de Yerkis</h1>
          <p className="text-slate-400 text-sm mt-1">Control directo de deudas y precios de inventario</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
          <div className="text-right">
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Tasa Oficial BCV</span>
            <span className="text-xl font-black text-emerald-400">{tasa.tasa.toFixed(2)} <span className="text-xs text-slate-400">Bs/USD</span></span>
          </div>
          <button onClick={cargarDatos} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {errorLog && <div className="max-w-6xl mx-auto bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-center text-sm font-medium">{errorLog}</div>}

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: FORMULARIOS E INVENTARIO */}
        <div className="space-y-6">
          <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700/70 shadow-lg">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5" /> Registrar Cliente</h2>
            <form onSubmit={handleCrearCliente} className="space-y-3">
              <input type="text" placeholder="Nombre del cliente" value={formCliente.nombre} onChange={e => setFormCliente({...formCliente, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" required />
              <input type="text" placeholder="Teléfono (Ej: 04141234567)" value={formCliente.telefono} onChange={e => setFormCliente({...formCliente, telefono: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">Guardar en Base de Datos</button>
            </form>
          </section>

          {/* INVENTARIO */}
          <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700/70 shadow-lg flex flex-col h-[320px]">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-2"><PlusCircle className="w-5 h-5" /> Inventario de Ventas</h2>
            
            <form onSubmit={handleCrearProducto} className="flex gap-1.5 mb-3 border-b border-slate-700 pb-3">
              <input type="text" placeholder="Item" value={formProducto.nombre} onChange={e => setFormProducto({...formProducto, nombre: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none text-slate-100" required />
              <input type="number" step="0.01" placeholder="$" value={formProducto.precio_usd} onChange={e => setFormProducto({...formProducto, precio_usd: e.target.value})} className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center" required />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 rounded-lg text-xs font-bold">+</button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {productos.map(p => (
                <div key={p.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[100px]">{p.nombre}</span>
                  
                  {editandoProductoId === p.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.01" value={nuevoPrecioInput} onChange={e => setNuevoPrecioInput(e.target.value)} className="w-14 bg-slate-800 border border-cyan-500 rounded px-1 py-0.5 text-center text-cyan-300 font-bold" />
                      <button onClick={() => GuardarNuevoPrecio(p.id)} className="text-emerald-400 p-1 bg-slate-800 rounded hover:bg-emerald-950"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setEditandoProductoId(null)} className="text-rose-400 p-1 bg-slate-800 rounded hover:bg-rose-950"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-400">${parseFloat(p.precio_usd).toFixed(2)}</span>
                      <button onClick={() => { setEditandoProductoId(p.id); setNuevoPrecioInput(p.precio_usd); }} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleEliminarProducto(p.id, p.nombre)} className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-colors" title="Eliminar del Inventario">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

          {/* COLUMNA 3: CAJA DE FACTURACIÓN CON FILTRO INTEGRADO */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/70 shadow-lg flex flex-col h-[560px]">
          
          {/* SECCIÓN REEMPLAZADA POR BUSCADOR INTERACTIVO AVANZADO */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 mb-3 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> Abrir Cuenta de Cliente:
            </span>
            
            {/* Campo de Texto de Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o tlf..." 
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              />
            </div>

            {/* Menú Dinámico que reacciona al filtro */}
            <select 
              onChange={e => {
                const encontrado = clientes.find(c => c.id === parseInt(e.target.value));
                if (encontrado) seleccionarYVerCliente(encontrado);
              }} 
              value={clienteSeleccionado?.id || ""} 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">
                {busquedaCliente ? `-- Resultados (${clientesFiltrados.length}) --` : '-- Seleccionar de la Lista --'}
              </option>
              {clientesFiltrados.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Saldo: ${parseFloat(c.deuda_usd || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {clienteSeleccionado ? (
            <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                <div className="border-b border-slate-700 pb-2 flex justify-between items-center">
                  <div className="truncate max-w-[130px]">
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">Expediente Seleccionado</span>
                    <h2 className="text-base font-black text-slate-100 truncate">{clienteSeleccionado.nombre}</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {clienteSeleccionado.telefono && (
                      <button onClick={() => enviarWhatsApp(clienteSeleccionado)} className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center gap-1 text-[11px] font-semibold hover:bg-emerald-600 hover:text-white transition-all">
                        <Share2 className="w-3 h-3" /> Cobrar
                      </button>
                    )}
                    <button onClick={() => handleEliminarCliente(clienteSeleccionado.id, clienteSeleccionado.nombre)} className="p-1.5 bg-rose-950/40 text-rose-400 rounded-lg border border-rose-900/40 hover:bg-rose-600 hover:text-white transition-all" title="Eliminar Cliente del Sistema">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* PRODUCTOS FIADOS EN LA CUENTA */}
                <div className="bg-slate-900/90 border border-slate-700/60 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Package className="w-3 h-3" /> Productos fiados en esta account:
                  </span>
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-1">
                    {consumosCliente.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic text-center py-2">No hay registro detallado de mercancía fiada.</p>
                    ) : (
                      consumosCliente.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/60 p-2 rounded-lg border border-slate-700/30 text-[11px]">
                          <div className="truncate max-w-[140px] text-slate-300">
                            <span className="font-extrabold text-cyan-400 mr-1">{item.cantidad}x</span>
                            {item.producto}
                          </div>
                          <div className="text-right font-mono text-[10px]">
                            <span className="text-rose-400 font-bold block">${parseFloat(item.subtotal_usd || 0).toFixed(2)}</span>
                            <span className="text-slate-400">{(parseFloat(item.subtotal_usd || 0) * tasa.tasa).toFixed(2)} Bs.</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* FIAR UN PRODUCTO */}
                <form onSubmit={handleRegistrarConsumo} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block"><ShoppingCart className="w-3.5 h-3.5 inline mr-1 text-cyan-400" /> Fiar Artículo</span>
                  <select value={formFiar.producto_id} onChange={e => setFormFiar({...formFiar, producto_id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                    <option value="">-- Buscar item --</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (${parseFloat(p.precio_usd).toFixed(2)})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={formFiar.cantidad} onChange={e => setFormFiar({...formFiar, cantidad: e.target.value})} className="w-14 bg-slate-900 border border-slate-700 rounded-lg text-center text-xs py-1" />
                    <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 rounded-lg text-xs transition-all">Cargar a la Cuenta</button>
                  </div>
                </form>

                {/* PROCESAR ABONO MULTIMONEDA */}
                <form onSubmit={ejecutarAbonoBimonetario} className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Registrar Abono</span>
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                      <button type="button" onClick={() => { setMonedaAbono('USD'); setMontoAbono(''); }} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${monedaAbono === 'USD' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'}`}>$ USD</button>
                      <button type="button" onClick={() => { setMonedaAbono('BS'); setMontoAbono(''); }} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${monedaAbono === 'BS' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'}`}>Bs.</button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-500">{monedaAbono === 'USD' ? '$' : 'Bs'}</span>
                      <input type="number" step="0.01" min="0.01" placeholder={monedaAbono === 'USD' ? "Monto $" : "Monto Bs"} value={montoAbono} onChange={e => setMontoAbono(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-emerald-500" required />
                    </div>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all">Abonar</button>
                  </div>

                  {montoAbono && (
                    <p className="text-[10px] text-slate-400 italic text-right">
                      {monedaAbono === 'USD' 
                        ? `Conversión: ${(parseFloat(montoAbono) * tasa.tasa).toFixed(2)} Bs.`
                        : `Conversión: $ ${(parseFloat(montoAbono) / tasa.tasa).toFixed(2)} USD`}
                    </p>
                  )}
                </form>

                {/* BOTÓN EXTRA: SALDAR LA TOTALIDAD DIRECTAMENTE */}
                <div className="pt-1">
                  <button type="button" onClick={() => liquidarDeudaTotal(clienteSeleccionado)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Saldar Deuda por Completo
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 px-4">
              <ShoppingCart className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold">Caja en Espera</p>
              <p className="text-[11px] mt-1 text-slate-500/80">Selecciona un deudor activo o abre un expediente desde la lista desplegable de arriba.</p>
            </div>
          )}
        </div>

        {/* COLUMNA 2: DEUDORES ACTIVOS */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/70 shadow-lg flex flex-col h-[560px]">
          <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2 mb-4"><User className="w-5 h-5" /> Clientes con Cuenta Activa</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {deudoresActivos.length === 0 ? (
              <div className="text-center mt-12 text-slate-500 text-xs">
                <p className="font-bold">🎉 ¡No hay deudas pendientes!</p>
                <p className="mt-1">Todos están al día. Usa la caja interactiva para abrir una cuenta nueva.</p>
              </div>
            ) : (
              deudoresActivos.map(c => {
                const totalBs = (parseFloat(c.deuda_usd || 0) * tasa.tasa).toFixed(2);
                const esSeleccionado = clienteSeleccionado?.id === c.id;
                return (
                  <div key={c.id} onClick={() => seleccionarYVerCliente(c)} className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${esSeleccionado ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-900'}`}>
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">{c.nombre}</h3>
                      {c.telefono && <p className="text-xs text-slate-500">{c.telefono}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-400">${parseFloat(c.deuda_usd || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{totalBs} Bs.</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      

      </main>
    </div>
  );
}

export default App;