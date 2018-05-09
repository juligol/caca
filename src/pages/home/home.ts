import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { ItemDetailsPage } from '../item-details/item-details';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class Home {
	map: any;
	items: any = [];
	loader: any;

	constructor(public loadingCtrl: LoadingController, 
				public alertCtrl: AlertController, 
				public menuCtrl: MenuController, 
				private navCtrl: NavController, 
				private geolocation: Geolocation,
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
		this.verificarGPS();
		
		this.http = http;		
	}
	
	verificarGPS(){
		this.locationAccuracy.canRequest().then((canRequest: boolean) => {
		if(canRequest) {
			// the accuracy option will be ignored by iOS
			this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
			  () => this.cargarViajes(),
			  error => this.verificarGPS()
			  //error => this.presentError("Necesita acivarlo para utilizar la app")
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
  
	cargarViajes(){
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var myData = JSON.stringify({email: "a", password: "s", action: "viajes"});
		this.http.post(link, myData).subscribe(data => {
			var viajes = JSON.parse(data["_body"]);
			if(viajes.length > 0)
			{
				this.items = viajes;
				//console.log(this.items);
			}
			this.loader.dismiss();
		}, 
		error => {
			console.log("Oooops!");
			this.loader.dismiss();
		});
	}
	
	verItem(event, item) {
		this.navCtrl.push(ItemDetailsPage, {
		  item: item
		});
	}
  
  ionViewDidLoad(){
    this.getPosition();
  }
  
  getPosition():any{
    this.geolocation.getCurrentPosition()
    .then(response => {
      this.loadMap(response);
    })
    .catch(error =>{
      console.log(error);
    })
  }
  
  loadMap(position: Geoposition){
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    console.log(latitude, longitude);
    
    // create a new map by passing HTMLElement
    let mapEle: HTMLElement = document.getElementById('map');

    // create LatLng object
    let myLatLng = {lat: latitude, lng: longitude};

    // create map
    this.map = new google.maps.Map(mapEle, {
      center: myLatLng,
      zoom: 12
    });

    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      let marker = new google.maps.Marker({
        position: myLatLng,
        map: this.map,
        title: 'Hello World!'
      });
      mapEle.classList.add('show-map');
    });
  }
 
}
