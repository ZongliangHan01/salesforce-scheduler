public with sharing class AppointmentWrapper {
    @AuraEnabled
    public ServiceAppointment appointment { get; set; }
    @AuraEnabled
    public List<AssignedResource> assignedResources { get; set; }
}