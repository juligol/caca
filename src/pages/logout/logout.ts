import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Login } from '../login/login';
import { LocationTracker } from "../../providers/location-tracker/location-tracker";

@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html'
})

export class Logout {

	constructor(public navCtrl: NavController, 
				private storage: Storage, 
				public locationTracker: LocationTracker){
					
		var self = this;
		self.storage.get('user').then((val) => {
			console.log('Cerrando sesión de: ' + val.nombre);
		});
		if(self.locationTracker.cronEncendido)
			self.locationTracker.stopTracking();
		self.storage.remove('user');
		self.storage.get('user').then((val) => {
			self.navCtrl.setRoot(Login);
			console.log(val);
		});
	}
}
