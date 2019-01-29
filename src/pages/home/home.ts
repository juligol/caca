import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
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
				public alertCtrl: AlertController,
				private locationAccuracy: LocationAccuracy,
				public global: GlobalProvider,
				public locationTracker: LocationTracker,
				public viajesProvider: ViajesProvider){
		
		this.menuCtrl.enable(true);
		console.log('Hola ' + this.global.user.nombre);
		this.viajesProvider.getTrips();
	}
	
	showSubmenu(group) {
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
	
	searchItems(evento: any) {
		this.viajesProvider.searchItems(evento);
	}
	
	updateList(refresher) {
		this.viajesProvider.updateList(refresher);
	}
	
	questionRefuseTrip(event, item){
		this.global.loading();
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + item.id,
			message: 'Desea rechazar este viaje?',
			buttons: [
			{
				text: 'Cancelar',
				role: 'cancel',
				handler: () => {this.global.stopLoading();}
			},
			{
				text: 'Aceptar',
				handler: () => {this.viajesProvider.refuseTrip(item);}
			}
			]
		});
		alert.present();
	}
	
	closeTrip(event, item) {
		this.navCtrl.setRoot(CerrarViaje, {viaje: item});
	}
	
	showTravel(event, item) {
		this.global.loading();
		this.verifyGPS(item);
		//this.openTrip(item);
	}
	
	verifyGPS(item){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.openTrip(item),
					error => this.global.stopLoading()
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.openTrip(item),
					error => this.global.stopLoading()
				);
			}
		});
	}
	
	openTrip(item){
		if(!this.locationTracker.isCronOn()){
			this.locationTracker.startTracking();
		}else{
			console.log('Back y Front activos');
		}
		//this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
		this.navCtrl.setRoot(Viaje, { item: item });
	}
}
