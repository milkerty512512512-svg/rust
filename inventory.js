// =============================================================
// inventory.js — инвентарь, каталог, хотбар, иконки предметов
// =============================================================
const GAME = (window.GAME = window.GAME || {});
GAME.listeners = GAME.listeners || {};
GAME.on = GAME.on || ((ev, fn) => ((GAME.listeners[ev] = GAME.listeners[ev] || []).push(fn)));
GAME.emit = GAME.emit || ((ev, ...a) => (GAME.listeners[ev] || []).forEach(fn => fn(...a)));

// =============================================================
// СПИСОК ПРЕДМЕТОВ (150+)
// =============================================================
const ITEMS = [
  // ------- Оружие -------
  { name: 'Камень',            category: 'Оружие', type: 'rock' },
  { name: 'Факел',             category: 'Оружие', type: 'torch' },
  { name: 'Копьё деревянное',  category: 'Оружие', type: 'wood_spear' },
  { name: 'Копьё костяное',    category: 'Оружие', type: 'bone_spear' },
  { name: 'Мачете',            category: 'Оружие', type: 'machete' },
  { name: 'Нож',               category: 'Оружие', type: 'knife' },
  { name: 'Дубинка',           category: 'Оружие', type: 'club' },
  { name: 'Лук',               category: 'Оружие', type: 'bow' },
  { name: 'Арбалет',           category: 'Оружие', type: 'crossbow' },
  { name: 'Составной лук',     category: 'Оружие', type: 'compound_bow' },
  { name: 'Револьвер',         category: 'Оружие', type: 'revolver' },
  { name: 'P2',                category: 'Оружие', type: 'p2' },
  { name: 'M92',               category: 'Оружие', type: 'm92' },
  { name: 'Питон',             category: 'Оружие', type: 'python' },
  { name: 'Двустволка',        category: 'Оружие', type: 'double_barrel' },
  { name: 'Помповый дробовик', category: 'Оружие', type: 'pump_shotgun' },
  { name: 'Помпа',             category: 'Оружие', type: 'spas' },
  { name: 'Томми',             category: 'Оружие', type: 'tommy' },
  { name: 'AK-47',             category: 'Оружие', type: 'ak47' },
  { name: 'LR-300',            category: 'Оружие', type: 'lr300' },
  { name: 'MP5',               category: 'Оружие', type: 'mp5' },
  { name: 'M249',              category: 'Оружие', type: 'm249' },
  { name: 'M39',               category: 'Оружие', type: 'm39' },
  { name: 'Bolt Action',       category: 'Оружие', type: 'bolt' },
  { name: 'L96',               category: 'Оружие', type: 'l96' },
  { name: 'SAR',               category: 'Оружие', type: 'sar' },
  { name: 'Граната F1',        category: 'Оружие', type: 'f1_grenade' },
  { name: 'Светошумовая',      category: 'Оружие', type: 'flash' },
  { name: 'РПГ',               category: 'Оружие', type: 'rpg' },
  { name: 'C4',                category: 'Оружие', type: 'c4' },
  { name: 'Satchel',           category: 'Оружие', type: 'satchel' },
  { name: 'Ракета',            category: 'Оружие', type: 'rocket' },

  // ------- Патроны -------
  { name: 'Патрон 5.56',          category: 'Патроны', type: 'ammo_rifle' },
  { name: 'Патрон 5.56 HV',       category: 'Патроны', type: 'ammo_rifle_hv' },
  { name: 'Патрон 5.56 Explosive',category: 'Патроны', type: 'ammo_rifle_exp' },
  { name: 'Патрон пистолетный',   category: 'Патроны', type: 'ammo_pistol' },
  { name: 'Патрон HV pistol',     category: 'Патроны', type: 'ammo_pistol_hv' },
  { name: 'Картечь 12',           category: 'Патроны', type: 'ammo_shotgun' },
  { name: 'Пуля 12',              category: 'Патроны', type: 'ammo_shotgun_slug' },
  { name: 'Стрела деревянная',    category: 'Патроны', type: 'arrow_wood' },
  { name: 'Стрела костяная',      category: 'Патроны', type: 'arrow_bone' },
  { name: 'Стрела огненная',      category: 'Патроны', type: 'arrow_fire' },
  { name: 'Стрела разрывная',     category: 'Патроны', type: 'arrow_hv' },
  { name: 'Заряд РПГ',            category: 'Патроны', type: 'rpg_ammo' },

  // ------- Броня -------
  { name: 'Шапка',            category: 'Броня', type: 'hat' },
  { name: 'Балаклава',        category: 'Броня', type: 'balaclava' },
  { name: 'Каска',            category: 'Броня', type: 'helmet_coffee' },
  { name: 'Металлический шлем',category: 'Броня', type: 'metal_helm' },
  { name: 'Кожаная куртка',   category: 'Броня', type: 'leather_vest' },
  { name: 'Жилет',            category: 'Броня', type: 'vest' },
  { name: 'Металл. нагрудник',category: 'Броня', type: 'metal_chest' },
  { name: 'Кевлар',           category: 'Броня', type: 'roadsign_vest' },
  { name: 'Штаны',            category: 'Броня', type: 'pants' },
  { name: 'Защита ног',       category: 'Броня', type: 'roadsign_kilt' },
  { name: 'Ботинки',          category: 'Броня', type: 'boots' },
  { name: 'Противогаз',       category: 'Броня', type: 'gas_mask' },
  { name: 'ОЗК',              category: 'Броня', type: 'hazmat' },
  { name: 'Скафандр',         category: 'Броня', type: 'heavy_plate' },
  { name: 'Плита',            category: 'Броня', type: 'armor_insert' },

  // ------- Еда -------
  { name: 'Фасоль',       category: 'Еда', type: 'bean_can' },
  { name: 'Тушёнка',      category: 'Еда', type: 'tuna' },
  { name: 'Свинина',      category: 'Еда', type: 'pork' },
  { name: 'Курятина',     category: 'Еда', type: 'chicken' },
  { name: 'Рыба',         category: 'Еда', type: 'fish' },
  { name: 'Оленина',      category: 'Еда', type: 'venison' },
  { name: 'Ягоды',        category: 'Еда', type: 'berries' },
  { name: 'Грибы',        category: 'Еда', type: 'mushroom' },
  { name: 'Кукуруза',     category: 'Еда', type: 'corn' },
  { name: 'Картофель',    category: 'Еда', type: 'potato' },
  { name: 'Тыква',        category: 'Еда', type: 'pumpkin' },
  { name: 'Бутылка воды', category: 'Еда', type: 'water' },
  { name: 'Фляга',        category: 'Еда', type: 'canteen' },
  { name: 'Кофе',         category: 'Еда', type: 'coffee' },
  { name: 'Шоколад',      category: 'Еда', type: 'chocolate' },
  { name: 'Леденец',      category: 'Еда', type: 'candy' },

  // ------- Медицина -------
  { name: 'Бинты',          category: 'Медицина', type: 'bandage' },
  { name: 'Аптечка',        category: 'Медицина', type: 'medkit' },
  { name: 'Шприц',          category: 'Медицина', type: 'syringe' },
  { name: 'Антирадин',      category: 'Медицина', type: 'antirad' },
  { name: 'Кровь животного',category: 'Медицина', type: 'blood' },
  { name: 'Ткань',          category: 'Медицина', type: 'cloth' },

  // ------- Ресурсы -------
  { name: 'Дерево',          category: 'Ресурсы', type: 'wood' },
  { name: 'Камни',           category: 'Ресурсы', type: 'stones' },
  { name: 'Металл. руда',    category: 'Ресурсы', type: 'metal_ore' },
  { name: 'Металл. фрагменты',category: 'Ресурсы', type: 'metal_frag' },
  { name: 'Кач. металл',     category: 'Ресурсы', type: 'hq_metal' },
  { name: 'Сера',            category: 'Ресурсы', type: 'sulfur' },
  { name: 'Уголь',           category: 'Ресурсы', type: 'charcoal' },
  { name: 'Скрап',           category: 'Ресурсы', type: 'scrap' },
  { name: 'Порох',           category: 'Ресурсы', type: 'gunpowder' },
  { name: 'Взрывчатка',      category: 'Ресурсы', type: 'explosives' },
  { name: 'Кости',           category: 'Ресурсы', type: 'bones' },
  { name: 'Череп',           category: 'Ресурсы', type: 'skull' },
  { name: 'Ткань(сырьё)',    category: 'Ресурсы', type: 'raw_cloth' },
  { name: 'Кожа',            category: 'Ресурсы', type: 'leather' },
  { name: 'Низкокач. топливо',category: 'Ресурсы', type: 'low_grade' },
  { name: 'Бензин',          category: 'Ресурсы', type: 'fuel' },
  { name: 'Провод',          category: 'Ресурсы', type: 'rope' },
  { name: 'Тряпка',          category: 'Ресурсы', type: 'rag' },
  { name: 'Пружина',         category: 'Ресурсы', type: 'spring' },
  { name: 'Шестерёнка',      category: 'Ресурсы', type: 'gear' },
  { name: 'Пайка',           category: 'Ресурсы', type: 'tech_trash' },
  { name: 'Микросхема',      category: 'Ресурсы', type: 'chip' },
  { name: 'Труба',           category: 'Ресурсы', type: 'pipe' },
  { name: 'Лист металла',    category: 'Ресурсы', type: 'sheet_metal' },
  { name: 'Ось',             category: 'Ресурсы', type: 'axle' },

  // ------- Строительство -------
  { name: 'План строительства', category: 'Строительство', type: 'building_plan' },
  { name: 'Киянка',             category: 'Строительство', type: 'hammer' },
  { name: 'Топор',              category: 'Строительство', type: 'axe' },
  { name: 'Кирка',              category: 'Строительство', type: 'pickaxe' },
  { name: 'Каменный топор',     category: 'Строительство', type: 'stone_hatchet' },
  { name: 'Каменная кирка',     category: 'Строительство', type: 'stone_pick' },
  { name: 'Дверь деревянная',   category: 'Строительство', type: 'door_wood' },
  { name: 'Дверь металлическая',category: 'Строительство', type: 'door_metal' },
  { name: 'Бронированная дверь',category: 'Строительство', type: 'door_armored' },
  { name: 'Гаражные ворота',    category: 'Строительство', type: 'garage_door' },
  { name: 'Сетчатый забор',     category: 'Строительство', type: 'wire_fence' },
  { name: 'Колючая проволока',  category: 'Строительство', type: 'barbed' },
  { name: 'TC (шкаф)',          category: 'Строительство', type: 'tc' },
  { name: 'Кодовый замок',      category: 'Строительство', type: 'codelock' },
  { name: 'Замок',              category: 'Строительство', type: 'keylock' },
  { name: 'Ящик',               category: 'Строительство', type: 'wood_box' },
  { name: 'Большой ящик',       category: 'Строительство', type: 'large_box' },
  { name: 'Спальник',           category: 'Строительство', type: 'sleeping_bag' },
  { name: 'Спальный мешок',     category: 'Строительство', type: 'bed' },
  { name: 'Печка',              category: 'Строительство', type: 'furnace' },
  { name: 'Большая печь',       category: 'Строительство', type: 'large_furnace' },
  { name: 'Костёр',             category: 'Строительство', type: 'campfire' },
  { name: 'Верстак 1',          category: 'Строительство', type: 'wb1' },
  { name: 'Верстак 2',          category: 'Строительство', type: 'wb2' },
  { name: 'Верстак 3',          category: 'Строительство', type: 'wb3' },
  { name: 'Нефтебочка',         category: 'Строительство', type: 'refinery' },
  { name: 'Смеситель',          category: 'Строительство', type: 'mixer' },

  // ------- Электрика -------
  { name: 'Провод эл.',          category: 'Электрика', type: 'wire' },
  { name: 'Солнечная панель',    category: 'Электрика', type: 'solar' },
  { name: 'Ветрогенератор',      category: 'Электрика', type: 'windmill' },
  { name: 'Малый аккумулятор',   category: 'Электрика', type: 'battery_small' },
  { name: 'Большой аккумулятор', category: 'Электрика', type: 'battery_large' },
  { name: 'Разветвитель',        category: 'Электрика', type: 'splitter' },
  { name: 'AND',                 category: 'Электрика', type: 'logic_and' },
  { name: 'OR',                  category: 'Электрика', type: 'logic_or' },
  { name: 'XOR',                 category: 'Электрика', type: 'logic_xor' },
  { name: 'Таймер',              category: 'Электрика', type: 'timer' },
  { name: 'Блокиратор',          category: 'Электрика', type: 'blocker' },
  { name: 'Счётчик',             category: 'Электрика', type: 'counter' },
  { name: 'HBHF-датчик',         category: 'Электрика', type: 'hbhf' },
  { name: 'Лампа',               category: 'Электрика', type: 'lamp' },
  { name: 'Прожектор',           category: 'Электрика', type: 'searchlight' },
  { name: 'Автотурель',          category: 'Электрика', type: 'auto_turret' },
  { name: 'Огнеметная турель',   category: 'Электрика', type: 'flame_turret' },
  { name: 'Сирена',              category: 'Электрика', type: 'siren' },
  { name: 'Кнопка',              category: 'Электрика', type: 'button' },
  { name: 'Переключатель',       category: 'Электрика', type: 'switch' },
  { name: 'Розетка',             category: 'Электрика', type: 'outlet' },

  // ------- Декор -------
  { name: 'Коврик',      category: 'Декор', type: 'rug' },
  { name: 'Картина',     category: 'Декор', type: 'painting' },
  { name: 'Флаг',        category: 'Декор', type: 'flag' },
  { name: 'Манекен',     category: 'Декор', type: 'mannequin' },
  { name: 'Череп на палке',category:'Декор', type: 'skull_trophy' },
  { name: 'Шкура медведя',category:'Декор', type: 'bear_rug' },
  { name: 'Лампа декор.',category: 'Декор', type: 'deco_lamp' },
  { name: 'Знак',        category: 'Декор', type: 'sign' },
  { name: 'Тыква-лампа', category: 'Декор', type: 'pumpkin_lamp' },

  // ------- Транспорт -------
  { name: 'Минивэн',        category: 'Транспорт', type: 'minicar' },
  { name: 'Хот-эйр',        category: 'Транспорт', type: 'balloon' },
  { name: 'Лодка',          category: 'Транспорт', type: 'rowboat' },
  { name: 'Моторная лодка', category: 'Транспорт', type: 'motorboat' },
  { name: 'Вертолёт',       category: 'Транспорт', type: 'minicopter' },
  { name: 'Скаути',         category: 'Транспорт', type: 'scrap_heli' },
  { name: 'Подлодка',       category: 'Транспорт', type: 'submarine' },
  { name: 'Лошадь',         category: 'Транспорт', type: 'horse' },
  { name: 'Седло',          category: 'Транспорт', type: 'saddle' },
  { name: 'Колесо',         category: 'Транспорт', type: 'wheel' },
  { name: 'Двигатель',      category: 'Транспорт', type: 'engine' },
];

GAME.ITEMS = ITEMS;

// =============================================================
// ГЕНЕРАЦИЯ ИКОНОК (Canvas 64×64, кэш)
// =============================================================
const iconCache = new Map();

function generateItemIcon(name, category, type) {
  const key = type || name;
  if (iconCache.has(key)) return iconCache.get(key);

  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(0, 0, 64, 64);

  drawIcon(ctx, type, name, category);

  // Рамка по краю
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.strokeRect(0.5, 0.5, 63, 63);

  iconCache.set(key, c);
  return c;
}
GAME.generateItemIcon = generateItemIcon;

function drawIcon(ctx, type, name, category) {
  // ---- общие хелперы ----
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const circ = (x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); };
  const line = (x1, y1, x2, y2, color, w = 2) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const poly = (pts, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); };

  switch (type) {
    // ================== Оружие ==================
    case 'rock':        circ(32, 34, 18, '#8a8a8a'); line(24, 28, 38, 42, '#555'); line(30, 22, 34, 40, '#555'); break;
    case 'torch':       rect(28, 12, 8, 36, '#8B5A2B'); poly([22,12, 42,12, 36,0, 28,0], '#ff6a00'); break;
    case 'wood_spear':  rect(30, 10, 4, 48, '#8B5A2B'); poly([26,4, 38,4, 32,-2], '#999'); poly([26,12,38,12,32,0], '#ccc'); break;
    case 'bone_spear':  rect(30, 10, 4, 48, '#dadac0'); poly([26,12,38,12,32,0], '#fff'); break;
    case 'machete':     poly([16,48, 52,20, 52,30, 24,54], '#bcbcbc'); rect(14, 48, 10, 8, '#5a3a1a'); break;
    case 'knife':       poly([16,36, 46,22, 48,28, 18,42], '#ccc'); rect(12, 34, 12, 10, '#5a3a1a'); break;
    case 'club':        rect(28, 8, 8, 48, '#8B5A2B'); circ(32, 12, 8, '#6a3a1a'); break;
    case 'bow':
      ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(32, 32, 22, -1.2, 1.2); ctx.stroke();
      line(32, 10, 32, 54, '#ddd', 1); break;
    case 'crossbow':    rect(10, 30, 44, 6, '#8B5A2B'); rect(24, 20, 8, 22, '#666'); line(10, 22, 54, 22, '#ddd', 1); break;
    case 'compound_bow':ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(32, 32, 24, -1.3, 1.3); ctx.stroke(); circ(16, 18, 4, '#888'); circ(16, 46, 4, '#888'); break;
    case 'revolver':    rect(14, 28, 28, 8, '#444'); circ(28, 32, 7, '#666'); rect(22, 34, 8, 18, '#5a3a1a'); break;
    case 'p2':          rect(12, 28, 36, 10, '#444'); rect(22, 36, 8, 16, '#333'); break;
    case 'm92':         rect(10, 26, 38, 10, '#333'); rect(20, 36, 10, 18, '#222'); rect(44, 24, 4, 4, '#888'); break;
    case 'python':      rect(14, 26, 30, 10, '#5a3a1a'); circ(30, 31, 7, '#888'); rect(22, 36, 8, 18, '#333'); break;
    case 'double_barrel':rect(6, 24, 46, 5, '#333'); rect(6, 30, 46, 5, '#333'); rect(46, 28, 12, 18, '#5a3a1a'); break;
    case 'pump_shotgun': rect(4, 28, 50, 6, '#333'); rect(30, 34, 12, 6, '#5a3a1a'); rect(44, 32, 14, 14, '#5a3a1a'); break;
    case 'spas':        rect(4, 28, 48, 6, '#333'); rect(30, 34, 14, 10, '#222'); rect(46, 30, 14, 12, '#555'); break;
    case 'tommy':       rect(6, 28, 40, 6, '#444'); circ(20, 40, 6, '#2a1a10'); rect(40, 34, 16, 14, '#5a3a1a'); break;
    case 'ak47':        rect(4, 30, 44, 6, '#555'); rect(20, 36, 10, 12, '#222'); rect(42, 32, 16, 12, '#5a3a1a'); break;
    case 'lr300':       rect(4, 28, 48, 8, '#333'); rect(22, 36, 10, 12, '#222'); rect(50, 30, 10, 10, '#888'); break;
    case 'mp5':         rect(8, 30, 30, 6, '#333'); rect(18, 36, 8, 14, '#222'); rect(36, 32, 18, 4, '#555'); break;
    case 'm249':        rect(4, 28, 52, 8, '#333'); rect(20, 36, 16, 14, '#555'); circ(14, 42, 6, '#444'); break;
    case 'm39':         rect(6, 28, 48, 6, '#555'); rect(26, 34, 10, 14, '#333'); rect(46, 24, 12, 4, '#888'); break;
    case 'bolt':        rect(4, 30, 54, 4, '#333'); rect(16, 26, 8, 4, '#888'); rect(30, 34, 12, 14, '#5a3a1a'); break;
    case 'l96':         rect(2, 30, 56, 4, '#222'); rect(22, 26, 6, 4, '#888'); rect(32, 34, 16, 14, '#333'); break;
    case 'sar':         rect(6, 30, 44, 5, '#555'); rect(24, 35, 10, 14, '#333'); rect(44, 30, 12, 10, '#5a3a1a'); break;
    case 'f1_grenade':  circ(32, 34, 14, '#445038'); rect(30, 16, 4, 8, '#888'); line(30, 20, 20, 28, '#888'); break;
    case 'flash':       rect(18, 18, 28, 28, '#bbb'); rect(22, 22, 20, 6, '#f9f'); break;
    case 'rpg':         rect(4, 30, 52, 6, '#333'); poly([0,26, 12,26, 12,40, 0,40], '#ff6a00'); rect(40, 36, 10, 12, '#5a3a1a'); break;
    case 'c4':          rect(16, 20, 32, 20, '#e8d16a'); rect(18, 24, 6, 4, '#444'); line(30, 24, 44, 18, '#cc1f1f', 2); break;
    case 'satchel':     rect(16, 24, 32, 22, '#5a3a1a'); rect(20, 28, 6, 6, '#999'); break;
    case 'rocket':      poly([8,30, 50,30, 58,34, 50,38, 8,38], '#555'); poly([50,30, 58,34, 50,38], '#cc1f1f'); poly([8,26, 16,34, 8,42], '#999'); break;

    // ================== Патроны ==================
    case 'ammo_rifle':   rect(18, 26, 28, 12, '#d7b04a'); rect(44, 26, 8, 12, '#b8860b'); rect(10, 28, 8, 8, '#999'); break;
    case 'ammo_rifle_hv':rect(18, 26, 28, 12, '#d7b04a'); rect(44, 26, 8, 12, '#b8860b'); rect(10, 28, 8, 8, '#4ad7d7'); break;
    case 'ammo_rifle_exp':rect(18,26,28,12,'#d7b04a'); rect(44,26,8,12,'#b8860b'); rect(10,28,8,8,'#ff6a00'); break;
    case 'ammo_pistol':  rect(22, 30, 20, 8, '#d7b04a'); rect(40, 30, 6, 8, '#b8860b'); rect(14, 31, 8, 6, '#999'); break;
    case 'ammo_pistol_hv':rect(22,30,20,8,'#d7b04a'); rect(40,30,6,8,'#b8860b'); rect(14,31,8,6,'#4ad7d7'); break;
    case 'ammo_shotgun': rect(18, 24, 14, 16, '#c93'); rect(18, 20, 14, 6, '#b00'); rect(36, 24, 14, 16, '#c93'); rect(36, 20, 14, 6, '#b00'); break;
    case 'ammo_shotgun_slug':rect(22,24,20,16,'#c93'); rect(22,20,20,6,'#888'); break;
    case 'arrow_wood':   line(8, 44, 56, 20, '#8B5A2B', 2); poly([50,20, 60,18, 54,24], '#ccc'); poly([8,44, 2,50, 12,48], '#fff'); break;
    case 'arrow_bone':   line(8, 44, 56, 20, '#ddd9c0', 2); poly([50,20, 60,18, 54,24], '#fff'); break;
    case 'arrow_fire':   line(8, 44, 56, 20, '#8B5A2B', 2); poly([46,18, 62,18, 54,28], '#ff6a00'); break;
    case 'arrow_hv':     line(8, 44, 56, 20, '#8B5A2B', 2); poly([50,20, 60,18, 54,24], '#4ad7d7'); break;
    case 'rpg_ammo':     poly([8,34, 50,34, 56,40, 50,46, 8,46], '#555'); poly([50,34, 56,40, 50,46], '#cc1f1f'); break;

    // ================== Броня ==================
    case 'hat':          poly([12,42, 52,42, 40,22, 24,22], '#6a3a1a'); rect(8, 40, 48, 6, '#5a2a10'); break;
    case 'balaclava':    circ(32, 32, 18, '#222'); rect(22, 28, 20, 4, '#888'); break;
    case 'helmet_coffee':poly([18,40, 46,40, 44,22, 20,22], '#c93'); rect(20, 38, 24, 6, '#a72'); break;
    case 'metal_helm':   poly([14,42, 50,42, 48,20, 16,20], '#888'); rect(16, 40, 32, 6, '#555'); break;
    case 'leather_vest': poly([14,20, 50,20, 46,52, 18,52], '#8B5A2B'); rect(28, 20, 8, 32, '#5a3a1a'); break;
    case 'vest':         poly([14,20, 50,20, 46,52, 18,52], '#556B2F'); break;
    case 'metal_chest':  poly([12,18, 52,18, 48,54, 16,54], '#888'); rect(28, 24, 8, 28, '#555'); break;
    case 'roadsign_vest':poly([14,20, 50,20, 46,52, 18,52], '#d7b04a'); rect(20, 28, 24, 4, '#c00'); rect(20, 36, 24, 4, '#c00'); break;
    case 'pants':        rect(18, 18, 12, 40, '#3a4a8a'); rect(34, 18, 12, 40, '#3a4a8a'); break;
    case 'roadsign_kilt':rect(16, 18, 32, 40, '#d7b04a'); rect(22, 24, 20, 4, '#c00'); break;
    case 'boots':        rect(12, 36, 40, 20, '#5a3a1a'); rect(12, 48, 40, 6, '#222'); break;
    case 'gas_mask':     circ(32, 32, 20, '#444'); circ(24, 30, 4, '#9c9'); circ(40, 30, 4, '#9c9'); circ(32, 44, 6, '#222'); break;
    case 'hazmat':       rect(20, 16, 24, 40, '#d7b04a'); circ(32, 24, 6, '#4488ff'); break;
    case 'heavy_plate':  rect(14, 16, 36, 40, '#999'); rect(20, 22, 24, 6, '#555'); rect(20, 32, 24, 6, '#555'); rect(20, 42, 24, 6, '#555'); break;
    case 'armor_insert': rect(20, 24, 24, 20, '#999'); rect(24, 28, 16, 12, '#666'); break;

    // ================== Еда ==================
    case 'bean_can':   rect(22, 16, 20, 34, '#556B2F'); rect(22, 20, 20, 6, '#3a4a1a'); rect(22, 36, 20, 6, '#3a4a1a'); circ(28, 30, 2, '#a3c'); break;
    case 'tuna':       rect(18, 22, 28, 22, '#4a90d9'); rect(18, 26, 28, 4, '#336'); rect(18, 38, 28, 4, '#336'); break;
    case 'pork':       poly([16,28, 48,24, 52,40, 18,44], '#d99'); rect(20, 30, 26, 4, '#b55'); break;
    case 'chicken':    poly([16,30, 48,30, 44,46, 20,46], '#d7b04a'); rect(20, 32, 24, 4, '#b88'); break;
    case 'fish':       poly([8,32, 48,20, 52,32, 48,44, 8,32], '#8abcd9'); circ(42, 28, 2, '#000'); poly([8,32, 0,24, 0,40], '#6aa'); break;
    case 'venison':    poly([16,24, 50,28, 48,44, 18,46], '#a55'); rect(22, 30, 22, 4, '#733'); break;
    case 'berries':    circ(22, 34, 6, '#c1224a'); circ(32, 30, 6, '#c1224a'); circ(42, 36, 6, '#c1224a'); line(32, 24, 28, 14, '#4a8', 2); break;
    case 'mushroom':   poly([16,36, 48,36, 42,22, 22,22], '#c66'); rect(26, 36, 12, 16, '#eee'); circ(26, 28, 2, '#fff'); circ(36, 30, 2, '#fff'); break;
    case 'corn':       poly([24,12, 40,12, 44,52, 20,52], '#e3c52b'); for (let y = 16; y < 50; y += 6) for (let x = 26; x < 40; x += 4) ctx.fillRect(x, y, 2, 2); break;
    case 'potato':     poly([18,30, 48,26, 50,44, 20,46], '#b88455'); circ(26, 34, 2, '#5a3a1a'); circ(40, 38, 2, '#5a3a1a'); break;
    case 'pumpkin':    circ(32, 34, 18, '#ff7f24'); line(24, 20, 26, 46, '#c55', 2); line(32, 18, 32, 50, '#c55', 2); line(40, 20, 38, 46, '#c55', 2); rect(30, 12, 4, 8, '#4a8'); break;
    case 'water':      rect(22, 12, 20, 44, '#4ad7ff'); rect(26, 8, 12, 6, '#888'); break;
    case 'canteen':    circ(32, 34, 18, '#556B2F'); rect(28, 14, 8, 8, '#888'); break;
    case 'coffee':     rect(22, 16, 20, 34, '#5a3a1a'); rect(22, 20, 20, 6, '#fff'); break;
    case 'chocolate':  rect(16, 20, 32, 24, '#6a3a1a'); for (let y = 22; y < 44; y += 6) for (let x = 18; x < 48; x += 8) ctx.fillRect(x, y, 6, 4); break;
    case 'candy':      circ(32, 34, 14, '#ff6aa0'); rect(6, 32, 18, 4, '#ff6aa0'); rect(40, 32, 18, 4, '#ff6aa0'); break;

    // ================== Медицина ==================
    case 'bandage':   rect(16, 24, 32, 16, '#fff'); rect(28, 20, 8, 24, '#c00'); rect(24, 28, 16, 8, '#c00'); break;
    case 'medkit':    rect(12, 18, 40, 32, '#fff'); rect(28, 24, 8, 20, '#c00'); rect(22, 30, 20, 8, '#c00'); rect(12, 18, 40, 6, '#555'); break;
    case 'syringe':   rect(12, 28, 32, 8, '#ccc'); rect(44, 30, 10, 4, '#999'); rect(54, 31, 8, 2, '#888'); rect(8, 26, 4, 12, '#4a4'); break;
    case 'antirad':   rect(22, 16, 20, 36, '#4ad7ff'); rect(22, 16, 20, 6, '#555'); rect(26, 26, 12, 18, '#fff'); rect(30, 30, 4, 10, '#444'); break;
    case 'blood':     rect(22, 16, 20, 36, '#c1224a'); rect(26, 20, 12, 24, '#ff6a8a'); break;
    case 'cloth':     rect(14, 20, 36, 24, '#eee'); line(14, 26, 50, 26, '#aaa', 1); line(14, 34, 50, 34, '#aaa', 1); break;

    // ================== Ресурсы ==================
    case 'wood':         rect(14, 22, 36, 20, '#8B5A2B'); circ(20, 32, 3, '#5a3a1a'); circ(32, 32, 3, '#5a3a1a'); circ(44, 32, 3, '#5a3a1a'); break;
    case 'stones':       circ(22, 36, 10, '#888'); circ(38, 30, 12, '#999'); circ(44, 42, 8, '#777'); break;
    case 'metal_ore':    poly([14,40, 30,20, 46,30, 50,46, 20,50], '#888'); rect(28, 28, 4, 4, '#c93'); rect(38, 34, 4, 4, '#c93'); break;
    case 'metal_frag':   poly([14,36, 30,22, 46,30, 50,44], '#bcbcbc'); line(20, 30, 44, 36, '#888', 1); break;
    case 'hq_metal':     poly([14,36, 30,22, 46,30, 50,44], '#ddd'); rect(24, 30, 16, 6, '#fff'); break;
    case 'sulfur':       circ(22, 36, 10, '#e3c52b'); circ(40, 32, 10, '#e3c52b'); circ(44, 44, 6, '#c9a40f'); break;
    case 'charcoal':     rect(18, 28, 28, 20, '#222'); rect(22, 24, 18, 6, '#333'); break;
    case 'scrap':        poly([14,40, 32,18, 50,38, 44,50, 20,50], '#b8a060'); line(22, 34, 38, 40, '#8a6a40', 1); break;
    case 'gunpowder':    rect(18, 24, 28, 22, '#444'); circ(24, 32, 2, '#666'); circ(32, 36, 2, '#666'); circ(40, 30, 2, '#666'); break;
    case 'explosives':   rect(22, 18, 20, 32, '#cc3'); rect(22, 18, 20, 6, '#900'); rect(30, 14, 4, 6, '#333'); break;
    case 'bones':        rect(10, 30, 44, 4, '#eee'); circ(12, 32, 6, '#eee'); circ(52, 32, 6, '#eee'); break;
    case 'skull':        circ(32, 30, 14, '#eee'); rect(22, 38, 20, 10, '#eee'); circ(26, 30, 3, '#000'); circ(38, 30, 3, '#000'); break;
    case 'raw_cloth':    rect(16, 24, 32, 20, '#c3b28f'); line(18, 30, 46, 30, '#8a8060', 1); line(18, 38, 46, 38, '#8a8060', 1); break;
    case 'leather':      rect(14, 22, 36, 24, '#7a4a1a'); line(18, 28, 46, 28, '#5a3a10', 1); break;
    case 'low_grade':    rect(22, 12, 20, 44, '#e3c52b'); rect(26, 8, 12, 6, '#555'); break;
    case 'fuel':         rect(18, 14, 28, 40, '#c00'); rect(22, 10, 20, 6, '#555'); rect(26, 22, 12, 16, '#fff'); break;
    case 'rope':         ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(32, 32, 14, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.arc(32, 32, 8, 0, 6.28); ctx.stroke(); break;
    case 'rag':          rect(16, 24, 32, 20, '#eee'); line(16, 30, 48, 30, '#aaa', 1); break;
    case 'spring':       ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = 16; y < 48; y += 4) { ctx.moveTo(20, y); ctx.lineTo(44, y + 2); } ctx.stroke(); break;
    case 'gear':         circ(32, 32, 16, '#888'); circ(32, 32, 6, '#3A3A3A'); for (let i = 0; i < 8; i++) { const a = i * 0.785; ctx.fillRect(32 + Math.cos(a) * 15 - 2, 32 + Math.sin(a) * 15 - 2, 4, 4); } break;
    case 'tech_trash':   rect(16, 22, 32, 20, '#4a7a4a'); rect(20, 26, 8, 4, '#c93'); rect(32, 26, 12, 4, '#c93'); break;
    case 'chip':         rect(14, 24, 36, 18, '#4a7a4a'); for (let x = 10; x < 52; x += 4) { ctx.fillStyle = '#888'; ctx.fillRect(x, 22, 2, 2); ctx.fillRect(x, 42, 2, 2); } break;
    case 'pipe':         rect(10, 28, 44, 8, '#888'); rect(10, 24, 6, 16, '#555'); rect(48, 24, 6, 16, '#555'); break;
    case 'sheet_metal':  rect(12, 18, 40, 28, '#bcbcbc'); line(12, 26, 52, 26, '#888', 1); line(12, 34, 52, 34, '#888', 1); line(12, 42, 52, 42, '#888', 1); break;
    case 'axle':         rect(6, 30, 52, 4, '#555'); circ(12, 32, 6, '#222'); circ(52, 32, 6, '#222'); break;

    // ================== Строительство ==================
    case 'building_plan':rect(14, 12, 36, 42, '#3a6acc'); rect(16, 14, 32, 38, '#4488ff'); line(18, 22, 46, 22, '#fff', 1); line(18, 30, 46, 30, '#fff', 1); line(18, 38, 46, 38, '#fff', 1); break;
    case 'hammer':       rect(14, 18, 20, 10, '#888'); rect(34, 20, 4, 30, '#8B5A2B'); rect(14, 20, 6, 6, '#555'); break;
    case 'axe':          poly([14,16, 28,18, 30,32, 14,28], '#888'); rect(30, 20, 4, 34, '#8B5A2B'); break;
    case 'pickaxe':      poly([8,14, 54,14, 56,20, 10,20], '#888'); rect(30, 20, 4, 36, '#8B5A2B'); break;
    case 'stone_hatchet':poly([14,16, 28,18, 30,32, 14,28], '#777'); rect(30, 20, 4, 34, '#5a3a1a'); break;
    case 'stone_pick':   poly([8,14, 54,14, 56,20, 10,20], '#777'); rect(30, 20, 4, 36, '#5a3a1a'); break;
    case 'door_wood':    rect(18, 10, 28, 48, '#8B5A2B'); circ(40, 34, 2, '#000'); line(22, 16, 22, 52, '#5a3a1a', 1); line(42, 16, 42, 52, '#5a3a1a', 1); break;
    case 'door_metal':   rect(18, 10, 28, 48, '#888'); circ(40, 34, 2, '#000'); rect(22, 16, 20, 4, '#555'); rect(22, 44, 20, 4, '#555'); break;
    case 'door_armored': rect(18, 10, 28, 48, '#555'); rect(22, 14, 20, 40, '#333'); circ(40, 34, 2, '#000'); break;
    case 'garage_door':  rect(10, 10, 44, 48, '#888'); for (let y = 14; y < 58; y += 6) line(10, y, 54, y, '#555', 1); break;
    case 'wire_fence':   for (let x = 12; x < 52; x += 6) line(x, 10, x, 54, '#888', 1); for (let y = 14; y < 54; y += 6) line(12, y, 52, y, '#888', 1); break;
    case 'barbed':       for (let x = 8; x < 56; x += 8) { line(x, 24, x + 4, 40, '#888', 1); line(x - 2, 32, x + 6, 32, '#888', 1); } break;
    case 'tc':           rect(16, 14, 32, 40, '#6a3a1a'); rect(18, 16, 28, 6, '#8B5A2B'); rect(18, 26, 28, 6, '#8B5A2B'); rect(18, 36, 28, 6, '#8B5A2B'); break;
    case 'codelock':     rect(18, 14, 28, 36, '#555'); rect(22, 18, 20, 10, '#000'); for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) circ(26 + x * 6, 32 + y * 5, 2, '#888'); break;
    case 'keylock':      rect(20, 18, 24, 28, '#888'); circ(32, 30, 4, '#000'); rect(30, 32, 4, 10, '#000'); break;
    case 'wood_box':     rect(10, 18, 44, 34, '#8B5A2B'); rect(10, 18, 44, 6, '#6a3a1a'); line(32, 18, 32, 52, '#5a3a1a', 1); break;
    case 'large_box':    rect(6, 14, 52, 42, '#8B5A2B'); rect(6, 14, 52, 8, '#6a3a1a'); rect(6, 32, 52, 4, '#6a3a1a'); break;
    case 'sleeping_bag': rect(10, 24, 44, 22, '#c1224a'); rect(10, 24, 44, 4, '#999'); break;
    case 'bed':          rect(8, 34, 48, 18, '#fff'); rect(8, 30, 48, 6, '#d44'); rect(8, 50, 48, 4, '#8B5A2B'); break;
    case 'furnace':      rect(14, 14, 36, 40, '#888'); rect(22, 30, 20, 18, '#ff6a00'); rect(22, 18, 20, 8, '#555'); break;
    case 'large_furnace':rect(6, 10, 52, 48, '#888'); rect(20, 28, 24, 22, '#ff6a00'); rect(20, 14, 24, 10, '#555'); break;
    case 'campfire':     poly([14,52, 50,52, 32,22], '#ff6a00'); rect(10, 50, 44, 6, '#5a3a1a'); break;
    case 'wb1':          rect(10, 28, 44, 24, '#c93'); rect(10, 24, 44, 6, '#888'); rect(14, 32, 12, 16, '#888'); break;
    case 'wb2':          rect(10, 28, 44, 24, '#e3c52b'); rect(10, 24, 44, 6, '#888'); circ(20, 40, 5, '#888'); circ(44, 40, 5, '#888'); break;
    case 'wb3':          rect(10, 28, 44, 24, '#cc3'); rect(10, 24, 44, 6, '#555'); rect(14, 32, 36, 4, '#222'); rect(14, 40, 36, 4, '#222'); break;
    case 'refinery':     rect(20, 16, 24, 40, '#888'); rect(20, 12, 24, 6, '#555'); rect(14, 24, 6, 12, '#555'); break;
    case 'mixer':        rect(18, 20, 28, 32, '#888'); poly([18,20, 46,20, 38,10, 26,10], '#555'); break;

    // ================== Электрика ==================
    case 'wire':         ctx.strokeStyle = '#ff7f24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 48); ctx.bezierCurveTo(20, 8, 44, 8, 56, 48); ctx.stroke(); break;
    case 'solar':        rect(10, 16, 44, 32, '#223'); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) rect(14 + x * 10, 20 + y * 10, 8, 8, '#4488ff'); break;
    case 'windmill':     rect(30, 30, 4, 28, '#888'); for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(32, 24); ctx.rotate(i * 2.09); ctx.fillStyle = '#eee'; ctx.fillRect(-2, -18, 4, 18); ctx.restore(); } break;
    case 'battery_small':rect(20, 20, 24, 28, '#4a8'); rect(26, 16, 12, 4, '#555'); rect(24, 28, 16, 12, '#fff'); break;
    case 'battery_large':rect(10, 14, 44, 40, '#4a8'); rect(22, 10, 8, 4, '#555'); rect(36, 10, 8, 4, '#555'); rect(16, 22, 32, 20, '#fff'); break;
    case 'splitter':     rect(14, 24, 36, 16, '#555'); circ(18, 32, 3, '#ff7f24'); circ(32, 32, 3, '#ff7f24'); circ(46, 32, 3, '#ff7f24'); break;
    case 'logic_and':    rect(18, 20, 28, 24, '#555'); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas'; ctx.fillText('AND', 22, 36); break;
    case 'logic_or':     rect(18, 20, 28, 24, '#555'); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas'; ctx.fillText('OR', 26, 36); break;
    case 'logic_xor':    rect(18, 20, 28, 24, '#555'); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas'; ctx.fillText('XOR', 22, 36); break;
    case 'timer':        circ(32, 32, 16, '#555'); line(32, 32, 32, 20, '#ff7f24', 2); line(32, 32, 42, 32, '#ff7f24', 2); break;
    case 'blocker':      rect(18, 20, 28, 24, '#555'); line(22, 24, 42, 40, '#c00', 3); break;
    case 'counter':      rect(16, 22, 32, 20, '#222'); ctx.fillStyle = '#ff7f24'; ctx.font = 'bold 14px Consolas'; ctx.fillText('42', 24, 36); break;
    case 'hbhf':         rect(18, 18, 28, 28, '#555'); circ(32, 32, 8, '#c00'); circ(32, 32, 3, '#fff'); break;
    case 'lamp':         poly([22,14, 42,14, 46,32, 18,32], '#eee'); rect(24, 32, 16, 6, '#555'); circ(32, 22, 4, '#ffe080'); break;
    case 'searchlight':  rect(20, 24, 24, 16, '#555'); circ(44, 32, 6, '#ffe080'); rect(22, 40, 20, 10, '#333'); break;
    case 'auto_turret':  rect(18, 30, 28, 16, '#555'); rect(44, 34, 16, 4, '#222'); rect(26, 46, 12, 10, '#333'); circ(56, 36, 2, '#c00'); break;
    case 'flame_turret': rect(18, 30, 28, 16, '#555'); rect(44, 32, 14, 6, '#ff6a00'); rect(26, 46, 12, 10, '#333'); break;
    case 'siren':        rect(24, 30, 16, 18, '#555'); circ(32, 26, 8, '#c00'); break;
    case 'button':       rect(18, 20, 28, 24, '#555'); circ(32, 32, 8, '#c00'); break;
    case 'switch':       rect(18, 20, 28, 24, '#555'); rect(28, 26, 10, 12, '#ff7f24'); break;
    case 'outlet':       rect(18, 20, 28, 24, '#eee'); circ(26, 30, 2, '#000'); circ(38, 30, 2, '#000'); rect(28, 38, 8, 2, '#000'); break;

    // ================== Декор ==================
    case 'rug':          rect(10, 20, 44, 24, '#c00'); rect(14, 24, 36, 16, '#e3c52b'); rect(18, 28, 28, 8, '#c00'); break;
    case 'painting':     rect(14, 12, 36, 40, '#8B5A2B'); rect(18, 16, 28, 32, '#4a7aff'); circ(28, 26, 4, '#ffe080'); break;
    case 'flag':         rect(14, 10, 4, 48, '#555'); rect(18, 12, 28, 18, '#c00'); break;
    case 'mannequin':    circ(32, 18, 6, '#ddd'); rect(24, 24, 16, 22, '#ddd'); rect(28, 46, 8, 12, '#ddd'); break;
    case 'skull_trophy': rect(30, 30, 4, 28, '#8B5A2B'); circ(32, 24, 10, '#eee'); circ(28, 24, 2, '#000'); circ(36, 24, 2, '#000'); break;
    case 'bear_rug':     circ(32, 30, 16, '#5a3a1a'); circ(22, 20, 6, '#5a3a1a'); circ(42, 20, 6, '#5a3a1a'); circ(18, 40, 6, '#5a3a1a'); circ(46, 40, 6, '#5a3a1a'); break;
    case 'deco_lamp':    rect(28, 40, 8, 14, '#555'); poly([18,40, 46,40, 40,20, 24,20], '#ffe080'); break;
    case 'sign':         rect(28, 30, 4, 26, '#5a3a1a'); rect(14, 14, 36, 20, '#8B5A2B'); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Consolas'; ctx.fillText('SIGN', 18, 26); break;
    case 'pumpkin_lamp': circ(32, 34, 18, '#ff7f24'); poly([22,32, 28,28, 26,36], '#000'); poly([38,32, 42,28, 40,36], '#000'); poly([24,44, 32,40, 40,44], '#000'); break;

    // ================== Транспорт ==================
    case 'minicar':      rect(8, 32, 48, 14, '#c00'); rect(16, 24, 32, 10, '#c00'); circ(18, 48, 6, '#222'); circ(46, 48, 6, '#222'); break;
    case 'balloon':      circ(32, 22, 16, '#c00'); rect(22, 40, 20, 10, '#8B5A2B'); line(22, 40, 22, 34, '#888', 1); line(42, 40, 42, 34, '#888', 1); break;
    case 'rowboat':      poly([6,40, 58,40, 52,52, 12,52], '#8B5A2B'); rect(20, 30, 24, 10, '#8B5A2B'); break;
    case 'motorboat':    poly([6,40, 58,40, 52,52, 12,52], '#ccc'); rect(38, 28, 14, 12, '#555'); break;
    case 'minicopter':   circ(32, 36, 10, '#c00'); rect(6, 34, 52, 2, '#888'); rect(40, 26, 16, 4, '#888'); circ(18, 50, 4, '#222'); circ(46, 50, 4, '#222'); break;
    case 'scrap_heli':   rect(10, 28, 44, 16, '#444'); rect(6, 26, 52, 2, '#888'); rect(44, 20, 14, 4, '#888'); rect(14, 44, 8, 10, '#222'); break;
    case 'submarine':    poly([6,30, 58,30, 54,42, 10,42], '#ffe080'); rect(26, 22, 12, 10, '#ffe080'); circ(32, 26, 3, '#4488ff'); break;
    case 'horse':        rect(16, 26, 32, 18, '#8B5A2B'); rect(44, 18, 10, 14, '#8B5A2B'); rect(18, 44, 4, 12, '#5a3a1a'); rect(40, 44, 4, 12, '#5a3a1a'); break;
    case 'saddle':       poly([14,36, 50,36, 44,24, 20,24], '#5a3a1a'); rect(20, 36, 24, 6, '#4a2a10'); break;
    case 'wheel':        circ(32, 32, 18, '#222'); circ(32, 32, 6, '#888'); for (let i = 0; i < 6; i++) { const a = i * 1.047; line(32, 32, 32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16, '#888', 1); } break;
    case 'engine':       rect(12, 20, 40, 28, '#888'); rect(14, 14, 10, 8, '#555'); rect(30, 14, 10, 8, '#555'); rect(46, 14, 6, 8, '#555'); break;

    // ================== Fallback ==================
    default:
      // Цвет по категории + первая буква
      const colors = { 'Оружие':'#888','Патроны':'#d7b04a','Броня':'#6aa','Еда':'#a4a','Медицина':'#c33','Ресурсы':'#8a5','Строительство':'#8B5A2B','Электрика':'#ff7f24','Декор':'#a5a','Транспорт':'#4a8' };
      circ(32, 32, 20, colors[category] || '#777');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Consolas';
      ctx.textAlign = 'center';
      ctx.fillText((name || '?').charAt(0).toUpperCase(), 32, 39);
      ctx.textAlign = 'start';
  }
}

// =============================================================
// СОСТОЯНИЕ ИНВЕНТАРЯ
// =============================================================
const INV_COLS = 6, INV_ROWS = 8;
const INV_SIZE = INV_COLS * INV_ROWS; // 48
const HOTBAR_SIZE = 9;
const ARMOR_SLOTS = ['head', 'chest', 'legs', 'feet', 'insert'];

const inv = {
  slots: new Array(INV_SIZE).fill(null),
  hotbar: new Array(HOTBAR_SIZE).fill(null),
  armor: { head: null, chest: null, legs: null, feet: null, insert: null },
  activeHotbar: 0,
};
GAME.inv = inv;

function firstEmpty(arr) { return arr.findIndex(s => s === null); }

function addItemToInv(item) {
  const idx = firstEmpty(inv.slots);
  if (idx === -1) {
    const hbIdx = firstEmpty(inv.hotbar);
    if (hbIdx === -1) return false;
    inv.hotbar[hbIdx] = { ...item, count: 1 };
    renderHotbar();
    return true;
  }
  inv.slots[idx] = { ...item, count: 1 };
  renderInv();
  return true;
}
GAME.addItemToInv = addItemToInv;

// =============================================================
// КАТАЛОГ (левая панель)
// =============================================================
const CATEGORIES = ['ВСЁ', 'Оружие', 'Патроны', 'Броня', 'Еда', 'Медицина', 'Ресурсы', 'Строительство', 'Электрика', 'Декор', 'Транспорт'];
let currentCategory = 'ВСЁ';
let currentSearch = '';

const catalogTabs = document.getElementById('catalog-tabs');
const catalogGrid = document.getElementById('catalog-grid');
const catalogSearch = document.getElementById('catalog-search');

function renderCatalogTabs() {
  catalogTabs.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const tab = document.createElement('div');
    tab.className = 'cat-tab' + (cat === currentCategory ? ' active' : '');
    tab.textContent = cat.toUpperCase();
    tab.addEventListener('click', () => {
      currentCategory = cat;
      renderCatalogTabs();
      renderCatalog();
    });
    catalogTabs.appendChild(tab);
  });
}

function renderCatalog() {
  catalogGrid.innerHTML = '';
  const q = currentSearch.trim().toLowerCase();
  const filtered = ITEMS.filter(it => {
    if (currentCategory !== 'ВСЁ' && it.category !== currentCategory) return false;
    if (q && !it.name.toLowerCase().includes(q)) return false;
    return true;
  });
  filtered.forEach(it => {
    const card = document.createElement('div');
    card.className = 'catalog-card';
    const ic = generateItemIcon(it.name, it.category, it.type);
    card.appendChild(ic.cloneNode(true));
    const n = document.createElement('div');
    n.className = 'name'; n.textContent = it.name;
    card.appendChild(n);
    card.title = it.name + ' — ' + it.category;
    card.addEventListener('click', () => {
      addItemToInv(it);
    });
    catalogGrid.appendChild(card);
  });
}

catalogSearch.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderCatalog();
});

// =============================================================
// ИНВЕНТАРЬ (центр)
// =============================================================
const invGrid = document.getElementById('inv-grid');
const armorRow = document.getElementById('armor-row');
const ctxMenu = document.getElementById('ctx-menu');
let ctxTarget = null;

function createSlot(cls, idx, kind, value) {
  const slot = document.createElement('div');
  slot.className = cls;
  slot.dataset.kind = kind; // 'inv' | 'hotbar' | 'armor'
  slot.dataset.idx = idx;
  if (value) {
    const node = generateItemIcon(value.name, value.category, value.type).cloneNode(true);
    node.draggable = true;
    slot.appendChild(node);
    slot.title = value.name;
    if (value.count > 1) {
      const cnt = document.createElement('span');
      cnt.className = 'slot-count';
      cnt.textContent = value.count;
      slot.appendChild(cnt);
    }
    // Drag start
    node.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ kind, idx }));
      e.dataTransfer.effectAllowed = 'move';
    });
    // ПКМ — контекстное меню
    slot.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      ctxTarget = { kind, idx };
      ctxMenu.style.left = e.clientX + 'px';
      ctxMenu.style.top = e.clientY + 'px';
      ctxMenu.style.display = 'block';
    });
  }
  slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const data = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    moveItem(data, { kind, idx });
  });
  return slot;
}

function moveItem(from, to) {
  const getSrc = (f) => {
    if (f.kind === 'inv') return inv.slots[f.idx];
    if (f.kind === 'hotbar') return inv.hotbar[f.idx];
    if (f.kind === 'armor') return inv.armor[f.idx];
  };
  const setSrc = (f, v) => {
    if (f.kind === 'inv') inv.slots[f.idx] = v;
    else if (f.kind === 'hotbar') inv.hotbar[f.idx] = v;
    else if (f.kind === 'armor') inv.armor[f.idx] = v;
  };

  const a = getSrc(from), b = getSrc(to);
  if (!a) return;
  // Armor слот принимает только броню
  if (to.kind === 'armor' && a.category !== 'Броня') return;
  setSrc(from, b || null);
  setSrc(to, a);
  renderInv();
  renderHotbar();
}

function renderInv() {
  invGrid.innerHTML = '';
  for (let i = 0; i < INV_SIZE; i++) {
    invGrid.appendChild(createSlot('inv-slot', i, 'inv', inv.slots[i]));
  }
  // Armor
  armorRow.querySelectorAll('.armor-slot').forEach(el => {
    el.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'label';
    const map = { head: 'Шлем', chest: 'Нагрудник', legs: 'Штаны', feet: 'Ботинки', insert: 'Вставка' };
    label.textContent = map[el.dataset.armor];
    el.appendChild(label);

    const val = inv.armor[el.dataset.armor];
    if (val) {
      const node = generateItemIcon(val.name, val.category, val.type).cloneNode(true);
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'armor', idx: el.dataset.armor }));
      });
      el.appendChild(node);
    }
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault(); el.classList.remove('drag-over');
      const data = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
      moveItem(data, { kind: 'armor', idx: el.dataset.armor });
    });
  });
}

// =============================================================
// ХОТБАР (низ экрана, всегда виден)
// =============================================================
const hotbarEl = document.getElementById('hotbar');

function renderHotbar() {
  hotbarEl.innerHTML = '';
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot' + (i === inv.activeHotbar ? ' active' : '');
    slot.dataset.kind = 'hotbar';
    slot.dataset.idx = i;

    const key = document.createElement('span');
    key.className = 'slot-key'; key.textContent = (i + 1);
    slot.appendChild(key);

    const v = inv.hotbar[i];
    if (v) {
      const node = generateItemIcon(v.name, v.category, v.type).cloneNode(true);
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'hotbar', idx: i }));
      });
      slot.appendChild(node);
      slot.title = v.name;
      if (v.count > 1) {
        const cnt = document.createElement('span');
        cnt.className = 'slot-count'; cnt.textContent = v.count;
        slot.appendChild(cnt);
      }
    }
    slot.addEventListener('dragover', (e) => { e.preventDefault(); });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
      moveItem(data, { kind: 'hotbar', idx: i });
    });
    slot.addEventListener('click', () => {
      if (!document.getElementById('inventory-overlay').classList.contains('open')) {
        setActiveHotbar(i);
      }
    });
    hotbarEl.appendChild(slot);
  }
  GAME.emit('hotbarChange', inv.hotbar[inv.activeHotbar], inv.activeHotbar);
}

function setActiveHotbar(i) {
  inv.activeHotbar = (i + HOTBAR_SIZE) % HOTBAR_SIZE;
  renderHotbar();
}
GAME.setActiveHotbar = setActiveHotbar;
GAME.getActiveItem = () => inv.hotbar[inv.activeHotbar];

// =============================================================
// ВВОД: TAB, 1-9, колесо мыши, ПКМ-меню, Drop
// =============================================================
const invOverlay = document.getElementById('inventory-overlay');

function toggleInventory() {
  const willOpen = !invOverlay.classList.contains('open');
  invOverlay.classList.toggle('open', willOpen);
  if (willOpen) {
    renderCatalogTabs();
    renderCatalog();
    renderInv();
    renderHotbar();
    GAME.controls?.unlock?.();
  }
}
GAME.on('toggleInventory', toggleInventory);

addEventListener('keydown', (e) => {
  // 1..9 — выбор хотбара
  if (!invOverlay.classList.contains('open') && /^Digit[1-9]$/.test(e.code)) {
    setActiveHotbar(+e.code.slice(-1) - 1);
  }
  if (e.code === 'Escape') {
    if (invOverlay.classList.contains('open')) invOverlay.classList.remove('open');
    ctxMenu.style.display = 'none';
  }
});

// Колесо мыши — переключение хотбара (когда инвентарь ЗАКРЫТ)
addEventListener('wheel', (e) => {
  if (invOverlay.classList.contains('open')) return;
  const dir = Math.sign(e.deltaY);
  setActiveHotbar(inv.activeHotbar + dir);
}, { passive: true });

// Контекстное меню
ctxMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (action === 'drop' && ctxTarget) {
    if (ctxTarget.kind === 'inv') inv.slots[ctxTarget.idx] = null;
    else if (ctxTarget.kind === 'hotbar') inv.hotbar[ctxTarget.idx] = null;
    else if (ctxTarget.kind === 'armor') inv.armor[ctxTarget.idx] = null;
    renderInv(); renderHotbar();
  }
  ctxMenu.style.display = 'none';
  ctxTarget = null;
});
addEventListener('click', (e) => {
  if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
});

// =============================================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================================
renderHotbar();
// Каталог и инвентарь будут отрисованы при первом открытии TAB

// Пред-генерация всех иконок в фоне (чтобы первое открытие было быстрым)
requestIdleCallback?.(() => { ITEMS.forEach(it => generateItemIcon(it.name, it.category, it.type)); })
  ?? setTimeout(() => { ITEMS.forEach(it => generateItemIcon(it.name, it.category, it.type)); }, 500);
