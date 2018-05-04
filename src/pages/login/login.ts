import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Home } from '../home/home';
import {Validators, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})

export class Login {
	private form : FormGroup;
	
	constructor(public loadingCtrl: LoadingController, public navCtrl: NavController, private formBuilder: FormBuilder){
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
	}
	
	loginForm(){
		this.cargando();
		setTimeout(() => {this.navCtrl.push(Home);}, 1000);
	}
  
	cargando() {
		let loader = this.loadingCtrl.create({
			content: "Por favor espere...",
			duration: 1000
		});
		loader.present();
	}
  
}
