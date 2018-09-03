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
		
        $action = $request->action;
		if ($action != null)
		{ 
			switch ($action) {
				case 'login':
					$res = login($request, $conexion);
					echo json_encode($res);
					break;
				case 'password':
					$res = password($request, $conexion);
					echo json_encode($res);
					break;
				case 'viajes':
					$res = viajes($request, $conexion);
					echo json_encode($res);
					break;
				case 'actualizarPosicion':
					$res = actualizarPosicion($request, $conexion);
					echo $res;
					break;
				case 'rechazarViaje':
					$res = rechazarViaje($request, $conexion);
					echo $res;
					break;
				case 'viaje_en_proceso':
					$res = viaje_en_proceso($request, $conexion);
					echo $res;
					break;
				case 'reiniciarViaje':
					$res = reiniciarViaje($request, $conexion);
					echo $res;
					break;
				case 'guardarDireccion':
					$res = guardarDireccion($request, $conexion);
					echo $res;
					break;
				case 'guardarDirecciones':
					$res = guardarDirecciones($request, $conexion);
					echo $res;
					break;
				case 'distanciaTotal':
					$res = distanciaTotal($request, $conexion);
					echo $res;
					break;
				case 'cerrarViaje':
					$res = cerrarViaje($request, $conexion);
					echo $res;
					break;
				case 'get_viaje':
					$res = get_viaje($request, $conexion);
					echo json_encode($res);
					break;
				default:
					break;
			}
		}
		else 
		{
			$posicion = $request[0];
			if($posicion->provider == "network" && isset($_GET['chofer_id'])){
				$chofer_id = $_GET['chofer_id'];
				$latitud = $posicion->latitude;
				$longitud = $posicion->longitude;
				//SELECT FROM_UNIXTIME( $posicion->time * 0.001 )
				$tiempo = date('Y-m-d H:i:s', $posicion->time  * 0.001);
				$tipo = 'Back PHP';
				$result = actualizarPosicionEnDB($conexion, $chofer_id, $latitud, $longitud, $tiempo, $tipo);
			}else{
				echo "No hay conexión";
			}
			
		}
		mysql_close($conexion);
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
	
	function password($request, $conexion)
	{
		$email = $request->email;
		$query = "SELECT * FROM mab_usuarios WHERE categoria = 'CHOFER' AND estado = 'ACTIVO' AND usuario = '$email'";
		$result = mysql_query($query, $conexion);
		$usuario = mysql_fetch_array($result);
		if($usuario){
			$nombre = $usuario["nombre"];
			$desti = $usuario["usuario"];
			$password = $usuario["password"];
			$asunto = "Recuperación contraseña.";
			$mensaje = "Sr. " . $nombre . " su contraseña actual es : " . $password . " <br><br> Muchas gracias. ";
			$cabeceras = 'MIME-Version: 1.0' . "\r\n";
			$cabeceras .= 'Content-type: text/html; charset=utf-8' . "\r\n";
			$cabeceras .= "From: MAB Mobile - Remises <envios@mabmobile.com.ar> \r\n";
			mail($desti, $asunto, $mensaje, $cabeceras);
		}
		return $usuario;
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
		//Proveedor del viaje
		$sqlProv = "SELECT * FROM mab_proveedores WHERE id = " . $viaje["id_prov"];
		$prov = mysql_fetch_array(mysql_query($sqlProv, $conexion));
		$viaje["proveedor"] = $prov;
		//Remises del proveedor
		$remises = [];
		$sqlRemises = "SELECT * FROM mab_remises WHERE proveedor = " . $viaje["id_prov"];
		$result = mysql_query($sqlRemises, $conexion);
		while($remis = mysql_fetch_array($result)){
			array_push($remises, $remis);
		}
		$viaje["remises"] = $remises;
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
		//Hora valida
		$datetime1 = new DateTime();
		$datetime2 = new DateTime($viaje["fecha"] . " " . $viaje["hora"]);
		$interval = $datetime2->diff($datetime1);
		$viaje["fechaValida"] = $interval->format('%R%a') >= 0;
		//Trayectoria
		$puntos_trayecto = [];
		$sqlTra = "SELECT * FROM mab_viaje_en_proceso WHERE viaje_id = " . $viaje["id"];
		$result = mysql_query($sqlTra, $conexion);
		while($punto = mysql_fetch_array($result)){
			array_push($puntos_trayecto, $punto);
		}
		$viaje["puntos_trayecto"] = $puntos_trayecto;

		return $viaje;
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
	
	function actualizarPosicionEnDB($conexion, $chofer_id, $latitud, $longitud, $tiempo, $tipo)
	{
		/*session_start();
		$_SESSION["1442"] = $request;*/
		$sql = "SELECT * FROM mab_posicion_chofer WHERE chofer_id = " . $chofer_id;
		$res = mysql_query($sql, $conexion);
		$cant = mysql_num_rows($res);
		if ($cant == 0) {
			$query = "INSERT INTO mab_posicion_chofer (chofer_id, latitud, longitud, tiempo, tipo) VALUES ('$chofer_id', '$latitud', '$longitud', '$tiempo', '$tipo')";
		} else {
			$query = "UPDATE mab_posicion_chofer SET latitud = '$latitud', longitud = '$longitud', tiempo = '$tiempo', tipo = '$tipo' WHERE chofer_id = " . $chofer_id;
		}
		$result = mysql_query($query, $conexion);
		return $result;
	}
	
	function actualizarPosicion($request, $conexion)
	{
		/*session_start();
		$_SESSION["1442"] = $request;*/
		$chofer_id = $request->chofer_id;
		$latitud = $request->latitud;
		$longitud = $request->longitud;
		$tiempo = $request->tiempo;
		$tipo = $request->tipo;
		return actualizarPosicionEnDB($conexion, $chofer_id, $latitud, $longitud, $tiempo, $tipo);
	}
	
	function rechazarViaje($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$chofer = $request->chofer;
		$chofer_id = $request->chofer_id;
		$proveedor = $request->proveedor;
		$query = "UPDATE mab_viajes SET id_chofer = NULL, chofer = NULL WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		$query = "SELECT * FROM mab_usuarios WHERE categoria = 'PROVEEDOR' AND estado = 'ACTIVO' AND proveedor = '$proveedor' AND id <> '$chofer_id'";
		$result = mysql_query($query, $conexion);
		while($prov = mysql_fetch_array($result)){
			$nombre = $prov["nombre"];
			$desti = $prov["usuario"];
			$asunto = "Viaje rechazado desde APP";
			$mensaje = "Sr. " . $nombre . " el viaje con ID ". $viaje_id ." fue rechazado por el chofer ". $chofer ." <br><br> Muchas gracias. ";
			$cabeceras = 'MIME-Version: 1.0' . "\r\n";
			$cabeceras .= 'Content-type: text/html; charset=utf-8' . "\r\n";
			$cabeceras .= "From: MAB Mobile - Remises <envios@mabmobile.com.ar> \r\n";
			mail($desti, $asunto, $mensaje, $cabeceras);
		}
		return "Exito al rechazar el viaje";
	}
	
	function viaje_en_proceso($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$query = "UPDATE mab_viajes SET en_proceso = 1 WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		return "Exito al poner el viaje en proceso";
	}

	function reiniciarViaje($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$query = "DELETE FROM mab_viaje_en_proceso WHERE viaje_id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		$query = "UPDATE mab_viajes SET en_proceso = 0 WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		return "Exito al reinicir el viaje";
	}
	
	function guardarDireccionEnDB($conexion, $viaje_id, $latitud, $longitud, $distancia, $fecha)
	{
		$query = "UPDATE mab_viajes SET en_proceso = 1 WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		
		$query = "INSERT INTO mab_viaje_en_proceso (viaje_id, latitud, longitud, distancia, tiempo) VALUES ('$viaje_id', '$latitud', '$longitud', '$distancia', '$fecha')";
		$result = mysql_query($query, $conexion);
		return $result;
	}
	
	function guardarDireccion($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$latitud = $request->latitud;
		$longitud = $request->longitud;
		$distancia = $request->distancia;
		$fecha = $request->fecha;
		return guardarDireccionEnDB($conexion, $viaje_id, $latitud, $longitud, $distancia, $fecha);
	}
	
	/*function guardarDirecciones($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$latitudes = explode('|', $request->latitudes);
		$longitudes = explode('|', $request->longitudes);
		$distancias = explode('|', $request->distancias);
		$fechas = explode('|', $request->fechas);
        $distanciaTotal = 0;
		$i = 0;
		foreach($latitudes as $latitud)
		{
			guardarDireccionEnDB($conexion, $viaje_id, $latitud, $longitudes[$i], $distancias[$i], $fechas[$i]);
			$distanciaTotal += $distancias[$i];
			$i++;
		}
		if($distanciaTotal > 0){
			$query = "UPDATE mab_viajes SET en_proceso = 1, distancia_total_recorrida = '$distanciaTotal' WHERE id = " . $viaje_id;
			$result = mysql_query($query, $conexion);
		}
		return $distanciaTotal;
	}*/
	
	function distanciaTotal($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$distancia = 0;
		$ultimoIngreso = guardarDireccionEnDB($conexion, $viaje_id, $request->latitud, $request->longitud, $request->distancia, $request->fecha);
		if($ultimoIngreso){
			$query = "SELECT SUM(distancia) as distancia FROM mab_viaje_en_proceso WHERE viaje_id = " . $viaje_id;
			$result = mysql_fetch_array(mysql_query($query, $conexion));
			$distancia = $result["distancia"];
			$query = "UPDATE mab_viajes SET distancia_total_recorrida = '$distancia' WHERE id = " . $viaje_id;
			$result = mysql_query($query, $conexion);
		}
		return $distancia;
	}
	
	/*function get_viaje($request, $conexion)
	{
		$viaje_id = $request->viaje_id;
		$query = "SELECT * FROM mab_viajes WHERE id = " . $viaje_id;
		$result = mysql_query($query, $conexion);
		$viaje = mysql_fetch_array($result);
		$viaje = completarViaje($viaje, $conexion);
		return $viaje;
	}*/
	
	function cerrarViaje($request, $conexion)
	{
		$viaje = $request->viaje;
		$proveedor = $viaje->proveedor;
		$kmminimos = $proveedor->kmminimos;
		$estacionamiento = $request->estacionamiento;
		$peajes = $request->peajes;
		$bonificacion = $request->bonificacion;
		$voucher = $request->voucher;
		$observaciones = $request->observaciones;
		$chofer_id = $request->chofer_id;
		$chofer_nombre = $request->chofer_nombre;
		$remis = $request->remis;
		$regreso = $request->regreso;
		$espera_real = $request->espera;
   		$totespe = 0;
	   	if ($espera_real <> "00:00")
	   	{
		  $hora = substr($espera_real, 0, 2);
		  $minuto = substr($espera_real, 3, 2);
		  $espe = ($hora * 60) + $minuto;
		  $totespe = round(($espe * $valespera) / 60, 2);
	   	}
		$sql="SELECT t.* FROM mab_tarifas t JOIN mab_proveedor_modulo pm ON pm.id_tarifa = t.id AND 
						pm.id_proveedor = '$proveedor->id' AND pm.id_modulo = 1";
        $res = mysql_query($sql,$conexion);
        while($reg = mysql_fetch_array($res))
        {
		    $valor_minimo = $reg["valor_minimo"];
		    $valor_km = $reg["valor_km"];
		    $delta_bonif = ($reg["delta_bonif"] / 100);
		    $valespera = $reg["valor_espera"];
		}
		$distancia_real = $request->distancia;
		$valkm = round($distancia_real * $valor_km, 2);
		if ($regreso == "S")
	    {
		   $distancia_real = $distancia_real * 2;
		   $valkm = round($distancia_real * $valor_km * $delta_bonif, 2);
	    }
	    if ($distancia_real <= $kmminimos)
	   	{
           	$precio_final = $valor_minimo + $estacionamiento + $peajes + $totespe;
	   	}
	   	else
	   	{
	   		$precio_final = $valkm + $estacionamiento + $peajes + $totespe - $bonificacion;
	   	}

	   	$consulta = "UPDATE mab_viajes SET bonificacion = '$bonificacion', distancia_real = '$distancia_real', espera_real = '$espera_real',
		peajes = '$peajes', estacionamiento = '$estacionamiento', regreso = '$regreso', remis = '$remis', id_chofer = '$chofer_id',
		precio_final = '$precio_final', status = 3, voucher = '$voucher', ".((($velocidadMaxima != null) && ($velocidadMaxima != '')) ? "velocidadMaxima='$velocidadMaxima' ," : "" )."observaciones = CONCAT(observaciones, '$observaciones'), 
		fecha_cierre_proveedor = NOW() WHERE id = " . $viaje->id;

		mysql_query($consulta, $conexion);

		//Empiezan los CC
		$id = $viaje->id;
		$c1 = $viaje->id_cc1;
		$c2 = $viaje->id_cc2;
		$c3 = $viaje->id_cc3;
		$c4 = $viaje->id_cc4;
		$tf1 = 0;
		$tf2 = 0;
		$tf3 = 0;
		$tf4 = 0;
		$modulo_actual = 1;
		$cantidadDeCC = 0;
		for($i = 1; $i <= 4; $i++){
			$cc = "id_cc".$i;
            if ($viaje->$cc <> 0)
                $cantidadDeCC++;
        }

        $precio = $viaje->precio;
        $precio_cal = round($precio_final / $cantidadDeCC, 2);
        $precioes_cal = round($precio / $cantidadDeCC, 2);

		$tf1 += $precio_cal;
		$te1 += $precioes_cal;
		if ($c2 <> 0) {
			if ($c2 == $c1) {
				$tf1 += $precio_cal;
				$te1 += $precioes_cal;
			} else {
				$tf2 += $precio_cal;
				$te2 += $precioes_cal;
			}
		}
		if ($c3 <> 0) {
			if ($c3 == $c1) {
				$tf1 += $precio_cal;
				$te1 += $precioes_cal;
			} elseif ($c3 == $c2) {
				$tf2 += $precio_cal;
				$te2 += $precioes_cal;
			} else {
				$tf3 += $precio_cal;
				$te3 += $precioes_cal;
			}
		}
		if ($c4 <> 0) {
			if ($c4 == $c1) {
				$tf1 += $precio_cal;
				$te1 += $precioes_cal;
			} elseif ($c4 == $c2) {
				$tf2 += $precio_cal;
				$te2 += $precioes_cal;
			} elseif ($c4 == $c3) {
				$tf3 += $precio_cal;
				$te3 += $precioes_cal;
			} else {
				$tf4 += $precio_cal;
				$te4 += $precioes_cal;
			}
		}

		if ($c1 <> 0) {
			$consulta = "INSERT INTO mab_viajes_cc (id_viaje,id_cc,costo_est,costo_real,estado,observ) VALUES ('$id', '$c1', '$te1', '$tf1', 0, ' ')";
			mysql_query($consulta, $conexion);
		}
		if ($c2 <> 0) {
			$consulta = "INSERT INTO mab_viajes_cc (id_viaje,id_cc,costo_est,costo_real,estado,observ) VALUES ('$id', '$c2', '$te2', '$tf2', 0, ' ')";
			mysql_query($consulta, $conexion);
		}
		if ($c3 <> 0) {
			$consulta = "INSERT INTO mab_viajes_cc (id_viaje,id_cc,costo_est,costo_real,estado,observ) VALUES ('$id', '$c3', '$te3', '$tf3', 0, ' ')";
			mysql_query($consulta, $conexion);
		}
		if ($c4 <> 0) {
			$consulta = "INSERT INTO mab_viajes_cc (id_viaje,id_cc,costo_est,costo_real,estado,observ) VALUES ('$id', '$c4', '$te4', '$tf4', 0, ' ')";
			mysql_query($consulta, $conexion);
		}

		$cc = 0;
		$cadu = "SELECT * FROM mab_viajes_cc WHERE id_viaje = " . $id;
		$rsu = mysql_query($cadu, $conexion);
		$nuu = mysql_num_rows($rsu);
		if ($nuu <= 0) {
			$wn = 0;
		} else {
			while ($rgu = mysql_fetch_array($rsu)) {
				if ($cc <> $rgu["id_cc"]) {
					$cc = $rgu["id_cc"];
					$cadun = "SELECT mab_usu_cc.id_usu,
					               mab_usu_cc.centro,
								   mab_usuarios.usuario,
								   mab_usuarios.nombre
								   FROM mab_usu_cc 
								   INNER JOIN mab_usuarios ON mab_usu_cc.id_usu = mab_usuarios.id
								   WHERE mab_usuarios.recibe_mail_cierre_gerente = 'S'
								   AND mab_usu_cc.centro = " . $cc;
					$rsun = mysql_query($cadun, $conexion);
					$nuun = mysql_num_rows($rsun);
					
					if ($nuun <= 0) {
						$wn = 0;
					} else {
						while ($rgun = mysql_fetch_array($rsun)) {
							//La eleccion sobre si desea mail se hace en la query, donde se seleccionan solo si quieren mail
							$nombre = $rgun["nombre"];
							$desti = $rgun["usuario"];
							$vname = " MAB MObile";
							$asunto = "Viaje pendiente para autorizar.";
							$mensaje = "
							  Sr. " . $nombre . " el siguiente viaje esta para su autorización : <br>
							  Para fecha : " . substr($viaje->fecha, 8, 2) . "/" . substr($viaje->fecha, 5, 2) . "/" . substr($viaje->fecha, 0, 4) . " a las " . $viaje->hora . "<br>
							  ID viaje : " . $id . " <br>
							  Servicio: REMISES <br>
							  Origen : " . $viaje->origen . " <br>
							  Destino : " . $viaje->destino . "<br>
							  Pasajeros : " . $viaje->pasajero1 . " / " . $viaje->pasajero2 . " / " . $viaje->pasajero3 . " / " . $viaje->pasajero4 . "<br>
							  Observaciones : " . $observaciones . "<br><br>
							  Auto : " . $remis . "<br>  
							  Chofer : " . $chofer_nombre . "<br>
							  Muchas gracias. ";

							$cabeceras = 'MIME-Version: 1.0' . "\r\n";
							$cabeceras .= 'Content-type: text/html; charset=utf-8' . "\r\n";
							$cabeceras .= "From: MAB Mobile - Remises <envios@mabmobile.com.ar> \r\n";
							mail($desti, $asunto, $mensaje, $cabeceras);
							echo "E-mail enviado a " . $desti . " ";
						}
					}
				} else {
					$wn = 0;
				}
			}
		}
                           
		return $precio_final;
	}
?>