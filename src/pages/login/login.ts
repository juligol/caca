import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { Home } from '../home/home';
import { Register } from '../register/register';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Http } from '@angular/http';

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
				public http: Http){
					
		this.menuCtrl.enable(false);
					
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
		
		this.data.username = '';
		 this.data.response = '';
		 this.http = http;
	}
	
	submit() {
		 var link = 'http://nikola-breznjak.com/_testings/ionicPHP/api.php';
		 var myData = JSON.stringify({username: this.data.username});
		 
		 this.http.post(link, myData)
		 .subscribe(data => {
		 this.data.response = data["_body"]; //https://stackoverflow.com/questions/39574305/property-body-does-not-exist-on-type-response
		 }, error => {
		 console.log("Oooops!");
		 });
	 }
	
	crearCuenta(){
		this.navCtrl.push(Register);
	}
	
	loginForm(){
		//this.cargando();
		//setTimeout(() => {this.navCtrl.push(Home);}, 1000);
		//setTimeout(() => {this.navCtrl.setRoot(Home);}, 1000);
	}
  
	cargando() {
		let loader = this.loadingCtrl.create({
			content: "Por favor espere...",
			duration: 1000
		});
		loader.present();
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
