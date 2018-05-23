import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
import { Home } from '../home/home';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { GlobalProvider } from "../../providers/global/global";

declare var google;

@Component({
  selector: 'page-viaje',
  templateUrl: 'viaje.html'
})

export class Viaje {
	viajeActual: any;
	map: any;
	directionsService: any = null;
	directionsDisplay: any = null;
	myLatLng: any;
	destino: any;
	loader: any;
	http: Http;
	marker: any;
	interval: any;
	link: any;
	callback: any;
	viajeIniciado: Boolean = false;

	constructor(public navCtrl: NavController, 
			    public navParams: NavParams,
			    private geolocation: Geolocation,
			    private storage: Storage,
				public alertCtrl: AlertController,
				public loadingCtrl: LoadingController,
				public http1: Http,
				public global: GlobalProvider) {
					
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		this.viajeActual = navParams.get('item');
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer();
		this.http = http1;
		
		if(this.viajeActual.en_proceso == 1)
			this.viajeIniciado = true;
	}
	
	ionViewWillEnter() {
      this.callback = this.navParams.get("callback")
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual});
	}
  
	ionViewDidLoad(){
		this.getPosition();
	}
  
	getPosition():any{
		this.geolocation.getCurrentPosition().then(response => {
			this.loadMap(response, true);
		}).catch(error =>{
			console.log(error);
		});
		
		/*this.geolocation.watchPosition().subscribe(response => {
			this.loadMap(response);
		}, 
		(error) => {
		  console.log(error);
		});*/
	}
  
	loadMap(position: Geoposition, estoyIniciando){
		let latitude = position.coords.latitude;
		let longitude = position.coords.longitude;
		
		// create a new map by passing HTMLElement
		let mapEle: HTMLElement = document.getElementById('map');
		let panelEle: HTMLElement = document.getElementById('panel');

		// New location
		this.myLatLng = {lat: latitude, lng: longitude};

		if(estoyIniciando){
			// create map
			this.map = new google.maps.Map(mapEle, {
			  center: this.myLatLng,
			  zoom: 12
			});
			this.directionsDisplay.setMap(this.map);
			this.directionsDisplay.setPanel(panelEle);
		}else{
			this.directionsDisplay.setMap(this.map);
		}
		
		google.maps.event.addListenerOnce(this.map, 'idle', () => {
			if(estoyIniciando){
				this.marker = new google.maps.Marker({
					position: this.myLatLng,
					map: this.map,
					title: 'Hello World!'
				});
				mapEle.classList.add('show-map');
				this.calcularRuta();
			}else{
				this.marker.setPosition(this.myLatLng);
			}
		});
	}

	private calcularRuta(){
		this.directionsService.route({
			origin: this.myLatLng,
			destination: this.viajeActual.destino,
			travelMode: google.maps.TravelMode.DRIVING,
			avoidTolls: true
		}, (response, status)=> {
			if(status === google.maps.DirectionsStatus.OK) {
				//console.log(response);
				this.directionsDisplay.setDirections(response);
			}else{
				alert('No se pudieron cargar las direcciones debido a: ' + status);
			}
			//Esperar un cachito mas 
			setTimeout(() => {this.loader.dismiss();}, 1000);
		});  
	}
	
	comenzarViaje() {
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var myData = JSON.stringify({action: "posicionActual", viaje_id: this.viajeActual.id, latitud: this.myLatLng.lat, longitud: this.myLatLng.lng, distancia: 0});
		this.http.post(link, myData).subscribe(data => {
			this.interval = window.setInterval(this.guardarPosicionActual.bind(null, this), 2000);
			//5 minutos son 300000 ms;
			this.global.intervalos[this.viajeActual.id] = this.interval;
			this.viajeActual.en_proceso = 1;
			this.viajeIniciado = true;
		}, 
		error => {
			console.log("Oooops!");
		});
	}
	
	guardarPosicionActual(estaClase) {
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var options = {enableHighAccuracy: true};
		navigator.geolocation.getCurrentPosition(function (position) {
			let latitud = position.coords.latitude;
			let longitud = position.coords.longitude;
			let miPosicionActual = {lat: latitud, lng: longitud};
			//Posicion vieja
			console.log(estaClase.myLatLng);
			//Posicion nueva
			console.log(miPosicionActual);
			let distancia = estaClase.calcularDistanciaEntre(estaClase.myLatLng.lat, miPosicionActual.lat, estaClase.myLatLng.lng, miPosicionActual.lng);
			//console.log(distancia);
			estaClase.loadMap(position, false);
			var myData = JSON.stringify({action: "posicionActual", viaje_id: estaClase.viajeActual.id, latitud: latitud, longitud: longitud, distancia: distancia});
			estaClase.http.post(link, myData).subscribe(data => {
				console.log(data["_body"]);
			}, 
			error => {
				console.log("Oooops!");
			});
		}, function (error) {
			console.log(error);
		}, options);
	}
	
	calcularDistanciaEntre(lat1:number, lat2:number, long1:number, long2:number){
		let p = 0.017453292519943295;    // Math.PI / 180
		let c = Math.cos;
		let a = 0.5 - c((lat1-lat2) * p) / 2 + c(lat2 * p) *c((lat1) * p) * (1 - c(((long1- long2) * p))) / 2;
		let dis = (12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km
		return dis;
	}
	
	finalizarViaje() {
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + this.viajeActual.id,
			message: 'Desea finalizar este viaje?',
			buttons: [
			{
				text: 'Cancelar',
				role: 'cancel',
				handler: () => {
					console.log('Cancel clicked');
				}
			},
			{
				text: 'Aceptar',
				handler: () => {
					this.cerrarViaje();
				}
			}
			]
		});
		alert.present();
	}
	
	cerrarViaje() {
		window.clearInterval(this.global.intervalos[this.viajeActual.id]);
		this.global.intervalos[this.viajeActual.id] = null;
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var myData = JSON.stringify({action: "distanciaTotal", viaje_id: this.viajeActual.id});
		this.http.post(link, myData).subscribe(data => {
			var distancia = parseFloat(data["_body"]);
			console.log(distancia);
			if(distancia > 0)
			{
				this.navCtrl.setRoot(Home);
			}
			this.loader.dismiss();
		}, 
		error => {
			console.log("Oooops!");
			this.loader.dismiss();
		});
	}
}
