<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planificación FCFS con Promedio de Espera</title>
    <link rel="stylesheet" href="styles.css"> <!-- Enlace al archivo CSS -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> <!-- Enlace a Chart.js -->
</head>

<body>
    <h1>Planificación de Procesos FCFS</h1>
    <br><br><br>


    <!-- Texto explicativo sobre el algoritmo FCFS -->
    <p>
        El algoritmo <strong>FCFS (First Come First Served)</strong> es uno de los métodos más simples de planificación de procesos en un sistema operativo.
        La idea central es que los procesos se ejecutan en el mismo orden en que llegan al sistema, es decir, el primero en llegar es el primero en ser atendido.
        Este algoritmo no tiene en cuenta la duración de los procesos, lo que puede generar tiempos de espera elevados para procesos cortos si están detrás de procesos largos.
    </p>
    <br><br><br>


    <!-- Formulario para ingresar datos de procesos -->
    <form id="formProcesos">
        <label for="cantidad">Cantidad de procesos:</label>
        <input type="number" id="cantidad" name="cantidad" min="1" required>
        <button type="button" onclick="generarFormulario()">Generar Procesos</button>
    </form>
    <br><br><br>

    <!-- Aquí se generarán los campos para ingresar los datos de cada proceso -->
    <div id="procesosContainer"></div>
    <br><br><br>

    <h2>Resultados de la planificación</h2>
    <table>
        <thead>
            <tr>
                <th>Proceso</th>
                <th>Tiempo de Llegada</th>
                <th>Comienzo</th>
                <th>Duración</th>
                <th>Finalización</th>
                <th>Tiempo de Espera</th>
                <th>Tiempo de Retorno</th>
            </tr>
        </thead>

        
        <tbody id="tablaFCFS">
    <!-- Resultados aquí -->
        </tbody>
    </table>
    <br><br><br>
    <h2>Promedio de Espera de Esta Planificación</h2>
    <p id="promedioEspera"></p>
    <p id="dispersion"></p>
    <p id="tiempoTotalCPU"></p>

    <br><br><br>
    <h2>Promedio de Espera de Planificaciones Acumuladas</h2>
    <p id="promedioGeneral"></p>


    <br><br><br>
    <h2>Gráfico de comparativos de Procesos (Barras Apiladas) </h2>
    <canvas id="graficoCanvas" width="800" height="400"></canvas> <br> <br><br> <!-- Gráfico de canvas -->
    <h2>Dispersón de Datos (Duración de los Procesos)</h2>
    <canvas id="graficoDispersion" width="500" height="500"></canvas>
    <p id="explicacionGrafico"></p>

    <br><br><br>
    <button onclick="window.location.href='../../index.html';">Volver al Home</button>
    <br><br><br>

    <script src="script.js"></script> <!-- Enlace al archivo JS -->
</body>

</html>