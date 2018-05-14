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
	items = [];
	contador: any;
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
				this.contador = 15;
				for (var i = 0; i < this.contador; i++) {
					this.items.push(this.viajes[i]);
				}
				//console.log(this.items);
			}
			this.loader.dismiss();
		}, 
		error => {
			console.log("Oooops!");
			this.loader.dismiss();
		});
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
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
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
