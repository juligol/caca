import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
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
			  public global: GlobalProvider,
			  public locationTracker: LocationTracker) {
    
  }
  
	cargarViajes(){
		this.storage.get('user').then((user) => {
			var myData = JSON.stringify({action: "viajes", chofer_id: user.id});
			this.global.http.post(this.global.link, myData).subscribe(data => {
				var viajes = JSON.parse(data["_body"]);
				//console.log(viajes);
				if(viajes.length > 0)
				{
					this.viajes = viajes;
					this.inicializarListado(this.viajes);
				}
				this.global.loader.dismiss();
			}, 
			error => {
				this.global.showError("Oooops! Por favor intente de nuevo!");
			});
		});
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
			var viaje = viajes[i];
			//Saco los viajes que quedaron colgado y no estan iniciados
			if(viaje.distancia_total_recorrida > 0 && this.locationTracker.viajes.includes(viaje.id)){
				this.locationTracker.eliminarDatosViaje(viaje.id);
			}
			//Meto al cron un viaje que quedo iniciado
			if(viaje.en_proceso == 1 && viaje.distancia_total_recorrida == 0 && !this.locationTracker.viajes.includes(viaje.id)){
				this.locationTracker.cargarAlCron(viaje);
			}
			this.items.push(viaje);
		}
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
	
	buscarItems(evento: any) {
		this.inicializarListado(this.viajes);
		// set val to the value of the searchbar
		this.busqueda = evento.target.value;
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
		setTimeout(() => {
			this.cargarViajes();
			refresher.complete();
		}, 2000);
	}
	
	preguntarRechazarViaje(event, item){
		this.global.loading();
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + item.id,
			message: 'Desea rechazar este viaje?',
			buttons: [
			{
				text: 'Cancelar',
				role: 'cancel',
				handler: () => {
					this.global.loader.dismiss();
				}
			},
			{
				text: 'Aceptar',
				handler: () => {
					this.rechazarViaje(event, item);
				}
			}
			]
		});
		alert.present();
	}
	
	rechazarViaje(event, item) {
		this.storage.get('user').then((user) => {
			var myData = JSON.stringify({action: "rechazarViaje", viaje_id: item.id, chofer_id: user.id, chofer: user.nombre, proveedor: user.proveedor});
			this.global.http.post(this.global.link, myData).subscribe(data => {
				this.cargarViajes();
			}, 
			error => {
				this.global.showError("Oooops! Por favor intente de nuevo!");
			});
		});
	}

}
