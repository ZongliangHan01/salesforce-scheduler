public with sharing class WorkTypeGroupController_c {
    @AuraEnabled(cacheable=true)
    public static List<WorkTypeGroup> getWorkTypeGroups() {
        try {
            List<WorkTypeGroup> workTypeGroups = [
                SELECT Id, Name
                From WorkTypeGroup
                where IsActive = true
                ORDER BY Name DESC
            ];
        return workTypeGroups;
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
        
            
    }
}


