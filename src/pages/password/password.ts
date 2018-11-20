import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { GlobalProvider } from "../../providers/global/global";
import { Login } from '../login/login';

@Component({
  selector: 'page-password',
  templateUrl: 'password.html'
})

export class Password{
	private form : FormGroup;

	constructor(private navCtrl: NavController,
				private formBuilder: FormBuilder,
				public global: GlobalProvider){
		
		this.form = this.formBuilder.group({
			email: ['', Validators.compose([Validators.required, Validators.email])]
		});	
	}
	
	passwordForm(){
		var self = this;
		self.global.loading();
		self.form.value.action = "password";
		var myData = JSON.stringify(self.form.value);
		self.global.http.post(self.global.getLink(), myData).subscribe(data => {
			var usuario = JSON.parse(data["_body"]);
			if(usuario)
			{
				self.global.showMessage("OK", "E-mail enviado correctamente!!");
				self.navCtrl.setRoot(Login);
			}
			else
			{
				self.global.showMessage("Error", "E-mail incorrecto!!");
			}
		}, 
		error => {
			self.global.showMessage("Error al enviar la password", error);
		});
	}
	
	volver() {
		this.navCtrl.setRoot(Login);
	}
}
