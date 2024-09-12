let chartInstanceGantt; // Variable para el gráfico de Gantt
let chartInstanceDispersion; // Variable para el gráfico de dispersión

// Generar el formulario para ingresar datos de procesos
function generarFormulario() {
    const cantidad = document.getElementById('cantidad').value;
    const procesosContainer = document.getElementById('procesosContainer');
    procesosContainer.innerHTML = ''; // Limpiar el contenedor

    // Crear los inputs para cada proceso
    for (let i = 0; i < cantidad; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>Proceso ${i + 1}</h3> <br>
            <label for="nombre${i}">Nombre:</label>
            <input type="text" id="nombre${i}" required>
            <label for="llegada${i}">Tiempo de llegada:</label>
            <input type="number" id="llegada${i}" min="0" required>
            <label for="burst${i}">Duración (burst):</label>
            <input type="number" id="burst${i}" min="1" required>
            <br><br>
        `;
        procesosContainer.appendChild(div);
    }

    // Botón para procesar los datos
    const calcularButton = document.createElement('button');
    calcularButton.textContent = "Calcular Planificación";
    calcularButton.type = "button";
    calcularButton.onclick = calcularPlanificacion;
    procesosContainer.appendChild(calcularButton);
}

// Función para calcular la planificación SJN y mostrar resultados
async function calcularPlanificacion() {
    const cantidad = document.getElementById('cantidad').value;
    const procesos = [];

    // Obtener datos de los procesos
    for (let i = 0; i < cantidad; i++) {
        const nombre = document.getElementById(`nombre${i}`).value;
        const llegada = parseInt(document.getElementById(`llegada${i}`).value);
        const burst = parseInt(document.getElementById(`burst${i}`).value);
        procesos.push({ nombre, llegada, burst, burst_restante: burst });
    }

    // Ordenar procesos por tiempo de llegada
    procesos.sort((a, b) => a.llegada - b.llegada);

    let tiempoActual = 0;
    let tiempoTotalCPU = 0;  // Inicializar tiempo total de CPU
    let procesosPendientes = [...procesos];
    let procesosPlanificados = [];

    while (procesosPendientes.length > 0) {
        // Filtrar los procesos que han llegado hasta el momento
        const procesosDisponibles = procesosPendientes.filter(proceso => proceso.llegada <= tiempoActual);

        if (procesosDisponibles.length === 0) {
            // Si no hay procesos disponibles, avanzar el tiempo al próximo proceso que llegue
            tiempoActual = Math.min(...procesosPendientes.map(p => p.llegada));
            continue;
        }

        // Seleccionar el proceso con el menor burst restante
        procesosDisponibles.sort((a, b) => a.burst_restante - b.burst_restante);
        const procesoActual = procesosDisponibles.shift();

        // El proceso comienza en el tiempo actual
        procesoActual.comienzo = tiempoActual;
        procesoActual.finalizacion = procesoActual.comienzo + procesoActual.burst;
        procesoActual.espera = procesoActual.comienzo - procesoActual.llegada;
        procesoActual.retorno = procesoActual.finalizacion - procesoActual.llegada;
        procesoActual.respuesta = procesoActual.espera;

        // Actualizar el tiempo actual
        tiempoActual = procesoActual.finalizacion;

        // Guardar el proceso planificado
        procesosPlanificados.push(procesoActual);

        // Remover el proceso actual de los pendientes
        procesosPendientes = procesosPendientes.filter(p => p.nombre !== procesoActual.nombre);
    }

    // Mostrar los resultados en la tabla
    mostrarResultados(procesosPlanificados);

    // Mostrar el tiempo total ocupado en la CPU
    const tiempoTotalElement = document.getElementById('tiempoTotalCPU');
    if (tiempoTotalElement) {
        tiempoTotalElement.textContent = `El tiempo total que los procesos ocupan en la CPU es: ${tiempoTotalCPU} unidades de tiempo.`;
    } else {
        console.error('Elemento con ID "tiempoTotalCPU" no encontrado.');
    }

    // Resto del cálculo de desviación estándar, varianza y promedios
    const { varianza, desviacionEstandar } = calcularDesviacionEstandar(procesosPlanificados);
    document.getElementById('dispersion').innerHTML = `
    <strong>La varianza de las duraciones es: ${varianza.toFixed(2)}.</strong>
    <strong>La varianza</strong> mide cuánto varían los tiempos de duración de los procesos con respecto a la media (promedio) de esos tiempos.
    En este caso, una varianza de ${varianza.toFixed(2)} indica que los tiempos de duración de los procesos están distribuidos a una cierta distancia del valor promedio. Un valor alto de varianza sugiere que las duraciones son bastante desiguales entre los procesos, mientras que un valor bajo indicaría que los tiempos de ejecución son más homogéneos.
    
    <strong>La desviación estándar</strong> de las duraciones es: ${desviacionEstandar.toFixed(2)} unidades de tiempo.
    <strong>La desviación estándar es la raíz cuadrada de la varianza</strong> y da una idea de cuán dispersos están los tiempos de duración alrededor de la media, pero en las mismas unidades que el burst time.
    Una desviación estándar de ${desviacionEstandar.toFixed(2)} indica que, en promedio, los tiempos de duración de los procesos difieren del valor promedio por ${desviacionEstandar.toFixed(2)} unidades de tiempo. Cuanto mayor sea este número, más dispares serán las duraciones de los procesos, lo que puede afectar la equidad y eficiencia de la planificación.
    `;

    const promedioEspera = calcularPromedioEspera(procesosPlanificados);
    almacenarPromedioEspera(promedioEspera);
    document.getElementById('promedioEspera').textContent = `
        El promedio de tiempo de espera es: ${promedioEspera.toFixed(2)} unidades de tiempo.
    
        Relación con la Planificación de Procesos:
        • Significado en la planificación: Si las duraciones de los procesos son muy variables (alta varianza y desviación estándar), podrías observar que algunos procesos tardan mucho más en completarse que otros, lo que podría provocar problemas como el hambre (procesos cortos esperando demasiado tiempo) o poca eficiencia en sistemas con alta carga.
    `;

    imprimirPromedioGeneral();

    generarGrafico(procesosPlanificados);
    generarGraficoDispersion(procesosPlanificados);
}

// Función para mostrar los resultados en la tabla
function mostrarResultados(procesos) {
    const tablaFCFS = document.getElementById('tablaFCFS');
    tablaFCFS.innerHTML = ''; // Limpiar la tabla

    procesos.forEach(proceso => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td data-label="Proceso">${proceso.nombre}</td>
            <td data-label="Tiempo de Llegada">${proceso.llegada}</td>
            <td data-label="Comienzo">${proceso.comienzo}</td>
            <td data-label="Duración">${proceso.burst}</td>
            <td data-label="Finalización">${proceso.finalizacion}</td>
            <td data-label="Tiempo de Espera">${proceso.espera}</td>
            <td data-label="Tiempo de Retorno">${proceso.retorno}</td>
        `;
        tablaFCFS.appendChild(row);
    });
}

// Función para calcular la desviación estándar de las duraciones (burst times)
function calcularDesviacionEstandar(procesos) {
    const n = procesos.length;
    const burstTimes = procesos.map(proceso => proceso.burst);

    // Calcular la media
    const media = burstTimes.reduce((sum, burst) => sum + burst, 0) / n;

    // Calcular la suma de las diferencias cuadradas respecto a la media
    const sumaDiferenciasCuadradas = burstTimes.reduce((sum, burst) => sum + Math.pow(burst - media, 2), 0);

    // Calcular la varianza y la desviación estándar
    const varianza = sumaDiferenciasCuadradas / n;
    const desviacionEstandar = Math.sqrt(varianza);

    return { varianza, desviacionEstandar };
}

// Función para calcular el promedio de espera
function calcularPromedioEspera(procesos) {
    const totalEspera = procesos.reduce((sum, proceso) => sum + proceso.espera, 0);
    return totalEspera / procesos.length;
}

// Función para almacenar el promedio en localStorage
function almacenarPromedioEspera(promedio) {
    let promediosGuardados = JSON.parse(localStorage.getItem('promediosEspera')) || [];
    const nuevoPromedio = { promedio, fecha: new Date().toISOString() };
    promediosGuardados.push(nuevoPromedio);
    localStorage.setItem('promediosEspera', JSON.stringify(promediosGuardados));
}

// Función para imprimir el promedio general en localStorage
function imprimirPromedioGeneral() {
    let promediosGuardados = JSON.parse(localStorage.getItem('promediosEspera')) || [];
    const promedioGeneralElement = document.getElementById('promedioGeneral');
    if (promedioGeneralElement) {
        const promedioGeneral = promediosGuardados.reduce((sum, p) => sum + p.promedio, 0) / promediosGuardados.length;
        promedioGeneralElement.textContent = `El promedio general de los tiempos de espera es: ${promedioGeneral.toFixed(2)} unidades de tiempo.`;
    } else {
        console.error('Elemento con ID "promedioGeneral" no encontrado.');
    }
}

// Función para generar gráficos con Chart.js
function generarGrafico(procesos) {
    if (chartInstanceGantt) {
        chartInstanceGantt.destroy();
    }

    const ctxGantt = document.getElementById('graficoGantt').getContext('2d');
    chartInstanceGantt = new Chart(ctxGantt, {
        type: 'bar',
        data: {
            labels: procesos.map(p => p.nombre),
            datasets: [
                {
                    label: 'Tiempo de Ejecución',
                    data: procesos.map(p => p.burst),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para generar el gráfico de dispersión
function generarGraficoDispersion(procesos) {
    if (chartInstanceDispersion) {
        chartInstanceDispersion.destroy();
    }

    const ctxDispersion = document.getElementById('graficoDispersion').getContext('2d');
    chartInstanceDispersion = new Chart(ctxDispersion, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Tiempo de Ejecución vs Tiempo de Espera',
                data: procesos.map(p => ({ x: p.burst, y: p.espera })),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo de Ejecución'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Tiempo de Espera'
                    }
                }
            }
        }
    });
}
