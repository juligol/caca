<?php
    //http://stackoverflow.com/questions/18382740/cors-not-working-php
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }

    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

        exit(0);
    }

    //http://stackoverflow.com/questions/15485354/angular-http-post-to-php-and-undefined
    $postdata = file_get_contents("php://input");
    if (isset($postdata)) {
		$request = json_decode($postdata);
        $action = $request->action;
		if ($action != null)
		{ 
			//Produccion
			/*$host = "127.0.0.1:3306";
			$db = "QKBZ9X5Wht6b94Dw";
			$user = "233205_mab";
			$pass = "mabmobile";*/
			//Testeo
			$host = "127.0.0.1:3306";
			$db = "233205-pre";
			$user = "mab";
			$pass = "YwXauBEtRLPNrhL9";

			//Me conecto a la bd
			$conexion = mysql_connect($host, $user, $pass) or die ("No se conectó a la base de datos");
			mysql_select_db($db, $conexion) or die ("No se encontró la base de datos.");
			mysql_query("SET NAMES 'utf8'");
			mb_http_output('UTF-8');
			header( 'Content-Type: text/html; charset=utf-8');
			ini_set("display_errors", 0);
			
			switch ($action) {
				case 'login':
					$res = login($request, $conexion);
					echo json_encode($res);
					break;
				case 'get_viaje':
					$res = get_viaje($request, $conexion);
					echo json_encode($res);
					break;
				case 'viajes':
					$res = viajes($request, $conexion);
					echo json_encode($res);
					break;
				case 'posicionActual':
					$res = posicionActual($request, $conexion);
					echo $res;
					break;
				case 'distanciaTotal':
					$res = distanciaTotal($request, $conexion);
					echo $res;
					break;
				default:
					break;
			}
			
			mysql_close($conexion);
		}
		else 
		{
			echo "No hay conexión";
		}
    }
    else 
	{
        echo "Error no hay POST";
    }
	
	function login($request, $conexion)
	{
		$email = $request->email;
        $password = $request->password;
		$query = "SELECT * FROM mab_usuarios WHERE categoria = 'CHOFER' AND estado = 'ACTIVO' AND usuario = '$email' AND password = '" . mysql_real_escape_string($password) . "'";
		$result = mysql_query($query, $conexion);
		return mysql_fetch_array($result);
	}
	
	function viajes($request, $conexion)
	{
		$viajes = [];
		$chofer_id = $request->chofer_id;
		$query = "SELECT * FROM mab_viajes where id_chofer = $chofer_id AND status in (1, 2, 3, 5, 6, 7, 8, 11) ORDER BY fecha DESC, hora DESC";
		$result = mysql_query($query, $conexion);
		while($viaje = mysql_fetch_array($result)){
			$viaje = completarViaje($viaje, $conexion);
			array_push($viajes, $viaje);
		}
		return $viajes;
	}
	
	function completarViaje($viaje, $conexion){
		//Responsable del viaje
		$sqlResponsable = "SELECT * FROM mab_usuarios WHERE id = " . $viaje["responsable"];
		$responsable = mysql_fetch_array(mysql_query($sqlResponsable, $conexion));
		$viaje["responsable"] = $responsable;
		//Empresa del viaje
		$sqlEmpresa = "SELECT * FROM mab_empresas WHERE id = " . $viaje["empresa"];
		$empresa = mysql_fetch_array(mysql_query($sqlEmpresa, $conexion));
		$viaje["empresa"] = $empresa;
		//Centro de costo 1
		$sqlcc = "SELECT * FROM mab_centros WHERE id = " . $viaje["id_cc1"];
		$cc = mysql_fetch_array(mysql_query($sqlcc, $conexion));
		$viaje["cc1"] = $cc;
		//Centro de costo 2
		if ($viaje["id_cc2"] <> 0)
		{
			$sqlcc = "SELECT * FROM mab_centros WHERE id = " . $viaje["id_cc2"];
			$cc = mysql_fetch_array(mysql_query($sqlcc, $conexion));
			$viaje["cc2"] = $cc;
		}
		//Centro de costo 3
		if ($viaje["id_cc3"] <> 0)
		{
			$sqlcc = "SELECT * FROM mab_centros WHERE id = " . $viaje["id_cc3"];
			$cc = mysql_fetch_array(mysql_query($sqlcc, $conexion));
			$viaje["cc3"] = $cc;
		}
		//Centro de costo 4
		if ($viaje["id_cc4"] <> 0)
		{
			$sqlcc = "SELECT * FROM mab_centros WHERE id = " . $viaje["id_cc4"];
			$cc = mysql_fetch_array(mysql_query($sqlcc, $conexion));
			$viaje["cc4"] = $cc;
		}
		return $viaje;
	}
	
	function posicionActual($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$latitud = $request->latitud;
        $longitud = $request->longitud;
        $distancia = $request->distancia;
		$query = "INSERT INTO mab_viaje_en_proceso (viaje_id, latitud, longitud, distancia, tiempo) VALUES ('$viaje_id', '$latitud', '$longitud', '$distancia', NOW())";
		$result = mysql_query($query, $conexion);
		if($distancia == 0){
			$query = "UPDATE mab_viajes SET en_proceso = 1 WHERE id = " . $viaje_id;
			$result = mysql_query($query, $conexion);
		}
		return $distancia;
	}
	
	function distanciaTotal($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$query = "SELECT SUM(distancia) as distancia FROM mab_viaje_en_proceso WHERE viaje_id = " . $viaje_id;
		$result = mysql_fetch_array(mysql_query($query, $conexion));
		$distancia = $result["distancia"];
		$query = "UPDATE mab_viajes SET distancia_total_recorrida = '$distancia' WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		return $distancia;
	}
	
	function get_viaje($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$query = "SELECT * FROM mab_viajes WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		$viaje = mysql_fetch_array($result);
		$viaje = completarViaje($viaje, $conexion);
		return $viaje;
	}
?>