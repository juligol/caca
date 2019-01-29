import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { GlobalProvider } from "../global/global";

@Injectable()
export class LocationTracker {
	
	public cronEncendido: Boolean = false;
	public watch: any;
	public posicionActual: any;
	public marker: any = null;
	
	public viajes			= [];
	public ultima_fecha		= [];
	public ultima_posicion 	= [];

	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation, 
				public geolocation: Geolocation,
				public global: GlobalProvider) {
	
	}
	
	isCronOn() {
		return this.cronEncendido && this.watch;
	}
	
	startTracking() {
		this.backgroundTracking();
		this.foregroundTracking();
	}
	
	backgroundTracking(){
		const config: BackgroundGeolocationConfig = {
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30,
            debug: false, //  enable this hear sounds for background-geolocation life-cycle.
			stopOnTerminate: false // enable this to clear background location settings when the app terminates
			//interval: 120000
    	};
		// Background Tracking
		this.backgroundGeolocation.configure(config).subscribe((location: BackgroundGeolocationResponse) => {
			//this.zone.run(() => {
				this.posicionActual = {lat: location.latitude, lng: location.longitude};
				var fechaNueva = this.global.getDate(location.time);
				this.updatePosition(this.global.user.id, fechaNueva, this.posicionActual, "Back");
			//});
			this.backgroundGeolocation.finish();
		}, 
		(error) => {
			this.global.message("Error en Background", error);
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
			//this.zone.run(() => {
				this.posicionActual = {lat: position.coords.latitude, lng: position.coords.longitude};
				var fechaNueva = this.global.getDate(position.timestamp);
				this.updatePosition(this.global.user.id, fechaNueva, this.posicionActual, "Front");
			//});
		});
	}
	
	initializeArrays(id){
		this.viajes.push(id);
		this.initialize(id);
		//this.log();
	}
	
	initialize(id){
		this.ultima_posicion[id] = null;
		this.ultima_fecha[id] = null;
	}
	
	deleteTrip(id){
		var index = this.viajes.indexOf(id);
		if (index > -1) {
		  this.viajes.splice(index, 1);
		}
	}
	
	deleteTripData(id){
		this.deleteTrip(id);
		this.initialize(id);
		this.log();
	}
	
	log(){
		console.log(this.viajes);
		console.log(this.ultima_posicion);
		console.log(this.ultima_fecha);
	}
	
	loadToCron(viaje){
		//Las posiciones vienen desde la BD y agarro la ultima
		let ultimo = viaje.puntos_trayecto.length - 1;
		this.ultima_posicion[viaje.id] = {lat: viaje.puntos_trayecto[ultimo].latitud, lng: viaje.puntos_trayecto[ultimo].longitud};
		this.ultima_fecha[viaje.id] = viaje.puntos_trayecto[ultimo].tiempo;
		this.viajes.push(viaje.id);
		//this.log();
	}
	
	updatePosition(chofer_id, fechaNueva, posicionNueva, palabra){
		var myData = JSON.stringify({action: "actualizarPosicion", chofer_id: chofer_id, latitud: posicionNueva.lat, longitud: posicionNueva.lng, tiempo: fechaNueva, tipo: palabra});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			this.cronEncendido = true;
			if(this.marker != null)
				this.marker.setPosition({lat: posicionNueva.lat, lng: posicionNueva.lng});
			
			for (var i = 0; i < this.viajes.length; i++) {
				this.savePosition(this.viajes[i], fechaNueva, posicionNueva);
			}
		},
		error => {
			this.global.showMessage("Error actualizando la posicion", error);
		});
	}
	
	savePosition(id, fechaNueva, posicionNueva){
		var posicionVieja = this.ultima_posicion[id];
		//console.log(posicionVieja);
		if(posicionVieja){
			var distancia = this.global.calculateDistance(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			var tiempo = this.global.calculateTime(this.ultima_fecha[id], fechaNueva);
			if(distancia > 0 /*100 metros*/ && tiempo >= 2 /*2 minutos*/){
				this.saveInArrays(id, fechaNueva, posicionNueva, distancia);
			}
		}
	}
	
	saveInArrays(id, fecha, posicion, distancia){
		this.ultima_fecha[id] = fecha;
		this.ultima_posicion[id] = posicion;
		var myData = JSON.stringify({action: "guardarDireccion", viaje_id: id, latitud: posicion.lat, longitud: posicion.lng, fecha: fecha, distancia: distancia});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			this.ultima_fecha[id] = fecha;
			this.ultima_posicion[id] = posicion;
			this.log();
		},
		error => {
			this.global.showMessage("Error guardando la posicion del viaje", error);
		});
	}
	
	stopTracking() {
		this.backgroundGeolocation.stop();
		this.watch.unsubscribe();
		this.cronEncendido = false;
	}
}
