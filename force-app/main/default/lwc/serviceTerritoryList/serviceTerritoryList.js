import { LightningElement, wire, api} from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';
import getServiceTerritories from '@salesforce/apex/ServiceTerritoryController_c.getServiceTerritories';
export default class ItemListLWC extends LightningElement {
    serviceTerritories;
    @api outputTest;
    @api serviceTerritoryId;
    @wire(getServiceTerritories)
    wiredServiceTerritories({error, data}) {
        if (data) {
            this.serviceTerritories = data;
            return this.serviceTerritories;
        } else if (error) {
            console.error('Error fetching work type groups:', error);
        }
    }



    handleOnChange(event) {
        const selectedValue = event.target.value;
        const selectEvent = new CustomEvent('serviceTerritoryId', { detail: { selectedValue } });
        console.log('selectedValue: ' + selectedValue);
        // const flowNavigationEvent = new FlowNavigationNextEvent();
        // flowNavigationEvent.setParams({
        //     ServiceAppointment: {
        //         ServiceTerritoryId: selectedValue
        //     }
        // });
        // this.dispatchEvent(flowNavigationEvent);
        // this.template.querySelector('[data-id]').dataset.serviceTerritoryId = selectedId;
        this.dispatchEvent(selectEvent);
    }

    


}
