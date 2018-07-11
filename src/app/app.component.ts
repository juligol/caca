import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';
import { Home } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Logout } from '../pages/logout/logout';
import { GlobalProvider } from "../providers/global/global";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
	@ViewChild(Nav) nav: Nav;

	// make Login the root (or first) page
	rootPage = Login;
	pages: Array<{title: string, component: any}>;

	constructor(public platform: Platform,
				public menu: MenuController,
				public statusBar: StatusBar,
				public splashScreen: SplashScreen,
				public global: GlobalProvider) {
		
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
		});
	}

	openPage(page) {
		// close the menu when clicking a link from the menu
		this.menu.close();
		// Si voy a home abro el loading global
		if(page.title == 'Home')
			this.global.loading();
		// navigate to the new page if it is not the current page
		this.nav.setRoot(page.component);
	}
}
