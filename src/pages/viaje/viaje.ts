import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { AlertController } from 'ionic-angular';
import { GlobalProvider } from "../../providers/global/global";
import { MenuController } from 'ionic-angular';
import { Insomnia } from '@ionic-native/insomnia';
import { BackgroundMode } from '@ionic-native/background-mode';
import { LocationTracker } from '../../providers/location-tracker/location-tracker';

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
	
	interval: any;

	constructor(public navCtrl: NavController, 
			    public navParams: NavParams,
			    private geolocation: Geolocation,
				public alertCtrl: AlertController,
				public global: GlobalProvider,
				public menuCtrl: MenuController,
				private plt: Platform,
				private insomnia: Insomnia,
				public backgroundMode: BackgroundMode,
				public locationTracker: LocationTracker) {
					
		this.menuCtrl.enable(false);
					
		this.viajeActual = navParams.get('item');
		this.id = this.viajeActual.id;
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer
		this.insomnia.keepAwake().then(
			() => console.log('success'),
			() => console.log('error')
		);
	}
	
	start(){
		this.locationTracker.startTracking();
	}
 
	stop(){
		this.locationTracker.stopTracking();
	}
	
	ionViewWillEnter() {
		this.callback = this.navParams.get("callback");
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual, cargando: this.cargando});
	}
  
	ionViewDidLoad(){
		this.plt.ready().then(() => {
			let posicion_actual = {lat: this.locationTracker.latitud, lng: this.locationTracker.longitud};
			let mapEle: HTMLElement = document.getElementById('map');
			let panelEle: HTMLElement = document.getElementById('panel');
			this.map = new google.maps.Map(mapEle, {center: posicion_actual, zoom: 12});
			this.directionsDisplay.setPanel(panelEle);
			this.directionsDisplay.setMap(this.map);
			mapEle.classList.add('show-map');
			this.locationTracker.marker = new google.maps.Marker({map: this.map, title: 'Aqui estoy!'});
			this.locationTracker.marker.setPosition(posicion_actual);
			this.mostrarRutaEntre(this.viajeActual.origen, this.viajeActual.destino);
		});
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
	
	/*armarTrayecto(){
		let puntos_trayecto = this.viajeActual.puntos_trayecto;
		var trayecto = [];
		//console.log(puntos_trayecto);
		for (var i = 0; i < puntos_trayecto.length; i++) {
			trayecto.push({lat: Number(puntos_trayecto[i].latitud), lng: Number(puntos_trayecto[i].longitud)});
		}
		return trayecto;
	}*/
	
	comenzarViaje() {
		this.viajeActual.en_proceso = 1;
		this.backgroundMode.enable();
		this.locationTracker.stopTracking();
		this.locationTracker.inicializarArrays(this.id);
		this.locationTracker.startTracking();
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
		this.locationTracker.stopTracking();
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionVieja = this.locationTracker.ultima_posicion[this.id];
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getFecha(pos.timestamp);
			let distancia = this.global.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			this.locationTracker.guardarEnArrays(this.id, fechaNueva, posicionNueva, distancia);
			this.global.showSuccess(this.locationTracker.distancias[this.id].length);
			if (this.locationTracker.distancias[this.id].length > 2 && this.locationTracker.distancias[this.id].length == this.locationTracker.latitudes[this.id].length && 
				this.locationTracker.latitudes[this.id].length == this.locationTracker.longitudes[this.id].length && this.locationTracker.longitudes[this.id].length == this.locationTracker.fechas[this.id].length) {
				let latitudess = this.locationTracker.latitudes[this.id].join('|'); 
				let longitudess = this.locationTracker.longitudes[this.id].join('|'); 
				let distanciass = this.locationTracker.distancias[this.id].join('|'); 
				let fechass = this.locationTracker.fechas[this.id].join('|');
				let myData = JSON.stringify({action: "guardarDirecciones", viaje_id: this.id, latitudes: latitudess, longitudes: longitudess, distancias: distanciass, fechas: fechass});
				this.global.http.post(this.global.link, myData).subscribe(data => {
					this.locationTracker.eliminarDatosViaje(this.id);
					this.locationTracker.startTracking();
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
					this.locationTracker.startTracking();
				});
			}else{
				this.reiniciarViaje();
			}
		}).catch((error) => {
			console.log('Error getting location', error);
			this.global.showError("Oooops! Error obteniendo posicion actual!");
			this.locationTracker.startTracking();
		});
	}
	
	reiniciarViaje(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			console.log(data["_body"]);
			this.viajeActual.en_proceso = 0;
			this.cargando = true;
			//this.locationTracker.inicializarArrays(this.id);
			//this.currentMapTrack.setMap(null);
			this.global.loader.dismiss();
			this.locationTracker.eliminarDatosViaje(this.id);
			this.locationTracker.startTracking();
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
			this.locationTracker.startTracking();
		});
	}
}
