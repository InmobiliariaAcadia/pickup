# 🛻 Camioneta Pickup — Sistema de Reservas

App móvil para controlar el uso familiar de la camioneta.  
Envía notificaciones por email a **rocio@acadiainmobiliaria.com** con cada reserva.

---

## 📱 Cómo usar

Abre el archivo `index.html` en tu navegador, o súbelo a GitHub Pages para tenerlo en línea.

---

## 📧 Configurar el envío de emails (EmailJS) — Solo 1 vez

### Paso 1 — Crear cuenta en EmailJS
1. Ve a [https://www.emailjs.com](https://www.emailjs.com) y crea una cuenta **gratis**
2. El plan gratuito permite **200 emails/mes** (más que suficiente)

### Paso 2 — Conectar tu correo
1. En el panel de EmailJS, ve a **Email Services** → **Add New Service**
2. Elige Gmail, Outlook, o el correo que uses
3. Sigue las instrucciones para conectarlo
4. Apunta el **Service ID** (algo como `service_abc1234`)

### Paso 3 — Crear una plantilla de email
1. Ve a **Email Templates** → **Create New Template**
2. Copia y pega este contenido:

**Subject:**
```
Nueva reserva: {{vehiculo}} — {{miembro}}
```

**Body (HTML):**
```html
<h2>🛻 Nueva reserva confirmada</h2>
<table>
  <tr><td><b>Vehículo:</b></td><td>{{vehiculo}}</td></tr>
  <tr><td><b>Persona:</b></td><td>{{miembro}}</td></tr>
  <tr><td><b>Fecha:</b></td><td>{{fecha}}</td></tr>
  <tr><td><b>Turno:</b></td><td>{{turno}}</td></tr>
  <tr><td><b>Nota:</b></td><td>{{nota}}</td></tr>
  <tr><td><b>Registrado:</b></td><td>{{fecha_hora}}</td></tr>
</table>
```

3. En **To Email**, escribe: `rocio@acadiainmobiliaria.com`
4. Guarda y apunta el **Template ID** (algo como `template_xyz5678`)

### Paso 4 — Obtener tu Public Key
1. Ve a **Account** → **General**
2. Copia tu **Public Key**

### Paso 5 — Ingresar los datos en la app
1. Abre la app en tu celular
2. Toca el botón ⚙️ (abajo a la derecha)
3. Ingresa los 3 datos:
   - **Public Key**
   - **Service ID**
   - **Template ID**
4. Toca **Guardar**

¡Listo! Cada reserva confirmada enviará un email automáticamente.

---

## 🌐 Publicar en GitHub Pages (para acceder desde el celular)

```bash
# 1. Clona el repositorio
git clone https://github.com/InmobiliariaAcadia/pickup
cd pickup

# 2. Copia los 3 archivos: index.html, style.css, app.js

# 3. Sube los cambios
git add .
git commit -m "primera versión"
git push origin main

# 4. Activa GitHub Pages:
#    En GitHub → Settings → Pages → Source: main branch → Save
#
# Tu app estará en:
# https://inmobiliariaacadia.github.io/pickup
```

---

## 👥 Usuarios configurados
- Reytek, Acadia, Luison, Laurita, Alejandra, Doña Laura

## 📬 Email de notificaciones
- rocio@acadiainmobiliaria.com
