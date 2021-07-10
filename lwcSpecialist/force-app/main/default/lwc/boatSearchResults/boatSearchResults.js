import {LightningElement,api,wire} from "lwc";
import {refreshApex} from "@salesforce/apex";
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import{publish,MessageContext} from "lightning/messageService";
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

import getBoats from '@salesforce/apex/BoatDataService.getBoats'
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList'
// ...
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
const COLS = [
  {label: 'Name', fieldName: 'Name', type: 'text', editable: true},
  {label: 'Length', fieldName: 'Length__c', type: 'number', editable: true},
  {label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true},
  {label: 'Description', fieldName: 'Description__c', type: 'text', editable: true},
];
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = COLS;
  @api boatTypeId = '';
  boats;
  isLoading = true;
  draftValues = [];
  // wired message context
  @wire(MessageContext)
  messageContext;

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api
  searchBoats(boatTypeId) {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
  }

  // wired getBoats method
  @wire(getBoats,{boatTypeId:'$boatTypeId'})
  wiredBoats(wiredResponse) {
    this.boats = wiredResponse;
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }

  // this public function must refresh the boats asynchronously
  // uses notifyLoading

  async refresh() {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(event.detail.boatId);
  }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    const message = {recordId:boatId};
    publish(this.messageContext,BOATMC,message);
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  async handleSave(event) {
    this.notifyLoading(true);
    console.log(`valores evento draft ${JSON.stringify(event.detail)}`);
    const updatedFields = event.detail.draftValues;

    // List if record Ids
    const notifyChangeIds = updatedFields.map(row => ({'recordId': row.Id}));

    await updateBoatList({data: updatedFields})
        .then(() => {
          getRecordNotifyChange(notifyChangeIds);
          this.refresh();
          this.showToastEvent(SUCCESS_TITLE,MESSAGE_SHIP_IT,SUCCESS_VARIANT);
        })
        .catch(error => {
          this.showToastEvent(ERROR_TITLE,error.body.message,ERROR_VARIANT);
        })
        .finally(() => {
          this.draftValues = [];
          this.notifyLoading(false);
        });
  }

  showToastEvent(title,message,variant){
    this.dispatchEvent(new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    }))
  }

  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if(isLoading){
      this.dispatchEvent(new CustomEvent('loading'));
    }else{
      this.dispatchEvent(new CustomEvent('doneloading'));
    }
  }
}
