import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { GlobalProvider } from "../../providers/global/global";
import { Viaje } from '../viaje/viaje';
import { CerrarViaje } from '../cerrar_viaje/cerrar_viaje';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class Home{
	viajes = [];
	viajesAux = [];
	busqueda: string = '';
	items = [];
	contador: any;
	shownGroup = null;
	myCallbackFunction: any;

	constructor(public menuCtrl: MenuController, 
				private navCtrl: NavController,
				private storage: Storage,
				private diagnostic: Diagnostic,
				private locationAccuracy: LocationAccuracy,
				public global: GlobalProvider){
				
		this.menuCtrl.enable(true);
		
		this.storage.get('user').then((val) => {
			console.log('Hola ' + val.nombre);
		});
		
		this.cargarViajes();
		
		this.myCallbackFunction = (parametros) => {
			return new Promise((resolve, reject) => {
				if(parametros.cargando)
					this.global.loader.dismiss();
				this.menuCtrl.enable(true);
				var viaje_id = parametros.viaje.id;
				this.viajes = this.viajes.map((item) => {
					if(item.id == viaje_id)
						return parametros.viaje;
					else
						return item;
				});
				this.inicializarListado(this.viajes);
				resolve();
			});
		}
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
				console.log("Oooops!");
				this.global.loader.dismiss();
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
			this.items.push(viajes[i]);
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
	
	buscarItems(ev: any) {
		this.inicializarListado(this.viajes);
		// set val to the value of the searchbar
		this.busqueda = ev.target.value;
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
	
	verSubmenu(group) {
		if (this.isGroupShown(group)) {
			this.shownGroup = null;
		} else {
			this.shownGroup = group;
		}
	}
	
	isGroupShown(group) {
		return this.shownGroup === group;
	}
	
	cerrarViaje(event, item) {
		this.navCtrl.setRoot(CerrarViaje, {viaje: item});
	}
	
	verRecorrido(event, item) {
		this.global.loading();
		//this.verificarGPS(event, item);
		this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
	}
	
	verificarGPS(event, item){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.presentError("Error desde el request true")
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.presentError("Error desde el request false")
				);
			}
		});
	}
	
	irAlViaje(item){
		this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
	}
	
	presentError(mensaje) {
		this.global.loader.dismiss();
		console.log(mensaje);
	}
}
