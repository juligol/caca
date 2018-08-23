import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';

@Injectable()
export class GlobalProvider {
	public loader: any;
	public link: string;
	public tzoffset;
	
	constructor(public loadingCtrl: LoadingController,
				public alertCtrl: AlertController,
				public http: Http) {
					
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		this.http = http;
		this.tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in 
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
		return new Date(Date.now() - this.tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
	
	getFecha(fecha){ 
		return new Date(fecha - this.tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
	
	calcularDistanciaEntre(lat1:number, lat2:number, long1:number, long2:number){
		let p = 0.017453292519943295;    // Math.PI / 180
		let c = Math.cos;
		let a = 0.5 - c((lat1-lat2) * p) / 2 + c(lat2 * p) *c((lat1) * p) * (1 - c(((long1- long2) * p))) / 2;
		let dis = (12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km
		return dis;
	}
	
	calcularTiempoEntre(fechaVieja, fechaNueva){
		var fechaInicio = new Date(fechaVieja).getTime();
		var fechaFin    = new Date(fechaNueva).getTime();
		var diff = fechaFin - fechaInicio;
		// (1000*60*60*24) --> milisegundos -> segundos -> minutos -> horas -> días
		return ( diff/(1000*60) ); // para devolver en minutos
	}
}
