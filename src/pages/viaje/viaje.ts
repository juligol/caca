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
	viaje: any;
	directionsService: any = null;
	directionsDisplay: any = null;

	constructor(public menuCtrl: MenuController,
				public navParams: NavParams,
				private platform: Platform,
				public navCtrl: NavController, 
				public alertCtrl: AlertController,
				private geolocation: Geolocation,
				public global: GlobalProvider,
				public locationTracker: LocationTracker) {
					
		this.menuCtrl.enable(false);
		this.viaje = navParams.get('item');
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer;
	}

	ionViewDidLoad(){
		this.platform.ready().then(() => {
			// Create map
			let mapDiv: HTMLElement = document.getElementById('map');
			let map = new google.maps.Map(mapDiv, {center: this.locationTracker.posicionActual, zoom: 12});
			this.directionsDisplay.setMap(map);
			// Create panel
			let panelDiv: HTMLElement = document.getElementById('panel');
			this.directionsDisplay.setPanel(panelDiv);
			// Show map
			mapDiv.classList.add('show-map');
			this.locationTracker.marker = new google.maps.Marker({map: map, title: 'Aqui estoy!'});
			this.locationTracker.marker.setPosition(this.locationTracker.posicionActual);
			this.showRoute(this.viaje.origen, this.viaje.destino);
		});
	}

	private showRoute(origen, destino){
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
			// Wait a little more
			setTimeout(() => {this.global.stopLoading();}, 1000);
		});  
	}

	goHome() {
		this.global.loading();
		this.navCtrl.setRoot(Home);
	}
	
	startTrip() {
		this.viaje.en_proceso = 1;
		this.locationTracker.initializeArrays(this.viaje.id);
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getDate(pos.timestamp);
			this.locationTracker.saveInArrays(this.viaje.id, fechaNueva, posicionNueva, 0);
		}).catch((error) => {
			this.global.showMessage("Error al obtener la posicion inicial", error);
		});
	}
	
	finishTrip() {
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + this.viaje.id,
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
					this.stopTrip();
				}
			}
			]
		});
		alert.present();
	}
	
	stopTrip() {
		this.global.loading();
		this.geolocation.getCurrentPosition().then(pos => {
			let posicionVieja = this.locationTracker.ultima_posicion[this.viaje.id];
			let posicionNueva = {lat: pos.coords.latitude, lng: pos.coords.longitude};
			let fechaNueva = this.global.getDate(pos.timestamp);
			let distancia = this.global.calculateDistance(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			// Send the last location with the date and the distance to sincronize the final position with the database
			this.lastLocationAndFinish(fechaNueva, posicionNueva, distancia);
		}).catch((error) => {
			this.global.showMessage("Error al obtener la posicion final", error);
		});
	}
	
	lastLocationAndFinish(fecha, posicion, distancia){
		let myData = JSON.stringify({action: "distanciaTotal", viaje_id: this.viaje.id, fecha: fecha, latitud: posicion.lat, longitud: posicion.lng, distancia: distancia});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			// Delete data from arrays
			this.locationTracker.deleteTripData(this.viaje.id);
			let distancia = parseFloat(data["_body"]);
			this.global.message("Distancia total recorrida", distancia.toFixed(2) + " Km");
			if(distancia > 0){
				this.verifyTripClose();
			}else{
				this.restartTrip();
			}
		}, 
		error => {
			this.global.showMessage("Error al calcular la distancia final", error);
		});
	}
	
	verifyTripClose(){
		if(this.viaje.fechaValida)
			this.navCtrl.setRoot(CerrarViaje, {viaje: this.viaje});
		else
			this.navCtrl.setRoot(Home);
	}
	
	restartTrip(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.viaje.id});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			console.log(data["_body"]);
			this.viaje.en_proceso = 0;
			this.global.stopLoading();
		}, 
		error => {
			this.global.showMessage("Error al reiniciar el viaje", error);
		});
	}
}
