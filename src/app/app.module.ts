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

//------------------------------Pages----------------------------------------
import { HelloIonicPage } from '../pages/hello-ionic/hello-ionic';
import { DetalleViaje } from '../pages/detalle_viaje/detalle_viaje';
import { ListPage } from '../pages/list/list';
import { Home } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Register } from '../pages/register/register';
import { Logout } from '../pages/logout/logout';
import { Viaje } from '../pages/viaje/viaje';
import { GlobalProvider } from '../providers/global/global';

@NgModule({
  declarations: [
    MyApp,
    HelloIonicPage,
    ListPage,
	Home,
	Login,
	Register,
	Logout,
	Viaje,
    DetalleViaje
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
    HelloIonicPage,
    ListPage,
	Home,
	Login,
	Register,
	Logout,
	Viaje,
    DetalleViaje
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
