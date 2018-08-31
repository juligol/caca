import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';
import { Home } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Logout } from '../pages/logout/logout';
import { GlobalProvider } from "../providers/global/global";
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { Insomnia } from '@ionic-native/insomnia';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
	@ViewChild(Nav) nav: Nav;
	rootPage: any; //= Login;
	pages: Array<{title: string, component: any}>;

	constructor(public platform: Platform,
				public menu: MenuController,
				public statusBar: StatusBar,
				public splashScreen: SplashScreen,
				private storage: Storage,
				public global: GlobalProvider,
				public insomnia: Insomnia) {
		
		// Si tiene algo la sesion
		this.storage.get('user').then((val) => {
			if(val){
				this.global.loading();
				this.rootPage = Home;
			}else{
				this.rootPage = Login;
			}
		});
		
		this.initializeApp();
		// set our app's pages
		this.pages = [
		  { title: 'Home', component: Home },
		  { title: 'Cerrar sesión', component: Logout }
		];
	}

	initializeApp() {
		this.platform.ready().then(() => {
			// Okay, so the platform is ready and our plugins are available.
			// Here you can do any higher level native things you might need.
			this.statusBar.styleDefault();
			this.splashScreen.hide();
			// Para que no se bloquee 
			this.insomnia.keepAwake().then(
				() => console.log('KeepAwake success'),
				() => console.log('KeepAwake Error')
			);
		});
	}

	openPage(page) {
		// close the menu when clicking a link from the menu
		this.menu.close();
		// navigate to the new page if it is not the current page
		this.nav.setRoot(page.component);
	}
}
