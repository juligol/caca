import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig/*, BackgroundGeolocationResponse*/ } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { GlobalProvider } from "../global/global";
import { Storage } from '@ionic/storage';

@Injectable()
export class LocationTracker {
	
	public watch: any;
	public latitud: any;
	public longitud: any;
	public tiempo: any;
	public config: BackgroundGeolocationConfig;
	public marker: any = null;
	
	public viajes 			= [];
	public ultima_fecha		= [];
	public ultima_posicion 	= [];
	
	public fechas 			= [];
	public latitudes	 	= [];
	public longitudes 		= [];
	public distancias		= [];
	
	public isTracking: Array<Boolean> = [];

	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation, 
				public geolocation: Geolocation,
				private storage: Storage,
				public global: GlobalProvider) {
					
		this.config = {
			desiredAccuracy: 0,
			stationaryRadius: 20,
			distanceFilter: 10,
			debug: false
			//stopOnTerminate: false
		};		
	}
	
	startTracking() {
		this.backgroundTracking();
		this.foregroundTracking();
	}
	
	backgroundTracking(){
		// Background Tracking
		this.backgroundGeolocation.configure(this.config).subscribe((location) => {
			setTimeout(() => {
				this.zone.run(() => {
					this.storage.get('user').then((user) => {
						var posicionNueva = {lat: location.latitude, lng: location.longitude};
						var fechaNueva = this.global.getFecha(location.time);
						this.actualizarPosicion(user.id, fechaNueva, posicionNueva, "Back");
					});
				});
			}, 0);
		}, 
		(error) => {
			this.global.mensaje("Error en background! ", error);
			//this.global.showError("Oooops! Error en background!");
		});
		
		// Turn ON the background-geolocation system.
		this.backgroundGeolocation.start();
	}
	
	foregroundTracking(){
		// Foreground Tracking
		let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};
		this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			setTimeout(() => {
				this.zone.run(() => {
					this.storage.get('user').then((user) => {
						var posicionNueva = {lat: position.coords.latitude, lng: position.coords.longitude};
						var fechaNueva = this.global.getFecha(position.timestamp);
						this.actualizarPosicion(user.id, fechaNueva, posicionNueva, "Front");
					},
					error => {
						this.global.showError("Oooops! Por favor intente de nuevo!");
					});
				});
			}, 0);
		});
	}
	
	inicializarArrays(id){
		this.viajes.push(id);
		this.inicializar(id);
	}
	
	inicializar(id){
		this.ultima_posicion[id] = null;
		this.ultima_fecha[id] = null;
		this.isTracking[id] = false;
		
		this.fechas[id] = [];
		this.latitudes[id] = [];
		this.longitudes[id] = [];
		this.distancias[id] = [];
	}
	
	actualizarPosicion(chofer_id, fechaNueva, posicionNueva, palabra){
		var myData = JSON.stringify({action: "actualizarPosicion", chofer_id: chofer_id, latitud: posicionNueva.lat, longitud: posicionNueva.lng, tiempo: fechaNueva, tipo: palabra});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			this.latitud = posicionNueva.lat;
			this.longitud = posicionNueva.lng;
			this.tiempo = fechaNueva;
			console.log(palabra);
			console.log(myData);
			if(this.marker != null)
				this.marker.setPosition({lat: this.latitud, lng: this.longitud});
			
			for (var i = 0; i < this.viajes.length; i++) {
				this.guardarPosicion(this.viajes[i], fechaNueva, posicionNueva);
			}
		});
	}
	
	guardarPosicion(id, fechaNueva, posicionNueva){
		var posicionVieja = this.ultima_posicion[id];
		if(posicionVieja){
			var distancia = this.global.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			var tiempo = this.global.calcularTiempoEntre(this.ultima_fecha[id], fechaNueva);
			if(distancia > 0 /*100 metros*/ && tiempo >= 2 /*2 minutos*/){
				this.guardarEnArrays(id, fechaNueva, posicionNueva, distancia);
			}
		}
	}
	
	eliminarViaje(id){
		var index = this.viajes.indexOf(id);
		if (index > -1) {
		  this.viajes.splice(index, 1);
		}
	}
	
	eliminarDatosViaje(id){
		//this.loguear();
		this.eliminarViaje(id);
		this.inicializar(id);
		this.loguear();
	}
	
	loguear(){
		console.log(this.viajes);
		console.log(this.ultima_fecha);
		console.log(this.ultima_posicion);
		console.log(this.isTracking);
		console.log(this.fechas);
		console.log(this.latitudes);
		console.log(this.longitudes);
		console.log(this.distancias);
	}
	
	guardarEnArrays(id, fecha, posicion, distancia){
		this.ultima_fecha[id] = fecha;
		this.ultima_posicion[id] = posicion;
		this.isTracking[id] = true;
		
		this.fechas[id].push(fecha);
		this.latitudes[id].push(posicion.lat);
		this.longitudes[id].push(posicion.lng);
		this.distancias[id].push(distancia);
		
		this.loguear();
	}
	
	stopTracking() {
		this.backgroundGeolocation.finish();
		this.backgroundGeolocation.stop();
		this.watch.unsubscribe();
	}
}
