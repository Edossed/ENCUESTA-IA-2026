/* Encuesta Innovación Pedagógica 2026 · lógica de la página.
 * Las respuestas se guardan en Google Sheets a través de Apps Script (CONFIG.API_URL).
 * Este archivo no contiene datos ni claves.
 */
(function () {
  "use strict";
  const C = window.CONFIG || {};

  /* ---------- Preguntas (si cambia una clave qN, actualice también PREGUNTAS en Code.gs) ---------- */
  const S = [
    {t:"I. Antecedentes", q:[
      {id:"q1", n:1, type:"choice", text:"Nivel en que se desempeña principalmente", opts:["Educación Parvularia","1º a 4º básico","5º a 8º básico","Varios niveles"]},
      {id:"q2", n:2, type:"choice", text:"Antes de la capacitación, ¿con qué frecuencia usaba IA en su trabajo docente?", opts:["Nunca","Ocasionalmente","Con frecuencia","Habitualmente"]}]},
    {t:"II. Capacitación inicial en IA (CENTCAP)", q:[
      {id:"q3", n:3, type:"likert", text:"Los contenidos (planificación, presentaciones y material, evaluación) fueron aplicables a mi aula."},
      {id:"q4", n:4, type:"likert", text:"Las sesiones tuvieron suficiente práctica, no solo exposición."},
      {id:"q5", n:5, type:"likert", text:"El número y la duración de las sesiones fueron adecuados."},
      {id:"q6", n:6, type:"choice", text:"¿Qué módulo le resultó más útil?", opts:["Planificación","Presentaciones y material","Evaluación"]}]},
    {t:"III. Comunidades de aprendizaje y tutores/monitores IA", q:[
      {id:"q7", n:7, type:"likert", text:"El tutor/monitor IA me orientó de forma oportuna y útil."},
      {id:"q8", n:8, type:"likert", text:"En la comunidad aprendí de mis colegas en un clima de colaboración."},
      {id:"q9", n:9, type:"likert", text:"Los tiempos asignados para trabajar en comunidad fueron suficientes."}]},
    {t:"IV. Diseño de la clase con IA", q:[
      {id:"q10", n:10, type:"multi", text:"¿En qué parte(s) de su clase utilizó IA? (puede marcar varias)", opts:["Planificación","Presentación o recursos visuales","Guías o material para estudiantes","Evaluación o retroalimentación","Actividad de estudiantes con IA"]},
      {id:"q11", n:11, type:"grid", text:"El uso de IA mejoró…", rows:[["q11a","mi planificación."],["q11b","mis presentaciones."],["q11c","el material de mis clases."],["q11d","los procesos de evaluación formativa."],["q11e","los procesos evaluativos (sumativos)."],["q11f","la diversificación para apoyar a estudiantes con NEE."]]},
      {id:"q12", n:12, type:"choice", text:"Principal dificultad al diseñar la clase", opts:["Falta de tiempo","Conectividad o equipos","Dominio de las herramientas","Calidad de lo que genera la IA","Otra"]}]},
    {t:"V. Acompañamiento al aula", q:[
      {id:"q13", n:13, type:"likert", text:"El acompañante mostró una actitud respetuosa y de confianza durante la observación."},
      {id:"q14", n:14, type:"likert", text:"Recibí retroalimentación oportuna y concreta después de la observación."},
      {id:"q15", n:15, type:"likert", text:"El acompañamiento fue formativo y me ayudó a mejorar mi práctica."}]},
    {t:"VI. Impacto y proyección", q:[
      {id:"q16", n:16, type:"likert", text:"Después del proceso, me siento más competente usando IA en mi trabajo."},
      {id:"q17", n:17, type:"likert", text:"He seguido usando IA en clases posteriores a la clase acompañada."},
      {id:"q18", n:18, type:"nota", text:"En una escala de 1 a 7, ¿qué nota le pone al proceso completo?"}]},
    {t:"VII. Preguntas abiertas", q:[
      {id:"q19", n:19, type:"open", text:"¿Qué fue lo más valioso del proceso para usted?"},
      {id:"q20", n:20, type:"open", text:"¿Qué cambiaría o mejoraría para el 2027?"}]}
  ];

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
    del(k){ try { localStorage.removeItem(k); } catch(e){} }
  };
  const LS_SAVED = "encuestaIA2026_enviada", LS_DRAFT = "encuestaIA2026_borrador";

  const conectado = () => !!(C.API_URL && C.API_URL.trim());
  async function api(action, data){
    if (!conectado()) throw new Error("La encuesta aún no está conectada con Google Drive.");
    const res = await fetch(C.API_URL, { method: "POST", body: JSON.stringify(Object.assign({ action }, data)) });
    if (!res.ok) throw new Error("El servidor respondió con un error (" + res.status + ").");
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "Error desconocido.");
    return j;
  }

  /* ---------- Formulario ---------- */
  function optEl(type, name, value, label){
    const l = el("label","opt"); const i = document.createElement("input");
    i.type = type; i.name = name; i.value = value; i.id = name + "_" + String(value).replace(/\W+/g,"_");
    l.append(i, el("span", null, label)); return l;
  }
  function likertEl(name){
    const box = el("div"); const g = el("div","likert");
    for (let v = 1; v <= 5; v++) g.append(optEl("radio", name, v, String(v)));
    const lb = el("div","likert-labels"); lb.append(el("span",null,"Muy en desacuerdo"), el("span",null,"Neutral"), el("span",null,"Muy de acuerdo"));
    box.append(g, lb); return box;
  }
  function render(){
    const root = $("sections");
    S.forEach((sec, si) => {
      const card = el("section","card"); const h = el("header");
      h.append(el("span","num","Sección " + (si+1) + " de " + S.length), el("h2", null, sec.t)); card.append(h);
      sec.q.forEach(q => {
        const fs = el(q.type === "open" ? "div" : "fieldset","q"); fs.dataset.q = q.id;
        const lg = el(q.type === "open" ? "label" : "legend"); if (q.type === "open") lg.className = "qt";
        lg.append(el("span","qn", q.n + "."), el("span", null, q.text));
        fs.append(lg);
        if (q.type === "choice" || q.type === "multi"){
          const o = el("div","opts"); q.opts.forEach(t => o.append(optEl(q.type === "multi" ? "checkbox" : "radio", q.id, t, t))); fs.append(o);
        } else if (q.type === "likert"){ fs.append(likertEl(q.id)); }
        else if (q.type === "nota"){ const o = el("div","nota"); for (let v = 1; v <= 7; v++) o.append(optEl("radio", q.id, v, String(v))); fs.append(o); }
        else if (q.type === "grid"){
          const g = el("div","grid-q");
          q.rows.forEach(([rid, rt], k) => { const s = el("div","sub"); s.dataset.q = rid; s.append(el("div","st", String.fromCharCode(97+k) + ") " + rt), likertEl(rid)); g.append(s); });
          fs.append(g);
        } else if (q.type === "open"){ const ta = document.createElement("textarea"); ta.id = q.id; ta.name = q.id; ta.maxLength = 2000; lg.htmlFor = q.id; fs.append(ta); }
        card.append(fs);
      });
      root.append(card);
    });
  }
  const allKeys = () => S.flatMap(s => s.q.flatMap(q => q.type === "grid" ? q.rows.map(r => r[0]) : [q.id]));
  function collect(){
    const f = $("survey"); const out = {}; const missing = [];
    S.forEach(s => s.q.forEach(q => {
      if (q.type === "multi"){ out[q.id] = [...f.querySelectorAll('input[name="'+q.id+'"]:checked')].map(i => i.value); if (!out[q.id].length) missing.push(q.id); }
      else if (q.type === "open"){ out[q.id] = f.elements[q.id].value.trim(); }
      else if (q.type === "grid"){ q.rows.forEach(([rid]) => { const c = f.querySelector('input[name="'+rid+'"]:checked'); out[rid] = c ? c.value : ""; if (!c) missing.push(rid); }); }
      else { const c = f.querySelector('input[name="'+q.id+'"]:checked'); out[q.id] = c ? c.value : ""; if (!c) missing.push(q.id); }
    }));
    return {out, missing};
  }
  function fill(ans){
    const f = $("survey");
    Object.entries(ans || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) f.querySelectorAll('input[name="'+k+'"]').forEach(i => i.checked = v.includes(i.value));
      else if (f.elements[k] && f.elements[k].tagName === "TEXTAREA") f.elements[k].value = v;
      else f.querySelectorAll('input[name="'+k+'"]').forEach(i => i.checked = i.value === String(v));
    });
  }

  let nombre = "", saved = store.get(LS_SAVED);
  const show = (id, on) => { $(id).hidden = !on; };
  function status(text, kind){ const s = $("status"); if (!text){ s.hidden = true; return; } s.hidden = false; s.className = "msg " + (kind || "info"); s.textContent = text; }
  function fmtDate(iso){ try { return new Date(iso).toLocaleString("es-CL", {dateStyle:"long", timeStyle:"short"}); } catch(e){ return iso || ""; } }
  function goName(){ show("stepName", true); show("survey", false); show("done", false); $("nombre").value = nombre; }
  function goSurvey(){ show("stepName", false); show("survey", true); show("done", false); $("whoName").textContent = nombre; }
  function goDone(){ show("stepName", false); show("survey", false); show("done", true); $("doneName").textContent = saved.nombre; $("doneDate").textContent = fmtDate(saved.enviadoEn); }

  render();

  $("nameForm").addEventListener("submit", e => {
    e.preventDefault(); const v = $("nombre").value.trim().replace(/\s+/g, " ");
    if (v.split(" ").length < 2){ $("nombre").setCustomValidity("Escriba nombre y apellido."); $("nombre").reportValidity(); return; }
    $("nombre").setCustomValidity(""); nombre = v; goSurvey(); window.scrollTo({top:0});
  });
  $("nombre").addEventListener("input", () => $("nombre").setCustomValidity(""));
  $("changeName").addEventListener("click", goName);
  $("editBtn").addEventListener("click", () => { nombre = saved.nombre; fill(saved.respuestas); goSurvey(); });
  // En un computador compartido: limpia lo guardado en este equipo y deja la encuesta en blanco
  $("otherBtn").addEventListener("click", () => {
    store.del(LS_SAVED); store.del(LS_DRAFT); saved = null; nombre = "";
    $("survey").reset(); document.querySelectorAll(".invalid").forEach(n => n.classList.remove("invalid"));
    goName(); window.scrollTo({top:0});
  });

  // Borrador local para no perder respuestas si se cierra la pestaña
  $("survey").addEventListener("change", e => {
    const q = e.target.closest("[data-q]"); if (q) q.classList.remove("invalid");
    store.set(LS_DRAFT, { nombre, respuestas: collect().out });
  });
  $("survey").addEventListener("submit", async e => {
    e.preventDefault(); const {out, missing} = collect();
    document.querySelectorAll(".invalid").forEach(n => n.classList.remove("invalid"));
    const fe = $("formErr");
    if (missing.length){
      missing.forEach(id => { const n = document.querySelector('[data-q="'+id+'"]'); if (n) n.classList.add("invalid"); });
      fe.hidden = false; fe.textContent = "Faltan " + missing.length + " respuesta(s), marcadas en rojo. Solo las preguntas 19 y 20 son opcionales.";
      const first = document.querySelector(".invalid"); if (first) first.scrollIntoView({behavior:"smooth", block:"center"});
      return;
    }
    fe.hidden = true;
    const btn = $("sendBtn"); btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const r = await api("enviar", { nombre, respuestas: out });
      saved = { nombre, respuestas: out, enviadoEn: r.enviadoEn || new Date().toISOString() };
      store.set(LS_SAVED, saved); store.del(LS_DRAFT); status(""); goDone(); window.scrollTo({top:0});
    } catch(err){
      fe.hidden = false; fe.textContent = "No se pudo enviar: " + err.message + " Sus respuestas siguen en pantalla; intente de nuevo.";
    } finally { btn.disabled = false; btn.textContent = "Enviar respuestas"; }
  });

  /* ---------- Área UTP ---------- */
  let adminRows = [], clave = "", prevView = null;
  const pct = (n, d) => d ? Math.round(n * 100 / d) : 0;
  const fmt1 = v => v.toLocaleString("es-CL", {minimumFractionDigits:1, maximumFractionDigits:1});
  const LK = ["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"];
  function likertItems(){
    const out = [];
    S.forEach(s => s.q.forEach(q => {
      if (q.type === "likert") out.push({sec:s.t, key:q.id, label:q.n + ".", text:q.text});
      if (q.type === "grid") q.rows.forEach(([rid, rt], k) => out.push({sec:s.t, key:rid, label:q.n + String.fromCharCode(97+k), text:q.text + " " + rt}));
    }));
    return out;
  }
  const tip = $("tip");
  function bindTip(node, text){
    node.addEventListener("mousemove", e => { tip.textContent = text; tip.hidden = false;
      tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 250) + "px"; tip.style.top = (e.clientY + 14) + "px"; });
    node.addEventListener("mouseleave", () => { tip.hidden = true; });
  }
  function renderAdmin(){
    const N = adminRows.length; $("count").textContent = N;
    const notas = adminRows.map(r => Number((r.respuestas||{}).q18)).filter(v => v >= 1);
    $("notaProm").textContent = notas.length ? fmt1(notas.reduce((a,b)=>a+b,0) / notas.length) : "—";
    const box = $("likertRes"); box.replaceChildren(); let lastSec = null, agreeSum = 0, agreeN = 0;
    likertItems().forEach(it => {
      if (it.sec !== lastSec){ box.append(el("h3", null, it.sec)); lastSec = it.sec; }
      const c = [0,0,0,0,0]; adminRows.forEach(r => { const v = Number((r.respuestas||{})[it.key]); if (v >= 1 && v <= 5) c[v-1]++; });
      const n = c.reduce((a,b)=>a+b,0); const mean = n ? c.reduce((a,x,i)=>a + x*(i+1), 0) / n : 0; const ag = pct(c[3]+c[4], n);
      if (n){ agreeSum += ag; agreeN++; }
      const row = el("div","item"); const lab = el("div","lab"); lab.append(el("b", null, it.label), document.createTextNode(it.text));
      const val = el("div","val"); if (n){ val.append(el("strong", null, ag + "% de acuerdo"), document.createTextNode(" · promedio " + fmt1(mean))); } else val.textContent = "Sin respuestas";
      const bar = el("div","stack" + (n ? "" : " empty"));
      if (n) c.forEach((x, i) => { if (!x) return; const sg = el("span"); sg.style.flex = String(x); sg.style.background = "var(--l" + ["1","2","0","3","4"][i] + ")";
        bindTip(sg, (i+1) + " · " + LK[i] + ": " + x + " docente" + (x===1?"":"s") + " (" + pct(x,n) + "%)"); bar.append(sg); });
      row.append(lab, val, bar); box.append(row);
    });
    $("acuerdoProm").textContent = agreeN ? Math.round(agreeSum / agreeN) + "%" : "—";
    const cb = $("choiceRes"); cb.replaceChildren();
    S.forEach(s => s.q.forEach(q => {
      if (!["choice","multi","nota"].includes(q.type)) return;
      cb.append(el("h3", null, q.n + ". " + q.text));
      const opts = q.type === "nota" ? ["1","2","3","4","5","6","7"] : q.opts;
      const counts = opts.map(o => adminRows.filter(r => { const v = (r.respuestas||{})[q.id]; return Array.isArray(v) ? v.includes(o) : String(v) === o; }).length);
      const max = Math.max(1, ...counts);
      opts.forEach((o, i) => { const row = el("div","item"); row.append(el("div","lab", q.type === "nota" ? "Nota " + o : o), el("div","val", counts[i] + " (" + pct(counts[i], N) + "%)"));
        const hb = el("div","hbar"); const f = el("span"); f.style.width = (counts[i] / max * 100) + "%"; hb.append(f); row.append(hb); cb.append(row); });
      if (q.type === "multi") cb.append(el("p","scale-note","Se podía marcar más de una opción; los porcentajes son sobre el total de docentes."));
    }));
    const ob = $("openRes"); ob.replaceChildren();
    S.forEach(s => s.q.forEach(q => { if (q.type !== "open") return;
      const g = el("div","openq"); g.append(el("h3", null, q.n + ". " + q.text));
      const list = adminRows.filter(r => String((r.respuestas||{})[q.id] || "").trim());
      if (!list.length) g.append(el("p","scale-note","Sin respuestas todavía."));
      list.forEach(r => { const bq = el("blockquote", null, String(r.respuestas[q.id])); bq.append(el("cite", null, r.nombre || "—")); g.append(bq); });
      ob.append(g); }));
    const tb = $("rows"); tb.replaceChildren();
    if (!N){ const tr = el("tr"); const td = el("td", null, "Aún no hay respuestas."); td.colSpan = 4; tr.append(td); tb.append(tr); }
    adminRows.forEach(r => { const tr = el("tr"); const a = r.respuestas || {};
      tr.append(el("td", null, r.nombre || "—"), el("td", null, a.q1 || "—"), el("td","n", a.q18 || "—"), el("td","n", fmtDate(r.enviadoEn))); tb.append(tr); });
  }
  function csvCell(v){ v = Array.isArray(v) ? v.join("; ") : (v == null ? "" : String(v)); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v; }
  function buildCsv(){
    const keys = allKeys(); const lines = [["Docente","Enviada", ...keys.map(k => k.toUpperCase())].join(",")];
    adminRows.forEach(r => lines.push([r.nombre, r.enviadoEn, ...keys.map(k => (r.respuestas || {})[k])].map(csvCell).join(",")));
    return "﻿" + lines.join("\r\n");
  }
  $("csvBtn").addEventListener("click", () => {
    const m = $("adminMsg");
    if (!adminRows.length){ m.hidden = false; m.className = "msg info"; m.textContent = "Aún no hay respuestas para descargar."; return; }
    const url = URL.createObjectURL(new Blob([buildCsv()], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "respuestas-encuesta-ia-2026.csv"; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  async function cargarResultados(){
    const r = await api("resultados", { clave });
    adminRows = (r.respuestas || []).sort((a,b) => String(b.enviadoEn||"").localeCompare(String(a.enviadoEn||"")));
    renderAdmin();
  }
  function hideSurveyViews(){ prevView = ["stepName","survey","done"].find(id => !$(id).hidden) || prevView; ["stepName","survey","done"].forEach(id => show(id, false)); }
  function restoreSurvey(){ show("utpLogin", false); show("admin", false); if (prevView) show(prevView, true); else if (saved) goDone(); else goName(); window.scrollTo({top:0}); }
  $("utpLink").addEventListener("click", () => { hideSurveyViews(); show("admin", false); show("utpLogin", true); $("keyErr").hidden = true; $("clave").value = ""; $("clave").focus(); window.scrollTo({top:0}); });
  $("keyCancel").addEventListener("click", restoreSurvey);
  $("logout").addEventListener("click", () => { clave = ""; adminRows = []; renderAdmin(); restoreSurvey(); });
  $("keyForm").addEventListener("submit", async e => {
    e.preventDefault(); const err = $("keyErr"); err.hidden = true;
    clave = $("clave").value.trim();
    const b = e.submitter || $("keyForm").querySelector("button[type=submit]"); b.disabled = true;
    try { await cargarResultados(); show("utpLogin", false); show("admin", true); $("clave").value = ""; }
    catch(x){ clave = ""; err.hidden = false; err.textContent = x.message; }
    finally { b.disabled = false; }
  });

  /* ---------- Inicio ---------- */
  if (!conectado()) status("La encuesta aún no está conectada con Google Drive. Avise a la UTP.", "err"); else status("");
  if (saved && saved.nombre) goDone();
  else {
    const d = store.get(LS_DRAFT);
    if (d && d.nombre){ nombre = d.nombre; fill(d.respuestas); goSurvey(); status("Recuperamos las respuestas que dejó a medias.", "info"); }
    else goName();
  }
})();
