import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { Http } from '@angular/http';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { Home } from '../home/home';

@Component({
  selector: 'page-cerrar_viaje',
  templateUrl: 'cerrar_viaje.html'
})

export class CerrarViaje{
	private form : FormGroup;
	viajeActual: any;
	link: any;

	constructor(public alertCtrl: AlertController, 
				public menuCtrl: MenuController, 
				private navCtrl: NavController,
				public navParams: NavParams,
				public http: Http,
				private formBuilder: FormBuilder,
				private storage: Storage){
					
		this.viajeActual = navParams.get('viaje');
		//console.log(this.viajeActual);
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		
		this.form = this.formBuilder.group({
			distancia: ['', Validators.compose([Validators.required, Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			espera: ['', Validators.required],
			peajes: ['', Validators.compose([Validators.required, Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			bonificacion: ['', Validators.compose([Validators.required, Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			estacionamiento: ['', Validators.compose([Validators.required, Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			regreso: ['', Validators.required],
			voucher: [''],
			observaciones: ['']
		});
		
		this.http = http;	
	}
	
	loginForm(){
		this.storage.get('user').then((user) => {
			this.form.value.action = "cerrarViaje";
			this.form.value.viaje = this.viajeActual;
			this.form.value.chofer = user.id;
			var myData = JSON.stringify(this.form.value);
			this.http.post(this.link, myData).subscribe(data => {
				console.log(data["_body"]);
				this.navCtrl.setRoot(Home);
			}, 
			error => {
				console.log("Oooops!");
				this.showError('Oooops! Por favor intente de nuevo!');
			});
		});
	}
	
	showError(texto) {
		let alert = this.alertCtrl.create({
		  title: 'Error',
		  subTitle: texto,
		  buttons: ['OK']
		});
		alert.present();
	}
}
