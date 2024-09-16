// Variables para instancias de gráficos
let chartInstanceGantt;
let chartInstanceDispersion;

// Función para generar el formulario de entrada de procesos
function generarFormulario() {
    const cantidad = document.getElementById('cantidad').value;
    const procesosContainer = document.getElementById('procesosContainer');
    procesosContainer.innerHTML = '';

    for (let i = 0; i < cantidad; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>Proceso ${i + 1}</h3>
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

    const calcularButton = document.createElement('button');
    calcularButton.textContent = "Calcular Planificación";
    calcularButton.type = "button";
    calcularButton.onclick = calcularPlanificacion;
    procesosContainer.appendChild(calcularButton);
}

// Función para calcular la planificación Round Robin y mostrar los resultados
async function calcularPlanificacion() {
    const cantidad = document.getElementById('cantidad').value;
    const quantum = parseInt(document.getElementById('quantum').value);
    const procesos = [];

    for (let i = 0; i < cantidad; i++) {
        const nombre = document.getElementById(`nombre${i}`).value;
        const llegada = parseInt(document.getElementById(`llegada${i}`).value);
        const burst = parseInt(document.getElementById(`burst${i}`).value);
        procesos.push({ nombre, llegada, burst });
    }

    const procesosPlanificados = await planificarRoundRobin(procesos, quantum);

    mostrarResultados(procesosPlanificados);

    const tiempoTotalCPU = procesosPlanificados.reduce((sum, proceso) => sum + proceso.burstOriginal, 0);

    document.getElementById('tiempoTotalCPU').textContent = `El tiempo total que los procesos ocupan en la CPU es: ${tiempoTotalCPU} unidades de tiempo.`;

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

// Función para calcular la planificación Round Robin
async function planificarRoundRobin(procesos, quantum) {
    let tiempoActual = 0;
    let cola = [];
    let procesosRestantes = [...procesos];
    let resultados = [];
    let tiemposComienzo = {};
    let tiemposEspera = {}; // Registro de tiempo de espera por proceso

    // Inicializar tiempos de comienzo y espera en 0 para cada proceso
    procesos.forEach(proceso => {
        tiemposComienzo[proceso.nombre] = -1;
        tiemposEspera[proceso.nombre] = 0; // Inicializamos el tiempo de espera
    });

    while (procesosRestantes.length > 0 || cola.length > 0) {
        // Agregar procesos que llegaron al tiempoActual a la cola
        procesosRestantes = procesosRestantes.filter(proceso => {
            if (proceso.llegada <= tiempoActual) {
                cola.push({...proceso, burstOriginal: proceso.burst});
                return false;
            }
            return true;
        });

        if (cola.length > 0) {
            let procesoActual = cola.shift();

            // Registrar el tiempo de comienzo si no se ha registrado antes
            if (tiemposComienzo[procesoActual.nombre] === -1) {
                tiemposComienzo[procesoActual.nombre] = tiempoActual;
            } else {
                // Si el proceso ha sido pausado previamente, acumula el tiempo de espera
                tiemposEspera[procesoActual.nombre] += tiempoActual - procesoActual.ultimaEjecucion;
            }

            let tiempoEjecucion = Math.min(procesoActual.burst, quantum);
            procesoActual.ultimaEjecucion = tiempoActual; // Registrar el último momento de ejecución

            // Registro del turno de ejecución actual
            resultados.push({
                nombre: procesoActual.nombre,
                comienzo: tiempoActual,
                finalizacion: tiempoActual + tiempoEjecucion,
                quantum: tiempoEjecucion
            });

            procesoActual.burst -= tiempoEjecucion;
            tiempoActual += tiempoEjecucion;

            // Si el proceso ha terminado
            if (procesoActual.burst === 0) {
                procesoActual.finalizacion = tiempoActual;
                procesoActual.retorno = procesoActual.finalizacion - procesoActual.llegada;
                procesoActual.espera = tiemposEspera[procesoActual.nombre]; // El tiempo de espera acumulado
            } else {
                cola.push(procesoActual);
            }
        } else {
            tiempoActual++;
        }
    }

    return resultados;
}



// Función para mostrar los resultados en la tabla
function mostrarResultados(procesos) {
    const tablaRR = document.getElementById('tablaRR');
    tablaRR.innerHTML = '';

    procesos.forEach(proceso => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proceso.nombre}</td>
            <td>${proceso.comienzo}</td>
            <td>${proceso.finalizacion}</td>
            <td>${proceso.quantum}</td>
        `;
        tablaRR.appendChild(row);
    });
}


// Función para calcular la desviación estándar de las duraciones (burst times)
function calcularDesviacionEstandar(procesos) {
    const burstTimes = procesos.map(proceso => proceso.burstOriginal).filter(burst => !isNaN(burst));

    if (burstTimes.length === 0) return { varianza: 0, desviacionEstandar: 0 };

    const n = burstTimes.length;
    const media = burstTimes.reduce((sum, burst) => sum + burst, 0) / n;

    const sumaDiferenciasCuadradas = burstTimes.reduce((sum, burst) => sum + Math.pow(burst - media, 2), 0);

    const varianza = sumaDiferenciasCuadradas / n;
    const desviacionEstandar = Math.sqrt(varianza);

    return { varianza, desviacionEstandar };
}


// Función para calcular el promedio de espera
function calcularPromedioEspera(procesos) {
    if (procesos.length === 0) return 0;

    const totalEspera = procesos.reduce((sum, proceso) => {
        if (!isNaN(proceso.espera)) {
            return sum + proceso.espera;
        }
        return sum;
    }, 0);

    return totalEspera / procesos.length;
}


// Función para almacenar el promedio en localStorage
function almacenarPromedioEspera(promedio) {
    let promediosGuardados = JSON.parse(localStorage.getItem('promediosEspera')) || [];
    const nuevoPromedio = {
        id: promediosGuardados.length + 1,
        promedio: promedio
    };
    promediosGuardados.push(nuevoPromedio);
    localStorage.setItem('promediosEspera', JSON.stringify(promediosGuardados));
}

// Función para calcular el promedio general acumulado
function imprimirPromedioGeneral() {
    const promediosGuardados = JSON.parse(localStorage.getItem('promediosEspera')) || [];

    if (promediosGuardados.length === 0) {
        document.getElementById('promedioGeneral').textContent = 'No hay datos para calcular el promedio general.';
        return;
    }

    const promediosValidos = promediosGuardados.filter(item => typeof item.promedio === 'number' && !isNaN(item.promedio));
    const promedioGeneral = promediosValidos.reduce((sum, item) => sum + item.promedio, 0) / promediosValidos.length;

    document.getElementById('promedioGeneral').textContent = `El promedio general acumulado de tiempos de espera es: ${promedioGeneral.toFixed(2)} unidades de tiempo.`;
}

// Función para generar el gráfico de barras apiladas para la planificación
function generarGrafico(procesos) {
    const ctx = document.getElementById('graficoCanvas').getContext('2d');
    
    // Generamos un array único de nombres de procesos
    const labels = [...new Set(procesos.map(proceso => proceso.nombre))];

    // Crear un dataset para cada proceso basado en sus tiempos de ejecución
    const datasets = labels.map((nombreProceso, index) => {
        const ejecuciones = procesos
            .filter(proceso => proceso.nombre === nombreProceso)
            .map(proceso => {
                return {
                    x: proceso.comienzo,
                    y: proceso.finalizacion - proceso.comienzo // Duración de la ejecución
                };
            });

        return {
            label: nombreProceso,
            data: ejecuciones.map(ejecucion => ejecucion.y), // Duración de cada ejecución
            backgroundColor: getRandomColor(index), // Colores aleatorios para cada proceso
            stack: 'stack'
        };
    });

    const data = {
        labels: labels,
        datasets: datasets
    };

    if (chartInstanceGantt) {
        chartInstanceGantt.destroy();
    }

    chartInstanceGantt = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Diagrama de Gantt - Planificación Round Robin'
                }
            },
            scales: {
                x: {
                    stacked: true // Habilitar apilamiento en el eje X
                },
                y: {
                    stacked: true // Habilitar apilamiento en el eje Y
                }
            }
        }
    });
}

// Función para generar colores aleatorios para los procesos
function getRandomColor(index) {
    const colors = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
    ];
    return colors[index % colors.length];
}


// Función para generar el gráfico de dispersión
function generarGraficoDispersion(procesos) {
    const ctx = document.getElementById('graficoDispersion').getContext('2d');
    const labels = procesos.map(proceso => proceso.nombre);
    const data = {
        labels: labels,
        datasets: [{
            label: 'Duración de Procesos',
            data: procesos.map(proceso => ({
                x: procesos.indexOf(proceso) + 1,
                y: proceso.burstOriginal
            })),
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    if (chartInstanceDispersion) {
        chartInstanceDispersion.destroy();
    }

    chartInstanceDispersion = new Chart(ctx, {
        type: 'scatter',
        data: data,
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

// Función para resetear el formulario
function resetearFormulario() {
    document.getElementById('cantidad').value = '';
    document.getElementById('procesosContainer').innerHTML = '';
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('promedioEspera').innerHTML = '';
    document.getElementById('promedioGeneral').innerHTML = '';
    const canvasGantt = document.getElementById('graficoCanvas');
    const canvasDispersion = document.getElementById('graficoDispersion');
    canvasGantt.getContext('2d').clearRect(0, 0, canvasGantt.width, canvasGantt.height);
    canvasDispersion.getContext('2d').clearRect(0, 0, canvasDispersion.width, canvasDispersion.height);
}
