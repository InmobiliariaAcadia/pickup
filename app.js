// ── FIREBASE CONFIG ──────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore, collection, doc,
  setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAROBWOCx1ZKYAbcXIYS60CH5-qxq9xSao",
  authDomain:        "camioneta-pickup.firebaseapp.com",
  projectId:         "camioneta-pickup",
  storageBucket:     "camioneta-pickup.firebasestorage.app",
  messagingSenderId: "387324277494",
  appId:             "1:387324277494:web:92a1d536b790571ad6f2d7",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COLECCION = "reservas";

// ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
const FAMILIA = ["Reytek", "Acadia", "Luison", "Laurita", "Alejandra", "Doña Laura"];
const TURNOS  = ["Todo el día", "Mañana", "Tarde", "Noche"];
const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_LARGO = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

const COLORES = {
  "Reytek":     { bg: "#fde8f0", text: "#b5295a", dot: "#e75480", card: "#f9c5d8" },
  "Acadia":     { bg: "#ddeeff", text: "#1a5fa8", dot: "#2d7dd2", card: "#b0d0f5" },
  "Luison":     { bg: "#e6f7e6", text: "#2a7a2a", dot: "#3a9e3a", card: "#a8e0a8" },
  "Laurita":    { bg: "#fff4e0", text: "#a06010", dot: "#f0a030", card: "#f5d898" },
  "Alejandra":  { bg: "#f0e6ff", text: "#6a20b0", dot: "#9b50e0", card: "#d5b0f5" },
  "Doña Laura": { bg: "#e0f5f5", text: "#1a7a7a", dot: "#2aadad", card: "#90dada" },
};

// ── ESTADO ────────────────────────────────────────────────────────────────────
let bookings = {};          // { key: { member, slot, note, date } }
let currentView  = "semana";
let weekStart    = getWeekStart(todayStr());
let calYear, calMonth;
let selectedMember = FAMILIA[0];
let selectedTurno  = TURNOS[0];

// ── UTILS ─────────────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2, "0"); }

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function fechaLegible(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return `${DIAS_LARGO[(d.getDay()+6)%7]} ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function fechaCorta(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}`;
}

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y, m)    { return (new Date(y, m, 1).getDay() + 6) % 7; }

function getBookingsForDate(dateStr) {
  return Object.entries(bookings)
    .filter(([k]) => k.startsWith(dateStr))
    .map(([k, v]) => ({ key: k, ...v }));
}

// ── FIREBASE: ESCUCHAR CAMBIOS EN TIEMPO REAL ─────────────────────────────────
function startListening() {
  showSync(true);
  onSnapshot(collection(db, COLECCION), (snapshot) => {
    bookings = {};
    snapshot.forEach(docSnap => {
      bookings[docSnap.id] = docSnap.data();
    });
    showSync(false);
    renderAll();
  }, (error) => {
    console.error("Error escuchando Firestore:", error);
    showSync(false);
    showToast("⚠️ Error de conexión");
  });
}

// ── FIREBASE: GUARDAR RESERVA ─────────────────────────────────────────────────
async function saveBooking(key, data) {
  showSync(true);
  try {
    await setDoc(doc(db, COLECCION, key), data);
  } catch(e) {
    console.error("Error guardando:", e);
    showToast("⚠️ No se pudo guardar. Revisa tu conexión.");
  }
}

// ── FIREBASE: ELIMINAR RESERVA ────────────────────────────────────────────────
async function deleteBooking(key) {
  showSync(true);
  try {
    await deleteDoc(doc(db, COLECCION, key));
    showToast("Reserva eliminada.");
  } catch(e) {
    console.error("Error eliminando:", e);
    showToast("⚠️ No se pudo eliminar. Revisa tu conexión.");
  }
}

// ── SYNC INDICATOR ────────────────────────────────────────────────────────────
function showSync(on) {
  const el = document.getElementById("sync-indicator");
  if (on) el.classList.remove("hidden");
  else    el.classList.add("hidden");
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}

// ── HEADER ────────────────────────────────────────────────────────────────────
function renderHeaderStatus() {
  const el = document.getElementById("hoy-status");
  const todayB = getBookingsForDate(todayStr());
  if (todayB.length === 0) {
    el.innerHTML = `<span class="hoy-libre">Libre hoy</span>`;
  } else {
    el.innerHTML = todayB.map(b => {
      const c = COLORES[b.member] || {};
      return `<span class="hoy-pill" style="background:${c.bg};color:${c.text}">${b.member} — ${b.slot}</span>`;
    }).join("");
  }
}

// ── BOOKING CARD ──────────────────────────────────────────────────────────────
function renderBookingCard(b, container) {
  const c = COLORES[b.member] || { bg:"#eee", text:"#333", dot:"#999", card:"#ddd" };
  const div = document.createElement("div");
  div.className = "booking-card";
  div.style.background = c.card;
  div.innerHTML = `
    <div class="booking-card-left">
      <div class="dot" style="background:${c.dot}"></div>
      <span class="booking-member" style="color:${c.text}">${b.member}</span>
      <span class="booking-slot">${b.slot}</span>
      ${b.note ? `<span class="booking-note">"${b.note}"</span>` : ""}
    </div>
    <button class="btn-remove" data-key="${b.key}">×</button>
  `;
  div.querySelector(".btn-remove").addEventListener("click", () => deleteBooking(b.key));
  container.appendChild(div);
}

function renderLegend(id) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  FAMILIA.forEach(m => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<div class="dot" style="background:${COLORES[m].dot};width:9px;height:9px"></div>${m}`;
    el.appendChild(item);
  });
}

// ── SEMANA ────────────────────────────────────────────────────────────────────
function renderWeek() {
  const today    = todayStr();
  const weekDays = Array.from({length:7}, (_,i) => addDays(weekStart, i));
  const wsDate   = new Date(weekStart + "T12:00:00");
  const weDate   = new Date(addDays(weekStart, 6) + "T12:00:00");

  document.getElementById("week-label").textContent =
    `${wsDate.getDate()} ${MESES[wsDate.getMonth()].slice(0,3)} – ${weDate.getDate()} ${MESES[weDate.getMonth()].slice(0,3)} ${weDate.getFullYear()}`;

  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";

  weekDays.forEach((dateStr, i) => {
    const dayB    = getBookingsForDate(dateStr);
    const isToday = dateStr === today;
    const isPast  = dateStr < today;
    const d       = new Date(dateStr + "T12:00:00");

    const dayEl = document.createElement("div");
    dayEl.className = "week-day" +
      (isToday ? " is-today" : "") +
      (isPast && !isToday ? " is-past" : "");

    const header = document.createElement("div");
    header.className = "week-day-header";
    header.innerHTML = `
      <div class="week-day-left">
        <span class="week-day-name">${DIAS_LARGO[i]}</span>
        <span class="week-day-date">${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}</span>
        ${isToday ? `<span class="badge-hoy">HOY</span>` : ""}
      </div>
      ${!isPast ? `<button class="btn-add-day" data-date="${dateStr}">+ Añadir</button>` : ""}
    `;
    dayEl.appendChild(header);

    if (dayB.length === 0) {
      const emp = document.createElement("div");
      emp.className = "week-day-empty";
      emp.textContent = "Sin reservas";
      dayEl.appendChild(emp);
    } else {
      dayB.forEach(b => renderBookingCard(b, dayEl));
    }

    grid.appendChild(dayEl);
  });

  grid.querySelectorAll(".btn-add-day").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("input-fecha").value = btn.dataset.date;
      switchView("reservar");
    });
  });

  renderLegend("legend-semana");
}

// ── MES ───────────────────────────────────────────────────────────────────────
function renderMonth() {
  const today = todayStr();
  document.getElementById("month-label").textContent = `${MESES[calMonth]} ${calYear}`;

  const grid     = document.getElementById("cal-grid");
  grid.innerHTML = "";
  const days     = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDay(calYear, calMonth);

  for (let i=0; i<firstDay; i++) grid.appendChild(document.createElement("div"));

  for (let d=1; d<=days; d++) {
    const dateStr = `${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    const dayB    = getBookingsForDate(dateStr);
    const isToday = dateStr === today;
    const isPast  = dateStr < today;

    const cell = document.createElement("div");
    cell.className = "cal-cell" +
      (isToday ? " is-today" : "") +
      (isPast  ? " is-past"  : "");

    cell.innerHTML = `<div class="cal-num">${d}</div>`;

    if (dayB.length) {
      const dots = document.createElement("div");
      dots.className = "cal-dots";
      dayB.forEach(b => {
        const dot = document.createElement("div");
        dot.className = "cal-dot";
        dot.style.background = COLORES[b.member]?.dot || "#888";
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
    }

    cell.addEventListener("click", () => {
      document.getElementById("input-fecha").value = dateStr;
      switchView("reservar");
    });

    grid.appendChild(cell);
  }

  renderLegend("legend-mes");
}

// ── LISTA ─────────────────────────────────────────────────────────────────────
function renderLista() {
  const today     = todayStr();
  const container = document.getElementById("lista-content");
  container.innerHTML = "";

  const upcoming = Object.entries(bookings)
    .filter(([k, v]) => v.date >= today)
    .sort(([a], [b]) => a.localeCompare(b));

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="lista-empty">Sin reservas próximas.<br>¡Usa ＋ Reservar para agregar!</div>`;
    return;
  }

  upcoming.forEach(([key, b]) => {
    const c = COLORES[b.member] || { bg:"#eee", text:"#333", dot:"#999" };
    const card = document.createElement("div");
    card.className = "lista-card";
    card.style.background = c.bg;
    card.innerHTML = `
      <div class="lista-card-left">
        <div class="dot" style="background:${c.dot};width:10px;height:10px;flex-shrink:0"></div>
        <div>
          <div class="lista-member" style="color:${c.text}">${b.member}</div>
          <div class="lista-date">${fechaLegible(b.date)} · ${b.slot}</div>
          ${b.note ? `<div class="lista-note">"${b.note}"</div>` : ""}
        </div>
      </div>
      <button class="btn-remove" data-key="${key}">×</button>
    `;
    card.querySelector(".btn-remove").addEventListener("click", () => deleteBooking(key));
    container.appendChild(card);
  });
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function renderForm() {
  const mGroup = document.getElementById("pill-miembro");
  mGroup.innerHTML = "";
  FAMILIA.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "pill" + (m === selectedMember ? " active" : "");
    btn.textContent = m;
    if (m === selectedMember) btn.style.background = COLORES[m].dot;
    btn.addEventListener("click", () => { selectedMember = m; renderForm(); });
    mGroup.appendChild(btn);
  });

  const tGroup = document.getElementById("pill-turno");
  tGroup.innerHTML = "";
  TURNOS.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "pill pill-turno" + (t === selectedTurno ? " active" : "");
    btn.textContent = t;
    btn.addEventListener("click", () => { selectedTurno = t; renderForm(); });
    tGroup.appendChild(btn);
  });
}

// ── AGREGAR RESERVA ───────────────────────────────────────────────────────────
async function addBooking() {
  const fecha = document.getElementById("input-fecha").value;
  const nota  = document.getElementById("input-nota").value.trim();

  if (!fecha) { showToast("⚠️ Selecciona una fecha"); return; }

  const key = `${fecha}_${selectedTurno}`;

  if (bookings[key]) {
    showToast(`¡Ya reservado por ${bookings[key].member} — ${selectedTurno}!`);
    return;
  }

  const data = { member: selectedMember, slot: selectedTurno, note: nota, date: fecha };

  document.getElementById("btn-confirmar").disabled = true;
  await saveBooking(key, data);
  document.getElementById("btn-confirmar").disabled = false;

  document.getElementById("input-nota").value = "";
  showToast(`✓ Reservado para ${selectedMember} — ${fechaCorta(fecha)}`);
  switchView("semana");
}

// ── VISTAS ────────────────────────────────────────────────────────────────────
function switchView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el  => el.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  if (view === "semana")   renderWeek();
  if (view === "mes")      renderMonth();
  if (view === "reservar") renderForm();
  if (view === "lista")    renderLista();
}

function renderAll() {
  renderHeaderStatus();
  if (currentView === "semana") renderWeek();
  if (currentView === "mes")    renderMonth();
  if (currentView === "lista")  renderLista();
}

// ── INICIO ────────────────────────────────────────────────────────────────────
function init() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  document.getElementById("input-fecha").value = todayStr();
  document.getElementById("input-fecha").min   = todayStr();

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  document.getElementById("prev-week").addEventListener("click", () => {
    weekStart = addDays(weekStart, -7); renderWeek();
  });
  document.getElementById("next-week").addEventListener("click", () => {
    weekStart = addDays(weekStart, 7); renderWeek();
  });
  document.getElementById("prev-month").addEventListener("click", () => {
    if (calMonth === 0) { calMonth=11; calYear--; } else calMonth--;
    renderMonth();
  });
  document.getElementById("next-month").addEventListener("click", () => {
    if (calMonth === 11) { calMonth=0; calYear++; } else calMonth++;
    renderMonth();
  });

  document.getElementById("btn-confirmar").addEventListener("click", addBooking);

  // Conectar con Firebase y escuchar cambios en tiempo real
  startListening();
}

document.addEventListener("DOMContentLoaded", init);
