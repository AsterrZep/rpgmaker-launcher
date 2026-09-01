export namespace core {
	
	export class ActorInfo {
	    id: number;
	    name: string;
	    level: number;
	    hp: number;
	    mp: number;
	
	    static createFrom(source: any = {}) {
	        return new ActorInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.level = source["level"];
	        this.hp = source["hp"];
	        this.mp = source["mp"];
	    }
	}
	export class SyncConfig {
	    folder?: string;
	    auto: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SyncConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.folder = source["folder"];
	        this.auto = source["auto"];
	    }
	}
	export class GeneralConfig {
	    webkit: boolean;
	    auto_delete_zip: boolean;
	    lang?: string;
	    games_dir?: string;
	
	    static createFrom(source: any = {}) {
	        return new GeneralConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.webkit = source["webkit"];
	        this.auto_delete_zip = source["auto_delete_zip"];
	        this.lang = source["lang"];
	        this.games_dir = source["games_dir"];
	    }
	}
	export class TeclasConfig {
	    trucos: string;
	    recargar: string;
	    fps: string;
	    captura: string;
	    pantalla_completa: string;
	    salir_pantalla_completa: string;
	    zoom_in: string;
	    zoom_out: string;
	    zoom_0: string;
	
	    static createFrom(source: any = {}) {
	        return new TeclasConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.trucos = source["trucos"];
	        this.recargar = source["recargar"];
	        this.fps = source["fps"];
	        this.captura = source["captura"];
	        this.pantalla_completa = source["pantalla_completa"];
	        this.salir_pantalla_completa = source["salir_pantalla_completa"];
	        this.zoom_in = source["zoom_in"];
	        this.zoom_out = source["zoom_out"];
	        this.zoom_0 = source["zoom_0"];
	    }
	}
	export class AppConfig {
	    teclas: TeclasConfig;
	    general: GeneralConfig;
	    sync?: SyncConfig;
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.teclas = this.convertValues(source["teclas"], TeclasConfig);
	        this.general = this.convertValues(source["general"], GeneralConfig);
	        this.sync = this.convertValues(source["sync"], SyncConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DataItem {
	    id: number;
	    name: string;
	    description: string;
	    price?: number;
	    atk?: number;
	    def?: number;
	    mp_cost?: number;
	    hp?: number;
	    exp?: number;
	    gold?: number;
	
	    static createFrom(source: any = {}) {
	        return new DataItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.price = source["price"];
	        this.atk = source["atk"];
	        this.def = source["def"];
	        this.mp_cost = source["mp_cost"];
	        this.hp = source["hp"];
	        this.exp = source["exp"];
	        this.gold = source["gold"];
	    }
	}
	export class DataResult {
	    category: string;
	    items: DataItem[];
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new DataResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = source["category"];
	        this.items = this.convertValues(source["items"], DataItem);
	        this.count = source["count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GameInfo {
	    name: string;
	    path: string;
	    engine: string;
	    engine_label: string;
	    is_web: boolean;
	    is_incomplete: boolean;
	    has_cover: boolean;
	    cover_url?: string;
	    favorite: boolean;
	    seconds: number;
	    last_played?: number;
	    has_saves: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GameInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.engine = source["engine"];
	        this.engine_label = source["engine_label"];
	        this.is_web = source["is_web"];
	        this.is_incomplete = source["is_incomplete"];
	        this.has_cover = source["has_cover"];
	        this.cover_url = source["cover_url"];
	        this.favorite = source["favorite"];
	        this.seconds = source["seconds"];
	        this.last_played = source["last_played"];
	        this.has_saves = source["has_saves"];
	    }
	}
	
	export class LaunchResult {
	    ok: boolean;
	    game: string;
	    engine?: string;
	    type?: string;
	    port?: number;
	
	    static createFrom(source: any = {}) {
	        return new LaunchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.game = source["game"];
	        this.engine = source["engine"];
	        this.type = source["type"];
	        this.port = source["port"];
	    }
	}
	export class ModsResult {
	    ok: boolean;
	    mods_dir: string;
	    created: boolean;
	    mods: string[];
	
	    static createFrom(source: any = {}) {
	        return new ModsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.mods_dir = source["mods_dir"];
	        this.created = source["created"];
	        this.mods = source["mods"];
	    }
	}
	export class SaveInfo {
	    summary: Record<string, any>;
	    gold: number;
	    items: Record<string, number>;
	    weapons: Record<string, number>;
	    armors: Record<string, number>;
	    variables: Record<string, any>;
	    switches: Record<string, any>;
	    actors: ActorInfo[];
	
	    static createFrom(source: any = {}) {
	        return new SaveInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summary = source["summary"];
	        this.gold = source["gold"];
	        this.items = source["items"];
	        this.weapons = source["weapons"];
	        this.armors = source["armors"];
	        this.variables = source["variables"];
	        this.switches = source["switches"];
	        this.actors = this.convertValues(source["actors"], ActorInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanResult {
	    games: GameInfo[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.games = this.convertValues(source["games"], GameInfo);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class UpdateResult {
	    update_available: boolean;
	    tag_name: string;
	    current_version: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.update_available = source["update_available"];
	        this.tag_name = source["tag_name"];
	        this.current_version = source["current_version"];
	        this.url = source["url"];
	    }
	}

}

export namespace services {
	
	export class EventData {
	    event_type: string;
	    data: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new EventData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.event_type = source["event_type"];
	        this.data = source["data"];
	    }
	}

}

