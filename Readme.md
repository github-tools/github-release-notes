gren 🤖
Notas de la versión de Github y generador de registro de cambios

versión npm Estado de construcción Únase al chat en https://gitter.im/github-release-notes/Lobby Codecov descargas npm Notas de la versión automatizada de gren

Todos los colaboradores

OK, ¿qué puedo grenhacer por mí?
gren es un pequeño robot útil que le servirá para crear una versión a partir de una etiqueta y compilar las notas de la versión utilizando problemas o confirmaciones.

También puede generar un CHANGELOG.mdarchivo basado en las notas de la versión (o generar uno nuevo).

La motivación y el concepto
Alimentar 🤖
Instalación
Uso básico
Archivo de configuración
Documentación completa
La motivación y el concepto
A todo el mundo le encantan las notas de la versión claras, transparentes e informativas. Todos también preferirían evitar mantenerlos. Qué molestia tener que evaluar qué problemas se han resuelto entre dos puntos en la línea de tiempo del proyecto, qué tipos de problemas eran, son importantes para informar a los usuarios, qué problemas los resolvieron, etc.

¿No sería genial obtener fantásticas notas de la versión compiladas automáticamente en función de todo el arduo trabajo que dedicó a sus problemas de GitHub y solicitudes de extracción?

La principal motivación para darle grenvida fue la necesidad de autogenerar notas de lanzamiento para cada etiqueta en un proyecto. El proceso, como se explica aquí , requiere que el etiquetador vaya a la página de lanzamientos de su proyecto en GitHub, redacte esa etiqueta como una nueva versión y agregue manualmente lo que ha cambiado.

Deje que grense encargue de eso por usted. Automatiza este proceso y también escribe notas de la versión para usted, creando algo como esto:

v0.6.0 (14/03/2017)
Mejoras en el marco:
# 32 Desenvuelve las promesas de github-api
# 26 Usar archivo de configuración externo
# 23 Introduzca plantillas para los problemas
# 19 Agrega una bandera de "ignorar etiqueta"
# 12 Agregue la oportunidad de reconstruir el historial de notas de la versión
Corrección de errores:
# 29 Eliminar el carácter de escape en expresiones regulares
# 24 La acción del registro de cambios no compila la última versión
(si, este es uno de 🤖 lanzamientos reales)

Alimentar gren 🤖
¿De dónde provienen los datos? Hay dos opciones:

issues (⭐)
Si gestiona su proyecto con problemas, ahí es donde está toda la información sobre un cambio. Las etiquetas de los problemas aumentan el nivel de profundidad de lo que deberían mostrar las notas de la versión, lo que ayuda grena agrupar las notas.

por ejemplo, si ve el ejemplo anterior, los problemas se agrupan por las dos etiquetas enhancementy bugluego se personalizan mediante un archivo de configuración.

grengenera esas notas mediante la recopilación de todos los problemas cerrados entre una etiqueta (predeterminada a la última) y la etiqueta anterior (o una etiqueta que especifique). Si desea ser más preciso en los problemas que pertenecen a una versión, puede agruparlos en hitos y usar solo los problemas que pertenecen a ese hito.

El resultado anterior es el resultado de notas de la versión creadas a partir de problemas.

Ayuda 🤖 escribir cosas maravillosas (temas)
Para tener notas de la versión generadas espléndidamente, recomendamos seguir estas convenciones:

Empiece el título con un verbo (por ejemplo, cambiar estilos de encabezado)
Use el modo imperativo en el título (por ejemplo, estilos de encabezado Fix, not Fixed o Fixes)
Utilice las etiquetas con prudencia y asigne una etiqueta por número. grentiene la opción de ignorar los problemas que tienen una de las etiquetas especificadas.
commits
La forma más sencilla de obtener datos es a partir de las confirmaciones que escribe. Aunque no requiere un compromiso legible por máquina, es mejor tenerlos en un formato agradable.

La salida luego usa mensajes de confirmación (título + descripción) para que se parezcan a:

v0.9.0 (17/05/2017)
Filtrar hitos (# 75)
Opción de fuente de datos de creación de hitos
Agregar documentación para la opción de hitos
Soporte empresarial de GitHub (# 73)
Apoya a la empresa GitHub
Agregar api-url a la documentación de opciones
Actualizar CHANGELOG.md
Ayuda 🤖 escribir cosas maravillosas (se compromete)
Para tener notas de la versión generadas espléndidamente, recomendamos seguir estas convenciones:

Comience la línea de asunto con un verbo (por ejemplo, cambiar estilos de encabezado)
Utilice el modo imperativo en la línea de asunto (por ejemplo, estilos de encabezado Fix, not Fixed o Fixes)
Limite la línea de asunto a unos 50 caracteres
No termine la línea de asunto con un punto
Separe el asunto del cuerpo con una línea en blanco
Envuelve el cuerpo a 72 caracteres
Usa el cuerpo para explicar qué y por qué no cómo
Instalación
Instalar a github-release-notestravés de npm:

npm instalar github-release-notes -g
Preparar
Primero, genere un GitHub token, con alcance de repositorio , en este enlace . Luego agregue esta línea a ~/.bash_profile(o ~/.zshrc):

exportar GREN_GITHUB_TOKEN = your_token_here
Muestre a Internet que usa gren para automatizar sus notas de lanzamiento -> Notas de la versión automatizada de gren

[![Automated Release Notes by gren](https://img.shields.io/badge/%F0%9F%A4%96-release%20notes-00B2EE.svg)](https://github-tools.github.io/github-release-notes/)
Uso básico
grenobtiene la información del repositorio directamente de la carpeta donde gitse inicializa.

# Navegue al directorio de su proyecto 
cd  ~ / Path / to / repo
 # Ejecute la tarea (ver más abajo) 
gren release
De lo contrario, puede ejecutarlo en cualquier lugar pasando la información del repositorio:

gren release --username = [nombre de usuario] --repo = [nombre del repositorio]
Si no desea guardar el token, puede especificar uno como opción:

gren release --token = [tu token]
Ver todas las opciones aquí
Comandos
Hay dos comandos principales que se pueden ejecutar con 🤖:

gren release
grenbuscará la última etiqueta, redactará una nueva versión utilizando los problemas cerrados entre la creación de esa etiqueta y la anterior y publicará esa versión en su panel de versiones en su repositorio de GitHub. ( @ver cómo alimentar🤖).

gren changelog
Cree un CHANGELOG.mdarchivo usando todas las notas de la versión del repositorio (como las generadas por 🤖 ). Si el archivo ya existe, use la --overrideopción para continuar.

registro de cambios de gren: anular
Para generar notas de la versión completamente nuevas, utilizando el mismo enfoque que las versiones, debe ejecutar el comando con la --generateopción.

gren changelog --generate
¡Ayuda! 🆘
grenestá usando Commander.js que genera la --helpsección. Para activar la ayuda de un comando, ejecute:

# Uso general
gren --ayuda
# Uso del comando 
gren help release # o gren release --help
También es posible ver todos los ejemplos aquí o directamente en la terminal:

liberación de ejemplos de gren
Archivo de configuración
Puede crear un archivo de configuración donde se ejecutará la tarea para especificar sus opciones. Vea cómo configurar el archivo de configuración Las extensiones de archivo aceptadas son las siguientes:

.grenrc
.grenrc.json
.grenrc.yml
.grenrc.yaml
.grenrc.js
En eso
Si necesita ayuda para crear el archivo de configuración, puede ejecutar el siguiente comando y seguir las instrucciones

gren init
Vea la documentación completa aquí
Colaboradores ✨
Gracias a estas maravillosas personas ( clave emoji ):


Dan Klausner
🐛 💻	
David Sevilla Martín
📖	
Alexander Vassbotn Røyne-Helgesen
🐛 💻	
Joaquín Corchero
💻	
David Parker
💻	
Mario Tacke
💻	
Kevin Yeh
💻

Jack O'Connor
💻	
Keith Stolte
📖 🎨	
David Poindexter
📖	
Frank S. Thomas
💻	
pawk
💻	
Yang, Bo
💻	
Víctor Martínez
📖

Tyler Hogan
💻	
Blair Gemmer
📖	
Han
💻	
Donmahallem
💻	
Ahmed
💻	
Mônica Ribeiro
💻
Este proyecto sigue la especificación de todos los contribuyentes . ¡Contribuciones de cualquier tipo son bienvenidas!
