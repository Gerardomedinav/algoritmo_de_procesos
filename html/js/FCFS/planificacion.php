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

    public function __construct($nombre, $llegada, $burst) {
        $this->nombre = $nombre;
        $this->llegada = $llegada;
        $this->burst = $burst;
    }
}

// Función para planificar usando FCFS
function fcfs($procesos) {
    $tiempo_actual = 0;

    foreach ($procesos as $index => $proceso) {
        if ($index == 0) {
            // El primer proceso comienza en su tiempo de llegada
            $proceso->comienzo = $proceso->llegada;
           
        } else {
            // El proceso comienza cuando termina el anterior
            $proceso->comienzo = $tiempo_actual;
        }

        // El proceso finaliza después de que el burst time haya terminado
        $proceso->finalizacion = $proceso->comienzo + $proceso->burst;

        // El tiempo de espera es el tiempo entre la llegada del proceso y cuando comenzó a ejecutarse
        $proceso->espera = $proceso->comienzo - $proceso->llegada;

        // El tiempo de retorno es el tiempo total desde la llegada hasta la finalización
        $proceso->retorno = $proceso->finalizacion - $proceso->llegada;

        // El tiempo de respuesta es igual al tiempo de espera en FCFS
        $proceso->respuesta = $proceso->espera;

        // El tiempo actual avanza hasta la finalización del proceso actual
        $tiempo_actual = $proceso->finalizacion;
    }

    return $procesos;
}

// Obtener datos de la solicitud
$procesos = json_decode(file_get_contents('php://input'), true);
$procesos_obj = [];

foreach ($procesos as $p) {
    $procesos_obj[] = new Proceso($p['nombre'], $p['llegada'], $p['burst']);
}

// Planificación usando FCFS
$procesos_planificados = fcfs($procesos_obj);

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
        'retorno' => $proceso->retorno
    ];
}

// Establecer el encabezado para JSON
header('Content-Type: application/json');

// Imprimir resultados en formato JSON para usarlos en JavaScript
echo json_encode($resultados);
?>
