import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { GlobalProvider } from "../../providers/global/global";
import { Login } from '../login/login';
import { LocationTracker } from "../../providers/location-tracker/location-tracker";

@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html'
})

export class Logout {

	constructor(public navCtrl: NavController, 
				private storage: Storage,
				public global: GlobalProvider, 
				public locationTracker: LocationTracker){
		
		console.log('Cerrando sesión de: ' + this.global.user.nombre);
		if(this.locationTracker.isCronOn())
			this.locationTracker.stopTracking();
		this.global.user = null;
		this.storage.remove('user');
		this.navCtrl.setRoot(Login);
	}
}
