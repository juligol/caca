import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig/*, BackgroundGeolocationResponse*/ } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { GlobalProvider } from "../global/global";

/*
  Generated class for the LocationTrackerProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationTracker {
	
	public posiciones: string[];
	watch: any;
	public isTracking: Boolean;

	constructor(public zone: NgZone,
				public backgroundGeolocation: BackgroundGeolocation, 
				public geolocation: Geolocation,
				public global: GlobalProvider) {
		
		this.resetTracking();
		this.isTracking = false;
	}
	
	startTracking() {
		this.isTracking = true;
		
		// Background Tracking		
		const config: BackgroundGeolocationConfig = {
			desiredAccuracy: 0,
			stationaryRadius: 20,
			distanceFilter: 10,
			debug: true,
			interval: 2000
			//stopOnTerminate: false
		};
		
		this.backgroundGeolocation.configure(config).subscribe((location) => {
			this.posiciones.push('Back:  ' + location.latitude + ', ' + location.longitude);
			// Update inside of Angular's zone
			this.zone.run(() => {
				this.posiciones.push('Back:  ' + location.latitude + ', ' + location.longitude);
			});
		}, 
		(err) => {
			this.global.showError("Oooops! Error en background!");
		});
		// Turn ON the background-geolocation system.
		this.backgroundGeolocation.start();
		
		// Foreground Tracking
		let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};
		this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			this.zone.run(() => {
				this.posiciones.push('Front:  ' + position.coords.latitude + ', ' + position.coords.longitude);
			});
		});
	}
	
	stopTracking() {
		//this.backgroundGeolocation.stop();
		this.backgroundGeolocation.finish();
		this.watch.unsubscribe();
		this.isTracking = false;
	}
	
	resetTracking() {
		this.posiciones = [];
	}
}
