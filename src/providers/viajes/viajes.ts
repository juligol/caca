import { Injectable } from '@angular/core';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { GlobalProvider } from "../global/global";
import { LocationTracker } from "../location-tracker/location-tracker";

@Injectable()
export class ViajesProvider {
	public viajes = [];
	public viajesAux = [];
	public busqueda: string = '';
	public items = [];
	public contador: number;

	constructor(private locationAccuracy: LocationAccuracy,
			  public global: GlobalProvider,
			  public locationTracker: LocationTracker) {
    
	}
  
	getTrips(){
		var myData = JSON.stringify({action: "viajes", chofer_id: this.global.user.id});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			var viajes = JSON.parse(data["_body"]);
			this.viajes = viajes;
			this.verifyTripsAndStart(viajes);
			this.global.stopLoading();
		}, 
		error => {
			this.global.showMessage('Error obteniendo los viajes', error);
		});
	}
	
	verifyTripsAndStart(viajes){
		this.verifyTrips(viajes);
		this.initializeList(viajes);
		this.verifyTracking();
	}

	verifyTrips(viajes){
		for (var i = 0; i < viajes.length; i++) {
			var viaje = viajes[i];
			//Saco del cron los viajes que quedaron colgados y no estan iniciados
			if(viaje.distancia_total_recorrida > 0 && this.locationTracker.viajes.includes(viaje.id)){
				this.locationTracker.deleteTripData(viaje.id);
			}
			//Meto al cron los viajes que estan iniciados
			if(viaje.en_proceso == 1 && viaje.distancia_total_recorrida == 0 && !this.locationTracker.viajes.includes(viaje.id)){
				this.locationTracker.loadToCron(viaje);
			}
		}
	}
	
	initializeList(viajes){
		this.viajesAux = viajes;
		if(viajes.length < 15){
			this.contador = viajes.length;
		}else{
			this.contador = 15;
		}
		this.items = [];
		for (var i = 0; i < this.contador; i++) {
			this.items.push(viajes[i]);
		}
	}

	verifyTracking(){
		if(!this.locationTracker.isCronOn()){
			this.verifyGPS();
			//this.locationTracker.startTracking();
		}else{
			console.log('Back y Front activos');
		}
	}
	
	verifyGPS(){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.locationTracker.startTracking(),
					error => this.global.stopLoading()
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.locationTracker.startTracking(),
					error => this.global.stopLoading()
				);
			}
		});
	}
	
	doInfinite(infiniteScroll) {
		setTimeout(() => {
			var cantidadAdicional;
			var losQueQuedan = this.viajesAux.length - this.contador;
			if(losQueQuedan < 5){
				cantidadAdicional = losQueQuedan;
			}else{
				cantidadAdicional = 5;
			}
			for (let i = this.contador; i < this.contador + cantidadAdicional; i++) {
				this.items.push( this.viajesAux[i] );
			}
			this.contador += cantidadAdicional;
			infiniteScroll.complete();
		}, 500);
	}
	
	searchItems(event: any) {
		this.initializeList(this.viajes);
		// set val to the value of the searchbar
		this.busqueda = event.target.value;
		// if the value is an empty string don't filter the items
		if (this.busqueda && this.busqueda.trim() != '') {
			this.viajesAux = this.viajes.filter((item) => {
				return this.searchByID(item) || this.searchByOrigen(item) || this.searchByPasajero(item);
			});
			this.initializeList(this.viajesAux);
		}
	}
	
	searchByID(item){
		return (item.id.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	searchByOrigen(item){
		return (item.origen.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	searchByPasajero(item){
		return  (item.pasajero1.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero2.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero3.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero4.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	updateList(refresher) {
		setTimeout(() => {
			this.getTrips();
			refresher.complete();
		}, 2000);
	}
	
	refuseTrip(item) {
		var myData = JSON.stringify({action: "rechazarViaje", viaje_id: item.id, chofer_id: this.global.user.id, chofer: this.global.user.nombre, proveedor: this.global.user.proveedor});
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			this.getTrips();
		}, 
		error => {
			this.global.showMessage('Error al rechazar el viaje', error);
		});
	}

}
