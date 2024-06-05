public with sharing class CustomCalendarController {

    // Wrapper class to hold the ServiceAppointment and AssignedResource objects
    // get the service appointments from the database
    @AuraEnabled(cacheable=true)
    public static List<AppointmentWrapper> getServiceAppointments(List<String> locationIds) {
        List<ServiceAppointment> appointments = [ 
                            SELECT SchedEndTime, 
                                   SchedStartTime,
                                   Id, 
                                   Duration, 
                                   ServiceTerritory.Name, 
                                   ServiceTerritory.Id,
                                   ParentRecord.Name,
                                   AppointmentType,
                                   AdditionalInformation,
                                   Email,
                                   Phone,
                                   WorkType.Name,
                                   WorkTypeId,
                                   AppointmentNumber
                            FROM ServiceAppointment
                            WHERE ServiceTerritory.Id IN :locationIds
                            LIMIT 500 
                            ];
        List<AppointmentWrapper> wrappedAppointments = new List<AppointmentWrapper>();

        for (ServiceAppointment appointment : appointments) {
            List<AssignedResource> assignedResources = getAssignedResources(appointment);
            AppointmentWrapper wrapper = new AppointmentWrapper();
            wrapper.appointment = appointment;
            wrapper.assignedResources = assignedResources;
            wrappedAppointments.add(wrapper);
        }
        // for (AppointmentWrapper appointment : wrappedAppointments) {
        //     // Access and use the value of the custom field
        //     System.debug(appointment.assignedResources);
        // }
        return wrappedAppointments;
                
    }

    // get the assigned resources for the service appointment
    static private List<AssignedResource> getAssignedResources(ServiceAppointment appointment) {
        List<AssignedResource> assignedResources = [ 
                            SELECT 
                                   ID,
                                   ServiceResource.Name,
                                   ServiceResource.role__c,
                                   ServiceAppointment.ServiceTerritoryID
                            FROM AssignedResource
                            WHERE ServiceAppointmentId = :appointment.Id and ServiceResource.Id != '0HnQE0000000KMv0AM'
                            LIMIT 500 
                            ];
        return assignedResources;
                
    }

    // assign the staff to the service appointment
    @AuraEnabled(cacheable=false)
    public static Map<String, Object> assignStaff(String serviceAppointmentId, String facilitatorId, String guestSpeakerId, String serviceTerritoryId) {
        Map<String, Object> requestBody = new Map<String, Object>{
            'serviceAppointmentId'=>serviceAppointmentId,
            'serviceAppointment'=> new Map<String, Object>{
                'serviceTerritoryId'=>serviceTerritoryId,
                'extendedFields'=> new List<Map<String, Object>>{
                    new Map<String, Object>{
                        'name'=>'status',
                        'value'=>'Scheduled'
                    }
                }
            
            },
            // 'assignedResources'=> new List<Map<String, Object>>{
            //     new Map<String, Object>{
            //         'serviceResourceId'=>facilitatorId,
            //         'isRequiredResource'=>'true',
            //         'isPrimaryResource'=> 'true'
            //     },
            //     new Map<String, Object>{
            //         'serviceResourceId'=>guestSpeakerId,
            //         'isRequiredResource'=>'true',
            //         'isPrimaryResource'=> 'false'
            //     },
            //     new Map<String, Object>{
            //         'serviceResourceId'=>'0HnQE0000000KMv0AM', // this is for booking agent, otherwise it will effect the time slot
            //         'isRequiredResource'=>'true',
            //         'isPrimaryResource'=> 'false'
            //     }
            // }
            'assignedResources'=> new List<Map<String, Object>>()
        };

        // Add facilitator resource if facilitatorId is not null
        if (facilitatorId != null) {
            ((List<Map<String, Object>>)requestBody.get('assignedResources')).add(new Map<String, Object>{
                'serviceResourceId'=>facilitatorId,
                'isRequiredResource'=>'true',
                'isPrimaryResource'=> 'false'
            });
        }

        // Add guest speaker resource if guestSpeakerId is not null
        if (guestSpeakerId != null) {
            ((List<Map<String, Object>>)requestBody.get('assignedResources')).add(new Map<String, Object>{
                'serviceResourceId'=>guestSpeakerId,
                'isRequiredResource'=>'true',
                'isPrimaryResource'=> 'false'
            });
        }

        // Add booking agent resource
        ((List<Map<String, Object>>)requestBody.get('assignedResources')).add(new Map<String, Object>{
            'serviceResourceId'=>'0HnQE0000000KMv0AM', // Booking agent ID
            'isRequiredResource'=>'true',
            'isPrimaryResource'=> 'true'
        });

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:MyNameCred/services/data/v60.0/connect/scheduling/service-appointments');
        req.setMethod('PATCH');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('cache-control', 'no-cache'); // ensure the api is not cached by the browser
        req.setHeader('pragma', 'no-cache'); // ensure the api is not cached by the browser
        req.setBody(JSON.serialize(requestBody));

        Http http = new Http();
        HttpResponse res = http.send(req);
        Map<String, Object> response = new Map<String, Object>();
        if (res.getStatusCode() == 200) {
            response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } else {
            response.put('error', res.getBody());
        }
        
        return response;
    }


     // clear assign the staff to the service appointment
     @AuraEnabled(cacheable=false)
     public static Map<String, Object> clearAssignStaff(String serviceAppointmentId) {
         Map<String, Object> requestBody = new Map<String, Object>{
             'serviceAppointmentId'=>serviceAppointmentId,
             'serviceAppointment'=> new Map<String, Object>{
                 'extendedFields'=> new List<Map<String, Object>>{
                     new Map<String, Object>{
                         'name'=>'status',
                         'value'=>'None'
                     }
                 }
             
             },
             'assignedResources'=> new List<Map<String, Object>>{
                 
                 new Map<String, Object>{
                     'serviceResourceId'=>'0HnQE0000000KMv0AM', // this is for booking agent, otherwise it will effect the time slot
                     'isRequiredResource'=>'true',
                     'isPrimaryResource'=> 'true'
                 }
             }
         };
 
         HttpRequest req = new HttpRequest();
         req.setEndpoint('callout:MyNameCred/services/data/v60.0/connect/scheduling/service-appointments');
         req.setMethod('PATCH');
         req.setHeader('Content-Type', 'application/json');
         req.setHeader('cache-control', 'no-cache'); // ensure the api is not cached by the browser
         req.setHeader('pragma', 'no-cache'); // ensure the api is not cached by the browser
         req.setBody(JSON.serialize(requestBody));
 
         Http http = new Http();
         HttpResponse res = http.send(req);
         Map<String, Object> response = new Map<String, Object>();
         if (res.getStatusCode() == 200) {
             response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
         } else {
             response.put('error', res.getBody());
         }
         
         return response;
     }



    // get the available staff for the service appointment
    @AuraEnabled(cacheable=true)
    public static List<ServiceResource> getAppointmentCandidates(String startTime, String endTime, String workTypeId, String territoryIds) {
        System.debug('startTime: ' + startTime);
        System.debug('endTime: ' + endTime);
        System.debug('workTypeId: ' + workTypeId);
        System.debug('territoryIds: ' + territoryIds);
        //String url = 'https://tbi8-dev-ed.develop.my.salesforce.com/services/data/v45.0/scheduling/getAppointmentCandidates';
        Map<String, Object> requestBody = new Map<String, Object>{
            'startTime' => startTime,
            'endTime' => endTime,
            'workType' => new Map<String, Object>{
                            'id' => workTypeId
                          },
            // 'schedulingPolicyId' => '2F0VrQE0000002kht',
            'territoryIds' => new List<String>{territoryIds}
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:MyNameCred/services/data/v60.0/scheduling/getAppointmentCandidates');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('cache-control', 'no-cache'); // ensure the api is not cached by the browser
        req.setHeader('pragma', 'no-cache');
        // req.setHeader('Authorization', 'Bearer 00DQE000000lnYZ!AQEAQJpuc50z_hFRNh7RI1bQT8SDIMiVA2AOPQL7VJFdr6lmzub0GFLXduWDbTXCNQGTvKW6d8DVGesVx6keRZViiKcNwtss');
        req.setBody(JSON.serialize(requestBody));

        Http http = new Http();
        HttpResponse res = http.send(req);

        Map<String, Object> response = new Map<String, Object>();
        List<ServiceResource> serviceResources = new List<ServiceResource>();
        if (res.getStatusCode() == 200) {
            response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<String> rescourceIds = new List<String>();
            for (Object candidate : (List<Object>) response.get('candidates')) {
                String serviceResourceId = ((Map<String, Object>)candidate).get('resources').toString().replace('(', '').replace(')', '');
                rescourceIds.add(serviceResourceId);
            }
            System.debug(rescourceIds);
            serviceResources = [ 
                SELECT 
                        Id,
                        Name,
                        role__c
                FROM ServiceResource
                WHERE Id IN :rescourceIds
                LIMIT 500 
            ];
            System.debug(serviceResources);
            return serviceResources;
        } else {
            response.put('error', res.getBody());
        }
        return serviceResources;
        
    }

    // change the territory of the service appointment
    // serviceAppointmentId: the id of the service appointment
    // serviceTerritoryId: the id of the new service territory
    // workTypeId: the id of the current work type
    @AuraEnabled(cacheable=false)
    public static ServiceAppointment changeTerritory(String serviceAppointmentId, String serviceTerritoryId, String workTypeId) {
       
        // get the workTypeGroup using the current workTypeId
        // the new workType has the same workTypeGroup as the current workType
        workTypeGroupMember workTypeGroup = [
            SELECT WorkTypeGroupId
            FROM WorkTypeGroupMember
            WHERE WorkTypeId = :workTypeId
            LIMIT 1
        ];
        String workTypeGroupId = workTypeGroup.WorkTypeGroupId;
        
        // get the workType that belongs to the workTypeGroup
        List<WorkTypeGroupMember> workTypeGroupMembers = [
            SELECT WorkTypeId
            FROM WorkTypeGroupMember
            WHERE WorkTypeGroupId = :workTypeGroupId
        ];

        List<String> workTypeIds = new List<String>();
        for (WorkTypeGroupMember workTypeGroupMember : workTypeGroupMembers) {
            workTypeIds.add(workTypeGroupMember.WorkTypeId);
        }
        
        // select the workType that belongs to the new service territory from the list   
        ServiceTerritoryWorkType workType = [
            SELECT WorkTypeId
            FROM ServiceTerritoryWorkType
            WHERE ServiceTerritoryId = :serviceTerritoryId AND WorkTypeId In :workTypeIds
            LIMIT 1
        ];    
        workTypeId = workType.WorkTypeId;


        ServiceAppointment appointment = [
            SELECT Id, ServiceTerritoryId, workTypeId 
            FROM ServiceAppointment 
            WHERE Id = :serviceAppointmentId LIMIT 1
        ];
        appointment.ServiceTerritoryId = serviceTerritoryId;
        appointment.WorkTypeId = workTypeId;
        update appointment;
        return appointment;
    }

    // get the service territories
    @AuraEnabled(cacheable=true)
    public static List<ServiceTerritory> getServiceTerritories() {
        List<ServiceTerritory> territories = [ 
            SELECT Id, Name
            FROM ServiceTerritory
            LIMIT 500 
        ];
        return territories;
    }
}
