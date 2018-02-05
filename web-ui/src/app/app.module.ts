import { BrowserModule } 		from "@angular/platform-browser";
import { NgModule } 				from "@angular/core";
import { RouterModule, Routes, Router, NavigationEnd } 		from "@angular/router";
import {enableProdMode} from '@angular/core';

//enableProdMode();

import { AppComponent } from './app.component';

import { RobotmapComponent } from './components/robotmap/robotmap.component';

import { AdminComponent } from './pages/admin/admin.component';
import { MapComponent } from './pages/map/map.component';

export const routes: Routes = [
	{
		path: 'admin', component: AdminComponent
	},
	{
		path: 'map', component: MapComponent
	},
	{
		path: '', component: MapComponent
	},
	{
		path: '**', component: MapComponent
	}
];

@NgModule({
  declarations: [
    AppComponent,
    RobotmapComponent,
    AdminComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
		RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
