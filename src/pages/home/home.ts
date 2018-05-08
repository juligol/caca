import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';
import { ItemDetailsPage } from '../item-details/item-details';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class Home {

	data:any = {};
	map: any;
	items: any;

	constructor(public loadingCtrl: LoadingController, 
				public alertCtrl: AlertController, 
				public menuCtrl: MenuController, 
				private navCtrl: NavController, 
				private geolocation: Geolocation,
				public http: Http,
				public navParams: NavParams){
				
		this.menuCtrl.enable(true);
		  
		//Mostrar loader mientras busca los datos en la base
		let loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		loader.present();
		loader.dismiss().then(() => { this.cargarViajes(); });

		this.data.response = '';
		this.http = http;		
	}
  
	cargarViajes(){
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		var myData = JSON.stringify({email: "a", password: "s", action: "viajes"});
		this.http.post(link, myData).subscribe(data => {
			var viajes = JSON.parse(data["_body"]);
			if(viajes.length > 0)
			{
				this.items = viajes;
				console.log(this.items);
				return viajes;
			}
			else
			{
				return "No hay viajes Disponibles";
			}
		}, 
		error => {
			console.log("Oooops!");
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
