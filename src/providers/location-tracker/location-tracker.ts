import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { GlobalProvider } from "../global/global";
import { Storage } from '@ionic/storage';

@Injectable()
export class LocationTracker {
	
	public encendido: Boolean = false;
	public watch: any;
	public latitud: any;
	public longitud: any;
	public tiempo: any;
	public config: BackgroundGeolocationConfig;
	public marker: any = null;
	
	public viajes			= [];
	public ultima_fecha		= [];
	public ultima_posicion 	= [];
	
	/*public fechas 			= [];
	public latitudes	 	= [];
	public longitudes 		= [];
	public distancias		= [];
	
	public isTracking: Array<Boolean> = [];*/

	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation, 
				public geolocation: Geolocation,
				private storage: Storage,
				public global: GlobalProvider) {
							
	}
	
	cronEncendido() {
		return this.encendido && this.watch;
	}
	
	startTracking() {
		this.backgroundTracking();
		this.foregroundTracking();
	}
	
	backgroundTracking(){
		this.storage.get('user').then((user) => {
			this.config = {
				desiredAccuracy: 0,
				stationaryRadius: 0,
				distanceFilter: 0,
				debug: false,
				stopOnTerminate: false,
				url: this.global.link + '?chofer_id=' + user.id,
				interval: 2000
			};
			// Background Tracking
			this.backgroundGeolocation.configure(this.config).subscribe((location: BackgroundGeolocationResponse) => {
				this.zone.run(() => {
					var posicionNueva = {lat: location.latitude, lng: location.longitude};
					var fechaNueva = this.global.getFecha(location.time);
					this.actualizarPosicion(user.id, fechaNueva, posicionNueva, "Back");
				});
				this.backgroundGeolocation.finish();
			}, 
			(error) => {
				this.global.mensaje("Error en background!", error);
			});
			// Turn ON the background-geolocation system.
			this.backgroundGeolocation.start();
		});
	}
	
	foregroundTracking(){
		// Foreground Tracking
		let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};
		this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			this.zone.run(() => {
				this.storage.get('user').then((user) => {
					var posicionNueva = {lat: position.coords.latitude, lng: position.coords.longitude};
					var fechaNueva = this.global.getFecha(position.timestamp);
					this.actualizarPosicion(user.id, fechaNueva, posicionNueva, "Front");
				},
				error => {
					this.global.mensaje("Error en WatchPosition!", error);
				});
			});
		});
	}
	
	inicializarArrays(id){
		this.viajes.push(id);
		this.inicializar(id);
		this.loguear();
	}
	
	inicializar(id){
		this.ultima_posicion[id] = null;
		this.ultima_fecha[id] = null;
	}
	
	cargarAlCron(viaje){
		//Las posiciones vienen desde la BD y agarro la ultima
		let ultimo = viaje.puntos_trayecto.length - 1;
		this.ultima_posicion[viaje.id] = {lat: viaje.puntos_trayecto[ultimo].latitud, lng: viaje.puntos_trayecto[ultimo].longitud};
		this.ultima_fecha[viaje.id] = viaje.puntos_trayecto[ultimo].tiempo;
		this.viajes.push(viaje.id);
		this.loguear();
	}
	
	actualizarPosicion(chofer_id, fechaNueva, posicionNueva, palabra){
		var myData = JSON.stringify({action: "actualizarPosicion", chofer_id: chofer_id, latitud: posicionNueva.lat, longitud: posicionNueva.lng, tiempo: fechaNueva, tipo: palabra});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			this.encendido = true;
			this.latitud = posicionNueva.lat;
			this.longitud = posicionNueva.lng;
			this.tiempo = fechaNueva;
			console.log(myData);
			if(this.marker != null)
				this.marker.setPosition({lat: this.latitud, lng: this.longitud});
			
			for (var i = 0; i < this.viajes.length; i++) {
				this.guardarPosicion(this.viajes[i], fechaNueva, posicionNueva);
			}
		},
		error => {
			this.global.mensaje("Error actualizando la posicion!", error);
		});
	}
	
	guardarPosicion(id, fechaNueva, posicionNueva){
		var posicionVieja = this.ultima_posicion[id];
		console.log(posicionVieja);
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
		this.eliminarViaje(id);
		this.inicializar(id);
		this.loguear();
		//this.global.mensaje("Viajes!", this.viajes.join(", "));
	}
	
	loguear(){
		console.log(this.viajes);
		console.log(this.ultima_posicion);
		console.log(this.ultima_fecha);
	}
	
	guardarEnArrays(id, fecha, posicion, distancia){
		var myData = JSON.stringify({action: "guardarDireccion", viaje_id: id, latitud: posicion.lat, longitud: posicion.lng, fecha: fecha, distancia: distancia});
		this.global.http.post(this.global.link, myData).subscribe(data => {
			this.ultima_fecha[id] = fecha;
			this.ultima_posicion[id] = posicion;
			this.loguear();
		},
		error => {
			this.global.mensaje("Error guardando la posicion del viaje!", error);
		});
	}
	
	stopTracking() {
		this.backgroundGeolocation.stop();
		this.watch.unsubscribe();
		this.encendido = false;
	}
}
