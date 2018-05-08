import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { Home } from '../home/home';
import { Register } from '../register/register';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Http } from '@angular/http';
import { AlertController } from 'ionic-angular';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})

export class Login {
	private form : FormGroup;
	data:any = {};
	
	constructor(public loadingCtrl: LoadingController, 
				public navCtrl: NavController, 
				private formBuilder: FormBuilder,
				public menuCtrl: MenuController,
				public http: Http,
				public alertCtrl: AlertController){
					
		this.menuCtrl.enable(false);
					
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
		
		//this.data.response = '';
		this.http = http;
	}
	
	crearCuenta(){
		this.navCtrl.push(Register);
	}
	
	loginForm(){
		//Mostrar loader mientras busca los datos en la base
		let loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		loader.present();
		loader.dismiss().then(() => { this.usuario(); });
		/*this.usuario().then((x) => {
			if(x)
				loader.dismiss();
		});*/
	}
	
	usuario(){
		return new Promise((resolve) => {
			var link = 'http://mab.doublepoint.com.ar/config/ionic.php';
			this.form.value.action = "login";
			var myData = JSON.stringify(this.form.value);
			this.http.post(link, myData).subscribe(data => {
				//this.data.response = data["_body"];
				var usuario = JSON.parse(data["_body"]);
				if(usuario)
				{
					//this.navCtrl.push(Home);
					this.navCtrl.setRoot(Home);
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
			resolve(true);
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
