"use client"
import { useEffect, useMemo, useRef, useState } from "react"
const NODES = [{"id": "R1", "type": "reservoir", "name": "Ch\u00e2teau d'Eau Plateau", "lat": 14.691, "lng": -17.444, "zone": "Plateau"}, {"id": "R2", "type": "reservoir", "name": "R\u00e9servoir M\u00e9dina", "lat": 14.686, "lng": -17.458, "zone": "M\u00e9dina"}, {"id": "R3", "type": "reservoir", "name": "R\u00e9servoir Pikine", "lat": 14.752, "lng": -17.385, "zone": "Pikine"}, {"id": "R4", "type": "reservoir", "name": "R\u00e9servoir Parcelles", "lat": 14.731, "lng": -17.41, "zone": "Parcelles Assainies"}, {"id": "R5", "type": "reservoir", "name": "R\u00e9servoir Gu\u00e9diawaye", "lat": 14.772, "lng": -17.398, "zone": "Gu\u00e9diawaye"}, {"id": "R6", "type": "reservoir", "name": "R\u00e9servoir Pikine", "lat": 14.715, "lng": -17.272, "zone": "Pikine"}, {"id": "P1", "type": "pump", "name": "Station Pompage Fann", "lat": 14.699, "lng": -17.462, "zone": "Fann"}, {"id": "P2", "type": "pump", "name": "Station Pompage HLM", "lat": 14.708, "lng": -17.44, "zone": "HLM"}, {"id": "P3", "type": "pump", "name": "Station Pompage Parcelles", "lat": 14.729, "lng": -17.413, "zone": "Parcelles Assainies"}, {"id": "P4", "type": "pump", "name": "Station Pompage Pikine", "lat": 14.748, "lng": -17.39, "zone": "Pikine"}, {"id": "P5", "type": "pump", "name": "Station Pompage Gu\u00e9diawaye", "lat": 14.77, "lng": -17.404, "zone": "Gu\u00e9diawaye"}, {"id": "V1", "type": "valve", "name": "Vanne M\u00e9dina-Plateau", "lat": 14.692, "lng": -17.45, "zone": "M\u00e9dina"}, {"id": "V2", "type": "valve", "name": "Vanne Grand Dakar", "lat": 14.712, "lng": -17.43, "zone": "Grand Dakar"}, {"id": "V3", "type": "valve", "name": "Vanne Pikine-Gu\u00e9diawaye", "lat": 14.758, "lng": -17.4, "zone": "Pikine"}, {"id": "V4", "type": "valve", "name": "Vanne Pikine Est", "lat": 14.718, "lng": -17.265, "zone": "Pikine"}, {"id": "J1", "type": "junction", "name": "N\u0153ud Central Plateau", "lat": 14.688, "lng": -17.447, "zone": "Plateau"}, {"id": "J2", "type": "junction", "name": "N\u0153ud HLM-M\u00e9dina", "lat": 14.705, "lng": -17.436, "zone": "HLM"}, {"id": "J3", "type": "junction", "name": "N\u0153ud Pikine Centre", "lat": 14.75, "lng": -17.378, "zone": "Pikine"}, {"id": "J4", "type": "junction", "name": "N\u0153ud Parcelles-Pikine", "lat": 14.738, "lng": -17.405, "zone": "Parcelles Assainies"}, {"id": "J5", "type": "junction", "name": "N\u0153ud Grand Dakar Sud", "lat": 14.718, "lng": -17.422, "zone": "Grand Dakar"}, {"id": "J6", "type": "junction", "name": "N\u0153ud Gu\u00e9diawaye Sud", "lat": 14.762, "lng": -17.408, "zone": "Gu\u00e9diawaye"}, {"id": "J7", "type": "junction", "name": "N\u0153ud Pikine Centre", "lat": 14.712, "lng": -17.278, "zone": "Pikine"}]
const INTER_NODES = [{"id": "N1", "zone": "Plateau", "lat": 14.69201, "lng": -17.449975}, {"id": "N2", "zone": "Plateau", "lat": 14.685451, "lng": -17.445813}, {"id": "N3", "zone": "Plateau", "lat": 14.693756, "lng": -17.436289}, {"id": "N4", "zone": "Plateau", "lat": 14.696559, "lng": -17.448674}, {"id": "N5", "zone": "Plateau", "lat": 14.688095, "lng": -17.449874}, {"id": "N6", "zone": "Plateau", "lat": 14.684435, "lng": -17.439888}, {"id": "N7", "zone": "Plateau", "lat": 14.680978, "lng": -17.446324}, {"id": "N8", "zone": "Plateau", "lat": 14.692198, "lng": -17.439056}, {"id": "N9", "zone": "Plateau", "lat": 14.684468, "lng": -17.438125}, {"id": "N10", "zone": "Plateau", "lat": 14.69507, "lng": -17.450364}, {"id": "N11", "zone": "M\u00e9dina", "lat": 14.693393, "lng": -17.453424}, {"id": "N12", "zone": "M\u00e9dina", "lat": 14.685944, "lng": -17.460479}, {"id": "N13", "zone": "M\u00e9dina", "lat": 14.695815, "lng": -17.458124}, {"id": "N14", "zone": "M\u00e9dina", "lat": 14.681984, "lng": -17.461243}, {"id": "N15", "zone": "M\u00e9dina", "lat": 14.69406, "lng": -17.454652}, {"id": "N16", "zone": "M\u00e9dina", "lat": 14.693414, "lng": -17.453013}, {"id": "N17", "zone": "M\u00e9dina", "lat": 14.68908, "lng": -17.449849}, {"id": "N18", "zone": "M\u00e9dina", "lat": 14.686557, "lng": -17.455323}, {"id": "N19", "zone": "M\u00e9dina", "lat": 14.69377, "lng": -17.454459}, {"id": "N20", "zone": "M\u00e9dina", "lat": 14.694287, "lng": -17.454994}, {"id": "N21", "zone": "Fann", "lat": 14.703773, "lng": -17.468858}, {"id": "N22", "zone": "Fann", "lat": 14.696146, "lng": -17.465449}, {"id": "N23", "zone": "Fann", "lat": 14.693777, "lng": -17.466241}, {"id": "N24", "zone": "Fann", "lat": 14.694116, "lng": -17.465608}, {"id": "N25", "zone": "Fann", "lat": 14.702671, "lng": -17.464392}, {"id": "N26", "zone": "Fann", "lat": 14.698423, "lng": -17.466567}, {"id": "N27", "zone": "Fann", "lat": 14.696772, "lng": -17.456387}, {"id": "N28", "zone": "Fann", "lat": 14.702869, "lng": -17.460972}, {"id": "N29", "zone": "HLM", "lat": 14.702896, "lng": -17.437188}, {"id": "N30", "zone": "HLM", "lat": 14.702788, "lng": -17.444531}, {"id": "N31", "zone": "HLM", "lat": 14.714353, "lng": -17.43906}, {"id": "N32", "zone": "HLM", "lat": 14.708297, "lng": -17.438123}, {"id": "N33", "zone": "HLM", "lat": 14.7123, "lng": -17.436204}, {"id": "N34", "zone": "HLM", "lat": 14.703707, "lng": -17.451826}, {"id": "N35", "zone": "HLM", "lat": 14.704916, "lng": -17.446877}, {"id": "N36", "zone": "HLM", "lat": 14.703454, "lng": -17.432699}, {"id": "N37", "zone": "Grand Dakar", "lat": 14.718769, "lng": -17.434633}, {"id": "N38", "zone": "Grand Dakar", "lat": 14.715676, "lng": -17.432609}, {"id": "N39", "zone": "Grand Dakar", "lat": 14.719304, "lng": -17.431029}, {"id": "N40", "zone": "Grand Dakar", "lat": 14.710208, "lng": -17.436334}, {"id": "N41", "zone": "Grand Dakar", "lat": 14.714359, "lng": -17.435931}, {"id": "N42", "zone": "Grand Dakar", "lat": 14.714684, "lng": -17.420054}, {"id": "N43", "zone": "Grand Dakar", "lat": 14.712092, "lng": -17.437017}, {"id": "N44", "zone": "Grand Dakar", "lat": 14.720466, "lng": -17.429762}, {"id": "N45", "zone": "Parcelles Assainies", "lat": 14.722136, "lng": -17.424369}, {"id": "N46", "zone": "Parcelles Assainies", "lat": 14.722474, "lng": -17.410441}, {"id": "N47", "zone": "Parcelles Assainies", "lat": 14.734757, "lng": -17.415368}, {"id": "N48", "zone": "Parcelles Assainies", "lat": 14.721643, "lng": -17.416341}, {"id": "N49", "zone": "Parcelles Assainies", "lat": 14.73843, "lng": -17.412801}, {"id": "N50", "zone": "Parcelles Assainies", "lat": 14.737979, "lng": -17.404841}, {"id": "N51", "zone": "Parcelles Assainies", "lat": 14.720707, "lng": -17.408203}, {"id": "N52", "zone": "Parcelles Assainies", "lat": 14.732771, "lng": -17.412613}, {"id": "N53", "zone": "Pikine", "lat": 14.746704, "lng": -17.378888}, {"id": "N54", "zone": "Pikine", "lat": 14.742512, "lng": -17.390023}, {"id": "N55", "zone": "Pikine", "lat": 14.751751, "lng": -17.361994}, {"id": "N56", "zone": "Pikine", "lat": 14.763148, "lng": -17.399277}, {"id": "N57", "zone": "Pikine", "lat": 14.753016, "lng": -17.403853}, {"id": "N58", "zone": "Pikine", "lat": 14.764141, "lng": -17.366492}, {"id": "N59", "zone": "Pikine", "lat": 14.747558, "lng": -17.378997}, {"id": "N60", "zone": "Pikine", "lat": 14.755942, "lng": -17.405247}, {"id": "N61", "zone": "Pikine", "lat": 14.760088, "lng": -17.384374}, {"id": "N62", "zone": "Pikine", "lat": 14.760523, "lng": -17.384861}, {"id": "N63", "zone": "Gu\u00e9diawaye", "lat": 14.761513, "lng": -17.404506}, {"id": "N64", "zone": "Gu\u00e9diawaye", "lat": 14.761948, "lng": -17.382123}, {"id": "N65", "zone": "Gu\u00e9diawaye", "lat": 14.781711, "lng": -17.385728}, {"id": "N66", "zone": "Gu\u00e9diawaye", "lat": 14.768573, "lng": -17.414357}, {"id": "N67", "zone": "Gu\u00e9diawaye", "lat": 14.781694, "lng": -17.381463}, {"id": "N68", "zone": "Gu\u00e9diawaye", "lat": 14.76347, "lng": -17.398518}, {"id": "N69", "zone": "Gu\u00e9diawaye", "lat": 14.763092, "lng": -17.388358}, {"id": "N70", "zone": "Gu\u00e9diawaye", "lat": 14.779114, "lng": -17.41175}, {"id": "N71", "zone": "Gu\u00e9diawaye", "lat": 14.772431, "lng": -17.396157}, {"id": "N72", "zone": "Gu\u00e9diawaye", "lat": 14.767596, "lng": -17.38422}, {"id": "N73", "zone": "Pikine", "lat": 14.713386, "lng": -17.287393}, {"id": "N74", "zone": "Pikine", "lat": 14.715825, "lng": -17.265113}, {"id": "N75", "zone": "Pikine", "lat": 14.708724, "lng": -17.283096}, {"id": "N76", "zone": "Pikine", "lat": 14.725398, "lng": -17.268555}, {"id": "N77", "zone": "Pikine", "lat": 14.7137, "lng": -17.274244}, {"id": "N78", "zone": "Pikine", "lat": 14.707041, "lng": -17.286838}, {"id": "N79", "zone": "Pikine", "lat": 14.7116, "lng": -17.271203}, {"id": "N80", "zone": "Pikine", "lat": 14.709332, "lng": -17.287031}]
const PIPES = [{"id": "PIPE-001", "from": "R1", "to": "P1", "diameter_mm": 400, "length_m": 2127, "material": "fonte", "zone": "Plateau"}, {"id": "PIPE-002", "from": "R1", "to": "J1", "diameter_mm": 350, "length_m": 463, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-003", "from": "P1", "to": "J1", "diameter_mm": 300, "length_m": 2021, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-004", "from": "J1", "to": "V1", "diameter_mm": 300, "length_m": 549, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-005", "from": "V1", "to": "R2", "diameter_mm": 300, "length_m": 1087, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-006", "from": "R2", "to": "J2", "diameter_mm": 350, "length_m": 3167, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-007", "from": "J1", "to": "J2", "diameter_mm": 250, "length_m": 2226, "material": "amiante-ciment", "zone": "Plateau", "age_years": 35, "risk": "high"}, {"id": "PIPE-008", "from": "J2", "to": "P2", "diameter_mm": 300, "length_m": 543, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-009", "from": "P2", "to": "V2", "diameter_mm": 250, "length_m": 1162, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-010", "from": "V2", "to": "J5", "diameter_mm": 300, "length_m": 1087, "material": "fonte", "zone": "Grand Dakar"}, {"id": "PIPE-011", "from": "J5", "to": "P3", "diameter_mm": 300, "length_m": 1557, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-012", "from": "P3", "to": "R4", "diameter_mm": 350, "length_m": 391, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-013", "from": "R4", "to": "J4", "diameter_mm": 300, "length_m": 944, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-014", "from": "J4", "to": "P4", "diameter_mm": 300, "length_m": 1956, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-015", "from": "P4", "to": "R3", "diameter_mm": 350, "length_m": 697, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-016", "from": "R3", "to": "J3", "diameter_mm": 300, "length_m": 783, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-017", "from": "J3", "to": "V3", "diameter_mm": 250, "length_m": 2523, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-018", "from": "V3", "to": "P5", "diameter_mm": 300, "length_m": 1399, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-019", "from": "P5", "to": "R5", "diameter_mm": 350, "length_m": 681, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-020", "from": "R5", "to": "J6", "diameter_mm": 250, "length_m": 1544, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-021", "from": "J4", "to": "J6", "diameter_mm": 200, "length_m": 2683, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-022", "from": "J6", "to": "J3", "diameter_mm": 200, "length_m": 3485, "material": "PEHD", "zone": "Gu\u00e9diawaye", "age_years": 22, "risk": "medium"}, {"id": "PIPE-023", "from": "J2", "to": "J5", "diameter_mm": 200, "length_m": 2084, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-024", "from": "J5", "to": "J4", "diameter_mm": 200, "length_m": 2874, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-025", "from": "J3", "to": "J7", "diameter_mm": 300, "length_m": 11533, "material": "acier", "zone": "Pikine", "age_years": 15}, {"id": "PIPE-026", "from": "J7", "to": "R6", "diameter_mm": 250, "length_m": 725, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-027", "from": "R6", "to": "V4", "diameter_mm": 200, "length_m": 822, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-028", "from": "J7", "to": "V4", "diameter_mm": 150, "length_m": 1546, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-029", "from": "N1", "to": "V1", "diameter_mm": 80, "length_m": 3, "material": "PEHD", "zone": "Plateau"}, {"id": "PIPE-030", "from": "N1", "to": "N10", "diameter_mm": 80, "length_m": 342, "material": "fonte", "zone": "Plateau"}, {"id": "PIPE-031", "from": "N1", "to": "N5", "diameter_mm": 125, "length_m": 435, "material": "PEHD", "zone": "Plateau"}, {"id": "PIPE-032", "from": "N2", "to": "J1", "diameter_mm": 150, "length_m": 310, "material": "PEHD", "zone": "Plateau"}, {"id": "PIPE-033", "from": "N2", "to": "N7", "diameter_mm": 80, "length_m": 500, "material": "PVC", "zone": "Plateau", "age_years": 26, "risk": "high"}, {"id": "PIPE-034", "from": "N2", "to": "N5", "diameter_mm": 100, "length_m": 526, "material": "PEHD", "zone": "Plateau", "age_years": 26, "risk": "high"}, {"id": "PIPE-035", "from": "N3", "to": "R1", "diameter_mm": 150, "length_m": 883, "material": "acier", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-036", "from": "N3", "to": "N8", "diameter_mm": 80, "length_m": 344, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-037", "from": "N3", "to": "N9", "diameter_mm": 100, "length_m": 1050, "material": "acier", "zone": "Plateau", "age_years": 18, "risk": "medium"}, {"id": "PIPE-038", "from": "N4", "to": "V1", "diameter_mm": 150, "length_m": 526, "material": "PVC", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-039", "from": "N4", "to": "N10", "diameter_mm": 80, "length_m": 245, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-040", "from": "N4", "to": "N1", "diameter_mm": 80, "length_m": 524, "material": "PEHD", "zone": "Plateau", "age_years": 10}, {"id": "PIPE-041", "from": "N5", "to": "J1", "diameter_mm": 100, "length_m": 309, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-042", "from": "N6", "to": "R1", "diameter_mm": 100, "length_m": 852, "material": "acier", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-043", "from": "N6", "to": "N9", "diameter_mm": 100, "length_m": 189, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-044", "from": "N6", "to": "N2", "diameter_mm": 80, "length_m": 646, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-045", "from": "N7", "to": "J1", "diameter_mm": 200, "length_m": 783, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-046", "from": "N7", "to": "N6", "diameter_mm": 125, "length_m": 790, "material": "PVC", "zone": "Plateau"}, {"id": "PIPE-047", "from": "N8", "to": "R1", "diameter_mm": 80, "length_m": 547, "material": "PVC", "zone": "Plateau", "age_years": 30, "risk": "high"}, {"id": "PIPE-048", "from": "N8", "to": "N9", "diameter_mm": 80, "length_m": 864, "material": "acier", "zone": "Plateau"}, {"id": "PIPE-049", "from": "N9", "to": "R1", "diameter_mm": 150, "length_m": 961, "material": "PEHD", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-050", "from": "N9", "to": "N2", "diameter_mm": 80, "length_m": 833, "material": "PEHD", "zone": "Plateau", "age_years": 18, "risk": "medium"}, {"id": "PIPE-051", "from": "N10", "to": "V1", "diameter_mm": 80, "length_m": 343, "material": "acier", "zone": "Plateau", "age_years": 12}, {"id": "PIPE-052", "from": "N11", "to": "V1", "diameter_mm": 150, "length_m": 399, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-053", "from": "N11", "to": "N16", "diameter_mm": 125, "length_m": 44, "material": "PVC", "zone": "M\u00e9dina", "age_years": 18, "risk": "medium"}, {"id": "PIPE-054", "from": "N11", "to": "N19", "diameter_mm": 80, "length_m": 119, "material": "PEHD", "zone": "M\u00e9dina", "age_years": 18, "risk": "medium"}, {"id": "PIPE-055", "from": "N12", "to": "R2", "diameter_mm": 100, "length_m": 266, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-056", "from": "N12", "to": "N14", "diameter_mm": 125, "length_m": 447, "material": "PVC", "zone": "M\u00e9dina", "age_years": 26, "risk": "high"}, {"id": "PIPE-057", "from": "N12", "to": "N18", "diameter_mm": 125, "length_m": 558, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-058", "from": "N13", "to": "P1", "diameter_mm": 80, "length_m": 546, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-059", "from": "N13", "to": "N20", "diameter_mm": 125, "length_m": 376, "material": "PVC", "zone": "M\u00e9dina", "age_years": 18, "risk": "medium"}, {"id": "PIPE-060", "from": "N13", "to": "N15", "diameter_mm": 80, "length_m": 421, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-061", "from": "N14", "to": "R2", "diameter_mm": 100, "length_m": 566, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-062", "from": "N14", "to": "N18", "diameter_mm": 80, "length_m": 813, "material": "PEHD", "zone": "M\u00e9dina", "age_years": 26, "risk": "high"}, {"id": "PIPE-063", "from": "N15", "to": "V1", "diameter_mm": 80, "length_m": 549, "material": "PVC", "zone": "M\u00e9dina", "age_years": 12}, {"id": "PIPE-064", "from": "N15", "to": "N19", "diameter_mm": 125, "length_m": 38, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-065", "from": "N15", "to": "N20", "diameter_mm": 125, "length_m": 45, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-066", "from": "N16", "to": "V1", "diameter_mm": 200, "length_m": 360, "material": "PVC", "zone": "M\u00e9dina", "age_years": 12}, {"id": "PIPE-067", "from": "N16", "to": "N19", "diameter_mm": 100, "length_m": 160, "material": "fonte", "zone": "M\u00e9dina", "age_years": 26, "risk": "high"}, {"id": "PIPE-068", "from": "N17", "to": "V1", "diameter_mm": 125, "length_m": 325, "material": "PEHD", "zone": "M\u00e9dina"}, {"id": "PIPE-069", "from": "N17", "to": "N16", "diameter_mm": 100, "length_m": 589, "material": "PEHD", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-070", "from": "N17", "to": "N11", "diameter_mm": 100, "length_m": 614, "material": "fonte", "zone": "M\u00e9dina", "age_years": 10}, {"id": "PIPE-071", "from": "N18", "to": "R2", "diameter_mm": 80, "length_m": 294, "material": "PVC", "zone": "M\u00e9dina", "age_years": 30, "risk": "high"}, {"id": "PIPE-072", "from": "N18", "to": "N17", "diameter_mm": 125, "length_m": 651, "material": "PVC", "zone": "M\u00e9dina", "age_years": 18, "risk": "medium"}, {"id": "PIPE-073", "from": "N19", "to": "V1", "diameter_mm": 80, "length_m": 518, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-074", "from": "N19", "to": "N20", "diameter_mm": 125, "length_m": 81, "material": "fonte", "zone": "M\u00e9dina"}, {"id": "PIPE-075", "from": "N20", "to": "V1", "diameter_mm": 125, "length_m": 593, "material": "PVC", "zone": "M\u00e9dina"}, {"id": "PIPE-076", "from": "N21", "to": "P1", "diameter_mm": 125, "length_m": 907, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-077", "from": "N21", "to": "N25", "diameter_mm": 100, "length_m": 495, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-078", "from": "N21", "to": "N26", "diameter_mm": 125, "length_m": 643, "material": "PVC", "zone": "Fann", "age_years": 10}, {"id": "PIPE-079", "from": "N22", "to": "P1", "diameter_mm": 200, "length_m": 487, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-080", "from": "N22", "to": "N24", "diameter_mm": 80, "length_m": 226, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-081", "from": "N22", "to": "N23", "diameter_mm": 80, "length_m": 276, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-082", "from": "N23", "to": "P1", "diameter_mm": 125, "length_m": 737, "material": "fonte", "zone": "Fann"}, {"id": "PIPE-083", "from": "N23", "to": "N24", "diameter_mm": 80, "length_m": 78, "material": "fonte", "zone": "Fann", "age_years": 26, "risk": "high"}, {"id": "PIPE-084", "from": "N24", "to": "P1", "diameter_mm": 125, "length_m": 666, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-085", "from": "N25", "to": "P1", "diameter_mm": 125, "length_m": 482, "material": "PVC", "zone": "Fann", "age_years": 12}, {"id": "PIPE-086", "from": "N25", "to": "N28", "diameter_mm": 125, "length_m": 368, "material": "acier", "zone": "Fann"}, {"id": "PIPE-087", "from": "N26", "to": "P1", "diameter_mm": 125, "length_m": 495, "material": "PVC", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-088", "from": "N26", "to": "N22", "diameter_mm": 100, "length_m": 280, "material": "PEHD", "zone": "Fann"}, {"id": "PIPE-089", "from": "N26", "to": "N24", "diameter_mm": 80, "length_m": 489, "material": "acier", "zone": "Fann", "age_years": 10}, {"id": "PIPE-090", "from": "N27", "to": "P1", "diameter_mm": 150, "length_m": 651, "material": "PVC", "zone": "Fann", "age_years": 18, "risk": "medium"}, {"id": "PIPE-091", "from": "N27", "to": "N28", "diameter_mm": 80, "length_m": 837, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-092", "from": "N27", "to": "N22", "diameter_mm": 125, "length_m": 975, "material": "PVC", "zone": "Fann"}, {"id": "PIPE-093", "from": "N28", "to": "P1", "diameter_mm": 125, "length_m": 443, "material": "PVC", "zone": "Fann", "age_years": 30, "risk": "high"}, {"id": "PIPE-094", "from": "N28", "to": "N26", "diameter_mm": 80, "length_m": 777, "material": "acier", "zone": "Fann", "age_years": 26, "risk": "high"}, {"id": "PIPE-095", "from": "N29", "to": "J2", "diameter_mm": 80, "length_m": 266, "material": "fonte", "zone": "HLM"}, {"id": "PIPE-096", "from": "N29", "to": "N36", "diameter_mm": 80, "length_m": 486, "material": "fonte", "zone": "HLM", "age_years": 10}, {"id": "PIPE-097", "from": "N29", "to": "N32", "diameter_mm": 125, "length_m": 608, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-098", "from": "N30", "to": "P2", "diameter_mm": 80, "length_m": 756, "material": "fonte", "zone": "HLM", "age_years": 24, "risk": "medium"}, {"id": "PIPE-099", "from": "N30", "to": "N35", "diameter_mm": 100, "length_m": 345, "material": "PVC", "zone": "HLM", "age_years": 26, "risk": "high"}, {"id": "PIPE-100", "from": "N30", "to": "N29", "diameter_mm": 80, "length_m": 788, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-101", "from": "N31", "to": "P2", "diameter_mm": 100, "length_m": 712, "material": "acier", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-102", "from": "N31", "to": "N33", "diameter_mm": 80, "length_m": 382, "material": "fonte", "zone": "HLM"}, {"id": "PIPE-103", "from": "N31", "to": "N32", "diameter_mm": 125, "length_m": 680, "material": "PEHD", "zone": "HLM", "age_years": 18, "risk": "medium"}, {"id": "PIPE-104", "from": "N32", "to": "P2", "diameter_mm": 100, "length_m": 204, "material": "PVC", "zone": "HLM"}, {"id": "PIPE-105", "from": "N32", "to": "N33", "diameter_mm": 80, "length_m": 490, "material": "acier", "zone": "HLM", "age_years": 18, "risk": "medium"}, {"id": "PIPE-106", "from": "N33", "to": "P2", "diameter_mm": 100, "length_m": 628, "material": "acier", "zone": "HLM"}, {"id": "PIPE-107", "from": "N34", "to": "P1", "diameter_mm": 125, "length_m": 1211, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-108", "from": "N34", "to": "N35", "diameter_mm": 80, "length_m": 548, "material": "PEHD", "zone": "HLM"}, {"id": "PIPE-109", "from": "N34", "to": "N30", "diameter_mm": 100, "length_m": 790, "material": "fonte", "zone": "HLM", "age_years": 18, "risk": "medium"}, {"id": "PIPE-110", "from": "N35", "to": "P2", "diameter_mm": 80, "length_m": 814, "material": "fonte", "zone": "HLM", "age_years": 30, "risk": "high"}, {"id": "PIPE-111", "from": "N36", "to": "J2", "diameter_mm": 200, "length_m": 394, "material": "acier", "zone": "HLM"}, {"id": "PIPE-112", "from": "N36", "to": "N32", "diameter_mm": 100, "length_m": 793, "material": "PVC", "zone": "HLM", "age_years": 26, "risk": "high"}, {"id": "PIPE-113", "from": "N37", "to": "V2", "diameter_mm": 125, "length_m": 901, "material": "PEHD", "zone": "Grand Dakar"}, {"id": "PIPE-114", "from": "N37", "to": "N39", "diameter_mm": 100, "length_m": 391, "material": "PVC", "zone": "Grand Dakar", "age_years": 26, "risk": "high"}, {"id": "PIPE-115", "from": "N37", "to": "N38", "diameter_mm": 125, "length_m": 406, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-116", "from": "N38", "to": "V2", "diameter_mm": 125, "length_m": 495, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-117", "from": "N38", "to": "N41", "diameter_mm": 125, "length_m": 385, "material": "PVC", "zone": "Grand Dakar", "age_years": 26, "risk": "high"}, {"id": "PIPE-118", "from": "N39", "to": "V2", "diameter_mm": 200, "length_m": 818, "material": "PEHD", "zone": "Grand Dakar", "age_years": 12}, {"id": "PIPE-119", "from": "N39", "to": "N44", "diameter_mm": 80, "length_m": 187, "material": "acier", "zone": "Grand Dakar", "age_years": 10}, {"id": "PIPE-120", "from": "N40", "to": "P2", "diameter_mm": 200, "length_m": 464, "material": "PVC", "zone": "Grand Dakar"}, {"id": "PIPE-121", "from": "N40", "to": "N43", "diameter_mm": 100, "length_m": 222, "material": "acier", "zone": "Grand Dakar"}, {"id": "PIPE-122", "from": "N40", "to": "N41", "diameter_mm": 125, "length_m": 463, "material": "fonte", "zone": "Grand Dakar"}, {"id": "PIPE-123", "from": "N41", "to": "V2", "diameter_mm": 125, "length_m": 688, "material": "PVC", "zone": "Grand Dakar", "age_years": 18, "risk": "medium"}, {"id": "PIPE-124", "from": "N41", "to": "N43", "diameter_mm": 125, "length_m": 277, "material": "fonte", "zone": "Grand Dakar", "age_years": 10}, {"id": "PIPE-125", "from": "N42", "to": "J5", "diameter_mm": 150, "length_m": 423, "material": "fonte", "zone": "Grand Dakar", "age_years": 24, "risk": "medium"}, {"id": "PIPE-126", "from": "N42", "to": "N44", "diameter_mm": 125, "length_m": 1224, "material": "fonte", "zone": "Grand Dakar", "age_years": 18, "risk": "medium"}, {"id": "PIPE-127", "from": "N42", "to": "N39", "diameter_mm": 80, "length_m": 1285, "material": "PEHD", "zone": "Grand Dakar", "age_years": 26, "risk": "high"}, {"id": "PIPE-128", "from": "N43", "to": "P2", "diameter_mm": 150, "length_m": 556, "material": "PEHD", "zone": "Grand Dakar", "age_years": 12}, {"id": "PIPE-129", "from": "N44", "to": "J5", "diameter_mm": 200, "length_m": 877, "material": "fonte", "zone": "Grand Dakar", "age_years": 18, "risk": "medium"}, {"id": "PIPE-130", "from": "N44", "to": "N37", "diameter_mm": 125, "length_m": 556, "material": "PVC", "zone": "Grand Dakar", "age_years": 18, "risk": "medium"}, {"id": "PIPE-131", "from": "N45", "to": "J5", "diameter_mm": 125, "length_m": 525, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-132", "from": "N45", "to": "N48", "diameter_mm": 125, "length_m": 864, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 18, "risk": "medium"}, {"id": "PIPE-133", "from": "N45", "to": "N46", "diameter_mm": 100, "length_m": 1496, "material": "acier", "zone": "Parcelles Assainies", "age_years": 10}, {"id": "PIPE-134", "from": "N46", "to": "P3", "diameter_mm": 100, "length_m": 775, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 12}, {"id": "PIPE-135", "from": "N46", "to": "N51", "diameter_mm": 125, "length_m": 310, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 18, "risk": "medium"}, {"id": "PIPE-136", "from": "N46", "to": "N48", "diameter_mm": 100, "length_m": 640, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-137", "from": "N47", "to": "P3", "diameter_mm": 200, "length_m": 688, "material": "fonte", "zone": "Parcelles Assainies", "age_years": 24, "risk": "medium"}, {"id": "PIPE-138", "from": "N47", "to": "N52", "diameter_mm": 80, "length_m": 369, "material": "fonte", "zone": "Parcelles Assainies"}, {"id": "PIPE-139", "from": "N47", "to": "N49", "diameter_mm": 80, "length_m": 492, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-140", "from": "N48", "to": "J5", "diameter_mm": 80, "length_m": 730, "material": "PEHD", "zone": "Parcelles Assainies"}, {"id": "PIPE-141", "from": "N49", "to": "J4", "diameter_mm": 200, "length_m": 839, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 12}, {"id": "PIPE-142", "from": "N49", "to": "N52", "diameter_mm": 100, "length_m": 628, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 18, "risk": "medium"}, {"id": "PIPE-143", "from": "N50", "to": "J4", "diameter_mm": 150, "length_m": 17, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-144", "from": "N50", "to": "N49", "diameter_mm": 80, "length_m": 856, "material": "PEHD", "zone": "Parcelles Assainies", "age_years": 18, "risk": "medium"}, {"id": "PIPE-145", "from": "N50", "to": "N52", "diameter_mm": 80, "length_m": 1015, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-146", "from": "N51", "to": "P3", "diameter_mm": 100, "length_m": 1055, "material": "PVC", "zone": "Parcelles Assainies"}, {"id": "PIPE-147", "from": "N51", "to": "N48", "diameter_mm": 80, "length_m": 880, "material": "PVC", "zone": "Parcelles Assainies", "age_years": 18, "risk": "medium"}, {"id": "PIPE-148", "from": "N52", "to": "R4", "diameter_mm": 80, "length_m": 343, "material": "acier", "zone": "Parcelles Assainies"}, {"id": "PIPE-149", "from": "N53", "to": "J3", "diameter_mm": 150, "length_m": 378, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-150", "from": "N53", "to": "N59", "diameter_mm": 125, "length_m": 96, "material": "fonte", "zone": "Pikine", "age_years": 26, "risk": "high"}, {"id": "PIPE-151", "from": "N53", "to": "N54", "diameter_mm": 125, "length_m": 1283, "material": "PVC", "zone": "Pikine", "age_years": 18, "risk": "medium"}, {"id": "PIPE-152", "from": "N54", "to": "P4", "diameter_mm": 200, "length_m": 609, "material": "acier", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-153", "from": "N54", "to": "N59", "diameter_mm": 125, "length_m": 1309, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-154", "from": "N55", "to": "J3", "diameter_mm": 125, "length_m": 1729, "material": "PEHD", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-155", "from": "N55", "to": "N58", "diameter_mm": 125, "length_m": 1458, "material": "acier", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-156", "from": "N56", "to": "V3", "diameter_mm": 100, "length_m": 577, "material": "fonte", "zone": "Pikine", "age_years": 24, "risk": "medium"}, {"id": "PIPE-157", "from": "N56", "to": "N60", "diameter_mm": 80, "length_m": 1025, "material": "fonte", "zone": "Pikine", "age_years": 18, "risk": "medium"}, {"id": "PIPE-158", "from": "N56", "to": "N57", "diameter_mm": 100, "length_m": 1227, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-159", "from": "N57", "to": "V3", "diameter_mm": 200, "length_m": 691, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-160", "from": "N57", "to": "N60", "diameter_mm": 80, "length_m": 358, "material": "PEHD", "zone": "Pikine"}, {"id": "PIPE-161", "from": "N58", "to": "J3", "diameter_mm": 100, "length_m": 1997, "material": "PEHD", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-162", "from": "N59", "to": "J3", "diameter_mm": 150, "length_m": 291, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-163", "from": "N60", "to": "V3", "diameter_mm": 200, "length_m": 608, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-164", "from": "N61", "to": "R3", "diameter_mm": 80, "length_m": 900, "material": "PEHD", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-165", "from": "N61", "to": "N62", "diameter_mm": 100, "length_m": 71, "material": "PVC", "zone": "Pikine", "age_years": 18, "risk": "medium"}, {"id": "PIPE-166", "from": "N61", "to": "N59", "diameter_mm": 125, "length_m": 1506, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-167", "from": "N62", "to": "R3", "diameter_mm": 80, "length_m": 946, "material": "fonte", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-168", "from": "N62", "to": "N59", "diameter_mm": 100, "length_m": 1571, "material": "acier", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-169", "from": "N63", "to": "J6", "diameter_mm": 200, "length_m": 379, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 18, "risk": "medium"}, {"id": "PIPE-170", "from": "N63", "to": "N68", "diameter_mm": 100, "length_m": 678, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-171", "from": "N63", "to": "N66", "diameter_mm": 100, "length_m": 1316, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 10}, {"id": "PIPE-172", "from": "N64", "to": "R3", "diameter_mm": 150, "length_m": 1147, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-173", "from": "N64", "to": "N72", "diameter_mm": 125, "length_m": 666, "material": "PEHD", "zone": "Gu\u00e9diawaye", "age_years": 18, "risk": "medium"}, {"id": "PIPE-174", "from": "N64", "to": "N69", "diameter_mm": 80, "length_m": 681, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 18, "risk": "medium"}, {"id": "PIPE-175", "from": "N65", "to": "R5", "diameter_mm": 80, "length_m": 1702, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 18, "risk": "medium"}, {"id": "PIPE-176", "from": "N65", "to": "N67", "diameter_mm": 125, "length_m": 458, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 26, "risk": "high"}, {"id": "PIPE-177", "from": "N65", "to": "N71", "diameter_mm": 125, "length_m": 1521, "material": "acier", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-178", "from": "N66", "to": "J6", "diameter_mm": 150, "length_m": 999, "material": "PEHD", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-179", "from": "N66", "to": "N70", "diameter_mm": 100, "length_m": 1203, "material": "acier", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-180", "from": "N67", "to": "R5", "diameter_mm": 100, "length_m": 2076, "material": "acier", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-181", "from": "N67", "to": "N72", "diameter_mm": 100, "length_m": 1593, "material": "acier", "zone": "Gu\u00e9diawaye", "age_years": 10}, {"id": "PIPE-182", "from": "N68", "to": "V3", "diameter_mm": 150, "length_m": 628, "material": "fonte", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-183", "from": "N68", "to": "N71", "diameter_mm": 100, "length_m": 1026, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-184", "from": "N69", "to": "R3", "diameter_mm": 200, "length_m": 1283, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 24, "risk": "medium"}, {"id": "PIPE-185", "from": "N69", "to": "N72", "diameter_mm": 80, "length_m": 669, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 10}, {"id": "PIPE-186", "from": "N70", "to": "P5", "diameter_mm": 80, "length_m": 1310, "material": "PVC", "zone": "Gu\u00e9diawaye", "age_years": 30, "risk": "high"}, {"id": "PIPE-187", "from": "N71", "to": "R5", "diameter_mm": 100, "length_m": 204, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-188", "from": "N71", "to": "N69", "diameter_mm": 80, "length_m": 1332, "material": "PEHD", "zone": "Gu\u00e9diawaye", "age_years": 26, "risk": "high"}, {"id": "PIPE-189", "from": "N72", "to": "R5", "diameter_mm": 150, "length_m": 1558, "material": "PVC", "zone": "Gu\u00e9diawaye"}, {"id": "PIPE-190", "from": "N73", "to": "J7", "diameter_mm": 100, "length_m": 1020, "material": "acier", "zone": "Pikine", "age_years": 18, "risk": "medium"}, {"id": "PIPE-191", "from": "N73", "to": "N80", "diameter_mm": 100, "length_m": 452, "material": "PEHD", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-192", "from": "N73", "to": "N75", "diameter_mm": 125, "length_m": 693, "material": "PVC", "zone": "Pikine", "age_years": 26, "risk": "high"}, {"id": "PIPE-193", "from": "N74", "to": "V4", "diameter_mm": 100, "length_m": 242, "material": "fonte", "zone": "Pikine", "age_years": 30, "risk": "high"}, {"id": "PIPE-194", "from": "N74", "to": "N79", "diameter_mm": 125, "length_m": 805, "material": "PVC", "zone": "Pikine"}, {"id": "PIPE-195", "from": "N74", "to": "N77", "diameter_mm": 125, "length_m": 1008, "material": "acier", "zone": "Pikine", "age_years": 10}, {"id": "PIPE-196", "from": "N75", "to": "J7", "diameter_mm": 100, "length_m": 657, "material": "PVC", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-197", "from": "N75", "to": "N80", "diameter_mm": 125, "length_m": 428, "material": "PEHD", "zone": "Pikine", "age_years": 26, "risk": "high"}, {"id": "PIPE-198", "from": "N75", "to": "N78", "diameter_mm": 125, "length_m": 443, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-199", "from": "N76", "to": "V4", "diameter_mm": 200, "length_m": 906, "material": "PVC", "zone": "Pikine", "age_years": 30, "risk": "high"}, {"id": "PIPE-200", "from": "N76", "to": "N74", "diameter_mm": 80, "length_m": 1125, "material": "fonte", "zone": "Pikine", "age_years": 26, "risk": "high"}, {"id": "PIPE-201", "from": "N76", "to": "N77", "diameter_mm": 100, "length_m": 1435, "material": "fonte", "zone": "Pikine", "age_years": 26, "risk": "high"}, {"id": "PIPE-202", "from": "N77", "to": "R6", "diameter_mm": 200, "length_m": 281, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-203", "from": "N77", "to": "N79", "diameter_mm": 100, "length_m": 401, "material": "acier", "zone": "Pikine"}, {"id": "PIPE-204", "from": "N78", "to": "J7", "diameter_mm": 150, "length_m": 1097, "material": "fonte", "zone": "Pikine"}, {"id": "PIPE-205", "from": "N78", "to": "N80", "diameter_mm": 125, "length_m": 255, "material": "PEHD", "zone": "Pikine", "age_years": 18, "risk": "medium"}, {"id": "PIPE-206", "from": "N79", "to": "R6", "diameter_mm": 100, "length_m": 387, "material": "PVC", "zone": "Pikine", "age_years": 12}, {"id": "PIPE-207", "from": "N80", "to": "J7", "diameter_mm": 125, "length_m": 1014, "material": "PVC", "zone": "Pikine", "age_years": 24, "risk": "medium"}]
const SENSORS = [{"sensor_id": "S01", "node_id": "J1", "kind": "acoustic", "name": "Acoustique Plateau", "lat": 14.688, "lng": -17.447, "zone": "Plateau", "value": 0.94, "unit": "score", "status": "critique"}, {"sensor_id": "S02", "node_id": "J2", "kind": "acoustic", "name": "Acoustique HLM", "lat": 14.705, "lng": -17.436, "zone": "HLM", "value": 0.12, "unit": "score", "status": "normal"}, {"sensor_id": "S03", "node_id": "J3", "kind": "acoustic", "name": "Acoustique Pikine", "lat": 14.75, "lng": -17.378, "zone": "Pikine", "value": 0.08, "unit": "score", "status": "normal"}, {"sensor_id": "P01", "node_id": "R1", "kind": "pressure", "name": "Pression Ch\u00e2teau d'Eau", "lat": 14.691, "lng": -17.444, "zone": "Plateau", "value": 3.4, "unit": "bar", "status": "normal"}, {"sensor_id": "P02", "node_id": "P1", "kind": "pressure", "name": "Pression Fann", "lat": 14.699, "lng": -17.462, "zone": "Fann", "value": 2.1, "unit": "bar", "status": "alerte"}, {"sensor_id": "P03", "node_id": "V2", "kind": "pressure", "name": "Pression Grand Dakar", "lat": 14.712, "lng": -17.43, "zone": "Grand Dakar", "value": 1.8, "unit": "bar", "status": "critique"}, {"sensor_id": "P04", "node_id": "P3", "kind": "pressure", "name": "Pression Parcelles", "lat": 14.729, "lng": -17.413, "zone": "Parcelles Assainies", "value": 3.2, "unit": "bar", "status": "normal"}, {"sensor_id": "P05", "node_id": "P5", "kind": "pressure", "name": "Pression Gu\u00e9diawaye", "lat": 14.77, "lng": -17.404, "zone": "Gu\u00e9diawaye", "value": 2.9, "unit": "bar", "status": "normal"}, {"sensor_id": "F01", "node_id": "P1", "kind": "flow", "name": "D\u00e9bit Fann", "lat": 14.7, "lng": -17.461, "zone": "Fann", "value": 1360, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "F02", "node_id": "P2", "kind": "flow", "name": "D\u00e9bit HLM", "lat": 14.708, "lng": -17.44, "zone": "HLM", "value": 870, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "F03", "node_id": "P3", "kind": "flow", "name": "D\u00e9bit Parcelles", "lat": 14.729, "lng": -17.413, "zone": "Parcelles Assainies", "value": 1050, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "F04", "node_id": "P4", "kind": "flow", "name": "D\u00e9bit Pikine", "lat": 14.748, "lng": -17.39, "zone": "Pikine", "value": 920, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "Q01", "node_id": "R1", "kind": "quality", "name": "Qualit\u00e9 Plateau", "lat": 14.691, "lng": -17.444, "zone": "Plateau", "value": 7.2, "unit": "pH", "status": "normal"}, {"sensor_id": "Q02", "node_id": "R2", "kind": "quality", "name": "Qualit\u00e9 M\u00e9dina", "lat": 14.686, "lng": -17.458, "zone": "M\u00e9dina", "value": 7.1, "unit": "pH", "status": "normal"}, {"sensor_id": "L01", "node_id": "R1", "kind": "level", "name": "Niveau Ch\u00e2teau d'Eau", "lat": 14.691, "lng": -17.444, "zone": "Plateau", "value": 81.3, "unit": "%", "status": "normal"}, {"sensor_id": "L02", "node_id": "R3", "kind": "level", "name": "Niveau R\u00e9servoir Pikine", "lat": 14.752, "lng": -17.385, "zone": "Pikine", "value": 68.9, "unit": "%", "status": "normal"}, {"sensor_id": "L03", "node_id": "R5", "kind": "level", "name": "Niveau R\u00e9servoir Gu\u00e9d.", "lat": 14.772, "lng": -17.398, "zone": "Gu\u00e9diawaye", "value": 72.4, "unit": "%", "status": "normal"}, {"sensor_id": "H01", "node_id": "P1", "kind": "pump_health", "name": "Sant\u00e9 Pompe Fann", "lat": 14.699, "lng": -17.462, "zone": "Fann", "value": 62, "unit": "\u00b0C", "status": "critique"}, {"sensor_id": "H02", "node_id": "P2", "kind": "pump_health", "name": "Sant\u00e9 Pompe HLM", "lat": 14.708, "lng": -17.44, "zone": "HLM", "value": 45, "unit": "\u00b0C", "status": "normal"}, {"sensor_id": "A001", "node_id": "N1", "kind": "pressure", "name": "Capteur Plateau 1", "lat": 14.69201, "lng": -17.449975, "zone": "Plateau", "value": 3.8, "unit": "bar", "status": "alerte"}, {"sensor_id": "A002", "node_id": "N2", "kind": "flow", "name": "Capteur Plateau 2", "lat": 14.685451, "lng": -17.445813, "zone": "Plateau", "value": 1092, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A003", "node_id": "N3", "kind": "quality", "name": "Capteur Plateau 3", "lat": 14.693756, "lng": -17.436289, "zone": "Plateau", "value": 6.8, "unit": "pH", "status": "critique"}, {"sensor_id": "A004", "node_id": "N4", "kind": "acoustic", "name": "Capteur Plateau 4", "lat": 14.696559, "lng": -17.448674, "zone": "Plateau", "value": 0.8, "unit": "score", "status": "normal"}, {"sensor_id": "A005", "node_id": "N5", "kind": "pressure", "name": "Capteur Plateau 5", "lat": 14.688095, "lng": -17.449874, "zone": "Plateau", "value": 2.3, "unit": "bar", "status": "normal"}, {"sensor_id": "A006", "node_id": "N6", "kind": "flow", "name": "Capteur Plateau 6", "lat": 14.684435, "lng": -17.439888, "zone": "Plateau", "value": 699, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A007", "node_id": "N7", "kind": "pressure", "name": "Capteur Plateau 7", "lat": 14.680978, "lng": -17.446324, "zone": "Plateau", "value": 3.2, "unit": "bar", "status": "normal"}, {"sensor_id": "A008", "node_id": "N8", "kind": "flow", "name": "Capteur Plateau 8", "lat": 14.692198, "lng": -17.439056, "zone": "Plateau", "value": 888, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A009", "node_id": "N9", "kind": "quality", "name": "Capteur Plateau 9", "lat": 14.684468, "lng": -17.438125, "zone": "Plateau", "value": 7.1, "unit": "pH", "status": "normal"}, {"sensor_id": "A010", "node_id": "N10", "kind": "acoustic", "name": "Capteur Plateau 10", "lat": 14.69507, "lng": -17.450364, "zone": "Plateau", "value": 0.21, "unit": "score", "status": "normal"}, {"sensor_id": "A011", "node_id": "N11", "kind": "pressure", "name": "Capteur M\u00e9dina 11", "lat": 14.693393, "lng": -17.453424, "zone": "M\u00e9dina", "value": 2.6, "unit": "bar", "status": "normal"}, {"sensor_id": "A012", "node_id": "N12", "kind": "flow", "name": "Capteur M\u00e9dina 12", "lat": 14.685944, "lng": -17.460479, "zone": "M\u00e9dina", "value": 897, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A013", "node_id": "N13", "kind": "pressure", "name": "Capteur M\u00e9dina 13", "lat": 14.695815, "lng": -17.458124, "zone": "M\u00e9dina", "value": 4.1, "unit": "bar", "status": "normal"}, {"sensor_id": "A014", "node_id": "N14", "kind": "flow", "name": "Capteur M\u00e9dina 14", "lat": 14.681984, "lng": -17.461243, "zone": "M\u00e9dina", "value": 1338, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A015", "node_id": "N15", "kind": "quality", "name": "Capteur M\u00e9dina 15", "lat": 14.69406, "lng": -17.454652, "zone": "M\u00e9dina", "value": 7.2, "unit": "pH", "status": "normal"}, {"sensor_id": "A016", "node_id": "N16", "kind": "acoustic", "name": "Capteur M\u00e9dina 16", "lat": 14.693414, "lng": -17.453013, "zone": "M\u00e9dina", "value": 0.13, "unit": "score", "status": "normal"}, {"sensor_id": "A017", "node_id": "N17", "kind": "pressure", "name": "Capteur M\u00e9dina 17", "lat": 14.68908, "lng": -17.449849, "zone": "M\u00e9dina", "value": 3.0, "unit": "bar", "status": "normal"}, {"sensor_id": "A018", "node_id": "N18", "kind": "flow", "name": "Capteur M\u00e9dina 18", "lat": 14.686557, "lng": -17.455323, "zone": "M\u00e9dina", "value": 1175, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A019", "node_id": "N19", "kind": "pressure", "name": "Capteur M\u00e9dina 19", "lat": 14.69377, "lng": -17.454459, "zone": "M\u00e9dina", "value": 2.8, "unit": "bar", "status": "normal"}, {"sensor_id": "A020", "node_id": "N20", "kind": "flow", "name": "Capteur M\u00e9dina 20", "lat": 14.694287, "lng": -17.454994, "zone": "M\u00e9dina", "value": 390, "unit": "m\u00b3/h", "status": "normal"}, {"sensor_id": "A021", "node_id": "N21", "kind": "quality", "name": "Capteur Fann 21", "lat": 14.703773, "lng": -17.468858, "zone": "Fann", "value": 6.8, "unit": "pH", "status": "normal"}, {"sensor_id": "A022", "node_id": "N22", "kind": "acoustic", "name": "Capteur Fann 22", "lat": 14.696146, "lng": -17.465449, "zone": "Fann", "value": 0.33, "unit": "score", "status": "normal"}, {"sensor_id": "A023", "node_id": "N23", "kind": "pressure", "name": "Capteur Fann 23", "lat": 14.693777, "lng": -17.466241, "zone": "Fann", "value": 2.6, "unit": "bar", "status": "critique"}, {"sensor_id": "A024", "node_id": "N24", "kind": "flow", "name": "Capteur Fann 24", "lat": 14.694116, "lng": -17.465608, "zone": "Fann", "value": 1287, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "A025", "node_id": "N25", "kind": "pressure", "name": "Capteur Fann 25", "lat": 14.702671, "lng": -17.464392, "zone": "Fann", "value": 2.8, "unit": "bar", "status": "normal"}, {"sensor_id": "A026", "node_id": "N26", "kind": "flow", "name": "Capteur Fann 26", "lat": 14.698423, "lng": -17.466567, "zone": "Fann", "value": 877, "unit": "m\u00b3/h", "status": "alerte"}, {"sensor_id": "A027", "node_id": "N27", "kind": "quality", "name": "Capteur Fann 27", "lat": 14.696772, "lng": -17.456387, "zone": "Fann", "value": 7.4, "unit": "pH", "status": "normal"}, {"sensor_id": "A028", "node_id": "N28", "kind": "acoustic", "name": "Capteur Fann 28", "lat": 14.702869, "lng": -17.460972, "zone": "Fann", "value": 0.33, "unit": "score", "status": "normal"}]
const ALERTS = [{"alert_id": "ALT-001", "type": "Fuite", "location": "Grand Dakar", "severity": "Critique", "probability": 0.94, "lat": 14.71, "lng": -17.438, "date": "2026-03-11 09:20", "status": "En cours", "description": "Vibrations acoustiques anormales sur canalisation amiante-ciment (35 ans).", "estimated_loss_m3h": 85}, {"alert_id": "ALT-002", "type": "Panne pompe", "location": "Station Fann", "severity": "Critique", "probability": 0.91, "lat": 14.699, "lng": -17.462, "date": "2026-03-11 10:10", "status": "En cours", "description": "Surchauffe 62\u00b0C et vibrations anormales sur palier.", "estimated_loss_m3h": 0}, {"alert_id": "ALT-003", "type": "D\u00e9bit anormal", "location": "Fann \u2014 Plateau", "severity": "Alerte", "probability": 0.78, "lat": 14.694, "lng": -17.453, "date": "2026-03-11 09:45", "status": "Analyse", "description": "D\u00e9bit 15% au-dessus de la normale.", "estimated_loss_m3h": 40}, {"alert_id": "ALT-004", "type": "Pression basse", "location": "M\u00e9dina", "severity": "Alerte", "probability": 0.65, "lat": 14.69, "lng": -17.455, "date": "2026-03-11 09:50", "status": "Surveillance", "description": "Pression en baisse continue depuis 2h.", "estimated_loss_m3h": 0}]
const SC: Record<string,string> = {acoustic:"#a78bfa",pressure:"#38bdf8",flow:"#34d399",quality:"#22d3ee",level:"#fbbf24",pump_health:"#f87171"}
const SEV: Record<string,string> = {Critique:"#f87171",Alerte:"#fbbf24",Moyen:"#a78bfa",Faible:"#94a3b8"}
const SYM: Record<string,string> = {reservoir:"▣",pump:"⚙",valve:"◈",junction:"◎"}

type ApiSensor = {
  id: string
  type: string
  location: string
  status: "actif" | "alerte" | "inactif"
  battery: number
  signal: number
  lastUpdate: string
  name?: string
}

type ApiAlert = {
  id: string
  type: string
  classification: string
  location: string
  severity: "critique" | "alerte" | "moyen" | "faible"
  probability: string
  date: string
  status: string
  description?: string
}

type ApiEah = {
  id: number
  name: string
  type: string
  quartier: string
  address: string
  status: "operationnel" | "degradé" | "hors_service"
  notes: string | null
  school_nearby: boolean
  gender_accessible: boolean
}

type RenderedSensor = {
  sensor_id: string
  node_id: string
  kind: string
  name: string
  lat: number
  lng: number
  zone: string
  value: string
  unit: string
  status: "normal" | "alerte" | "critique"
  location: string
  battery: number
  signal: number
  lastUpdate: string
}

type RenderedAlert = {
  alert_id: string
  type: string
  location: string
  severity: "Critique" | "Alerte" | "Moyen" | "Faible"
  probability: number
  lat: number
  lng: number
  date: string
  status: string
  description: string
  estimated_loss_m3h: number
}

type RenderedEah = {
  facility_id: number
  name: string
  type: string
  quartier: string
  address: string
  status: "operationnel" | "degradé" | "hors_service"
  notes: string
  lat: number
  lng: number
  priorityLabel: string
}

const ZONES = ["Plateau","Médina","Fann","HLM","Grand Dakar","Parcelles Assainies","Pikine","Guédiawaye"]

const ZONE_ANCHORS: Record<string, { lat: number; lng: number }> = {
  Plateau: { lat: 14.691, lng: -17.444 },
  "Médina": { lat: 14.688, lng: -17.458 },
  Fann: { lat: 14.699, lng: -17.462 },
  HLM: { lat: 14.708, lng: -17.44 },
  "Grand Dakar": { lat: 14.715, lng: -17.432 },
  "Parcelles Assainies": { lat: 14.731, lng: -17.412 },
  Pikine: { lat: 14.752, lng: -17.387 },
  "Guédiawaye": { lat: 14.772, lng: -17.398 },
}

const PARCELLES_SHIFT = {
  lat: 0.014,
  lng: -0.028,
}

function adjustNode<T extends { zone?: string; lat: number; lng: number }>(node: T): T {
  if (node.zone !== "Parcelles Assainies") return node
  return {
    ...node,
    lat: node.lat + PARCELLES_SHIFT.lat,
    lng: node.lng + PARCELLES_SHIFT.lng,
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function extractZone(value: string) {
  const normalized = normalizeText(value)
  return ZONES.find((zone) => normalized.includes(normalizeText(zone))) ?? "Plateau"
}

function sensorKindFromType(type: string) {
  const normalized = normalizeText(type)
  if (normalized.includes("pression")) return "pressure"
  if (normalized.includes("debit")) return "flow"
  if (normalized.includes("acoust")) return "acoustic"
  if (normalized.includes("qualit")) return "quality"
  if (normalized.includes("temper")) return "temperature"
  return "sensor"
}

function sensorStatusFromApi(status: ApiSensor["status"]): "normal" | "alerte" | "critique" {
  if (status === "alerte") return "alerte"
  if (status === "inactif") return "critique"
  return "normal"
}

function alertSeverityFromApi(severity: ApiAlert["severity"]): RenderedAlert["severity"] {
  if (severity === "critique") return "Critique"
  if (severity === "alerte") return "Alerte"
  if (severity === "moyen") return "Moyen"
  return "Faible"
}

function findTemplatePoint(zone: string, kind: string, usedIds: Set<string>) {
  const exact = SENSORS.find((sensor: any) => sensor.zone === zone && sensor.kind === kind && !usedIds.has(sensor.sensor_id))
  if (exact) return exact
  const sameZone = SENSORS.find((sensor: any) => sensor.zone === zone && !usedIds.has(sensor.sensor_id))
  if (sameZone) return sameZone
  return SENSORS.find((sensor: any) => !usedIds.has(sensor.sensor_id)) ?? SENSORS[0]
}

function findEahPoint(zone: string, usedIds: Set<string>) {
  const sameZone = INTER_NODES.find((node: any) => node.zone === zone && !usedIds.has(node.id))
  if (sameZone) return sameZone
  return INTER_NODES.find((node: any) => !usedIds.has(node.id)) ?? INTER_NODES[0]
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function routeWaypoints(
  from: { lat: number; lng: number; zone?: string },
  to: { lat: number; lng: number; zone?: string },
  seed = "",
) {
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const distance = Math.hypot(dx, dy) || 1
  const dirLat = dy / distance
  const dirLng = dx / distance
  const perpLat = -dirLng
  const perpLng = dirLat
  const sameZone = from.zone === to.zone
  const isLargeHub = ["Grand Dakar", "Parcelles Assainies"].includes(from.zone ?? "") || ["Grand Dakar", "Parcelles Assainies"].includes(to.zone ?? "")
  const baseCurve = sameZone ? 0.0014 : 0.0026
  const hubCurve = isLargeHub ? baseCurve * 1.9 : baseCurve
  const seedHash = hashString(`${from.zone ?? ""}:${to.zone ?? ""}:${seed}`)
  const wobble = ((seedHash % 7) - 3) * 0.00018
  const sway = hubCurve + wobble
  const inwardPull = isLargeHub ? 0.0009 : 0.0004

  const p1: [number, number] = [
    from.lat + dirLat * distance * 0.24 + perpLat * sway * 0.45 + inwardPull,
    from.lng + dirLng * distance * 0.24 + perpLng * sway * 0.45 - inwardPull,
  ]

  const p2: [number, number] = [
    (from.lat + to.lat) / 2 + perpLat * sway,
    (from.lng + to.lng) / 2 + perpLng * sway,
  ]

  const p3: [number, number] = [
    to.lat - dirLat * distance * 0.24 + perpLat * sway * 0.45 - inwardPull,
    to.lng - dirLng * distance * 0.24 + perpLng * sway * 0.45 + inwardPull,
  ]

  return [
    [from.lat, from.lng] as [number, number],
    p1,
    p2,
    p3,
    [to.lat, to.lng] as [number, number],
  ]
}

export function DakarWaterMap() {
  const mapDiv=useRef<HTMLDivElement>(null),mRef=useRef<any>(null),L=useRef<any>(null)
  const sensorLayerRef = useRef<any>(null), alertLayerRef = useRef<any>(null), eahLayerRef = useRef<any>(null)
  const [ready,setReady]=useState(false),[clock,setClock]=useState("")
  const [ss,setSS]=useState<any>(null),[sa,setSA]=useState<any>(null),[se,setSE]=useState<any>(null)
  const [open,setOpen]=useState(true),[mob,setMob]=useState(false)
  const [liveSensors, setLiveSensors] = useState<ApiSensor[] | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<ApiAlert[] | null>(null)
  const [liveEah, setLiveEah] = useState<ApiEah[] | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [sensorRes, alertRes, eahRes] = await Promise.all([
          fetch("/api/operateur/capteurs", { cache: "no-store", credentials: "include" }),
          fetch("/api/operateur/alertes", { cache: "no-store", credentials: "include" }),
          fetch("/api/operateur/eah", { cache: "no-store", credentials: "include" }),
        ])

        if (!cancelled && sensorRes.ok) {
          const sensorJson = await sensorRes.json()
          setLiveSensors(sensorJson.items ?? [])
        }

        if (!cancelled && alertRes.ok) {
          const alertJson = await alertRes.json()
          setLiveAlerts(alertJson.items ?? [])
        }

        if (!cancelled && eahRes.ok) {
          const eahJson = await eahRes.json()
          setLiveEah(eahJson.items ?? [])
        }
      } catch {
        // Keep static fallbacks if live operator endpoints are unavailable.
      }
    }

    load()
    const id = window.setInterval(load, 30000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const renderedSensors = useMemo<RenderedSensor[]>(() => {
    if (!liveSensors?.length) {
      return SENSORS.map((sensor: any) => {
        const adjusted = adjustNode(sensor)
        return {
          ...sensor,
          lat: adjusted.lat,
          lng: adjusted.lng,
          value: String(sensor.value),
          location: sensor.zone,
          battery: 100,
          signal: 100,
          lastUpdate: "démo",
        }
      })
    }

    const usedIds = new Set<string>()
    return liveSensors.slice(0, 40).map((sensor) => {
      const zone = extractZone(sensor.location || sensor.name || "")
      const kind = sensorKindFromType(sensor.type)
      const point = findTemplatePoint(zone, kind, usedIds)
      const adjusted = adjustNode(point)
      usedIds.add(point.sensor_id)
      return {
        sensor_id: sensor.id,
        node_id: point.node_id,
        kind,
        name: sensor.name || `${sensor.type} ${sensor.id}`,
        lat: adjusted.lat,
        lng: adjusted.lng,
        zone,
        value: `${sensor.signal}`,
        unit: "% sig",
        status: sensorStatusFromApi(sensor.status),
        location: sensor.location,
        battery: sensor.battery,
        signal: sensor.signal,
        lastUpdate: sensor.lastUpdate,
      }
    })
  }, [liveSensors])

  const renderedAlerts = useMemo<RenderedAlert[]>(() => {
    if (!liveAlerts?.length) {
      return ALERTS.map((alert: any) => {
        const zone = extractZone(alert.location)
        const adjusted = adjustNode({ lat: alert.lat, lng: alert.lng, zone })
        return {
          ...alert,
          severity: alert.severity as RenderedAlert["severity"],
          lat: adjusted.lat,
          lng: adjusted.lng,
        }
      })
    }

    const usedIds = new Set<string>()
    return liveAlerts.slice(0, 10).map((alert) => {
      const zone = extractZone(alert.location)
      const kind = alert.classification === "Fuite" ? "acoustic" : alert.classification === "Fraude" ? "flow" : alert.classification === "Contamination" ? "quality" : "pressure"
      const point = findTemplatePoint(zone, kind, usedIds)
      const adjusted = adjustNode(point)
      usedIds.add(point.sensor_id)
      const probability = Number.parseInt(String(alert.probability).replace("%", ""), 10)
      return {
        alert_id: alert.id,
        type: alert.type,
        location: alert.location,
        severity: alertSeverityFromApi(alert.severity),
        probability: Number.isNaN(probability) ? 60 : probability / 100,
        lat: adjusted.lat,
        lng: adjusted.lng,
        date: alert.date,
        status: alert.status,
        description: alert.description ?? `Alerte ${alert.type} détectée sur ${alert.location}.`,
        estimated_loss_m3h: alert.classification === "Fuite" ? 85 : alert.classification === "Fraude" ? 40 : 0,
      }
    })
  }, [liveAlerts])

  const renderedEah = useMemo<RenderedEah[]>(() => {
    if (!liveEah?.length) return []

    const usedIds = new Set<string>()
    return liveEah.map((facility) => {
      const zone = extractZone(facility.quartier || facility.address || facility.name)
      const point = findEahPoint(zone, usedIds)
      const adjusted = adjustNode(point)
      usedIds.add(point.id)
      return {
        facility_id: facility.id,
        name: facility.name,
        type: facility.type,
        quartier: facility.quartier,
        address: facility.address,
        status: facility.status,
        notes: facility.notes ?? "Aucune note terrain.",
        lat: adjusted.lat,
        lng: adjusted.lng,
        priorityLabel:
          facility.status === "hors_service"
            ? "Intervention urgente"
            : facility.school_nearby || facility.gender_accessible
              ? "Priorité terrain"
              : "Suivi standard",
      }
    })
  }, [liveEah])

  useEffect(()=>{const c=()=>{const m=window.innerWidth<768;setMob(m)};c();window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c)},[])
  useEffect(()=>{const t=setInterval(()=>setClock(new Date().toLocaleTimeString("fr-FR")),1000);return()=>clearInterval(t)},[])
  useEffect(()=>{if(mRef.current)setTimeout(()=>mRef.current.invalidateSize(),300)},[open])
  useEffect(()=>{
    if(mRef.current||!mapDiv.current)return
    import("leaflet").then(lm=>{
      const Lf=lm.default??lm;if(mRef.current||!mapDiv.current)return
      const map=Lf.map(mapDiv.current,{center:[14.725,-17.400],zoom:12,zoomControl:false,attributionControl:false})
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:19}).addTo(map)
      Lf.control.zoom({position:"bottomright"}).addTo(map)
      L.current=Lf;mRef.current=map;setReady(true)
    })
    return()=>{if(mRef.current){mRef.current.remove();mRef.current=null}}
  },[])

  useEffect(()=>{
    if(!ready)return
    const Lf=L.current,map=mRef.current;if(!Lf||!map)return
    const nm:Record<string,any>={}
    NODES.forEach((n:any)=>nm[n.id]=adjustNode(n));INTER_NODES.forEach((n:any)=>nm[n.id]=adjustNode(n))
    PIPES.forEach((p:any)=>{
      const f=nm[p.from],t=nm[p.to];if(!f||!t)return
      // Couleur & opacité par niveau de risque
      const baseColor = p.risk==="high"?"#f87171":p.risk==="medium"?"#fbbf24":"#22d3ee"
      const trackOpacity = p.risk==="high"?0.55:p.risk==="medium"?0.48:0.38
      const flowOpacity  = p.risk==="high"?0.90:p.risk==="medium"?0.82:0.75
      // Épaisseur proportionnelle au diamètre
      const baseW = Math.max(1.4,(p.diameter_mm||150)/130)
      const flowW = Math.max(0.8, baseW * 0.55)
      // Vitesse d'animation : rapide sur grosses artères, lent sur secondaires
      const flowClass = p.diameter_mm>=300?"aqwFast":p.diameter_mm>=150?"aqwMid":"aqwSlow"
      // dashArray flow : tirets courts sur risque élevé (flux réduit), longs sur normal
      const flowDash = p.risk==="high"?"4 20":p.risk==="medium"?"7 17":"10 14"
      const tooltip = `<div style="background:#0f172a;border:1px solid ${baseColor}44;color:#e2e8f0;padding:5px 9px;border-radius:6px;font-size:11px;font-family:monospace"><b style="color:${baseColor}">${p.id}</b><br/>${p.from}→${p.to} ∅${p.diameter_mm}mm · ${p.material}${p.age_years?` · ⚠ ${p.age_years} ans`:""}</div>`
      const waypoints = routeWaypoints(f, t, p.id)
      // COUCHE 1 — tracé de base (couleur pleine, indique le risque)
      Lf.polyline(waypoints,{
        color:baseColor, weight:baseW, opacity:trackOpacity,
        lineCap: "round", lineJoin: "round",
      }).addTo(map).bindTooltip(tooltip,{sticky:true,opacity:1})
      // COUCHE 2 — flux animé (tirets qui défilent = eau qui coule)
      Lf.polyline(waypoints,{
        color:baseColor, weight:flowW, opacity:flowOpacity,
        dashArray:"4 12", className:"aqp-flow-link",
        lineCap: "round", lineJoin: "round",
      }).addTo(map)
    })
    NODES.map(adjustNode).forEach((node:any)=>{
      const nc=node.type==="reservoir"?"#38bdf8":node.type==="pump"?"#fbbf24":node.type==="valve"?"#a78bfa":"#64748b"
      Lf.marker([node.lat,node.lng],{icon:Lf.divIcon({html:`<div style="width:28px;height:28px;background:${nc}22;border:2px solid ${nc};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;color:${nc};box-shadow:0 0 8px ${nc}55">${SYM[node.type]||"●"}</div>`,className:"",iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map)
        .bindTooltip(`<div style="background:#0f172a;border:1px solid ${nc}44;color:#e2e8f0;padding:5px 9px;border-radius:6px;font-size:11px;font-family:monospace"><b style="color:${nc}">${node.name}</b><br/>${node.zone}</div>`,{sticky:true,opacity:1})
    })

    ZONES.forEach((zoneName) => {
      let anchor = ZONE_ANCHORS[zoneName]
      if (zoneName === "Parcelles Assainies") {
        anchor = {
          lat: anchor.lat + 0.014,
          lng: anchor.lng - 0.028,
        }
      }
      if (!anchor) return

      const color = "#22d3ee" // Default generic tech blue for operator zones
      Lf.circle([anchor.lat, anchor.lng], {
        radius: 640,
        color: `${color}AA`,
        weight: 1,
        fillColor: `${color}`,
        fillOpacity: 0.04,
        opacity: 0.45,
        interactive: false,
      }).addTo(map)

      Lf.marker([anchor.lat, anchor.lng], {
        icon: Lf.divIcon({
          html: `<div style="background:rgba(2,6,23,.78);border:1px solid ${color}55;color:#f3f4f6;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;box-shadow:0 0 10px rgba(0,0,0,.22);white-space:nowrap">${zoneName}</div>`,
          className: "",
          iconSize: [100, 24],
          iconAnchor: [45, 12],
        }),
        interactive: false,
      }).addTo(map)
    })
      sensorLayerRef.current = Lf.layerGroup().addTo(map)
      alertLayerRef.current = Lf.layerGroup().addTo(map)
      eahLayerRef.current = Lf.layerGroup().addTo(map)
  },[ready])

  useEffect(()=>{
    if(!ready)return
    const Lf=L.current,map=mRef.current,sensorLayer=sensorLayerRef.current,alertLayer=alertLayerRef.current,eahLayer=eahLayerRef.current
    if(!Lf||!map||!sensorLayer||!alertLayer||!eahLayer)return
    sensorLayer.clearLayers()
    alertLayer.clearLayers()
    eahLayer.clearLayers()
    renderedSensors.forEach((s:any)=>{
      const c=s.status==="critique"?"#f87171":s.status==="alerte"?"#fbbf24":SC[s.kind]||"#34d399"
      const pulse=s.status!=="normal"
      Lf.marker([s.lat,s.lng],{icon:Lf.divIcon({html:`<div style="position:relative;width:18px;height:18px">${pulse?`<div style="position:absolute;inset:-5px;border-radius:50%;background:${c}33;animation:sP 1.8s ease-out infinite"></div><style>@keyframes sP{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}</style>`:""}<div style="position:relative;width:18px;height:18px;border-radius:50%;background:${c}33;border:2px solid ${c};box-shadow:0 0 6px ${c}88"></div></div>`,className:"",iconSize:[18,18],iconAnchor:[9,9]})}).addTo(sensorLayer)
        .on("click",()=>{setSS(s);setSA(null);setSE(null);if(window.innerWidth<768)setOpen(true)})
        .bindTooltip(`<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:5px 9px;border-radius:6px;font-size:11px;font-family:monospace"><b style="color:${c}">${s.name}</b><br/>${s.location}<br/>Signal ${s.value}${s.unit}</div>`,{sticky:true,opacity:1})
    })
    renderedAlerts.forEach((a:any)=>{
      const c=SEV[a.severity]
      Lf.circle([a.lat,a.lng],{radius:170,color:c,fillColor:c,fillOpacity:0.08,weight:1.5,dashArray:"4 4"}).addTo(alertLayer)
      Lf.marker([a.lat,a.lng],{icon:Lf.divIcon({html:`<div style="width:28px;height:28px;border-radius:50%;border:2px solid ${c};background:${c}22;box-shadow:0 0 12px ${c}88;display:flex;align-items:center;justify-content:center;font-size:13px">⚠</div>`,className:"",iconSize:[28,28],iconAnchor:[14,14],zIndexOffset:1000})}).addTo(alertLayer)
        .on("click",()=>{setSA(a);setSS(null);setSE(null);if(window.innerWidth<768)setOpen(true)})
    })
    renderedEah.forEach((site:any)=>{
      const c=site.status==="hors_service"?"#fb7185":site.status==="degradé"?"#22d3ee":"#34d399"
      Lf.circle([site.lat,site.lng],{radius:120,color:c,fillColor:c,fillOpacity:0.06,weight:1}).addTo(eahLayer)
      Lf.marker([site.lat,site.lng],{icon:Lf.divIcon({html:`<div style="width:24px;height:24px;border-radius:8px;border:2px solid ${c};background:${c}20;box-shadow:0 0 10px ${c}66;display:flex;align-items:center;justify-content:center;font-size:12px">🚰</div>`,className:"",iconSize:[24,24],iconAnchor:[12,12]})}).addTo(eahLayer)
        .on("click",()=>{setSE(site);setSS(null);setSA(null);if(window.innerWidth<768)setOpen(true)})
        .bindTooltip(`<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:5px 9px;border-radius:6px;font-size:11px;font-family:monospace"><b style="color:${c}">${site.name}</b><br/>${site.quartier} · ${site.status}</div>`,{sticky:true,opacity:1})
    })
  },[ready, renderedSensors, renderedAlerts, renderedEah])

  const td=renderedSensors.filter((s:any)=>s.kind==="flow").length
  const sN=renderedSensors.filter((s:any)=>s.status==="normal").length,sA=renderedSensors.filter((s:any)=>s.status==="alerte").length,sC=renderedSensors.filter((s:any)=>s.status==="critique").length
  const eOperational=renderedEah.filter((site:any)=>site.status==="operationnel").length
  const eAlert=renderedEah.filter((site:any)=>site.status==="degradé").length
  const eCritical=renderedEah.filter((site:any)=>site.status==="hors_service").length
  const W=255

  const SB=()=>(
    <div style={{display:"flex",flexDirection:"column",gap:14,padding:14,fontFamily:"monospace"}}>
      <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>AQUAPULSE — OPÉRATEUR</p>
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>RÉSEAU</p>
        {[{l:"Conduites",v:`${PIPES.length}`},{l:"Nœuds",v:`${NODES.length}`},{l:"Capteurs débit",v:`${td}`},{l:"Assainissement",v:`${renderedEah.length}`},{l:"Synchro",v:clock}].map(x=>(
          <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(34,211,238,.08)"}}>
            <span style={{color:"#64748b",fontSize:11}}>{x.l}</span><span style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>{x.v}</span>
          </div>
        ))}
      </div>
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>CAPTEURS&nbsp;<span style={{color:"#34d399"}}>{sN}✓</span>{" "}<span style={{color:"#fbbf24"}}>{sA}⚠</span>{" "}<span style={{color:"#f87171"}}>{sC}✕</span></p>
        <div style={{maxHeight:175,overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
          {renderedSensors.filter((s:any)=>["pressure","flow","acoustic"].includes(s.kind)).map((s:any)=>{
            const c=s.status==="critique"?"#f87171":s.status==="alerte"?"#fbbf24":"#34d399"
            return(<div key={s.sensor_id} onClick={()=>{setSS(s);setSA(null);if(mob)setOpen(true);mRef.current?.setView([s.lat,s.lng],16)}}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 7px",borderRadius:5,cursor:"pointer",background:ss?.sensor_id===s.sensor_id?`${c}18`:"transparent",transition:"all .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:c}}/><span style={{color:"#94a3b8",fontSize:10,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span></div>
              <span style={{color:c,fontSize:10,fontWeight:700}}>{s.value}{s.unit}</span>
            </div>)
          })}
        </div>
      </div>
      <div>
        <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>ALERTES&nbsp;<span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{renderedAlerts.length}</span></p>
        {renderedAlerts.map((a:any)=>{const c=SEV[a.severity];return(
          <div key={a.alert_id} onClick={()=>{setSA(a);setSS(null);setSE(null);if(mob)setOpen(true);mRef.current?.setView([a.lat,a.lng],15)}}
            style={{padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:4,background:`${c}0d`,borderLeft:`3px solid ${c}`,borderTop:`1px solid ${c}18`,borderRight:`1px solid ${c}18`,borderBottom:`1px solid ${c}18`}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:c,fontSize:11,fontWeight:700}}>{a.type}</span><span style={{color:c,fontSize:10}}>{(a.probability*100).toFixed(0)}%</span></div>
            <div style={{color:"#64748b",fontSize:10,marginTop:2}}>{a.location}</div>
          </div>
        )})}
      </div>
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>ASSAIN.&nbsp;<span style={{color:"#34d399"}}>{eOperational}✓</span>{" "}<span style={{color:"#22d3ee"}}>{eAlert}△</span>{" "}<span style={{color:"#fb7185"}}>{eCritical}✕</span></p>
        <div style={{maxHeight:150,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
          {renderedEah.map((site:any)=>{
            const c=site.status==="hors_service"?"#fb7185":site.status==="degradé"?"#22d3ee":"#34d399"
            return(
              <div key={site.facility_id} onClick={()=>{setSE(site);setSS(null);setSA(null);if(mob)setOpen(true);mRef.current?.setView([site.lat,site.lng],15)}}
                style={{padding:"6px 8px",borderRadius:6,cursor:"pointer",background:se?.facility_id===site.facility_id?`${c}18`:"transparent",border:`1px solid ${c}18`}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <span style={{color:"#e2e8f0",fontSize:10,fontWeight:700,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.name}</span>
                  <span style={{color:c,fontSize:10}}>{site.status}</span>
                </div>
                <div style={{color:"#64748b",fontSize:10,marginTop:2}}>{site.quartier}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const DP=()=>{
    if(!ss&&!sa&&!se)return null
    return(<div style={{padding:14,display:"flex",flexDirection:"column",gap:9}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>{ss?"CAPTEUR":sa?"ALERTE":"INSTALLATION"}</span>
        <button onClick={()=>{setSS(null);setSA(null);setSE(null);if(mob)setOpen(false)}} style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {ss&&(()=>{const c=ss.status==="critique"?"#f87171":ss.status==="alerte"?"#fbbf24":SC[ss.kind]||"#34d399";return(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{color:c,fontSize:13,fontWeight:700}}>{ss.name}</div>
          <div style={{color:"#64748b",fontSize:11}}>{ss.location || ss.zone} · {ss.kind}</div>
          <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:6,padding:"10px 14px",textAlign:"center"}}>
            <div style={{color:c,fontSize:22,fontWeight:700}}>{ss.value}</div><div style={{color:"#64748b",fontSize:11}}>{ss.unit}</div>
          </div>
          {typeof ss.battery === "number" && typeof ss.signal === "number" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"rgba(15,23,42,.55)",border:"1px solid rgba(100,116,139,.2)",borderRadius:6,padding:"8px 10px"}}>
                <div style={{color:"#64748b",fontSize:10}}>Batterie</div>
                <div style={{color:"#e2e8f0",fontSize:12,fontWeight:700}}>{ss.battery}%</div>
              </div>
              <div style={{background:"rgba(15,23,42,.55)",border:"1px solid rgba(100,116,139,.2)",borderRadius:6,padding:"8px 10px"}}>
                <div style={{color:"#64748b",fontSize:10}}>Signal</div>
                <div style={{color:"#e2e8f0",fontSize:12,fontWeight:700}}>{ss.signal}%</div>
              </div>
            </div>
          )}
          {ss.lastUpdate && <div style={{color:"#64748b",fontSize:11}}>Dernière remontée: {ss.lastUpdate}</div>}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 9px",borderRadius:4,background:`${c}22`,border:`1px solid ${c}44`,alignSelf:"flex-start"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:c}}/><span style={{color:c,fontSize:11,fontWeight:600,textTransform:"uppercase"}}>{ss.status}</span>
          </div>
        </div>
      )})()}
      {sa&&!ss&&(()=>{const c=SEV[sa.severity];return(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{color:c,fontSize:13,fontWeight:700}}>⚠ {sa.type}</div>
          <div style={{color:"#e2e8f0",fontSize:12}}>{sa.location}</div>
          <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:6,padding:"8px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:"#64748b",fontSize:11}}>Probabilité IA</span><span style={{color:c,fontSize:13,fontWeight:700}}>{(sa.probability*100).toFixed(0)}%</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b",fontSize:11}}>Statut</span><span style={{color:"#e2e8f0",fontSize:11}}>{sa.status}</span></div>
            {sa.estimated_loss_m3h>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><span style={{color:"#64748b",fontSize:11}}>Perte</span><span style={{color:"#f87171",fontSize:11,fontWeight:700}}>{sa.estimated_loss_m3h} m³/h</span></div>}
          </div>
          <div style={{color:"#64748b",fontSize:11,lineHeight:1.5}}>{sa.description}</div>
        </div>
      )})()}
      {se&&!ss&&!sa&&(()=>{const c=se.status==="hors_service"?"#fb7185":se.status==="degradé"?"#22d3ee":"#34d399";return(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{color:c,fontSize:13,fontWeight:700}}>🚰 {se.name}</div>
          <div style={{color:"#e2e8f0",fontSize:12}}>{se.quartier}</div>
          <div style={{color:"#64748b",fontSize:11,lineHeight:1.5}}>{se.address}</div>
          <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:6,padding:"8px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:"#64748b",fontSize:11}}>Statut</span><span style={{color:c,fontSize:12,fontWeight:700}}>{se.status}</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b",fontSize:11}}>Priorité</span><span style={{color:"#e2e8f0",fontSize:11}}>{se.priorityLabel}</span></div>
          </div>
          <div style={{color:"#64748b",fontSize:11,lineHeight:1.5}}>{se.notes}</div>
        </div>
      )})()}
    </div>)
  }

  return(
    <div style={{fontFamily:"monospace",position:"relative",width:"100%",height:"100%",display:"flex"}}>
      <style>{`
  .aqsb::-webkit-scrollbar{width:3px}
  .aqsb::-webkit-scrollbar-thumb{background:rgba(34,211,238,.25);border-radius:2px}
  .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
  .leaflet-tooltip::before{display:none!important}
  /* ── ANIMATION CIRCULATION EAU ── */
  @keyframes aqwFlowAnim{ from{stroke-dashoffset:0} to{stroke-dashoffset:-48} }
  .aqwFast  path{ animation:aqwFlowAnim 1.1s linear infinite; stroke-linecap: round; stroke-linejoin: round; }
  .aqwMid   path{ animation:aqwFlowAnim 2.2s linear infinite; stroke-linecap: round; stroke-linejoin: round; }
  .aqwSlow  path{ animation:aqwFlowAnim 4.0s linear infinite; stroke-linecap: round; stroke-linejoin: round; }
  .aqp-flow-link{
    animation: aqpFlowDash 7s linear infinite;
  }
  .aqp-flow-link path{
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @keyframes aqpFlowDash{
    from{stroke-dashoffset: 0;}
    to{stroke-dashoffset: -180;}
  }
`}</style>
      {mob && open && <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 999, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }} />}
      <div style={{
          width: open ? (mob ? 280 : W) : 0,
          minWidth: open ? (mob ? 0 : W) : 0,
          height: "100%",
          overflow: "hidden",
          transition: "all .25s ease-in-out",
          background: "#020817",
          borderRight: "1px solid rgba(34,211,238,.22)",
          flexShrink: 0,
          position: mob ? "absolute" : "relative",
          zIndex: mob ? 1000 : 1,
          left: 0,
          top: 0
      }}>
        <div className="aqsb" style={{ width: mob ? 280 : W, height: "100%", overflowY: "auto", opacity: open ? 1 : 0, transition: "opacity .2s" }}>
          {mob && (ss || sa || se) ? <DP /> : <SB />}
        </div>
      </div>
      <div style={{flex:1,position:"relative",minWidth:0}}>
        <button onClick={()=>setOpen(o=>!o)} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",zIndex:998,width:22,height:54,background:"#020817",border:"1px solid rgba(34,211,238,.35)",borderLeft:"none",borderRadius:"0 8px 8px 0",cursor:"pointer",color:"#22d3ee",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"3px 0 12px rgba(0,0,0,.5)"}}>{open?"‹":"›"}</button>
        {mob && !open && (<button onClick={()=>setOpen(true)} style={{position:"absolute",bottom:88,left:12,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.4)",borderRadius:12,padding:"9px 14px",color:"#22d3ee",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,0,0,.6)"}}>☰ Réseau</button>)}
        <div ref={mapDiv} style={{width:"100%",height:"100%"}}/>
        <div style={{position:"absolute",bottom:40,right:12,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,padding:"10px 14px"}}>
          <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:5}}>LÉGENDE</p>
          {[
              {c:"#22d3ee",l:"Flux eau — artère principale",dash:"10 14"},
              {c:"#fbbf24",l:"Flux eau — risque moyen",dash:"7 17"},
              {c:"#f87171",l:"Flux eau — risque élevé",dash:"4 20"},
              {c:"#38bdf8",l:"Réservoir ▣",dash:null},
              {c:"#fbbf24",l:"Pompe ⚙",dash:null},
              {c:"#a78bfa",l:"Vanne ◈",dash:null},
              {c:"#f87171",l:"Zone d'alerte ⚠",dash:null},
            ].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                {x.dash
                  ? <svg width="22" height="4" style={{flexShrink:0}}>
                      <line x1="0" y1="2" x2="22" y2="2"
                        stroke={x.c} strokeWidth="2"
                        strokeDasharray={x.dash} strokeLinecap="round"/>
                    </svg>
                  : <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
                }
                <span style={{color:"#64748b",fontSize:10}}>{x.l}</span>
              </div>
            ))}
        </div>
        {!mob&&(ss||sa||se)&&(<div style={{position:"absolute",right:12,top:12,width:225,zIndex:1000,background:"#020817",border:"1px solid rgba(34,211,238,.22)",borderRadius:10,maxHeight:"calc(100%-24px)",overflowY:"auto"}}><DP/></div>)}
      </div>
      
    </div>
  )
}
