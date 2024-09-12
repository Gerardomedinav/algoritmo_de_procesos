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
    public $burst_restante; // Agregado para el algoritmo SJN

    public function __construct($nombre, $llegada, $burst) {
        $this->nombre = $nombre;
        $this->llegada = $llegada;
        $this->burst = $burst;
        $this->burst_restante = $burst; // Inicialmente el burst restante es igual al burst total
    }
}

// Función para planificar usando Shortest Job Next (SJN)
function sjn($procesos) {
    $tiempo_actual = 0;
    $procesos_planificados = [];
    $procesos_pendientes = $procesos;

    while (!empty($procesos_pendientes)) {
        // Filtrar los procesos que han llegado hasta el momento
        $procesos_disponibles = array_filter($procesos_pendientes, function($proceso) use ($tiempo_actual) {
            return $proceso->llegada <= $tiempo_actual;
        });

        if (empty($procesos_disponibles)) {
            // Si no hay procesos disponibles, avanzar el tiempo al próximo proceso que llegue
            $tiempo_actual = min(array_column($procesos_pendientes, 'llegada'));
            continue;
        }

        // Seleccionar el proceso con el menor burst restante
        usort($procesos_disponibles, function($a, $b) {
            return $a->burst_restante - $b->burst_restante;
        });

        $proceso_actual = array_shift($procesos_disponibles);

        // El proceso comienza en el tiempo actual
        $proceso_actual->comienzo = $tiempo_actual;
        $proceso_actual->finalizacion = $proceso_actual->comienzo + $proceso_actual->burst;
        $proceso_actual->espera = $proceso_actual->comienzo - $proceso_actual->llegada;
        $proceso_actual->retorno = $proceso_actual->finalizacion - $proceso_actual->llegada;
        $proceso_actual->respuesta = $proceso_actual->espera;

        // Actualizar el tiempo actual
        $tiempo_actual = $proceso_actual->finalizacion;

        // Guardar el proceso planificado
        $procesos_planificados[] = $proceso_actual;

        // Remover el proceso actual de los pendientes
        foreach ($procesos_pendientes as $key => $p) {
            if ($p->nombre == $proceso_actual->nombre) {
                unset($procesos_pendientes[$key]);
            }
        }
    }

    return $procesos_planificados;
}

// Obtener datos de la solicitud
$procesos = json_decode(file_get_contents('php://input'), true);
$procesos_obj = [];

foreach ($procesos as $p) {
    $procesos_obj[] = new Proceso($p['nombre'], $p['llegada'], $p['burst']);
}

// Planificación usando SJN
$procesos_planificados = sjn($procesos_obj);

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
