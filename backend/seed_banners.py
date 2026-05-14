"""
seed.py — заполняет MongoDB проекта Строй-Двор.
Поддержка трёх языков: RU / KZ / EN

Использование:
  python seed.py                              — заполнить только ПУСТЫЕ коллекции
  python seed.py --reset                      — удалить всё и залить заново
  python seed.py --reset --only categories    — сбросить только указанные
"""

import asyncio, sys
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "stroydvorkz"
NOW = datetime.now(timezone.utc)

# ══════════════════════════════════════════════════════════════════════════════
# CATEGORIES — с тройной локализацией (RU / KZ / EN)
# ══════════════════════════════════════════════════════════════════════════════
CATEGORIES = [

    # ── Кровля ────────────────────────────────────────────────────────────────
    {"name":"Кровля", "name_ru":"Кровля", "name_kz":"Шатыр материалдары", "name_en":"Roofing",
     "slug":"krovlya", "icon":"🏠", "sort_order":10, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/krovlya.jpg",
     "seo_title_ru":"Кровельные материалы купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада шатыр материалдарын сатып алыңыз — Строй-Двор",
     "seo_title_en":"Buy Roofing Materials in Astana — Stroydvor",
     "seo_description_ru":"Широкий выбор кровельных материалов: металлочерепица, профнастил, мягкая кровля. Доставка по Астане.",
     "seo_description_kz":"Кең ассортимент: металл черепица, профнастил, жұмсақ шатыр. Астана бойынша жеткізу.",
     "seo_description_en":"Wide range of roofing: metal tiles, corrugated sheets, soft roofing. Delivery across Astana.",
     "keywords_ru":"кровельные материалы, металлочерепица, профнастил купить Астана",
     "keywords_kz":"шатыр материалдары, металл черепица, профнастил Астана",
     "keywords_en":"roofing materials Astana, metal tiles, corrugated sheets buy"},

    {"name":"Металлочерепица", "name_ru":"Металлочерепица", "name_kz":"Металл черепица", "name_en":"Metal Tiles",
     "slug":"metallocherepica", "icon":"", "sort_order":1, "parent_category":"Кровля", "is_active":True,
     "image_url":"https://example.com/img/metallocherepica.jpg",
     "seo_title_ru":"Металлочерепица купить в Астане — цены, фото, доставка",
     "seo_title_kz":"Астанада металл черепица сатып алыңыз — бағалар, фото",
     "seo_title_en":"Buy Metal Roof Tiles in Astana — Prices, Photos, Delivery",
     "seo_description_ru":"Металлочерепица Монтеррей, Супермонтеррей, Макси. Доставка по Астане.",
     "seo_description_kz":"Металл черепица Монтерей, Супермонтерей. Астана бойынша жеткізу.",
     "seo_description_en":"Metal tiles Monterrey, Supermonterrey, Maxi. Delivery in Astana.",
     "keywords_ru":"металлочерепица купить Астана, металлочерепица цена",
     "keywords_kz":"металл черепица Астана, черепица бағасы",
     "keywords_en":"metal roof tiles Astana, buy metal tiles"},

    {"name":"Профнастил", "name_ru":"Профнастил", "name_kz":"Профнастил", "name_en":"Corrugated Sheets",
     "slug":"profnastil", "icon":"", "sort_order":2, "parent_category":"Кровля", "is_active":True,
     "image_url":"https://example.com/img/profnastil.jpg",
     "seo_title_ru":"Профнастил купить в Астане — С8, С10, С20, НС35",
     "seo_title_kz":"Астанада профнастил сатып алыңыз — С8, С10",
     "seo_title_en":"Buy Corrugated Sheets in Astana — C8, C10, C20",
     "seo_description_ru":"Профнастил для кровли и забора. Все марки. Доставка по Астане.",
     "seo_description_kz":"Шатыр мен қора үшін профнастил. Барлық маркалар. Жеткізу.",
     "seo_description_en":"Corrugated sheets for roofing and fencing. All grades. Delivery.",
     "keywords_ru":"профнастил купить Астана, профнастил для кровли",
     "keywords_kz":"профнастил Астана, шатыр профнастил",
     "keywords_en":"corrugated sheets Astana, roofing sheets buy"},

    {"name":"Водостоки", "name_ru":"Водостоки", "name_kz":"Су ағызатын жүйелер", "name_en":"Drainage Systems",
     "slug":"vodostoki", "icon":"", "sort_order":4, "parent_category":"Кровля", "is_active":True,
     "image_url":"https://example.com/img/vodostoki.jpg",
     "seo_title_ru":"Водосточные системы купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада су ағызатын жүйелер — Строй-Двор",
     "seo_title_en":"Buy Drainage Systems in Astana — Stroydvor",
     "seo_description_ru":"ПВХ и металлические водосточные системы. Желоба, трубы. Доставка.",
     "seo_description_kz":"ПВХ және металл су ағызу жүйелері. Жеткізу.",
     "seo_description_en":"PVC and metal gutter systems. Gutters, pipes. Delivery.",
     "keywords_ru":"водосток купить Астана, водосточная система",
     "keywords_kz":"су ағызу жүйесі Астана",
     "keywords_en":"gutters Astana, drainage system buy"},

    # ── Фасады ────────────────────────────────────────────────────────────────
    {"name":"Фасады", "name_ru":"Фасады", "name_kz":"Қасбет материалдары", "name_en":"Facade Materials",
     "slug":"fasady", "icon":"🧱", "sort_order":20, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/fasady.jpg",
     "seo_title_ru":"Фасадные материалы купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада қасбет материалдарын сатып алыңыз",
     "seo_title_en":"Buy Facade Materials in Astana — Stroydvor",
     "seo_description_ru":"Сайдинг, металлосайдинг, фасадные панели, штукатурка. Доставка.",
     "seo_description_kz":"Сайдинг, металл сайдинг, қасбет панельдер, сылақ. Жеткізу.",
     "seo_description_en":"Siding, metal siding, facade panels, plaster. Delivery.",
     "keywords_ru":"фасадные материалы Астана, сайдинг цена",
     "keywords_kz":"қасбет материалдары Астана, сайдинг бағасы",
     "keywords_en":"facade materials Astana, siding price"},

    {"name":"Виниловый сайдинг", "name_ru":"Виниловый сайдинг", "name_kz":"Винил сайдинг", "name_en":"Vinyl Siding",
     "slug":"vinilovyj-sajding", "icon":"", "sort_order":1, "parent_category":"Фасады", "is_active":True,
     "image_url":"https://example.com/img/vinilovyj-sajding.jpg",
     "seo_title_ru":"Виниловый сайдинг купить в Астане — каталог",
     "seo_title_kz":"Астанада винил сайдинг сатып алыңыз",
     "seo_title_en":"Buy Vinyl Siding in Astana — Catalog",
     "seo_description_ru":"Виниловый сайдинг для фасадов. Большой выбор цветов. Доставка.",
     "seo_description_kz":"Қасбет үшін винил сайдинг. Көп түс. Жеткізу.",
     "seo_description_en":"Vinyl siding for facades. Wide color range. Delivery.",
     "keywords_ru":"виниловый сайдинг купить Астана",
     "keywords_kz":"винил сайдинг Астана",
     "keywords_en":"vinyl siding Astana buy"},

    {"name":"Металлосайдинг", "name_ru":"Металлосайдинг", "name_kz":"Металл сайдинг", "name_en":"Metal Siding",
     "slug":"metallosajding", "icon":"", "sort_order":2, "parent_category":"Фасады", "is_active":True,
     "image_url":"https://example.com/img/metallosajding.jpg",
     "seo_title_ru":"Металлосайдинг купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада металл сайдинг — Строй-Двор",
     "seo_title_en":"Buy Metal Siding in Astana — Stroydvor",
     "seo_description_ru":"Металлосайдинг под дерево, кирпич. Стальные фасадные панели.",
     "seo_description_kz":"Ағаш, кірпіш имитациясы металл сайдинг.",
     "seo_description_en":"Metal siding wood and brick imitation. Steel facade panels.",
     "keywords_ru":"металлосайдинг Астана, стальной сайдинг",
     "keywords_kz":"металл сайдинг Астана",
     "keywords_en":"metal siding Astana buy"},

    # ── Краски ────────────────────────────────────────────────────────────────
    {"name":"Краски", "name_ru":"Краски", "name_kz":"Бояулар", "name_en":"Paints & Coatings",
     "slug":"kraski", "icon":"🎨", "sort_order":30, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/kraski.jpg",
     "seo_title_ru":"Краски и лаки купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада бояулар мен лак сатып алыңыз",
     "seo_title_en":"Buy Paints & Varnishes in Astana — Stroydvor",
     "seo_description_ru":"Краски фасадные, интерьерные, антикоррозионные, лаки. Доставка.",
     "seo_description_kz":"Қасбет, интерьер, антикоррозиялық бояулар. Жеткізу.",
     "seo_description_en":"Facade, interior, anti-corrosion paints and varnishes. Delivery.",
     "keywords_ru":"краски купить Астана, краска для фасада",
     "keywords_kz":"бояулар Астана, қасбет бояуы",
     "keywords_en":"paints Astana, facade paint buy"},

    # ── Сухие смеси ───────────────────────────────────────────────────────────
    {"name":"Сухие смеси", "name_ru":"Сухие смеси", "name_kz":"Құрғақ қоспалар", "name_en":"Dry Mixes",
     "slug":"suhie-smesi", "icon":"🪣", "sort_order":40, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/smesi.jpg",
     "seo_title_ru":"Сухие строительные смеси купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада құрғақ құрылыс қоспалары — Строй-Двор",
     "seo_title_en":"Buy Dry Construction Mixes in Astana — Stroydvor",
     "seo_description_ru":"Цемент, штукатурка, шпаклёвка, плиточный клей. Доставка. Оптом и в розницу.",
     "seo_description_kz":"Цемент, сылақ, тақта желімі. Жеткізу. Көтерме және бөлшек.",
     "seo_description_en":"Cement, plaster, tile adhesive. Delivery. Wholesale and retail.",
     "keywords_ru":"сухие смеси купить Астана, цемент, плиточный клей",
     "keywords_kz":"құрғақ қоспалар Астана, цемент, тақта желімі",
     "keywords_en":"dry mixes Astana, cement buy, tile adhesive"},

    {"name":"Цемент и бетон", "name_ru":"Цемент и бетон", "name_kz":"Цемент және бетон", "name_en":"Cement & Concrete",
     "slug":"cement-i-beton", "icon":"", "sort_order":1, "parent_category":"Сухие смеси", "is_active":True,
     "image_url":"",
     "seo_title_ru":"Цемент купить в Астане — М400, М500",
     "seo_title_kz":"Астанада цемент сатып алыңыз — М400, М500",
     "seo_title_en":"Buy Cement in Astana — M400, M500",
     "seo_description_ru":"Портландцемент М400, М500. 25 и 50 кг. Оптом. Доставка.",
     "seo_description_kz":"Портланд цемент М400, М500. 25 және 50 кг. Жеткізу.",
     "seo_description_en":"Portland cement M400, M500. 25 and 50 kg bags. Delivery.",
     "keywords_ru":"цемент купить Астана, цемент М500",
     "keywords_kz":"цемент Астана, цемент М500",
     "keywords_en":"cement Astana, buy cement M500"},

    {"name":"Плиточный клей", "name_ru":"Плиточный клей", "name_kz":"Тақта желімі", "name_en":"Tile Adhesive",
     "slug":"plitochnyj-klej", "icon":"", "sort_order":3, "parent_category":"Сухие смеси", "is_active":True,
     "image_url":"",
     "seo_title_ru":"Плиточный клей купить в Астане — Ceresit, Litokol",
     "seo_title_kz":"Астанада тақта желімі — Ceresit, Litokol",
     "seo_title_en":"Buy Tile Adhesive in Astana — Ceresit, Litokol",
     "seo_description_ru":"Клей для плитки, керамогранита. С1, С2, эластичный.",
     "seo_description_kz":"Кафель, керамогранит желімі. С1, С2, икемді.",
     "seo_description_en":"Adhesive for tiles and porcelain. C1, C2, flexible.",
     "keywords_ru":"плиточный клей Астана, Ceresit CM",
     "keywords_kz":"тақта желімі Астана, Ceresit",
     "keywords_en":"tile adhesive Astana, Ceresit buy"},

    # ── Изоляция ──────────────────────────────────────────────────────────────
    {"name":"Изоляция", "name_ru":"Изоляция", "name_kz":"Жылу оқшаулау", "name_en":"Insulation",
     "slug":"izolyaciya", "icon":"🛡️", "sort_order":50, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/izolyaciya.jpg",
     "seo_title_ru":"Тепло- и звукоизоляция купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада жылу және дыбыс оқшаулау — Строй-Двор",
     "seo_title_en":"Buy Thermal & Sound Insulation in Astana — Stroydvor",
     "seo_description_ru":"Минвата, пенопласт, пеноплекс, пароизоляция. Утепление. Доставка.",
     "seo_description_kz":"Минвата, пенопласт, пеноплекс. Жылу оқшаулау. Жеткізу.",
     "seo_description_en":"Mineral wool, foam, extruded polystyrene, vapour barrier. Delivery.",
     "keywords_ru":"утеплитель купить Астана, минвата, пенопласт",
     "keywords_kz":"жылу оқшаулау Астана, минвата, пенопласт",
     "keywords_en":"insulation Astana, mineral wool, foam board buy"},

    {"name":"Минеральная вата", "name_ru":"Минеральная вата", "name_kz":"Минералды мақта", "name_en":"Mineral Wool",
     "slug":"mineralnaya-vata", "icon":"", "sort_order":1, "parent_category":"Изоляция", "is_active":True,
     "image_url":"",
     "seo_title_ru":"Минеральная вата купить в Астане — Rockwool, ISOVER",
     "seo_title_kz":"Астанада минералды мақта — Rockwool, ISOVER",
     "seo_title_en":"Buy Mineral Wool in Astana — Rockwool, ISOVER",
     "seo_description_ru":"Каменная и стекловата. Плиты и рулоны. Доставка.",
     "seo_description_kz":"Тас және шыны мақта. Плита және рулон. Жеткізу.",
     "seo_description_en":"Stone wool and glass wool. Boards and rolls. Delivery.",
     "keywords_ru":"минвата Астана, Rockwool, базальтовая вата",
     "keywords_kz":"минералды мақта Астана, Rockwool",
     "keywords_en":"mineral wool Astana, Rockwool buy"},

    {"name":"Пенопласт и пеноплекс", "name_ru":"Пенопласт и пеноплекс", "name_kz":"Пенопласт және пеноплекс", "name_en":"Foam & XPS Board",
     "slug":"penoplast-i-penopleks", "icon":"", "sort_order":2, "parent_category":"Изоляция", "is_active":True,
     "image_url":"",
     "seo_title_ru":"Пенопласт и пеноплекс купить в Астане",
     "seo_title_kz":"Астанада пенопласт және пеноплекс сатып алыңыз",
     "seo_title_en":"Buy Styrofoam & XPS in Astana",
     "seo_description_ru":"Пенопласт ПСБ-С-25, ПСБ-С-35. Пеноплекс: Комфорт, Фундамент.",
     "seo_description_kz":"Пенопласт ПСБ-С-25, 35. Пеноплекс: Комфорт, Фундамент.",
     "seo_description_en":"EPS ПСБ-С-25, ПСБ-С-35. Penoplex: Comfort, Foundation.",
     "keywords_ru":"пенопласт купить Астана, пеноплекс",
     "keywords_kz":"пенопласт Астана, пеноплекс",
     "keywords_en":"styrofoam Astana, XPS board buy"},

    # ── Сантехника ────────────────────────────────────────────────────────────
    {"name":"Сантехника", "name_ru":"Сантехника", "name_kz":"Сантехника", "name_en":"Plumbing",
     "slug":"santehnika", "icon":"🚿", "sort_order":60, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/santehnika.jpg",
     "seo_title_ru":"Сантехника купить в Астане — Строй-Двор",
     "seo_title_kz":"Астанада сантехника — Строй-Двор",
     "seo_title_en":"Buy Plumbing in Astana — Stroydvor",
     "seo_description_ru":"Смесители, унитазы, ванны, трубы. Всё для ванной. Доставка.",
     "seo_description_kz":"Кран, унитаз, ванна, құбыр. Жеткізу.",
     "seo_description_en":"Mixers, toilets, baths, pipes. Everything for bathroom. Delivery.",
     "keywords_ru":"сантехника Астана, смеситель купить, унитаз",
     "keywords_kz":"сантехника Астана, кран, унитаз",
     "keywords_en":"plumbing Astana, buy mixer, toilet"},

    # ── Инструменты ───────────────────────────────────────────────────────────
    {"name":"Инструменты", "name_ru":"Инструменты", "name_kz":"Құралдар", "name_en":"Tools",
     "slug":"instrumenty", "icon":"🔧", "sort_order":70, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/instrumenty.jpg",
     "seo_title_ru":"Инструменты купить в Астане — ручные и электрические",
     "seo_title_kz":"Астанада құралдар — қол және электрлік",
     "seo_title_en":"Buy Tools in Astana — Hand & Power Tools",
     "seo_description_ru":"Дрели, болгарки, перфораторы, ручной инструмент. Makita, Bosch.",
     "seo_description_kz":"Бұрғы, болгарка, перфоратор. Makita, Bosch. Жеткізу.",
     "seo_description_en":"Drills, grinders, rotary hammers, hand tools. Makita, Bosch.",
     "keywords_ru":"инструменты купить Астана, электроинструмент",
     "keywords_kz":"құралдар Астана, электр аспаптар",
     "keywords_en":"tools Astana, power tools buy"},

    {"name":"Электроинструмент", "name_ru":"Электроинструмент", "name_kz":"Электр аспаптар", "name_en":"Power Tools",
     "slug":"elektroinstrument", "icon":"", "sort_order":1, "parent_category":"Инструменты", "is_active":True,
     "image_url":"",
     "seo_title_ru":"Электроинструмент купить в Астане — дрели, болгарки",
     "seo_title_kz":"Астанада электр аспаптар — бұрғы, болгарка",
     "seo_title_en":"Buy Power Tools in Astana — Drills, Grinders",
     "seo_description_ru":"Дрели, шуруповёрты, перфораторы, лобзики. Bosch, Makita.",
     "seo_description_kz":"Бұрғы, шуруповёрт, перфоратор. Bosch, Makita.",
     "seo_description_en":"Drills, screwdrivers, rotary hammers. Bosch, Makita.",
     "keywords_ru":"электроинструмент Астана, дрель Bosch",
     "keywords_kz":"электр аспаптар Астана, Bosch",
     "keywords_en":"power tools Astana, Bosch drill buy"},

    # ── Крепёж ────────────────────────────────────────────────────────────────
    {"name":"Крепёж", "name_ru":"Крепёж", "name_kz":"Бекіткіштер", "name_en":"Fasteners",
     "slug":"krepezh", "icon":"🔩", "sort_order":80, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/krepezh.jpg",
     "seo_title_ru":"Крепёж купить в Астане — саморезы, дюбели, анкеры",
     "seo_title_kz":"Астанада бекіткіштер — бұрандалар, дюбельдер",
     "seo_title_en":"Buy Fasteners in Astana — Screws, Dowels, Anchors",
     "seo_description_ru":"Саморезы, дюбели, анкеры, болты. Розница и оптом. Доставка.",
     "seo_description_kz":"Бұрандалар, дюбельдер, якорлар. Жеткізу.",
     "seo_description_en":"Screws, dowels, anchors, bolts. Retail and wholesale. Delivery.",
     "keywords_ru":"крепёж купить Астана, саморезы оптом",
     "keywords_kz":"бекіткіштер Астана, бұрандалар",
     "keywords_en":"fasteners Astana, screws wholesale"},

    # ── Пиломатериалы ─────────────────────────────────────────────────────────
    {"name":"Пиломатериалы", "name_ru":"Пиломатериалы", "name_kz":"Ағаш материалдар", "name_en":"Lumber",
     "slug":"pilomaterialy", "icon":"🪵", "sort_order":100, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/pilomaterialy.jpg",
     "seo_title_ru":"Пиломатериалы купить в Астане — доска, брус, фанера",
     "seo_title_kz":"Астанада ағаш материалдар — тақта, брус, фанера",
     "seo_title_en":"Buy Lumber in Astana — Boards, Beams, Plywood",
     "seo_description_ru":"Обрезная доска, брус, фанера, OSB. Доставка по Астане.",
     "seo_description_kz":"Кесілген тақта, брус, фанера, OSB. Жеткізу.",
     "seo_description_en":"Sawn boards, timber, plywood, OSB. Delivery in Astana.",
     "keywords_ru":"пиломатериалы купить Астана, доска, брус",
     "keywords_kz":"ағаш материалдар Астана, тақта, брус",
     "keywords_en":"lumber Astana, boards beams plywood buy"},

    # ── Дача и сад ────────────────────────────────────────────────────────────
    {"name":"Дача и сад", "name_ru":"Дача и сад", "name_kz":"Саяжай және бақша", "name_en":"Garden & Dacha",
     "slug":"dacha-i-sad", "icon":"🌿", "sort_order":90, "parent_category":None, "is_active":True,
     "image_url":"https://example.com/img/dacha-i-sad.jpg",
     "seo_title_ru":"Товары для дачи и сада купить в Астане",
     "seo_title_kz":"Астанада саяжай және бақша тауарлары",
     "seo_title_en":"Buy Garden & Dacha Goods in Astana",
     "seo_description_ru":"Садовый инвентарь, теплицы, заборы, мебель. Доставка.",
     "seo_description_kz":"Бақша мүкәммал, жылыжай, қора. Жеткізу.",
     "seo_description_en":"Garden tools, greenhouses, fences, furniture. Delivery.",
     "keywords_ru":"товары для дачи Астана, садовый инвентарь",
     "keywords_kz":"саяжай тауарлары Астана, бақша мүкәммал",
     "keywords_en":"garden goods Astana, dacha tools buy"},

    # ── Другие ────────────────────────────────────────────────────────────────
    {"name":"Другие", "name_ru":"Другие", "name_kz":"Басқалары", "name_en":"Other",
     "slug":"drugie", "icon":"📦", "sort_order":150, "parent_category":None, "is_active":True,
     "image_url":"",
     "seo_title_ru":"Другие строительные товары — Строй-Двор Астана",
     "seo_title_kz":"Басқа құрылыс тауарлары — Строй-Двор Астана",
     "seo_title_en":"Other Construction Goods — Stroydvor Astana",
     "seo_description_ru":"Другие строительные товары. Широкий выбор от Строй-Двор.",
     "seo_description_kz":"Басқа құрылыс тауарлары. Строй-Двор.",
     "seo_description_en":"Other construction goods. Wide selection from Stroydvor.",
     "keywords_ru":"другие товары, строительные материалы Астана",
     "keywords_kz":"басқа тауарлар, құрылыс материалдары",
     "keywords_en":"other goods, construction materials Astana"},
]

# Синхронизируем seo_title / seo_description / keywords → _ru для совместимости
for cat in CATEGORIES:
    if not cat.get("seo_title"):
        cat["seo_title"] = cat.get("seo_title_ru", "")
    if not cat.get("seo_description"):
        cat["seo_description"] = cat.get("seo_description_ru", "")
    if not cat.get("keywords"):
        cat["keywords"] = cat.get("keywords_ru", "")


# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTS — с тройной локализацией (RU / KZ / EN)
# ══════════════════════════════════════════════════════════════════════════════
PRODUCTS = [
    {"external_id":"KRV-001",
     "title":"Металлочерепица МП Монтеррей 0.5 мм",
     "title_ru":"Металлочерепица МП Монтеррей 0.5 мм",
     "title_kz":"МП Монтерей 0.5 мм металл черепица",
     "title_en":"Metal Roof Tile MP Monterrey 0.5mm",
     "description":"Кровельное покрытие из оцинкованной стали с покрытием полиэстер. Толщина 0.5 мм.",
     "description_ru":"Кровельное покрытие из оцинкованной стали с покрытием полиэстер. Толщина 0.5 мм.",
     "description_kz":"Полиэстер жабындысы бар мырыштандырылған болат шатыр жабындысы. Қалыңдығы 0.5 мм.",
     "description_en":"Roof covering made of galvanized steel with polyester coating. Thickness 0.5 mm.",
     "seo_title_ru":"Металлочерепица Монтеррей купить Астана",
     "seo_title_kz":"Монтерей металл черепица Астана сатып алу",
     "seo_title_en":"Buy Monterrey Metal Roof Tile in Astana",
     "seo_description_ru":"Металлочерепица Монтеррей 0.5 мм — лучшая цена в Астане.",
     "seo_description_kz":"Монтерей металл черепица 0.5 мм — Астанадағы үздік баға.",
     "seo_description_en":"Monterrey metal tile 0.5mm — best price in Astana.",
     "keywords_ru":"металлочерепица Монтеррей Астана",
     "keywords_kz":"Монтерей металл черепица Астана",
     "keywords_en":"Monterrey metal tile Astana",
     "price":3200,"old_price":3800,"category":"Кровля","subcategory":"Металлочерепица",
     "image":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
     "in_stock":True,"unit":"м²","brand":"ТехноНИКОЛЬ","quantity":500,"is_featured":True,"is_sale":True},

    {"external_id":"KRV-002",
     "title":"Металлочерепица Супермонтеррей 0.45 мм",
     "title_ru":"Металлочерепица Супермонтеррей 0.45 мм",
     "title_kz":"Супермонтерей 0.45 мм металл черепица",
     "title_en":"Metal Roof Tile Supermonterrey 0.45mm",
     "description":"Усиленный профиль, покрытие PURAL. Без коробления при нагреве.",
     "description_ru":"Усиленный профиль, покрытие PURAL. Без коробления при нагреве.",
     "description_kz":"Күшейтілген профиль, PURAL жабындысы. Қыздырған кезде бұралмайды.",
     "description_en":"Reinforced profile, PURAL coating. No warping when heated.",
     "seo_title_ru":"Металлочерепица Супермонтеррей 0.45 мм купить Астана",
     "seo_title_kz":"Супермонтерей металл черепица Астана",
     "seo_title_en":"Buy Supermonterrey Metal Tile Astana",
     "price":2950,"category":"Кровля","subcategory":"Металлочерепица",
     "image":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
     "in_stock":True,"unit":"м²","brand":"Grand Line","quantity":320,"is_featured":False,"is_sale":False},

    {"external_id":"KRV-010",
     "title":"Профнастил НС-35 оцинкованный",
     "title_ru":"Профнастил НС-35 оцинкованный",
     "title_kz":"НС-35 мырыштандырылған профнастил",
     "title_en":"Corrugated Sheet NS-35 Galvanized",
     "description":"Для кровли и стен. Высота профиля 35 мм, толщина 0.5 мм.",
     "description_ru":"Для кровли и стен. Высота профиля 35 мм, толщина 0.5 мм.",
     "description_kz":"Шатыр мен қабырға үшін. Профиль биіктігі 35 мм, қалыңдығы 0.5 мм.",
     "description_en":"For roofing and walls. Profile height 35 mm, thickness 0.5 mm.",
     "seo_title_ru":"Профнастил НС-35 купить Астана",
     "seo_title_kz":"НС-35 профнастил Астана",
     "seo_title_en":"Buy Corrugated Sheet NS-35 Astana",
     "price":1850,"category":"Кровля","subcategory":"Профнастил",
     "image":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
     "in_stock":True,"unit":"м²","brand":"СтальПрофиль","quantity":800,"is_featured":True,"is_sale":False},

    {"external_id":"KRV-030",
     "title":"Водосточная система RainWay 90/75 мм белая",
     "title_ru":"Водосточная система RainWay 90/75 мм белая",
     "title_kz":"RainWay 90/75 мм ақ су ағызу жүйесі",
     "title_en":"Gutter System RainWay 90/75 mm White",
     "description":"ПВХ система. Желоб 90 мм, труба 75 мм.",
     "description_ru":"ПВХ система. Желоб 90 мм, труба 75 мм.",
     "description_kz":"ПВХ жүйе. Ойық 90 мм, құбыр 75 мм.",
     "description_en":"PVC system. Gutter 90 mm, pipe 75 mm.",
     "seo_title_ru":"Водосток RainWay купить Астана",
     "seo_title_kz":"RainWay су ағызу Астана",
     "seo_title_en":"Buy RainWay Gutter System Astana",
     "price":1800,"category":"Кровля","subcategory":"Водостоки",
     "image":"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600",
     "in_stock":True,"unit":"м.п.","brand":"RainWay","quantity":400,"is_featured":False,"is_sale":False},

    {"external_id":"FAS-001",
     "title":"Виниловый сайдинг Nordside 3660 мм белый",
     "title_ru":"Виниловый сайдинг Nordside 3660 мм белый",
     "title_kz":"Nordside 3660 мм ақ винил сайдинг",
     "title_en":"Vinyl Siding Nordside 3660 mm White",
     "description":"ПВХ сайдинг. Длина 3660 мм, ширина 230 мм.",
     "description_ru":"ПВХ сайдинг. Длина 3660 мм, ширина 230 мм.",
     "description_kz":"ПВХ сайдинг. Ұзындығы 3660 мм, ені 230 мм.",
     "description_en":"PVC siding. Length 3660 mm, width 230 mm.",
     "seo_title_ru":"Виниловый сайдинг Nordside купить Астана",
     "seo_title_kz":"Nordside винил сайдинг Астана",
     "seo_title_en":"Buy Vinyl Siding Nordside Astana",
     "price":1600,"old_price":1900,"category":"Фасады","subcategory":"Виниловый сайдинг",
     "image":"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600",
     "in_stock":False,"unit":"м²","brand":"Nordside","quantity":0,"is_featured":False,"is_sale":True},

    {"external_id":"FAS-002",
     "title":"Сайдинг металлический Grand Line имитация бруса",
     "title_ru":"Сайдинг металлический Grand Line имитация бруса",
     "title_kz":"Grand Line брус имитациясы металл сайдинг",
     "title_en":"Metal Siding Grand Line Wood Imitation",
     "description":"Металлический сайдинг с покрытием полиэстер 0.45 мм.",
     "description_ru":"Металлический сайдинг с покрытием полиэстер 0.45 мм.",
     "description_kz":"Полиэстер жабындысы бар 0.45 мм металл сайдинг.",
     "description_en":"Metal siding with polyester coating 0.45 mm.",
     "seo_title_ru":"Металлосайдинг Grand Line купить Астана",
     "seo_title_kz":"Grand Line металл сайдинг Астана",
     "seo_title_en":"Buy Metal Siding Grand Line Astana",
     "price":2200,"category":"Фасады","subcategory":"Металлосайдинг",
     "image":"https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600",
     "in_stock":True,"unit":"м²","brand":"Grand Line","quantity":250,"is_featured":True,"is_sale":False},

    {"external_id":"IZO-001",
     "title":"Минвата ROCKWOOL Лайт Баттс 100 мм",
     "title_ru":"Минвата ROCKWOOL Лайт Баттс 100 мм",
     "title_kz":"ROCKWOOL Лайт Баттс 100 мм минералды мақта",
     "title_en":"Mineral Wool ROCKWOOL Light Batts 100mm",
     "description":"Каменная вата для скатных кровель и стен. Плотность 37 кг/м³.",
     "description_ru":"Каменная вата для скатных кровель и стен. Плотность 37 кг/м³.",
     "description_kz":"Еңкіш шатырлар мен қабырғалар үшін тас мақта. Тығыздығы 37 кг/м³.",
     "description_en":"Stone wool for pitched roofs and walls. Density 37 kg/m³.",
     "seo_title_ru":"Минвата ROCKWOOL купить Астана",
     "seo_title_kz":"ROCKWOOL минвата Астана",
     "seo_title_en":"Buy ROCKWOOL Mineral Wool Astana",
     "price":4500,"category":"Изоляция","subcategory":"Минеральная вата",
     "image":"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600",
     "in_stock":True,"unit":"м³","brand":"ROCKWOOL","quantity":200,"is_featured":True,"is_sale":False},

    {"external_id":"IZO-010",
     "title":"Пенопласт ПСБ-С-25 1000×500×50 мм",
     "title_ru":"Пенопласт ПСБ-С-25 1000×500×50 мм",
     "title_kz":"ПСБ-С-25 пенопласт 1000×500×50 мм",
     "title_en":"Styrofoam PSB-S-25 1000×500×50 mm",
     "description":"Пенополистирол самозатухающий, плотность 25 кг/м³, 10 шт в упак.",
     "description_ru":"Пенополистирол самозатухающий, плотность 25 кг/м³, 10 шт в упак.",
     "description_kz":"Өздігінен сөнетін пенополистирол, тығыздығы 25 кг/м³, 10 дана/қаптама.",
     "description_en":"Self-extinguishing polystyrene, density 25 kg/m³, 10 pcs per pack.",
     "seo_title_ru":"Пенопласт ПСБ-С-25 купить Астана",
     "seo_title_kz":"ПСБ-С-25 пенопласт Астана",
     "seo_title_en":"Buy Styrofoam PSB-S-25 Astana",
     "price":1200,"old_price":1400,"category":"Изоляция","subcategory":"Пенопласт и пеноплекс",
     "image":"https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600",
     "in_stock":True,"unit":"м³","brand":"ПолимерПром","quantity":300,"is_featured":False,"is_sale":True},

    {"external_id":"PIL-001",
     "title":"Доска обрезная 25×150×6000 мм сосна",
     "title_ru":"Доска обрезная 25×150×6000 мм сосна",
     "title_kz":"Қарағай кесілген тақта 25×150×6000 мм",
     "title_en":"Sawn Pine Board 25×150×6000 mm",
     "description":"Хвойная обрезная доска естественной влажности, сорт 2.",
     "description_ru":"Хвойная обрезная доска естественной влажности, сорт 2.",
     "description_kz":"Табиғи ылғалдылықтағы хвойлы кесілген тақта, 2-сорт.",
     "description_en":"Coniferous sawn board of natural humidity, grade 2.",
     "seo_title_ru":"Доска обрезная 25×150 купить Астана",
     "seo_title_kz":"Кесілген тақта 25×150 Астана",
     "seo_title_en":"Buy Sawn Pine Board 25×150 Astana",
     "price":680,"category":"Пиломатериалы","subcategory":"Доска обрезная",
     "image":"https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600",
     "in_stock":True,"unit":"м.п.","quantity":2000,"is_featured":False,"is_sale":False},

    {"external_id":"INS-001",
     "title":"Дрель-шуруповёрт Makita DF333D 10.8В",
     "title_ru":"Дрель-шуруповёрт Makita DF333D 10.8В",
     "title_kz":"Makita DF333D 10.8В аккумуляторлы бұрғы-шуруповёрт",
     "title_en":"Cordless Drill-Driver Makita DF333D 10.8V",
     "description":"Аккумуляторный шуруповёрт. 2 скорости, момент 30 Нм. 2 АКБ в комплекте.",
     "description_ru":"Аккумуляторный шуруповёрт. 2 скорости, момент 30 Нм. 2 АКБ в комплекте.",
     "description_kz":"Аккумуляторлы шуруповёрт. 2 жылдамдық, момент 30 Нм. Жинақта 2 АКБ.",
     "description_en":"Cordless screwdriver. 2 speeds, torque 30 Nm. 2 batteries included.",
     "seo_title_ru":"Makita DF333D шуруповёрт купить Астана",
     "seo_title_kz":"Makita DF333D Астана сатып алу",
     "seo_title_en":"Buy Makita DF333D Drill-Driver Astana",
     "price":48000,"old_price":55000,"category":"Инструменты","subcategory":"Электроинструмент",
     "image":"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600",
     "in_stock":True,"unit":"шт","brand":"Makita","quantity":30,"is_featured":True,"is_sale":True},

    {"external_id":"INS-002",
     "title":"Перфоратор Bosch GBH 2-26 DRE 800 Вт",
     "title_ru":"Перфоратор Bosch GBH 2-26 DRE 800 Вт",
     "title_kz":"Bosch GBH 2-26 DRE 800 Вт перфоратор",
     "title_en":"Rotary Hammer Bosch GBH 2-26 DRE 800W",
     "description":"Профессиональный перфоратор 800 Вт, SDS-plus, 3 режима. Удар 2.7 Дж.",
     "description_ru":"Профессиональный перфоратор 800 Вт, SDS-plus, 3 режима. Удар 2.7 Дж.",
     "description_kz":"Кәсіби перфоратор 800 Вт, SDS-plus, 3 режим. Соққы 2.7 Дж.",
     "description_en":"Professional rotary hammer 800W, SDS-plus, 3 modes. Impact energy 2.7 J.",
     "seo_title_ru":"Перфоратор Bosch GBH 2-26 купить Астана",
     "seo_title_kz":"Bosch GBH 2-26 перфоратор Астана",
     "seo_title_en":"Buy Bosch GBH 2-26 Rotary Hammer Astana",
     "price":72000,"category":"Инструменты","subcategory":"Электроинструмент",
     "image":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
     "in_stock":True,"unit":"шт","brand":"Bosch","quantity":15,"is_featured":True,"is_sale":False},

    {"external_id":"KRP-001",
     "title":"Саморезы кровельные 4.8×35 мм (200 шт)",
     "title_ru":"Саморезы кровельные 4.8×35 мм (200 шт)",
     "title_kz":"Шатыр бұрандалары 4.8×35 мм (200 дана)",
     "title_en":"Roofing Screws 4.8×35 mm (200 pcs)",
     "description":"С резиновой шайбой для профнастила и металлочерепицы.",
     "description_ru":"С резиновой шайбой для профнастила и металлочерепицы.",
     "description_kz":"Профнастил мен металл черепица үшін резеңке шайбамен.",
     "description_en":"With rubber washer for corrugated sheets and metal tiles.",
     "seo_title_ru":"Кровельные саморезы купить Астана",
     "seo_title_kz":"Шатыр бұрандалары Астана",
     "seo_title_en":"Buy Roofing Screws Astana",
     "price":650,"category":"Крепёж","subcategory":"Саморезы",
     "image":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
     "in_stock":True,"unit":"уп","quantity":1000,"is_featured":False,"is_sale":False},

    {"external_id":"MIX-001",
     "title":"Штукатурка гипсовая Knauf Ротбанд 30 кг",
     "title_ru":"Штукатурка гипсовая Knauf Ротбанд 30 кг",
     "title_kz":"Knauf Ротбанд 30 кг гипс сылақ",
     "title_en":"Gypsum Plaster Knauf Rotband 30 kg",
     "description":"Для ручного и машинного нанесения. Толщина слоя 5–50 мм.",
     "description_ru":"Для ручного и машинного нанесения. Толщина слоя 5–50 мм.",
     "description_kz":"Қолмен және машинамен жағу үшін. Қабат қалыңдығы 5–50 мм.",
     "description_en":"For manual and machine application. Layer thickness 5–50 mm.",
     "seo_title_ru":"Штукатурка Knauf Ротбанд купить Астана",
     "seo_title_kz":"Knauf Ротбанд гипс сылақ Астана",
     "seo_title_en":"Buy Knauf Rotband Gypsum Plaster Astana",
     "price":3600,"category":"Сухие смеси","subcategory":"Штукатурные смеси",
     "image":"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600",
     "in_stock":True,"unit":"уп","brand":"Knauf","quantity":300,"is_featured":True,"is_sale":False},

    {"external_id":"MIX-010",
     "title":"Цемент М500 Д0 50 кг",
     "title_ru":"Цемент М500 Д0 50 кг",
     "title_kz":"Цемент М500 Д0 50 кг",
     "title_en":"Cement M500 D0 50 kg",
     "description":"Портландцемент без добавок. Высокая прочность и морозостойкость.",
     "description_ru":"Портландцемент без добавок. Высокая прочность и морозостойкость.",
     "description_kz":"Қоспасыз портланд цемент. Жоғары беріктілік және аяз төзімділігі.",
     "description_en":"Portland cement without additives. High strength and frost resistance.",
     "seo_title_ru":"Цемент М500 купить Астана",
     "seo_title_kz":"М500 цемент Астана сатып алу",
     "seo_title_en":"Buy Cement M500 Astana",
     "price":2400,"category":"Сухие смеси","subcategory":"Цемент и бетон",
     "image":"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600",
     "in_stock":True,"unit":"уп","brand":"Бухтарминский ЦЗ","quantity":700,"is_featured":False,"is_sale":False},

    {"external_id":"MIX-020",
     "title":"Клей для плитки Ceresit CM 11 25 кг",
     "title_ru":"Клей для плитки Ceresit CM 11 25 кг",
     "title_kz":"Ceresit CM 11 25 кг тақта желімі",
     "title_en":"Tile Adhesive Ceresit CM 11 25 kg",
     "description":"Для керамической плитки в сухих помещениях.",
     "description_ru":"Для керамической плитки в сухих помещениях.",
     "description_kz":"Құрғақ бөлмелердегі керамикалық тақтайша үшін.",
     "description_en":"For ceramic tiles in dry rooms.",
     "seo_title_ru":"Плиточный клей Ceresit CM 11 купить Астана",
     "seo_title_kz":"Ceresit CM 11 тақта желімі Астана",
     "seo_title_en":"Buy Ceresit CM 11 Tile Adhesive Astana",
     "price":2100,"old_price":2400,"category":"Сухие смеси","subcategory":"Плиточный клей",
     "image":"https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600",
     "in_stock":True,"unit":"уп","brand":"Ceresit","quantity":400,"is_featured":False,"is_sale":True},

    {"external_id":"SAN-001",
     "title":"Унитаз-компакт Cersanit President горизонтальный выпуск",
     "title_ru":"Унитаз-компакт Cersanit President горизонтальный выпуск",
     "title_kz":"Cersanit President горизонталь шығысты унитаз-компакт",
     "title_en":"Compact Toilet Cersanit President Horizontal Outlet",
     "description":"Напольный, горизонтальный выпуск. Белый. Сиденье в комплекте.",
     "description_ru":"Напольный, горизонтальный выпуск. Белый. Сиденье в комплекте.",
     "description_kz":"Еденге қойылатын, горизонталь шығыс. Ақ. Отырғыш жинақта.",
     "description_en":"Floor-standing, horizontal outlet. White. Seat included.",
     "seo_title_ru":"Унитаз Cersanit President купить Астана",
     "seo_title_kz":"Cersanit President унитаз Астана",
     "seo_title_en":"Buy Cersanit President Toilet Astana",
     "price":38000,"old_price":44000,"category":"Сантехника",
     "image":"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600",
     "in_stock":True,"unit":"шт","brand":"Cersanit","quantity":25,"is_featured":True,"is_sale":True},

    {"external_id":"SAN-010",
     "title":"Смеситель для ванны Grohe Eurosmart однорычажный",
     "title_ru":"Смеситель для ванны Grohe Eurosmart однорычажный",
     "title_kz":"Grohe Eurosmart бір тұтқалы ванна краны",
     "title_en":"Bath Mixer Grohe Eurosmart Single Lever",
     "description":"С душевым гарнитуром. Картридж StarLight, хром.",
     "description_ru":"С душевым гарнитуром. Картридж StarLight, хром.",
     "description_kz":"Душ жинағымен. StarLight картриджі, хром.",
     "description_en":"With shower set. StarLight cartridge, chrome.",
     "seo_title_ru":"Смеситель Grohe Eurosmart купить Астана",
     "seo_title_kz":"Grohe Eurosmart кран Астана",
     "seo_title_en":"Buy Grohe Eurosmart Mixer Astana",
     "price":42000,"category":"Сантехника","subcategory":"Смесители",
     "image":"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600",
     "in_stock":True,"unit":"шт","brand":"Grohe","quantity":18,"is_featured":True,"is_sale":False},
]

# Синхронизируем основные SEO поля продуктов с _ru
for p in PRODUCTS:
    if not p.get("seo_title"):
        p["seo_title"] = p.get("seo_title_ru", "")
    if not p.get("seo_description"):
        p["seo_description"] = p.get("seo_description_ru", "")
    if not p.get("keywords"):
        p["keywords"] = p.get("keywords_ru", "")


# ══════════════════════════════════════════════════════════════════════════════
# BANNERS — с тройной локализацией
# ══════════════════════════════════════════════════════════════════════════════
BANNERS = [
    # ── Слайдер 1: Кровля ────────────────────────────────────────────────────
    {"type":"slider",
     "title":"Кровельные материалы\nсо скидкой до 30%",
     "title_ru":"Кровельные материалы\nсо скидкой до 30%",
     "title_kz":"Шатыр материалдары\n30%-ға дейін жеңілдік",
     "title_en":"Roofing Materials\nUp to 30% Off",
     "subtitle":"металлочерепица, профнастил, водосток",
     "subtitle_ru":"металлочерепица, профнастил, водосток",
     "subtitle_kz":"металл черепица, профнастил, су ағызу",
     "subtitle_en":"metal tiles, corrugated sheets, gutters",
     "cta_text":"Смотреть акции",
     "cta_text_ru":"Смотреть акции","cta_text_kz":"Акцияларды қарау","cta_text_en":"See offers",
     "cta_link":"/catalog/Кровля","badge_text":"Акция",
     "image_url":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80",
     "bg_color":"#1a3a2a","text_color":"#ffffff","is_active":True,"sort_order":1},

    # ── Слайдер 2: Изоляция ───────────────────────────────────────────────────
    {"type":"slider",
     "title":"Утеплители и изоляция\nдля тёплого дома",
     "title_ru":"Утеплители и изоляция\nдля тёплого дома",
     "title_kz":"Жылы үй үшін\nжылу оқшаулау",
     "title_en":"Insulation Materials\nFor a Warm Home",
     "subtitle":"минвата, пенопласт, пароизоляция",
     "subtitle_ru":"минвата, пенопласт, пароизоляция",
     "subtitle_kz":"минвата, пенопласт, бу оқшаулау",
     "subtitle_en":"mineral wool, foam, vapour barrier",
     "cta_text":"Выбрать",
     "cta_text_ru":"Выбрать","cta_text_kz":"Таңдау","cta_text_en":"Choose",
     "cta_link":"/catalog/Изоляция","badge_text":"",
     "image_url":"https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1400&q=80",
     "bg_color":"#1a1a3a","text_color":"#ffffff","is_active":True,"sort_order":2},

    # ── Слайдер 3: Инструменты ────────────────────────────────────────────────
    {"type":"slider",
     "title":"Инструменты Bosch,\nMakita, DeWalt",
     "title_ru":"Инструменты Bosch,\nMakita, DeWalt",
     "title_kz":"Bosch, Makita, DeWalt\nаспаптары",
     "title_en":"Bosch, Makita,\nDeWalt Tools",
     "subtitle":"большой выбор электроинструмента",
     "subtitle_ru":"большой выбор электроинструмента",
     "subtitle_kz":"электр аспаптарының кең таңдауы",
     "subtitle_en":"wide selection of power tools",
     "cta_text":"В каталог",
     "cta_text_ru":"В каталог","cta_text_kz":"Каталогқа","cta_text_en":"To catalog",
     "cta_link":"/catalog/Инструменты","badge_text":"Новинки",
     "image_url":"https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1400&q=80",
     "bg_color":"#2a1a1a","text_color":"#ffffff","is_active":True,"sort_order":3},

    # ── Слайдер 4: Сухие смеси ────────────────────────────────────────────────
    {"type":"slider",
     "title":"Сухие смеси и цемент\nоптовые цены",
     "title_ru":"Сухие смеси и цемент\nоптовые цены",
     "title_kz":"Құрғақ қоспалар\nкөтерме бағалар",
     "title_en":"Dry Mixes & Cement\nWholesale Prices",
     "subtitle":"цемент, штукатурка, плиточный клей",
     "subtitle_ru":"цемент, штукатурка, плиточный клей",
     "subtitle_kz":"цемент, сылақ, тақта желімі",
     "subtitle_en":"cement, plaster, tile adhesive",
     "cta_text":"Купить",
     "cta_text_ru":"Купить","cta_text_kz":"Сатып алу","cta_text_en":"Buy now",
     "cta_link":"/catalog/Сухие смеси","badge_text":"",
     "image_url":"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1400&q=80",
     "bg_color":"#2a2a1a","text_color":"#ffffff","is_active":True,"sort_order":4},

    # ── Promo-карточка 1: Кровля ──────────────────────────────────────────────
    {"type":"promo_card",
     "title":"Скидки на\nкровлю до 30%",
     "title_ru":"Скидки на\nкровлю до 30%",
     "title_kz":"Шатырға\n30% жеңілдік",
     "title_en":"Roofing Sale\nUp to 30%",
     "subtitle":"","subtitle_ru":"","subtitle_kz":"","subtitle_en":"",
     "cta_text":"","cta_text_ru":"","cta_text_kz":"","cta_text_en":"",
     "cta_link":"/catalog/Кровля","badge_text":"−30%",
     "image_url":"https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&q=80",
     "bg_color":"#C0392B","text_color":"#ffffff","is_active":True,"sort_order":10},

    # ── Promo-карточка 2: Акция месяца ────────────────────────────────────────
    {"type":"promo_card",
     "title":"Акция\nмесяца",
     "title_ru":"Акция\nмесяца",
     "title_kz":"Ай\nакциясы",
     "title_en":"Monthly\nDeal",
     "subtitle":"","subtitle_ru":"","subtitle_kz":"","subtitle_en":"",
     "cta_text":"","cta_text_ru":"","cta_text_kz":"","cta_text_en":"",
     "cta_link":"/catalog","badge_text":"−20%",
     "image_url":"https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&q=80",
     "bg_color":"#f5f5f5","text_color":"#1A1A1A","is_active":True,"sort_order":11},

    # ── Promo-карточка 3: Утеплители ──────────────────────────────────────────
    {"type":"promo_card",
     "title":"Утеплители\nи изоляция",
     "title_ru":"Утеплители\nи изоляция",
     "title_kz":"Жылу\nоқшаулау",
     "title_en":"Insulation\n& Warmth",
     "subtitle":"","subtitle_ru":"","subtitle_kz":"","subtitle_en":"",
     "cta_text":"","cta_text_ru":"","cta_text_kz":"","cta_text_en":"",
     "cta_link":"/catalog/Изоляция","badge_text":"",
     "image_url":"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
     "bg_color":"#f0f4ff","text_color":"#1A1A1A","is_active":True,"sort_order":12},

    # ── Promo-карточка 4: Сухие смеси ─────────────────────────────────────────
    {"type":"promo_card",
     "title":"Сухие смеси\nоптом",
     "title_ru":"Сухие смеси\nоптом",
     "title_kz":"Құрғақ қоспалар\nкөтерме",
     "title_en":"Dry Mixes\nWholesale",
     "subtitle":"","subtitle_ru":"","subtitle_kz":"","subtitle_en":"",
     "cta_text":"","cta_text_ru":"","cta_text_kz":"","cta_text_en":"",
     "cta_link":"/catalog/Сухие смеси","badge_text":"",
     "image_url":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
     "bg_color":"#fff8f0","text_color":"#1A1A1A","is_active":True,"sort_order":13},

    # ── Promo-карточка 5: Акция месяца (PromoBanner top) ──────────────────────
    {"type":"promo_top",
     "title":"Кровельные материалы\nсо скидкой до 30%",
     "title_ru":"Кровельные материалы\nсо скидкой до 30%",
     "title_kz":"Шатыр материалдары\n30%-ға дейін жеңілдік",
     "title_en":"Roofing Materials\nUp to 30% Off",
     "subtitle":"Металлочерепица, профнастил, мягкая кровля — всё для надёжной крыши. Успейте до конца месяца.",
     "subtitle_ru":"Металлочерепица, профнастил, мягкая кровля — всё для надёжной крыши. Успейте до конца месяца.",
     "subtitle_kz":"Металл черепица, профнастил, жұмсақ шатыр — сенімді шатыр үшін барлығы. Ай аяғына дейін үлгеріңіз.",
     "subtitle_en":"Metal tiles, corrugated sheets, soft roofing — everything for a reliable roof. Limited time offer.",
     "cta_text":"Смотреть товары",
     "cta_text_ru":"Смотреть товары","cta_text_kz":"Тауарларды қарау","cta_text_en":"View Products",
     "cta_link":"/catalog/Кровля","badge_text":"Акция месяца",
     "badge_text_ru":"Акция месяца","badge_text_kz":"Ай акциясы","badge_text_en":"Monthly Deal",
     "price_label":"Металлочерепица от",
     "price_label_ru":"Металлочерепица от","price_label_kz":"Металл черепица бастап","price_label_en":"Metal tiles from",
     "price_value":"1 490 ₸","price_unit":"м²",
     "image_url":"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
     "bg_color":"#1A1A1A","text_color":"#ffffff","is_active":True,"sort_order":20},

    # ── Promo-bottom 1: Сухие смеси ───────────────────────────────────────────
    {"type":"promo_bottom",
     "title":"Сухие смеси и цемент",
     "title_ru":"Сухие смеси и цемент",
     "title_kz":"Құрғақ қоспалар және цемент",
     "title_en":"Dry Mixes & Cement",
     "subtitle":"Оптовые цены при покупке от 50 мешков",
     "subtitle_ru":"Оптовые цены при покупке от 50 мешков",
     "subtitle_kz":"50 қаптамадан сатып алғанда көтерме бағалар",
     "subtitle_en":"Wholesale prices when buying 50+ bags",
     "cta_text":"Подробнее",
     "cta_text_ru":"Подробнее","cta_text_kz":"Толығырақ","cta_text_en":"Learn more",
     "cta_link":"/catalog/Сухие смеси","badge_text":"Спецпредложение",
     "badge_text_ru":"Спецпредложение","badge_text_kz":"Арнайы ұсыныс","badge_text_en":"Special offer",
     "image_url":"https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80",
     "bg_color":"#C0392B","text_color":"#ffffff","is_active":True,"sort_order":21},

    # ── Promo-bottom 2: Инструменты ───────────────────────────────────────────
    {"type":"promo_bottom",
     "title":"Инструменты Bosch и Makita",
     "title_ru":"Инструменты Bosch и Makita",
     "title_kz":"Bosch және Makita аспаптары",
     "title_en":"Bosch & Makita Tools",
     "subtitle":"Профессиональный инструмент с гарантией производителя",
     "subtitle_ru":"Профессиональный инструмент с гарантией производителя",
     "subtitle_kz":"Өндіруші кепілдігі бар кәсіби аспаптар",
     "subtitle_en":"Professional tools with manufacturer warranty",
     "cta_text":"В каталог",
     "cta_text_ru":"В каталог","cta_text_kz":"Каталогқа","cta_text_en":"View catalog",
     "cta_link":"/catalog/Инструменты","badge_text":"Новинки",
     "badge_text_ru":"Новинки","badge_text_kz":"Жаңалықтар","badge_text_en":"New arrivals",
     "image_url":"https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&q=80",
     "bg_color":"#1A1A1A","text_color":"#ffffff","is_active":True,"sort_order":22},
]


# ══════════════════════════════════════════════════════════════════════════════
# PROMOCODES
# ══════════════════════════════════════════════════════════════════════════════
PROMOCODES = [
    {"code":"STROY10",   "discount_type":"percent","discount_value":10,
     "min_order":10000,"max_uses":100,"uses":0,"active":True,"expires_at":None},
    {"code":"WELCOME",   "discount_type":"fixed","discount_value":2000,
     "min_order":5000,"max_uses":50,"uses":0,"active":True,"expires_at":None},
    {"code":"KROVLYA20", "discount_type":"percent","discount_value":20,
     "min_order":30000,"max_uses":None,"uses":0,"active":True,"expires_at":None},
]


# ══════════════════════════════════════════════════════════════════════════════
# DELIVERY SETTINGS
# ══════════════════════════════════════════════════════════════════════════════
DELIVERY_SETTINGS = [
    {"name":"Доставка по Астане",
     "name_ru":"Доставка по Астане","name_kz":"Астана бойынша жеткізу","name_en":"Delivery in Astana",
     "price_from":2000,"price_to":5000,"free_from":50000,"is_active":True},
    {"name":"Доставка в пригород",
     "name_ru":"Доставка в пригород","name_kz":"Қала маңына жеткізу","name_en":"Suburban Delivery",
     "price_from":5000,"price_to":8000,"free_from":100000,"is_active":True},
    {"name":"Доставка по Казахстану",
     "name_ru":"Доставка по Казахстану","name_kz":"Қазақстан бойынша жеткізу","name_en":"Delivery across Kazakhstan",
     "price_from":8000,"price_to":0,"free_from":0,"is_active":False},
]


# ══════════════════════════════════════════════════════════════════════════════
# SITE SETTINGS
# ══════════════════════════════════════════════════════════════════════════════
SITE_SETTINGS = {
    "_key":         "site_settings",
    "company_name": "Строй-Двор",
    "phone":        "+7‒707‒290‒05‒05",
    "phone_label":  "отдел стройматериалов",
    "phone2":       "+7‒701‒320‒01‒48",
    "phone2_label": "отдел мебели для бани и сада",
    "phone3":       "+7‒771‒288‒88‒09",
    "phone3_label": "отдел сантехники",
    "phone4":       "+7‒747‒730‒00‒70",
    "phone4_label": "отдел сухих строительных смесей",
    "phone5":       "+7‒705‒140‒89‒07",
    "phone5_label": "отдел пошива штор",
    "email":        "info@stroydvor.kz",
    "address":      "г. Астана, пр. Республики, 12",
    "city":         "Астана",
    "work_hours":   "Пн–Сб: 9:00–19:00",
    "whatsapp":     "77072900505",
    "instagram":    "stroydvor_kz",
    "map_link":     "",
    "description":  "Строительные материалы с доставкой по Астане.",
    # i18n descriptions
    "description_ru": "Строительные материалы с доставкой по Астане. Кровля, фасады, утеплители, сухие смеси и многое другое.",
    "description_kz": "Астана бойынша жеткізілімді құрылыс материалдары. Шатыр, қасбет, жылу оқшаулау және басқалары.",
    "description_en": "Construction materials with delivery across Astana. Roofing, facades, insulation, dry mixes and more.",
}


# ══════════════════════════════════════════════════════════════════════════════
# CONSULTATIONS & ORDERS (demo data — не локализуем)
# ══════════════════════════════════════════════════════════════════════════════
CONSULTATIONS = [
    {"name":"Алексей Петров","phone":"+7 701 234-56-78","email":"alex@mail.ru",
     "message":"Нужен расчёт металлочерепицы на 120 м²",
     "source":"Форма обратной связи","status":"new","created_date":NOW - timedelta(minutes=10)},
    {"name":"Марина Сидорова","phone":"+7 702 987-65-43","email":"",
     "message":"Когда будет мягкая кровля в наличии?",
     "source":"Форма обратной связи","status":"in_progress","created_date":NOW - timedelta(hours=3)},
    {"name":"Бахыт Ержанов","phone":"+7 777 111-22-33","email":"bakyt@gmail.com",
     "message":"Заказать утеплитель минвата 50 рулонов",
     "source":"Форма консультации","status":"done","created_date":NOW - timedelta(days=2)},
]

ORDERS = [
    {"customer_name":"Иван Смирнов","customer_phone":"+7 701 100-20-30",
     "customer_address":"г. Астана, ул. Абая, 5, кв. 12","comment":"Позвонить за час до доставки",
     "delivery_type":"delivery","payment_method":"kaspi",
     "items":[
         {"product_id":"demo","product_title":"Металлочерепица МП Монтеррей 0.5 мм","quantity":30,"price":3200,"unit":"м²"},
         {"product_id":"demo","product_title":"Водосточная система RainWay 90/75 мм","quantity":10,"price":1800,"unit":"м.п."},
     ],
     "subtotal":102000,"discount":0,"delivery_cost":2000,"total":104000,
     "promo_code":None,"status":"new","created_date":NOW - timedelta(hours=2)},
    {"customer_name":"Светлана Нурова","customer_phone":"+7 702 200-30-40",
     "customer_address":"","comment":"Самовывоз в пятницу",
     "delivery_type":"pickup","payment_method":"kaspi",
     "items":[
         {"product_id":"demo","product_title":"Штукатурка гипсовая Knauf Ротбанд 30 кг","quantity":10,"price":3600,"unit":"уп"},
     ],
     "subtotal":36000,"discount":2000,"delivery_cost":0,"total":34000,
     "promo_code":"WELCOME","status":"confirmed","created_date":NOW - timedelta(days=1)},
]


# ══════════════════════════════════════════════════════════════════════════════
# SEED RUNNER
# ══════════════════════════════════════════════════════════════════════════════
async def seed(reset_cols: set = None):
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    def do_reset(col):
        if reset_cols is None:   return False
        if len(reset_cols) == 0: return True
        return col in reset_cols

    async def fill(col_name, docs, indexes=None):
        col = db[col_name]
        if do_reset(col_name):
            await col.drop()
            print(f"  🗑  {col_name} — сброшена")
        n = await col.count_documents({})
        if n > 0:
            print(f"  ⏭  {col_name} — {n} записей уже есть, пропускаем")
            return
        if not docs: return
        stamped = [{**d, "created_date": d.get("created_date", NOW)} for d in docs]
        res = await col.insert_many(stamped)
        print(f"  ✅ {col_name} — вставлено {len(res.inserted_ids)}")
        if indexes:
            for idx in indexes:
                try: await col.create_index(idx)
                except: pass

    print("\n╔══════════════════════════════════════════╗")
    print("║   Строй-Двор · Database Seed  (i18n)    ║")
    print("║   Языки: RU / KZ / EN                   ║")
    print("╚══════════════════════════════════════════╝\n")

    await fill("categories", CATEGORIES, indexes=[
        "slug", "sort_order", "parent_category",
        [("parent_category", 1), ("sort_order", 1)],
    ])
    await fill("products", PRODUCTS, indexes=[
        "category", "subcategory", "external_id",
        "is_featured", "is_sale", "in_stock", "created_date",
        [("category", 1), ("subcategory", 1)],
    ])
    await fill("banners",    BANNERS,    indexes=["sort_order", "type"])
    await fill("promocodes", PROMOCODES)
    try: await db.promocodes.create_index("code", unique=True)
    except: pass
    await fill("delivery_settings", DELIVERY_SETTINGS)
    await fill("consultations", CONSULTATIONS, indexes=[[("status",1),("created_date",-1)]])
    await fill("orders",       ORDERS,       indexes=["status", "created_date"])

    # site_settings — single doc upsert
    col = db["site_settings"]
    if do_reset("site_settings"): await col.drop(); print("  🗑  site_settings — сброшена")
    existing = await col.find_one({"_key": "site_settings"})
    if existing: print("  ⏭  site_settings — уже есть, пропускаем")
    else:
        await col.replace_one({"_key":"site_settings"}, {**SITE_SETTINGS,"updated_at":NOW}, upsert=True)
        print("  ✅ site_settings — настройки сохранены")

    for col_name, idx in [("cart_items","created_date"),("favorites","product_id"),("featured_sections","sort_order")]:
        try: await db[col_name].create_index(idx)
        except: pass

    print("\n─────────────────────────────────────────────")
    for col_name, label in [
        ("categories","категорий"),("products","товаров"),("banners","баннеров"),
        ("promocodes","промокодов"),("orders","заказов"),("consultations","заявок"),
    ]:
        n = await db[col_name].count_documents({})
        print(f"  {col_name:25s} {n:>4} {label}")

    all_cats  = await db.categories.find().to_list(500)
    top_level = [c for c in all_cats if not c.get("parent_category")]
    print(f"\n  Дерево: {len(all_cats)} категорий, {len(top_level)} верхнего уровня")
    for tc in sorted(top_level, key=lambda c: c.get("sort_order", 0)):
        children   = [c for c in all_cats if c.get("parent_category") == tc["name"]]
        prod_count = await db.products.count_documents({"category": tc["name"]})
        subs       = ", ".join(c["name"] for c in children[:3])
        if len(children) > 3: subs += "…"
        kz = tc.get("name_kz","") or ""
        en = tc.get("name_en","") or ""
        print(f"    {tc.get('icon','  ')} {tc['name']:22s} [{kz[:15]:15s}] [{en[:15]:15s}] {prod_count:>2} тов.")

    client.close()
    print("\n  Done ✅  (RU/KZ/EN локализация активна)\n")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--reset" in args:
        only_i = next((i for i,a in enumerate(args) if a=="--only"), None)
        if only_i is not None and only_i+1 < len(args):
            cols = set(args[only_i+1].split(","))
            print(f"RESET: сбрасываем → {', '.join(cols)}")
            asyncio.run(seed(reset_cols=cols))
        else:
            print("FULL RESET")
            asyncio.run(seed(reset_cols=set()))
    else:
        print("SAFE MODE")
        asyncio.run(seed(reset_cols=None))
