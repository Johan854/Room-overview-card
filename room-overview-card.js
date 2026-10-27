/*
 * Room Overview Card (FR)
 * Carte Home Assistant « pièce » : capteurs (température, humidité, puissance, porte…) en pastilles
 * et interrupteurs/lumières en tuiles. Style verre, thème clair/sombre automatique, éditeur visuel.
 */

const CARD_VERSION = "1.1.0";

const DEFAULTS = {
  title: "",
  icon: "mdi:sofa",
  theme: "auto", // auto | light | dark
  columns: 0, // colonnes des tuiles (0 = automatique)
  image: "", // image de la pièce (ex. /local/jurassic.jpg)
  image_mode: "background", // background | top | side
  image_opacity: 0.35, // fond : 0 (invisible) à 1 (pleine)
  image_height: 130, // bandeau du haut, en px
  image_width: 38, // image sur le côté, en % de la carte
  image_side: "left", // left | right
  image_fit: "cover", // cover | contain
  sensors: [],
  toggles: [],
};

const DC_ICON = {
  temperature: "mdi:thermometer", humidity: "mdi:water-percent", power: "mdi:flash", energy: "mdi:lightning-bolt",
  battery: "mdi:battery", illuminance: "mdi:brightness-5", pressure: "mdi:gauge", co2: "mdi:molecule-co2",
  door: "mdi:door", window: "mdi:window-closed", opening: "mdi:door", motion: "mdi:motion-sensor", occupancy: "mdi:account",
  smoke: "mdi:smoke", moisture: "mdi:water-alert", presence: "mdi:account", connectivity: "mdi:lan-connect",
};
const BIN = {
  door: ["Ouverte", "Fermée"], window: ["Ouverte", "Fermée"], opening: ["Ouvert", "Fermé"], garage_door: ["Ouverte", "Fermée"],
  motion: ["Mouvement", "Aucun mouvement"], occupancy: ["Occupé", "Libre"], presence: ["Présent", "Absent"],
  smoke: ["Fumée", "RAS"], moisture: ["Humide", "Sec"], connectivity: ["Connecté", "Déconnecté"], lock: ["Déverrouillé", "Verrouillé"],
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isNum = (v) => v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
const unavailable = (st) => !st || st.state === "unavailable" || st.state === "unknown";

class RoomOverviewCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("room-overview-card-editor");
  }

  static getStubConfig() {
    return { ...DEFAULTS, title: "Ma pièce", sensors: [], toggles: [] };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = { ...DEFAULTS, ...config };
    ["sensors", "toggles"].forEach((k) => { if (!Array.isArray(this._config[k])) this._config[k] = []; });
    this._sig = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const ids = [...this._config.sensors, ...this._config.toggles].map((x) => x.entity).filter(Boolean);
    const sig = ids.map((e) => { const s = hass.states[e]; return s ? s.state : "x"; }).join("|") + "#" + (this._isDark() ? "d" : "l");
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  getCardSize() { return 2 + Math.ceil(this._config.toggles.length / 3); }

  _isDark() {
    const t = this._config && this._config.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
    const dm = this._hass && this._hass.themes && this._hass.themes.darkMode;
    if (typeof dm === "boolean") return dm;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  _fmt(n) {
    const lang = (this._hass && this._hass.locale && this._hass.locale.language) || "fr";
    const v = Number(n);
    return new Intl.NumberFormat(lang, { maximumFractionDigits: Number.isInteger(v) ? 0 : 1 }).format(v);
  }

  _more(id) {
    if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } }));
  }

  _chip(item) {
    const h = this._hass;
    const st = h.states[item.entity];
    const a = (st && st.attributes) || {};
    const dc = a.device_class;
    const domain = (item.entity || "").split(".")[0];
    let value = "—", tone = "";
    if (!unavailable(st)) {
      if (domain === "binary_sensor") {
        const pair = BIN[dc] || ["Actif", "Inactif"];
        const on = st.state === "on";
        value = on ? pair[0] : pair[1];
        tone = on ? (["door", "window", "opening", "garage_door", "smoke", "moisture", "lock"].includes(dc) ? "warn" : "ok") : "";
      } else if (isNum(st.state)) {
        value = this._fmt(st.state) + (a.unit_of_measurement ? " " + a.unit_of_measurement : "");
      } else {
        value = String(st.state);
      }
    }
    const icon = item.icon || a.icon || DC_ICON[dc] || "mdi:information-outline";
    const label = item.name || a.friendly_name || item.entity;
    return `<button class="chip ${tone}" data-more="${esc(item.entity)}" title="${esc(label)}">
      <ha-icon icon="${esc(icon)}"></ha-icon><span class="cv">${esc(value)}</span>${item.name ? `<span class="cn">${esc(item.name)}</span>` : ""}</button>`;
  }

  _tile(item, i) {
    const st = this._hass.states[item.entity];
    const a = (st && st.attributes) || {};
    const na = unavailable(st);
    const on = !na && (st.state === "on" || st.state === "open" || st.state === "playing");
    const icon = item.icon || a.icon || ((item.entity || "").startsWith("light.") ? "mdi:lightbulb" : "mdi:toggle-switch-variant");
    const name = item.name || a.friendly_name || item.entity;
    const state = na ? "Indisponible" : on ? "Allumé" : "Éteint";
    return `<button class="tile ${on ? "on" : ""} ${na ? "na" : ""}" data-t="${i}" title="${esc(name)}">
      <span class="ti"><ha-icon icon="${esc(icon)}"></ha-icon></span>
      <span class="tt"><b>${esc(name)}</b><small>${state}</small></span></button>`;
  }

  _render() {
    const c = this._config;
    if (!c || !this._hass) return;
    const dark = this._isDark();
    const cols = Number(c.columns) > 0 ? Number(c.columns) : 0;
    const chips = c.sensors.filter((s) => s.entity).map((s) => this._chip(s)).join("");
    const tiles = c.toggles.filter((t) => t.entity).map((t, i) => this._tile(t, c.toggles.indexOf(t))).join("");
    const imgOk = c.image && !/^\s*(javascript|vbscript|data:text)/i.test(String(c.image));
    const mode = ["background", "top", "side"].includes(c.image_mode) ? c.image_mode : "background";
    const fit = c.image_fit === "contain" ? "contain" : "cover";
    const op = Math.max(0, Math.min(1, isNum(c.image_opacity) ? Number(c.image_opacity) : 0.35));
    const imgTag = (cls) => `<img class="${cls}" src="${esc(c.image)}" alt="" loading="lazy" style="object-fit:${fit}">`;
    const bg = imgOk && mode === "background" ? `<div class="bg" style="opacity:${op}">${imgTag("bgimg")}</div>` : "";
    const banner = imgOk && mode === "top" ? `<div class="banner" style="height:${Math.max(40, Number(c.image_height) || 130)}px">${imgTag("bnimg")}</div>` : "";
    const side = imgOk && mode === "side" ? `<div class="sideimg" style="flex:0 0 ${Math.max(15, Math.min(70, Number(c.image_width) || 38))}%">${imgTag("sdimg")}</div>` : "";
    const anyOn = c.toggles.some((t) => { const s = t.entity && this._hass.states[t.entity]; return s && s.state === "on"; });

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing:border-box; }
        ha-card.dark {
          --rm-text:#f4f6fb; --rm-muted:#a9afc0; --rm-bg:linear-gradient(160deg,#1b1e32 0%,#241a2a 55%,#2d1519 100%);
          --rm-border:rgba(255,255,255,.14); --rm-shadow:0 .6em 2em rgba(0,0,0,.35);
          --rm-glass:rgba(255,255,255,.07); --rm-glass-b:rgba(255,255,255,.13); --rm-fill:rgba(255,255,255,.09); --rm-fill-b:rgba(255,255,255,.16);
          --rm-acc:#ffb347; --rm-ok:#3ddc84; --rm-warn:#ffb86b;
        }
        ha-card.light {
          --rm-text:#1c2030; --rm-muted:#5d6477; --rm-bg:linear-gradient(160deg,#f8f9fd 0%,#eef1f8 55%,#f8eff0 100%);
          --rm-border:rgba(20,24,40,.12); --rm-shadow:0 .4em 1.4em rgba(20,24,40,.12);
          --rm-glass:rgba(255,255,255,.7); --rm-glass-b:rgba(20,24,40,.1); --rm-fill:rgba(20,24,40,.06); --rm-fill-b:rgba(20,24,40,.14);
          --rm-acc:#d98a10; --rm-ok:#1a9d55; --rm-warn:#c77a14;
        }
        ha-card { display:flex; flex-direction:column; gap:12px; padding:16px; overflow:hidden; color:var(--rm-text);
          border-radius:24px; border:1px solid var(--rm-border); background:var(--rm-bg); box-shadow:var(--rm-shadow); }
        ha-icon { --mdc-icon-size:1.25em; flex:none; }
        button { font:inherit; color:inherit; cursor:pointer; border:0; background:none; padding:0; text-align:left; -webkit-tap-highlight-color:transparent; }
        ha-card { position:relative; }
        .bg { position:absolute; inset:0; pointer-events:none; z-index:0; }
        .bgimg { width:100%; height:100%; display:block; }
        .banner { position:relative; margin:-16px -16px 0; overflow:hidden; z-index:1; }
        .bnimg { width:100%; height:100%; display:block; }
        .banner::after { content:""; position:absolute; inset:auto 0 0 0; height:45%; background:linear-gradient(180deg, transparent, var(--rm-fade)); }
        ha-card.dark { --rm-fade:rgba(27,30,50,.9); } ha-card.light { --rm-fade:rgba(244,246,252,.95); }
        .wrap { position:relative; z-index:1; display:flex; gap:12px; align-items:stretch; }
        .wrap.side-right { flex-direction:row-reverse; }
        .in { flex:1 1 0; min-width:0; display:flex; flex-direction:column; gap:12px; }
        .sideimg { position:relative; border-radius:16px; overflow:hidden; min-height:120px; border:1px solid var(--rm-glass-b); }
        .sdimg { position:absolute; inset:0; width:100%; height:100%; display:block; }
        ha-card:has(.bg) .head { text-shadow:0 1px 6px rgba(0,0,0,.35); }
        .head { display:flex; align-items:center; gap:.6em; font-size:1.1em; font-weight:650; }
        .head ha-icon { color:${anyOn ? "var(--rm-acc)" : "var(--rm-muted)"}; }
        .chips { display:flex; flex-wrap:wrap; gap:.5em; }
        .chip { display:flex; align-items:center; gap:.45em; padding:.4em .8em; border-radius:2em; font-size:.85em; font-weight:600;
          background:var(--rm-glass); border:1px solid var(--rm-glass-b); -webkit-backdrop-filter:blur(18px) saturate(140%); backdrop-filter:blur(18px) saturate(140%); }
        .chip ha-icon { color:var(--rm-muted); --mdc-icon-size:1.15em; }
        .chip .cn { color:var(--rm-muted); font-weight:500; font-size:.9em; }
        .chip.warn { border-color:var(--rm-warn); } .chip.warn ha-icon, .chip.warn .cv { color:var(--rm-warn); }
        .chip.ok ha-icon, .chip.ok .cv { color:var(--rm-ok); }
        .tiles { display:grid; gap:10px; grid-template-columns:${cols ? `repeat(${cols},minmax(0,1fr))` : "repeat(auto-fit,minmax(10.5em,1fr))"}; }
        .tile { display:flex; align-items:center; gap:.7em; padding:.7em .8em; border-radius:1.1em; min-width:0;
          background:var(--rm-glass); border:1px solid var(--rm-glass-b); -webkit-backdrop-filter:blur(18px) saturate(140%); backdrop-filter:blur(18px) saturate(140%);
          transition:transform .1s, border-color .2s; }
        .tile:active { transform:scale(.97); }
        .ti { display:grid; place-items:center; width:2.4em; height:2.4em; border-radius:50%; background:var(--rm-fill); border:1px solid var(--rm-fill-b); color:var(--rm-muted); flex:none; }
        .tt { display:flex; flex-direction:column; min-width:0; }
        .tt b { font-size:.88em; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tt small { font-size:.74em; color:var(--rm-muted); }
        .tile.on { border-color:var(--rm-acc); box-shadow:inset 0 0 1.8em color-mix(in srgb, var(--rm-acc) 16%, transparent); }
        .tile.on .ti { color:var(--rm-acc); border-color:var(--rm-acc); background:color-mix(in srgb, var(--rm-acc) 16%, transparent); }
        .tile.na { opacity:.45; cursor:default; }
        .empty { color:var(--rm-muted); font-size:.9em; }
      </style>
      <ha-card class="${dark ? "dark" : "light"}">
        ${bg}${banner}
        <div class="wrap ${side ? "hasside side-" + (c.image_side === "right" ? "right" : "left") : ""}">
          ${side}
          <div class="in">
            ${c.title ? `<div class="head"><ha-icon icon="${esc(c.icon || "mdi:sofa")}"></ha-icon>${esc(c.title)}</div>` : ""}
            ${chips ? `<div class="chips">${chips}</div>` : ""}
            ${tiles ? `<div class="tiles">${tiles}</div>` : ""}
            ${!chips && !tiles ? `<div class="empty">Ajoutez des capteurs et des interrupteurs dans l'éditeur de la carte.</div>` : ""}
          </div>
        </div>
      </ha-card>`;

    const root = this.shadowRoot;
    root.querySelectorAll("[data-more]").forEach((el) => el.addEventListener("click", () => this._more(el.dataset.more)));
    root.querySelectorAll("[data-t]").forEach((el) => {
      const t = c.toggles[Number(el.dataset.t)];
      let timer, held = false;
      el.addEventListener("pointerdown", () => { held = false; timer = setTimeout(() => { held = true; this._more(t.entity); }, 550); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(timer)));
      el.addEventListener("click", () => {
        if (held || el.classList.contains("na")) return;
        const [domain] = t.entity.split(".");
        if (domain === "button" || domain === "input_button") this._hass.callService(domain, "press", { entity_id: t.entity });
        else if (domain === "script" || domain === "scene") this._hass.callService(domain, "turn_on", { entity_id: t.entity });
        else this._hass.callService("homeassistant", "toggle", { entity_id: t.entity });
      });
    });
  }
}

/* ---------- Éditeur visuel ---------- */
const LABELS = {
  title: "Titre (nom de la pièce)", icon: "Icône", theme: "Thème", columns: "Colonnes des tuiles (0 = automatique)",
  entity: "Entité", name: "Nom (facultatif)",
  image: "Image de la pièce (ex. /local/jurassic.jpg)", image_mode: "Position de l'image", image_opacity: "Opacité de l'image de fond (0 à 1)",
  image_height: "Hauteur du bandeau (px)", image_width: "Largeur de l'image sur le côté (%)", image_side: "Côté de l'image", image_fit: "Cadrage de l'image",
};
const LIST_SCHEMA = [
  { name: "entity", selector: { entity: {} } },
  { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }] },
];
const LISTS = [
  { key: "sensors", label: "Capteur", add: "+ Ajouter un capteur / une pastille" },
  { key: "toggles", label: "Interrupteur", add: "+ Ajouter un interrupteur / une lumière" },
];

class RoomOverviewCardEditor extends HTMLElement {
  setConfig(config) {
    const next = { ...DEFAULTS, ...config };
    LISTS.forEach((l) => { next[l.key] = (config[l.key] || []).map((x) => ({ ...x })); });
    const same = this._config && this._built && LISTS.every((l) => next[l.key].length === this._config[l.key].length);
    this._config = next;
    if (!same) return this._build();
    const forms = this.querySelectorAll("ha-form");
    let k = 1;
    forms[0].data = this._config;
    LISTS.forEach((l) => this._config[l.key].forEach((x) => { forms[k++].data = x; }));
  }

  set hass(hass) {
    this._hass = hass;
    this.querySelectorAll("ha-form").forEach((f) => (f.hass = hass));
  }

  _emit() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _build() {
    this._built = true;
    this.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `.bx{border:1px solid var(--divider-color);border-radius:12px;padding:10px;margin:12px 0}
      .bx .h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:600}
      .bx button,.add{cursor:pointer;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);border-radius:8px;padding:6px 10px}
      .add{width:100%;margin:4px 0 12px}`;
    this.appendChild(style);

    const main = document.createElement("ha-form");
    main.hass = this._hass;
    main.data = this._config;
    main.computeLabel = (s) => LABELS[s.name] || s.name;
    main.schema = [
      { name: "title", selector: { text: {} } },
      { type: "grid", name: "", schema: [
        { name: "icon", selector: { icon: {} } },
        { name: "columns", selector: { number: { min: 0, max: 6, mode: "box" } } },
      ] },
      { name: "theme", selector: { select: { mode: "dropdown", options: [
        { value: "auto", label: "Automatique (thème de Home Assistant)" }, { value: "light", label: "Clair" }, { value: "dark", label: "Sombre" } ] } } },
      { type: "expandable", title: "Image de la pièce", name: "", schema: [
        { name: "image", selector: { text: {} } },
        { name: "image_mode", selector: { select: { mode: "dropdown", options: [
          { value: "background", label: "En fond de carte" }, { value: "top", label: "Bandeau au-dessus" }, { value: "side", label: "Sur le côté" } ] } } },
        { name: "image_opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
        { type: "grid", name: "", schema: [
          { name: "image_height", selector: { number: { min: 40, max: 400, mode: "box" } } },
          { name: "image_width", selector: { number: { min: 15, max: 70, mode: "box" } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "image_side", selector: { select: { mode: "dropdown", options: [{ value: "left", label: "À gauche" }, { value: "right", label: "À droite" }] } } },
          { name: "image_fit", selector: { select: { mode: "dropdown", options: [{ value: "cover", label: "Remplir (rogner)" }, { value: "contain", label: "Entière" }] } } },
        ] },
      ] },
    ];
    main.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      const keep = {}; LISTS.forEach((l) => { keep[l.key] = this._config[l.key]; });
      this._config = { ...this._config, ...ev.detail.value, ...keep };
      this._emit();
    });
    this.appendChild(main);

    LISTS.forEach((l) => {
      const title = document.createElement("h3");
      title.textContent = l.key === "sensors" ? "Capteurs (pastilles)" : "Interrupteurs et lumières (tuiles)";
      this.appendChild(title);
      this._config[l.key].forEach((item, i) => {
        const box = document.createElement("div");
        box.className = "bx";
        box.innerHTML = `<div class="h"><span>${l.label} ${i + 1}</span><span><button data-k="${l.key}" data-up="${i}">↑</button> <button data-k="${l.key}" data-down="${i}">↓</button> <button data-k="${l.key}" data-del="${i}">✕</button></span></div>`;
        const f = document.createElement("ha-form");
        f.hass = this._hass;
        f.data = item;
        f.computeLabel = (s) => LABELS[s.name] || s.name;
        f.schema = LIST_SCHEMA;
        f.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          this._config[l.key][i] = { ...ev.detail.value };
          this._emit();
        });
        box.appendChild(f);
        this.appendChild(box);
      });
      const add = document.createElement("button");
      add.className = "add";
      add.textContent = l.add;
      add.addEventListener("click", () => { this._config[l.key].push({ entity: "" }); this._emit(); this._build(); });
      this.appendChild(add);
    });

    this.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { this._config[b.dataset.k].splice(Number(b.dataset.del), 1); this._emit(); this._build(); }));
    this.querySelectorAll("[data-up]").forEach((b) => b.addEventListener("click", () => this._move(b.dataset.k, Number(b.dataset.up), -1)));
    this.querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => this._move(b.dataset.k, Number(b.dataset.down), 1)));
  }

  _move(key, i, d) {
    const j = i + d, a = this._config[key];
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    this._emit();
    this._build();
  }
}

customElements.define("room-overview-card", RoomOverviewCard);
customElements.define("room-overview-card-editor", RoomOverviewCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "room-overview-card",
  name: "Room Overview Card (FR)",
  description: "Une pièce en un coup d'œil : pastilles de capteurs (température, humidité, porte…) et tuiles d'interrupteurs.",
  preview: true,
});

console.info(
  `%c ROOM-OVERVIEW-CARD %c v${CARD_VERSION} `,
  "color:#fff;background:#d98a10;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#d98a10;background:#fff;font-weight:700;border-radius:0 3px 3px 0;padding:2px 4px"
);
