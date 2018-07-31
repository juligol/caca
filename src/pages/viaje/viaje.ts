import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { AlertController } from 'ionic-angular';
import { GlobalProvider } from "../../providers/global/global";
import { MenuController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';

import { CerrarViaje } from '../cerrar_viaje/cerrar_viaje';
import { Home } from '../home/home';

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
	marker: any;
	interval: any;
	callback: any;
	viajeIniciado: Boolean = false;
	cargando: Boolean = true;
	
	currentMapTrack = null;
	isTracking = false;
	trackedRoute = [];
	distancias = [];
	latitudes = [];
	longitudes = [];
	previousTracks = [];
	positionSubscription: Subscription;

	constructor(public navCtrl: NavController, 
			    public navParams: NavParams,
			    private geolocation: Geolocation,
				public alertCtrl: AlertController,
				public global: GlobalProvider,
				public menuCtrl: MenuController,
				private plt: Platform,
				private storage: Storage) {
					
		this.menuCtrl.enable(false);
					
		this.viajeActual = navParams.get('item');
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer();
		
		if(this.viajeActual.en_proceso == 1)
			this.viajeIniciado = true;
	}
	
	ionViewWillEnter() {
      this.callback = this.navParams.get("callback")
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual, cargando: this.cargando});
	}
  
	ionViewDidLoad(){
		//this.getPosition();
		this.plt.ready().then(() => {
			this.geolocation.getCurrentPosition().then(pos => {
				this.myLatLng = {lat: pos.coords.latitude, lng: pos.coords.longitude};
				// create a new map by passing HTMLElement
				let mapEle: HTMLElement = document.getElementById('map');
				let panelEle: HTMLElement = document.getElementById('panel');
				this.map = new google.maps.Map(mapEle, {
				  center: this.myLatLng,
				  zoom: 12
				});
				this.directionsDisplay.setPanel(panelEle);
				this.directionsDisplay.setMap(this.map);
				this.marker = new google.maps.Marker({
					position: this.myLatLng,
					map: this.map,
					title: 'Aqui estoy!'
				});
				mapEle.classList.add('show-map');
				this.calcularRuta();
			}).catch((error) => {
				console.log('Error getting location', error);
			});
		});
	}
  
	getPosition():any{
		this.geolocation.getCurrentPosition().then(response => {
			this.loadMap(response, true);
		}).catch(error =>{
			this.global.showError("No se pudo obtener su ubicación actual!");
		});
	}
  
	loadMap(position: Geoposition, estoyIniciando){
		let latitude = position.coords.latitude;
		let longitude = position.coords.longitude;
		
		//Posicion vieja
		let posicionVieja = this.myLatLng;
		if(estoyIniciando){
			posicionVieja = {lat: latitude, lng: longitude};
		}
		//Posicion nueva
		this.myLatLng = {lat: latitude, lng: longitude};
		
		if(!estoyIniciando){
			console.log(posicionVieja);
			console.log(this.myLatLng);
		}
		
		let distancia = this.calcularDistanciaEntre(posicionVieja.lat, this.myLatLng.lat, posicionVieja.lng, this.myLatLng.lng);
		if(distancia > 0){
			var myData = JSON.stringify({action: "posicionActual", viaje_id: this.viajeActual.id, latitud: latitude, longitud: longitude, distancia: distancia});
			this.global.http.post(this.global.link, myData).subscribe(data => {
				var dist = parseFloat(data["_body"]);
				console.log("Distancia parcial guardada: " + dist + " Km");
			}, 
			error => {
				this.global.showError("Oooops! Por favor intente de nuevo!");
			});
		}
		
		// create a new map by passing HTMLElement
		let mapEle: HTMLElement = document.getElementById('map');
		let panelEle: HTMLElement = document.getElementById('panel');

		if(estoyIniciando){
			// create map
			this.map = new google.maps.Map(mapEle, {
			  center: this.myLatLng,
			  zoom: 12
			});
			this.directionsDisplay.setPanel(panelEle);
		}
		this.directionsDisplay.setMap(this.map);
		
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
			//origin: this.myLatLng,
			origin: this.viajeActual.origen,
			destination: this.viajeActual.destino,
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
		/*var myData = JSON.stringify({action: "posicionActual", viaje_id: this.viajeActual.id, latitud: this.myLatLng.lat, longitud: this.myLatLng.lng, distancia: 0});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			//5 minutos son 300000 ms;
			this.interval = setInterval(() => {this.guardarPosicionActual();}, 120000);
			this.global.intervalos[this.viajeActual.id] = this.interval;
			this.viajeActual.en_proceso = 1;
			this.viajeIniciado = true;
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
		});*/
		this.viajeActual.en_proceso = 1;
		this.isTracking = true;
		this.trackedRoute = [];
		this.distancias = [];
		this.latitudes = [];
		this.longitudes = [];
		let options = {timeout : 120000, enableHighAccuracy: true};
		this.positionSubscription = this.geolocation.watchPosition(options)
			.pipe(
				filter((p) => p.coords !== undefined) //Filter Out Errors
			)
			.subscribe(data => {
				setTimeout(() => {
					let posicionVieja = this.myLatLng;
					this.myLatLng = {lat: data.coords.latitude, lng: data.coords.longitude};
					let distancia = this.calcularDistanciaEntre(posicionVieja.lat, this.myLatLng.lat, posicionVieja.lng, this.myLatLng.lng);
					console.log(posicionVieja);
					console.log(this.myLatLng);
					if(distancia > 0){
						this.trackedRoute.push(this.myLatLng);
						this.distancias.push(distancia);
						this.latitudes.push(this.myLatLng.lat);
						this.longitudes.push(this.myLatLng.lng);
						this.redrawPath(this.trackedRoute);
						this.marker.setPosition(this.myLatLng);
						console.log(distancia);
					}
				}, 0);
			});
	}
	
	redrawPath(path) {
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
	}
	
	guardarPosicionActual() {
		this.geolocation.getCurrentPosition().then(response => {
			this.loadMap(response, false);
		}).catch(error =>{
			this.global.showError("No se pudo obtener su ubicación actual!");
		});
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
					this.detenerViaje();
				}
			}
			]
		});
		alert.present();
	}
	
	detenerViaje() {
		this.global.loading();
		this.isTracking = false;
		this.positionSubscription.unsubscribe();
		if (this.trackedRoute.length > 1 && this.trackedRoute.length == this.distancias.length) {
			//this.currentMapTrack.setMap(null);
			var latitudess = this.latitudes.join('|');
			var longitudess = this.longitudes.join('|');
			var distanciass = this.distancias.join('|');
			var myData = JSON.stringify({action: "guardarDirecciones", viaje_id: this.viajeActual.id, latitudes: latitudess, longitudes: longitudess, distancias: distanciass});
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
			this.viajeActual.en_proceso = 0;
			this.cargando = true;
			this.global.loader.dismiss();
		}
		
		/*this.global.loading();
		clearInterval(this.global.intervalos[this.viajeActual.id]);
		this.global.intervalos[this.viajeActual.id] = null;
		this.guardarPosicionActual();
		var myData = JSON.stringify({action: "distanciaTotal", viaje_id: this.viajeActual.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			var distancia = parseFloat(data["_body"]);
			console.log("Distancia total recorrida: " + distancia + " Km");
			if(distancia > 0)
			{
				if(this.viajeActual.fechaValida){
					this.navCtrl.setRoot(CerrarViaje, {viaje: this.viajeActual});
					this.cargando = true;
				}
				else{
					this.navCtrl.setRoot(Home);
					this.cargando = false;
				}
			}
			else
			{
				setTimeout(() => {this.reiniciarViaje();}, 1000);
			}
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
		});*/
	}
	
	reiniciarViaje(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.viajeActual.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			console.log(data["_body"]);
			this.viajeActual.en_proceso = 0;
			this.viajeIniciado = false;
			this.cargando = true;
			this.global.loader.dismiss();
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
		});
	}
}
