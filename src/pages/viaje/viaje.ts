import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { AlertController } from 'ionic-angular';
import { GlobalProvider } from "../../providers/global/global";
import { MenuController } from 'ionic-angular';
import { filter } from 'rxjs/operators';

import { CerrarViaje } from '../cerrar_viaje/cerrar_viaje';
import { Home } from '../home/home';

declare var google;

@Component({
  selector: 'page-viaje',
  templateUrl: 'viaje.html'
})

export class Viaje {
	id: any;
	callback: any;
	viajeActual: any;
	cargando: Boolean = true;
	map: any;
	directionsService: any = null;
	directionsDisplay: any = null;
	currentMapTrack: any = null;
	marker: any;
	
	interval: any;

	constructor(public navCtrl: NavController, 
			    public navParams: NavParams,
			    private geolocation: Geolocation,
				public alertCtrl: AlertController,
				public global: GlobalProvider,
				public menuCtrl: MenuController,
				private plt: Platform) {
					
		this.menuCtrl.enable(false);
					
		this.viajeActual = navParams.get('item');
		this.id = this.viajeActual.id;
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer();
	}
	
	ionViewWillEnter() {
		this.callback = this.navParams.get("callback");
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual, cargando: this.cargando});
	}
  
	ionViewDidLoad(){
		this.plt.ready().then(() => {
			this.geolocation.getCurrentPosition().then(pos => {
				let posicion_actual = {lat: pos.coords.latitude, lng: pos.coords.longitude};
				let mapEle: HTMLElement = document.getElementById('map');
				let panelEle: HTMLElement = document.getElementById('panel');
				this.map = new google.maps.Map(mapEle, {center: posicion_actual, zoom: 12});
				this.directionsDisplay.setPanel(panelEle);
				this.directionsDisplay.setMap(this.map);
				mapEle.classList.add('show-map');
				this.global.markers[this.id] = new google.maps.Marker({map: this.map, title: 'Aqui estoy!'});
				if(this.viajeActual.en_proceso == 0){
					this.inicializarArrays();
					this.global.markers[this.id].setPosition(posicion_actual);
				}else{
					//dibujo el trayecto que estaba
					//this.redrawPath(this.global.rutas[this.id]);
				}
				this.mostrarRutaEntre(this.viajeActual.origen, this.viajeActual.destino);
			}).catch((error) => {
				console.log('Error getting location', error);
				this.global.showError("Oooops! Error obteniendo posicion actual!");
			});
		});
	}
	
	inicializarArrays(){
		this.global.fechas[this.id] = [];
		//this.global.rutas[this.id] = [];
		this.global.posiciones[this.id] = null;
		this.global.ultima_fecha[this.id] = null;
		this.global.latitudes[this.id] = [];
		this.global.longitudes[this.id] = [];
		this.global.distancias[this.id] = [];
		this.global.primeraVez[this.id] = true;
	}

	private mostrarRutaEntre(origen, destino){
		this.directionsService.route({
			origin: origen,
			destination: destino,
			travelMode: google.maps.TravelMode.DRIVING,
			avoidTolls: true
		}, (response, status)=> {
			if(status === google.maps.DirectionsStatus.OK) {
				this.directionsDisplay.setDirections(response);
			}else{
				alert('No se pudieron cargar las direcciones debido a: ' + status);
			}
			//Esperar un cachito mas 
			setTimeout(() => {this.global.loader.dismiss();}, 1000);
		});  
	}
	
	comenzarViaje() {
		this.viajeActual.en_proceso = 1;
		//let options = {timeout : 120000, enableHighAccuracy: true};
		this.global.subscriptions[this.id] = this.geolocation.watchPosition(/*options*/)
			.pipe(
				filter((p) => p.coords !== undefined) //Filter Out Errors
			)
			.subscribe(data => {
				setTimeout(() => {
					let posicionNueva = {lat: data.coords.latitude, lng: data.coords.longitude};
					let fechaNueva = this.global.getFechaActual();
					if(this.global.primeraVez[this.id]){
						this.guardarEnArrays(fechaNueva, posicionNueva, 0);
						this.global.primeraVez[this.id] = false;
					}else{
						let posicionVieja = this.global.posiciones[this.id];
						let distancia = this.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
						let tiempo = this.calcularTiempoEntre(this.global.ultima_fecha[this.id], fechaNueva);
						if(distancia > 0 /*100 metros*/ && tiempo >= 2 /*2 minutos*/){
							this.guardarEnArrays(fechaNueva, posicionNueva, distancia);
						}
					}
					//this.global.rutas[this.id].push(posicionNueva);
					//this.redrawPath(this.global.rutas[this.id]);
					this.global.markers[this.id].setPosition(posicionNueva);
				}, 0);
			});
	}
	
	guardarEnArrays(fecha, posicion, distancia){
		this.global.posiciones[this.id] = posicion;
		this.global.ultima_fecha[this.id] = fecha;
		this.global.fechas[this.id].push(fecha);
		this.global.latitudes[this.id].push(posicion.lat);
		this.global.longitudes[this.id].push(posicion.lng);
		this.global.distancias[this.id].push(distancia);
	}
	
	/*redrawPath(path) {
		if (this.currentMapTrack) {
		  this.currentMapTrack.setMap(null);
		}
		if (path.length > 1) {
		  this.currentMapTrack = new google.maps.Polyline({
			path: path,
			geodesic: true,
			strokeColor: '#ff00ff',
			strokeOpacity: 1.0,
			strokeWeight: 3
		  });
		  this.currentMapTrack.setMap(this.map);
		}
	}*/
	
	calcularDistanciaEntre(lat1:number, lat2:number, long1:number, long2:number){
		let p = 0.017453292519943295;    // Math.PI / 180
		let c = Math.cos;
		let a = 0.5 - c((lat1-lat2) * p) / 2 + c(lat2 * p) *c((lat1) * p) * (1 - c(((long1- long2) * p))) / 2;
		let dis = (12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km
		return dis;
	}
	
	calcularTiempoEntre(fechaVieja, fechaNueva){
		var fechaInicio = new Date(fechaVieja).getTime();
		var fechaFin    = new Date(fechaNueva).getTime();
		var diff = fechaFin - fechaInicio;
		// (1000*60*60*24) --> milisegundos -> segundos -> minutos -> horas -> días
		return ( diff/(1000*60) ); // para devolver en minutos
	}
	
	finalizarViaje() {
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + this.id,
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
					this.detenerViaje();
				}
			}
			]
		});
		alert.present();
	}
	
	detenerViaje() {
		this.global.loading();
		this.global.subscriptions[this.id].unsubscribe();
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionVieja = this.global.posiciones[this.id];
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getFechaActual();
			let distancia = this.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			this.guardarEnArrays(fechaNueva, posicionNueva, distancia);
			if (this.global.distancias[this.id].length > 2 && this.global.distancias[this.id].length == this.global.latitudes[this.id].length && 
				this.global.latitudes[this.id].length == this.global.longitudes[this.id].length && this.global.longitudes[this.id].length == this.global.fechas[this.id].length) {
				let latitudess = this.global.latitudes[this.id].join('|'); 
				let longitudess = this.global.longitudes[this.id].join('|'); 
				let distanciass = this.global.distancias[this.id].join('|'); 
				let fechass = this.global.fechas[this.id].join('|');
				let myData = JSON.stringify({action: "guardarDirecciones", viaje_id: this.id, latitudes: latitudess, longitudes: longitudess, distancias: distanciass, fechas: fechass});
				this.global.http.post(this.global.link, myData).subscribe(data => {
					if(this.viajeActual.fechaValida){
						this.navCtrl.setRoot(CerrarViaje, {viaje: this.viajeActual});
						this.cargando = true;
					}
					else{
						this.navCtrl.setRoot(Home);
						this.cargando = false;
					}
				}, 
				error => {
					this.global.showError("Oooops! Por favor intente de nuevo!");
				});
			}else{
				this.reiniciarViaje();
			}
		}).catch((error) => {
			console.log('Error getting location', error);
			this.global.showError("Oooops! Error obteniendo posicion actual!");
		});
	}
	
	reiniciarViaje(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			console.log(data["_body"]);
			this.viajeActual.en_proceso = 0;
			this.cargando = true;
			this.inicializarArrays();
			//this.currentMapTrack.setMap(null);
			this.global.loader.dismiss();
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
		});
	}
}
