<?php
// Clase que representa un proceso
class Proceso {
    public $nombre;
    public $llegada;
    public $burst;
    public $comienzo;
    public $finalizacion;
    public $espera;
    public $respuesta;
    public $retorno;
    public $burst_restante;

    public function __construct($nombre, $llegada, $burst) {
        $this->nombre = $nombre;
        $this->llegada = $llegada;
        $this->burst = $burst;
        $this->burst_restante = $burst; // Inicialmente el burst restante es igual al burst total
    }
}

// Función para planificar usando Round-Robin
function roundRobin($procesos, $quantum) {
    $tiempo_actual = 0;
    $procesos_planificados = [];
    $cola = [];
    $procesos_pendientes = $procesos;

    while (!empty($procesos_pendientes) || !empty($cola)) {
        // Agregar procesos que han llegado hasta el momento a la cola
        while (!empty($procesos_pendientes) && $procesos_pendientes[0]->llegada <= $tiempo_actual) {
            $cola[] = array_shift($procesos_pendientes);
        }

        if (empty($cola)) {
            // Si la cola está vacía, avanzar el tiempo al próximo proceso que llegue
            if (!empty($procesos_pendientes)) {
                $tiempo_actual = $procesos_pendientes[0]->llegada;
                continue;
            }
        }

        // Seleccionar el siguiente proceso en la cola
        $proceso_actual = array_shift($cola);
        $tiempo_inicio = $tiempo_actual;

        // Ejecutar el proceso durante el quantum o el tiempo restante
        $tiempo_ejecucion = min($proceso_actual->burst_restante, $quantum);
        $tiempo_actual += $tiempo_ejecucion;
        $proceso_actual->burst_restante -= $tiempo_ejecucion;

        if ($proceso_actual->burst_restante == 0) {
            $proceso_actual->finalizacion = $tiempo_actual;
            $proceso_actual->espera = $proceso_actual->finalizacion - $proceso_actual->llegada - $proceso_actual->burst;
            $proceso_actual->retorno = $proceso_actual->finalizacion - $proceso_actual->llegada;
            $proceso_actual->respuesta = $proceso_actual->espera;
            $procesos_planificados[] = $proceso_actual;
        } else {
            // Volver a poner el proceso en la cola si no ha terminado
            $cola[] = $proceso_actual;
        }
    }

    return $procesos_planificados;
}

// Obtener datos de la solicitud
$datos = json_decode(file_get_contents('php://input'), true);
$quantum = $datos['quantum'];
$procesos = $datos['procesos'];
$procesos_obj = [];

foreach ($procesos as $p) {
    $procesos_obj[] = new Proceso($p['nombre'], $p['llegada'], $p['burst']);
}

// Planificación usando Round-Robin
$procesos_planificados = roundRobin($procesos_obj, $quantum);

// Convertir resultados a un array para pasar a JavaScript
$resultados = [];
foreach ($procesos_planificados as $proceso) {
    $resultados[] = [
        'nombre' => $proceso->nombre,
        'llegada' => $proceso->llegada,
        'burst' => $proceso->burst,
        'comienzo' => $proceso->comienzo,
        'finalizacion' => $proceso->finalizacion,
        'espera' => $proceso->espera,
        'retorno' => $proceso->retorno,
        'respuesta' => $proceso->respuesta
    ];
}

// Establecer el encabezado para JSON
header('Content-Type: application/json');

// Imprimir resultados en formato JSON para usarlos en JavaScript
echo json_encode($resultados);
?>
