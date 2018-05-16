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

export class Home {
	viajes = [];
	viajesAux = [];
	busqueda: string = '';
	items = [];
	contador: any;
	selectOptions: any;
	loader: any;

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
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var myData = JSON.stringify({email: "a", password: "s", action: "viajes"});
		this.http.post(link, myData).subscribe(data => {
			var viajes = JSON.parse(data["_body"]);
			if(viajes.length > 0)
			{
				this.viajes = viajes;
				this.inicializarListado();
				//console.log(this.items);
			}
			this.loader.dismiss();
		}, 
		error => {
			console.log("Oooops!");
			this.loader.dismiss();
		});
	}
	
	inicializarListado(){
		this.contador = 15;
		this.items = [];
		for (var i = 0; i < this.contador; i++) {
			this.items.push(this.viajes[i]);
		}
	}
	
	doInfinite(infiniteScroll) {
		console.log('Sincronizando mas viajes');
		setTimeout(() => {
			for (let i = this.contador; i < this.contador + 5; i++) {
				this.items.push( this.viajes[i] );
			}
			this.contador += 5;
			console.log('Fin de la sincro');
			infiniteScroll.complete();
		}, 500);
	}
	
	getItems(ev: any) {
		this.inicializarListado();
		// set val to the value of the searchbar
		this.busqueda = ev.target.value;
		// if the value is an empty string don't filter the items
		if (this.busqueda && this.busqueda.trim() != '') {
			this.items = this.items.filter((item) => {
				return (item.origen && item.origen.toLowerCase().indexOf(this.busqueda.toLowerCase()) > -1);
			})
		}
	}
	
	verViaje(event, item) {
		var origen = item.origen.split(",")[0];
		var destino = item.destino.split(",")[0];
		var lista = "<ul><li>" + origen + "</li><li>" + destino + "</li><li>" + item.proveedor + "</li></ul>"
		let alert = this.alertCtrl.create({
			title: 'Viaje ' + item.id,
			message: lista,
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
	
	comenzar(event, item) {
		//this.verificarGPS(event, item);
		this.navCtrl.push(Viaje, { item: item });
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
			this.loader.dismiss();
			if(canRequest) {
				// the accuracy option will be ignored by iOS
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => this.navCtrl.push(Viaje, { item: item }),
					error => console.log("Debe activar la ubicación")
				);
			}else{
				this.presentError("Error");
			}
		});
	}
	
	presentError(mensaje) {
		let alert = this.alertCtrl.create({
			title: 'GPS',
			subTitle: mensaje,
			buttons: ['Cerrar']
		});
		alert.present();
	}
}
