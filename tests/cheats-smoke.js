// Smoke test: simula navegador + RPG Maker MZ mínimo y prueba la lógica del panel
function el() { return { style: {}, children: [], appendChild(c) { this.children.push(c); }, addEventListener() {}, setAttribute() {}, querySelector() { return null; } }; }
global.document = {
  createElement: () => ({ style: {}, attachShadow() { return { appendChild() {}, addEventListener() {} }; }, set innerHTML(v) { this._html = v; }, get firstChild() { return this._kids && this._kids[0]; }, _kids: [], appendChild(c) { this._kids.push(c); }, addEventListener() {}, setAttribute() {}, querySelector() { return null; }, offsetLeft: 0, offsetTop: 0 }),
  addEventListener() {},
  activeElement: null,
  body: el()
};
let tick = null;
global.window = global;
global.setInterval = function (cb) { tick = () => cb(); return 1; };
global.clearInterval = () => {};

const mkItem = (id, name) => ({ id, name });
$dataItems = [null, mkItem(1, "Poción"), mkItem(2, "Éter")];
$dataWeapons = [null, mkItem(1, "Espada"), mkItem(2, "Hacha")];
$dataArmors = [null, mkItem(1, "Casco")];
$dataSkills = [null, mkItem(1, "Fuego"), mkItem(2, "Hielo"), mkItem(3, ""), mkItem(99, "Pasiva maldita")];
$dataActors = [null, { id: 1, name: "Atla" }, { id: 2, name: "" }, { id: 3, name: "Peter" }];
$dataSystem = { variables: [null, "", "Oro robado"], switches: [null, "Visto intro"] };
$dataStates = [null, { id: 1, name: "Veneno" }, { id: 2, name: "Bendición" },
               { id: 3, name: "" }, { id: 4, name: "Maldición" }];

class FakeActor {
  constructor(id) {
    this.id = id;
    this._level = 1;
    this._skills = [];
    this._states = [];
    this._stateSteps = {};
    this.resist = new Set([2]);
    this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
    this.baseParams = [100, 50, 10, 10, 10, 10, 10, 10];
    this.meta = { id, name: "Actor" + id, skills: [6] };
    this.classDef = { learnings: [{ level: 1, skillId: 7 }, { level: 50, skillId: 12 }] };
  }
  actor() { return this.meta; }
  currentClass() { return this.classDef; }
  maxLevel() { return 99; }
  changeLevel(lv) { this._level = lv; }
  learnSkill(s) { if (!this._skills.includes(s)) this._skills.push(s); }
  isLearnedSkill(s) { return this._skills.includes(s); }
  param(p) { return this.baseParams[p] + this._paramPlus[p]; }
  addParam(p, v) { this._paramPlus[p] += v; }
  recoverAll() {}
  refresh() { if (this._skills.includes(99) && !this.isStateAffected(2)) this._states.push(2); }
  isStateAffected(id) { return this._states.includes(id); }
  addState(id) { if (!this.resist.has(id) && !this.isStateAffected(id)) this._states.push(id); }
  removeState(id) { const i = this._states.indexOf(id); if (i >= 0) this._states.splice(i, 1); }
  eraseState(id) { const i = this._states.indexOf(id); if (i >= 0) this._states.splice(i, 1); delete this._stateSteps[id]; }
  clearStates() { this._states.length = 0; }
}
let gold = 100;
const inv = new Map();
const vars = {}, sws = [];
const actors = {};
$gameParty = {
  gainGold(n) { gold += n; },
  maxGold() { return 99999999; },
  gainItem(item, n) { const k = item.id + ":" + item.name; inv.set(k, (inv.get(k) || 0) + n); },
  members() { return []; },
  allMembers() { return [actors[1], actors[3]].filter(Boolean); },
  _gold: 0
};
Object.defineProperty($gameParty, "_gold", { get: () => gold, set: v => { gold = v; }, configurable: true });
$gameActors = { actor(id) { return actors[id] || (actors[id] = new FakeActor(id)); } };
$gameVariables = { setValue(id, v) { vars[id] = v; } };
$gameSwitches = { setValue(id, v) { sws[id] = v; } };

const fs = require("fs");
eval(fs.readFileSync("/home/aster/Games/rpgmaker-cheats.js", "utf8"));

tick();
if (!window.__rpg_cheats_ready__()) throw new Error("el panel no detectó el juego");

const api = window.__rpg_cheats_api__;
const A = () => actors[1];

api.goldSet(0);
console.assert(gold === 99999999, "oro MAX");
api.goldSet(50);
console.assert(gold === 50, "goldSet con valor");
api.gold(500);
api.items();
api.maxLevel();
console.assert(A()._level === 99 && actors[3]._level === 99, "nivel MAX");
api.maxStats(500);
console.assert(A().param(2) === 500, "stats MAX");
$gameActors.actor(1).learnSkill(7);
$gameActors.actor(3).learnSkill(9);
api.skills();
console.assert(A().isLearnedSkill(99) && !A().isLearnedSkill(4), "usa sk.id");
api.item("Poción", 5);
console.assert(api.eval("$gameParty._gold") === "OK: 550", "consola eval");
api.variable(1, 42); console.assert(vars[1] === 42, "variable");
api.switch(1, true); console.assert(sws[1] === true, "switch");

// estados
api.clearStates();
api.setState(1, true);
console.assert(A().isStateAffected(1), "estado por ID");
api.allStates(true);
console.assert(A()._states.length === 3, `añadir TODOS (${JSON.stringify(A()._states)})`);
const antes = A()._states.slice();
api.all(); // LO TODO re-aprende la pasiva 99
console.assert(A()._states.join(",") === antes.join(","), "LO TODO no toca estados directamente");
A().refresh();
console.assert(A().isStateAffected(2), "pasiva vuelve tras LO TODO");
api.restoreSkills();
console.assert(A()._skills.join(",") === "6,7,12", `legítimas (${A()._skills.join(",")})`);
api.clearStates();
A().refresh();
console.assert(A()._states.length === 0, "limpio sin pasiva");

// aprender/olvidar individual
api.learnSkill(50, true);
console.assert(A().isLearnedSkill(50) && actors[3].isLearnedSkill(50), "learnSkill añade");
api.learnSkill(50, false);
console.assert(!A().isLearnedSkill(50), "learnSkill quita");

console.log("SMOKE TEST OK — oro:", gold, "| nivel:", A()._level,
  "| skills:", A()._skills.join(","), "| heal en api:", typeof api.heal === "function",
  "| listStates:", JSON.stringify(api.listStates()));
