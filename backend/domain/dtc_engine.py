class DTCEngine:
    """
    Core Domain Logic for identifying and manipulating DTC codes
    and extracting heuristic logic based on vehicle type.
    """
    def __init__(self, dtc_database: list):
        self.db = dtc_database

    def find_dtc(self, code: str) -> dict:
        """Finds a DTC by code ignoring casing."""
        for dtc in self.db:
            if dtc.get('code', '').upper() == code.upper():
                return dtc
        return None

    def calculate_confidence(self, dtc: dict, brand: str, vehicle_type: str) -> float:
        """
        Calculates a confidence score based on brand bias,
        generic match probabilities, and data richness.
        """
        base_confidence = 0.85
        
        # Apply slight bump if the manufacturer specifically matches
        manufacturer = dtc.get('manufacturer', '').lower()
        if manufacturer and manufacturer != 'generic' and manufacturer in brand.lower():
            base_confidence += 0.10
            
        # Adjust for heavy equipment/trucks matching specific systems
        if vehicle_type in ["heavy", "equipment"] and manufacturer == "komatsu":
            base_confidence += 0.12
            
        return min(0.99, base_confidence)

    def extract_causes(self, dtc: dict) -> list:
        """Extracts and ranks highest probability causes."""
        # Check if the DB has 'possible_causes_ranked' (like our master JSON)
        if "possible_causes_ranked" in dtc and dtc["possible_causes_ranked"]:
            return dtc["possible_causes_ranked"]
        
        # Fallback to general causes
        return dtc.get("causes", [])

    def extract_fixes(self, dtc: dict) -> list:
        """Extracts appropriate diagnostic fixes."""
        if "diagnostic_checks" in dtc and dtc["diagnostic_checks"]:
            return dtc["diagnostic_checks"]
            
        return dtc.get("solutions", [])
