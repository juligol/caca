import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { GlobalProvider } from "../../providers/global/global";
import { Home } from '../home/home';

@Component({
  selector: 'page-cerrar_viaje',
  templateUrl: 'cerrar_viaje.html'
})

export class CerrarViaje{
	private form : FormGroup;
	viajeActual: any;
	remises = [];

	constructor(private navCtrl: NavController,
				public navParams: NavParams,
				private formBuilder: FormBuilder,
				private storage: Storage,
				public global: GlobalProvider){
					
		this.viajeActual = navParams.get('viaje');
		this.remises = this.viajeActual.remises;
		//console.log(this.viajeActual);
		
		this.form = this.formBuilder.group({
			remis: [''],
			distancia: ['', Validators.compose([Validators.required, Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			espera: [''],
			peajes: ['', Validators.compose([Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			bonificacion: ['', Validators.compose([Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			estacionamiento: ['', Validators.compose([Validators.pattern("[+-]?([0-9]*[.])?[0-9]+")])],
			regreso: [''],
			voucher: [''],
			observaciones: ['']
		});
		
		this.form.get('espera').setValue("00:00");
		this.form.get('regreso').setValue("N");
		if(this.remises.some(remis => (remis.marca + " - " + remis.modelo + " - " + remis.dominio) === this.viajeActual.remis))
			this.form.get('remis').setValue(this.viajeActual.remis);	
	}
	
	cerrarViajeForm(){
		var self = this;
		self.global.loading();
		self.storage.get('user').then((user) => {
			self.form.value.action = "cerrarViaje";
			self.form.value.viaje = self.viajeActual;
			self.form.value.chofer_id = user.id;
			self.form.value.chofer_nombre = user.nombre;
			var myData = JSON.stringify(self.form.value);
			self.global.http.post(self.global.getLink(), myData).subscribe(data => {
				console.log(data["_body"]);
				self.navCtrl.setRoot(Home);
			}, 
			error => {
				self.global.showMessage('Error al cerrar el viaje', error);
			});
		});
	}
}
