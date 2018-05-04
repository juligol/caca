import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class Home {
  constructor(public alertCtrl: AlertController, public menuCtrl: MenuController, private navCtrl: NavController){
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

}
