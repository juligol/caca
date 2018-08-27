import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Insomnia } from '@ionic-native/insomnia';

//------------------------------Providers----------------------------------------
import { LocationTracker } from '../providers/location-tracker/location-tracker';
import { GlobalProvider } from '../providers/global/global';
import { ViajesProvider } from '../providers/viajes/viajes';

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
    {provide: ErrorHandler, useClass: IonicErrorHandler},
	LocationAccuracy,
	BackgroundGeolocation,
	Geolocation,
	BackgroundMode,
	Insomnia,
    GlobalProvider,
    LocationTracker,
    ViajesProvider,
  ]
})

export class AppModule {}
