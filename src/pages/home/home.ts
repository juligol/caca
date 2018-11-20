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
		
		var self = this;
		self.menuCtrl.enable(true);
		
		self.storage.get('user').then((val) => {
			console.log('Hola ' + val.nombre);
		});
		
		self.viajesProvider.cargarViajes();
		
		self.myCallbackFunction = (parametros) => {
			return new Promise((resolve, reject) => {
				if(parametros.cargando)
					self.global.stopLoading();
				self.menuCtrl.enable(true);
				var viaje_id = parametros.viaje.id;
				self.viajesProvider.viajes = self.viajesProvider.viajes.map((item) => {
					if(item.id == viaje_id)
						return parametros.viaje;
					else
						return item;
				});
				self.viajesProvider.inicializarListado(self.viajesProvider.viajes);
				resolve();
			});
		}
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
		this.verificarGPS(item);
		//this.irAlViaje(item);
	}
	
	verificarGPS(item){
		var self = this;
		self.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				self.locationAccuracy.request(self.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => self.irAlViaje(item),
					error => self.global.stopLoading()
				);
			}else{
				// the accuracy option will be ignored by iOS
				self.locationAccuracy.request(self.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => self.irAlViaje(item),
					error => self.global.stopLoading()
				);
			}
		});
	}
	
	irAlViaje(item){
		var self = this;
		if(!self.locationTracker.cronEncendido()){
			self.locationTracker.startTracking();
		}else{
			console.log('Back y front activos');
		}
		self.navCtrl.push(Viaje, { item: item, callback: self.myCallbackFunction });
	}
}
