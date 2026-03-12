"use client"

import { useEffect, useRef, useState } from "react"

const NODES = [{"id": "R1", "type": "reservoir", "name": "Ch\u00e2teau d'Eau Plateau", "lat": 14.693, "lng": -17.445, "zone": "Plateau", "capacity_m3": 50000}, {"id": "R2", "type": "reservoir", "name": "R\u00e9servoir M\u00e9dina", "lat": 14.688, "lng": -17.46, "zone": "M\u00e9dina", "capacity_m3": 35000}, {"id": "R3", "type": "reservoir", "name": "R\u00e9servoir Pikine", "lat": 14.752, "lng": -17.388, "zone": "Pikine", "capacity_m3": 45000}, {"id": "R4", "type": "reservoir", "name": "R\u00e9servoir Parcelles", "lat": 14.733, "lng": -17.412, "zone": "Parcelles Assainies", "capacity_m3": 30000}, {"id": "P1", "type": "pump", "name": "Station Pompage Fann", "lat": 14.7, "lng": -17.463, "zone": "Fann", "flow_m3h": 1200}, {"id": "P2", "type": "pump", "name": "Station Pompage HLM", "lat": 14.71, "lng": -17.443, "zone": "HLM", "flow_m3h": 900}, {"id": "P3", "type": "pump", "name": "Station Pompage Parcelles", "lat": 14.73, "lng": -17.415, "zone": "Parcelles Assainies", "flow_m3h": 1100}, {"id": "P4", "type": "pump", "name": "Station Pompage Gu\u00e9diawaye", "lat": 14.745, "lng": -17.407, "zone": "Gu\u00e9diawaye", "flow_m3h": 800}, {"id": "V1", "type": "valve", "name": "Vanne M\u00e9dina Nord", "lat": 14.694, "lng": -17.452, "zone": "M\u00e9dina", "open_pct": 100}, {"id": "V2", "type": "valve", "name": "Vanne Grand Dakar", "lat": 14.714, "lng": -17.432, "zone": "Grand Dakar", "open_pct": 75}, {"id": "V3", "type": "valve", "name": "Vanne Gu\u00e9diawaye", "lat": 14.742, "lng": -17.405, "zone": "Gu\u00e9diawaye", "open_pct": 100}, {"id": "V4", "type": "valve", "name": "Vanne Rufisque", "lat": 14.718, "lng": -17.37, "zone": "Rufisque", "open_pct": 85}, {"id": "J1", "type": "junction", "name": "N\u0153ud Central Plateau", "lat": 14.69, "lng": -17.449, "zone": "Plateau"}, {"id": "J2", "type": "junction", "name": "N\u0153ud HLM-M\u00e9dina", "lat": 14.707, "lng": -17.438, "zone": "HLM"}, {"id": "J3", "type": "junction", "name": "N\u0153ud Pikine Est", "lat": 14.75, "lng": -17.392, "zone": "Pikine"}, {"id": "J4", "type": "junction", "name": "N\u0153ud Parcelles-Gu\u00e9diawaye", "lat": 14.738, "lng": -17.41, "zone": "Parcelles Assainies"}, {"id": "J5", "type": "junction", "name": "N\u0153ud Grand Dakar Sud", "lat": 14.72, "lng": -17.425, "zone": "Grand Dakar"}]
const INTER_NODES = [{"id": "N1", "zone": "Plateau", "lat": 14.694067, "lng": -17.454375}, {"id": "N2", "zone": "Plateau", "lat": 14.686051, "lng": -17.44942}, {"id": "N3", "zone": "Plateau", "lat": 14.696202, "lng": -17.438083}, {"id": "N4", "zone": "Plateau", "lat": 14.699628, "lng": -17.452827}, {"id": "N5", "zone": "Plateau", "lat": 14.689282, "lng": -17.454255}, {"id": "N6", "zone": "Plateau", "lat": 14.68481, "lng": -17.442366}, {"id": "N7", "zone": "Plateau", "lat": 14.680584, "lng": -17.450029}, {"id": "N8", "zone": "Plateau", "lat": 14.694297, "lng": -17.441376}, {"id": "N9", "zone": "Plateau", "lat": 14.68485, "lng": -17.440268}, {"id": "N10", "zone": "Plateau", "lat": 14.697807, "lng": -17.454838}, {"id": "N11", "zone": "M\u00e9dina", "lat": 14.696116, "lng": -17.453132}, {"id": "N12", "zone": "M\u00e9dina", "lat": 14.686805, "lng": -17.462357}, {"id": "N13", "zone": "M\u00e9dina", "lat": 14.699144, "lng": -17.459278}, {"id": "N14", "zone": "M\u00e9dina", "lat": 14.681855, "lng": -17.463356}, {"id": "N15", "zone": "M\u00e9dina", "lat": 14.69695, "lng": -17.454737}, {"id": "N16", "zone": "M\u00e9dina", "lat": 14.696143, "lng": -17.452595}, {"id": "N17", "zone": "M\u00e9dina", "lat": 14.690725, "lng": -17.448457}, {"id": "N18", "zone": "M\u00e9dina", "lat": 14.687571, "lng": -17.455615}, {"id": "N19", "zone": "M\u00e9dina", "lat": 14.696588, "lng": -17.454485}, {"id": "N20", "zone": "M\u00e9dina", "lat": 14.697234, "lng": -17.455185}, {"id": "N21", "zone": "Fann", "lat": 14.706091, "lng": -17.471221}, {"id": "N22", "zone": "Fann", "lat": 14.696558, "lng": -17.46708}, {"id": "N23", "zone": "Fann", "lat": 14.693596, "lng": -17.468043}, {"id": "N24", "zone": "Fann", "lat": 14.69402, "lng": -17.467274}, {"id": "N25", "zone": "Fann", "lat": 14.704714, "lng": -17.465798}, {"id": "N26", "zone": "Fann", "lat": 14.699404, "lng": -17.468438}, {"id": "N27", "zone": "Fann", "lat": 14.69734, "lng": -17.456077}, {"id": "N28", "zone": "Fann", "lat": 14.704961, "lng": -17.461645}, {"id": "N29", "zone": "HLM", "lat": 14.70308, "lng": -17.43823}, {"id": "N30", "zone": "HLM", "lat": 14.702941, "lng": -17.446273}, {"id": "N31", "zone": "HLM", "lat": 14.717811, "lng": -17.44028}, {"id": "N32", "zone": "HLM", "lat": 14.710025, "lng": -17.439254}, {"id": "N33", "zone": "HLM", "lat": 14.715171, "lng": -17.437152}, {"id": "N34", "zone": "HLM", "lat": 14.704123, "lng": -17.454262}, {"id": "N35", "zone": "HLM", "lat": 14.705678, "lng": -17.448842}, {"id": "N36", "zone": "HLM", "lat": 14.703798, "lng": -17.433313}, {"id": "N37", "zone": "Grand Dakar", "lat": 14.721775, "lng": -17.436504}, {"id": "N38", "zone": "Grand Dakar", "lat": 14.717798, "lng": -17.434318}, {"id": "N39", "zone": "Grand Dakar", "lat": 14.722462, "lng": -17.432611}, {"id": "N40", "zone": "Grand Dakar", "lat": 14.710768, "lng": -17.438341}, {"id": "N41", "zone": "Grand Dakar", "lat": 14.716105, "lng": -17.437906}, {"id": "N42", "zone": "Grand Dakar", "lat": 14.716523, "lng": -17.420759}, {"id": "N43", "zone": "Grand Dakar", "lat": 14.713189, "lng": -17.439078}, {"id": "N44", "zone": "Grand Dakar", "lat": 14.723956, "lng": -17.431243}, {"id": "N45", "zone": "Parcelles Assainies", "lat": 14.722, "lng": -17.426775}, {"id": "N46", "zone": "Parcelles Assainies", "lat": 14.722412, "lng": -17.411686}, {"id": "N47", "zone": "Parcelles Assainies", "lat": 14.737426, "lng": -17.417024}, {"id": "N48", "zone": "Parcelles Assainies", "lat": 14.721398, "lng": -17.418078}, {"id": "N49", "zone": "Parcelles Assainies", "lat": 14.741915, "lng": -17.414243}, {"id": "N50", "zone": "Parcelles Assainies", "lat": 14.741364, "lng": -17.40562}, {"id": "N51", "zone": "Parcelles Assainies", "lat": 14.720253, "lng": -17.409261}, {"id": "N52", "zone": "Parcelles Assainies", "lat": 14.734998, "lng": -17.414039}, {"id": "N53", "zone": "Pikine", "lat": 14.744404, "lng": -17.385771}, {"id": "N54", "zone": "Pikine", "lat": 14.740677, "lng": -17.391957}, {"id": "N55", "zone": "Pikine", "lat": 14.748889, "lng": -17.376386}, {"id": "N56", "zone": "Pikine", "lat": 14.75902, "lng": -17.397098}, {"id": "N57", "zone": "Pikine", "lat": 14.750014, "lng": -17.39964}, {"id": "N58", "zone": "Pikine", "lat": 14.759903, "lng": -17.378884}, {"id": "N59", "zone": "Pikine", "lat": 14.745163, "lng": -17.385832}, {"id": "N60", "zone": "Pikine", "lat": 14.752615, "lng": -17.400415}, {"id": "N61", "zone": "Pikine", "lat": 14.7563, "lng": -17.388819}, {"id": "N62", "zone": "Pikine", "lat": 14.756687, "lng": -17.389089}, {"id": "N63", "zone": "Gu\u00e9diawaye", "lat": 14.734013, "lng": -17.411896}, {"id": "N64", "zone": "Gu\u00e9diawaye", "lat": 14.734428, "lng": -17.396773}, {"id": "N65", "zone": "Gu\u00e9diawaye", "lat": 14.753332, "lng": -17.399208}, {"id": "N66", "zone": "Gu\u00e9diawaye", "lat": 14.740765, "lng": -17.418552}, {"id": "N67", "zone": "Gu\u00e9diawaye", "lat": 14.753316, "lng": -17.396326}, {"id": "N68", "zone": "Gu\u00e9diawaye", "lat": 14.735884, "lng": -17.40785}, {"id": "N69", "zone": "Gu\u00e9diawaye", "lat": 14.735523, "lng": -17.400985}, {"id": "N70", "zone": "Gu\u00e9diawaye", "lat": 14.750848, "lng": -17.41679}, {"id": "N71", "zone": "Rufisque", "lat": 14.719506, "lng": -17.368506}, {"id": "N72", "zone": "Rufisque", "lat": 14.715301, "lng": -17.358827}, {"id": "N73", "zone": "Rufisque", "lat": 14.718463, "lng": -17.378646}, {"id": "N74", "zone": "Rufisque", "lat": 14.720786, "lng": -17.363102}, {"id": "N75", "zone": "Rufisque", "lat": 14.714023, "lng": -17.375649}, {"id": "N76", "zone": "Rufisque", "lat": 14.729903, "lng": -17.365504}, {"id": "N77", "zone": "Rufisque", "lat": 14.718762, "lng": -17.369473}, {"id": "N78", "zone": "Rufisque", "lat": 14.71242, "lng": -17.378259}]
const PIPES = [{"id": "PIPE-01", "from": "R1", "to": "P1", "diameter_mm": 400, "length_m": 2144, "material": "fonte", "zone": "Plateau-Fann"}, {"id": "PIPE-02", "from": "R1", "to": "J1", "diameter_mm": 350, "length_m": 555, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-03", "from": "P1", "to": "J1", "diameter_mm": 300, "length_m": 1910, "material": "PVC", "zone": "Fann-Plateau"}, {"id": "PIPE-04", "from": "J1", "to": "V1", "diameter_mm": 300, "length_m": 555, "material": "PVC", "zone": "Plateau-M\u00e9dina"}, {"id": "PIPE-05", "from": "V1", "to": "R2", "diameter_mm": 300, "length_m": 1110, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-06", "from": "R2", "to": "J2", "diameter_mm": 350, "length_m": 3227, "material": "PVC", "zone": "M\u00e9dina-HLM"}, {"id": "PIPE-07", "from": "J1", "to": "J2", "diameter_mm": 250, "length_m": 2248, "material": "amiante-ciment", "zone": "Plateau-HLM", "age_years": 35, "risk": "high"}, {"id": "PIPE-08", "from": "J2", "to": "P2", "diameter_mm": 300, "length_m": 647, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-09", "from": "P2", "to": "V2", "diameter_mm": 250, "length_m": 1299, "material": "PVC", "zone": "HLM-Grand Dakar"}, {"id": "PIPE-10", "from": "V2", "to": "J5", "diameter_mm": 300, "length_m": 1023, "material": "fonte", "zone": "Grand Dakar"}, {"id": "PIPE-11", "from": "J5", "to": "P3", "diameter_mm": 300, "length_m": 1570, "material": "PVC", "zone": "Grand Dakar-Parcelles Assainies"}, {"id": "PIPE-12", "from": "P3", "to": "R4", "diameter_mm": 350, "length_m": 471, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-13", "from": "R4", "to": "J4", "diameter_mm": 300, "length_m": 598, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-14", "from": "J4", "to": "P4", "diameter_mm": 300, "length_m": 845, "material": "PVC", "zone": "Parcelles Assainies-Gu\u00e9diawaye"}, {"id": "PIPE-15", "from": "P4", "to": "V3", "diameter_mm": 300, "length_m": 400, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-16", "from": "V3", "to": "R3", "diameter_mm": 400, "length_m": 2189, "material": "acier", "zone": "Gu\u00e9diawaye-Pikine"}, {"id": "PIPE-17", "from": "R3", "to": "J3", "diameter_mm": 350, "length_m": 496, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-18", "from": "J3", "to": "J4", "diameter_mm": 250, "length_m": 2401, "material": "fonte", "zone": "Pikine-Parcelles Assainies", "age_years": 28, "risk": "medium"}, {"id": "PIPE-19", "from": "J2", "to": "J5", "diameter_mm": 200, "length_m": 2041, "material": "PVC", "zone": "HLM-Grand Dakar"}, {"id": "PIPE-20", "from": "J5", "to": "J4", "diameter_mm": 200, "length_m": 2601, "material": "PVC", "zone": "Grand Dakar-Parcelles Assainies"}, {"id": "PIPE-21", "from": "V2", "to": "V4", "diameter_mm": 200, "length_m": 6896, "material": "fonte", "zone": "Grand Dakar-Rufisque", "age_years": 22, "risk": "medium"}, {"id": "PIPE-22", "from": "V4", "to": "J3", "diameter_mm": 250, "length_m": 4310, "material": "PVC", "zone": "Rufisque-Pikine"}, {"id": "PIPE-023", "from": "N1", "to": "V1", "diameter_mm": 150, "length_m": 264, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-024", "from": "N1", "to": "N10", "diameter_mm": 125, "length_m": 418, "material": "PEHD", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-025", "from": "N1", "to": "N5", "diameter_mm": 125, "length_m": 531, "material": "acier", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-026", "from": "N2", "to": "J1", "diameter_mm": 100, "length_m": 441, "material": "PEHD", "zone": "Plateau", "age_years": 38, "risk": "high"}, {"id": "PIPE-027", "from": "N2", "to": "N7", "diameter_mm": 100, "length_m": 611, "material": "PVC", "zone": "Plateau", "age_years": 10}, {"id": "PIPE-028", "from": "N2", "to": "N5", "diameter_mm": 80, "length_m": 645, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-029", "from": "N3", "to": "R1", "diameter_mm": 80, "length_m": 846, "material": "PVC", "zone": "Plateau", "age_years": 25, "risk": "medium"}, {"id": "PIPE-030", "from": "N3", "to": "N8", "diameter_mm": 150, "length_m": 422, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-031", "from": "N3", "to": "N9", "diameter_mm": 100, "length_m": 1283, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-032", "from": "N4", "to": "V1", "diameter_mm": 100, "length_m": 631, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-033", "from": "N4", "to": "N10", "diameter_mm": 80, "length_m": 301, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-034", "from": "N4", "to": "N1", "diameter_mm": 150, "length_m": 641, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-035", "from": "N5", "to": "V1", "diameter_mm": 200, "length_m": 580, "material": "PVC", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-036", "from": "N6", "to": "J1", "diameter_mm": 200, "length_m": 935, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-037", "from": "N6", "to": "N9", "diameter_mm": 125, "length_m": 233, "material": "fonte", "zone": "Plateau", "age_years": 20, "risk": "medium"}, {"id": "PIPE-038", "from": "N6", "to": "N2", "diameter_mm": 125, "length_m": 795, "material": "PEHD", "zone": "Plateau"}, {"id": "PIPE-039", "from": "N7", "to": "J1", "diameter_mm": 150, "length_m": 1051, "material": "PEHD", "zone": "Plateau", "age_years": 18}, {"id": "PIPE-040", "from": "N7", "to": "N6", "diameter_mm": 150, "length_m": 971, "material": "fonte", "zone": "Plateau", "age_years": 10}, {"id": "PIPE-041", "from": "N8", "to": "R1", "diameter_mm": 80, "length_m": 427, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-042", "from": "N8", "to": "N9", "diameter_mm": 80, "length_m": 1056, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-043", "from": "N9", "to": "R1", "diameter_mm": 200, "length_m": 1046, "material": "fonte", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-044", "from": "N9", "to": "N2", "diameter_mm": 125, "length_m": 1025, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-045", "from": "N10", "to": "V1", "diameter_mm": 125, "length_m": 527, "material": "fonte", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-046", "from": "N11", "to": "V1", "diameter_mm": 150, "length_m": 266, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-047", "from": "N11", "to": "N16", "diameter_mm": 125, "length_m": 60, "material": "PVC", "zone": "M\u00e9dina", "age_years": 30, "risk": "high"}, {"id": "PIPE-048", "from": "N11", "to": "N19", "diameter_mm": 80, "length_m": 159, "material": "PVC", "zone": "M\u00e9dina", "age_years": 30, "risk": "high"}, {"id": "PIPE-049", "from": "N12", "to": "R2", "diameter_mm": 250, "length_m": 293, "material": "PVC", "zone": "M\u00e9dina", "age_years": 18}, {"id": "PIPE-050", "from": "N12", "to": "N14", "diameter_mm": 125, "length_m": 561, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-051", "from": "N12", "to": "N18", "diameter_mm": 100, "length_m": 753, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-052", "from": "N13", "to": "P1", "diameter_mm": 200, "length_m": 424, "material": "PEHD", "zone": "M\u00e9dina", "age_years": 18}, {"id": "PIPE-053", "from": "N13", "to": "N20", "diameter_mm": 100, "length_m": 501, "material": "PVC", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-054", "from": "N13", "to": "N15", "diameter_mm": 150, "length_m": 560, "material": "fonte", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-055", "from": "N14", "to": "R2", "diameter_mm": 80, "length_m": 777, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-056", "from": "N14", "to": "N18", "diameter_mm": 125, "length_m": 1068, "material": "PVC", "zone": "M\u00e9dina", "age_years": 20, "risk": "medium"}, {"id": "PIPE-057", "from": "N15", "to": "V1", "diameter_mm": 125, "length_m": 447, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-058", "from": "N15", "to": "N19", "diameter_mm": 125, "length_m": 49, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-059", "from": "N15", "to": "N20", "diameter_mm": 150, "length_m": 59, "material": "PVC", "zone": "M\u00e9dina", "age_years": 20, "risk": "medium"}, {"id": "PIPE-060", "from": "N16", "to": "V1", "diameter_mm": 80, "length_m": 247, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-061", "from": "N16", "to": "N19", "diameter_mm": 80, "length_m": 216, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-062", "from": "N17", "to": "J1", "diameter_mm": 200, "length_m": 101, "material": "PVC", "zone": "M\u00e9dina", "age_years": 25, "risk": "medium"}, {"id": "PIPE-063", "from": "N17", "to": "N16", "diameter_mm": 150, "length_m": 757, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-064", "from": "N17", "to": "N11", "diameter_mm": 125, "length_m": 792, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-065", "from": "N18", "to": "R2", "diameter_mm": 125, "length_m": 489, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-066", "from": "N18", "to": "N17", "diameter_mm": 80, "length_m": 868, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-067", "from": "N19", "to": "V1", "diameter_mm": 200, "length_m": 398, "material": "PVC", "zone": "M\u00e9dina", "age_years": 32, "risk": "high"}, {"id": "PIPE-068", "from": "N19", "to": "N20", "diameter_mm": 100, "length_m": 106, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-069", "from": "N20", "to": "V1", "diameter_mm": 100, "length_m": 504, "material": "acier", "zone": "M\u00e9dina"}, {"id": "PIPE-070", "from": "N21", "to": "P1", "diameter_mm": 100, "length_m": 1136, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-071", "from": "N21", "to": "N25", "diameter_mm": 150, "length_m": 621, "material": "PEHD", "zone": "Fann", "age_years": 10}, {"id": "PIPE-072", "from": "N21", "to": "N26", "diameter_mm": 125, "length_m": 804, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-073", "from": "N22", "to": "P1", "diameter_mm": 150, "length_m": 593, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-074", "from": "N22", "to": "N24", "diameter_mm": 150, "length_m": 283, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-075", "from": "N22", "to": "N23", "diameter_mm": 150, "length_m": 346, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-076", "from": "N23", "to": "P1", "diameter_mm": 100, "length_m": 905, "material": "PEHD", "zone": "Fann", "age_years": 18}, {"id": "PIPE-077", "from": "N23", "to": "N24", "diameter_mm": 100, "length_m": 97, "material": "acier", "zone": "Fann"}, {"id": "PIPE-078", "from": "N24", "to": "P1", "diameter_mm": 125, "length_m": 816, "material": "PEHD", "zone": "Fann", "age_years": 25, "risk": "medium"}, {"id": "PIPE-079", "from": "N25", "to": "P1", "diameter_mm": 125, "length_m": 608, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-080", "from": "N25", "to": "N28", "diameter_mm": 150, "length_m": 462, "material": "PVC", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-081", "from": "N26", "to": "P1", "diameter_mm": 80, "length_m": 607, "material": "PVC", "zone": "Fann", "age_years": 25, "risk": "medium"}, {"id": "PIPE-082", "from": "N26", "to": "N22", "diameter_mm": 100, "length_m": 350, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-083", "from": "N26", "to": "N24", "diameter_mm": 80, "length_m": 611, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-084", "from": "N27", "to": "V1", "diameter_mm": 125, "length_m": 585, "material": "PVC", "zone": "Fann", "age_years": 32, "risk": "high"}, {"id": "PIPE-085", "from": "N27", "to": "N28", "diameter_mm": 150, "length_m": 1048, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-086", "from": "N27", "to": "N22", "diameter_mm": 80, "length_m": 1224, "material": "acier", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-087", "from": "N28", "to": "P1", "diameter_mm": 125, "length_m": 571, "material": "PVC", "zone": "Fann", "age_years": 12}, {"id": "PIPE-088", "from": "N28", "to": "N26", "diameter_mm": 80, "length_m": 974, "material": "PVC", "zone": "Fann", "age_years": 20, "risk": "medium"}, {"id": "PIPE-089", "from": "N29", "to": "J2", "diameter_mm": 125, "length_m": 436, "material": "acier", "zone": "HLM", "age_years": 12}, {"id": "PIPE-090", "from": "N29", "to": "N36", "diameter_mm": 125, "length_m": 552, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-091", "from": "N29", "to": "N32", "diameter_mm": 80, "length_m": 779, "material": "PVC", "zone": "HLM", "age_years": 10}, {"id": "PIPE-092", "from": "N30", "to": "P2", "diameter_mm": 200, "length_m": 864, "material": "fonte", "zone": "HLM", "age_years": 18}, {"id": "PIPE-093", "from": "N30", "to": "N35", "diameter_mm": 125, "length_m": 417, "material": "acier", "zone": "HLM", "age_years": 20, "risk": "medium"}, {"id": "PIPE-094", "from": "N30", "to": "N29", "diameter_mm": 100, "length_m": 893, "material": "PEHD", "zone": "HLM", "age_years": 10}, {"id": "PIPE-095", "from": "N31", "to": "P2", "diameter_mm": 250, "length_m": 918, "material": "acier", "zone": "HLM", "age_years": 32, "risk": "high"}, {"id": "PIPE-096", "from": "N31", "to": "N33", "diameter_mm": 125, "length_m": 454, "material": "acier", "zone": "HLM"}, {"id": "PIPE-097", "from": "N31", "to": "N32", "diameter_mm": 80, "length_m": 872, "material": "fonte", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-098", "from": "N32", "to": "J2", "diameter_mm": 100, "length_m": 363, "material": "acier", "zone": "HLM", "age_years": 18}, {"id": "PIPE-099", "from": "N32", "to": "N33", "diameter_mm": 125, "length_m": 617, "material": "acier", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-100", "from": "N33", "to": "V2", "diameter_mm": 150, "length_m": 586, "material": "PVC", "zone": "HLM", "age_years": 38, "risk": "high"}, {"id": "PIPE-101", "from": "N34", "to": "P1", "diameter_mm": 200, "length_m": 1072, "material": "acier", "zone": "HLM", "age_years": 12}, {"id": "PIPE-102", "from": "N34", "to": "N35", "diameter_mm": 80, "length_m": 626, "material": "fonte", "zone": "HLM"}, {"id": "PIPE-103", "from": "N34", "to": "N30", "diameter_mm": 125, "length_m": 896, "material": "PVC", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-104", "from": "N35", "to": "P2", "diameter_mm": 250, "length_m": 807, "material": "fonte", "zone": "HLM", "age_years": 12}, {"id": "PIPE-105", "from": "N36", "to": "J2", "diameter_mm": 100, "length_m": 630, "material": "PEHD", "zone": "HLM", "age_years": 12}, {"id": "PIPE-106", "from": "N36", "to": "N32", "diameter_mm": 80, "length_m": 955, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-107", "from": "N37", "to": "V2", "diameter_mm": 200, "length_m": 997, "material": "PEHD", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-108", "from": "N37", "to": "N39", "diameter_mm": 150, "length_m": 439, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-109", "from": "N37", "to": "N38", "diameter_mm": 100, "length_m": 504, "material": "PVC", "zone": "Grand Dakar", "age_years": 30, "risk": "high"}, {"id": "PIPE-110", "from": "N38", "to": "V2", "diameter_mm": 150, "length_m": 494, "material": "acier", "zone": "Grand Dakar", "age_years": 32, "risk": "high"}, {"id": "PIPE-111", "from": "N38", "to": "N41", "diameter_mm": 100, "length_m": 440, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-112", "from": "N39", "to": "J5", "diameter_mm": 80, "length_m": 888, "material": "PEHD", "zone": "Grand Dakar"}, {"id": "PIPE-113", "from": "N39", "to": "N44", "diameter_mm": 100, "length_m": 225, "material": "PEHD", "zone": "Grand Dakar", "age_years": 20, "risk": "medium"}, {"id": "PIPE-114", "from": "N40", "to": "J2", "diameter_mm": 80, "length_m": 420, "material": "PVC", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-115", "from": "N40", "to": "N43", "diameter_mm": 80, "length_m": 281, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-116", "from": "N40", "to": "N41", "diameter_mm": 150, "length_m": 594, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-117", "from": "N41", "to": "V2", "diameter_mm": 150, "length_m": 696, "material": "PVC", "zone": "Grand Dakar", "age_years": 25, "risk": "medium"}, {"id": "PIPE-118", "from": "N41", "to": "N43", "diameter_mm": 150, "length_m": 349, "material": "PEHD", "zone": "Grand Dakar", "age_years": 30, "risk": "high"}, {"id": "PIPE-119", "from": "N42", "to": "J5", "diameter_mm": 100, "length_m": 609, "material": "PVC", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-120", "from": "N42", "to": "N44", "diameter_mm": 150, "length_m": 1427, "material": "fonte", "zone": "Grand Dakar", "age_years": 20, "risk": "medium"}, {"id": "PIPE-121", "from": "N42", "to": "N39", "diameter_mm": 125, "length_m": 1472, "material": "PEHD", "zone": "Grand Dakar"}, {"id": "PIPE-122", "from": "N43", "to": "P2", "diameter_mm": 250, "length_m": 561, "material": "PEHD", "zone": "Grand Dakar", "age_years": 38, "risk": "high"}, {"id": "PIPE-123", "from": "N44", "to": "J5", "diameter_mm": 150, "length_m": 820, "material": "PVC", "zone": "Grand Dakar", "age_years": 18}, {"id": "PIPE-124", "from": "N44", "to": "N37", "diameter_mm": 100, "length_m": 632, "material": "fonte", "zone": "Grand Dakar", "age_years": 10}, {"id": "PIPE-125", "from": "N45", "to": "J5", "diameter_mm": 125, "length_m": 297, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 25, "risk": "medium"}, {"id": "PIPE-126", "from": "N45", "to": "N48", "diameter_mm": 100, "length_m": 968, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-127", "from": "N45", "to": "N46", "diameter_mm": 150, "length_m": 1676, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-128", "from": "N46", "to": "P3", "diameter_mm": 250, "length_m": 919, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-129", "from": "N46", "to": "N51", "diameter_mm": 150, "length_m": 360, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-130", "from": "N46", "to": "N48", "diameter_mm": 150, "length_m": 718, "material": "acier", "zone": "Parcelles Assainies", "age_years": 10}, {"id": "PIPE-131", "from": "N47", "to": "R4", "diameter_mm": 100, "length_m": 743, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-132", "from": "N47", "to": "N52", "diameter_mm": 150, "length_m": 427, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-133", "from": "N47", "to": "N49", "diameter_mm": 80, "length_m": 586, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 30, "risk": "high"}, {"id": "PIPE-134", "from": "N48", "to": "J5", "diameter_mm": 150, "length_m": 784, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 32, "risk": "high"}, {"id": "PIPE-135", "from": "N49", "to": "J4", "diameter_mm": 125, "length_m": 641, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 25, "risk": "medium"}, {"id": "PIPE-136", "from": "N49", "to": "N52", "diameter_mm": 150, "length_m": 768, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-137", "from": "N50", "to": "V3", "diameter_mm": 150, "length_m": 99, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 12}, {"id": "PIPE-138", "from": "N50", "to": "N49", "diameter_mm": 150, "length_m": 959, "material": "acier", "zone": "Parcelles Assainies", "age_years": 10}, {"id": "PIPE-139", "from": "N50", "to": "N52", "diameter_mm": 150, "length_m": 1172, "material": "fonte", "zone": "Parcelles Assainies"}, {"id": "PIPE-140", "from": "N51", "to": "P3", "diameter_mm": 250, "length_m": 1256, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 32, "risk": "high"}, {"id": "PIPE-141", "from": "N51", "to": "N48", "diameter_mm": 100, "length_m": 987, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 20, "risk": "medium"}, {"id": "PIPE-142", "from": "N52", "to": "R4", "diameter_mm": 150, "length_m": 317, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-143", "from": "N53", "to": "R3", "diameter_mm": 80, "length_m": 879, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-144", "from": "N53", "to": "N59", "diameter_mm": 100, "length_m": 85, "material": "PEHD", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-145", "from": "N53", "to": "N54", "diameter_mm": 100, "length_m": 802, "material": "PVC", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-146", "from": "N54", "to": "J3", "diameter_mm": 150, "length_m": 1035, "material": "fonte", "zone": "Pikine", "age_years": 18}, {"id": "PIPE-147", "from": "N54", "to": "N59", "diameter_mm": 150, "length_m": 843, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-148", "from": "N55", "to": "R3", "diameter_mm": 150, "length_m": 1335, "material": "fonte", "zone": "Pikine", "age_years": 25, "risk": "medium"}, {"id": "PIPE-149", "from": "N55", "to": "N59", "diameter_mm": 125, "length_m": 1127, "material": "PEHD", "zone": "Pikine", "age_years": 20, "risk": "medium"}, {"id": "PIPE-150", "from": "N55", "to": "N53", "diameter_mm": 150, "length_m": 1155, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-151", "from": "N56", "to": "J3", "diameter_mm": 125, "length_m": 1150, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-152", "from": "N56", "to": "N60", "diameter_mm": 80, "length_m": 801, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-153", "from": "N56", "to": "N62", "diameter_mm": 100, "length_m": 926, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-154", "from": "N57", "to": "J3", "diameter_mm": 200, "length_m": 848, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-155", "from": "N57", "to": "N60", "diameter_mm": 100, "length_m": 301, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-156", "from": "N57", "to": "N56", "diameter_mm": 100, "length_m": 1039, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-157", "from": "N58", "to": "R3", "diameter_mm": 125, "length_m": 1339, "material": "PEHD", "zone": "Pikine", "age_years": 18}, {"id": "PIPE-158", "from": "N58", "to": "N61", "diameter_mm": 80, "length_m": 1173, "material": "PEHD", "zone": "Pikine", "age_years": 30, "risk": "high"}, {"id": "PIPE-159", "from": "N58", "to": "N62", "diameter_mm": 125, "length_m": 1188, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-160", "from": "N59", "to": "R3", "diameter_mm": 125, "length_m": 796, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-161", "from": "N60", "to": "J3", "diameter_mm": 150, "length_m": 978, "material": "PVC", "zone": "Pikine", "age_years": 32, "risk": "high"}, {"id": "PIPE-162", "from": "N61", "to": "R3", "diameter_mm": 80, "length_m": 486, "material": "PVC", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-163", "from": "N61", "to": "N62", "diameter_mm": 80, "length_m": 52, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-164", "from": "N61", "to": "N56", "diameter_mm": 80, "length_m": 967, "material": "PEHD", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-165", "from": "N62", "to": "R3", "diameter_mm": 125, "length_m": 534, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-166", "from": "N63", "to": "R4", "diameter_mm": 250, "length_m": 113, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 32, "risk": "high"}, {"id": "PIPE-167", "from": "N63", "to": "N68", "diameter_mm": 125, "length_m": 495, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-168", "from": "N63", "to": "N66", "diameter_mm": 150, "length_m": 1052, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-169", "from": "N64", "to": "V3", "diameter_mm": 125, "length_m": 1241, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 32, "risk": "high"}, {"id": "PIPE-170", "from": "N64", "to": "N69", "diameter_mm": 100, "length_m": 483, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-171", "from": "N64", "to": "N68", "diameter_mm": 125, "length_m": 1240, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-172", "from": "N65", "to": "J3", "diameter_mm": 150, "length_m": 881, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 38, "risk": "high"}, {"id": "PIPE-173", "from": "N65", "to": "N67", "diameter_mm": 125, "length_m": 320, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 30, "risk": "high"}, {"id": "PIPE-174", "from": "N65", "to": "N70", "diameter_mm": 80, "length_m": 1971, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-175", "from": "N66", "to": "J4", "diameter_mm": 100, "length_m": 998, "material": "PEHD", "zone": "Gu\u00e9diawaye", "age_years": 38, "risk": "high"}, {"id": "PIPE-176", "from": "N66", "to": "N70", "diameter_mm": 150, "length_m": 1136, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 20, "risk": "medium"}, {"id": "PIPE-177", "from": "N67", "to": "J3", "diameter_mm": 150, "length_m": 605, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-178", "from": "N68", "to": "J4", "diameter_mm": 100, "length_m": 335, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 25, "risk": "medium"}, {"id": "PIPE-179", "from": "N68", "to": "N69", "diameter_mm": 125, "length_m": 763, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-180", "from": "N69", "to": "V3", "diameter_mm": 125, "length_m": 846, "material": "fonte", "zone": "Gu\u00e9diawaye", "age_years": 18}, {"id": "PIPE-181", "from": "N70", "to": "P4", "diameter_mm": 200, "length_m": 1266, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 18}, {"id": "PIPE-182", "from": "N70", "to": "N68", "diameter_mm": 100, "length_m": 1935, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 30, "risk": "high"}, {"id": "PIPE-183", "from": "N71", "to": "V4", "diameter_mm": 250, "length_m": 235, "material": "acier", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-184", "from": "N71", "to": "N77", "diameter_mm": 100, "length_m": 135, "material": "PVC", "zone": "Rufisque", "age_years": 20, "risk": "medium"}, {"id": "PIPE-185", "from": "N71", "to": "N74", "diameter_mm": 150, "length_m": 616, "material": "acier", "zone": "Rufisque", "age_years": 20, "risk": "medium"}, {"id": "PIPE-186", "from": "N72", "to": "V4", "diameter_mm": 80, "length_m": 1276, "material": "fonte", "zone": "Rufisque"}, {"id": "PIPE-187", "from": "N72", "to": "N74", "diameter_mm": 150, "length_m": 772, "material": "PVC", "zone": "Rufisque"}, {"id": "PIPE-188", "from": "N72", "to": "N71", "diameter_mm": 125, "length_m": 1171, "material": "PVC", "zone": "Rufisque"}, {"id": "PIPE-189", "from": "N73", "to": "V4", "diameter_mm": 150, "length_m": 961, "material": "PVC", "zone": "Rufisque", "age_years": 25, "risk": "medium"}, {"id": "PIPE-190", "from": "N73", "to": "N75", "diameter_mm": 125, "length_m": 595, "material": "acier", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-191", "from": "N73", "to": "N78", "diameter_mm": 125, "length_m": 672, "material": "fonte", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-192", "from": "N74", "to": "V4", "diameter_mm": 125, "length_m": 826, "material": "fonte", "zone": "Rufisque", "age_years": 38, "risk": "high"}, {"id": "PIPE-193", "from": "N74", "to": "N77", "diameter_mm": 100, "length_m": 742, "material": "PVC", "zone": "Rufisque", "age_years": 10}, {"id": "PIPE-194", "from": "N75", "to": "V4", "diameter_mm": 125, "length_m": 767, "material": "PVC", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-195", "from": "N75", "to": "N78", "diameter_mm": 100, "length_m": 340, "material": "PEHD", "zone": "Rufisque", "age_years": 30, "risk": "high"}, {"id": "PIPE-196", "from": "N76", "to": "V4", "diameter_mm": 250, "length_m": 1412, "material": "acier", "zone": "Rufisque", "age_years": 12}, {"id": "PIPE-197", "from": "N76", "to": "N74", "diameter_mm": 125, "length_m": 1047, "material": "PVC", "zone": "Rufisque", "age_years": 10}, {"id": "PIPE-198", "from": "N76", "to": "N71", "diameter_mm": 125, "length_m": 1201, "material": "PEHD", "zone": "Rufisque"}, {"id": "PIPE-199", "from": "N77", "to": "V4", "diameter_mm": 100, "length_m": 103, "material": "fonte", "zone": "Rufisque", "age_years": 25, "risk": "medium"}, {"id": "PIPE-200", "from": "N78", "to": "V4", "diameter_mm": 250, "length_m": 1106, "material": "PVC", "zone": "Rufisque"}]
const SENSORS = [{"sensor_id": "S1_acoustic", "node_id": "J1", "kind": "acoustic", "name": "Acoustique Plateau", "lat": 14.69, "lng": -17.449, "zone": "Plateau", "value": 0.94, "unit": "score", "status": "critique"}, {"sensor_id": "S2_acoustic", "node_id": "J2", "kind": "acoustic", "name": "Acoustique HLM", "lat": 14.707, "lng": -17.438, "zone": "HLM", "value": 0.12, "unit": "score", "status": "normal"}, {"sensor_id": "S3_acoustic", "node_id": "J3", "kind": "acoustic", "name": "Acoustique Pikine", "lat": 14.75, "lng": -17.392, "zone": "Pikine", "value": 0.08, "unit": "score", "status": "normal"}, {"sensor_id": "S1_pressure", "node_id": "R1", "kind": "pressure", "name": "Pression Ch\u00e2teau d'Eau", "lat": 14.693, "lng": -17.445, "zone": "Plateau", "value": 3.4, "unit": "bar", "status": "normal"}, {"sensor_id": "S2_pressure", "node_id": "P1", "kind": "pressure", "name": "Pression Fann", "lat": 14.7, "lng": -17.463, "zone": "Fann", "value": 2.1, "unit": "bar", "status": "alerte"}, {"sensor_id": "S3_pressure", "node_id": "V2", "kind": "pressure", "name": "Pression Grand Dakar", "lat": 14.714, "lng": -17.432, "zone": "Grand Dakar", "value": 1.8, "unit": "bar", "status": "critique"}, {"sensor_id": "S4_pressure", "node_id": "P3", "kind": "pressure", "name": "Pression Parcelles", "lat": 14.73, "lng": -17.415, "zone": "Parcelles Assainies", "value": 3.2, "unit": "bar", "status": "normal"}, {"sensor_id": "M1_flow", "node_id": "P1", "kind": "flow", "name": "D\u00e9bit Fann", "lat": 14.7, "lng": -17.463, "zone": "Fann", "value": 1360, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "M2_flow", "node_id": "P2", "kind": "flow", "name": "D\u00e9bit HLM", "lat": 14.71, "lng": -17.443, "zone": "HLM", "value": 870, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "M3_flow", "node_id": "P3", "kind": "flow", "name": "D\u00e9bit Parcelles", "lat": 14.73, "lng": -17.415, "zone": "Parcelles Assainies", "value": 1050, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "M4_flow", "node_id": "P4", "kind": "flow", "name": "D\u00e9bit Gu\u00e9diawaye", "lat": 14.745, "lng": -17.407, "zone": "Gu\u00e9diawaye", "value": 780, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "Q1_quality", "node_id": "R1", "kind": "quality", "name": "Qualit\u00e9 R\u00e9servoir Nord", "lat": 14.693, "lng": -17.445, "zone": "Plateau", "value": 7.2, "unit": "pH", "status": "normal"}, {"sensor_id": "Q2_quality", "node_id": "R2", "kind": "quality", "name": "Qualit\u00e9 R\u00e9servoir M\u00e9dina", "lat": 14.688, "lng": -17.46, "zone": "M\u00e9dina", "value": 7.1, "unit": "pH", "status": "normal"}, {"sensor_id": "R1_level", "node_id": "R1", "kind": "level", "name": "Niveau Ch\u00e2teau d'Eau", "lat": 14.693, "lng": -17.445, "zone": "Plateau", "value": 81.3, "unit": "%", "status": "normal"}, {"sensor_id": "R2_level", "node_id": "R2", "kind": "level", "name": "Niveau R\u00e9servoir M\u00e9dina", "lat": 14.688, "lng": -17.46, "zone": "M\u00e9dina", "value": 74.2, "unit": "%", "status": "normal"}, {"sensor_id": "R3_level", "node_id": "R3", "kind": "level", "name": "Niveau R\u00e9servoir Pikine", "lat": 14.752, "lng": -17.388, "zone": "Pikine", "value": 68.9, "unit": "%", "status": "normal"}, {"sensor_id": "R4_level", "node_id": "R4", "kind": "level", "name": "Niveau R\u00e9servoir Parcelles", "lat": 14.733, "lng": -17.412, "zone": "Parcelles Assainies", "value": 71.5, "unit": "%", "status": "normal"}, {"sensor_id": "P1_health", "node_id": "P1", "kind": "pump_health", "name": "Sant\u00e9 Pompe Fann", "lat": 14.7, "lng": -17.463, "zone": "Fann", "value": 62, "unit": "\u00b0C", "status": "critique"}, {"sensor_id": "P2_health", "node_id": "P2", "kind": "pump_health", "name": "Sant\u00e9 Pompe HLM", "lat": 14.71, "lng": -17.443, "zone": "HLM", "value": 45, "unit": "\u00b0C", "status": "normal"}, {"sensor_id": "AUTO_001", "node_id": "N1", "kind": "pressure", "name": "Capteur Pressure Plateau 1", "lat": 14.694067, "lng": -17.454375, "zone": "Plateau", "value": 1.6, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_002", "node_id": "N2", "kind": "flow", "name": "Capteur Flow Plateau 2", "lat": 14.686051, "lng": -17.44942, "zone": "Plateau", "value": 671, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "AUTO_003", "node_id": "N3", "kind": "quality", "name": "Capteur Quality Plateau 3", "lat": 14.696202, "lng": -17.438083, "zone": "Plateau", "value": 6.8, "unit": "pH", "status": "critique"}, {"sensor_id": "AUTO_004", "node_id": "N4", "kind": "acoustic", "name": "Capteur Acoustic Plateau 4", "lat": 14.699628, "lng": -17.452827, "zone": "Plateau", "value": 0.69, "unit": "score", "status": "normal"}, {"sensor_id": "AUTO_005", "node_id": "N5", "kind": "pressure", "name": "Capteur Pressure Plateau 5", "lat": 14.689282, "lng": -17.454255, "zone": "Plateau", "value": 2.2, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_006", "node_id": "N6", "kind": "flow", "name": "Capteur Flow Plateau 6", "lat": 14.68481, "lng": -17.442366, "zone": "Plateau", "value": 876, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "AUTO_007", "node_id": "N7", "kind": "pressure", "name": "Capteur Pressure Plateau 7", "lat": 14.680584, "lng": -17.450029, "zone": "Plateau", "value": 3.0, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_008", "node_id": "N8", "kind": "flow", "name": "Capteur Flow Plateau 8", "lat": 14.694297, "lng": -17.441376, "zone": "Plateau", "value": 1194, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "AUTO_009", "node_id": "N9", "kind": "quality", "name": "Capteur Quality Plateau 9", "lat": 14.68485, "lng": -17.440268, "zone": "Plateau", "value": 7.2, "unit": "pH", "status": "normal"}, {"sensor_id": "AUTO_010", "node_id": "N10", "kind": "acoustic", "name": "Capteur Acoustic Plateau 10", "lat": 14.697807, "lng": -17.454838, "zone": "Plateau", "value": 0.57, "unit": "score", "status": "critique"}, {"sensor_id": "AUTO_011", "node_id": "N11", "kind": "pressure", "name": "Capteur Pressure M\u00e9dina 11", "lat": 14.696116, "lng": -17.453132, "zone": "M\u00e9dina", "value": 3.9, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_012", "node_id": "N12", "kind": "flow", "name": "Capteur Flow M\u00e9dina 12", "lat": 14.686805, "lng": -17.462357, "zone": "M\u00e9dina", "value": 589, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "AUTO_013", "node_id": "N13", "kind": "pressure", "name": "Capteur Pressure M\u00e9dina 13", "lat": 14.699144, "lng": -17.459278, "zone": "M\u00e9dina", "value": 1.8, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_014", "node_id": "N14", "kind": "flow", "name": "Capteur Flow M\u00e9dina 14", "lat": 14.681855, "lng": -17.463356, "zone": "M\u00e9dina", "value": 925, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "AUTO_015", "node_id": "N15", "kind": "quality", "name": "Capteur Quality M\u00e9dina 15", "lat": 14.69695, "lng": -17.454737, "zone": "M\u00e9dina", "value": 7.0, "unit": "pH", "status": "normal"}, {"sensor_id": "AUTO_016", "node_id": "N16", "kind": "acoustic", "name": "Capteur Acoustic M\u00e9dina 16", "lat": 14.696143, "lng": -17.452595, "zone": "M\u00e9dina", "value": 0.66, "unit": "score", "status": "normal"}, {"sensor_id": "AUTO_017", "node_id": "N17", "kind": "pressure", "name": "Capteur Pressure M\u00e9dina 17", "lat": 14.690725, "lng": -17.448457, "zone": "M\u00e9dina", "value": 1.7, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_018", "node_id": "N18", "kind": "flow", "name": "Capteur Flow M\u00e9dina 18", "lat": 14.687571, "lng": -17.455615, "zone": "M\u00e9dina", "value": 423, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "AUTO_019", "node_id": "N19", "kind": "pressure", "name": "Capteur Pressure M\u00e9dina 19", "lat": 14.696588, "lng": -17.454485, "zone": "M\u00e9dina", "value": 2.1, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_020", "node_id": "N20", "kind": "flow", "name": "Capteur Flow M\u00e9dina 20", "lat": 14.697234, "lng": -17.455185, "zone": "M\u00e9dina", "value": 1118, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "AUTO_021", "node_id": "N21", "kind": "quality", "name": "Capteur Quality Fann 21", "lat": 14.706091, "lng": -17.471221, "zone": "Fann", "value": 7.0, "unit": "pH", "status": "normal"}, {"sensor_id": "AUTO_022", "node_id": "N22", "kind": "acoustic", "name": "Capteur Acoustic Fann 22", "lat": 14.696558, "lng": -17.46708, "zone": "Fann", "value": 0.47, "unit": "score", "status": "normal"}, {"sensor_id": "AUTO_023", "node_id": "N23", "kind": "pressure", "name": "Capteur Pressure Fann 23", "lat": 14.693596, "lng": -17.468043, "zone": "Fann", "value": 2.8, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_024", "node_id": "N24", "kind": "flow", "name": "Capteur Flow Fann 24", "lat": 14.69402, "lng": -17.467274, "zone": "Fann", "value": 400, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "AUTO_025", "node_id": "N25", "kind": "pressure", "name": "Capteur Pressure Fann 25", "lat": 14.704714, "lng": -17.465798, "zone": "Fann", "value": 3.5, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_026", "node_id": "N26", "kind": "flow", "name": "Capteur Flow Fann 26", "lat": 14.699404, "lng": -17.468438, "zone": "Fann", "value": 230, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "AUTO_027", "node_id": "N27", "kind": "quality", "name": "Capteur Quality Fann 27", "lat": 14.69734, "lng": -17.456077, "zone": "Fann", "value": 7.7, "unit": "pH", "status": "normal"}, {"sensor_id": "AUTO_028", "node_id": "N28", "kind": "acoustic", "name": "Capteur Acoustic Fann 28", "lat": 14.704961, "lng": -17.461645, "zone": "Fann", "value": 0.2, "unit": "score", "status": "normal"}, {"sensor_id": "AUTO_029", "node_id": "N29", "kind": "pressure", "name": "Capteur Pressure HLM 29", "lat": 14.70308, "lng": -17.43823, "zone": "HLM", "value": 2.9, "unit": "bar", "status": "normal"}, {"sensor_id": "AUTO_030", "node_id": "N30", "kind": "flow", "name": "Capteur Flow HLM 30", "lat": 14.702941, "lng": -17.446273, "zone": "HLM", "value": 320, "unit": "m\u00b3/h", "status": "normal"}]
const ALERTS = [{"alert_id": "ALT-001", "type": "Fuite", "location": "Grand Dakar \u2014 J1-J2", "severity": "Critique", "probability": 0.94, "lat": 14.712, "lng": -17.438, "pipe_id": "PIPE-07", "date": "2026-03-11 09:20", "status": "En cours", "estimated_loss_m3h": 85, "description": "Vibrations acoustiques anormales sur canalisation amiante-ciment"}, {"alert_id": "ALT-002", "type": "Panne pompe", "location": "Station Fann \u2014 P1", "severity": "Critique", "probability": 0.91, "lat": 14.7, "lng": -17.463, "pipe_id": null, "date": "2026-03-11 10:10", "status": "En cours", "estimated_loss_m3h": 0, "description": "Surchauffe (62\u00b0C) et vibrations anormales"}, {"alert_id": "ALT-003", "type": "D\u00e9bit anormal", "location": "Fann-Plateau", "severity": "Alerte", "probability": 0.78, "lat": 14.696, "lng": -17.454, "pipe_id": "PIPE-01", "date": "2026-03-11 09:45", "status": "Analyse", "estimated_loss_m3h": 40, "description": "D\u00e9bit 15% au-dessus de la normale"}, {"alert_id": "ALT-004", "type": "Pression basse", "location": "Zone M\u00e9dina", "severity": "Alerte", "probability": 0.65, "lat": 14.693, "lng": -17.456, "pipe_id": "PIPE-05", "date": "2026-03-11 09:50", "status": "Surveillance", "estimated_loss_m3h": 0, "description": "Pression en baisse continue depuis 2h"}]

const SENSOR_COLORS: Record<string,string> = {
  acoustic:"#a78bfa", pressure:"#38bdf8", flow:"#34d399",
  quality:"#22d3ee", level:"#fbbf24", pump_health:"#f87171",
}
const SEVERITY_COLORS: Record<string,string> = {
  Critique:"#f87171", Alerte:"#fbbf24", Moyen:"#a78bfa", Faible:"#94a3b8",
}
const NODE_SYMBOLS: Record<string,string> = {
  reservoir:"▣", pump:"⚙", valve:"◈", junction:"◎",
}

export function DakarWaterMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [clock, setClock] = useState("")
  const [selectedSensor, setSelectedSensor] = useState<any>(null)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => { const m = window.innerWidth < 1024; setIsMobile(m); if (m) setSidebarOpen(false) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR"))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 300)
  }, [sidebarOpen])

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return
    import("leaflet").then((lm) => {
      const L = lm.default ?? lm
      if (mapRef.current || !mapContainerRef.current) return
      const map = L.map(mapContainerRef.current, {
        center:[14.715,-17.430], zoom:13, zoomControl:false, attributionControl:false,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains:"abcd", maxZoom:19,
      }).addTo(map)
      L.control.zoom({ position:"bottomright" }).addTo(map)
      leafletRef.current = L
      mapRef.current = map
      setMapReady(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  useEffect(() => {
    if (!mapReady) return
    const L = leafletRef.current; const map = mapRef.current
    if (!L || !map) return
    const nm: Record<string,any> = {}
    NODES.forEach((n:any) => { nm[n.id] = n })
    INTER_NODES.forEach((n:any) => { nm[n.id] = n })

    PIPES.forEach((p:any) => {
      const f = nm[p.from]; const t = nm[p.to]
      if (!f || !t) return
      const isAlert = ALERTS.some((a:any) => a.pipe_id === p.id)
      const c = p.risk==="high"?"#f87171":p.risk==="medium"?"#fbbf24":isAlert?"#fb923c":"#22d3ee"
      const w = Math.max(1.2, (p.diameter_mm||150)/140)
      const poly = L.polyline([[f.lat,f.lng],[t.lat,t.lng]],
        {color:c,weight:w,opacity:0.70,dashArray:p.risk==="high"?"6 4":p.risk==="medium"?"10 4":null}
      ).addTo(map)
      poly.bindTooltip(
        `<div style="background:#0f172a;border:1px solid #22d3ee33;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace"><b style="color:#22d3ee">${p.id}</b><br/>${p.from}→${p.to}<br/>∅${p.diameter_mm}mm·${p.material}${p.age_years?`<br/><span style="color:${c}">⚠${p.age_years}ans</span>`:""}</div>`,
        {sticky:true,opacity:1}
      )
    })

    NODES.forEach((node:any) => {
      const sym = NODE_SYMBOLS[node.type]||"●"
      const nc = node.type==="reservoir"?"#38bdf8":node.type==="pump"?"#fbbf24":node.type==="valve"?"#a78bfa":"#64748b"
      const icon = L.divIcon({
        html:`<div style="width:32px;height:32px;background:${nc}22;border:2px solid ${nc};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:15px;color:${nc};box-shadow:0 0 10px ${nc}55">${sym}</div>`,
        className:"",iconSize:[32,32],iconAnchor:[16,16],
      })
      L.marker([node.lat,node.lng],{icon}).addTo(map).bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${nc}44;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace"><b style="color:${nc}">${node.name}</b><br/>Zone:${node.zone}${node.capacity_m3?`<br/>Capacité:${node.capacity_m3.toLocaleString()}m³`:""}${node.flow_m3h?`<br/>Débit:${node.flow_m3h}m³/h`:""}</div>`,
        {sticky:true,opacity:1}
      )
    })

    SENSORS.forEach((s:any) => {
      const c = s.status==="critique"?"#f87171":s.status==="alerte"?"#fbbf24":SENSOR_COLORS[s.kind]||"#34d399"
      const pulse = s.status!=="normal"
      const icon = L.divIcon({
        html:`<div style="position:relative;width:20px;height:20px">${pulse?`<div style="position:absolute;inset:-6px;border-radius:50%;background:${c}33;animation:sP 1.8s ease-out infinite"></div><style>@keyframes sP{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}</style>`:""}<div style="position:relative;width:20px;height:20px;border-radius:50%;background:${c}33;border:2px solid ${c};box-shadow:0 0 8px ${c}88"></div></div>`,
        className:"",iconSize:[20,20],iconAnchor:[10,10],
      })
      L.marker([s.lat,s.lng],{icon}).addTo(map)
        .on("click",()=>setSelectedSensor(s))
        .bindTooltip(`<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace"><b style="color:${c}">${s.name}</b><br/>${s.value}${s.unit}·${s.zone}</div>`,{sticky:true,opacity:1})
    })

    ALERTS.forEach((alert:any) => {
      const c = SEVERITY_COLORS[alert.severity]
      L.circle([alert.lat,alert.lng],{radius:alert.severity==="Critique"?180:120,color:c,fillColor:c,fillOpacity:0.08,weight:1.5,dashArray:"4 4"}).addTo(map)
      const icon = L.divIcon({
        html:`<div style="width:32px;height:32px;border-radius:50%;border:2px solid ${c};background:${c}22;box-shadow:0 0 14px ${c}88;display:flex;align-items:center;justify-content:center;font-size:14px;animation:aG 1.4s ease-in-out infinite alternate">⚠<style>@keyframes aG{from{box-shadow:0 0 8px ${c}66}to{box-shadow:0 0 20px ${c}}}</style></div>`,
        className:"",iconSize:[32,32],iconAnchor:[16,16],zIndexOffset:1000,
      })
      L.marker([alert.lat,alert.lng],{icon}).addTo(map).on("click",()=>setSelectedAlert(alert))
    })
  }, [mapReady])

  const totalDebit = SENSORS.filter((s:any)=>s.kind==="flow").reduce((a:number,s:any)=>a+s.value,0)
  const sN = SENSORS.filter((s:any)=>s.status==="normal").length
  const sA = SENSORS.filter((s:any)=>s.status==="alerte").length
  const sC = SENSORS.filter((s:any)=>s.status==="critique").length
  const SW = 260

  return (
    <div style={{fontFamily:"monospace",position:"relative",width:"100%",height:"100%",display:"flex"}}>
      <style>{`
        .aq-sb::-webkit-scrollbar{width:3px}
        .aq-sb::-webkit-scrollbar-thumb{background:rgba(34,211,238,.3);border-radius:2px}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
        .leaflet-tooltip::before{display:none!important}
      `}</style>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)}
          style={{position:"absolute",top:0,left:0,right:0,bottom:"4rem",zIndex:19,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(2px)"}} />
      )}

      {/* Sidebar */}
      <div style={{
        /* En mobile, la sidebar s'arrête au-dessus de la bottom nav (4rem = 64px) */
        position:isMobile?"absolute":"relative",
        left:0,top:0,bottom:isMobile?"4rem":0,
        zIndex:isMobile?20:10,
        width:sidebarOpen?SW:0,
        minWidth:sidebarOpen?SW:0,
        height:"100%",
        overflow:"hidden",
        transition:"width .25s ease,min-width .25s ease",
        background:"#020817",
        borderRight:"1px solid rgba(34,211,238,.22)",
        display:"flex",
        flexDirection:"column",
        flexShrink:0,
      }}>
        <div className="aq-sb" style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:14,width:SW,opacity:sidebarOpen?1:0,transition:"opacity .2s"}}>
          <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>AQUAPULSE — OPÉRATEUR</p>

          <div>
            <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>RÉSEAU</p>
            {[
              {l:"Conduites",v:`${PIPES.length}`},
              {l:"Nœuds",v:`${NODES.length}`},
              {l:"Débit total",v:`${Math.round(totalDebit)} m³/h`},
              {l:"Synchro",v:clock},
            ].map(x=>(
              <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(34,211,238,.08)"}}>
                <span style={{color:"#64748b",fontSize:11}}>{x.l}</span>
                <span style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>{x.v}</span>
              </div>
            ))}
          </div>

          <div>
            <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
              CAPTEURS IoT &nbsp;
              <span style={{color:"#34d399"}}>{sN}✓</span>{" "}
              <span style={{color:"#fbbf24"}}>{sA}⚠</span>{" "}
              <span style={{color:"#f87171"}}>{sC}✕</span>
            </p>
            <div className="aq-sb" style={{maxHeight:180,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
              {SENSORS.filter((s:any)=>["pressure","flow","acoustic"].includes(s.kind)).map((s:any)=>{
                const c = s.status==="critique"?"#f87171":s.status==="alerte"?"#fbbf24":"#34d399"
                return (
                  <div key={s.sensor_id}
                    onClick={()=>{setSelectedSensor(s);if(isMobile)setSidebarOpen(false);mapRef.current?.setView([s.lat,s.lng],16)}}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:5,cursor:"pointer",
                      background:selectedSensor?.sensor_id===s.sensor_id?`${c}18`:"transparent",
                      border:`1px solid ${selectedSensor?.sensor_id===s.sensor_id?c+"44":"transparent"}`,transition:"all .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`}}/>
                      <span style={{color:"#94a3b8",fontSize:10,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                    </div>
                    <span style={{color:c,fontSize:10,fontWeight:700}}>{s.value} {s.unit}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
              ALERTES &nbsp;<span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
            </p>
            {ALERTS.map((a:any)=>{
              const c = SEVERITY_COLORS[a.severity]
              return (
                <div key={a.alert_id}
                  onClick={()=>{setSelectedAlert(a);if(isMobile)setSidebarOpen(false);mapRef.current?.setView([a.lat,a.lng],15)}}
                  style={{padding:"7px 9px",borderRadius:6,cursor:"pointer",marginBottom:5,background:`${c}0d`,
                    borderTop:`1px solid ${c}22`,borderRight:`1px solid ${c}22`,borderBottom:`1px solid ${c}22`,
                    borderLeft:`3px solid ${c}`,transition:"all .15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{color:c,fontSize:11,fontWeight:700}}>{a.type}</span>
                    <span style={{color:c,fontSize:10}}>{(a.probability*100).toFixed(0)}%</span>
                  </div>
                  <div style={{color:"#64748b",fontSize:10,marginTop:2}}>{a.location}</div>
                  <div style={{color:"#475569",fontSize:10}}>{a.status}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Zone carte */}
      <div style={{flex:1,position:"relative",minWidth:0}}>
        {/* Toggle sidebar — desktop seulement (mobile utilise le FAB ci-dessus) */}
        {!isMobile && (
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{
            position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",
            zIndex:2000,width:22,height:56,
            background:"#020817",border:"1px solid rgba(34,211,238,.35)",borderLeft:"none",
            borderRadius:"0 8px 8px 0",cursor:"pointer",color:"#22d3ee",fontSize:12,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"3px 0 12px rgba(0,0,0,0.5)",
          }}>
            {sidebarOpen?"‹":"›"}
          </button>
        )}

        {/* Mobile FAB — haut gauche, z-index élevé pour rester au-dessus de Leaflet */}
        {isMobile && !sidebarOpen && (
          <button onClick={()=>setSidebarOpen(true)} style={{
            position:"absolute",top:12,left:12,zIndex:2000,
            background:"#020817",border:"1px solid rgba(34,211,238,.55)",
            borderRadius:10,padding:"10px 16px",
            color:"#22d3ee",fontSize:12,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 20px rgba(0,0,0,0.7)",
            display:"flex",alignItems:"center",gap:8,
          }}>☰ Infos réseau</button>
        )}

        <div ref={mapContainerRef} style={{width:"100%",height:"100%"}} />

        {/* Légende */}
        <div style={{position:"absolute",bottom:40,right:12,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,padding:"10px 14px"}}>
          <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:6}}>LÉGENDE</p>
          {[
            {c:"#38bdf8",l:"Réservoir ▣"},
            {c:"#fbbf24",l:"Pompe ⚙"},
            {c:"#a78bfa",l:"Vanne ◈"},
            {c:"#f87171",l:"Tuyau risque élevé"},
            {c:"#fbbf24",l:"Tuyau risque moyen"},
            {c:"#22d3ee",l:"Tuyau normal"},
          ].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
              <span style={{color:"#64748b",fontSize:10}}>{x.l}</span>
            </div>
          ))}
        </div>

        {/* Panneau détail */}
        {(selectedSensor||selectedAlert) && (
          <div style={{position:"absolute",right:12,top:12,width:220,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>{selectedSensor?"CAPTEUR":"ALERTE"}</span>
              <button onClick={()=>{setSelectedSensor(null);setSelectedAlert(null)}} style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            {selectedSensor&&(()=>{
              const c=selectedSensor.status==="critique"?"#f87171":selectedSensor.status==="alerte"?"#fbbf24":SENSOR_COLORS[selectedSensor.kind]||"#34d399"
              return(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{color:c,fontSize:13,fontWeight:700}}>{selectedSensor.name}</div>
                  <div style={{color:"#64748b",fontSize:11}}>{selectedSensor.zone} · {selectedSensor.kind}</div>
                  <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:6,padding:"10px 14px",textAlign:"center"}}>
                    <div style={{color:c,fontSize:22,fontWeight:700}}>{selectedSensor.value}</div>
                    <div style={{color:"#64748b",fontSize:11}}>{selectedSensor.unit}</div>
                  </div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:4,background:`${c}22`,border:`1px solid ${c}44`,alignSelf:"flex-start"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:c}}/>
                    <span style={{color:c,fontSize:11,fontWeight:600,textTransform:"uppercase"}}>{selectedSensor.status}</span>
                  </div>
                  <div style={{color:"#475569",fontSize:10}}>ID: {selectedSensor.sensor_id}</div>
                </div>
              )
            })()}
            {selectedAlert&&!selectedSensor&&(()=>{
              const c=SEVERITY_COLORS[selectedAlert.severity]
              return(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{color:c,fontSize:13,fontWeight:700}}>⚠ {selectedAlert.type}</div>
                  <div style={{color:"#e2e8f0",fontSize:12}}>{selectedAlert.location}</div>
                  <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:6,padding:"8px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{color:"#64748b",fontSize:11}}>Probabilité IA</span>
                      <span style={{color:c,fontSize:13,fontWeight:700}}>{(selectedAlert.probability*100).toFixed(0)}%</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{color:"#64748b",fontSize:11}}>Statut</span>
                      <span style={{color:"#e2e8f0",fontSize:11}}>{selectedAlert.status}</span>
                    </div>
                    {selectedAlert.estimated_loss_m3h>0&&(
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                        <span style={{color:"#64748b",fontSize:11}}>Perte estimée</span>
                        <span style={{color:"#f87171",fontSize:11,fontWeight:700}}>{selectedAlert.estimated_loss_m3h} m³/h</span>
                      </div>
                    )}
                  </div>
                  <div style={{color:"#64748b",fontSize:11,lineHeight:1.5}}>{selectedAlert.description}</div>
                  <div style={{color:"#475569",fontSize:10}}>{selectedAlert.date}</div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
