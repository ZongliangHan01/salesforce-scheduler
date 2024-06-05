import { api, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import getAppointmentCandidates from '@salesforce/apex/CustomCalendarController.getAppointmentCandidates';
import getServiceTerritories from '@salesforce/apex/CustomCalendarController.getServiceTerritories';


export default class AppointmentModal extends LightningModal {
    
    changeStaffEvent;
    changeServiceTerritoryEvent;
    
    serviceTerritories = [];
    selectedLocation = '';
    showChangeLocation = false;

    @api eventId;
    @api title;
    @api assignedStaff;
    @api location;
    @api locationId;
    @api organization;
    @api appointmentDate;
    @api appointmentTime;
    @api contactName;
    @api contactPhone;
    @api contactEmail;
    @api additionalInfo;
    @api startTime;
    @api endTime;
    @api workTypeId;
    @api appointmentType;
    @api appointmentNumber;
    @api randomString;

    availableStaffs=[];
    availableFacilitators=[];
    availableGuestSpeakers=[];
    
    assignedFacilitatorId = null;
    assignedGuestSpeakerId = null;
    // dataToRefresh;


    @wire(getAppointmentCandidates, {
        startTime: '$startTime',
        endTime: '$endTime',
        workTypeId: '$workTypeId',
        territoryIds: '$locationId',
        assignedStaff: '$assignedStaff',  // this make sure the wiredAvailableStaffs will be called when assignedStaff is changed
        random: '$randomString' // this make sure the wiredAvailableStaffs will be called when randomString is changed
    })
    wiredAvailableStaffs(result) {
        if (result.data) {
            // Process available staff data
            const staffs = [];
            for (let staff of result.data) {
                const staffObj = {
                    id: staff.Id,
                    name: staff.Name,
                    role: staff.role__c,
                };
                staffs.push(staffObj);
                console.log(staffObj.role);
            }
            this.availableStaffs = staffs;
            this.availableFacilitators = staffs.filter(staff => staff.role === 'Facilitator');
            this.availableGuestSpeakers = staffs.filter(staff => staff.role === 'Guest Speaker');
            
            if (this.appointmentType=='Online' ) {
                this.showChangeLocation = true;
            }
            // this.dataToRefresh = result;
            
            this.assignedStaff.forEach(staff => {
                if (staff.ServiceResource.role__c === 'Facilitator') {
                    this.assignedFacilitatorId = staff.ServiceResource.Id;
                } else if (staff.ServiceResource.role__c === 'Guest Speaker') {
                    this.assignedGuestSpeakerId = staff.ServiceResource.Id;
                }
            });

        } else if (result.error) {
            console.error('Error fetching available staff:', error);
        }
    }


    handleOkay() {
        if (this.changeStaffEvent) {
            this.dispatchEvent(this.changeStaffEvent);
            this.changeStaffEvent = null;
        }
        if (this.changeServiceTerritoryEvent) {
            this.dispatchEvent(this.changeServiceTerritoryEvent);
            this.changeServiceTerritoryEvent = null;
        }
        this.close('okay');
    }

    handleChangeStaff(e) {
        const changeStaffDiv = this.template.querySelector('.changeStaff');
        if (changeStaffDiv) {
            changeStaffDiv.innerHTML = 'Change To: ' + e.currentTarget.dataset.staffName;
        }
        const event = new CustomEvent('staffassigned', {
            detail: {
                staffId: e.currentTarget.dataset.staffId,
                locationId: this.locationId,
                eventId: this.eventId
            }

        });
        this.changeStaffEvent = event;
    }

    handleChangeFacilitator(e) {
        console.log('Facilitator:', this.assignedFacilitatorId);
        this.assignedFacilitatorId = e.currentTarget.dataset.staffId;
        console.log('Facilitator:', this.assignedFacilitatorId);
        console.log('guestSpeaker:', this.assignedGuestSpeakerId);
        const changeStaffDiv = this.template.querySelector('.changeFacilitator');
        if (changeStaffDiv) {
            changeStaffDiv.innerHTML = 'Change Facilitator To: ' + e.currentTarget.dataset.staffName;
        }
        const event = new CustomEvent('staffassigned', {
            detail: {
                facilitatorId: this.assignedFacilitatorId,
                guestSpeakerId: this.assignedGuestSpeakerId,
                locationId: this.locationId,
                eventId: this.eventId
            }

        });
        this.changeStaffEvent = event;
    }

    handleChangeGuestSpeaker(e) {
        this.assignedGuestSpeakerId = e.currentTarget.dataset.staffId;
        const changeStaffDiv = this.template.querySelector('.changeGuestSpeaker');
        if (changeStaffDiv) {
            changeStaffDiv.innerHTML = 'Change Guest Speaker To: ' + e.currentTarget.dataset.staffName;
        }
        const event = new CustomEvent('staffassigned', {
            detail: {
                guestSpeakerId: this.assignedGuestSpeakerId,
                facilitatorId: this.assignedFacilitatorId,
                locationId: this.locationId,
                eventId: this.eventId
            }

        });
        this.changeStaffEvent = event;
    }


    @wire(getServiceTerritories)
    wiredServiceTerritories({ error, data }) {
        if (data) {
            const locations = [];
            for (let location of data) {
                const locationObj = {
                    label: location.Name,
                    value: location.Name,
                    locationId: location.Id
                };
                locations.push(locationObj);
            }
            this.serviceTerritories = locations;
            // console.log('Service Territories:', this.serviceTerritories);
        } else if (error) {
            console.error('Error fetching service territories:', error);
        }
    }

    handleLocationChange(e) {
        let locationId;
        this.selectedValue = e.target.value;
        for (let location of this.serviceTerritories) {
            if (location.value === this.selectedValue) {
                locationId = location.locationId;
                break;
            }
        }
        const event = new CustomEvent('locationchanged', {
            detail: {
                eventId: this.eventId,
                locationId: locationId,
                workTypeId: this.workTypeId,
                curLocationId: this.locationId
            }

        });
        this.changeServiceTerritoryEvent = event;
    }
}