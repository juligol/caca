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
	public posicionActual: any;
	public config: BackgroundGeolocationConfig;
	public marker: any = null;
	
	public viajes			= [];
	public ultima_fecha		= [];
	public ultima_posicion 	= [];

	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation, 
				public geolocation: Geolocation,
				private storage: Storage,
				public global: GlobalProvider) {
		
		this.config = {
			desiredAccuracy: 0,
			stationaryRadius: 0,
			distanceFilter: 0,
			debug: false,
			stopOnTerminate: false,
			//url: this.global.link + '?chofer_id=' + user.id,
			interval: 2000
		};
	}
	
	cronEncendido() {
		return this.encendido && this.watch;
	}
	
	startTracking() {
		this.backgroundTracking();
		this.foregroundTracking();
	}
	
	backgroundTracking(){
		var self = this;
		// Background Tracking
		self.backgroundGeolocation.configure(self.config).subscribe((location: BackgroundGeolocationResponse) => {
			self.zone.run(() => {
				self.storage.get('user').then((user) => {
					self.posicionActual = {lat: location.latitude, lng: location.longitude};
					var fechaNueva = self.global.getFecha(location.time);
					self.actualizarPosicion(user.id, fechaNueva, self.posicionActual, "Back");
				},
				error => {
					self.global.showMessage("Error en WatchPosition", error);
				});
			});
			self.backgroundGeolocation.finish();
		}, 
		(error) => {
			self.global.mensaje("Error en Background", error);
		});
		// Turn ON the background-geolocation system.
		self.backgroundGeolocation.start();
	}
	
	foregroundTracking(){
		var self = this;
		// Foreground Tracking
		let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};
		self.watch = self.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			self.zone.run(() => {
				self.storage.get('user').then((user) => {
					self.posicionActual = {lat: position.coords.latitude, lng: position.coords.longitude};
					var fechaNueva = self.global.getFecha(position.timestamp);
					self.actualizarPosicion(user.id, fechaNueva, self.posicionActual, "Front");
				},
				error => {
					self.global.showMessage("Error en WatchPosition", error);
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
	}
	
	loguear(){
		console.log(this.viajes);
		console.log(this.ultima_posicion);
		console.log(this.ultima_fecha);
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
		var self = this;
		var myData = JSON.stringify({action: "actualizarPosicion", chofer_id: chofer_id, latitud: posicionNueva.lat, longitud: posicionNueva.lng, tiempo: fechaNueva, tipo: palabra});
		self.global.http.post(self.global.link, myData).subscribe(data => {
			self.encendido = true;
			console.log(myData);
			if(self.marker != null)
			self.marker.setPosition({lat: posicionNueva.lat, lng: posicionNueva.lng});
			
			for (var i = 0; i < self.viajes.length; i++) {
				self.guardarPosicion(self.viajes[i], fechaNueva, posicionNueva);
			}
		},
		error => {
			self.global.showMessage("Error actualizando la posicion", error);
		});
	}
	
	guardarPosicion(id, fechaNueva, posicionNueva){
		var posicionVieja = this.ultima_posicion[id];
		//console.log(posicionVieja);
		if(posicionVieja){
			var distancia = this.global.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			var tiempo = this.global.calcularTiempoEntre(this.ultima_fecha[id], fechaNueva);
			if(distancia > 0 /*100 metros*/ && tiempo >= 2 /*2 minutos*/){
				this.guardarEnArrays(id, fechaNueva, posicionNueva, distancia);
			}
		}
	}
	
	guardarEnArrays(id, fecha, posicion, distancia){
		var self = this;
		self.ultima_fecha[id] = fecha;
		self.ultima_posicion[id] = posicion;
		var myData = JSON.stringify({action: "guardarDireccion", viaje_id: id, latitud: posicion.lat, longitud: posicion.lng, fecha: fecha, distancia: distancia});
		self.global.http.post(self.global.link, myData).subscribe(data => {
			self.ultima_fecha[id] = fecha;
			self.ultima_posicion[id] = posicion;
			self.loguear();
		},
		error => {
			self.global.showMessage("Error guardando la posicion del viaje", error);
		});
	}
	
	stopTracking() {
		this.backgroundGeolocation.stop();
		this.watch.unsubscribe();
		this.encendido = false;
	}
}
