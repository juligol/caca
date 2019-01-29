import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { GlobalProvider } from "../../providers/global/global";
import { Home } from '../home/home';

@Component({
  selector: 'page-cerrar_viaje',
  templateUrl: 'cerrar_viaje.html'
})

export class CerrarViaje{
	private form : FormGroup;
	viaje: any;
	remises = [];

	constructor(private navCtrl: NavController,
				public navParams: NavParams,
				private formBuilder: FormBuilder,
				public global: GlobalProvider){
					
		this.viaje = navParams.get('viaje');
		this.remises = this.viaje.remises;
		//console.log(this.viaje);
		
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
		if(this.remises.some(remis => (remis.marca + " - " + remis.modelo + " - " + remis.dominio) === this.viaje.remis))
			this.form.get('remis').setValue(this.viaje.remis);	
		
		if(this.global.isLoading){
			this.global.stopLoading();
		}
	}
	
	closeTripForm(){
		this.global.loading();
		this.form.value.action = "cerrarViaje";
		this.form.value.viaje = this.viaje;
		this.form.value.chofer_id = this.global.user.id;
		this.form.value.chofer_nombre = this.global.user.nombre;
		var myData = JSON.stringify(this.form.value);
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			console.log(data["_body"]);
			this.navCtrl.setRoot(Home);
		}, 
		error => {
			this.global.showMessage('Error al cerrar el viaje', error);
		});
	}
}
