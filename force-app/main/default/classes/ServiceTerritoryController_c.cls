public with sharing class ServiceTerritoryController_c {
    @AuraEnabled(cacheable=true)
    public static List<ServiceTerritory> getServiceTerritories() {
        try {
            List<ServiceTerritory> serviceTerritories = [
                SELECT Id, Name
                From ServiceTerritory
                where IsActive = true
            ];
            return serviceTerritories;
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
        
            
    }
}