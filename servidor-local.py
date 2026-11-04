"""Servidor local de Lúmina para desarrollo.

Sirve la carpeta actual en http://127.0.0.1:5173 con Cache-Control: no-store,
para que el navegador nunca reutilice versiones antiguas de los módulos ES.
Así, tras editar JavaScript, basta recargar la página.

Uso:
    python servidor-local.py          -> puerto 5173
    python servidor-local.py 5174     -> otro puerto
"""

import http.server
import socketserver
import sys

PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class Manejador(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Sin caché: cada recarga pide los archivos de nuevo.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, formato, *args):
        # Menos ruido en la ventana: solo métodos y rutas.
        print("%s - %s" % (self.address_string(), formato % args))


class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    try:
        with Servidor(("127.0.0.1", PUERTO), Manejador) as servidor:
            print()
            print("  LUMINA - SERVIDOR LOCAL")
            print("  Abre en tu navegador:  http://127.0.0.1:%d/" % PUERTO)
            print("  Panel:                 http://127.0.0.1:%d/admin.html" % PUERTO)
            print("  Deja esta ventana abierta. Para detenerlo: Ctrl + C")
            print()
            try:
                servidor.serve_forever()
            except KeyboardInterrupt:
                print("\nServidor detenido.")
    except OSError as error:
        print()
        print("  No se pudo iniciar el servidor en el puerto %d." % PUERTO)
        print("  Detalle: %s" % error)
        print()
        print("  Suele haber otra ventana del servidor abierta.")
        print("  Ciérrala con Ctrl + C y vuelve a ejecutar servir-local.bat.")
        print()
        input("  Pulsa Enter para salir...")
