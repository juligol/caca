import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class GlobalProvider {
	public loader: any;
	public link: string;
	public intervalos = [];
	public fecha: any;
	public markers		= [];
	public ultima_fecha	= [];
	public fechas 		= [];
	//public rutas 		= [];
	public posiciones 	= [];
	public latitudes 	= [];
	public longitudes 	= [];
	public distancias	= [];
	public primeraVez: Array<Boolean> = [];
	public subscriptions: Array<Subscription> = [];
	
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
	
	getFechaActual(){
		var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in 
		return new Date(Date.now() - tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
}
