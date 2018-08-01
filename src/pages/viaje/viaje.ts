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
	callback: any;
	viajeActual: any;
	cargando: Boolean = true;
	map: any;
	directionsService: any = null;
	directionsDisplay: any = null;
	currentMapTrack: any = null;
	myLatLng: any;
	marker: any;
	fecha: any;
	isTracking: Boolean = false;
	primeraVez: Boolean = true;
	trackedRoute = [];
	distancias = [];
	latitudes = [];
	longitudes = [];
	fechas = [];
	positionSubscription: Subscription;
	
	interval: any;

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
		
		if(this.viajeActual.en_proceso == 1){
			this.isTracking = true;
			this.trackedRoute = this.global.rutas_global[this.viajeActual.id];
			this.distancias = this.global.distancias_global[this.viajeActual.id];
			this.latitudes = this.global.latitudes_global[this.viajeActual.id];
			this.longitudes = this.global.longitudes_global[this.viajeActual.id];
			this.fechas = this.global.fechas_global[this.viajeActual.id];
			this.redrawPath(this.trackedRoute);
			this.primeraVez = false;
		}
	}
	
	ionViewWillEnter() {
		this.callback = this.navParams.get("callback");
	}
	
	ionViewWillLeave() {
		this.callback({viaje: this.viajeActual, cargando: this.cargando});
		this.global.rutas_global[this.viajeActual.id] = this.trackedRoute;
		this.global.distancias_global[this.viajeActual.id] = this.distancias;
		this.global.latitudes_global[this.viajeActual.id] = this.latitudes;
		this.global.longitudes_global[this.viajeActual.id] = this.longitudes;
		this.global.fechas_global[this.viajeActual.id] = this.fechas;
	}
  
	ionViewDidLoad(){
		//this.getPosition();
		this.plt.ready().then(() => {
			this.geolocation.getCurrentPosition().then(pos => {
				this.myLatLng = {lat: pos.coords.latitude, lng: pos.coords.longitude};
				this.fecha = this.getFechaActual();
				let mapEle: HTMLElement = document.getElementById('map');
				let panelEle: HTMLElement = document.getElementById('panel');
				this.map = new google.maps.Map(mapEle, {center: this.myLatLng, zoom: 12});
				this.directionsDisplay.setPanel(panelEle);
				this.directionsDisplay.setMap(this.map);
				this.marker = new google.maps.Marker({position: this.myLatLng, map: this.map, title: 'Aqui estoy!'});
				mapEle.classList.add('show-map');
				this.calcularRuta();
			}).catch((error) => {
				//console.log('Error getting location', error);
				this.global.showError("Oooops! Error obteniendo posicion actual!");
			});
		});
	}
	
	getFechaActual(){
		var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in 
		return new Date(Date.now() - tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
  
	/*getPosition():any{
		this.geolocation.getCurrentPosition().then(response => {
			this.loadMap(response, true);
		}).catch(error =>{
			this.global.showError("No se pudo obtener su ubicación actual!");
		});
	}*/
  
	/*loadMap(position: Geoposition, estoyIniciando){
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
	}*/

	private calcularRuta(){
		this.directionsService.route({
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
		this.isTracking = true;
		this.viajeActual.en_proceso = 1;
		let options = {timeout : 120000, enableHighAccuracy: true};
		this.positionSubscription = this.geolocation.watchPosition(options)
			.pipe(
				filter((p) => p.coords !== undefined) //Filter Out Errors
			)
			.subscribe(data => {
				setTimeout(() => {
					let latitudNueva = data.coords.latitude;
					let longitudNueva = data.coords.longitude;
					let posicionNueva = {lat: latitudNueva, lng: longitudNueva};
					let fechaNueva = this.getFechaActual();
					if(this.primeraVez){
						this.guardarEnArrays(fechaNueva, 0, latitudNueva, longitudNueva);
						this.primeraVez = false;
					}
					let distancia = this.calcularDistanciaEntre(this.myLatLng.lat, latitudNueva, this.myLatLng.lng, longitudNueva);
					let tiempo = this.calcularTiempoEntre(this.fecha, fechaNueva);
					if(distancia > 0 /*100 metros*/ && tiempo >= 2 /*2 minutos*/){
						console.log(distancia);
						console.log(tiempo);
						this.fecha = fechaNueva;
						this.guardarEnArrays(fechaNueva, distancia, latitudNueva, longitudNueva);
					}
					this.trackedRoute.push(posicionNueva);
					this.redrawPath(this.trackedRoute);
					this.marker.setPosition(posicionNueva);
				}, 0);
			});
	}
	
	guardarEnArrays(fecha, distancia, latitud, longitud){
		this.fechas.push(fecha);
		this.distancias.push(distancia);
		this.latitudes.push(latitud);
		this.longitudes.push(longitud);
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
	
	calcularTiempoEntre(fechaVieja, fechaNueva){
		var fechaInicio = new Date(fechaVieja).getTime();
		var fechaFin    = new Date(fechaNueva).getTime();
		var diff = fechaFin - fechaInicio;
		// (1000*60*60*24) --> milisegundos -> segundos -> minutos -> horas -> días
		return ( diff/(1000*60) ); // para devolver en minutos
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
		this.geolocation.getCurrentPosition().then(pos => {
			let latitudNueva = pos.coords.latitude;
			let longitudNueva = pos.coords.longitude;
			let posicionNueva = {lat: latitudNueva, lng: longitudNueva};
			let fechaNueva = this.getFechaActual();
			let distancia = this.calcularDistanciaEntre(this.myLatLng.lat, latitudNueva, this.myLatLng.lng, longitudNueva);
			this.guardarEnArrays(fechaNueva, distancia, latitudNueva, longitudNueva);
			if (this.distancias.length > 2 && this.distancias.length == this.latitudes.length && this.latitudes.length == this.longitudes.length && this.longitudes.length == this.fechas.length) {
				let latitudess = this.latitudes.join('|');
				let longitudess = this.longitudes.join('|');
				let distanciass = this.distancias.join('|');
				let fechass = this.fechas.join('|');
				let myData = JSON.stringify({action: "guardarDirecciones", viaje_id: this.viajeActual.id, latitudes: latitudess, longitudes: longitudess, distancias: distanciass, fechas: fechass});
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
			//console.log('Error getting location', error);
			this.global.showError("Oooops! Error obteniendo posicion actual!");
		});
	}
	
	reiniciarViaje(){
		var myData = JSON.stringify({action: "reiniciarViaje", viaje_id: this.viajeActual.id});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			console.log(data["_body"]);
			this.viajeActual.en_proceso = 0;
			this.cargando = true;
			this.trackedRoute = [];
			this.distancias = [];
			this.latitudes = [];
			this.longitudes = [];
			this.fechas = [];
			this.primeraVez = true;
			this.isTracking = false;
			//this.dangerousventa.setMap(null);
			this.global.loader.dismiss();
		}, 
		error => {
			this.global.showError("Oooops! Por favor intente de nuevo!");
		});
	}
}
