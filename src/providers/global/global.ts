import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';

@Injectable()
export class GlobalProvider {
	public loader: any;
	public isLoading: Boolean = false;
	public user: any;
	public tzoffset;
	
	constructor(public loadingCtrl: LoadingController,
				public alertCtrl: AlertController,
				public http: Http) {
					
		this.http = http;
		this.tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in 
	}

	getLink(){
		return 'http://mab.doublepoint.com.ar/config/ionic.php';
	}
	
	loading(){
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
		this.isLoading = true;
	}
	
	stopLoading(){
		this.loader.dismiss();
		this.isLoading = false;
	}
	
	message(titulo, texto) {
		let alert = this.alertCtrl.create({
			title: titulo,
			subTitle: texto,
			buttons: ['OK']
		});
		alert.present();
	}
	
	showMessage(titulo, texto) {
		if(this.isLoading){
			this.stopLoading();
		}
		this.message(titulo, texto);
	}
	
	getToday(){
		return new Date(Date.now() - this.tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
	
	getDate(fecha){ 
		return new Date(fecha - this.tzoffset).toISOString().slice(0, -1).replace('T', ' ');
	}
	
	calculateDistance(lat1:number, lat2:number, long1:number, long2:number){
		let p = 0.017453292519943295;    // Math.PI / 180
		let c = Math.cos;
		let a = 0.5 - c((lat1-lat2) * p) / 2 + c(lat2 * p) *c((lat1) * p) * (1 - c(((long1- long2) * p))) / 2;
		let dis = (12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km
		return dis;
	}
	
	calculateTime(fechaVieja, fechaNueva){
		var fechaInicio = new Date(fechaVieja).getTime();
		var fechaFin    = new Date(fechaNueva).getTime();
		var diff = fechaFin - fechaInicio;
		// (1000*60*60*24) --> milisegundos -> segundos -> minutos -> horas -> días
		return (diff/(1000*60)); // para devolver en minutos
	}
}
