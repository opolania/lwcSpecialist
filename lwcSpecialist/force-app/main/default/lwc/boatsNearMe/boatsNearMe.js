// imports
import {api, LightningElement, wire} from "lwc";
import {getFieldValue} from "lightning/uiRecordApi";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation'
import LOCATION_LATITUDE_FIELD from '@salesforce/schema/Boat__c.Geolocation__Latitude__s'
import LOCATION_LONGITUDE_FIELD from '@salesforce/schema/Boat__c.Geolocation__Longitude__s'
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
  @api boatTypeId='';
  mapMarkers = [];
  isLoading = true;
  isRendered;
  latitude;
  longitude;

  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation,{latitude:'$latitude',longitude:'$longitude',boatTypeId:'$boatTypeId'})
  wiredBoatsJSON({error, data}) {
    if(data){
      this.createMapMarkers(JSON.parse(data));
    }else if (error){
      const eventContent = {
        title: ERROR_TITLE,
        variant: ERROR_VARIANT
      }
      const evt = new ShowToastEvent(eventContent);
      this.dispatchEvent(evt);
    }
    this.isLoading = false;
  }
  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() {
    if(!this.isRendered){
      this.getLocationFromBrowser();
      this.isRendered = true;
    }
  }

  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {

        // Get the Latitude and Longitude from Geolocation API
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    }
  }

  // Creates the map markers
  createMapMarkers(boatData) {
    // const newMarkers = boatData.map(boat => {...});
    // newMarkers.unshift({...});
    this.mapMarkers = boatData.map(boat => {
      const Latitude = boat.Geolocation__Latitude__s;
      // const const Latitude = getFieldValue(boat,this.LOCATION_LATITUDE_FIELD);
      // const Longitude = getFieldValue(boat,this.LOCATION_LONGITUDE_FIELD);
      const Longitude = boat.Geolocation__Longitude__s;
      return {
        location: { Latitude, Longitude },
        title: boat.Name
      };
    });
    this.mapMarkers.unshift({
        location : {
          Latitude: this.latitude,
          Longitude : this.longitude
        },
        title : LABEL_YOU_ARE_HERE,
        icon : ICON_STANDARD_USER
    })
    this.isLoading = false;
  }
}
