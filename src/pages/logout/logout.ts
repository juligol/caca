import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Login } from '../login/login';

@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html'
})

export class Logout {

	constructor(public navCtrl: NavController, private storage: Storage){
		this.storage.get('user').then((val) => {
			console.log('Cerrando sesión de: ' + val.nombre);
		});
		this.storage.remove('user');
		this.storage.get('user').then((val) => {
			this.navCtrl.setRoot(Login);
			console.log(val);
		});
	}
}
