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
		this.global.loading();
		this.form.value.action = "password";
		var myData = JSON.stringify(this.form.value);
		this.global.http.post(this.global.getLink(), myData).subscribe(data => {
			var usuario = JSON.parse(data["_body"]);
			if(usuario)
			{
				this.global.showMessage("OK", "E-mail enviado correctamente!!");
				this.navCtrl.setRoot(Login);
			}
			else
			{
				this.global.showMessage("Error", "E-mail incorrecto!!");
			}
		}, 
		error => {
			this.global.showMessage("Error al enviar la password", error);
		});
	}
	
	goBack() {
		this.navCtrl.setRoot(Login);
	}
}
