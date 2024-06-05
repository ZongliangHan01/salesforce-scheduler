import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendar';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import { NavigationMixin } from "lightning/navigation";
import FullCalendarCustom from '@salesforce/resourceUrl/FullCalendarCustom';
import getServiceAppointments from '@salesforce/apex/CustomCalendarController.getServiceAppointments';
import assignStaff from '@salesforce/apex/CustomCalendarController.assignStaff';
import changeTerritory from '@salesforce/apex/CustomCalendarController.changeTerritory';
import clearAssignStaff from '@salesforce/apex/CustomCalendarController.clearAssignStaff';
import AppointmentModal from 'c/appointmentModal';

export default class CustomCalendar extends NavigationMixin(LightningElement) {

    calendar;
    calendarTitle;
    eventsList = [];
    dataToRefresh;

 
    objectApiName = 'AppointmentWrapper';
    objectApiName2 = 'ServiceAppointment';

    // @track calendarLocations = ['0HhQE0000000Ipl0AE'];
    calendarLocations = ['0HhQE0000000Ipl0AE'];

    // Define a getter to dynamically generate the wire parameters
    // get wireParams() {
    //     return { locationIds: this.calendarLocations };
    // }

    locationOptions = [
        {
            label: "Melbourne",
            value: "Melbourne",
            locations: ['0HhQE0000000Ipl0AE'],

            checked: true
        },
        {
            label: "Sydney",
            value: "Sydney",
            locations: ['0HhQE0000000IrN0AU'],
            checked: false
        },
    ]

    viewOptions = [
        {
            label: 'Day',
            viewName: 'timeGridDay',
            checked: false
        },
        {
            label: 'Week',
            viewName: 'timeGridWeek',
            checked: true
        },
        {
            label: 'Month',
            viewName: 'dayGridMonth',
            checked: false
        },
        {
            label: 'Table',
            viewName: 'listView',
            checked: false
        }
    ];

    // get all service appointments from controller and assign to eventsList
    @wire(getServiceAppointments, { 
        locationIds: '$calendarLocations'
    })
    wiredMeetings(result) {
        if(result.data) {
            const eventList = [];
            for(let appointment of result.data) {
                const event = {
                    id: appointment.appointment.Id,
                    editable: true, 
                    allDay : false,
                    start: appointment.appointment.SchedStartTime,
                    end: appointment.appointment.SchedEndTime,
                    title: appointment.appointment.WorkType.Name,
                    additionalInfo: appointment.appointment.AdditionalInformation,
                    location: appointment.appointment.ServiceTerritory.Name,
                    locationId: appointment.appointment.ServiceTerritory.Id,
                    account: appointment.appointment.ParentRecord.Name,
                    email: appointment.appointment.Email,
                    phone: appointment.appointment.Phone,
                    serviceResources: appointment.assignedResources,
                    workTypeId: appointment.appointment.WorkTypeId,
                    appointmentType: appointment.appointment.AppointmentType,
                    appointmentNumber: appointment.appointment.AppointmentNumber
                }
                eventList.push(event);
            }
            this.eventsList = eventList;
            this.dataToRefresh = result;
        } else if(result.error){
            console.log(error);
        }
    }

    // refresh the calendar
    refreshHandler() {
        // make sure calendar stay on the same view and date after refresh
        const currentView = this.calendar.view.type;
        const currentDate = this.calendar.getDate();
        refreshApex(this.dataToRefresh)
        .then(() => {
            this.initializeCalendar(currentView, currentDate); 
        });
    }

    // change the location of the calendar
    changeLocationHandler(event) {
        const locationName = event.detail.value;
        const locationOptions = [...this.locationOptions];
        for(let locationOption of locationOptions) {
            locationOption.checked = false;
            // mark the selected location option as checked
            if(locationOption.label === locationName) {
                locationOption.checked = true;
                this.calendarLocations = locationOption.locations;
            }
        }
        this.locationOptions = locationOptions;
        this.refreshHandler();
        // this.locationIds = locationIds;
    }

    // change the view of the calendar
    changeViewHandler(event) {
        const viewName = event.detail.value;
        
        if(viewName != 'listView') {
            this.calendar.changeView(viewName);
            const viewOptions = [...this.viewOptions];
            for(let viewOption of viewOptions) {
                viewOption.checked = false;
                // mark the selected view option as checked
                if(viewOption.viewName === viewName) {
                    viewOption.checked = true;
                }
            }
            this.viewOptions = viewOptions;
            this.calendarTitle = this.calendar.view.title;
        } else {
            // list view go the service appointment tab
            this.handleListViewNavigation(this.objectApiName2);
        }
    }

    // navigate to the service appointment tab
    handleListViewNavigation(objectName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: objectName,
                actionName: 'list'
            },
            state: {
                filterName: 'Recent' 
            }
        });
    }

    // handle the calendar actions
    calendarActionsHandler(event) {
        const actionName = event.target.value;
        if(actionName === 'previous') {
            this.calendar.prev();
        } else if(actionName === 'next') {
            this.calendar.next();
        } else if(actionName === 'today') {
            this.calendar.today();
        } else if(actionName === 'new') {  // not implemented yet
            this.navigateToNewRecordPage(this.objectApiName);
        } else if(actionName === 'refresh') {
            this.refreshHandler();
        }
        this.calendarTitle = this.calendar.view.title;
    }

    // navigate to the new record page: not used yet?
    navigateToNewRecordPage(objectName) {
        this[NavigationMixin.Navigate]({
          type: "standard__objectPage",
          attributes: {
            objectApiName: objectName,
            actionName: "new",
          },
        });
    }

    // load the fullcalendar library and custom css
    connectedCallback() {
        Promise.all([
            loadStyle(this, FullCalendarJS + '/lib/main.css'),
            loadScript(this, FullCalendarJS + '/lib/main.js'),
            loadStyle(this, FullCalendarCustom)
        ])
        .then(() => {
            this.initializeCalendar('timeGridWeek', new Date());
        })
        .catch(error => console.log(error))
    }

    // initialize the calendar
    initializeCalendar(initialView, initialDate) { 

        const calendarEl = this.template.querySelector('div.fullcalendar');
        const copyOfOuterThis = this;
        
        // configure the FullCalendar
        const calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: false,
            initialDate: initialDate,   // the day to show the calendar 
            showNonCurrentDates: false,
            fixedWeekCount: false,
            allDaySlot: false,
            navLinks: false,   
            initialView: initialView,   // weekly view to be default
            slotMinTime: '09:00:00',
            slotMaxTime: '18:00:00',  
            events: copyOfOuterThis.eventsList,     // events to be displayed
            // eventColor: '#00c190', 
            // generate custom appointment view 
            eventContent: function(info) {
                if (info.view.type !== 'dayGridMonth') {    // keep default view in the month view

                    // get the appointment details
                    const id = info.event.id;
                    const startTime = info.event.start;
                    const endTime = info.event.end;
                    
                    const eventName = info.event.title; 
                    const eventAccount = info.event.extendedProps.account; 
                    const eventLocation = info.event.extendedProps.location; 
                    const eventLocationId = info.event.extendedProps.locationId;
                    const eventAdditionalInfo = info.event.extendedProps.additionalInfo? 
                                                info.event.extendedProps.additionalInfo.split(', ') : '';
                    const eventEmail = info.event.extendedProps.email;
                    const eventPhone = info.event.extendedProps.phone;
                    const eventServiceResources = info.event.extendedProps.serviceResources;
                    const facilitators = eventServiceResources.filter(resource => resource.ServiceResource.role__c === 'Facilitator');
                    const guestSpeakers = eventServiceResources.filter(resource => resource.ServiceResource.role__c === 'Guest Speaker');
                    return {
                        html: `<div class="fc-content data-id=${id}">
                                    <div class="fc-title">${startTime.getHours()}:${startTime.getMinutes()} - ${endTime.getHours()}:${endTime.getMinutes()}</div>
                                    <div class="fc-workTypeGroup">${eventName}</div>
                                    <div class="fc-account">${eventAccount}</div>
                                    <div class="fc-location" data-location-id = ${eventLocationId}> - ${eventLocation} - </div>
                                    ${Array.isArray(eventAdditionalInfo) ? eventAdditionalInfo.map(info => `<div class="fc-description">${info}</div>`).join(''): ''}
            
                                    ${Array.isArray(facilitators) ? facilitators.map(facilitator => `<div class="fc-assigned"> ${facilitator.ServiceResource.Name} (F)</div>`).join(''): ''}
                                    
                                    ${Array.isArray(guestSpeakers) ? guestSpeakers.map(guestSpeaker => `<div class="fc-assigned"> ${guestSpeaker.ServiceResource.Name} (GS)</div>`).join(''): ''}
                                    <div class="fc-description">Phone: ${eventPhone}</div>
                                    <div class="fc-description">Email: ${eventEmail}</div>
                                </div>`,
                    };
                }
                
            },

            eventDidMount: function(info) {
                // Get the service resources
                const serviceResources = info.event.extendedProps.serviceResources;
                
                const appointmentType = info.event.extendedProps.appointmentType;
                // Determine the background color based on serviceResources
                const backgroundColor =  appointmentType=="Online" ? '#7ab9f3' : serviceResources.length > 0 ? '#00c190' : '#ff6d6d'; // Green if serviceResources exist, red otherwise
                // Set the background color of the event
                info.el.style.backgroundColor = backgroundColor;
            },

            // assign staff to the appointment
            eventClick: function(event) {
                copyOfOuterThis.initialModal(event);
            }

        });

        calendar.render();
        calendar.setOption('contentHeight', 550);
        this.calendarTitle = calendar.view.title;
        this.calendar = calendar;
    }


    // initialize the modal
    initialModal(event) {
        const eventName = event.event.title; 
        const eventId = event.event.id;
        const startTime = event.event.start;
        const endTime = event.event.end;
        const eventAdditionalInfo = event.event.extendedProps.additionalInfo? 
                                    event.event.extendedProps.additionalInfo.split(', ') : '';
        const eventEmail = event.event.extendedProps.email;
        const eventPhone = event.event.extendedProps.phone;
        const eventAccount = event.event.extendedProps.account;
        const eventLocation = event.event.extendedProps.location;
        const eventLocationId = event.event.extendedProps.locationId;
        const eventWorkTypeId = event.event.extendedProps.workTypeId;
        const appointmentType = event.event.extendedProps.appointmentType;        
        const appointmentNumber = event.event.extendedProps.appointmentNumber;
        const eventAssignedStaff = event.event.extendedProps.serviceResources;
        AppointmentModal.open({
            size: 'small',
            eventId: eventId,
            title: eventName,
            location: eventLocation,
            locationId: eventLocationId,
            organization: eventAccount,
            startTime: startTime,
            endTime: endTime,
            appointmentDate: `${startTime.getDate()}/${startTime.getMonth()+1}/${startTime.getFullYear()}`,
            appointmentTime: `${startTime.getHours()}:${startTime.getMinutes()} - ${endTime.getHours()}:${endTime.getMinutes()}`,
            contactName: 'John Doe',
            contactPhone: eventPhone,
            contactEmail: eventEmail,
            additionalInfo: eventAdditionalInfo,
            // availableStaff: eventAvailableServiceResources,
            assignedStaff: eventAssignedStaff,
            randomString: Math.random(),
            workTypeId: eventWorkTypeId,
            appointmentType: appointmentType,
            appointmentNumber: appointmentNumber,
            onstaffAssigned: (e) => {
                e.stopPropagation();
                this.handleAssignStaff(e);
            },
            onlocationChanged: (e) => {
                e.stopPropagation();
                this.handleChangeLocation(e);
            },
        });
    }

    handleChangeLocation(event) {
        const {locationId, workTypeId, eventId} = event.detail;
        console.log('LocationId:', locationId);
        console.log('WorkTypeId:', workTypeId);
        console.log('EventId:', eventId);

        clearAssignStaff(
            {
                serviceAppointmentId: eventId
            }
        )
        .then(() => {
            changeTerritory({ 
                serviceAppointmentId: eventId, 
                serviceTerritoryId: locationId, 
                workTypeId: workTypeId 
            })
            .then(() => {
                // clearAssignStaff({ serviceAppointmentId: eventId, serviceResourceId: locationId})
                // .then(() => {
                    this.refreshHandler()
                    console.log('Change location result');
                // })
                
            })
            .catch(error => {
                console.error('Assignment error:', error);
                // Handle error response from Apex method
            });

        })

        
    }

    // assign staff to the appointment by calling the controller method
    //handleAssignStaff(staffId, locationId, eventId) {
    handleAssignStaff(event) {
        const { facilitatorId, guestSpeakerId, locationId, eventId } = event.detail;
        console.log('Assign facilitator:', facilitatorId);
        console.log('Assign guest speaker:', guestSpeakerId);
        console.log('LocationId:', locationId);
        console.log('EventId:', eventId);
        assignStaff({ 
            serviceAppointmentId: eventId, 
            facilitatorId: facilitatorId,
            guestSpeakerId: guestSpeakerId, 
            serviceTerritoryId: locationId 
        })
        .then(result => {
            console.log('Assignment result:', result);
            this.refreshHandler()
            // .then(() => {
            //     this.notifyAssignComplete();
            // });
        })
        .catch(error => {
            console.error('Assignment error:', error);
            // Handle error response from Apex method
        });
    }

}