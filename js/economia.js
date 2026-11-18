/**
 * Raíz & Barrio - Módulo Financiero: Mi Economía, Control de Gastos y Flujo de Caja
 * 100% Real, Dinámico y Conectado en Tiempo Real con Supabase (orders & producer_expenses)
 * Contexto: Hacienda San José · Daule, Guayas · Moneda USD ($) · IVA Ecuador 15%
 */

(function (window, document) {
  'use strict';

  // Identificador oficial del productor Max Productor / Hacienda San José
  const PRODUCER_USER_ID = '00000000-0000-0000-0000-000000000002';
  const PLATFORM_FEE_PERCENT = 0.05; // 5% comisión de plataforma

  // Estado del módulo
  let currentEconomyPeriod = '30d'; // '7d' | '30d' | '1y' | 'custom'
  let customDateRange = { start: null, end: null };
  let currentMovementsFilter = 'todos'; // 'todos' | 'ventas' | 'gastos' | 'devoluciones'
  let currentMovementsSearch = '';
  let expensePaymentStatus = 'pending';
  let uploadedExpenseReceiptFile = null;

  // Colecciones en memoria alimentadas en tiempo real desde Supabase
  let rawOrdersList = [];
  let rawExpensesList = [];
  let realtimeSubscribed = false;

  // Formato numérico USD con separador de miles y 2 decimales
  function formatUSD(num) {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Normalizar fechas para evitar desfases de huso horario
  function parseDateSafe(dateVal) {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    const str = String(dateVal);
    // Si viene como AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(str);
  }

  // Comprobar si un producto o item de orden pertenece a Max Productor / Hacienda San José
  function isMyProduct(item) {
    if (!item) return false;

    // 1. Por ID directo o numérico de productor si está presente
    if (item.producer_id && String(item.producer_id) === PRODUCER_USER_ID) return true;

    // 2. Si existe catálogo local del productor en ventana
    if (typeof window.producerProducts !== 'undefined' && Array.isArray(window.producerProducts)) {
      const match = window.producerProducts.find(p => 
        String(p.id) === String(item.id) || 
        String(p.numericId) === String(item.numericId || item.id) ||
        (p.title && item.title && p.title.toLowerCase().trim() === item.title.toLowerCase().trim())
      );
      if (match) return true;
    }

    // 3. Coincidencia por origen o finca
    const farmer = (item.farmer || item.origin || '').toLowerCase();
    if (farmer.includes('san josé') || farmer.includes('san jose') || farmer.includes('daule') || farmer.includes('max')) {
      return true;
    }

    // 4. Catálogo de cosechas propias de Hacienda San José
    const myCatalogTitles = [
      'tomate de huerta',
      'canasta huerto familiar',
      'cebolla colorada',
      'pimiento verde',
      'zanahoria de tierra',
      'rábanos de temporada',
      'rabanos de temporada',
      'rábanos daikon orgánicos',
      'rabanos daikon organicos',
      'banana',
      'banano criollo de ladera',
      'canasta huerta & frutas',
      'canasta huerta y frutas'
    ];
    const tit = (item.title || '').toLowerCase().trim();
    if (myCatalogTitles.some(t => tit.includes(t) || t.includes(tit))) {
      return true;
    }

    // Por defecto, si no tiene discriminador externo, considerar parte de la cuenta activa
    return true;
  }

  // ===========================================================================
  // CARGA Y CONSULTA DE DATOS DESDE SUPABASE
  // ===========================================================================

  async function loadOrdersFromSupabase() {
    try {
      if (window.supabase && typeof window.supabase.fetchApi === 'function') {
        const data = await window.supabase.fetchApi('orders?select=*&order=created_at.desc');
        if (Array.isArray(data)) {
          rawOrdersList = data;
          console.log(`[Economía] ${rawOrdersList.length} pedidos cargados de Supabase.`);
          return;
        }
      }
    } catch (err) {
      console.warn('Aviso consultando orders en Supabase:', err);
    }

    // Fallback de localStorage
    try {
      const localHistory = JSON.parse(localStorage.getItem('rb_orders_history') || '[]');
      const lastOrder = JSON.parse(localStorage.getItem('rb_last_order') || 'null');
      const combined = [...localHistory];
      if (lastOrder && !combined.some(o => o.id === lastOrder.id)) {
        combined.unshift(lastOrder);
      }
      if (combined.length > 0) {
        rawOrdersList = combined;
      }
    } catch (_) {}
  }

  async function loadExpensesFromSupabase() {
    try {
      if (window.supabase && typeof window.supabase.fetchApi === 'function') {
        const data = await window.supabase.fetchApi(`producer_expenses?producer_id=eq.${PRODUCER_USER_ID}&order=expense_date.desc`);
        if (Array.isArray(data) && data.length > 0) {
          rawExpensesList = data.map(e => ({
            id: e.id,
            date: e.expense_date,
            category: e.category || 'Otros',
            concept: e.concept || 'Gasto registrado',
            amount: Number(e.amount || 0),
            supplier: e.supplier || '',
            status: e.payment_status || 'paid',
            dueDate: e.due_date,
            invoiceRef: e.invoice_ref,
            receiptUrl: e.receipt_url,
            notes: e.notes
          }));
          // Respaldar en localStorage
          localStorage.setItem('rb_producer_expenses', JSON.stringify(rawExpensesList));
          console.log(`[Economía] ${rawExpensesList.length} gastos cargados desde Supabase.`);
          return;
        }
      }
    } catch (err) {
      console.warn('Aviso consultando producer_expenses en Supabase (usando respaldo local):', err);
    }

    // Fallback con datos guardados localmente por el productor
    try {
      const saved = JSON.parse(localStorage.getItem('rb_producer_expenses') || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        rawExpensesList = saved;
      } else {
        // Semilla base limpia para primera experiencia de Max Productor si la tabla aún no tiene filas
        rawExpensesList = [
          { id: 1, date: '2026-11-04', category: 'Insumos y cultivo', concept: 'Semillas orgánicas certificadas de zanahoria y rábano', amount: 85.00, supplier: 'AgroBio Daule', status: 'paid', invoiceRef: 'FACT-0062' },
          { id: 2, date: '2026-11-08', category: 'Insumos y cultivo', concept: 'Compost maduro y biofertilizante líquido', amount: 110.00, supplier: 'Finca La Esperanza', status: 'paid', invoiceRef: 'FACT-0071' },
          { id: 3, date: '2026-11-12', category: 'Transporte', concept: 'Flete de cosecha hacia centro de acopio Urdesa', amount: 60.00, supplier: 'Cooperativa Daule Express', status: 'paid', invoiceRef: 'FAC-0988' },
          { id: 4, date: '2026-11-15', category: 'Empaques', concept: 'Cajas de cartón corrugado y atados de yute', amount: 45.00, supplier: 'Empaques Ecológicos del Guayas', status: 'paid', invoiceRef: 'FACT-0079' },
          { id: 5, date: '2026-11-16', category: 'Insumos y cultivo', concept: 'Mangueras de micro-goteo para hortalizas', amount: 70.00, supplier: 'Agroinsumos La Semilla', status: 'pending', dueDate: '2026-11-22', invoiceRef: 'FACT-0081' }
        ];
        localStorage.setItem('rb_producer_expenses', JSON.stringify(rawExpensesList));
      }
    } catch (_) {}
  }

  // ===========================================================================
  // SUSCRIPCIÓN EN TIEMPO REAL (SUPABASE REALTIME + BROADCAST CHANNEL)
  // ===========================================================================

  function initEconomyRealtime() {
    if (realtimeSubscribed) return;
    realtimeSubscribed = true;

    // 1. Canal entre pestañas con BroadcastChannel (notificación instantánea al comprar)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const orderChannel = new BroadcastChannel('rb_realtime_orders');
        orderChannel.onmessage = async (ev) => {
          console.log('[Economía Realtime] Nueva orden detectada por BroadcastChannel:', ev.data);
          await loadOrdersFromSupabase();
          renderEconomyDashboard();
        };

        const prodChannel = new BroadcastChannel('rb_realtime_products');
        prodChannel.onmessage = async (ev) => {
          if (ev.data?.eventType === 'STOCK_DECREMENT' || ev.data?.eventType === 'ORDER_PLACED') {
            await loadOrdersFromSupabase();
            renderEconomyDashboard();
          }
        };
      } catch (_) {}
    }

    // 2. Suscripción nativa Supabase Realtime si está disponible
    if (window.supabase && window.supabase.realtime && typeof window.supabase.realtime.channel === 'function') {
      try {
        window.supabase.realtime
          .channel('public-orders-economy')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
            console.log('[Economía Realtime] Evento en tabla orders:', payload);
            await loadOrdersFromSupabase();
            renderEconomyDashboard();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'producer_expenses' }, async (payload) => {
            console.log('[Economía Realtime] Evento en tabla producer_expenses:', payload);
            await loadExpensesFromSupabase();
            renderEconomyDashboard();
          })
          .subscribe();
      } catch (e) {
        console.warn('Aviso conectando realtime en economía:', e);
      }
    }
  }

  // ===========================================================================
  // CÁLCULO DE MÉTRICAS DINÁMICAS POR PERÍODO
  // ===========================================================================

  function getPeriodDateBounds(periodKey) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now);

    if (periodKey === '7d') {
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else if (periodKey === '30d') {
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    } else if (periodKey === '1y') {
      startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    } else if (periodKey === 'custom' && customDateRange.start && customDateRange.end) {
      startDate = parseDateSafe(customDateRange.start);
      endDate = parseDateSafe(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default 30 días
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    return { startDate, endDate };
  }

  function formatRangeDisplay(startDate, endDate) {
    const opts = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString('es-EC', opts);
    const endStr = endDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }

  function computeEconomyForPeriod(periodKey) {
    const { startDate, endDate } = getPeriodDateBounds(periodKey);

    // 1. Filtrar órdenes del período
    const periodOrders = rawOrdersList.filter(o => {
      if (o.status === 'cancelled') return false;
      const d = parseDateSafe(o.created_at);
      return d >= startDate && d <= endDate;
    });

    // 2. Extraer ventas correspondientes a este productor
    let ventasBrutas = 0;
    let devoluciones = 0;
    let presentaciones = 0;
    let porCobrar = 0;
    let porCobrarCount = 0;
    const soldMap = {}; // { title: { product, presentation, quantity, unitPrice, total } }
    const unitBreakdown = {}; // { 'kg': count, 'manojo': count }

    periodOrders.forEach(ord => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      let orderProducerSubtotal = 0;
      let isOrderPending = (ord.payment_status !== 'COMPLETED' || ord.payment_method_type === 'cash_on_delivery' || ord.payment_method === 'CASH_ON_DELIVERY');

      items.forEach(it => {
        if (!isMyProduct(it)) return;

        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.price || 0);
        const sub = Number(it.subtotal || (price * qty));
        const unit = (it.unit || 'kg').replace(/[^a-zA-Z]/g, '').toLowerCase() || 'unidades';

        ventasBrutas += sub;
        presentaciones += qty;
        orderProducerSubtotal += sub;

        unitBreakdown[unit] = (unitBreakdown[unit] || 0) + qty;

        const title = it.title || 'Cosecha fresca';
        if (!soldMap[title]) {
          soldMap[title] = {
            product: title,
            presentation: it.unit || 'Kilogramo (kg)',
            quantity: 0,
            unitPrice: price,
            total: 0
          };
        }
        soldMap[title].quantity += qty;
        soldMap[title].total += sub;
      });

      if (ord.status === 'refunded' || ord.status === 'returned') {
        devoluciones += orderProducerSubtotal;
      } else if (isOrderPending && orderProducerSubtotal > 0) {
        porCobrar += orderProducerSubtotal;
        porCobrarCount += 1;
      }
    });

    const ventasNetas = Math.max(0, ventasBrutas - devoluciones);

    // 3. Filtrar gastos del período
    const periodExpenses = rawExpensesList.filter(e => {
      const d = parseDateSafe(e.date);
      return d >= startDate && d <= endDate;
    });

    const gastosTotal = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const comision = Math.round(ventasNetas * PLATFORM_FEE_PERCENT * 100) / 100;
    const gastosMasComision = gastosTotal + comision;
    const gananciaEstimada = Math.max(0, ventasNetas - gastosMasComision);
    const margen = ventasNetas > 0 ? ((gananciaEstimada / ventasNetas) * 100).toFixed(1) : '0.0';

    const porPagar = periodExpenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const porPagarCount = periodExpenses.filter(e => e.status === 'pending').length;

    const pagado = periodExpenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + comision;

    const cobrado = Math.max(0, ventasNetas - porCobrar);
    const flujoCaja = cobrado - pagado;

    // Subtítulo de presentaciones (ej. "300 paquetes de 1 kg + 120 manojos")
    let presentacionesSub = '';
    const unitEntries = Object.entries(unitBreakdown);
    if (unitEntries.length > 0) {
      presentacionesSub = unitEntries.map(([u, c]) => `${c} ${u}`).join(' + ');
    } else {
      presentacionesSub = '0 unidades vendidas';
    }

    // 4. Agrupación dinámica para la Gráfica de Barras "Así van tus ventas"
    const bars = buildDynamicChartBars(periodKey, startDate, endDate, periodOrders);

    // 5. Arreglo de productos vendidos
    const soldProducts = Object.values(soldMap).sort((a, b) => b.total - a.total);

    return {
      periodKey,
      rangeLabel: formatRangeDisplay(startDate, endDate),
      ventasBrutas,
      devoluciones,
      ventasNetas,
      comision,
      gastosTotal,
      gastosMasComision,
      gananciaEstimada,
      margen,
      presentaciones,
      presentacionesSub,
      porCobrar,
      porCobrarCount,
      porPagar,
      porPagarCount,
      cobrado,
      pagado,
      flujoCaja,
      bars,
      soldProducts,
      periodExpenses,
      periodOrders
    };
  }

  // Genera los tramos dinámicos de la gráfica de barras según el período activo
  function buildDynamicChartBars(periodKey, startDate, endDate, orders) {
    const tramos = [];

    if (periodKey === '7d') {
      // 7 barras individuales (día a día)
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayLabel = d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
        tramos.push({
          start: new Date(d.setHours(0, 0, 0, 0)),
          end: new Date(d.setHours(23, 59, 59, 999)),
          label: dayLabel,
          amount: 0,
          orderCount: 0
        });
      }
    } else if (periodKey === '30d') {
      // 4 semanas / tramos de aproximadamente 7-8 días
      const totalMs = endDate.getTime() - startDate.getTime();
      const stepMs = totalMs / 4;
      for (let i = 0; i < 4; i++) {
        const tStart = new Date(startDate.getTime() + (i * stepMs));
        const tEnd = new Date(startDate.getTime() + ((i + 1) * stepMs));
        if (i === 3) tEnd.setTime(endDate.getTime());

        const sStr = tStart.toLocaleDateString('es-EC', { day: 'numeric' });
        const eStr = tEnd.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
        tramos.push({
          start: tStart,
          end: tEnd,
          label: `${sStr}–${eStr}`,
          amount: 0,
          orderCount: 0
        });
      }
    } else if (periodKey === '1y') {
      // 12 meses
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleDateString('es-EC', { month: 'short' });
        const y = d.getFullYear();
        const m = d.getMonth();
        const tStart = new Date(y, m, 1);
        const tEnd = new Date(y, m + 1, 0, 23, 59, 59);

        tramos.push({
          start: tStart,
          end: tEnd,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''),
          amount: 0,
          orderCount: 0
        });
      }
    } else {
      // Custom: 4 tramos equitativos
      const totalMs = endDate.getTime() - startDate.getTime();
      const stepMs = Math.max(1, totalMs / 4);
      for (let i = 0; i < 4; i++) {
        const tStart = new Date(startDate.getTime() + (i * stepMs));
        const tEnd = new Date(startDate.getTime() + ((i + 1) * stepMs));
        const sStr = tStart.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
        const eStr = tEnd.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
        tramos.push({
          start: tStart,
          end: tEnd,
          label: `${sStr}–${eStr}`,
          amount: 0,
          orderCount: 0
        });
      }
    }

    // Distribuir ventas de las órdenes en los tramos
    orders.forEach(ord => {
      const ordDate = parseDateSafe(ord.created_at);
      const items = Array.isArray(ord.items) ? ord.items : [];
      let ordSubtotal = 0;

      items.forEach(it => {
        if (isMyProduct(it)) {
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.price || 0);
          ordSubtotal += Number(it.subtotal || (price * qty));
        }
      });

      if (ordSubtotal > 0) {
        const targetTramo = tramos.find(t => ordDate >= t.start && ordDate <= t.end);
        if (targetTramo) {
          targetTramo.amount += ordSubtotal;
          targetTramo.orderCount += 1;
        } else if (tramos.length > 0) {
          // Si cae en el límite más reciente
          tramos[tramos.length - 1].amount += ordSubtotal;
          tramos[tramos.length - 1].orderCount += 1;
        }
      }
    });

    // Identificar el tramo con mayor venta o el más reciente para destacarlo
    let maxAmount = 0;
    tramos.forEach(t => {
      if (t.amount > maxAmount) maxAmount = t.amount;
    });

    tramos.forEach((t, idx) => {
      t.active = (maxAmount > 0 && t.amount === maxAmount) || (maxAmount === 0 && idx === tramos.length - 1);
    });

    return tramos;
  }

  // ===========================================================================
  // RENDERIZADO VISUAL DEL DASHBOARD "MI ECONOMÍA"
  // ===========================================================================

  function renderEconomyDashboard() {
    const data = computeEconomyForPeriod(currentEconomyPeriod);

    // 1. Rango de fechas superior
    const rangeDisplay = document.getElementById('econ-period-range-display');
    if (rangeDisplay) {
      rangeDisplay.textContent = data.rangeLabel;
    }

    // 2. Tarjetas KPI
    const kpiVentas = document.getElementById('econ-kpi-ventas-netas');
    const kpiVentasSub = document.getElementById('econ-kpi-ventas-sub');
    if (kpiVentas) kpiVentas.textContent = `$${formatUSD(data.ventasNetas)}`;
    if (kpiVentasSub) {
      kpiVentasSub.textContent = data.devoluciones > 0 
        ? `Tras $${formatUSD(data.devoluciones)} en devoluciones` 
        : (data.ventasNetas > 0 ? 'Sin devoluciones registradas' : 'Aún sin ventas en este período');
    }

    const kpiGanancia = document.getElementById('econ-kpi-ganancia');
    const kpiGananciaSub = document.getElementById('econ-kpi-ganancia-sub');
    if (kpiGanancia) kpiGanancia.textContent = `$${formatUSD(data.gananciaEstimada)}`;
    if (kpiGananciaSub) kpiGananciaSub.textContent = `Margen del ${data.margen}% · antes de impuestos`;

    const kpiPresentaciones = document.getElementById('econ-kpi-presentaciones');
    const kpiPresentacionesSub = document.getElementById('econ-kpi-presentaciones-sub');
    if (kpiPresentaciones) kpiPresentaciones.textContent = data.presentaciones;
    if (kpiPresentacionesSub) kpiPresentacionesSub.textContent = data.presentacionesSub;

    const kpiPorCobrar = document.getElementById('econ-kpi-por-cobrar');
    const kpiPorCobrarSub = document.getElementById('econ-kpi-por-cobrar-sub');
    if (kpiPorCobrar) kpiPorCobrar.textContent = `$${formatUSD(data.porCobrar)}`;
    if (kpiPorCobrarSub) {
      kpiPorCobrarSub.textContent = `${data.porCobrarCount} pedido${data.porCobrarCount === 1 ? '' : 's'} pendiente${data.porCobrarCount === 1 ? '' : 's'} de pago`;
    }

    // 3. Gráfica de Barras "Así van tus ventas"
    renderSalesBarChart(data.bars, data.ventasNetas);

    // 4. Desglose de Inversión por Categoría
    renderExpenseCategories(data.periodExpenses, data.gastosTotal, data.comision);

    // 5. Tabla "Tu finca en perspectiva"
    renderPerspectiveTable();

    // 6. Tabla "Lo que ha vendido tu finca"
    renderSoldProductsTable(data.soldProducts, data.ventasBrutas, data.devoluciones, data.ventasNetas);

    // 7. Lista de Movimientos Recientes
    renderMovementsList(data.periodOrders, data.periodExpenses);

    // 8. Cuentas por Atender
    renderPendingAccounts(data);
  }

  // Renderizado dinámico de la Gráfica de Barras
  function renderSalesBarChart(bars, totalAmount) {
    const container = document.getElementById('econ-bar-chart-container');
    const totalDisplay = document.getElementById('econ-chart-total');
    const subtitle = document.getElementById('econ-chart-subtitle');

    if (totalDisplay) totalDisplay.textContent = `Total · $${formatUSD(totalAmount || 0)}`;
    if (subtitle) {
      const label = currentEconomyPeriod === '7d' ? 'últimos 7 días' : currentEconomyPeriod === '1y' ? 'último año' : 'últimos 30 días';
      subtitle.textContent = `Ventas netas por tramo · ${label}`;
    }

    if (!container) return;

    if (!Array.isArray(bars) || bars.length === 0) {
      container.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center text-xs text-stone-400 py-8">
          <span class="text-xl mb-1">🌱</span>
          <span>Aún no hay ventas registradas en este período.</span>
        </div>
      `;
      return;
    }

    const maxVal = Math.max(...bars.map(b => b.amount), 1);

    container.innerHTML = bars.map(bar => {
      // Si la cantidad es 0, altura mínima del 8% para estética limpia
      const heightPercent = bar.amount > 0 ? Math.max(14, Math.min(100, Math.round((bar.amount / maxVal) * 100))) : 8;
      const isHighlight = bar.active && bar.amount > 0;
      const barBg = isHighlight 
        ? 'bg-[#143628]' 
        : (bar.amount > 0 ? 'bg-[#A3B899]' : 'bg-stone-200');
      const textColor = bar.amount > 0 ? (isHighlight ? 'text-[#143628] font-extrabold' : 'text-stone-700 font-bold') : 'text-stone-400 font-medium';

      return `
        <div class="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer" title="${bar.orderCount} pedido(s) · $${formatUSD(bar.amount)} USD">
          <!-- Monto USD sobre la barra -->
          <span class="text-[11px] ${textColor} mb-1.5 transition-transform group-hover:scale-105">
            $${formatUSD(bar.amount)}
          </span>
          <!-- Barra vertical -->
          <div class="w-full max-w-[48px] ${barBg} rounded-t-lg transition-all duration-500 hover:opacity-90 shadow-2xs group-hover:ring-2 group-hover:ring-[#143628]/30" style="height: ${heightPercent}%;"></div>
          <!-- Etiqueta de fecha -->
          <span class="text-[10px] text-stone-500 font-medium mt-2 whitespace-nowrap group-hover:text-stone-900 transition">
            ${escapeHtml(bar.label)}
          </span>
        </div>
      `;
    }).join('');
  }

  // Renderizado dinámico de "¿En qué has invertido?"
  function renderExpenseCategories(expenses, totalGastos, comision) {
    const catInsumos = expenses.filter(e => e.category === 'Insumos y cultivo').reduce((a, e) => a + Number(e.amount || 0), 0);
    const catTransporte = expenses.filter(e => e.category === 'Transporte').reduce((a, e) => a + Number(e.amount || 0), 0);
    const catEmpaques = expenses.filter(e => e.category === 'Empaques').reduce((a, e) => a + Number(e.amount || 0), 0);
    const catOtros = expenses.filter(e => !['Insumos y cultivo', 'Transporte', 'Empaques'].includes(e.category)).reduce((a, e) => a + Number(e.amount || 0), 0);

    const maxCat = Math.max(1, totalGastos);

    const elInsumos = document.getElementById('econ-cat-insumos-amount');
    const barInsumos = document.getElementById('econ-cat-insumos-bar');
    if (elInsumos) elInsumos.textContent = `$${formatUSD(catInsumos)}`;
    if (barInsumos) barInsumos.style.width = `${Math.min(100, Math.round((catInsumos / maxCat) * 100))}%`;

    const elTransporte = document.getElementById('econ-cat-transporte-amount');
    const barTransporte = document.getElementById('econ-cat-transporte-bar');
    if (elTransporte) elTransporte.textContent = `$${formatUSD(catTransporte)}`;
    if (barTransporte) barTransporte.style.width = `${Math.min(100, Math.round((catTransporte / maxCat) * 100))}%`;

    const elEmpaques = document.getElementById('econ-cat-empaques-amount');
    const barEmpaques = document.getElementById('econ-cat-empaques-bar');
    if (elEmpaques) elEmpaques.textContent = `$${formatUSD(catEmpaques)}`;
    if (barEmpaques) barEmpaques.style.width = `${Math.min(100, Math.round((catEmpaques / maxCat) * 100))}%`;

    const elOtros = document.getElementById('econ-cat-otros-amount');
    const barOtros = document.getElementById('econ-cat-otros-bar');
    if (elOtros) elOtros.textContent = `$${formatUSD(catOtros)}`;
    if (barOtros) barOtros.style.width = `${Math.min(100, Math.round((catOtros / maxCat) * 100))}%`;

    const elTotal = document.getElementById('econ-total-gastos');
    if (elTotal) elTotal.textContent = `$${formatUSD(totalGastos)}`;

    const elComisionNota = document.getElementById('econ-comision-nota');
    if (elComisionNota) {
      elComisionNota.textContent = `Comisión de la plataforma: $${formatUSD(comision)} adicionales.`;
    }

    const subtitle = document.getElementById('econ-expenses-subtitle');
    if (subtitle) {
      const label = currentEconomyPeriod === '7d' ? '7 días' : currentEconomyPeriod === '1y' ? '1 año' : '30 días';
      subtitle.textContent = `Gastos registrados · ${label}`;
    }
  }

  // Renderizado dinámico de "Tu finca en perspectiva" para los 3 períodos
  function renderPerspectiveTable() {
    const tbody = document.getElementById('econ-perspective-tbody');
    if (!tbody) return;

    const p7 = computeEconomyForPeriod('7d');
    const p30 = computeEconomyForPeriod('30d');
    const p1y = computeEconomyForPeriod('1y');

    const periodsData = [
      { key: '7d', label: `7 días · ${p7.rangeLabel}`, ventas: p7.ventasNetas, gastos: p7.gastosMasComision, ganancia: p7.gananciaEstimada, pres: p7.presentaciones },
      { key: '30d', label: `30 días · ${p30.rangeLabel}`, ventas: p30.ventasNetas, gastos: p30.gastosMasComision, ganancia: p30.gananciaEstimada, pres: p30.presentaciones },
      { key: '1y', label: `1 año · ${p1y.rangeLabel}`, ventas: p1y.ventasNetas, gastos: p1y.gastosMasComision, ganancia: p1y.gananciaEstimada, pres: p1y.presentaciones }
    ];

    tbody.innerHTML = periodsData.map(p => {
      const isActive = p.key === currentEconomyPeriod || (currentEconomyPeriod === 'custom' && p.key === '30d');
      const rowClass = isActive ? 'bg-[#f2f6f3] font-bold text-stone-900' : 'text-stone-700 hover:bg-stone-50';
      const tagActive = isActive ? '<span class="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#143628] text-white">Activo</span>' : '';

      return `
        <tr class="${rowClass} transition">
          <td class="py-3 px-2 font-medium">${p.label} ${tagActive}</td>
          <td class="py-3 px-2 font-bold text-stone-900">$${formatUSD(p.ventas)}</td>
          <td class="py-3 px-2 text-stone-500">$${formatUSD(p.gastos)}</td>
          <td class="py-3 px-2 font-bold ${isActive ? 'text-emerald-900' : 'text-stone-900'}">$${formatUSD(p.ganancia)}</td>
          <td class="py-3 px-2 text-right font-medium">${p.pres.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  // Renderizado dinámico de "Lo que ha vendido tu finca"
  function renderSoldProductsTable(products, brutas, devoluciones, netas) {
    const tbody = document.getElementById('econ-sold-products-tbody');
    const countBadge = document.getElementById('econ-sold-products-count');
    const formulaResumen = document.getElementById('econ-formula-resumen');

    if (countBadge) {
      const pLabel = currentEconomyPeriod === '7d' ? '7 días' : currentEconomyPeriod === '1y' ? '1 año' : '30 días';
      countBadge.textContent = `${pLabel} · ${products.length} producto${products.length === 1 ? '' : 's'} con ventas`;
    }

    if (formulaResumen) {
      formulaResumen.innerHTML = `Ventas brutas: <span class="font-bold">$${formatUSD(brutas)}</span> − Devoluciones: <span class="font-bold text-[#c85a32]">$${formatUSD(devoluciones)}</span> = Ventas netas: <span class="font-extrabold text-stone-900">$${formatUSD(netas)}</span>`;
    }

    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-xs text-stone-400">
            🌱 No se registraron ventas en este período para los productos de tu finca.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr class="text-stone-700 hover:bg-stone-50 transition">
        <td class="py-3 px-2 font-bold text-stone-900">${escapeHtml(p.product)}</td>
        <td class="py-3 px-2 text-stone-500">${escapeHtml(p.presentation)}</td>
        <td class="py-3 px-2 text-center font-bold text-stone-900">${p.quantity}</td>
        <td class="py-3 px-2 text-stone-600 font-medium">$${formatUSD(p.unitPrice)}</td>
        <td class="py-3 px-2 text-right font-bold text-stone-900">$${formatUSD(p.total)}</td>
      </tr>
    `).join('');
  }

  // Renderizado dinámico de la lista de "Movimientos recientes"
  function renderMovementsList(orders, expenses) {
    const container = document.getElementById('econ-movements-list');
    const countLabel = document.getElementById('econ-movements-count-label');
    if (!container) return;

    const movements = [];

    // 1. Agregar Ventas
    (orders || rawOrdersList).forEach(ord => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      let totalProducer = 0;
      const titles = [];

      items.forEach(it => {
        if (isMyProduct(it)) {
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.price || 0);
          totalProducer += Number(it.subtotal || (price * qty));
          titles.push(`${qty} × ${it.title}`);
        }
      });

      if (totalProducer > 0) {
        const isPaid = ord.payment_status === 'COMPLETED' && ord.payment_method_type !== 'cash_on_delivery';
        const isRefund = ord.status === 'refunded' || ord.status === 'returned';

        movements.push({
          id: `ord-${ord.id || ord.order_number}`,
          type: isRefund ? 'devolucion' : 'venta',
          date: parseDateSafe(ord.created_at),
          concept: isRefund ? 'Devolución a comprador' : (titles[0] || 'Venta de cosecha'),
          ref: `${ord.order_number || 'PED-???'} · ${titles.slice(0, 2).join(', ')}`,
          amount: isRefund ? -totalProducer : totalProducer,
          status: isRefund ? 'Reembolsado' : (isPaid ? 'Cobrado' : 'Por cobrar'),
          statusClass: isRefund 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : (isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200')
        });
      }
    });

    // 2. Agregar Gastos
    (expenses || rawExpensesList).forEach(exp => {
      const isPaid = exp.status === 'paid';
      movements.push({
        id: `exp-${exp.id}`,
        type: 'gasto',
        date: parseDateSafe(exp.date),
        concept: exp.concept || 'Gasto operativo',
        ref: `${exp.invoiceRef || 'GAS-REG'} · ${exp.category}`,
        amount: -Number(exp.amount || 0),
        status: isPaid ? 'Pagado' : 'Por pagar',
        statusClass: isPaid ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]'
      });
    });

    // Ordenar cronológicamente descendente
    movements.sort((a, b) => b.date - a.date);

    // Filtrar por tipo y búsqueda
    let filtered = movements.filter(m => {
      if (currentMovementsFilter !== 'todos') {
        if (currentMovementsFilter === 'ventas' && m.type !== 'venta') return false;
        if (currentMovementsFilter === 'gastos' && m.type !== 'gasto') return false;
        if (currentMovementsFilter === 'devoluciones' && m.type !== 'devolucion') return false;
      }
      if (currentMovementsSearch) {
        const c = m.concept.toLowerCase();
        const r = m.ref.toLowerCase();
        return c.includes(currentMovementsSearch) || r.includes(currentMovementsSearch);
      }
      return true;
    });

    if (countLabel) {
      const label = currentEconomyPeriod === '7d' ? '7 días' : currentEconomyPeriod === '1y' ? '1 año' : '30 días';
      countLabel.textContent = `${Math.min(filtered.length, 5)} de ${filtered.length} · ${label}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-xs text-stone-400">
          🌱 No hay movimientos registrados con los filtros seleccionados.
        </div>
      `;
      return;
    }

    // Mostrar los primeros 5 o todos si se busca
    const displayed = filtered.slice(0, 7);

    container.innerHTML = displayed.map(m => {
      const dateStr = m.date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
      const isPositive = m.amount > 0;
      const amountColor = isPositive ? 'text-stone-900 font-bold' : (m.type === 'devolucion' ? 'text-[#c85a32] font-bold' : 'text-stone-700 font-bold');
      const sign = isPositive ? '+' : '';

      return `
        <div class="py-3 flex items-center justify-between text-xs hover:bg-stone-50/80 px-2 rounded-xl transition">
          <div>
            <div class="font-medium text-stone-900 flex items-center gap-1.5">
              <span>${dateStr}</span>
              <span class="text-stone-300">·</span>
              <span>${escapeHtml(m.concept)}</span>
            </div>
            <p class="text-[11px] text-stone-400 mt-0.5">${escapeHtml(m.ref)}</p>
          </div>
          <div class="text-right">
            <span class="${amountColor} block">${sign}$${formatUSD(Math.abs(m.amount))}</span>
            <span class="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.statusClass}">
              ${m.status}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Renderizado dinámico de "Cuentas por atender"
  function renderPendingAccounts(data) {
    const elCobrarBadge = document.getElementById('econ-por-cobrar-badge');
    const elCobrarAmount = document.getElementById('econ-por-cobrar-amount');
    const elCobrarDate = document.getElementById('econ-por-cobrar-date');

    if (elCobrarBadge) elCobrarBadge.textContent = `Por cobrar · ${data.porCobrarCount} pedidos`;
    if (elCobrarAmount) elCobrarAmount.textContent = `$${formatUSD(data.porCobrar)}`;
    if (elCobrarDate) {
      const nextFri = new Date();
      nextFri.setDate(nextFri.getDate() + ((5 + 7 - nextFri.getDay()) % 7 || 7));
      elCobrarDate.textContent = `Cobro previsto corte semanal: ${nextFri.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    const elPagarBadge = document.getElementById('econ-por-pagar-badge');
    const elPagarAmount = document.getElementById('econ-por-pagar-amount');
    const listPendingExp = document.getElementById('econ-pending-expenses-list');

    if (elPagarBadge) elPagarBadge.textContent = `Por pagar · ${data.porPagarCount} gastos`;
    if (elPagarAmount) elPagarAmount.textContent = `$${formatUSD(data.porPagar)}`;

    if (listPendingExp) {
      const pendingExpenses = data.periodExpenses.filter(e => e.status === 'pending');
      if (pendingExpenses.length === 0) {
        listPendingExp.innerHTML = `<p class="text-[11px] text-emerald-800 font-medium">✓ No tienes pagos pendientes en este período.</p>`;
      } else {
        listPendingExp.innerHTML = pendingExpenses.map(e => `
          <div class="flex items-center justify-between py-1 border-b border-[#f5dfd5]/60 last:border-b-0 text-[11px]">
            <span class="truncate pr-2 text-stone-700">${escapeHtml(e.concept)}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="font-bold text-stone-900">$${formatUSD(e.amount)}</span>
              <button type="button" onclick="markExpenseAsPaid(${e.id})" class="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition cursor-pointer" title="Marcar como pagado">
                Pagar
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // Flujo de caja del período
    const elFlujoSub = document.getElementById('econ-flujo-caja-sub');
    const elFlujoAmount = document.getElementById('econ-flujo-caja-amount');
    if (elFlujoSub) {
      elFlujoSub.textContent = `Cobrado $${formatUSD(data.cobrado)} − pagado $${formatUSD(data.pagado)}`;
    }
    if (elFlujoAmount) {
      const isPos = data.flujoCaja >= 0;
      elFlujoAmount.className = isPos ? 'font-serif text-2xl font-bold text-emerald-800 mt-1' : 'font-serif text-2xl font-bold text-[#c85a32] mt-1';
      elFlujoAmount.textContent = `${isPos ? '+' : '-'}$${formatUSD(Math.abs(data.flujoCaja))}`;
    }
  }

  // ===========================================================================
  // INTERACTIVIDAD Y REGISTRO DE GASTOS
  // ===========================================================================

  function setEconomyPeriod(period) {
    currentEconomyPeriod = period;

    const btnIds = ['7d', '30d', '1y', 'custom'];
    btnIds.forEach(id => {
      const el = document.getElementById(`econ-period-${id}`);
      if (el) {
        if (id === period) {
          el.className = 'econ-period-btn px-3.5 py-1.5 rounded-lg font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
        } else {
          el.className = 'econ-period-btn px-3.5 py-1.5 rounded-lg font-bold text-stone-600 hover:text-stone-900 transition cursor-pointer';
        }
      }
    });

    renderEconomyDashboard();
  }

  function toggleCustomPeriodModal() {
    const today = new Date().toISOString().split('T')[0];
    const prevMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const startPrompt = prompt('Ingresa fecha inicial (AAAA-MM-DD):', prevMonth);
    if (!startPrompt) return;
    const endPrompt = prompt('Ingresa fecha final (AAAA-MM-DD):', today);
    if (!endPrompt) return;

    customDateRange = { start: startPrompt, end: endPrompt };
    setEconomyPeriod('custom');
  }

  function handleMovementsSearch(val) {
    currentMovementsSearch = (val || '').toLowerCase().trim();
    const data = computeEconomyForPeriod(currentEconomyPeriod);
    renderMovementsList(data.periodOrders, data.periodExpenses);
  }

  function handleMovementsTypeFilter(type) {
    currentMovementsFilter = type || 'todos';
    const data = computeEconomyForPeriod(currentEconomyPeriod);
    renderMovementsList(data.periodOrders, data.periodExpenses);
  }

  function openExpenseForm() {
    if (typeof window.switchProducerTab === 'function') {
      window.switchProducerTab('registrar-gasto');
    }
    resetExpenseForm();
  }

  function resetExpenseForm() {
    const form = document.getElementById('form-registrar-gasto');
    if (form) form.reset();

    const dateInput = document.getElementById('expense-form-date') || document.getElementById('expense-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const catSelect = document.getElementById('expense-form-category') || document.getElementById('expense-category');
    if (catSelect) catSelect.selectedIndex = 0;

    const conceptInput = document.getElementById('expense-form-concept') || document.getElementById('expense-concept');
    if (conceptInput) conceptInput.value = '';

    const amountInput = document.getElementById('expense-form-amount') || document.getElementById('expense-amount');
    if (amountInput) amountInput.value = '';

    const supplierInput = document.getElementById('expense-form-supplier') || document.getElementById('expense-supplier');
    if (supplierInput) supplierInput.value = '';

    const dueDateInput = document.getElementById('expense-form-due-date') || document.getElementById('expense-due-date');
    if (dueDateInput) dueDateInput.value = '';

    const invoiceInput = document.getElementById('expense-form-invoice-ref') || document.getElementById('expense-invoice');
    if (invoiceInput) invoiceInput.value = '';

    const notesInput = document.getElementById('expense-form-notes') || document.getElementById('expense-notes');
    if (notesInput) notesInput.value = '';

    const receiptFile = document.getElementById('expense-form-receipt-file');
    if (receiptFile) receiptFile.value = '';

    const filenameEl = document.getElementById('expense-receipt-filename');
    if (filenameEl) {
      filenameEl.textContent = 'Ningún archivo seleccionado';
      filenameEl.className = 'text-xs text-stone-400 italic';
    }

    const preview = document.getElementById('expense-receipt-preview');
    if (preview) preview.classList.add('hidden');
    uploadedExpenseReceiptFile = null;

    expensePaymentStatus = 'pending';
    setExpensePaymentStatus('pending');
    handleExpenseAmountChange('0');
  }

  function setExpensePaymentStatus(status) {
    expensePaymentStatus = status;

    // Soportar selectores de productor.html
    const btnPending = document.getElementById('expense-btn-pending') || document.getElementById('btn-expense-pending');
    const btnPaid = document.getElementById('expense-btn-paid') || document.getElementById('btn-expense-paid');
    const pendingFields = document.getElementById('expense-pending-fields') || document.getElementById('expense-due-date-container');

    if (status === 'pending') {
      if (btnPending) {
        btnPending.className = 'py-2.5 px-3 rounded-lg text-xs font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
      }
      if (btnPaid) {
        btnPaid.className = 'py-2.5 px-3 rounded-lg text-xs font-bold text-stone-700 hover:text-stone-900 transition cursor-pointer';
      }
      if (pendingFields) pendingFields.classList.remove('hidden');
    } else {
      if (btnPaid) {
        btnPaid.className = 'py-2.5 px-3 rounded-lg text-xs font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
      }
      if (btnPending) {
        btnPending.className = 'py-2.5 px-3 rounded-lg text-xs font-bold text-stone-700 hover:text-stone-900 transition cursor-pointer';
      }
      if (pendingFields) pendingFields.classList.add('hidden');
    }

    const amountInput = document.getElementById('expense-form-amount') || document.getElementById('expense-amount');
    const currentVal = amountInput ? amountInput.value : '0';
    handleExpenseAmountChange(currentVal);
  }

  function handleExpenseAmountChange(val) {
    const rawNum = parseFloat(String(val || '').replace(/[^0-9.]/g, ''));
    const newAmount = isNaN(rawNum) ? 0 : rawNum;
    const data = computeEconomyForPeriod('30d');

    const rangeEl = document.getElementById('expense-preview-range');
    if (rangeEl && data.rangeLabel) {
      rangeEl.textContent = data.rangeLabel;
    }

    const newAmountEl = document.getElementById('expense-preview-new-amount');
    if (newAmountEl) {
      newAmountEl.textContent = `$${formatUSD(newAmount)}`;
    }

    const totalComp = document.getElementById('expense-preview-total-comp');
    if (totalComp) {
      const nextTotal = data.gastosTotal + newAmount;
      totalComp.innerHTML = `
        <span class="text-stone-500">$${formatUSD(data.gastosTotal)}</span>
        <span class="text-stone-400">→</span>
        <span class="text-stone-900 font-extrabold">$${formatUSD(nextTotal)}</span>
      `;
    }

    const profitComp = document.getElementById('expense-preview-profit-comp');
    if (profitComp) {
      const nextGastosMasComision = (data.gastosTotal + newAmount) + data.comision;
      const nextProfit = Math.max(0, data.ventasNetas - nextGastosMasComision);
      profitComp.innerHTML = `
        <span class="text-stone-500">$${formatUSD(data.gananciaEstimada)}</span>
        <span class="text-stone-400">→</span>
        <span class="text-emerald-800 font-extrabold">$${formatUSD(nextProfit)}</span>
      `;
    }

    const pendingComp = document.getElementById('expense-preview-pending-comp');
    if (pendingComp) {
      const nextPending = expensePaymentStatus === 'pending' ? data.porPagar + newAmount : data.porPagar;
      pendingComp.innerHTML = `
        <span class="text-stone-500">$${formatUSD(data.porPagar)}</span>
        <span class="text-stone-400">→</span>
        <span class="text-[#c85a32] font-extrabold">$${formatUSD(nextPending)}</span>
      `;
    }
  }

  function handleExpenseReceiptFile(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      if (typeof window.showProducerToast === 'function') {
        window.showProducerToast('El comprobante excede el tamaño máximo permitido de 10 MB.', true);
      }
      input.value = '';
      return;
    }

    uploadedExpenseReceiptFile = file;
    const filenameEl = document.getElementById('expense-receipt-filename');
    if (filenameEl) {
      filenameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      filenameEl.className = 'text-xs text-emerald-800 font-bold';
    }
  }

  async function saveProducerExpense(e) {
    if (e && e.preventDefault) e.preventDefault();

    const categorySelect = document.getElementById('expense-form-category') || document.getElementById('expense-category');
    const conceptInput = document.getElementById('expense-form-concept') || document.getElementById('expense-concept');
    const amountInput = document.getElementById('expense-form-amount') || document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-form-date') || document.getElementById('expense-date');
    const supplierInput = document.getElementById('expense-form-supplier') || document.getElementById('expense-supplier');
    const dueDateInput = document.getElementById('expense-form-due-date') || document.getElementById('expense-due-date');
    const invoiceInput = document.getElementById('expense-form-invoice-ref') || document.getElementById('expense-invoice');
    const notesInput = document.getElementById('expense-form-notes') || document.getElementById('expense-notes');

    const saveBtn = document.getElementById('btn-save-expense');
    const saveLabel = document.getElementById('btn-save-expense-label');
    const saveIcon = document.getElementById('btn-save-expense-icon');

    const concept = (conceptInput ? conceptInput.value : '').trim();
    const rawAmount = (amountInput ? amountInput.value : '').replace(/[^0-9.]/g, '');
    const amount = parseFloat(rawAmount);
    const category = categorySelect ? categorySelect.value : 'Insumos y cultivo';
    const date = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];

    if (!concept) {
      if (typeof window.showProducerToast === 'function') {
        window.showProducerToast('Por favor describe el concepto del gasto.', true);
      }
      if (conceptInput) conceptInput.focus();
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      if (typeof window.showProducerToast === 'function') {
        window.showProducerToast('Ingresa un monto numérico válido en dólares (USD).', true);
      }
      if (amountInput) amountInput.focus();
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (saveLabel) saveLabel.textContent = 'Guardando gasto...';
    if (saveIcon) saveIcon.textContent = '⏳';

    try {
      let receiptUrl = null;

      // 1. Subida a Supabase Storage (bucket: expense-receipts)
      if (uploadedExpenseReceiptFile && window.supabase && window.supabase.storage) {
        try {
          const ext = uploadedExpenseReceiptFile.name.split('.').pop() || 'png';
          const storagePath = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const uploadRes = await window.supabase.storage.from('expense-receipts').upload(storagePath, uploadedExpenseReceiptFile, {
            contentType: uploadedExpenseReceiptFile.type,
            upsert: true
          });
          if (uploadRes && !uploadRes.error) {
            receiptUrl = `${window.SUPABASE_STORAGE_URL || 'https://cbzchsfspqfqgqtzcqlu.supabase.co/storage/v1/object/public'}/expense-receipts/${storagePath}`;
          }
        } catch (uploadErr) {
          console.warn('Aviso subiendo comprobante a Storage:', uploadErr);
        }
      }

      const newExpense = {
        id: Date.now(),
        producer_id: PRODUCER_USER_ID,
        category: category,
        concept: concept,
        amount: amount,
        expense_date: date,
        date: date,
        supplier: (supplierInput ? supplierInput.value : '').trim(),
        payment_status: expensePaymentStatus,
        status: expensePaymentStatus,
        due_date: expensePaymentStatus === 'pending' ? (dueDateInput ? dueDateInput.value : null) : null,
        invoice_ref: (invoiceInput ? invoiceInput.value : '').trim(),
        receipt_url: receiptUrl,
        notes: (notesInput ? notesInput.value : '').trim()
      };

      // 2. Guardar en Supabase Database
      if (window.supabase && typeof window.supabase.fetchApi === 'function') {
        try {
          const resp = await window.supabase.fetchApi('producer_expenses', {
            method: 'POST',
            body: JSON.stringify(newExpense)
          });
          if (resp && resp[0] && resp[0].id) {
            newExpense.id = resp[0].id;
          }
        } catch (errDb) {
          console.warn('Aviso guardando en tabla producer_expenses:', errDb);
        }
      }

      // 3. Guardar en memoria y localStorage
      rawExpensesList.unshift(newExpense);
      localStorage.setItem('rb_producer_expenses', JSON.stringify(rawExpensesList));

      if (typeof window.showProducerToast === 'function') {
        window.showProducerToast(`✓ Gasto de $${formatUSD(amount)} USD guardado con éxito.`);
      }

      if (typeof window.switchProducerTab === 'function') {
        window.switchProducerTab('mi-economia');
      }
      renderEconomyDashboard();
    } catch (saveErr) {
      console.error('Error guardando gasto:', saveErr);
      if (typeof window.showProducerToast === 'function') {
        window.showProducerToast('Ocurrió un error al guardar el gasto.', true);
      }
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (saveLabel) saveLabel.textContent = 'Guardar gasto';
      if (saveIcon) saveIcon.textContent = '✓';
    }
  }

  async function markExpenseAsPaid(expenseId) {
    const exp = rawExpensesList.find(e => e.id == expenseId);
    if (!exp) return;

    exp.status = 'paid';
    exp.payment_status = 'paid';

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        await window.supabase.fetchApi(`producer_expenses?id=eq.${expenseId}`, {
          method: 'PATCH',
          body: JSON.stringify({ payment_status: 'paid' })
        });
      } catch (_) {}
    }

    localStorage.setItem('rb_producer_expenses', JSON.stringify(rawExpensesList));
    if (typeof window.showProducerToast === 'function') {
      window.showProducerToast(`✓ Gasto "${exp.concept}" marcado como pagado.`);
    }
    renderEconomyDashboard();
  }

  // Exportar datos reales a CSV con codificación UTF-8
  function exportEconomyCSV() {
    const data = computeEconomyForPeriod(currentEconomyPeriod);
    const rows = [
      ['Fecha', 'Tipo', 'Concepto', 'Referencia', 'Monto USD', 'Estado']
    ];

    // Ventas
    data.periodOrders.forEach(ord => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      let totalProd = 0;
      const titles = [];
      items.forEach(it => {
        if (isMyProduct(it)) {
          totalProd += Number(it.subtotal || (Number(it.price || 0) * Number(it.quantity || 1)));
          titles.push(`${it.quantity}x ${it.title}`);
        }
      });
      if (totalProd > 0) {
        rows.push([
          parseDateSafe(ord.created_at).toISOString().split('T')[0],
          'Venta',
          `"${titles.join('; ')}"`,
          ord.order_number || 'PED-???',
          totalProd.toFixed(2),
          ord.payment_status === 'COMPLETED' ? 'Cobrado' : 'Por cobrar'
        ]);
      }
    });

    // Gastos
    data.periodExpenses.forEach(exp => {
      rows.push([
        exp.date,
        'Gasto',
        `"${exp.concept}"`,
        exp.invoiceRef || 'GAS-REG',
        (-Number(exp.amount || 0)).toFixed(2),
        exp.status === 'paid' ? 'Pagado' : 'Por pagar'
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi_economia_hacienda_san_jose_${currentEconomyPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showPendingOrdersModal() {
    const data = computeEconomyForPeriod(currentEconomyPeriod);
    alert(`Cuentas por cobrar: ${data.porCobrarCount} pedidos pendientes de pago por un total de $${formatUSD(data.porCobrar)} USD.`);
  }

  function toggleAllMovementsModal() {
    exportEconomyCSV();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===========================================================================
  // INICIALIZACIÓN
  // ===========================================================================

  async function initEconomyModule() {
    await Promise.all([
      loadOrdersFromSupabase(),
      loadExpensesFromSupabase()
    ]);
    initEconomyRealtime();
    renderEconomyDashboard();
  }

  // Exponer a nivel global
  window.initEconomyModule = initEconomyModule;
  window.setEconomyPeriod = setEconomyPeriod;
  window.toggleCustomPeriodModal = toggleCustomPeriodModal;
  window.renderEconomyDashboard = renderEconomyDashboard;
  window.openExpenseForm = openExpenseForm;
  window.resetExpenseForm = resetExpenseForm;
  window.setExpensePaymentStatus = setExpensePaymentStatus;
  window.handleExpenseAmountChange = handleExpenseAmountChange;
  window.handleExpenseReceiptFile = handleExpenseReceiptFile;
  window.saveProducerExpense = saveProducerExpense;
  window.markExpenseAsPaid = markExpenseAsPaid;
  window.exportEconomyCSV = exportEconomyCSV;
  window.handleMovementsSearch = handleMovementsSearch;
  window.handleMovementsFilter = handleMovementsTypeFilter;
  window.handleMovementsTypeFilter = handleMovementsTypeFilter;
  window.toggleAllMovementsModal = toggleAllMovementsModal;
  window.showPendingOrdersModal = showPendingOrdersModal;

  // Carga automática al estar listo el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEconomyModule);
  } else {
    initEconomyModule();
  }

})(window, document);
