// RDW API Response Types
export interface RdwVehicle {
  kenteken: string;
  voertuigsoort: string;
  merk: string;
  handelsbenaming: string;
  type_uitvoering: string;
  type_uitvoering_volledig: string;
  uitvoering: string;
  datum_eerste_toelating: string;
  datum_tenaamstelling: string;
  datum_eerste_afgifte_nederland: string;
  wacht_op_keuren: string;
  catalogusprijs: string;
  wam_verzekerd: string;
  aantal_zitplaatsen: string;
  aantal_staanplaatsen: string;
  aantal_deuren: string;
  aantal_wielen: string;
  aantal_assen: string;
  brandstof_hoofdsoort: string;
  brandstof_nevensoort: string;
  cilinderinhoud: string;
  massa_ledig_voertuig: string;
  massa_rijklaar: string;
  maximum_massa_trekken_ongeremd: string;
  maximum_trekken_massa_geremd: string;
  datum_apk: string;
  apk_geldig_tot: string;
  eerste_kleur: string;
  tweede_kleur: string;
  aantal_cilinders: string;
  emissiecode_omschrijving: string;
  euro_klasse: string;
  roetfilter: string;
  uitstoot_co2_gecombineerd: string;
  uitstoot_co2_gewogen: string;
  nettomaximumvermogen: string;
  nominaal_continu_maximumvermogen: string;
  bpm: string;
  zuinigheidslabel: string;
  g3_installatie_aanwezig: string;
  maximum_last_onder_de_vooras_sen: string;
  maximum_last_onder_de_achteras_sen: string;
  uitvoering_chassis_nummer: string;
  lengte: string;
  breedte: string;
  hoogte: string;
  wielbasis: string;
  technische_max_massa_voertuig: string;
  techn_max_trekgewicht_ongeremd: string;
  techn_max_trekgewicht_geremd: string;
  taxi_indicator: string;
  vervaldatum_apk: string;
  openstaande_terugroepactie_indicator: string;
  vermogen_brom_snorfiets: string;
  typegoedkeuring_nummer: string;
  typegoedkeuring_geldig_vanaf: string;
  typegoedkeuring_geldig_tot: string;
  plaats_chassisnummer: string;
}

export interface RdwRecall {
  referentiecode_rdw: string;
  kenteken: string;
  fabrikant: string;
  handelsnaam: string;
  beschrijving_probleem: string;
  datum_probleem_geconstateerd: string;
  datum_start_terugroepactie: string;
  datum_einde_terugroepactie: string;
  typegoedkeuring_nummer: string;
  status: string;
}

// Processed Vehicle Data for UI
export interface ProcessedVehicle {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  datumEersteToelating: Date | null;
  brandstof: string;
  kleur: string;
  voertuigsoort: string;
  eerste_kleur: string;
  apkGeldigTot: Date | null;
  apkVerlooptBinnenkort: boolean;
  massa: {
    ledig: number;
    rijklaar: number;
    technischMaximum: number;
  };
  trekgewicht: {
    ongeremd: number;
    geremd: number;
  };
  milieu: {
    euroKlasse: string;
    co2Uitstoot: number;
    zuinigheidslabel: string;
    roetfilter: boolean;
  };
  motor: {
    cilinderinhoud: number;
    vermogen: number;
    cilinders: number;
  };
  afmetingen: {
    lengte: number;
    breedte: number;
    hoogte: number;
  };
  hasRecall: boolean;
}

// Form and Search Types
export interface TrekgewichtCheck {
  kenteken: string;
  gewensteAanhangergewicht: number;
  heeftRemmen: boolean;
}

export interface TrekgewichtResult {
  toegestaan: boolean;
  maximumGewicht: number;
  message: string;
  rdwData: ProcessedVehicle;
  noData?: boolean;
}

export interface SearchFilters {
  merk?: string;
  handelsbenaming?: string;
  typeUitvoering?: string;
  kleur?: string;
  bouwjaarVan?: number;
  bouwjaarTot?: number;
  brandstof?: string;
  voertuigsoort?: string;
  aantalDeuren?: number;
  aantalZitplaatsen?: number;
  aantalCilinders?: number;
  cilinderinhoudVan?: number;
  cilinderinhoudTot?: number;
  euroKlasse?: string;
  roetfilter?: boolean;
  zuinigheidslabel?: string;
}

export interface SearchResult {
  vehicles: ProcessedVehicle[];
  totalResults: number;
  hasMore: boolean;
}

// Milieuzone Types
export interface Milieuzone {
  stad: string;
  type: 'groen' | 'rood' | 'ultra';
  beschrijving: string;
  toegestaneEuroKlasses: string[];
}

// BPM/MRB Types
export interface BpmCalculation {
  basisBpm: number;
  provincialeToeslag: number;
  totaalBpm: number;
  kwartaalBedrag: number;
}

export interface Province {
  code: string;
  name: string;
  toeslagPercentage: number;
}

// Export Types
export interface CsvExportData {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof: string;
  apkGeldigTot: string;
  co2Uitstoot: number;
  massa: number;
} 