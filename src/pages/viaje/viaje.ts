import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';

declare var google;

@Component({
  selector: 'page-viaje',
  templateUrl: 'viaje.html'
})

export class Viaje {
  selectedItem: any;
  map: any;

  constructor(public navCtrl: NavController, 
			  public navParams: NavParams,
			  private geolocation: Geolocation) {
				  
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
  }
  
	ionViewDidLoad(){
		this.getPosition();
	}
  
	getPosition():any{
		this.geolocation.getCurrentPosition().then(response => {
			this.loadMap(response);
		}).catch(error =>{
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
