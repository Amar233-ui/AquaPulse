"use client"

import { useEffect, useRef, useState } from "react"

const NODES = [{"id": "R1", "type": "reservoir", "name": "Ch\u00e2teau d'Eau Plateau", "lat": 14.693, "lng": -17.445, "zone": "Plateau", "capacity_m3": 50000}, {"id": "R2", "type": "reservoir", "name": "R\u00e9servoir M\u00e9dina", "lat": 14.688, "lng": -17.46, "zone": "M\u00e9dina", "capacity_m3": 35000}, {"id": "R3", "type": "reservoir", "name": "R\u00e9servoir Pikine", "lat": 14.752, "lng": -17.388, "zone": "Pikine", "capacity_m3": 45000}, {"id": "R4", "type": "reservoir", "name": "R\u00e9servoir Parcelles", "lat": 14.733, "lng": -17.412, "zone": "Parcelles Assainies", "capacity_m3": 30000}, {"id": "P1", "type": "pump", "name": "Station Pompage Fann", "lat": 14.7, "lng": -17.463, "zone": "Fann", "flow_m3h": 1200}, {"id": "P2", "type": "pump", "name": "Station Pompage HLM", "lat": 14.71, "lng": -17.443, "zone": "HLM", "flow_m3h": 900}, {"id": "P3", "type": "pump", "name": "Station Pompage Parcelles", "lat": 14.73, "lng": -17.415, "zone": "Parcelles Assainies", "flow_m3h": 1100}, {"id": "P4", "type": "pump", "name": "Station Pompage Gu\u00e9diawaye", "lat": 14.745, "lng": -17.407, "zone": "Gu\u00e9diawaye", "flow_m3h": 800}, {"id": "V1", "type": "valve", "name": "Vanne M\u00e9dina Nord", "lat": 14.694, "lng": -17.452, "zone": "M\u00e9dina", "open_pct": 100}, {"id": "V2", "type": "valve", "name": "Vanne Grand Dakar", "lat": 14.714, "lng": -17.432, "zone": "Grand Dakar", "open_pct": 75}, {"id": "V3", "type": "valve", "name": "Vanne Gu\u00e9diawaye", "lat": 14.742, "lng": -17.405, "zone": "Gu\u00e9diawaye", "open_pct": 100}, {"id": "V4", "type": "valve", "name": "Vanne Rufisque", "lat": 14.718, "lng": -17.37, "zone": "Rufisque", "open_pct": 85}, {"id": "J1", "type": "junction", "name": "N\u0153ud Central Plateau", "lat": 14.69, "lng": -17.449, "zone": "Plateau"}, {"id": "J2", "type": "junction", "name": "N\u0153ud HLM-M\u00e9dina", "lat": 14.707, "lng": -17.438, "zone": "HLM"}, {"id": "J3", "type": "junction", "name": "N\u0153ud Pikine Est", "lat": 14.75, "lng": -17.392, "zone": "Pikine"}, {"id": "J4", "type": "junction", "name": "N\u0153ud Parcelles-Gu\u00e9diawaye", "lat": 14.738, "lng": -17.41, "zone": "Parcelles Assainies"}, {"id": "J5", "type": "junction", "name": "N\u0153ud Grand Dakar Sud", "lat": 14.72, "lng": -17.425, "zone": "Grand Dakar"}]
const INTER_NODES = [{"id": "N1", "zone": "Plateau", "lat": 14.694067, "lng": -17.454375}, {"id": "N2", "zone": "Plateau", "lat": 14.686051, "lng": -17.44942}, {"id": "N3", "zone": "Plateau", "lat": 14.696202, "lng": -17.438083}, {"id": "N4", "zone": "Plateau", "lat": 14.699628, "lng": -17.452827}, {"id": "N5", "zone": "Plateau", "lat": 14.689282, "lng": -17.454255}, {"id": "N6", "zone": "Plateau", "lat": 14.68481, "lng": -17.442366}, {"id": "N7", "zone": "Plateau", "lat": 14.680584, "lng": -17.450029}, {"id": "N8", "zone": "Plateau", "lat": 14.694297, "lng": -17.441376}, {"id": "N9", "zone": "Plateau", "lat": 14.68485, "lng": -17.440268}, {"id": "N10", "zone": "Plateau", "lat": 14.697807, "lng": -17.454838}, {"id": "N11", "zone": "M\u00e9dina", "lat": 14.696116, "lng": -17.453132}, {"id": "N12", "zone": "M\u00e9dina", "lat": 14.686805, "lng": -17.462357}, {"id": "N13", "zone": "M\u00e9dina", "lat": 14.699144, "lng": -17.459278}, {"id": "N14", "zone": "M\u00e9dina", "lat": 14.681855, "lng": -17.463356}, {"id": "N15", "zone": "M\u00e9dina", "lat": 14.69695, "lng": -17.454737}, {"id": "N16", "zone": "M\u00e9dina", "lat": 14.696143, "lng": -17.452595}, {"id": "N17", "zone": "M\u00e9dina", "lat": 14.690725, "lng": -17.448457}, {"id": "N18", "zone": "M\u00e9dina", "lat": 14.687571, "lng": -17.455615}, {"id": "N19", "zone": "M\u00e9dina", "lat": 14.696588, "lng": -17.454485}, {"id": "N20", "zone": "M\u00e9dina", "lat": 14.697234, "lng": -17.455185}, {"id": "N21", "zone": "Fann", "lat": 14.706091, "lng": -17.471221}, {"id": "N22", "zone": "Fann", "lat": 14.696558, "lng": -17.46708}, {"id": "N23", "zone": "Fann", "lat": 14.693596, "lng": -17.468043}, {"id": "N24", "zone": "Fann", "lat": 14.69402, "lng": -17.467274}, {"id": "N25", "zone": "Fann", "lat": 14.704714, "lng": -17.465798}, {"id": "N26", "zone": "Fann", "lat": 14.699404, "lng": -17.468438}, {"id": "N27", "zone": "Fann", "lat": 14.69734, "lng": -17.456077}, {"id": "N28", "zone": "Fann", "lat": 14.704961, "lng": -17.461645}, {"id": "N29", "zone": "HLM", "lat": 14.70308, "lng": -17.43823}, {"id": "N30", "zone": "HLM", "lat": 14.702941, "lng": -17.446273}, {"id": "N31", "zone": "HLM", "lat": 14.717811, "lng": -17.44028}, {"id": "N32", "zone": "HLM", "lat": 14.710025, "lng": -17.439254}, {"id": "N33", "zone": "HLM", "lat": 14.715171, "lng": -17.437152}, {"id": "N34", "zone": "HLM", "lat": 14.704123, "lng": -17.454262}, {"id": "N35", "zone": "HLM", "lat": 14.705678, "lng": -17.448842}, {"id": "N36", "zone": "HLM", "lat": 14.703798, "lng": -17.433313}, {"id": "N37", "zone": "Grand Dakar", "lat": 14.721775, "lng": -17.436504}, {"id": "N38", "zone": "Grand Dakar", "lat": 14.717798, "lng": -17.434318}, {"id": "N39", "zone": "Grand Dakar", "lat": 14.722462, "lng": -17.432611}, {"id": "N40", "zone": "Grand Dakar", "lat": 14.710768, "lng": -17.438341}, {"id": "N41", "zone": "Grand Dakar", "lat": 14.716105, "lng": -17.437906}, {"id": "N42", "zone": "Grand Dakar", "lat": 14.716523, "lng": -17.420759}, {"id": "N43", "zone": "Grand Dakar", "lat": 14.713189, "lng": -17.439078}, {"id": "N44", "zone": "Grand Dakar", "lat": 14.723956, "lng": -17.431243}, {"id": "N45", "zone": "Parcelles Assainies", "lat": 14.722, "lng": -17.426775}, {"id": "N46", "zone": "Parcelles Assainies", "lat": 14.722412, "lng": -17.411686}, {"id": "N47", "zone": "Parcelles Assainies", "lat": 14.737426, "lng": -17.417024}, {"id": "N48", "zone": "Parcelles Assainies", "lat": 14.721398, "lng": -17.418078}, {"id": "N49", "zone": "Parcelles Assainies", "lat": 14.741915, "lng": -17.414243}, {"id": "N50", "zone": "Parcelles Assainies", "lat": 14.741364, "lng": -17.40562}, {"id": "N51", "zone": "Parcelles Assainies", "lat": 14.720253, "lng": -17.409261}, {"id": "N52", "zone": "Parcelles Assainies", "lat": 14.734998, "lng": -17.414039}, {"id": "N53", "zone": "Pikine", "lat": 14.744404, "lng": -17.385771}, {"id": "N54", "zone": "Pikine", "lat": 14.740677, "lng": -17.391957}, {"id": "N55", "zone": "Pikine", "lat": 14.748889, "lng": -17.376386}, {"id": "N56", "zone": "Pikine", "lat": 14.75902, "lng": -17.397098}, {"id": "N57", "zone": "Pikine", "lat": 14.750014, "lng": -17.39964}, {"id": "N58", "zone": "Pikine", "lat": 14.759903, "lng": -17.378884}, {"id": "N59", "zone": "Pikine", "lat": 14.745163, "lng": -17.385832}, {"id": "N60", "zone": "Pikine", "lat": 14.752615, "lng": -17.400415}, {"id": "N61", "zone": "Pikine", "lat": 14.7563, "lng": -17.388819}, {"id": "N62", "zone": "Pikine", "lat": 14.756687, "lng": -17.389089}, {"id": "N63", "zone": "Gu\u00e9diawaye", "lat": 14.734013, "lng": -17.411896}, {"id": "N64", "zone": "Gu\u00e9diawaye", "lat": 14.734428, "lng": -17.396773}, {"id": "N65", "zone": "Gu\u00e9diawaye", "lat": 14.753332, "lng": -17.399208}, {"id": "N66", "zone": "Gu\u00e9diawaye", "lat": 14.740765, "lng": -17.418552}, {"id": "N67", "zone": "Gu\u00e9diawaye", "lat": 14.753316, "lng": -17.396326}, {"id": "N68", "zone": "Gu\u00e9diawaye", "lat": 14.735884, "lng": -17.40785}, {"id": "N69", "zone": "Gu\u00e9diawaye", "lat": 14.735523, "lng": -17.400985}, {"id": "N70", "zone": "Gu\u00e9diawaye", "lat": 14.750848, "lng": -17.41679}, {"id": "N71", "zone": "Rufisque", "lat": 14.719506, "lng": -17.368506}, {"id": "N72", "zone": "Rufisque", "lat": 14.715301, "lng": -17.358827}, {"id": "N73", "zone": "Rufisque", "lat": 14.718463, "lng": -17.378646}, {"id": "N74", "zone": "Rufisque", "lat": 14.720786, "lng": -17.363102}, {"id": "N75", "zone": "Rufisque", "lat": 14.714023, "lng": -17.375649}, {"id": "N76", "zone": "Rufisque", "lat": 14.729903, "lng": -17.365504}, {"id": "N77", "zone": "Rufisque", "lat": 14.718762, "lng": -17.369473}, {"id": "N78", "zone": "Rufisque", "lat": 14.71242, "lng": -17.378259}]
const PIPES = [{"id": "PIPE-01", "from": "R1", "to": "P1", "diameter_mm": 400, "length_m": 2144, "material": "fonte", "zone": "Plateau-Fann"}, {"id": "PIPE-02", "from": "R1", "to": "J1", "diameter_mm": 350, "length_m": 555, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-03", "from": "P1", "to": "J1", "diameter_mm": 300, "length_m": 1910, "material": "PVC", "zone": "Fann-Plateau"}, {"id": "PIPE-04", "from": "J1", "to": "V1", "diameter_mm": 300, "length_m": 555, "material": "PVC", "zone": "Plateau-M\u00e9dina"}, {"id": "PIPE-05", "from": "V1", "to": "R2", "diameter_mm": 300, "length_m": 1110, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-06", "from": "R2", "to": "J2", "diameter_mm": 350, "length_m": 3227, "material": "PVC", "zone": "M\u00e9dina-HLM"}, {"id": "PIPE-07", "from": "J1", "to": "J2", "diameter_mm": 250, "length_m": 2248, "material": "amiante-ciment", "zone": "Plateau-HLM", "age_years": 35, "risk": "high"}, {"id": "PIPE-08", "from": "J2", "to": "P2", "diameter_mm": 300, "length_m": 647, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-09", "from": "P2", "to": "V2", "diameter_mm": 250, "length_m": 1299, "material": "PVC", "zone": "HLM-Grand Dakar"}, {"id": "PIPE-10", "from": "V2", "to": "J5", "diameter_mm": 300, "length_m": 1023, "material": "fonte", "zone": "Grand Dakar"}, {"id": "PIPE-11", "from": "J5", "to": "P3", "diameter_mm": 300, "length_m": 1570, "material": "PVC", "zone": "Grand Dakar-Parcelles Assainies"}, {"id": "PIPE-12", "from": "P3", "to": "R4", "diameter_mm": 350, "length_m": 471, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-13", "from": "R4", "to": "J4", "diameter_mm": 300, "length_m": 598, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-14", "from": "J4", "to": "P4", "diameter_mm": 300, "length_m": 845, "material": "PVC", "zone": "Parcelles Assainies-Gu\u00e9diawaye"}, {"id": "PIPE-15", "from": "P4", "to": "V3", "diameter_mm": 300, "length_m": 400, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-16", "from": "V3", "to": "R3", "diameter_mm": 400, "length_m": 2189, "material": "acier", "zone": "Gu\u00e9diawaye-Pikine"}, {"id": "PIPE-17", "from": "R3", "to": "J3", "diameter_mm": 350, "length_m": 496, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-18", "from": "J3", "to": "J4", "diameter_mm": 250, "length_m": 2401, "material": "fonte", "zone": "Pikine-Parcelles Assainies", "age_years": 28, "risk": "medium"}, {"id": "PIPE-19", "from": "J2", "to": "J5", "diameter_mm": 200, "length_m": 2041, "material": "PVC", "zone": "HLM-Grand Dakar"}, {"id": "PIPE-20", "from": "J5", "to": "J4", "diameter_mm": 200, "length_m": 2601, "material": "PVC", "zone": "Grand Dakar-Parcelles Assainies"}, {"id": "PIPE-21", "from": "V2", "to": "V4", "diameter_mm": 200, "length_m": 6896, "material": "fonte", "zone": "Grand Dakar-Rufisque", "age_years": 22, "risk": "medium"}, {"id": "PIPE-22", "from": "V4", "to": "J3", "diameter_mm": 250, "length_m": 4310, "material": "PVC", "zone": "Rufisque-Pikine"}, {"id": "PIPE-023", "from": "N1", "to": "V1", "diameter_mm": 150, "length_m": 264, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-024", "from": "N1", "to": "N10", "diameter_mm": 125, "length_m": 418, "material": "PEHD", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-025", "from": "N1", "to": "N5", "diameter_mm": 125, "length_m": 531, "material": "acier", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-026", "from": "N2", "to": "J1", "diameter_mm": 100, "length_m": 441, "material": "PEHD", "zone": "Plateau", "age_years": 38, "risk": "high"}, {"id": "PIPE-027", "from": "N2", "to": "N7", "diameter_mm": 100, "length_m": 611, "material": "PVC", "zone": "Plateau", "age_years": 10}, {"id": "PIPE-028", "from": "N2", "to": "N5", "diameter_mm": 80, "length_m": 645, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-029", "from": "N3", "to": "R1", "diameter_mm": 80, "length_m": 846, "material": "PVC", "zone": "Plateau", "age_years": 25, "risk": "medium"}, {"id": "PIPE-030", "from": "N3", "to": "N8", "diameter_mm": 150, "length_m": 422, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-031", "from": "N3", "to": "N9", "diameter_mm": 100, "length_m": 1283, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-032", "from": "N4", "to": "V1", "diameter_mm": 100, "length_m": 631, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-033", "from": "N4", "to": "N10", "diameter_mm": 80, "length_m": 301, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-034", "from": "N4", "to": "N1", "diameter_mm": 150, "length_m": 641, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-035", "from": "N5", "to": "V1", "diameter_mm": 200, "length_m": 580, "material": "PVC", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-036", "from": "N6", "to": "J1", "diameter_mm": 200, "length_m": 935, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-037", "from": "N6", "to": "N9", "diameter_mm": 125, "length_m": 233, "material": "fonte", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-038", "from": "N6", "to": "N2", "diameter_mm": 125, "length_m": 795, "material": "PEHD", "zone": "Plateau"}, {"id": "PIPE-039", "from": "N7", "to": "J1", "diameter_mm": 150, "length_m": 1051, "material": "PEHD", "zone": "Plateau", "age_years": 18}, {"id": "PIPE-040", "from": "N7", "to": "N6", "diameter_mm": 150, "length_m": 971, "material": "fonte", "zone": "Plateau", "age_years": 10}, {"id": "PIPE-041", "from": "N8", "to": "R1", "diameter_mm": 80, "length_m": 427, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-042", "from": "N8", "to": "N9", "diameter_mm": 80, "length_m": 1056, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-043", "from": "N9", "to": "R1", "diameter_mm": 200, "length_m": 1046, "material": "fonte", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-044", "from": "N9", "to": "N2", "diameter_mm": 125, "length_m": 1025, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-045", "from": "N10", "to": "V1", "diameter_mm": 125, "length_m": 527, "material": "fonte", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-046", "from": "N11", "to": "V1", "diameter_mm": 150, "length_m": 266, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-047", "from": "N11", "to": "N16", "diameter_mm": 125, "length_m": 60, "material": "PVC", "zone": "M\u00e9dina", "age_years": 30, "risk": "high"}, {"id": "PIPE-048", "from": "N11", "to": "N19", "diameter_mm": 80, "length_m": 159, "material": "PVC", "zone": "M\u00e9dina", "age_years": 30, "risk": "high"}, {"id": "PIPE-049", "from": "N12", "to": "R2", "diameter_mm": 250, "length_m": 293, "material": "PVC", "zone": "M\u00e9dina", "age_years": 18}, {"id": "PIPE-050", "from": "N12", "to": "N14", "diameter_mm": 125, "length_m": 561, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-051", "from": "N12", "to": "N18", "diameter_mm": 100, "length_m": 753, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-052", "from": "N13", "to": "P1", "diameter_mm": 200, "length_m": 424, "material": "PEHD", "zone": "M\u00e9dina", "age_years": 18}, {"id": "PIPE-053", "from": "N13", "to": "N20", "diameter_mm": 100, "length_m": 501, "material": "PVC", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-054", "from": "N13", "to": "N15", "diameter_mm": 150, "length_m": 560, "material": "fonte", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-055", "from": "N14", "to": "R2", "diameter_mm": 80, "length_m": 777, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-056", "from": "N14", "to": "N18", "diameter_mm": 125, "length_m": 1068, "material": "PVC", "zone": "M\u00e9dina", "age_years": 20, "risk": "medium"}, {"id": "PIPE-057", "from": "N15", "to": "V1", "diameter_mm": 125, "length_m": 447, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-058", "from": "N15", "to": "N19", "diameter_mm": 125, "length_m": 49, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-059", "from": "N15", "to": "N20", "diameter_mm": 150, "length_m": 59, "material": "PVC", "zone": "M\u00e9dina", "age_years": 20, "risk": "medium"}, {"id": "PIPE-060", "from": "N16", "to": "V1", "diameter_mm": 80, "length_m": 247, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-061", "from": "N16", "to": "N19", "diameter_mm": 80, "length_m": 216, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-062", "from": "N17", "to": "J1", "diameter_mm": 200, "length_m": 101, "material": "PVC", "zone": "M\u00e9dina", "age_years": 25, "risk": "medium"}, {"id": "PIPE-063", "from": "N17", "to": "N16", "diameter_mm": 150, "length_m": 757, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-064", "from": "N17", "to": "N11", "diameter_mm": 125, "length_m": 792, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-065", "from": "N18", "to": "R2", "diameter_mm": 125, "length_m": 489, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-066", "from": "N18", "to": "N17", "diameter_mm": 80, "length_m": 868, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-067", "from": "N19", "to": "V1", "diameter_mm": 200, "length_m": 398, "material": "PVC", "zone": "M\u00e9dina", "age_years": 32, "risk": "high"}, {"id": "PIPE-068", "from": "N19", "to": "N20", "diameter_mm": 100, "length_m": 106, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-069", "from": "N20", "to": "V1", "diameter_mm": 100, "length_m": 504, "material": "acier", "zone": "M\u00e9dina"}, {"id": "PIPE-070", "from": "N21", "to": "P1", "diameter_mm": 100, "length_m": 1136, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-071", "from": "N21", "to": "N25", "diameter_mm": 150, "length_m": 621, "material": "PEHD", "zone": "Fann", "age_years": 10}, {"id": "PIPE-072", "from": "N21", "to": "N26", "diameter_mm": 125, "length_m": 804, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-073", "from": "N22", "to": "P1", "diameter_mm": 150, "length_m": 593, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-074", "from": "N22", "to": "N24", "diameter_mm": 150, "length_m": 283, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-075", "from": "N22", "to": "N23", "diameter_mm": 150, "length_m": 346, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-076", "from": "N23", "to": "P1", "diameter_mm": 100, "length_m": 905, "material": "PEHD", "zone": "Fann", "age_years": 18}, {"id": "PIPE-077", "from": "N23", "to": "N24", "diameter_mm": 100, "length_m": 97, "material": "acier", "zone": "Fann"}, {"id": "PIPE-078", "from": "N24", "to": "P1", "diameter_mm": 125, "length_m": 816, "material": "PEHD", "zone": "Fann", "age_years": 25, "risk": "medium"}, {"id": "PIPE-079", "from": "N25", "to": "P1", "diameter_mm": 125, "length_m": 608, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-080", "from": "N25", "to": "N28", "diameter_mm": 150, "length_m": 462, "material": "PVC", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-081", "from": "N26", "to": "P1", "diameter_mm": 80, "length_m": 607, "material": "PVC", "zone": "Fann", "age_years": 25, "risk": "medium"}, {"id": "PIPE-082", "from": "N26", "to": "N22", "diameter_mm": 100, "length_m": 350, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-083", "from": "N26", "to": "N24", "diameter_mm": 80, "length_m": 611, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-084", "from": "N27", "to": "V1", "diameter_mm": 125, "length_m": 585, "material": "PVC", "zone": "Fann", "age_years": 32, "risk": "high"}, {"id": "PIPE-085", "from": "N27", "to": "N28", "diameter_mm": 150, "length_m": 1048, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-086", "from": "N27", "to": "N22", "diameter_mm": 80, "length_m": 1224, "material": "acier", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-087", "from": "N28", "to": "P1", "diameter_mm": 125, "length_m": 571, "material": "PVC", "zone": "Fann", "age_years": 12}, {"id": "PIPE-088", "from": "N28", "to": "N26", "diameter_mm": 80, "length_m": 974, "material": "PVC", "zone": "Fann", "age_years": 20, "risk": "medium"}, {"id": "PIPE-089", "from": "N29", "to": "J2", "diameter_mm": 125, "length_m": 436, "material": "acier", "zone": "HLM", "age_years": 12}, {"id": "PIPE-090", "from": "N29", "to": "N36", "diameter_mm": 125, "length_m": 552, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-091", "from": "N29", "to": "N32", "diameter_mm": 80, "length_m": 779, "material": "PVC", "zone": "HLM", "age_years": 10}, {"id": "PIPE-092", "from": "N30", "to": "P2", "diameter_mm": 200, "length_m": 864, "material": "fonte", "zone": "HLM", "age_years": 18}, {"id": "PIPE-093", "from": "N30", "to": "N35", "diameter_mm": 125, "length_m": 417, "material": "acier", "zone": "HLM", "age_years": 20, "risk": "medium"}, {"id": "PIPE-094", "from": "N30", "to": "N29", "diameter_mm": 100, "length_m": 893, "material": "PEHD", "zone": "HLM", "age_years": 10}, {"id": "PIPE-095", "from": "N31", "to": "P2", "diameter_mm": 250, "length_m": 918, "material": "acier", "zone": "HLM", "age_years": 32, "risk": "high"}, {"id": "PIPE-096", "from": "N31", "to": "N33", "diameter_mm": 125, "length_m": 454, "material": "acier", "zone": "HLM"}, {"id": "PIPE-097", "from": "N31", "to": "N32", "diameter_mm": 80, "length_m": 872, "material": "fonte", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-098", "from": "N32", "to": "J2", "diameter_mm": 100, "length_m": 363, "material": "acier", "zone": "HLM", "age_years": 18}, {"id": "PIPE-099", "from": "N32", "to": "N33", "diameter_mm": 125, "length_m": 617, "material": "acier", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-100", "from": "N33", "to": "V2", "diameter_mm": 150, "length_m": 586, "material": "PVC", "zone": "HLM", "age_years": 38, "risk": "high"}, {"id": "PIPE-101", "from": "N34", "to": "P1", "diameter_mm": 200, "length_m": 1072, "material": "acier", "zone": "HLM", "age_years": 12}, {"id": "PIPE-102", "from": "N34", "to": "N35", "diameter_mm": 80, "length_m": 626, "material": "fonte", "zone": "HLM"}, {"id": "PIPE-103", "from": "N34", "to": "N30", "diameter_mm": 125, "length_m": 896, "material": "PVC", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-104", "from": "N35", "to": "P2", "diameter_mm": 250, "length_m": 807, "material": "fonte", "zone": "HLM", "age_years": 12}, {"id": "PIPE-105", "from": "N36", "to": "J2", "diameter_mm": 100, "length_m": 630, "material": "PEHD", "zone": "HLM", "age_years": 12}, {"id": "PIPE-106", "from": "N36", "to": "N32", "diameter_mm": 80, "length_m": 955, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-107", "from": "N37", "to": "V2", "diameter_mm": 200, "length_m": 997, "material": "PEHD", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-108", "from": "N37", "to": "N39", "diameter_mm": 150, "length_m": 439, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-109", "from": "N37", "to": "N38", "diameter_mm": 100, "length_m": 504, "material": "PVC", "zone": "Grand Dakar", "age_years": 30, "risk": "high"}, {"id": "PIPE-110", "from": "N38", "to": "V2", "diameter_mm": 150, "length_m": 494, "material": "acier", "zone": "Grand Dakar", "age_years": 32, "risk": "high"}, {"id": "PIPE-111", "from": "N38", "to": "N41", "diameter_mm": 100, "length_m": 440, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-112", "from": "N39", "to": "J5", "diameter_mm": 80, "length_m": 888, "material": "PEHD", "zone": "Grand Dakar"}, {"id": "PIPE-113", "from": "N39", "to": "N44", "diameter_mm": 100, "length_m": 225, "material": "PEHD", "zone": "Grand Dakar", "age_years": 20, "risk": "medium"}, {"id": "PIPE-114", "from": "N40", "to": "J2", "diameter_mm": 80, "length_m": 420, "material": "PVC", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-115", "from": "N40", "to": "N43", "diameter_mm": 80, "length_m": 281, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-116", "from": "N40", "to": "N41", "diameter_mm": 150, "length_m": 594, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-117", "from": "N41", "to": "V2", "diameter_mm": 150, "length_m": 696, "material": "PVC", "zone": "Grand Dakar", "age_years": 25, "risk": "medium"}, {"id": "PIPE-118", "from": "N41", "to": "N43", "diameter_mm": 150, "length_m": 349, "material": "PEHD", "zone": "Grand Dakar", "age_years": 30, "risk": "high"}, {"id": "PIPE-119", "from": "N42", "to": "J5", "diameter_mm": 100, "length_m": 609, "material": "PVC", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-120", "from": "N42", "to": "N44", "diameter_mm": 150, "length_m": 1427, "material": "fonte", "zone": "Grand Dakar", "age_years": 20, "risk": "medium"}, {"id": "PIPE-121", "from": "N42", "to": "N39", "diameter_mm": 125, "length_m": 1472, "material": "PEHD", "zone": "Grand Dakar"}, {"id": "PIPE-122", "from": "N43", "to": "P2", "diameter_mm": 250, "length_m": 561, "material": "PEHD", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-123", "from": "N44", "to": "J5", "diameter_mm": 150, "length_m": 820, "material": "PVC", "zone": "Grand Dakar", "age_years": 18}, {"id": "PIPE-124", "from": "N44", "to": "N37", "diameter_mm": 100, "length_m": 632, "material": "fonte", "zone": "Grand Dakar", "age_years": 10}, {"id": "PIPE-125", "from": "N45", "to": "J5", "diameter_mm": 125, "length_m": 297, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 25, "risk": "medium"}, {"id": "PIPE-126", "from": "N45", "to": "N48", "diameter_mm": 100, "length_m": 968, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-127", "from": "N45", "to": "N46", "diameter_mm": 150, "length_m": 1676, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-128", "from": "N46", "to": "P3", "diameter_mm": 250, "length_m": 919, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-129", "from": "N46", "to": "N51", "diameter_mm": 150, "length_m": 360, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-130", "from": "N46", "to": "N48", "diameter_mm": 150, "length_m": 718, "material": "acier", "zone": "Parcelles Assainies", "age_years": 10}, {"id": "PIPE-131", "from": "N47", "to": "R4", "diameter_mm": 100, "length_m": 743, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-132", "from": "N47", "to": "N52", "diameter_mm": 150, "length_m": 427, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-133", "from": "N47", "to": "N49", "diameter_mm": 80, "length_m": 586, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 30, "risk": "high"}, {"id": "PIPE-134", "from": "N48", "to": "J5", "diameter_mm": 150, "length_m": 784, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 32, "risk": "high"}, {"id": "PIPE-135", "from": "N49", "to": "J4", "diameter_mm": 125, "length_m": 641, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 25, "risk": "medium"}, {"id": "PIPE-136", "from": "N49", "to": "N52", "diameter_mm": 150, "length_m": 768, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-137", "from": "N50", "to": "V3", "diameter_mm": 150, "length_m": 99, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 12}, {"id": "PIPE-138", "from": "N50", "to": "N49", "diameter_mm": 150, "length_m": 959, "material": "acier", "zone": "Parcelles Assainies", "age_years": 10}, {"id": "PIPE-139", "from": "N50", "to": "N52", "diameter_mm": 150, "length_m": 1172, "material": "fonte", "zone": "Parcelles Assainies"}, {"id": "PIPE-140", "from": "N51", "to": "P3", "diameter_mm": 250, "length_m": 1256, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 32, "risk": "high"}, {"id": "PIPE-141", "from": "N51", "to": "N48", "diameter_mm": 100, "length_m": 987, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-142", "from": "N52", "to": "R4", "diameter_mm": 150, "length_m": 317, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-143", "from": "N53", "to": "R3", "diameter_mm": 80, "length_m": 879, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-144", "from": "N53", "to": "N59", "diameter_mm": 100, "length_m": 85, "material": "PEHD", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-145", "from": "N53", "to": "N54", "diameter_mm": 100, "length_m": 802, "material": "PVC", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-146", "from": "N54", "to": "J3", "diameter_mm": 150, "length_m": 1035, "material": "fonte", "zone": "Pikine", "age_years": 18}, {"id": "PIPE-147", "from": "N54", "to": "N59", "diameter_mm": 150, "length_m": 843, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-148", "from": "N55", "to": "R3", "diameter_mm": 150, "length_m": 1335, "material": "fonte", "zone": "Pikine", "age_years": 25, "risk": "medium"}, {"id": "PIPE-149", "from": "N55", "to": "N59", "diameter_mm": 125, "length_m": 1127, "material": "PEHD", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-150", "from": "N55", "to": "N53", "diameter_mm": 150, "length_m": 1155, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-151", "from": "N56", "to": "J3", "diameter_mm": 125, "length_m": 1150, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-152", "from": "N56", "to": "N60", "diameter_mm": 80, "length_m": 801, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-153", "from": "N56", "to": "N62", "diameter_mm": 100, "length_m": 926, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-154", "from": "N57", "to": "J3", "diameter_mm": 200, "length_m": 848, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-155", "from": "N57", "to": "N60", "diameter_mm": 100, "length_m": 301, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-156", "from": "N57", "to": "N56", "diameter_mm": 100, "length_m": 1039, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-157", "from": "N58", "to": "R3", "diameter_mm": 125, "length_m": 1339, "material": "PEHD", "zone": "Pikine", "age_years": 18}, {"id": "PIPE-158", "from": "N58", "to": "N61", "diameter_mm": 80, "length_m": 1173, "material": "PEHD", "zone": "Pikine", "age_years": 30, "risk": "high"}, {"id": "PIPE-159", "from": "N58", "to": "N62", "diameter_mm": 125, "length_m": 1188, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-160", "from": "N59", "to": "R3", "diameter_mm": 125, "length_m": 796, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-161", "from": "N60", "to": "J3", "diameter_mm": 150, "length_m": 978, "material": "PVC", "zone": "Pikine", "age_years": 32, "risk": "high"}, {"id": "PIPE-162", "from": "N61", "to": "R3", "diameter_mm": 80, "length_m": 486, "material": "PVC", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-163", "from": "N61", "to": "N62", "diameter_mm": 80, "length_m": 52, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-164", "from": "N61", "to": "N56", "diameter_mm": 80, "length_m": 967, "material": "PEHD", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-165", "from": "N62", "to": "R3", "diameter_mm": 125, "length_m": 534, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-166", "from": "N63", "to": "R4", "diameter_mm": 250, "length_m": 113, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 32, "risk": "high"}, {"id": "PIPE-167", "from": "N63", "to": "N68", "diameter_mm": 125, "length_m": 495, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-168", "from": "N63", "to": "N66", "diameter_mm": 150, "length_m": 1052, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-169", "from": "N64", "to": "V3", "diameter_mm": 125, "length_m": 1241, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 32, "risk": "high"}, {"id": "PIPE-170", "from": "N64", "to": "N69", "diameter_mm": 100, "length_m": 483, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-171", "from": "N64", "to": "N68", "diameter_mm": 125, "length_m": 1240, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-172", "from": "N65", "to": "J3", "diameter_mm": 150, "length_m": 881, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 38, "risk": "high"}, {"id": "PIPE-173", "from": "N65", "to": "N67", "diameter_mm": 125, "length_m": 320, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 30, "risk": "high"}, {"id": "PIPE-174", "from": "N65", "to": "N70", "diameter_mm": 80, "length_m": 1971, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-175", "from": "N66", "to": "J4", "diameter_mm": 100, "length_m": 998, "material": "PEHD", "zone": "Gu\u00e9diawaye", "age_years": 38, "risk": "high"}, {"id": "PIPE-176", "from": "N66", "to": "N70", "diameter_mm": 150, "length_m": 1136, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-177", "from": "N67", "to": "J3", "diameter_mm": 150, "length_m": 605, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-178", "from": "N68", "to": "J4", "diameter_mm": 100, "length_m": 335, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 25, "risk": "medium"}, {"id": "PIPE-179", "from": "N68", "to": "N69", "diameter_mm": 125, "length_m": 763, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-180", "from": "N69", "to": "V3", "diameter_mm": 125, "length_m": 846, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 18}, {"id": "PIPE-181", "from": "N70", "to": "P4", "diameter_mm": 200, "length_m": 1266, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 18}, {"id": "PIPE-182", "from": "N70", "to": "N68", "diameter_mm": 100, "length_m": 1935, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 30, "risk": "high"}, {"id": "PIPE-183", "from": "N71", "to": "V4", "diameter_mm": 250, "length_m": 235, "material": "acier", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-184", "from": "N71", "to": "N77", "diameter_mm": 100, "length_m": 135, "material": "PVC", "zone": "Rufisque", "age_years": 20, "risk": "medium"}, {"id": "PIPE-185", "from": "N71", "to": "N74", "diameter_mm": 150, "length_m": 616, "material": "acier", "zone": "Rufisque", "age_years": 20, "risk": "medium"}, {"id": "PIPE-186", "from": "N72", "to": "V4", "diameter_mm": 80, "length_m": 1276, "material": "fonte", "zone": "Rufisque"}, {"id": "PIPE-187", "from": "N72", "to": "N74", "diameter_mm": 150, "length_m": 772, "material": "PVC", "zone": "Rufisque"}, {"id": "PIPE-188", "from": "N72", "to": "N71", "diameter_mm": 125, "length_m": 1171, "material": "PVC", "zone": "Rufisque"}, {"id": "PIPE-189", "from": "N73", "to": "V4", "diameter_mm": 150, "length_m": 961, "material": "PVC", "zone": "Rufisque", "age_years": 25, "risk": "medium"}, {"id": "PIPE-190", "from": "N73", "to": "N75", "diameter_mm": 125, "length_m": 595, "material": "acier", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-191", "from": "N73", "to": "N78", "diameter_mm": 125, "length_m": 672, "material": "fonte", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-192", "from": "N74", "to": "V4", "diameter_mm": 125, "length_m": 826, "material": "fonte", "zone": "Rufisque", "age_years": 38, "risk": "high"}, {"id": "PIPE-193", "from": "N74", "to": "N77", "diameter_mm": 100, "length_m": 742, "material": "PVC", "zone": "Rufisque", "age_years": 10}, {"id": "PIPE-194", "from": "N75", "to": "V4", "diameter_mm": 125, "length_m": 767, "material": "PVC", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-195", "from": "N75", "to": "N78", "diameter_mm": 100, "length_m": 340, "material": "PEHD", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-196", "from": "N76", "to": "V4", "diameter_mm": 250, "length_m": 1412, "material": "acier", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-197", "from": "N76", "to": "N74", "diameter_mm": 125, "length_m": 1047, "material": "PVC", "zone": "Rufisque", "age_years": 10}, {"id": "PIPE-198", "from": "N76", "to": "N71", "diameter_mm": 125, "length_m": 1201, "material": "PEHD", "zone": "Rufisque"}, {"id": "PIPE-199", "from": "N77", "to": "V4", "diameter_mm": 100, "length_m": 103, "material": "fonte", "zone": "Rufisque", "age_years": 25, "risk": "medium"}, {"id": "PIPE-200", "from": "N78", "to": "V4", "diameter_mm": 250, "length_m": 1106, "material": "PVC", "zone": "Rufisque"}]
const ALERTS = [{"alert_id": "ALT-001", "type": "Fuite d\u00e9tect\u00e9e", "location": "Grand Dakar", "severity": "Critique", "lat": 14.712, "lng": -17.438, "date": "2026-03-11 09:20", "status": "\u00c9quipes en intervention", "description": "Une fuite importante a \u00e9t\u00e9 d\u00e9tect\u00e9e dans votre secteur. Conservez de l'eau en bouteille par pr\u00e9caution."}, {"alert_id": "ALT-002", "type": "Panne pompe", "location": "Quartier Fann", "severity": "Critique", "lat": 14.7, "lng": -17.463, "date": "2026-03-11 10:10", "status": "Intervention en cours", "description": "La station de pompage est en panne. Une baisse de pression est possible \u00e0 votre robinet."}, {"alert_id": "ALT-003", "type": "D\u00e9bit anormal", "location": "Fann \u2014 Plateau", "severity": "Alerte", "lat": 14.696, "lng": -17.454, "date": "2026-03-11 09:45", "status": "En cours d'analyse", "description": "Nos \u00e9quipes analysent une anomalie de d\u00e9bit. Situation sous contr\u00f4le."}, {"alert_id": "ALT-004", "type": "Pression basse", "location": "M\u00e9dina", "severity": "Alerte", "lat": 14.693, "lng": -17.456, "date": "2026-03-11 09:50", "status": "Surveillance active", "description": "Pression r\u00e9duite dans ce secteur. Vous pouvez constater un faible d\u00e9bit au robinet."}]
const ZONE_STATUS: Record<string,{potable:boolean;message:string;color:string}> = {"Plateau": {"potable": true, "message": "Eau conforme", "color": "#34d399"}, "M\u00e9dina": {"potable": false, "message": "Surveillance", "color": "#fbbf24"}, "Fann": {"potable": false, "message": "Anomalie", "color": "#fbbf24"}, "HLM": {"potable": true, "message": "Eau conforme", "color": "#34d399"}, "Grand Dakar": {"potable": false, "message": "Incident", "color": "#f87171"}, "Parcelles Assainies": {"potable": true, "message": "Eau conforme", "color": "#34d399"}, "Pikine": {"potable": true, "message": "Eau conforme", "color": "#34d399"}, "Gu\u00e9diawaye": {"potable": true, "message": "Eau conforme", "color": "#34d399"}, "Rufisque": {"potable": true, "message": "Eau conforme", "color": "#34d399"}}
const SEVERITY: Record<string,string> = {Critique:"#f87171",Alerte:"#fbbf24",Moyen:"#a78bfa",Faible:"#94a3b8"}

export function DakarCitizenMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const [mapReady,      setMapReady]      = useState(false)
  const [clock,         setClock]         = useState("")
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [selectedZone,  setSelectedZone]  = useState<string|null>(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [isMobile,      setIsMobile]      = useState(false)
  const [drawerOpen,    setDrawerOpen]    = useState(false)

  useEffect(()=>{
    const check=()=>{ const m=window.innerWidth<768; setIsMobile(m); if(m) setSidebarOpen(false) }
    check(); window.addEventListener("resize",check); return ()=>window.removeEventListener("resize",check)
  },[])

  useEffect(()=>{
    const tick=()=>setClock(new Date().toLocaleTimeString("fr-FR"))
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  },[])

  useEffect(()=>{
    if(mapRef.current) setTimeout(()=>mapRef.current.invalidateSize(),300)
  },[sidebarOpen])

  useEffect(()=>{
    if(mapRef.current||!mapContainerRef.current)return
    import("leaflet").then(lm=>{
      const L=lm.default??lm
      if(mapRef.current||!mapContainerRef.current)return
      const map=L.map(mapContainerRef.current,{center:[14.715,-17.430],zoom:13,zoomControl:false,attributionControl:false})
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:19}).addTo(map)
      L.control.zoom({position:"bottomright"}).addTo(map)
      leafletRef.current=L; mapRef.current=map; setMapReady(true)
    })
    return ()=>{ if(mapRef.current){ mapRef.current.remove(); mapRef.current=null } }
  },[])

  useEffect(()=>{
    if(!mapReady)return
    const L=leafletRef.current; const map=mapRef.current
    if(!L||!map)return
    const nm:Record<string,any>={}
    NODES.forEach((n:any)=>{ nm[n.id]=n })
    INTER_NODES.forEach((n:any)=>{ nm[n.id]=n })

    // Conduites — style citoyen simplifié, mêmes couleurs que l'opérateur
    PIPES.forEach((p:any)=>{
      const f=nm[p.from]; const t=nm[p.to]
      if(!f||!t)return
      const isAlert=ALERTS.some((a:any)=>a.pipe_id===p.id)
      const c=p.risk==="high"?"#f87171":p.risk==="medium"?"#fbbf24":isAlert?"#fb923c":"#22d3ee"
      const w=Math.max(1,(p.diameter_mm||150)/150)
      L.polyline([[f.lat,f.lng],[t.lat,t.lng]],{color:c,weight:w,opacity:0.55}).addTo(map)
    })

    // Réservoirs visibles (pas les jonctions/pompes/vannes — trop technique)
    NODES.filter((n:any)=>n.type==="reservoir").forEach((node:any)=>{
      const icon=L.divIcon({
        html:`<div style="width:28px;height:28px;background:#38bdf818;border:2px solid #38bdf8;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 8px #38bdf855">💧</div>`,
        className:"",iconSize:[28,28],iconAnchor:[14,14],
      })
      L.marker([node.lat,node.lng],{icon}).addTo(map)
        .bindTooltip(`<div style="background:#0f172a;border:1px solid #38bdf833;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px">${node.name}</div>`,{sticky:true,opacity:1})
    })

    // Alertes citoyens
    ALERTS.forEach((alert:any)=>{
      const c=SEVERITY[alert.severity]
      L.circle([alert.lat,alert.lng],{radius:alert.severity==="Critique"?200:140,color:c,fillColor:c,fillOpacity:0.08,weight:1.5,dashArray:"4 4"}).addTo(map)
      const icon=L.divIcon({
        html:`<div style="width:30px;height:30px;border-radius:50%;border:2px solid ${c};background:${c}22;box-shadow:0 0 10px ${c}66;display:flex;align-items:center;justify-content:center;font-size:14px">⚠</div>`,
        className:"",iconSize:[30,30],iconAnchor:[15,15],zIndexOffset:1000,
      })
      L.marker([alert.lat,alert.lng],{icon}).addTo(map)
        .on("click",()=>{ setSelectedAlert(alert); setSelectedZone(null); if(window.innerWidth<768) setDrawerOpen(true) })
    })
  },[mapReady])

  const SW=252

  return (
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",position:"relative",width:"100%",height:"100%",display:"flex"}}>
      <style>{`
        .cz-sb::-webkit-scrollbar{width:3px}
        .cz-sb::-webkit-scrollbar-thumb{background:rgba(34,211,238,.25);border-radius:2px}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
        .leaflet-tooltip::before{display:none!important}
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile&&(
        <div style={{
          width:sidebarOpen?SW:0, minWidth:sidebarOpen?SW:0, height:"100%",
          overflow:"hidden", transition:"width .25s ease,min-width .25s ease",
          background:"#020817", borderRight:"1px solid rgba(34,211,238,.22)",
          display:"flex", flexDirection:"column", flexShrink:0,
        }}>
          <div className="cz-sb" style={{flex:1,overflowY:"auto",width:SW,opacity:sidebarOpen?1:0,transition:"opacity .2s",padding:14,display:"flex",flexDirection:"column",gap:14}}>

            <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>AQUAPULSE — CITOYEN</p>

            {/* Statut par quartier */}
            <div>
              <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>MON QUARTIER</p>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {Object.entries(ZONE_STATUS).map(([zone,info])=>(
                  <div key={zone}
                    onClick={()=>{ setSelectedZone(zone); setSelectedAlert(null); mapRef.current?.setView([14.715,-17.430],13) }}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"5px 8px",borderRadius:6,cursor:"pointer",
                      background:selectedZone===zone?`${(info as any).color}18`:"transparent",
                      border:`1px solid ${selectedZone===zone?(info as any).color+"44":"transparent"}`,
                      transition:"all .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:(info as any).color,flexShrink:0,boxShadow:`0 0 4px ${(info as any).color}88`}}/>
                      <span style={{color:"#94a3b8",fontSize:11}}>{zone}</span>
                    </div>
                    <span style={{color:(info as any).color,fontSize:10,fontWeight:700}}>{(info as any).message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents */}
            <div>
              <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
                INCIDENTS &nbsp;<span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {ALERTS.map((a:any)=>{
                  const c=SEVERITY[a.severity]
                  return (
                    <div key={a.alert_id}
                      onClick={()=>{ setSelectedAlert(a); setSelectedZone(null); mapRef.current?.setView([a.lat,a.lng],15) }}
                      style={{padding:"7px 9px",borderRadius:6,cursor:"pointer",
                        background:selectedAlert?.alert_id===a.alert_id?`${c}10`:"transparent",
                        borderLeft:`3px solid ${c}`,borderTop:`1px solid ${c}22`,borderRight:`1px solid ${c}22`,borderBottom:`1px solid ${c}22`,
                        transition:"all .15s"}}>
                      <div style={{color:c,fontSize:11,fontWeight:700,marginBottom:2}}>{a.type}</div>
                      <div style={{color:"#64748b",fontSize:10}}>{a.location}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{color:"#334155",fontSize:10,textAlign:"center",borderTop:"1px solid rgba(34,211,238,.08)",paddingTop:8}}>
              Mis à jour {clock}
            </div>
          </div>
        </div>
      )}

      {/* ── MAP ZONE ── */}
      <div style={{flex:1,position:"relative",minWidth:0}}>

        {/* Toggle sidebar desktop */}
        {!isMobile&&(
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{
            position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",zIndex:1000,
            width:22,height:56,background:"#020817",border:"1px solid rgba(34,211,238,.35)",
            borderLeft:"none",borderRadius:"0 8px 8px 0",cursor:"pointer",
            color:"#22d3ee",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"3px 0 12px rgba(0,0,0,0.5)",
          }}>{sidebarOpen?"‹":"›"}</button>
        )}

        {/* Mobile FAB */}
        {isMobile&&!drawerOpen&&(
          <button onClick={()=>setDrawerOpen(true)} style={{
            position:"absolute",bottom:90,left:12,zIndex:1000,
            background:"#020817",border:"1px solid rgba(34,211,238,.4)",borderRadius:12,
            padding:"10px 16px",color:"#22d3ee",fontSize:11,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 20px rgba(0,0,0,0.6)",display:"flex",alignItems:"center",gap:6,
          }}>
            💧 Mon eau
          </button>
        )}

        <div ref={mapContainerRef} style={{width:"100%",height:"100%"}}/>

        {/* Légende */}
        <div style={{position:"absolute",bottom:40,right:12,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,padding:"10px 14px"}}>
          <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:6}}>LÉGENDE</p>
          {[
            {c:"#34d399",l:"Eau conforme"},
            {c:"#fbbf24",l:"Sous surveillance"},
            {c:"#f87171",l:"Incident"},
            {c:"#22d3ee",l:"Réseau normal"},
            {c:"#f87171",l:"Conduite à risque"},
          ].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
              <span style={{color:"#64748b",fontSize:10}}>{x.l}</span>
            </div>
          ))}
        </div>

        {/* Panneau détail desktop */}
        {!isMobile&&(selectedAlert||selectedZone)&&(
          <div style={{position:"absolute",right:12,top:12,width:230,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,padding:14,maxHeight:"calc(100% - 24px)",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>{selectedAlert?"INCIDENT":"MON QUARTIER"}</span>
              <button onClick={()=>{ setSelectedAlert(null); setSelectedZone(null) }}
                style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <DetailContent selectedAlert={selectedAlert} selectedZone={selectedZone}/>
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM DRAWER ── */}
      {isMobile&&(
        <>
          {drawerOpen&&<div onClick={()=>setDrawerOpen(false)} style={{position:"absolute",inset:0,zIndex:29,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(2px)"}}/>}
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,zIndex:30,
            background:"#020817",borderRadius:"20px 20px 0 0",
            border:"1px solid rgba(34,211,238,.22)",borderBottom:"none",
            boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
            transform:drawerOpen?"translateY(0)":"translateY(100%)",
            transition:"transform .3s cubic-bezier(0.32,0.72,0,1)",
            maxHeight:"72vh",display:"flex",flexDirection:"column",
          }}>
            {/* Handle */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0 4px",cursor:"pointer"}} onClick={()=>setDrawerOpen(false)}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(34,211,238,.3)"}}/>
            </div>
            <div className="cz-sb" style={{flex:1,overflowY:"auto"}}>
              {(selectedAlert||selectedZone)?(
                <div style={{padding:"0 16px 24px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>{selectedAlert?"INCIDENT":"MON QUARTIER"}</span>
                    <button onClick={()=>{ setSelectedAlert(null); setSelectedZone(null) }}
                      style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:18}}>✕</button>
                  </div>
                  <DetailContent selectedAlert={selectedAlert} selectedZone={selectedZone}/>
                </div>
              ):(
                <MobileMenuContent clock={clock} selectedAlert={selectedAlert} selectedZone={selectedZone}
                  onSelectAlert={(a)=>{ setSelectedAlert(a); setSelectedZone(null); mapRef.current?.setView([a.lat,a.lng],15) }}
                  onSelectZone={(z)=>{ setSelectedZone(z); setSelectedAlert(null) }}/>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailContent({selectedAlert,selectedZone}:{selectedAlert:any;selectedZone:string|null}) {
  if(selectedAlert) {
    const c=SEVERITY[selectedAlert.severity]
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`${c}12`,border:`1px solid ${c}44`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{color:c,fontSize:14,fontWeight:700,marginBottom:4}}>
            {selectedAlert.severity==="Critique"?"🔴":"⚠️"} {selectedAlert.type}
          </div>
          <div style={{color:"#64748b",fontSize:11}}>{selectedAlert.location}</div>
        </div>
        <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.65,margin:0}}>{selectedAlert.description}</p>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:"#475569"}}>Statut</span>
          <span style={{color:"#e2e8f0",fontWeight:600}}>{selectedAlert.status}</span>
        </div>
        {selectedAlert.severity==="Critique"&&(
          <div style={{background:"#fbbf2411",border:"1px solid #fbbf2433",borderRadius:6,padding:"8px 10px"}}>
            <p style={{color:"#fbbf24",fontSize:11,margin:0,lineHeight:1.5}}>💡 Conservez de l'eau en bouteille par précaution.</p>
          </div>
        )}
      </div>
    )
  }
  if(selectedZone) {
    const info=ZONE_STATUS[selectedZone]
    if(!info)return null
    const zAlerts=ALERTS.filter((a:any)=>a.location.includes(selectedZone))
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`${info.color}12`,border:`1px solid ${info.color}44`,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:4}}>{info.potable?"✅":"⚠️"}</div>
          <div style={{color:info.color,fontSize:14,fontWeight:700}}>{info.message}</div>
          <div style={{color:"#64748b",fontSize:11,marginTop:4}}>{selectedZone}</div>
        </div>
        <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.6,margin:0}}>
          {info.potable?"L'eau du robinet est conforme aux normes dans votre quartier.":"Une anomalie a été détectée dans votre secteur. Les équipes techniques interviennent."}
        </p>
        {zAlerts.length>0&&(
          <div>
            <p style={{color:"#64748b",fontSize:10,marginBottom:6}}>Incidents en cours :</p>
            {zAlerts.map((a:any)=>(
              <div key={a.alert_id} style={{padding:"6px 8px",borderRadius:5,background:`${SEVERITY[a.severity]}0d`,borderLeft:`3px solid ${SEVERITY[a.severity]}`,marginBottom:4,color:"#94a3b8",fontSize:11}}>
                {a.type} — {a.status}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

function MobileMenuContent({clock,selectedAlert,selectedZone,onSelectAlert,onSelectZone}:{
  clock:string;selectedAlert:any;selectedZone:string|null;onSelectAlert:(a:any)=>void;onSelectZone:(z:string)=>void
}) {
  return (
    <div style={{padding:"4px 16px 24px",display:"flex",flexDirection:"column",gap:14}}>
      <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>AQUAPULSE — CITOYEN</p>
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>MON QUARTIER</p>
        {Object.entries(ZONE_STATUS).map(([zone,info])=>(
          <div key={zone} onClick={()=>onSelectZone(zone)}
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:4,
              background:selectedZone===zone?`${(info as any).color}18`:"transparent",
              border:`1px solid ${selectedZone===zone?(info as any).color+"44":"rgba(34,211,238,.06)"}`,transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:(info as any).color}}/>
              <span style={{color:"#94a3b8",fontSize:12}}>{zone}</span>
            </div>
            <span style={{color:(info as any).color,fontSize:11,fontWeight:700}}>{(info as any).message}</span>
          </div>
        ))}
      </div>
      <div>
        <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
          INCIDENTS &nbsp;<span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
        </p>
        {ALERTS.map((a:any)=>{
          const c=SEVERITY[a.severity]
          return (
            <div key={a.alert_id} onClick={()=>onSelectAlert(a)}
              style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",marginBottom:5,
                borderLeft:`3px solid ${c}`,borderTop:`1px solid ${c}22`,borderRight:`1px solid ${c}22`,borderBottom:`1px solid ${c}22`,
                background:selectedAlert?.alert_id===a.alert_id?`${c}10`:"transparent"}}>
              <div style={{color:c,fontSize:12,fontWeight:700}}>{a.type}</div>
              <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{a.location}</div>
            </div>
          )
        })}
      </div>
      <div style={{color:"#334155",fontSize:10,textAlign:"center",borderTop:"1px solid rgba(34,211,238,.08)",paddingTop:8}}>
        Mis à jour {clock}
      </div>
    </div>
  )
}
