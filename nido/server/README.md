# Nido · servidor de sincronización

Relé mínimo para compartir Nido entre cuidadores. Todo llega **cifrado de extremo a extremo** (AES‑256‑GCM): el servidor guarda bloques ilegibles numerados por familia y no puede ver nombres, fechas, fotos ni qué tipo de registro es. Sin dependencias; basta Node 18 o superior.

## Cómo funciona

1. En un móvil, *Ajustes → Compartir → Crear la familia* con la dirección de este servidor. Nido genera en el propio móvil un identificador de familia y una clave de 256 bits.
2. Nido muestra un **código de invitación** (`https://servidor#nido1.<familia>.<clave>`). La clave va detrás de `#`, que el navegador nunca envía al servidor.
3. El otro cuidador pega el código en *Unirme con un código*.
4. Cada cambio se cifra antes de salir. El servidor autoriza con un token derivado de la clave (guarda solo su huella SHA‑256), así que sin el código nadie puede leer ni escribir.
5. Si hay dos cambios del mismo registro, gana el más reciente. Los cambios llegan a los demás en uno o dos segundos (long‑poll), y si un móvil está sin conexión se envían al volver.

## Ponerlo en marcha

Los navegadores exigen **HTTPS** cuando la app se sirve por HTTPS, así que el servidor necesita un certificado (todas las opciones de abajo lo dan).

### En local, para probar

```
cd nido/server
node relay.mjs            # http://localhost:8787, datos en ./data
```

### Render

1. Nuevo *Web Service* desde este repositorio, carpeta raíz `nido/server`.
2. *Start command*: `node relay.mjs`.
3. Añade un *Disk* montado en `/data` y la variable `DATA_DIR=/data`. El disco persistente requiere un plan de pago; sin él, los datos del servidor se pierden en cada despliegue o reinicio (los móviles conservan su copia y la vuelven a subir si creas otra familia).

### Fly.io

```
cd nido/server
fly launch --no-deploy          # usa el Dockerfile
fly volumes create nido_data --size 1
# en fly.toml: [mounts] source = "nido_data", destination = "/data"
fly deploy
```

### VPS o un ordenador en casa (Docker)

```
cd nido/server
docker build -t nido-relay .
docker run -d --restart unless-stopped -p 8787:8787 -v nido-data:/data nido-relay
```

Pon delante un proxy con HTTPS (Caddy es lo más sencillo: `nido.tu-dominio.com { reverse_proxy localhost:8787 }`). Si prefieres no abrir puertos en casa, Cloudflare Tunnel o Tailscale Funnel también sirven.

## Configuración

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `8787` | Puerto HTTP |
| `DATA_DIR` | `./data` | Dónde se guardan las familias (un directorio por familia) |
| `MAX_OP_BYTES` | 4 MB | Tamaño máximo de un cambio cifrado (fotos incluidas) |
| `MAX_SPACE_BYTES` | 300 MB | Espacio máximo por familia |
| `ALLOW_ORIGIN` | `*` | Origen permitido (CORS). Pon aquí la dirección de tu Nido si quieres restringirlo |

## API

| Método y ruta | Qué hace |
|---|---|
| `GET /v1/health` | Comprueba que es un servidor de Nido |
| `POST /v1/spaces/:familia/ops` | Añade cambios cifrados `{ ops: [{ iv, ct }] }`. La primera escritura registra el token |
| `GET /v1/spaces/:familia/ops?after=N&wait=25` | Devuelve los cambios posteriores a `N`; con `wait` espera hasta 25 s a que haya novedades |
| `DELETE /v1/spaces/:familia` | Borra los datos de la familia; los códigos antiguos reciben `410` |

Todas las rutas de familia requieren `Authorization: Bearer <token>`.

## Qué sabe el servidor

- Cuántas familias hay, cuántos cambios manda cada una, cuándo y de qué tamaño.
- Las direcciones IP de los móviles (como cualquier servidor web).
- **No** sabe nada del contenido: ni el nombre del bebé, ni fechas, ni tipos de registro, ni fotos.

## Copias de seguridad

Basta con copiar `DATA_DIR`. Los datos siguen cifrados, así que la copia no expone nada. Aun así, cada móvil guarda los datos completos y puede exportar su propia copia desde *Ajustes*.
