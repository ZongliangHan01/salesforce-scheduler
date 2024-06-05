import { LightningElement, wire } from 'lwc';
import getWorkTypeGroups from '@salesforce/apex/WorkTypeGroupController_c.getWorkTypeGroups';

export default class WorkTypeGroupsList extends LightningElement {
    workTypeGroups;
    @wire(getWorkTypeGroups)
    wiredWorkTypeGroups({error, data}) {
        if (data) {
            this.workTypeGroups = data.map(element => {
                return { label: element.Name, value: element.Id };
            });
        } else if (error) {
            console.error('Error fetching work type groups:', error);
        }
    }

    get options() {
        return this.workTypeGroups;
    }
}