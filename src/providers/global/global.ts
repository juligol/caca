import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';

@Injectable()
export class GlobalProvider {
	public loader: any;
	public link: string;
	public intervalos = [];
	public fecha_global: any;
	public rutas_global 		= [];
	public distancias_global	= [];
	public latitudes_global 	= [];
	public longitudes_global 	= [];
	public fechas_global 		= [];
	constructor(public loadingCtrl: LoadingController,
				public alertCtrl: AlertController,
				public http: Http) {
					
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		this.http = http;
	}
	
	loading(){
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
	}
	
	showError(texto) {
		if(this.loader)
			this.loader.dismiss();
		let alert = this.alertCtrl.create({
			title: 'Error',
			subTitle: texto,
			buttons: ['OK']
		});
		alert.present();
	}
	
	showSuccess(texto) {
		let alert = this.alertCtrl.create({
			title: 'Éxito',
			subTitle: texto,
			buttons: ['OK']
		});
		alert.present();
	}
}
