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

	constructor(public navCtrl: NavController, private storage: Storage, public locationTracker: LocationTracker){
		this.storage.get('user').then((val) => {
			console.log('Cerrando sesión de: ' + val.nombre);
		});
		if(this.locationTracker.watch)
			this.locationTracker.stopTracking();
		this.storage.remove('user');
		this.storage.get('user').then((val) => {
			this.navCtrl.setRoot(Login);
			console.log(val);
		});
	}
}
