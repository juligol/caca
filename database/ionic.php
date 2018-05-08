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
        $email = $request->email;
        $password = $request->password;
        $action = $request->action;
		if ($email != null && $password != null && $action != null)
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
			
			switch ($action) {
				case 'login':
					$res = login($email, $password, $conexion);
					echo json_encode($res);
					break;
				case 'viajes':
					$res = viajes($email, $password, $conexion);
					echo json_encode($res);
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
	
	function login($email, $password, $conexion)
	{
		$query = "SELECT * FROM mab_usuarios WHERE usuario = '$email' AND password='" . mysql_real_escape_string($password) . "'";
		$result = mysql_query($query, $conexion);
		return mysql_fetch_array($result);
	}
	
	function viajes($email, $password, $conexion)
	{
		$query = "SELECT * FROM mab_viajes where mab_viajes.empresa = '38' ORDER BY mab_viajes.hora DESC";
		$result = mysql_query($query, $conexion);
		$viajes = [];
		while($registro = mysql_fetch_array($result)){
			array_push($viajes, $registro);
		}
		return $viajes;
	}
?>