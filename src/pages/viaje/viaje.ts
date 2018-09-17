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
		this.directionsDisplay = new google.maps.DirectionsRenderer
	}
	
	ionViewWillEnter() {
		this.callback = this.navParams.get("callback");
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual, cargando: this.cargando});
	}
  
	ionViewDidLoad(){
		this.plt.ready().then(() => {
			let mapEle: HTMLElement = document.getElementById('map');
			let panelEle: HTMLElement = document.getElementById('panel');
			this.map = new google.maps.Map(mapEle, {center: this.locationTracker.posicionActual, zoom: 12});
			this.directionsDisplay.setPanel(panelEle);
			this.directionsDisplay.setMap(this.map);
			mapEle.classList.add('show-map');
			this.locationTracker.marker = new google.maps.Marker({map: this.map, title: 'Aqui estoy!'});
			this.locationTracker.marker.setPosition(this.locationTracker.posicionActual);
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
			setTimeout(() => {this.global.stopLoading();}, 1000);
		});  
	}
	
	comenzarViaje() {
		this.viajeActual.en_proceso = 1;
		this.locationTracker.inicializarArrays(this.id);
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getFecha(pos.timestamp);
			this.locationTracker.guardarEnArrays(this.id, fechaNueva, posicionNueva, 0);
		}).catch((error) => {
			this.global.showMessage("Error al obtener la posicion inicial", error);
		});
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
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionVieja = this.locationTracker.ultima_posicion[this.id];
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getFecha(pos.timestamp);
			let distancia = this.global.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			//Mando la ultima posicion con su fecha y distancia para que sincronize la ultima entrada a la BDs
			this.ultimoIngresoYDistanciaFinal(fechaNueva, posicionNueva, distancia);
		}).catch((error) => {
			this.global.showMessage("Error al obtener la posicion final", error);
		});
	}
	
	ultimoIngresoYDistanciaFinal(fecha, posicion, distancia){
		let myData = JSON.stringify({action: "distanciaTotal", viaje_id: this.id, fecha: fecha, latitud: posicion.lat, longitud: posicion.lng, distancia: distancia});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			this.locationTracker.eliminarDatosViaje(this.id);
			let distancia = parseFloat(data["_body"]);
			this.global.mensaje("Distancia total recorrida", distancia.toFixed(2) + " Km");
			if(distancia > 0){
				this.verificarCierreViaje();
			}else{
				this.reiniciarViaje();
			}
		}, 
		error => {
			this.global.showMessage("Error al calcular la distancia final", error);
		});
	}
	
	verificarCierreViaje(){
		if(this.viajeActual.fechaValida){
			this.navCtrl.setRoot(CerrarViaje, {viaje: this.viajeActual});
			this.cargando = true;
		}
		else{
			this.navCtrl.setRoot(Home);
			this.cargando = false;
		}
	}
	
	reiniciarViaje(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			console.log(data["_body"]);
			this.viajeActual.en_proceso = 0;
			this.cargando = true;
			this.global.stopLoading();
		}, 
		error => {
			this.global.showMessage("Error al reiniciar el viaje", error);
		});
	}
}
