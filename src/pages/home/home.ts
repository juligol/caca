import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { DetalleViaje } from '../detalle_viaje/detalle_viaje';
import { Viaje } from '../viaje/viaje';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

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
		
		this.selectOptions = {
		  title: 'Viaje'
		};
		
		this.http = http;
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
					this.viajesAux = viajes;
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
	
	getItems(ev: any) {
		this.inicializarListado(this.viajesAux);
		// set val to the value of the searchbar
		this.busqueda = ev.target.value;
		// if the value is an empty string don't filter the items
		if (this.busqueda && this.busqueda.trim() != '') {
			this.viajesAux = this.viajes.filter((item) => {
				return (item.origen.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
			});
			this.inicializarListado(this.viajesAux);
		}else{
			this.inicializarListado(this.viajes);
		}
	}
	
	verViaje(event, item) {
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + item.id,
			message: this.lista(item),
			buttons: [
			  {
				text: 'Cancel',
				role: 'cancel',
				handler: () => {console.log('Cancel clicked');}
			  },
			  {
				text: 'Comenzar',
				handler: () => {this.comenzar(event, item);}
			  }
			],
			cssClass: 'verViajeCss'
		});
		alert.present();
	}
	
	lista(item){
		var origen = item.origen.split(",")[0];
		var destino = item.destino.split(",")[0];
		var pasajeros = "";
		if(item.pasajero2.trim() != ""){
			pasajeros += "<li>Pasajero 2: <b>" + item.pasajero2.trim() + "</b></li>" +
						 "<li>Centro de costo 2: <b>" + item.cc2.descripcion + "</b></li>";
		}
		if(item.pasajero3.trim() != ""){
			pasajeros += "<li>Pasajero 3: <b>" + item.pasajero3.trim() + "</b></li>" +
						 "<li>Centro de costo 3: <b>" + item.cc3.descripcion + "</b></li>";
		}
		if(item.pasajero4.trim() != ""){
			pasajeros += "<li>Pasajero 4: <b>" + item.pasajero4.trim() + "</b></li>" +
						 "<li>Centro de costo 4: <b>" + item.cc4.descripcion + "</b></li>";
		}
		var lista = "<ul>" +
						"<li>Pedido por: <b>" + item.responsable.nombre + "</b></li>" +
						"<li>Empresa: <b>" + item.empresa.nombre + "</b></li>" +
						"<li>Proveedor: <b>" + item.proveedor + "</b></li>" +
						"<li>Fecha: <b>" + item.fecha + "</b></li>" +
						"<li>Hora: <b>" + item.hora + "</b></li>" +
						"<li>Desde: <b>" + origen + "</b></li>" +
						"<li>Hasta: <b>" + destino + "</b></li>" +
						"<li>Pasajero 1: <b>" + item.pasajero1.trim() + "</b></li>" +
						"<li>Centro de costo 1: <b>" + item.cc1.descripcion + "</b></li>" +
						pasajeros +
						"<li>Observaciones: <b>" + item.observaciones + "</b></li>" +
					"</ul>";
		return lista;
	}
	
	comenzar(event, item) {
		this.verificarGPS(event, item);
		//this.navCtrl.push(Viaje, { item: item });
	}
	
	verItem(event, item) {
		this.navCtrl.push(DetalleViaje, {
		  item: item
		});
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
					error => this.presentError("request true")
				);
			}else{
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.irAlViaje(item),
					error => this.presentError("request false")
				);
			}
		});
	}
	
	irAlViaje(item){
		this.loader.dismiss();
		this.navCtrl.push(Viaje, { item: item });
	}
	
	presentError(mensaje) {
		this.loader.dismiss();
		let alert = this.alertCtrl.create({
			title: 'GPS',
			subTitle: mensaje,
			buttons: ['Cerrar']
		});
		alert.present();
	}
}
