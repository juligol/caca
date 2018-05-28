import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Viaje } from '../viaje/viaje';
import { CerrarViaje } from '../cerrar_viaje/cerrar_viaje';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class Home{
	viajes = [];
	viajesAux = [];
	busqueda: string = '';
	items = [];
	contador: any;
	selectOptions: any;
	loader: any;
	user: any;
	shownGroup = null;
	myCallbackFunction: any;

	constructor(public loadingCtrl: LoadingController, 
				public alertCtrl: AlertController, 
				public menuCtrl: MenuController, 
				private navCtrl: NavController, 
				public http: Http,
				public navParams: NavParams,
				private storage: Storage,
				private diagnostic: Diagnostic,
				private locationAccuracy: LocationAccuracy){
				
		this.menuCtrl.enable(true);
		
		this.storage.get('user').then((val) => {
			console.log('Hola ' + val.nombre);
		});
		  
		//Mostrar loader mientras busca los datos en la base
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
		this.cargarViajes();
		this.http = http;
		
		this.myCallbackFunction = (parametros) => {
			return new Promise((resolve, reject) => {
				this.menuCtrl.enable(true);
				var viaje_id = parametros.viaje.id;
				this.viajes = this.viajes.map((item) => {
					if(item.id == viaje_id)
						return parametros.viaje;
					else
						return item;
				});
				this.inicializarListado(this.viajes);
				resolve();
			});
		}
	}
		
	cargarViajes(){
		this.storage.get('user').then((user) => {
			var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
			var myData = JSON.stringify({action: "viajes", chofer_id: user.id});
			this.http.post(link, myData).subscribe(data => {
				var viajes = JSON.parse(data["_body"]);
				//console.log(viajes);
				if(viajes.length > 0)
				{
					this.viajes = viajes;
					this.inicializarListado(this.viajes);
				}
				this.loader.dismiss();
			}, 
			error => {
				console.log("Oooops!");
				this.loader.dismiss();
			});
		});
	}
	
	inicializarListado(viajes){
		this.viajesAux = viajes;
		if(viajes.length < 10){
			this.contador = viajes.length;
		}else{
			this.contador = 10;
		}
		this.items = [];
		for (var i = 0; i < this.contador; i++) {
			this.items.push(viajes[i]);
		}
	}
	
	doInfinite(infiniteScroll) {
		console.log('Sincronizando mas viajes');
		setTimeout(() => {
			var cantidadAdicional;
			var losQueQuedan = this.viajesAux.length - this.contador;
			if(losQueQuedan < 5){
				cantidadAdicional = losQueQuedan;
			}else{
				cantidadAdicional = 5;
			}
			for (let i = this.contador; i < this.contador + cantidadAdicional; i++) {
				this.items.push( this.viajesAux[i] );
			}
			this.contador += cantidadAdicional;
			console.log('Fin de la sincro');
			infiniteScroll.complete();
		}, 500);
	}
	
	buscarItems(ev: any) {
		this.inicializarListado(this.viajes);
		// set val to the value of the searchbar
		this.busqueda = ev.target.value;
		// if the value is an empty string don't filter the items
		if (this.busqueda && this.busqueda.trim() != '') {
			this.viajesAux = this.viajes.filter((item) => {
				return (item.origen.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
			});
			this.inicializarListado(this.viajesAux);
		}
	}
	
	actualizarListado(refresher) {
		console.log('Actualizando listado de viajes');
		setTimeout(() => {
			this.cargarViajes();
			refresher.complete();
		}, 2000);
	}
	
	verSubmenu(group) {
		if (this.isGroupShown(group)) {
			this.shownGroup = null;
		} else {
			this.shownGroup = group;
		}
	}
	
	isGroupShown(group) {
		return this.shownGroup === group;
	}
	
	cerrarViaje(event, item) {
		this.navCtrl.setRoot(CerrarViaje, {viaje: item});
	}
	
	verRecorrido(event, item) {
		//this.verificarGPS(event, item);
		this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
	}
	
	verificarGPS(event, item){
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.presentError("Error desde el request true")
				);
			}else{
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.presentError("Error desde el request false")
				);
			}
		});
	}
	
	irAlViaje(item){
		this.loader.dismiss();
		this.navCtrl.push(Viaje, { item: item, callback: this.myCallbackFunction });
	}
	
	presentError(mensaje) {
		this.loader.dismiss();
		console.log(mensaje);
		//this.navCtrl.setRoot(this);
		/*let alert = this.alertCtrl.create({
			title: 'GPS',
			subTitle: mensaje,
			buttons: ['Cerrar']
		});
		alert.present();*/
	}
}
