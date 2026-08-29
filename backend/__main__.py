#!/usr/bin/env python3
# ============================================================
#  RPG Maker Launcher - Backend Python (Entry Point)
# ============================================================
# Permite ejecutar el backend como:
#   python -m backend --port 8000
#   python -m backend api --port 8000
#   python -m backend decrypt --game /path/to/game
# ============================================================
import sys
import argparse


def main():
    parser = argparse.ArgumentParser(
        description="RPG Maker Launcher - Backend Python",
        prog="python -m backend"
    )
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")
    
    # Default: run API server
    api_parser = subparsers.add_parser("api", help="Iniciar servidor API REST + SSE")
    api_parser.add_argument("--port", type=int, default=0, help="Puerto (0 = automático)")
    
    # Decrypt command
    decrypt_parser = subparsers.add_parser("decrypt", help="Descifrar assets de un juego")
    decrypt_parser.add_argument("game", help="Ruta del juego")
    decrypt_parser.add_argument("--output", "-o", help="Directorio de salida")
    decrypt_parser.add_argument("--recreate", action="store_true", 
                               help="Reconstruir proyecto original")
    
    # Config command
    config_parser = subparsers.add_parser("config", help="Gestionar configuración")
    config_parser.add_argument("--show", action="store_true", help="Mostrar configuración actual")
    config_parser.add_argument("--defaults", action="store_true", 
                              help="Restablecer valores por defecto")
    
    # Plugins command
    plugins_parser = subparsers.add_parser("plugins", help="Gestionar plugins")
    plugins_parser.add_argument("action", choices=["list", "enable", "disable", "restore"])
    plugins_parser.add_argument("game", help="Ruta del juego")
    plugins_parser.add_argument("names", nargs="*", help="Nombres de plugins")
    plugins_parser.add_argument("--all", action="store_true", help="Aplicar a todos")
    
    # Sync command
    sync_parser = subparsers.add_parser("sync", help="Sincronizar partidas")
    sync_parser.add_argument("action", choices=["push", "pull", "status"])
    sync_parser.add_argument("saves_dir", help="Directorio de saves local")
    sync_parser.add_argument("dest_dir", help="Directorio destino")
    
    # Save command
    save_parser = subparsers.add_parser("save", help="Editar partidas guardadas")
    save_parser.add_argument("action", choices=["show", "backup"])
    save_parser.add_argument("save_file", help="Archivo de guardado")
    save_parser.add_argument("--game", default="juego", help="Nombre del juego")
    
    args = parser.parse_args()
    
    if args.command is None or args.command == "api":
        from .api import run_api_server
        port = getattr(args, 'port', 0)
        run_api_server(port)
    
    elif args.command == "decrypt":
        from .decrypter import decrypt_rgss, ensure_binary
        ensure_binary()
        code, out = decrypt_rgss(args.game, args.output, args.recreate)
        sys.exit(code)
    
    elif args.command == "config":
        from .config import load_config, save_config, DEFAULT_CONFIG
        import json
        
        if args.defaults:
            save_config(DEFAULT_CONFIG.copy())
            print("Configuración restablecida a valores por defecto")
        else:
            cfg = load_config()
            print(json.dumps(cfg, ensure_ascii=False, indent=2))
    
    elif args.command == "plugins":
        from .plugins import get_plugins_status, toggle_plugin, restore_plugins
        
        if args.action == "list":
            path, analyzed, has_bak = get_plugins_status(args.game)
            n_on = sum(1 for p in analyzed if p.get("status"))
            print("Plugins: %d activos de %d totales" % (n_on, len(analyzed)))
            for p in analyzed:
                estado = "ON " if p.get("status") else "off"
                print("%s %s" % (estado, p.get("name", "?")))
        
        elif args.action in ("enable", "disable"):
            try:
                modified = toggle_plugin(args.game, args.names, 
                                        args.action == "enable", args.all)
                print("Modificados: %d plugins" % len(modified))
            except ValueError as e:
                print("Error: %s" % e)
                sys.exit(1)
        
        elif args.action == "restore":
            restore_plugins(args.game)
            print("Plugins restaurados")
    
    elif args.command == "sync":
        from .sync import push, pull, count_saves
        
        if args.action == "push":
            n = push(args.saves_dir, args.dest_dir)
            print("Copiados: %d archivos" % n)
        elif args.action == "pull":
            n, bak = pull(args.saves_dir, args.dest_dir)
            print("Copiados: %d archivos" % n)
            if bak:
                print("Backup: %s" % bak)
        elif args.action == "status":
            local = count_saves(args.saves_dir)
            dest = count_saves(args.dest_dir)
            print("Local: %d saves" % local)
            print("Destino: %d saves" % dest)
    
    elif args.command == "save":
        from .saveedit import get_save_info, create_backup
        import json
        
        if args.action == "show":
            info = get_save_info(args.save_file)
            if info:
                print(json.dumps(info, ensure_ascii=False, indent=2))
            else:
                print("Error al leer el save")
                sys.exit(1)
        elif args.action == "backup":
            path = create_backup(args.save_file, game_name=args.game)
            if path:
                print("Backup creado: %s" % path)
            else:
                print("Error al crear backup")
                sys.exit(1)


if __name__ == "__main__":
    main()
