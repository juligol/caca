import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { Http } from '@angular/http';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
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
				private formBuilder: FormBuilder){
					
		this.viajeActual = navParams.get('viaje');
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		
		this.form = this.formBuilder.group({
			distancia: ['', Validators.compose([Validators.required/*, Validators.float*/])],
			espera: ['', Validators.compose([Validators.required/*, Validators.time*/])],
			peajes: ['', Validators.compose([Validators.required/*, Validators.float*/])],
			bonificacion: ['', Validators.compose([Validators.required/*, Validators.float*/])],
			estacionamiento: ['', Validators.compose([Validators.required/*, Validators.float*/])],
			regreso: ['', Validators.required],
			voucher: ['', Validators.required],
			observaciones: ['', Validators.required]
		});
		
		this.http = http;
				
	}
	
	loginForm(){
		this.form.value.action = "cerrarViaje";
		var myData = JSON.stringify(this.form.value);
		this.http.post(this.link, myData).subscribe(data => {
			console.log(data["_body"]);
		}, 
		error => {
			console.log("Oooops!");
			this.showError('Oooops! Por favor intente de nuevo!');
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
