# Raíz & Barrio - Mercado Campesino Hiperlocal (C2C / B2C)

Plataforma de comercio electrónico hiperlocal orientada a conectar de forma directa a pequeños productores agrícolas con consumidores urbanos.

Este repositorio contiene la **página principal interactiva** fiel al diseño de referencia proporcionado, con una estética artesanal, orgánica y de diseño editorial contemporáneo.

---

## 🌾 Características Implementadas en la Portada

1. **Barra Superior & Navegación**:
   - Notificación de envíos gratis y rutas de cosecha.
   - Selector de ubicación de entrega en barrios urbanos (Chapinero Alto, Teusaquillo, Usaquén).
   - Acceso a registro/perfil de usuario y botón destacado **"Soy Productor"**.
   - Contador de carrito de compras sincronizado en tiempo real.
   - Menú de categorías de productos y nodos de acopio.

2. **Sección Hero**:
   - Titular editorial: *"Lo bueno del campo, a la vuelta de tu casa."*
   - Llamados a la acción directos: *Explorar Canastas* y *Ver Puntos de Recolección*.
   - Fotografía de huerta con sellos flotantes de trazabilidad (*Finca El Mirador · Subachoque* y *Cosechado en menos de 24 horas*).

3. **Franja de Valor (4 Pilares)**:
   - Del huerto a tu mesa (cosecha bajo demanda).
   - Comercio 100% justo (85% directo al agricultor).
   - Puntos de recogida cercanos (recogida gratuita en locales aliados).
   - Sostenible y sin plástico (canastas retornables y empaques compostables).

4. **"La cosecha de hoy" (Productos de temporada)**:
   - Temporizador regresivo en vivo (*Próximo cierre de pedidos*).
   - Tarjetas de productos (*Tomate de huerta, Aguacate Hass, Zanahoria de tierra, Fresas de temporada*).
   - Selectores de cantidad numéricos interactivos `[-] 1 [+]` y botón `+ Añadir`.

5. **"Tu canasta, al ritmo de la tierra" (Canastas Semanales)**:
   - Modelo de suscripción comunitaria con precios fijos garantizados.
   - *Canasta Huerto Familiar* ($58.000 / semana) y *Canasta Agroecológica Esencial* ($38.000 / semana).
   - Añadido directo al carrito.

6. **"El campo tiene un punto de encuentro" (Nodos Logísticos de Barrio)**:
   - **Mapa interactivo con Leaflet**: visualización de los puntos de acopio (Chapinero Alto, Teusaquillo, Usaquén).
   - Tarjetas laterales sincronizadas con el mapa: al hacer clic en una sede, el mapa se centra y abre el globo de información.
   - Módulo de postulación para que nuevos comercios de barrio sean puntos de acopio.

7. **"Conoce a nuestros agricultores" (Trazabilidad y Origen)**:
   - Historias de vida de los campesinos: *Familia Ramírez (Subachoque)*, *Huerta El Renacer (Choachí)*, y *Cooperativa La Unión (Boyacá)*.

8. **"La frescura se comparte" (Reseñas y Calificaciones)**:
   - Puntuación 4.9/5 estrellas con testimonios fotográficos reales de clientes.

9. **Carrito Lateral Desplegable (Off-Canvas Cart)**:
   - Gestión interactiva de productos: aumento/disminución de cantidad y eliminación.
   - Selector de método de entrega (*Retiro en Nodo de Recolección $0* vs *Domicilio Consolidado*).
   - Cálculo dinámico de subtotales, envíos y total general.

10. **Modal de Arquitectura de Perfiles**:
    - Al presionar **"Soy Productor"** o el botón de roles, se despliega una ventana interactiva que explica los 3 perfiles del sistema:
      - **Productor**: Publicación de cosechas, canastas y consulta de liquidaciones.
      - **Consumidor**: Compra georreferenciada, carritos y selección de puntos de recogida.
      - **Administrador**: Liquidación equitativa, gestión del catálogo general y monitoreo de KPIs logísticos.

---

## 🚀 Cómo visualizary probar la página

1. Haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador preferido (Chrome, Edge, Firefox, Safari).
2. O ejecuta un servidor local con Python desde la terminal:
   ```powershell
   py -m http.server 8000
   ```
   Y abre en tu navegador: [http://localhost:8000](http://localhost:8000)

