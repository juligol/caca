import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { MenuController } from 'ionic-angular';
import { GlobalProvider } from "../../providers/global/global";
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

	constructor(private plt: Platform,
				public navCtrl: NavController, 
			    public navParams: NavParams,
				public alertCtrl: AlertController,
				private geolocation: Geolocation,
				public global: GlobalProvider,
				public menuCtrl: MenuController,
				public locationTracker: LocationTracker) {
					
		this.menuCtrl.enable(false);
					
		this.viajeActual = navParams.get('item');
		this.id = this.viajeActual.id;
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer;
	}
	
	ionViewWillEnter() {
		this.callback = this.navParams.get("callback");
	}
	
	ionViewWillLeave() {
		var self = this;
		self.callback({viaje: self.viajeActual, cargando: self.cargando});
	}
  
	ionViewDidLoad(){
		var self = this;
		self.plt.ready().then(() => {
			let mapEle: HTMLElement = document.getElementById('map');
			let panelEle: HTMLElement = document.getElementById('panel');
			self.map = new google.maps.Map(mapEle, {center: self.locationTracker.posicionActual, zoom: 12});
			self.directionsDisplay.setPanel(panelEle);
			self.directionsDisplay.setMap(self.map);
			mapEle.classList.add('show-map');
			self.locationTracker.marker = new google.maps.Marker({map: self.map, title: 'Aqui estoy!'});
			self.locationTracker.marker.setPosition(self.locationTracker.posicionActual);
			self.mostrarRutaEntre(self.viajeActual.origen, self.viajeActual.destino);
		});
	}

	private mostrarRutaEntre(origen, destino){
		var self = this;
		self.directionsService.route({
			origin: origen,
			destination: destino,
			travelMode: google.maps.TravelMode.DRIVING,
			avoidTolls: true
		}, (response, status)=> {
			if(status === google.maps.DirectionsStatus.OK) {
				self.directionsDisplay.setDirections(response);
			}else{
				alert('No se pudieron cargar las direcciones debido a: ' + status);
			}
			//Esperar un cachito mas 
			setTimeout(() => {self.global.stopLoading();}, 1000);
		});  
	}
	
	comenzarViaje() {
		var self = this;
		self.viajeActual.en_proceso = 1;
		self.locationTracker.inicializarArrays(self.id);
		self.geolocation.getCurrentPosition().then(pos => {
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = self.global.getFecha(pos.timestamp);
			self.locationTracker.guardarEnArrays(self.id, fechaNueva, posicionNueva, 0);
		}).catch((error) => {
			self.global.showMessage("Error al obtener la posicion inicial", error);
		});
	}
	
	finalizarViaje() {
		var self = this;
		let alert = self.alertCtrl.create({
			title: 'Viaje ' + self.id,
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
					self.detenerViaje();
				}
			}
			]
		});
		alert.present();
	}
	
	detenerViaje() {
		var self = this;
		self.global.loading();
		self.geolocation.getCurrentPosition().then(pos => {
			let posicionVieja = self.locationTracker.ultima_posicion[self.id];
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = self.global.getFecha(pos.timestamp);
			let distancia = self.global.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			//Mando la ultima posicion con su fecha y distancia para que sincronize la ultima entrada a la BDs
			self.ultimoIngresoYDistanciaFinal(fechaNueva, posicionNueva, distancia);
		}).catch((error) => {
			self.global.showMessage("Error al obtener la posicion final", error);
		});
	}
	
	ultimoIngresoYDistanciaFinal(fecha, posicion, distancia){
		var self = this;
		let myData = JSON.stringify({action: "distanciaTotal", viaje_id: self.id, fecha: fecha, latitud: posicion.lat, longitud: posicion.lng, distancia: distancia});
		self.global.http.post(self.global.getLink(), myData).subscribe(data => {
			self.locationTracker.eliminarDatosViaje(self.id);
			let distancia = parseFloat(data["_body"]);
			self.global.mensaje("Distancia total recorrida", distancia.toFixed(2) + " Km");
			if(distancia > 0){
				self.verificarCierreViaje();
			}else{
				self.reiniciarViaje();
			}
		}, 
		error => {
			self.global.showMessage("Error al calcular la distancia final", error);
		});
	}
	
	verificarCierreViaje(){
		var self = this;
		if(self.viajeActual.fechaValida){
			self.navCtrl.setRoot(CerrarViaje, {viaje: self.viajeActual});
			self.cargando = true;
		}
		else{
			self.navCtrl.setRoot(Home);
			self.cargando = false;
		}
	}
	
	reiniciarViaje(){
		var self = this;
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: self.id});
		self.global.http.post(self.global.getLink(), myData).subscribe(data => {
			console.log(data["_body"]);
			self.viajeActual.en_proceso = 0;
			self.cargando = true;
			self.global.stopLoading();
		}, 
		error => {
			self.global.showMessage("Error al reiniciar el viaje", error);
		});
	}
}
