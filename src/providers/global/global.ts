import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Http } from '@angular/http';

@Injectable()
export class GlobalProvider {
	public intervalos = [];
	public loader: any;
	public link: string;
	constructor(public loadingCtrl: LoadingController,
				public http: Http) {
					
		this.link = 'http://mab.doublepoint.com.ar/config/ionic.php';
		this.http = http;
	}
	
	loading(){
		this.loader = this.loadingCtrl.create({
			content: "Por favor espere...",
		});
		this.loader.present();
	}
}
