/*import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { GlobalProvider } from "../global/global";

declare var google;

@Injectable()
export class LocationTracker {
 
	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation,
				public geolocation: Geolocation,
				public global: GlobalProvider) {
 
	}
 
	startTracking(id, map, currentMapTrack) {
		// Background Tracking
		const config: BackgroundGeolocationConfig = {
            desiredAccuracy: 0,
            stationaryRadius: 20,
            distanceFilter: 10,
            debug: true, //  enable this hear sounds for background-geolocation life-cycle.
            stopOnTerminate: false, // enable this to clear background location settings when the app terminates
		};
		
		this.backgroundGeolocation.configure(config).subscribe((position: BackgroundGeolocationResponse) => {
			this.zone.run(() => {
				this.verPosicion(id, position, currentMapTrack, map);
			});
		}, (err) => {
			this.global.showError(err);
		});
 
		// Turn ON the background-geolocation system.
		this.backgroundGeolocation.start();
		
		// Foreground Tracking
		/*let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};*/
		 
		/*this.global.subscriptions[id] = this.geolocation.watchPosition().filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			this.zone.run(() => {
				this.verPosicion(id, position, currentMapTrack, map);
			});
		});
	}
	
	verPosicion(id, position, currentMapTrack, map){
		let posicionNueva = {lat: position.coords.latitude, lng: position.coords.longitude};
		let fechaNueva = this.global.getFecha(position.timestamp);
		if(this.global.primeraVez[id]){
			this.guardarEnArrays(id, fechaNueva, posicionNueva, 0);
			this.global.primeraVez[id] = false;
		}else{
			let posicionVieja = this.global.posiciones[id];
			let distancia = this.calcularDistanciaEntre(posicionVieja.lat, posicionNueva.lat, posicionVieja.lng, posicionNueva.lng);
			let tiempo = this.calcularTiempoEntre(this.global.ultima_fecha[id], fechaNueva);
			if(distancia > 0 && tiempo >= 2){
				this.guardarEnArrays(id, fechaNueva, posicionNueva, distancia);
			}
		}
		this.global.rutas[id].push(posicionNueva);
		this.redrawPath(currentMapTrack, map, this.global.rutas[id]);
		this.global.markers[id].setPosition(posicionNueva);
	}
 
	inicializarArrays(id){
		this.global.fechas[id] = [];
		this.global.rutas[id] = [];
		this.global.posiciones[id] = null;
		this.global.ultima_fecha[id] = null;
		this.global.latitudes[id] = [];
		this.global.longitudes[id] = [];
		this.global.distancias[id] = [];
		this.global.primeraVez[id] = true;
	}
	
	guardarEnArrays(id, fecha, posicion, distancia){
		this.global.posiciones[id] = posicion;
		this.global.ultima_fecha[id] = fecha;
		this.global.fechas[id].push(fecha);
		this.global.latitudes[id].push(posicion.lat);
		this.global.longitudes[id].push(posicion.lng);
		this.global.distancias[id].push(distancia);
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
	
	redrawPath(currentMapTrack, map, path) {
		if (currentMapTrack) {
		  currentMapTrack.setMap(null);
		}
		if (path.length > 1) {
		  currentMapTrack = new google.maps.Polyline({
			path: path,
			geodesic: true,
			strokeColor: '#ff00ff',
			strokeOpacity: 1.0,
			strokeWeight: 3
		  });
		  currentMapTrack.setMap(map);
		}
	}
	
	stopTracking(id) {
		this.backgroundGeolocation.finish();
		this.global.subscriptions[id].unsubscribe();
	}
 
}*/
