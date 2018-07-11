import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { GlobalProvider } from '../providers/global/global';

//------------------------------Pages----------------------------------------
import { Login } from '../pages/login/login';
import { Logout } from '../pages/logout/logout';
import { Home } from '../pages/home/home';
import { Viaje } from '../pages/viaje/viaje';
import { CerrarViaje } from '../pages/cerrar_viaje/cerrar_viaje';
import { Password } from '../pages/password/password';

@NgModule({
  declarations: [
    MyApp,
	Login,
	Logout,
	Home,
	Viaje,
	CerrarViaje,
	Password
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
	HttpModule,
	IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
	Login,
	Logout,
	Home,
	Viaje,
	CerrarViaje,
	Password
  ],
  providers: [
    StatusBar,
    SplashScreen,
	Geolocation,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
	Diagnostic,
	LocationAccuracy,
    GlobalProvider
  ]
})

export class AppModule {}
