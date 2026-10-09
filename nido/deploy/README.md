# Poner Nido en marcha para la familia

Unos 15–20 minutos. Al terminar tendrás:

- **Nido** en `https://cruci90.github.io/git_test/nido/`, instalable en los móviles.
- **Tu servidor de sincronización** en un VPS pequeño, con HTTPS automático y copias de seguridad.

Lo que necesitas: una cuenta en un proveedor de VPS (la guía usa Hetzner Cloud; vale cualquier otro con Ubuntu), un nombre de dominio o un subdominio gratis de [DuckDNS](https://www.duckdns.org), y un ordenador con terminal.

---

## 1. Publicar la app (GitHub Pages)

El repositorio es público y ya tiene GitHub Pages activado desde una rama.

1. Fusiona la rama `claude/baby-metrics-app-design-wwiwcy` con `main` (abre un *pull request* y pulsa *Merge*).
2. En GitHub: **Settings → Pages**. Comprueba que pone *Deploy from a branch* con `main` y `/ (root)`.
3. En uno o dos minutos Nido estará en **https://cruci90.github.io/git_test/nido/**.

Cada vez que se fusione un cambio en `main`, la app se actualiza sola y avisa en los móviles con "Nueva versión de Nido lista".

## 2. Crear el servidor

1. En [Hetzner Cloud](https://console.hetzner.cloud): *New project* → *Add server*.
   - **Ubicación**: cualquiera de Alemania o Finlandia (datos en la UE).
   - **Imagen**: Ubuntu 24.04.
   - **Tipo**: el más pequeño de CPU compartida (unos 4–5 € al mes). Sobra para una familia.
   - **SSH key**: añade tu clave pública. Si no tienes, en tu ordenador: `ssh-keygen -t ed25519` y copia el contenido de `~/.ssh/id_ed25519.pub`.
   - **Nombre**: `nido`.
2. Apunta la **IP pública** que te da (algo como `65.21.x.x`).

## 3. Apuntar un nombre al servidor

Caddy necesita un nombre para pedir el certificado HTTPS.

- **Con DuckDNS (gratis)**: entra con tu cuenta, crea un subdominio (por ejemplo `nido-garcia`) y pon la IP del servidor. Tu dirección será `nido-garcia.duckdns.org`.
- **Con tu dominio**: crea un registro **A** `nido.tu-dominio.com` → IP del servidor.

Espera un par de minutos a que se propague. Puedes comprobarlo con `ping nido-garcia.duckdns.org`.

## 4. Instalar con un comando

Desde tu ordenador:

```
ssh root@IP_DEL_SERVIDOR
```

Ya dentro del servidor (cambia el dominio y el correo):

```
curl -fsSL https://raw.githubusercontent.com/Cruci90/git_test/main/nido/deploy/setup-vps.sh -o setup.sh
bash setup.sh nido-garcia.duckdns.org tu@correo.com
```

El script actualiza el sistema, activa las actualizaciones de seguridad automáticas, instala Docker, abre solo los puertos 22, 80 y 443, descarga Nido y arranca el servidor con Caddy. Al final comprueba que responde por HTTPS y te muestra la dirección que hay que poner en la app.

> El script descarga Nido de la rama `main`. Si aún no la has fusionado, añade delante `BRANCH=claude/baby-metrics-app-design-wwiwcy`.

## 5. Conectar los móviles

1. Abre Nido en el primer móvil → **Ajustes → Compartir con otro cuidador**.
2. En *Dirección de tu servidor*, escribe `https://nido-garcia.duckdns.org` y pulsa **Crear y obtener código**.
3. Envía el código al otro cuidador por un canal privado.
4. En el otro móvil: **Ajustes → Compartir → Unirme con un código**, pega el código y elige qué hacer con lo que ya tenía.
5. Instala Nido en la pantalla de inicio de los dos móviles (Safari: Compartir → *Añadir a pantalla de inicio*; Chrome: menú → *Instalar aplicación*) y activa las notificaciones en **Ajustes → Avisos**.

---

## Mantenimiento

**Copias de seguridad** (los datos siguen cifrados). Para hacer una cada noche a las 3:30, en el servidor:

```
crontab -e
30 3 * * * bash /opt/nido/nido/deploy/backup.sh >/dev/null 2>&1
```

Guarda las 14 últimas en `/root/nido-backups`. Para llevártelas a tu ordenador: `scp root@IP:/root/nido-backups/*.tgz .`

**Actualizar el servidor** cuando haya cambios en Nido:

```
cd /opt/nido && git pull && cd nido/deploy && docker compose up -d --build
```

**Ver si todo va bien**:

```
curl https://nido-garcia.duckdns.org/v1/health        # debe responder {"ok":true,…}
cd /opt/nido/nido/deploy && docker compose ps          # los dos servicios "running"
docker compose logs --tail 50 caddy                    # registros de HTTPS
```

**Restaurar una copia** en un servidor nuevo: instala con el paso 4 y después

```
cd /opt/nido/nido/deploy && docker compose stop relay
docker run --rm -v nido_relay-data:/data -v /root/nido-backups:/b alpine sh -c "rm -rf /data/* && tar xzf /b/nido-relay-AAAA-MM-DD.tgz -C /data"
docker compose start relay
```

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El script dice que el dominio apunta a otra IP | El DNS aún no se ha propagado o la IP está mal escrita. Espera y vuelve a ejecutar `bash setup.sh …` |
| *No se puede conectar con ese servidor* en la app | La dirección debe empezar por `https://` y sin barra final. Prueba `/v1/health` en el navegador del móvil |
| Funciona en el ordenador pero no en el móvil | Revisa `ALLOW_ORIGIN` en `/opt/nido/nido/deploy/.env`: debe ser `https://cruci90.github.io` (o `*`). Tras cambiarlo: `docker compose up -d` |
| *Esta familia se cerró o cambió de clave* | Alguien cambió la clave: pide el código nuevo |

## Alternativa: un ordenador de casa

Si tienes un ordenador o una Raspberry Pi siempre encendidos, puedes usarlos en lugar del VPS, sin abrir puertos en el router:

1. Instala Docker y arranca solo el relé: `cd nido/server && docker build -t nido-relay . && docker run -d --restart unless-stopped -p 127.0.0.1:8787:8787 -v nido-data:/data nido-relay`.
2. Con un dominio en Cloudflare, crea un *Cloudflare Tunnel* que apunte `nido.tu-dominio.com` a `http://localhost:8787`. Cloudflare pone el HTTPS.

Si ese ordenador se apaga, los móviles siguen funcionando y se sincronizan cuando vuelva.
