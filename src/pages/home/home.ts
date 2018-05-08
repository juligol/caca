import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class Home {

  map: any;

  constructor(public alertCtrl: AlertController, public menuCtrl: MenuController, private navCtrl: NavController, private geolocation: Geolocation){
	  this.menuCtrl.enable(true);
  }
  
  showConfirmAlert() {
    let confirm = this.alertCtrl.create({
      title: 'Bienvenido!!',
      message: 'Usted es carck?',
      buttons: [
        {
          text: 'No',
          handler: () => {
            console.log('No es crack');
          }
        },
        {
          text: 'Si',
          handler: () => {
            console.log('Es crack');
          }
        }
      ]
    });
    confirm.present();
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
