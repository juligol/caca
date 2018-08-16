import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';

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

	constructor(public zone: NgZone, public backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation) {
		this.resetTracking();
		this.isTracking = false;
	}
	
	startTracking() {
		this.isTracking = true;
		// Background Tracking		
		const config: BackgroundGeolocationConfig = {
			desiredAccuracy: 0,
			stationaryRadius: 0,
			distanceFilter: 0,
			debug: true,
			stopOnTerminate: false
		};
		this.backgroundGeolocation.configure(config).subscribe((position: BackgroundGeolocationResponse) => {
			// Run update inside of Angular's zone
			this.zone.run(() => {
				this.posiciones.push('Back:  ' + position.coords.latitude + ', ' + position.coords.longitude);
			});
		}, 
		(err) => {
			console.log(err);
		});
		// Turn ON the background-geolocation system.
		this.backgroundGeolocation.start();
		
		// Foreground Tracking
		let options = {
			frequency: 3000,
			enableHighAccuracy: true
		};
		this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
			// Run update inside of Angular's zone
			this.zone.run(() => {
				this.posiciones.push('Front:  ' + position.coords.latitude + ', ' + position.coords.longitude);
			});
	 
		});
	}
	
	stopTracking() {
		this.backgroundGeolocation.finish();
		this.watch.unsubscribe();
		this.isTracking = false;
	}
	
	resetTracking() {
		this.posiciones = [];
	}
}
