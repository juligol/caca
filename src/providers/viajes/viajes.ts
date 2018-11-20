import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { GlobalProvider } from "../global/global";
import { LocationTracker } from "../location-tracker/location-tracker";

@Injectable()
export class ViajesProvider {
	public viajes = [];
	public viajesAux = [];
	public busqueda: string = '';
	public items = [];
	public contador: any;

	constructor(private storage: Storage, 
			  public alertCtrl: AlertController,
			  private locationAccuracy: LocationAccuracy,
			  public global: GlobalProvider,
			  public locationTracker: LocationTracker) {
    
	}
  
	cargarViajes(){
		var self = this;
		self.storage.get('user').then((user) => {
			var myData = JSON.stringify({action: "viajes", chofer_id: user.id});
			self.global.http.post(self.global.getLink(), myData).subscribe(data => {
				var viajes = JSON.parse(data["_body"]);
				if(viajes.length > 0)
				{
					self.viajes = viajes;
					self.verificarViajesEIniciar(viajes);
				}
				self.global.stopLoading();
			}, 
			error => {
				self.global.showMessage('Error obteniendo los viajes', error);
			});
		});
	}
	
	verificarViajesEIniciar(viajes){
		this.verificarViajes(viajes);
		this.inicializarListado(viajes);
		this.verificarTracking();
	}

	verificarViajes(viajes){
		for (var i = 0; i < viajes.length; i++) {
			var viaje = viajes[i];
			//Saco del cron los viajes que quedaron colgados y no estan iniciados
			if(viaje.distancia_total_recorrida > 0 && this.locationTracker.viajes.includes(viaje.id)){
				console.log("Saco del cron: viaje " + viaje.id);
				this.locationTracker.eliminarDatosViaje(viaje.id);
			}
			//Meto al cron los viajes que estan iniciados
			if(viaje.en_proceso == 1 && viaje.distancia_total_recorrida == 0 && !this.locationTracker.viajes.includes(viaje.id)){
				console.log("Meto al cron: viaje " + viaje.id);
				this.locationTracker.cargarAlCron(viaje);
			}
		}
	}
	
	inicializarListado(viajes){
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

	verificarTracking(){
		if(!this.locationTracker.cronEncendido()){
			this.verificarGPS();
			//this.locationTracker.startTracking();
		}else{
			console.log('Back y front activos');
		}
	}
	
	verificarGPS(){
		var self = this;
		self.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				self.locationAccuracy.request(self.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => self.locationTracker.startTracking(),
					error => self.global.stopLoading()
				);
			}else{
				// the accuracy option will be ignored by iOS
				self.locationAccuracy.request(self.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => self.locationTracker.startTracking(),
					error => self.global.stopLoading()
				);
			}
		});
	}
	
	doInfinite(infiniteScroll) {
		var self = this;
		setTimeout(() => {
			var cantidadAdicional;
			var losQueQuedan = self.viajesAux.length - self.contador;
			if(losQueQuedan < 5){
				cantidadAdicional = losQueQuedan;
			}else{
				cantidadAdicional = 5;
			}
			for (let i = self.contador; i < self.contador + cantidadAdicional; i++) {
				self.items.push( self.viajesAux[i] );
			}
			self.contador += cantidadAdicional;
			infiniteScroll.complete();
		}, 500);
	}
	
	buscarItems(event: any) {
		this.inicializarListado(this.viajes);
		// set val to the value of the searchbar
		this.busqueda = event.target.value;
		// if the value is an empty string don't filter the items
		if (this.busqueda && this.busqueda.trim() != '') {
			this.viajesAux = this.viajes.filter((item) => {
				return this.busquedaPorID(item) || this.busquedaPorOrigen(item) || this.busquedaPorPasajero(item);
			});
			this.inicializarListado(this.viajesAux);
		}
	}
	
	busquedaPorID(item){
		return (item.id.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	busquedaPorOrigen(item){
		return (item.origen.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	busquedaPorPasajero(item){
		return  (item.pasajero1.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero2.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero3.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1) ||
				(item.pasajero4.trim().toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
	}
	
	actualizarListado(refresher) {
		var self = this;
		setTimeout(() => {
			self.cargarViajes();
			refresher.complete();
		}, 2000);
	}
	
	preguntarRechazarViaje(event, item){
		var self = this;
		self.global.loading();
		let alert = self.alertCtrl.create({
			title: 'Viaje ' + item.id,
			message: 'Desea rechazar este viaje?',
			buttons: [
			{
				text: 'Cancelar',
				role: 'cancel',
				handler: () => {self.global.stopLoading();}
			},
			{
				text: 'Aceptar',
				handler: () => {self.rechazarViaje(event, item);}
			}
			]
		});
		alert.present();
	}
	
	rechazarViaje(event, item) {
		var self = this;
		self.storage.get('user').then((user) => {
			var myData = JSON.stringify({action: "rechazarViaje", viaje_id: item.id, chofer_id: user.id, chofer: user.nombre, proveedor: user.proveedor});
			self.global.http.post(self.global.getLink(), myData).subscribe(data => {
				self.cargarViajes();
			}, 
			error => {
				self.global.showMessage('Error al rechazar el viaje', error);
			});
		});
	}

}
