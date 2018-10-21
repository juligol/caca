import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { GlobalProvider } from "../../providers/global/global";
import { Home } from '../home/home';
import { Password } from '../password/password';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})

export class Login {
	private form : FormGroup;
	
	constructor(public navCtrl: NavController, 
				private formBuilder: FormBuilder,
				public menuCtrl: MenuController,
				private storage: Storage,
				public global: GlobalProvider){
					
		this.menuCtrl.enable(false);
					
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.required]
		});
	}
	
	loginForm(){
		var self = this;
		self.global.loading();
		self.form.value.action = "login";
		var myData = JSON.stringify(self.form.value);
		self.global.http.post(self.global.link, myData).subscribe(data => {
			var usuario = JSON.parse(data["_body"]);
			if(usuario)
			{
				self.storage.set('user', usuario).then(() => { self.navCtrl.setRoot(Home); });
			}
			else
			{
				self.global.showMessage("Error", "E-mail o contraseña incorrectos!!");
			}
		}, 
		error => {
			self.global.showMessage('Error en login', error);
		});
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
	
	olvidoPassword() {
		this.navCtrl.setRoot(Password);
	}
  
}
