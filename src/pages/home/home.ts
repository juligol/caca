import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { GlobalProvider } from "../../providers/global/global";
import { LocationTracker } from "../../providers/location-tracker/location-tracker";
import { ViajesProvider } from "../../providers/viajes/viajes";

import { Viaje } from '../viaje/viaje';
import { CerrarViaje } from '../cerrar_viaje/cerrar_viaje';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class Home{
	shownGroup = null;
	myCallbackFunction: any;

	constructor(public menuCtrl: MenuController, 
				private navCtrl: NavController,
				private storage: Storage,
				private locationAccuracy: LocationAccuracy,
				public global: GlobalProvider,
				public locationTracker: LocationTracker,
				public viajesProvider: ViajesProvider){
				
		this.menuCtrl.enable(true);
		
		this.storage.get('user').then((val) => {
			console.log('Hola ' + val.nombre);
		});
		
		this.viajesProvider.cargarViajes();
		this.encenderGPS();
		//this.locationTracker.startTracking();
		
		this.myCallbackFunction = (parametros) => {
			return new Promise((resolve, reject) => {
				if(parametros.cargando)
					this.global.loader.dismiss();
				this.menuCtrl.enable(true);
				var viaje_id = parametros.viaje.id;
				this.viajesProvider.viajes = this.viajesProvider.viajes.map((item) => {
					if(item.id == viaje_id)
						return parametros.viaje;
					else
						return item;
				});
				this.viajesProvider.inicializarListado(this.viajesProvider.viajes);
				resolve();
			});
		}
	}
	
	encenderGPS(){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.locationTracker.startTracking(),
					error => console.log("Error desde el request true")
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.locationTracker.startTracking(),
					error => console.log("Error desde el request false")
				);
			}
		});
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
	
	doInfinite(infiniteScroll) {
		this.viajesProvider.doInfinite(infiniteScroll);
	}
	
	buscarItems(evento: any) {
		this.viajesProvider.buscarItems(evento);
	}
	
	actualizarListado(refresher) {
		this.viajesProvider.actualizarListado(refresher);
	}
	
	preguntarRechazarViaje(event, item){
		this.viajesProvider.preguntarRechazarViaje(event, item);
	}
	
	cerrarViaje(event, item) {
		this.navCtrl.setRoot(CerrarViaje, {viaje: item});
	}
	
	verRecorrido(event, item) {
		this.global.loading();
		this.verificarGPS(event, item);
		//this.irAlViaje(item);
	}
	
	verificarGPS(event, item){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.global.loader.dismiss()
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.global.loader.dismiss()
				);
			}
		});
	}
	
	irAlViaje(item){
		this.locationTracker.startTracking();
		this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
	}
}
