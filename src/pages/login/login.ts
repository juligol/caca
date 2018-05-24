import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Home } from '../home/home';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})

export class Login {
	private form : FormGroup;
	//data:any = {};
	
	constructor(public navCtrl: NavController, 
				private formBuilder: FormBuilder,
				public menuCtrl: MenuController,
				public http: Http,
				public alertCtrl: AlertController,
				private storage: Storage){
					
		this.menuCtrl.enable(false);
		
		this.storage.get('user').then((val) => {
			if(val)
				this.navCtrl.setRoot(Home);
		});
					
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
		
		//this.data.response = '';
		this.http = http;
	}
	
	loginForm(){
		var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		this.form.value.action = "login";
		var myData = JSON.stringify(this.form.value);
		this.http.post(link, myData).subscribe(data => {
			//this.data.response = data["_body"];
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
