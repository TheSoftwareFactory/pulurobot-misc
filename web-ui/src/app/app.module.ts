import { BrowserModule } 		from "@angular/platform-browser";
import { NgModule } 				from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes, Router, NavigationEnd } 		from "@angular/router";
import {enableProdMode} from '@angular/core';

//enableProdMode();

import { AppComponent } from './app.component';

import { RobotmapComponent } from './components/robotmap/robotmap.component';

import { AdminComponent } from './pages/admin/admin.component';
import { MapComponent } from './pages/map/map.component';
import { ModesComponent } from './pages/modes/modes.component';

import { ControllerService }	from "./providers/controller/controller.service";
import { AuthService }					from "./providers/auth.service"


export const routes: Routes = [
	{
		path: 'admin', component: AdminComponent
	},
	{
		path: 'map', component: MapComponent
	},
	{
		path: 'modes', component: ModesComponent
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
    MapComponent,
    ModesComponent
  ],
  imports: [
    BrowserModule,
		RouterModule.forRoot(routes),
		FormsModule
  ],
  providers: [
		ControllerService,
		AuthService
	],
  bootstrap: [AppComponent]
})
export class AppModule {
}
