import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { GlobalProvider } from "../../providers/global/global";
import { Home } from '../home/home';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})

export class Login {
	private form : FormGroup;
	
	constructor(public navCtrl: NavController, 
				private formBuilder: FormBuilder,
				public menuCtrl: MenuController,
				public alertCtrl: AlertController,
				private storage: Storage,
				public global: GlobalProvider){
					
		this.menuCtrl.enable(false);
		
		this.storage.get('user').then((val) => {
			if(val){
				this.global.loading();
				this.navCtrl.setRoot(Home);
			}
		});
					
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
	}
	
	loginForm(){
		this.global.loading();
		this.form.value.action = "login";
		var myData = JSON.stringify(this.form.value);
		this.global.http.post(this.global.link, myData).subscribe(data => {
			var usuario = JSON.parse(data["_body"]);
			if(usuario)
			{
				this.storage.set('user', usuario).then(() => { this.navCtrl.setRoot(Home); });
			}
			else
			{
				this.showError("E-mail o contraseña incorrectos!!");
			}
		}, 
		error => {
			console.log("Oooops!");
			this.showError('Oooops! Por favor intente de nuevo!');
		});
	}
	
	showError(texto) {
		this.global.loader.dismiss();
		let alert = this.alertCtrl.create({
			title: 'Error',
			subTitle: texto,
			buttons: ['OK']
		});
		alert.present();
	}
	
	public type = 'password';
	public showPass = false;
	showPassword() {
		this.showPass = !this.showPass;
		if(this.showPass){
			this.type = 'text';
		} else {
			this.type = 'password';
		}
	}
  
}
