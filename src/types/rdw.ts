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
  vervaldatum_apk_dt: string;
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

// APK (Periodic Vehicle Inspection) Data
export interface RdwApkData {
  kenteken: string;
  datum_afgifte_apk: string;
  datum_geldig_tot: string;
  apk_uitslag: string;
  meld_datum_door_keuringsinstantie: string;
  meld_tijd_door_keuringsinstantie: string;
  aantal_gebrek_licht: string;
  aantal_gebrek_zwaar: string;
  aantal_gebrek_kritiek: string;
  keuringsinstantie_naam: string;
  keuringsinstantie_plaats: string;
}

// Brandstof (Fuel) Data
export interface RdwBrandstofData {
  kenteken: string;
  brandstof_omschrijving: string;
  brandstof_volgnummer: string;
  brandstof_code: string;
}

// Carrosserie (Body) Data
export interface RdwCarrosserieData {
  kenteken: string;
  type_carrosserie_europese_omschrijving: string;
  type_carrosserie_nederlands: string;
  type_carrosserie_code: string;
}

// Emissions/Environmental Data
export interface RdwEmissieData {
  kenteken: string;
  uitstoot_co2_gecombineerd: string;
  uitstoot_co2_gewogen: string;
  uitstoot_co2_stad: string;
  uitstoot_co2_buiten: string;
  uitstoot_co2_snelweg: string;
  verbruik_stad_l_100km: string;
  verbruik_buiten_l_100km: string;
  verbruik_gecombineerd_l_100km: string;
  verbruik_gewogen_l_100km: string;
  emissiecode_omschrijving: string;
  euro_klasse: string;
  milieuklasse_eg_goedkeuring_licht: string;
  geluidsniveau_rijdend: string;
  geluidsniveau_stationair: string;
  zuinigheidslabel: string;
  roetfilter: string;
  uitlaatgasrecirculatie: string;
  katalysator: string;
  lpg_systeem: string;
  opticatiesysteem: string;
}

// Road Tax (Wegenbelasting) Data
export interface RdwWegenbelastingData {
  kenteken: string;
  inrichting: string;
  aantal_zitplaatsen: string;
  massa_ledig_voertuig: string;
  datum_eerste_toelating: string;
  brandstof_omschrijving: string;
  wegenbelasting_kwartaal: string;
  wegenbelasting_jaar: string;
  bpm: string;
  bpm_code_omschrijving: string;
}

// Axles (Assen) Data
export interface RdwAssenData {
  kenteken: string;
  as_nummer: string;
  technisch_toegestane_maximum_aslast: string;
  wettelijk_toegestane_maximum_aslast: string;
  banden_aantal: string;
  banden_spoorwijdte: string;
  banden_type: string;
  banden_afmeting: string;
  banden_draagvermogen_index: string;
  banden_snelheidsklasse: string;
}

// ADDITIONAL RDW API ENDPOINTS

// Carrosserie Specific Data (jhie-znh9.json)
export interface RdwCarrosserieSpecificData {
  kenteken: string;
  carrosserie_volgnummer: string;
  carrosserie_voertuig_nummer_code_volgnummer: string;
  carrosseriecode: string;
  carrosserie_voertuig_nummer_europese_omschrijving: string;
}

// Vehicle Class Data (kmfi-hrps.json)
export interface RdwVoertuigklasseData {
  kenteken: string;
  voertuigklasse_code: string;
  voertuigklasse_omschrijving: string;
}

// NEW API ENDPOINTS (2025)

// 2. APK Expiry Date (vezc-m2t6.json)
export interface RdwApkExpiryData {
  kenteken: string;
  vervaldatum_apk: string;
  datum_afgifte_apk: string;
  apk_uitslag: string;
}

// 3. APK History (kdsi-8uzc.json) 
export interface RdwApkHistoryData {
  kenteken: string;
  datum_afgifte_apk: string;
  datum_geldig_tot: string;
  apk_uitslag: string;
  meld_datum_door_keuringsinstantie: string;
  meld_tijd_door_keuringsinstantie: string;
  aantal_gebrek_licht: string;
  aantal_gebrek_zwaar: string;
  aantal_gebrek_kritiek: string;
  keuringsinstantie_naam: string;
  keuringsinstantie_plaats: string;
}

// 4. Environment/Emissions/Consumption (8ys7-d773.json)
export interface RdwEnvironmentData {
  kenteken: string;
  co2_uitstoot_gecombineerd: string;
  co2_uitstoot_gewogen: string;
  co2_uitstoot_stad: string;
  co2_uitstoot_buiten: string;
  co2_uitstoot_snelweg: string;
  verbruik_stad_l_100km: string;
  verbruik_buiten_l_100km: string;
  verbruik_gecombineerd_l_100km: string;
  verbruik_gewogen_l_100km: string;
  geluidsniveau_rijdend: string;
  geluidsniveau_stationair: string;
  emissiecode_omschrijving: string;
  euro_klasse: string;
  milieuklasse_eg_goedkeuring_licht: string;
  zuinigheidslabel: string;
  roetfilter: string;
  uitlaatgasrecirculatie: string;
  katalysator: string;
  lpg_systeem: string;
  opticatiesysteem: string;
}

// 5. Technical Data (78bh-yfrx.json)
export interface RdwTechnicalData {
  kenteken: string;
  voertuigsoort: string;
  merk: string;
  handelsbenaming: string;
  type_uitvoering: string;
  type_uitvoering_volledig: string;
  uitvoering: string;
  aantal_zitplaatsen: string;
  aantal_staanplaatsen: string;
  aantal_deuren: string;
  aantal_wielen: string;
  aantal_assen: string;
  aantal_cilinders: string;
  cilinderinhoud: string;
  massa_ledig_voertuig: string;
  massa_rijklaar: string;
  technische_max_massa_voertuig: string;
  maximum_massa_trekken_ongeremd: string;
  maximum_trekken_massa_geremd: string;
  techn_max_trekgewicht_ongeremd: string;
  techn_max_trekgewicht_geremd: string;
  lengte: string;
  breedte: string;
  hoogte: string;
  wielbasis: string;
  nettomaximumvermogen: string;
  nominaal_continu_maximumvermogen: string;
  maximum_last_onder_de_vooras_sen: string;
  maximum_last_onder_de_achteras_sen: string;
}

// 6. Fuel Info (8dk6-zvkw.json)
export interface RdwFuelData {
  kenteken: string;
  brandstof_hoofdsoort: string;
  brandstof_nevensoort: string;
  brandstof_omschrijving: string;
  brandstof_volgnummer: string;
  brandstof_code: string;
}

// 7. Road Tax General (gm6w-96i9.json) - Not license plate specific
export interface RdwRoadTaxData {
  inrichting: string;
  aantal_zitplaatsen: string;
  massa_ledig_voertuig_van: string;
  massa_ledig_voertuig_tot: string;
  datum_vanaf: string;
  datum_tot: string;
  brandstof_omschrijving: string;
  wegenbelasting_kwartaal: string;
  wegenbelasting_jaar: string;
  bpm_code_omschrijving: string;
}

// APK Keuringen (sgfe-77wx.json) - Meldingen Keuringsinstantie endpoint
export interface RdwApkKeuring {
  kenteken: string;
  meld_datum_door_keuringsinstantie: string;
  meld_datum_door_keuringsinstantie_dt: string;
  meld_tijd_door_keuringsinstantie: string;
  vervaldatum_keuring: string;
  vervaldatum_keuring_dt: string;
  soort_erkenning_keuringsinstantie: string;
  soort_erkenning_omschrijving: string;
  soort_melding_ki_omschrijving: string;
  api_gebrek_constateringen: string;
  api_gebrek_beschrijving: string;
  // Andere velden die mogelijk beschikbaar zijn
  [key: string]: any;
}

// Verwerkte APK historie voor UI
export interface ApkHistorieNieuw {
  datum_melding: string;
  vervaldatum_keuring: string;
  keuringsinstantie_naam: string;
  gebreken: string[];
}

// Processed Vehicle Data for UI (Extended)
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
    co2UitstootStad?: number;
    co2UitstootBuiten?: number;
    co2UitstootSnelweg?: number;
    verbruikStad?: number;
    verbruikBuiten?: number;
    verbruikGecombineerd?: number;
    zuinigheidslabel: string;
    roetfilter: boolean;
    katalysator?: boolean;
    geluidsniveauRijdend?: number;
    geluidsniveauStationair?: number;
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
  // Extended data
  apkHistorie?: ApkHistorieItem[];
  wegenbelasting?: {
    kwartaal: number;
    jaar: number;
    bpm: number;
  };
  carrosserie?: {
    type: string;
    omschrijving: string;
  };
  assen?: AsInfo[];
}

// APK History
export interface ApkHistorieItem {
  datum: Date;
  uitslag: 'Goedgekeurd' | 'Afgekeurd' | 'Niet verschenen';
  gebrekLicht: number;
  gebrekZwaar: number;
  gebrekKritiek: number;
  keuringsinstantie: string;
  plaats: string;
  vervaldatum?: Date; // Optioneel: vervaldatum van APK
}

// Axle Information
export interface AsInfo {
  nummer: number;
  maximumAslast: number;
  bandenAantal: number;
  bandenType: string;
  bandenAfmeting: string;
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