/* ============================================================
   Dulce Trigo · app.js
   Carrito, perfiles de usuario, checkout con varios métodos de
   pago, pedidos especiales y panel administrativo.
   Todo se guarda en localStorage (sitio de demostración).
   ============================================================ */
'use strict';

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE_KEY = 'dulcetrigo_v1';
const fmtCRC = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
const money = (n) => fmtCRC.format(Math.round(Number(n) || 0));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Catálogo ---------- */
const CATEGORIAS = [
  { id: 'todos', nombre: 'Todo el catálogo' },
  { id: 'panaderia', nombre: 'Panadería' },
  { id: 'reposteria', nombre: 'Repostería' },
  { id: 'queques', nombre: 'Queques únicos' },
  { id: 'especiales', nombre: 'Pedidos especiales' }
];

const PRODUCTS = [
  { id: 'pan-frances', nombre: 'Pan francés artesanal', cat: 'panaderia', det: 450, may: 320, unidad: 'unidad', emoji: '🥖', minMayor: 100, badge: 'Más vendido', desc: 'Corteza crujiente y miga suave, horneado cada madrugada.' },
  { id: 'baguette', nombre: 'Baguette rústica', cat: 'panaderia', det: 1500, may: 1100, unidad: 'unidad', emoji: '🥖', minMayor: 40, desc: 'Fermentación lenta de 18 horas y horno de piedra.' },
  { id: 'masa-madre', nombre: 'Pan de masa madre', cat: 'panaderia', det: 3200, may: 2400, unidad: 'hogaza 800 g', emoji: '🍞', minMayor: 20, desc: 'Solo harina, agua, sal y nuestra madre de 12 años.' },
  { id: 'pan-coco', nombre: 'Pan de coco', cat: 'panaderia', det: 600, may: 430, unidad: 'unidad', emoji: '🥯', minMayor: 60, desc: 'Relleno de coco caramelizado, receta de la casa.' },
  { id: 'croissant', nombre: 'Croissant de mantequilla', cat: 'panaderia', det: 1100, may: 820, unidad: 'unidad', emoji: '🥐', minMayor: 40, badge: 'Nuevo', desc: '27 capas de mantequilla europea, hojaldre perfecto.' },
  { id: 'pan-integral', nombre: 'Pan integral multigrano', cat: 'panaderia', det: 2800, may: 2100, unidad: 'molde 700 g', emoji: '🍞', minMayor: 20, desc: 'Avena, linaza, girasol y chía. Alto en fibra.' },
  { id: 'tres-leches', nombre: 'Porción de tres leches', cat: 'reposteria', det: 1800, may: 1350, unidad: 'porción', emoji: '🍰', minMayor: 24, desc: 'Bizcocho esponjoso bañado en tres leches y canela.' },
  { id: 'cheesecake', nombre: 'Cheesecake de maracuyá', cat: 'reposteria', det: 2200, may: 1650, unidad: 'porción', emoji: '🍮', minMayor: 24, desc: 'Base de galleta, crema suave y coulis de maracuyá.' },
  { id: 'brownie', nombre: 'Brownie de chocolate 70%', cat: 'reposteria', det: 1400, may: 1050, unidad: 'unidad', emoji: '🍫', minMayor: 30, desc: 'Centro húmedo, nueces tostadas y chocolate belga.' },
  { id: 'galletas', nombre: 'Galletas de avena y nuez', cat: 'reposteria', det: 3600, may: 2800, unidad: 'docena', emoji: '🍪', minMayor: 12, desc: 'Crujientes por fuera, tiernas por dentro. Sin conservantes.' },
  { id: 'queque-chocolate', nombre: 'Queque de chocolate belga', cat: 'queques', det: 18000, may: 14500, unidad: 'queque 10 porciones', emoji: '🎂', minMayor: 4, badge: 'Favorito', desc: 'Tres capas de chocolate 70% con ganache y frutos rojos.' },
  { id: 'queque-redvelvet', nombre: 'Queque red velvet', cat: 'queques', det: 19500, may: 15800, unidad: 'queque 12 porciones', emoji: '🎂', minMayor: 4, desc: 'Terciopelo rojo con frosting de queso crema.' },
  { id: 'queque-zanahoria', nombre: 'Queque de zanahoria y nuez', cat: 'queques', det: 17000, may: 13800, unidad: 'queque 10 porciones', emoji: '🥕', minMayor: 4, desc: 'Especias, zanahoria fresca y glaseado de queso crema.' },
  { id: 'queque-temporada', nombre: 'Queque de temporada', cat: 'queques', det: 21000, may: 17000, unidad: 'queque 12 porciones', emoji: '🍓', minMayor: 4, badge: 'Temporada', desc: 'Frutos rojos de la estación y crema chantilly.' },
  { id: 'mesa-dulce', nombre: 'Mesa dulce para eventos', cat: 'especiales', det: 45000, may: 38000, unidad: 'para 30 personas', emoji: '🍬', minMayor: 1, desc: 'Surtido de postres, queque central y montaje incluido.' },
  { id: 'box-corporativo', nombre: 'Box de postres corporativo', cat: 'especiales', det: 32000, may: 26500, unidad: 'caja 24 porciones', emoji: '🎁', minMayor: 2, desc: 'Caja surtida con etiqueta de tu empresa. Ideal para regalos.' }
];

const nombreCat = (cat) => (CATEGORIAS.find((c) => c.id === cat) || { nombre: cat }).nombre;

/* ---------- Perfiles ---------- */
const ROLES = {
  detal: {
    nombre: 'Cliente detal', precio: 'det', descuento: 0, minimo: 0, envioGratisDesde: 25000,
    beneficios: ['Compra desde 1 unidad', 'Entrega a domicilio en el GAM', 'Envío gratis desde ₡25.000', 'Acceso a pedidos especiales']
  },
  panaderia: {
    nombre: 'Panadería socia', precio: 'may', descuento: 0.05, minimo: 40000, envioGratisDesde: 0,
    beneficios: ['Precios de mayoreo', '5% de descuento adicional', 'Envío gratis', 'Facturación electrónica', 'Asesor de cuenta']
  },
  mayorista: {
    nombre: 'Distribuidor mayorista', precio: 'may', descuento: 0.10, minimo: 100000, envioGratisDesde: 0,
    beneficios: ['Mejor precio del catálogo', '10% de descuento adicional', 'Entregas en ruta programada', 'Crédito a 15 días', 'Soporte prioritario']
  },
  admin: {
    nombre: 'Administrador', precio: 'det', descuento: 0, minimo: 0, envioGratisDesde: 25000,
    beneficios: ['Acceso al panel administrativo', 'Gestión de pedidos y clientes']
  }
};

/* ---------- Zonas de entrega ---------- */
const ZONAS = [
  { id: 'retiro', nombre: 'Retiro en tienda', detalle: 'San José centro · listo en 2 h', costo: 0 },
  { id: 'gam', nombre: 'GAM (San José)', detalle: 'Entrega en 24 horas', costo: 2500 },
  { id: 'heredia', nombre: 'Heredia y Alajuela', detalle: 'Entrega en 24–48 horas', costo: 3500 },
  { id: 'cartago', nombre: 'Cartago', detalle: 'Entrega en 48 horas', costo: 4000 },
  { id: 'fuera', nombre: 'Fuera del GAM', detalle: 'Entrega en 48–72 horas', costo: 6500 }
];

/* ---------- Métodos de pago ---------- */
const PAGOS = [
  { id: 'sinpe', nombre: 'SINPE Móvil', icono: '📱', detalle: 'Transferencia inmediata al 8888-7777' },
  { id: 'tarjeta', nombre: 'Tarjeta de crédito o débito', icono: '💳', detalle: 'Visa, Mastercard y American Express' },
  { id: 'transferencia', nombre: 'Transferencia bancaria', icono: '🏦', detalle: 'BAC Credomatic · cuenta en colones' },
  { id: 'efectivo', nombre: 'Efectivo contra entrega', icono: '💵', detalle: 'Solo GAM y retiro en tienda' }
];

/* ---------- Estado y almacenamiento ---------- */
function datosIniciales() {
  return {
    usuarios: [
      { id: 'u1', nombre: 'Ana Cliente', email: 'cliente@demo.com', pass: '1234', rol: 'detal', tel: '8888-1111', negocio: '', estado: 'activo' },
      { id: 'u2', nombre: 'Panadería La Espiga', email: 'panaderia@demo.com', pass: '1234', rol: 'panaderia', tel: '8888-2222', negocio: 'La Espiga S.A.', estado: 'activo' },
      { id: 'u3', nombre: 'Distribuidora del Valle', email: 'mayorista@demo.com', pass: '1234', rol: 'mayorista', tel: '8888-3333', negocio: 'Del Valle S.A.', estado: 'activo' },
      { id: 'u4', nombre: 'Admin Dulce Trigo', email: 'admin@demo.com', pass: '1234', rol: 'admin', tel: '8888-0000', negocio: '', estado: 'activo' }
    ],
    sesion: null,
    carrito: [],
    pedidos: [],
    solicitudes: [],
    zona: 'gam'
  };
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return datosIniciales();
    return Object.assign(datosIniciales(), JSON.parse(raw));
  } catch (err) {
    return datosIniciales();
  }
}

function guardar() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (err) { /* modo privado */ }
}

let db = cargar();
let filtroActual = 'todos';
let busqueda = '';

/* ---------- Sesión y precios ---------- */
function usuarioActual() {
  return db.usuarios.find((u) => u.id === db.sesion) || null;
}

function rolDe(user) {
  if (!user) return 'detal';
  if (user.rol === 'panaderia' || user.rol === 'mayorista') {
    return user.estado === 'activo' ? user.rol : 'detal';
  }
  return user.rol;
}

function precioUnitario(p, user = usuarioActual()) {
  return ROLES[rolDe(user)].precio === 'may' ? p.may : p.det;
}

/* ---------- Cálculo de totales ---------- */
function calcularTotales() {
  const user = usuarioActual();
  const rol = rolDe(user);
  const cfg = ROLES[rol];
  let subtotal = 0;
  let ahorro = 0;

  db.carrito.forEach((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (!p) return;
    const unit = precioUnitario(p, user);
    subtotal += unit * item.qty;
    ahorro += (p.det - unit) * item.qty;
  });

  const descuento = Math.round(subtotal * cfg.descuento);
  const base = subtotal - descuento;
  const zona = ZONAS.find((z) => z.id === db.zona) || ZONAS[1];
  let envio = zona.costo;
  if (zona.id === 'retiro') envio = 0;
  else if (cfg.envioGratisDesde === 0 && base > 0) envio = 0;
  else if (base >= cfg.envioGratisDesde) envio = 0;

  return { subtotal, descuento, envio, total: base + envio, base, ahorro, zona, cfg, rol };
}

function avisoMinimo(t) {
  if (!t.cfg.minimo || t.base >= t.cfg.minimo) return '';
  return `<p class="mini" style="color:var(--rojo);margin:0">Pedido mínimo para ${t.cfg.nombre}: ${money(t.cfg.minimo)}. Te faltan ${money(t.cfg.minimo - t.base)}.</p>`;
}

/* ---------- Catálogo ---------- */
function renderCatalogo() {
  const cont = $('#gridProductos');
  if (!cont) return;
  const user = usuarioActual();
  const rol = rolDe(user);
  const esMay = ROLES[rol].precio === 'may';
  const q = busqueda.trim().toLowerCase();

  const lista = PRODUCTS.filter((p) => {
    const okCat = filtroActual === 'todos' || p.cat === filtroActual;
    const okQ = !q || p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return okCat && okQ;
  });

  if (!lista.length) {
    cont.innerHTML = '<div class="empty"><span>🔍</span>No encontramos productos con esa búsqueda.</div>';
    renderPerfilNota();
    return;
  }

  cont.innerHTML = lista.map((p) => {
    const unit = precioUnitario(p, user);
    return `<article class="card">
      <div class="card__media cat-${p.cat}">${p.emoji}${p.badge ? `<span class="card__badge">${p.badge}</span>` : ''}</div>
      <div class="card__body">
        <span class="card__cat">${nombreCat(p.cat)}</span>
        <h3>${p.nombre}</h3>
        <p>${p.desc}</p>
        <div class="card__price">
          <strong>${money(unit)}</strong>
          <span class="unidad">/ ${p.unidad}</span>
          ${esMay ? `<span class="tag">Ahorras ${money(p.det - unit)}</span>` : ''}
        </div>
        ${esMay ? `<span class="card__min">Mínimo mayorista: ${p.minMayor}</span>` : ''}
        <div class="card__actions">
          <div class="qty">
            <button type="button" data-action="menos" data-id="${p.id}" aria-label="Restar">−</button>
            <input type="number" min="1" value="1" id="qty-${p.id}" aria-label="Cantidad de ${p.nombre}" />
            <button type="button" data-action="mas" data-id="${p.id}" aria-label="Sumar">+</button>
          </div>
          <button class="btn btn--primary btn--sm" data-action="add" data-id="${p.id}">Agregar</button>
        </div>
      </div>
    </article>`;
  }).join('');

  renderPerfilNota();
}

function renderPerfilNota() {
  const el = $('#perfilNota');
  if (!el) return;
  const user = usuarioActual();
  const rol = rolDe(user);
  const cfg = ROLES[rol];

  if (!user) {
    el.innerHTML = 'Estás viendo <strong>precios detal</strong>. <a href="#" data-action="abrir-registro" style="color:var(--caramelo-dark);font-weight:700;text-decoration:underline">Crea tu cuenta</a> de panadería o distribuidor para acceder a precios de mayoreo.';
  } else if (user.estado === 'pendiente') {
    el.innerHTML = `Tu cuenta <strong>${esc(user.nombre)}</strong> está <strong>pendiente de aprobación</strong>. Mientras tanto ves precios detal.`;
  } else {
    el.innerHTML = `Sesión iniciada como <strong>${esc(user.nombre)}</strong> · perfil <strong>${cfg.nombre}</strong>${cfg.descuento ? ` · descuento adicional ${Math.round(cfg.descuento * 100)}%` : ''}.`;
  }
}

/* ---------- Carrito ---------- */
function agregar(id, qty) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const cant = Math.max(1, parseInt(qty, 10) || 1);
  const item = db.carrito.find((i) => i.id === id);
  if (item) item.qty += cant;
  else db.carrito.push({ id, qty: cant });
  guardar();
  renderCarrito();
  toast(`${p.nombre} agregado al carrito`, 'ok');
}

function cambiarCantidad(id, delta) {
  const item = db.carrito.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) db.carrito = db.carrito.filter((i) => i.id !== id);
  guardar();
  renderCarrito();
}

function quitar(id) {
  db.carrito = db.carrito.filter((i) => i.id !== id);
  guardar();
  renderCarrito();
  toast('Producto eliminado', 'ok');
}

function renderCarrito() {
  const cont = $('#cartItems');
  const foot = $('#cartFoot');
  if (!cont || !foot) return;

  const count = db.carrito.reduce((a, i) => a + i.qty, 0);
  $('#cartCount').textContent = count;

  if (!db.carrito.length) {
    cont.innerHTML = '<div class="empty"><span>🧺</span>Tu carrito está vacío.<br><small>Agrega productos del catálogo para empezar.</small></div>';
    foot.innerHTML = '<button class="btn btn--ghost btn--block" data-action="cerrar-carrito">Seguir comprando</button>';
    return;
  }

  cont.innerHTML = db.carrito.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (!p) return '';
    const unit = precioUnitario(p);
    return `<div class="cart-item">
      <div class="cart-item__thumb">${p.emoji}</div>
      <div class="cart-item__info">
        <strong>${p.nombre}</strong>
        <span class="muted">${money(unit)} · ${p.unidad}</span>
        <div class="qty">
          <button data-action="dec" data-id="${p.id}" aria-label="Restar">−</button>
          <span>${item.qty}</span>
          <button data-action="inc" data-id="${p.id}" aria-label="Sumar">+</button>
        </div>
      </div>
      <div class="cart-item__right">
        <strong>${money(unit * item.qty)}</strong>
        <button class="link-danger" data-action="remove" data-id="${p.id}">Quitar</button>
      </div>
    </div>`;
  }).join('');

  const t = calcularTotales();
  foot.innerHTML = `
    <label class="mini" style="display:grid;gap:.25rem;font-weight:600;color:var(--choco-soft)">Zona de entrega
      <select id="zonaCarrito">${ZONAS.map((z) => `<option value="${z.id}" ${z.id === db.zona ? 'selected' : ''}>${z.nombre} — ${z.costo ? money(z.costo) : 'gratis'}</option>`).join('')}</select>
    </label>
    <div class="resumen__row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.descuento ? `<div class="resumen__row resumen__row--ok"><span>Descuento ${Math.round(t.cfg.descuento * 100)}%</span><span>−${money(t.descuento)}</span></div>` : ''}
    <div class="resumen__row"><span>Envío</span><span>${t.envio ? money(t.envio) : 'Gratis'}</span></div>
    <div class="resumen__row resumen__row--total"><span>Total</span><span>${money(t.total)}</span></div>
    ${avisoMinimo(t)}
    <button class="btn btn--primary btn--block" data-action="abrir-checkout">Ir a pagar</button>
    <button class="btn btn--ghost btn--block" data-action="cerrar-carrito">Seguir comprando</button>`;
}

/* ---------- Drawer y modales ---------- */
function abrirDrawer() {
  $('#drawerCarrito').classList.add('is-open');
  $('#drawerCarrito').setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function cerrarDrawer() {
  $('#drawerCarrito').classList.remove('is-open');
  $('#drawerCarrito').setAttribute('aria-hidden', 'true');
  if (!$$('.modal.is-open').length) {
    $('#overlay').classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

function abrirModal(sel) {
  const m = $(sel);
  if (!m) return;
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function cerrarModal(sel) {
  const m = $(sel);
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  if (!$$('.modal.is-open').length && !$('#drawerCarrito').classList.contains('is-open')) {
    $('#overlay').classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

function cerrarTodo() {
  $$('.modal.is-open').forEach((m) => {
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  });
  cerrarDrawer();
  $('#overlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg, tipo) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast is-show' + (tipo ? ' is-' + tipo : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

/* ---------- Checkout ---------- */
function abrirCheckout() {
  if (!db.carrito.length) { toast('Tu carrito está vacío', 'error'); return; }
  const t = calcularTotales();
  if (t.cfg.minimo && t.base < t.cfg.minimo) {
    toast(`El pedido mínimo para ${t.cfg.nombre} es ${money(t.cfg.minimo)}`, 'error');
    return;
  }
  renderCheckout();
  cerrarDrawer();
  abrirModal('#modalCheckout');
}

function fechaSugerida() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function resumenFilas(t) {
  return `
    <div class="resumen__row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.descuento ? `<div class="resumen__row resumen__row--ok"><span>Descuento ${Math.round(t.cfg.descuento * 100)}%</span><span>−${money(t.descuento)}</span></div>` : ''}
    <div class="resumen__row"><span>Envío (${t.zona.nombre})</span><span>${t.envio ? money(t.envio) : 'Gratis'}</span></div>
    <div class="resumen__row resumen__row--total"><span>Total</span><span>${money(t.total)}</span></div>`;
}

function renderCheckout() {
  const user = usuarioActual();
  const t = calcularTotales();
  const items = db.carrito.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    const unit = precioUnitario(p);
    return `<li><span>${item.qty} × ${p.nombre}</span><span>${money(unit * item.qty)}</span></li>`;
  }).join('');

  $('#checkoutBody').innerHTML = `
    <h2>Finalizar pedido</h2>
    <p class="muted mini">Revisa tus datos, elige cómo recibir y pagar. Te confirmamos por WhatsApp.</p>
    <form id="formCheckout" class="checkout" novalidate>
      <div class="checkout__main">
        <fieldset>
          <legend>1. Datos de entrega</legend>
          <div class="grid-2">
            <label>Nombre completo<input name="nombre" required value="${user ? esc(user.nombre) : ''}" placeholder="Tu nombre" /></label>
            <label>Teléfono / WhatsApp<input name="telefono" required value="${user ? esc(user.tel || '') : ''}" placeholder="8888-8888" /></label>
            <label>Correo electrónico<input type="email" name="email" required value="${user ? esc(user.email) : ''}" placeholder="tu@correo.com" /></label>
            <label>Fecha deseada de entrega<input type="date" name="fecha" value="${fechaSugerida()}" /></label>
          </div>
          <label>Dirección exacta<input name="direccion" required placeholder="Provincia, cantón, distrito y señas" /></label>
          <label>Zona de entrega
            <select name="zona" id="zonaCheckout">
              ${ZONAS.map((z) => `<option value="${z.id}" ${z.id === db.zona ? 'selected' : ''}>${z.nombre} — ${z.costo ? money(z.costo) : 'gratis'}</option>`).join('')}
            </select>
          </label>
          <label>Notas para el pedido<textarea name="notas" rows="2" placeholder="Ej.: entregar antes de las 10 a.m., portón negro"></textarea></label>
        </fieldset>

        <fieldset>
          <legend>2. Método de pago</legend>
          <div class="pagos">
            ${PAGOS.map((p, i) => `<label class="pago ${i === 0 ? 'is-active' : ''}">
              <input type="radio" name="pago" value="${p.id}" ${i === 0 ? 'checked' : ''} />
              <span class="pago__icon">${p.icono}</span>
              <span><strong>${p.nombre}</strong><small>${p.detalle}</small></span>
            </label>`).join('')}
          </div>
          <div id="camposPago"></div>
        </fieldset>
      </div>

      <aside class="checkout__side">
        <h3>Resumen del pedido</h3>
        <ul class="resumen">${items}</ul>
        <div id="checkoutResumen">${resumenFilas(t)}</div>
        ${avisoMinimo(t)}
        <button class="btn btn--primary btn--block" type="submit" style="margin-top:.8rem">Confirmar pedido</button>
        <p class="mini muted" style="margin-top:.6rem">Sitio de demostración: no se procesan pagos reales ni se envían datos a ningún servidor.</p>
      </aside>
    </form>`;

  renderCamposPago('sinpe');
}

function renderCamposPago(id) {
  const cont = $('#camposPago');
  if (!cont) return;
  if (id === 'tarjeta') {
    cont.innerHTML = `
      <div class="grid-2" style="margin-top:.6rem">
        <label>Número de tarjeta<input name="tarjetaNumero" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" /></label>
        <label>Nombre en la tarjeta<input name="tarjetaNombre" placeholder="Como aparece en la tarjeta" /></label>
        <label>Vencimiento (MM/AA)<input name="tarjetaVenc" maxlength="5" placeholder="12/28" /></label>
        <label>CVV<input name="tarjetaCvv" inputmode="numeric" maxlength="4" placeholder="123" /></label>
      </div>
      <p class="mini muted" style="margin:.5rem 0 0">Pago simulado. No ingreses datos reales de tarjeta.</p>`;
  } else if (id === 'sinpe') {
    cont.innerHTML = '<p class="mini muted" style="margin:.6rem 0 0">Envía el monto por SINPE Móvil al <strong>8888-7777</strong> y comparte el comprobante por WhatsApp con tu número de pedido.</p>';
  } else if (id === 'transferencia') {
    cont.innerHTML = '<p class="mini muted" style="margin:.6rem 0 0">BAC Credomatic · cuenta en colones <strong>CR00 0000 0000 0000 0000 00</strong> a nombre de Dulce Trigo S.A. Envía el comprobante por WhatsApp.</p>';
  } else {
    cont.innerHTML = '<p class="mini muted" style="margin:.6rem 0 0">Paga en efectivo al recibir. Disponible solo para entregas en el GAM y retiro en tienda.</p>';
  }
}

function actualizarResumenCheckout() {
  const box = $('#checkoutResumen');
  if (!box) return;
  box.innerHTML = resumenFilas(calcularTotales());
}

function confirmarPedido(form) {
  const fd = new FormData(form);
  const nombre = String(fd.get('nombre') || '').trim();
  const telefono = String(fd.get('telefono') || '').trim();
  const email = String(fd.get('email') || '').trim();
  const direccion = String(fd.get('direccion') || '').trim();
  const pago = String(fd.get('pago') || '');

  if (!nombre || !telefono || !email || !direccion) { toast('Completa los datos de entrega', 'error'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { toast('Revisa el correo electrónico', 'error'); return; }

  if (pago === 'tarjeta') {
    const num = String(fd.get('tarjetaNumero') || '').replace(/\s/g, '');
    const venc = String(fd.get('tarjetaVenc') || '').trim();
    const cvv = String(fd.get('tarjetaCvv') || '').trim();
    if (!/^\d{16}$/.test(num)) { toast('El número de tarjeta debe tener 16 dígitos', 'error'); return; }
    if (!/^\d{2}\/\d{2}$/.test(venc)) { toast('Usa el formato MM/AA en el vencimiento', 'error'); return; }
    if (!/^\d{3,4}$/.test(cvv)) { toast('El CVV no es válido', 'error'); return; }
  }

  const t = calcularTotales();
  if (t.cfg.minimo && t.base < t.cfg.minimo) {
    toast(`El pedido mínimo para ${t.cfg.nombre} es ${money(t.cfg.minimo)}`, 'error');
    return;
  }

  const user = usuarioActual();
  const pedido = {
    id: 'DT-' + String(Date.now()).slice(-6),
    fecha: new Date().toISOString(),
    cliente: nombre,
    telefono,
    email,
    direccion,
    zona: t.zona.id,
    zonaNombre: t.zona.nombre,
    fechaEntrega: String(fd.get('fecha') || ''),
    notas: String(fd.get('notas') || ''),
    pago,
    pagoNombre: (PAGOS.find((p) => p.id === pago) || {}).nombre || pago,
    items: db.carrito.map((i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      const unit = precioUnitario(p);
      return { id: i.id, nombre: p.nombre, qty: i.qty, unit, subtotal: unit * i.qty };
    }),
    totales: { subtotal: t.subtotal, descuento: t.descuento, envio: t.envio, total: t.total },
    usuario: user ? user.email : 'invitado',
    estado: 'Pendiente'
  };

  db.pedidos.unshift(pedido);
  db.carrito = [];
  guardar();
  renderCarrito();
  renderCatalogo();
  mostrarConfirmacion(pedido);
}

function instruccionesPago(pago) {
  switch (pago) {
    case 'sinpe': return 'Envía el pago por SINPE Móvil al <strong>8888-7777</strong> y comparte el comprobante por WhatsApp indicando tu número de pedido.';
    case 'tarjeta': return 'El cobro con tarjeta se procesa en la pasarela segura al confirmar. En este sitio de demostración no se realiza ningún cargo real.';
    case 'transferencia': return 'Transfiere a BAC Credomatic, cuenta en colones <strong>CR00 0000 0000 0000 0000 00</strong>, a nombre de Dulce Trigo S.A. y envíanos el comprobante.';
    case 'efectivo': return 'Paga en efectivo al recibir tu pedido. Si es posible, ten el monto exacto.';
    default: return '';
  }
}

function mostrarConfirmacion(pedido) {
  $('#checkoutBody').innerHTML = `
    <div class="confirmacion">
      <div class="confirmacion__icon">🎉</div>
      <h2>¡Pedido recibido!</h2>
      <p class="muted">Gracias ${esc(pedido.cliente)}. Te contactaremos al ${esc(pedido.telefono)} para coordinar la entrega.</p>
      <p class="confirmacion__num">${pedido.id}</p>
      <div class="confirmacion__box">
        <p><strong>Entrega:</strong> ${esc(pedido.zonaNombre)} · ${esc(pedido.direccion)}</p>
        <p><strong>Fecha deseada:</strong> ${esc(pedido.fechaEntrega || 'por coordinar')}</p>
        <p><strong>Método de pago:</strong> ${esc(pedido.pagoNombre)}</p>
        <p><strong>Total:</strong> ${money(pedido.totales.total)}</p>
        <p style="margin-bottom:0"><strong>Instrucciones:</strong> ${instruccionesPago(pedido.pago)}</p>
      </div>
      <button class="btn btn--primary" data-action="cerrar-checkout">Seguir comprando</button>
    </div>`;
}

/* ---------- Cuenta ---------- */
function renderCuenta() {
  const cont = $('#cuentaBody');
  if (!cont) return;
  const user = usuarioActual();
  cont.innerHTML = user ? panelUsuario(user) : formulariosCuenta();
}

function formulariosCuenta() {
  return `
    <h2>Mi cuenta</h2>
    <p class="muted mini">Ingresa o crea tu cuenta para acceder a precios de mayoreo y ver tus pedidos.</p>
    <div class="tabs">
      <button class="tab is-active" data-action="tab-cuenta" data-tab="login">Ingresar</button>
      <button class="tab" data-action="tab-cuenta" data-tab="registro">Crear cuenta</button>
    </div>

    <div id="tabLogin" class="tab-panel">
      <form id="formLogin" class="form">
        <label>Correo electrónico<input type="email" name="email" required placeholder="tu@correo.com" /></label>
        <label>Contraseña<input type="password" name="pass" required placeholder="••••" /></label>
        <button class="btn btn--primary btn--block" type="submit">Ingresar</button>
      </form>
      <div class="demo">
        <p class="mini"><strong>Cuentas de demostración</strong> (contraseña 1234):</p>
        <div class="demo__grid">
          <button class="chip" data-action="demo" data-email="cliente@demo.com">Cliente detal</button>
          <button class="chip" data-action="demo" data-email="panaderia@demo.com">Panadería</button>
          <button class="chip" data-action="demo" data-email="mayorista@demo.com">Distribuidor</button>
          <button class="chip" data-action="demo" data-email="admin@demo.com">Admin</button>
        </div>
      </div>
    </div>

    <div id="tabRegistro" class="tab-panel is-hidden">
      <form id="formRegistro" class="form">
        <label>Nombre o razón social<input name="nombre" required placeholder="Panadería La Espiga" /></label>
        <div class="grid-2">
          <label>Correo electrónico<input type="email" name="email" required placeholder="tu@correo.com" /></label>
          <label>Teléfono<input name="tel" required placeholder="8888-8888" /></label>
        </div>
        <label>Tipo de cuenta
          <select name="rol">
            <option value="detal">Cliente final (detal)</option>
            <option value="panaderia">Panadería (mayoreo)</option>
            <option value="mayorista">Distribuidor (mayoreo)</option>
          </select>
        </label>
        <label>Contraseña<input type="password" name="pass" required minlength="4" placeholder="Mínimo 4 caracteres" /></label>
        <p class="mini muted">Las cuentas de panadería y distribución quedan pendientes de aprobación; mientras tanto verás precios detal.</p>
        <button class="btn btn--primary btn--block" type="submit">Crear cuenta</button>
      </form>
    </div>`;
}

function panelUsuario(user) {
  const rol = rolDe(user);
  const cfg = ROLES[rol];
  const pedidos = db.pedidos.filter((p) => p.usuario === user.email);
  const pendiente = user.estado === 'pendiente';

  return `
    <div class="panel-cuenta">
      <div class="panel-cuenta__head">
        <div>
          <h2 style="margin-bottom:.2rem">Hola, ${esc(user.nombre)}</h2>
          <span class="badge-rol rol-${rol}">${cfg.nombre}</span>
          ${pendiente ? '<span class="badge-rol badge-pendiente">Pendiente de aprobación</span>' : ''}
        </div>
        <button class="btn btn--ghost btn--sm" data-action="logout">Cerrar sesión</button>
      </div>

      <p class="mini muted" style="margin-top:.6rem">${esc(user.email)} · ${esc(user.tel || 'sin teléfono')}</p>
      ${pendiente ? '<p class="mini" style="color:var(--caramelo-dark)">Tu solicitud de cuenta mayorista está en revisión. Te avisaremos por correo cuando sea aprobada.</p>' : ''}

      <h4 style="margin-top:1rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)">Beneficios de tu perfil</h4>
      <ul class="panel-cuenta__beneficios">${cfg.beneficios.map((b) => `<li>${b}</li>`).join('')}</ul>

      <h4 style="margin-top:1rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)">Mis pedidos (${pedidos.length})</h4>
      ${pedidos.length ? `<div class="panel-cuenta__pedidos">${pedidos.map((p) => `
        <div class="cart-item" style="grid-template-columns:1fr auto">
          <div class="cart-item__info">
            <strong>${p.id} · ${money(p.totales.total)}</strong>
            <span class="muted">${new Date(p.fecha).toLocaleDateString('es-CR')} · ${esc(p.zonaNombre)} · ${esc(p.pagoNombre)}</span>
          </div>
          <span class="tag">${esc(p.estado)}</span>
        </div>`).join('')}</div>`
      : '<p class="mini muted">Todavía no tienes pedidos registrados en este navegador.</p>'}

      ${user.rol === 'admin' ? '<button class="btn btn--primary btn--block" data-action="abrir-admin" style="margin-top:1rem">Abrir panel administrativo</button>' : ''}
    </div>`;
}

function cambiarTab(tab) {
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tab));
  const login = $('#tabLogin');
  const registro = $('#tabRegistro');
  if (!login || !registro) return;
  login.classList.toggle('is-hidden', tab !== 'login');
  registro.classList.toggle('is-hidden', tab !== 'registro');
}

function login(email, pass) {
  const u = db.usuarios.find((x) => x.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!u || u.pass !== pass) { toast('Correo o contraseña incorrectos', 'error'); return false; }
  db.sesion = u.id;
  guardar();
  actualizarSesionUI();
  renderCatalogo();
  renderCarrito();
  renderCuenta();
  toast(`Bienvenido, ${u.nombre}`, 'ok');
  return true;
}

function registrar(form) {
  const fd = new FormData(form);
  const nombre = String(fd.get('nombre') || '').trim();
  const email = String(fd.get('email') || '').trim();
  const tel = String(fd.get('tel') || '').trim();
  const rol = String(fd.get('rol') || 'detal');
  const pass = String(fd.get('pass') || '');

  if (!nombre || !email || !tel || pass.length < 4) { toast('Completa todos los campos (contraseña de 4+ caracteres)', 'error'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { toast('Revisa el correo electrónico', 'error'); return; }
  if (db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) { toast('Ese correo ya tiene una cuenta', 'error'); return; }

  const nuevo = {
    id: 'u' + Date.now(),
    nombre, email, tel, rol, pass,
    negocio: rol === 'detal' ? '' : nombre,
    estado: rol === 'detal' ? 'activo' : 'pendiente'
  };
  db.usuarios.push(nuevo);
  db.sesion = nuevo.id;
  guardar();
  actualizarSesionUI();
  renderCatalogo();
  renderCarrito();
  renderCuenta();
  toast(rol === 'detal' ? 'Cuenta creada. ¡Bienvenido!' : 'Solicitud enviada. Te avisaremos cuando sea aprobada.', 'ok');
}

function logout() {
  db.sesion = null;
  guardar();
  actualizarSesionUI();
  renderCatalogo();
  renderCarrito();
  renderCuenta();
  toast('Sesión cerrada', 'ok');
}

function actualizarSesionUI() {
  const user = usuarioActual();
  const btn = $('#btnCuenta');
  if (btn) btn.textContent = user ? user.nombre.split(' ')[0] : 'Mi cuenta';
}

/* ---------- Pedidos especiales ---------- */
function enviarSolicitud(form) {
  const fd = new FormData(form);
  const datos = {
    id: 'SOL-' + String(Date.now()).slice(-5),
    fecha: new Date().toISOString(),
    nombre: String(fd.get('nombre') || '').trim(),
    telefono: String(fd.get('telefono') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    tipo: String(fd.get('tipo') || ''),
    porciones: String(fd.get('porciones') || ''),
    fechaEvento: String(fd.get('fecha') || ''),
    sabores: String(fd.get('sabores') || ''),
    detalle: String(fd.get('detalle') || '').trim(),
    presupuesto: String(fd.get('presupuesto') || ''),
    estado: 'Nueva'
  };

  if (!datos.nombre || !datos.telefono || !datos.email || !datos.fechaEvento || !datos.detalle) {
    toast('Completa nombre, contacto, fecha y descripción', 'error');
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(datos.email)) { toast('Revisa el correo electrónico', 'error'); return; }

  db.solicitudes.unshift(datos);
  guardar();
  form.reset();
  renderAdmin();
  toast(`Solicitud ${datos.id} enviada. Te contactamos en menos de 24 h.`, 'ok');
}

/* ---------- Panel administrativo ---------- */
const ESTADOS = ['Pendiente', 'En preparación', 'En ruta', 'Entregado', 'Cancelado'];

function renderAdmin() {
  const cont = $('#adminBody');
  if (!cont) return;
  const user = usuarioActual();

  if (!user || user.rol !== 'admin') {
    cont.innerHTML = `
      <h2>Panel administrativo</h2>
      <p class="muted">Esta sección es solo para administradores. Ingresa con la cuenta <strong>admin@demo.com</strong> y la contraseña <strong>1234</strong>.</p>
      <button class="btn btn--primary" data-action="abrir-cuenta">Ingresar como administrador</button>`;
    return;
  }

  const ventas = db.pedidos.reduce((a, p) => a + p.totales.total, 0);
  const pendientes = db.pedidos.filter((p) => p.estado === 'Pendiente').length;
  const nuevas = db.solicitudes.filter((s) => s.estado === 'Nueva').length;

  cont.innerHTML = `
    <div class="admin">
      <h2>Panel administrativo</h2>
      <p class="mini muted">Los datos se guardan en este navegador (localStorage).</p>

      <div class="admin__kpis">
        <div class="kpi"><strong>${db.pedidos.length}</strong><span>Pedidos</span></div>
        <div class="kpi"><strong>${money(ventas)}</strong><span>Ventas registradas</span></div>
        <div class="kpi"><strong>${pendientes}</strong><span>Pedidos pendientes</span></div>
        <div class="kpi"><strong>${nuevas}</strong><span>Solicitudes nuevas</span></div>
      </div>

      <h4>Pedidos</h4>
      ${tablaPedidos()}

      <h4>Solicitudes especiales</h4>
      ${tablaSolicitudes()}

      <h4>Clientes y perfiles</h4>
      ${tablaUsuarios()}
    </div>`;
}

function tablaPedidos() {
  if (!db.pedidos.length) return '<p class="mini muted">Aún no hay pedidos registrados.</p>';
  return `<div class="tabla-wrap"><table>
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead>
    <tbody>${db.pedidos.map((p) => `
      <tr>
        <td><strong>${p.id}</strong><br><span class="mini muted">${new Date(p.fecha).toLocaleDateString('es-CR')}</span></td>
        <td>${esc(p.cliente)}<br><span class="mini muted">${esc(p.telefono)}</span></td>
        <td>${esc(p.zonaNombre)}<br><span class="mini muted">${esc(p.fechaEntrega || 'por coordinar')}</span></td>
        <td>${esc(p.pagoNombre)}</td>
        <td>${money(p.totales.total)}</td>
        <td>
          <select data-action="estado" data-id="${p.id}">
            ${ESTADOS.map((e) => `<option ${e === p.estado ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

function tablaSolicitudes() {
  if (!db.solicitudes.length) return '<p class="mini muted">Aún no hay solicitudes de pedidos especiales.</p>';
  return `<div class="tabla-wrap"><table>
    <thead><tr><th>Solicitud</th><th>Cliente</th><th>Evento</th><th>Detalle</th><th>Estado</th></tr></thead>
    <tbody>${db.solicitudes.map((s) => `
      <tr>
        <td><strong>${s.id}</strong><br><span class="mini muted">${s.tipo}</span></td>
        <td>${esc(s.nombre)}<br><span class="mini muted">${esc(s.telefono)}</span></td>
        <td>${esc(s.fechaEvento)}<br><span class="mini muted">${esc(s.porciones)} porciones</span></td>
        <td class="mini">${esc(s.detalle)}<br><span class="muted">${esc(s.presupuesto)}</span></td>
        <td>
          ${s.estado === 'Nueva'
            ? `<button class="btn btn--primary btn--sm" data-action="atender" data-id="${s.id}">Marcar atendida</button>`
            : '<span class="tag">Atendida</span>'}
        </td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

function tablaUsuarios() {
  return `<div class="tabla-wrap"><table>
    <thead><tr><th>Cliente</th><th>Correo</th><th>Perfil</th><th>Estado</th><th>Acción</th></tr></thead>
    <tbody>${db.usuarios.map((u) => `
      <tr>
        <td>${esc(u.nombre)}<br><span class="mini muted">${esc(u.tel || '')}</span></td>
        <td class="mini">${esc(u.email)}</td>
        <td><span class="badge-rol rol-${u.rol}">${ROLES[u.rol].nombre}</span></td>
        <td>${u.estado === 'activo' ? '<span class="tag">Activo</span>' : '<span class="badge-rol badge-pendiente">Pendiente</span>'}</td>
        <td>${u.estado === 'pendiente' ? `<button class="btn btn--primary btn--sm" data-action="aprobar" data-id="${u.id}">Aprobar</button>` : '<span class="mini muted">—</span>'}</td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

function cambiarEstado(id, estado) {
  const p = db.pedidos.find((x) => x.id === id);
  if (!p) return;
  p.estado = estado;
  guardar();
  toast(`Pedido ${id}: ${estado}`, 'ok');
}

function aprobarUsuario(id) {
  const u = db.usuarios.find((x) => x.id === id);
  if (!u) return;
  u.estado = 'activo';
  guardar();
  renderAdmin();
  renderCatalogo();
  if (db.sesion === id) renderCuenta();
  toast(`Cuenta de ${u.nombre} aprobada`, 'ok');
}

function atenderSolicitud(id) {
  const s = db.solicitudes.find((x) => x.id === id);
  if (!s) return;
  s.estado = 'Atendida';
  guardar();
  renderAdmin();
  toast(`Solicitud ${id} marcada como atendida`, 'ok');
}

/* ---------- Zonas de entrega (sección) ---------- */
function renderZonas() {
  const cont = $('#listaZonas');
  if (!cont) return;
  cont.innerHTML = ZONAS.map((z) => `
    <div class="zona">
      <h4>${z.nombre}</h4>
      <p>${z.detalle}</p>
      <span class="zona__costo">${z.costo ? money(z.costo) : 'Gratis'} <small>${z.costo ? 'por envío' : 'sin costo'}</small></span>
    </div>`).join('');
}

/* ---------- Eventos ---------- */
function bindEventos() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case 'abrir-carrito': e.preventDefault(); abrirDrawer(); break;
      case 'cerrar-carrito': cerrarDrawer(); break;
      case 'abrir-cuenta': e.preventDefault(); renderCuenta(); abrirModal('#modalCuenta'); break;
      case 'cerrar-cuenta': cerrarModal('#modalCuenta'); break;
      case 'abrir-checkout': abrirCheckout(); break;
      case 'cerrar-checkout': cerrarModal('#modalCheckout'); renderCarrito(); break;
      case 'abrir-admin': e.preventDefault(); renderAdmin(); abrirModal('#modalAdmin'); break;
      case 'cerrar-admin': cerrarModal('#modalAdmin'); break;
      case 'cerrar-todo': cerrarTodo(); break;
      case 'add': {
        const input = $('#qty-' + el.dataset.id);
        agregar(el.dataset.id, input ? input.value : 1);
        if (input) input.value = 1;
        break;
      }
      case 'menos': {
        const input = $('#qty-' + el.dataset.id);
        if (input) input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        break;
      }
      case 'mas': {
        const input = $('#qty-' + el.dataset.id);
        if (input) input.value = (parseInt(input.value, 10) || 1) + 1;
        break;
      }
      case 'inc': cambiarCantidad(el.dataset.id, 1); break;
      case 'dec': cambiarCantidad(el.dataset.id, -1); break;
      case 'remove': quitar(el.dataset.id); break;
      case 'filtro': {
        filtroActual = el.dataset.cat;
        $$('#filtros .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.cat === filtroActual));
        renderCatalogo();
        break;
      }
      case 'tab-cuenta': cambiarTab(el.dataset.tab); break;
      case 'demo': {
        const email = el.dataset.email;
        if (login(email, '1234')) cambiarTab('login');
        break;
      }
      case 'logout': logout(); break;
      case 'abrir-registro': e.preventDefault(); renderCuenta(); abrirModal('#modalCuenta'); cambiarTab('registro'); break;
      case 'aprobar': aprobarUsuario(el.dataset.id); break;
      case 'atender': atenderSolicitud(el.dataset.id); break;
      default: break;
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;

    if (t.id === 'zonaCarrito') {
      db.zona = t.value;
      guardar();
      renderCarrito();
    }

    if (t.id === 'zonaCheckout') {
      db.zona = t.value;
      guardar();
      actualizarResumenCheckout();
      renderCarrito();
    }

    if (t.name === 'pago') {
      $$('.pago').forEach((p) => p.classList.toggle('is-active', p.contains(t)));
      renderCamposPago(t.value);
    }

    if (t.dataset && t.dataset.action === 'estado') {
      cambiarEstado(t.dataset.id, t.value);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'formCheckout') { e.preventDefault(); confirmarPedido(e.target); }
    if (e.target.id === 'formLogin') {
      e.preventDefault();
      const fd = new FormData(e.target);
      login(fd.get('email'), fd.get('pass'));
    }
    if (e.target.id === 'formRegistro') { e.preventDefault(); registrar(e.target); }
    if (e.target.id === 'formEspecial') { e.preventDefault(); enviarSolicitud(e.target); }
  });

  const buscar = $('#buscar');
  if (buscar) {
    buscar.addEventListener('input', (e) => {
      busqueda = e.target.value;
      renderCatalogo();
    });
  }

  const btnMenu = $('#btnMenu');
  if (btnMenu) {
    btnMenu.addEventListener('click', () => $('#nav').classList.toggle('is-open'));
  }

  $$('#nav a').forEach((a) => a.addEventListener('click', () => $('#nav').classList.remove('is-open')));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarTodo();
  });
}

/* ---------- Inicio ---------- */
function init() {
  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

  renderCatalogo();
  renderCarrito();
  renderZonas();
  renderCuenta();
  renderAdmin();
  actualizarSesionUI();
  bindEventos();
}

document.addEventListener('DOMContentLoaded', init);