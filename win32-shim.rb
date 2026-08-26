# ============================================================
#  RPG Maker Launcher · win32-shim.rb
#  Precarga de mkxp-z (mkxp.json -> preloadScript).
#  Los juegos con scripts exclusivos de Windows (Pearl Kernel,
#  fullscreen hacks, etc.) llaman a Win32API.new('user32', ...).
#  En Linux esa DLL no existe y el arranque muere. Este shim
#  convierte esas llamadas en stubs inofensivos (devuelven 0),
#  igual que haria el juego al no encontrar su ventana.
# ============================================================
if defined?(MiniFFI)
  class << MiniFFI
    alias_method :__rpgml_orig_new, :new

    def new(libname, func = nil, *rest)
      __rpgml_orig_new(libname, func, *rest)
    rescue RuntimeError, TypeError => e
      win_dll = libname.to_s.downcase =~ /user32|kernel32|gdi32|shell32|comdlg32|winmm|advapi32/
      raise unless win_dll
      RPGML::DummyAPI.new(func)
    end
  end

  module RPGML
    # Stub de funcion FFI: devuelve 0 (= fallo inofensivo para casi
    # todas las APIs de ventana de Windows).
    class DummyAPI
      def initialize(name)
        @name = name.to_s
      end

      def call(*_args)
        0
      end
      alias_method :Call, :call
    end
  end
end
