"use client"

import { useEffect, useRef, useState } from "react"

const NODES = [{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.6937,"lng":-17.4441,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.6891,"lng":-17.4512,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.7512,"lng":-17.3891,"zone":"Pikine","capacity_m3":45000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.6978,"lng":-17.4623,"zone":"Fann","flow_m3h":1200},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.7089,"lng":-17.4401,"zone":"HLM","flow_m3h":900},{"id":"P3","type":"pump","name":"Station Pompage Parcelles","lat":14.7334,"lng":-17.4123,"zone":"Parcelles Assainies","flow_m3h":1100},{"id":"V1","type":"valve","name":"Vanne Médina Nord","lat":14.6945,"lng":-17.4478,"zone":"Médina","open_pct":100},{"id":"V2","type":"valve","name":"Vanne Grand Dakar","lat":14.7123,"lng":-17.4289,"zone":"Grand Dakar","open_pct":75},{"id":"V3","type":"valve","name":"Vanne Guédiawaye","lat":14.7445,"lng":-17.4034,"zone":"Guédiawaye","open_pct":100},{"id":"J1","type":"junction","name":"Nœud Central Plateau","lat":14.6912,"lng":-17.4467,"zone":"Plateau"},{"id":"J2","type":"junction","name":"Nœud HLM-Médina","lat":14.7034,"lng":-17.4356,"zone":"HLM"},{"id":"J3","type":"junction","name":"Nœud Pikine Est","lat":14.7489,"lng":-17.3956,"zone":"Pikine"}]
const INTER_NODES = [{"id":"N1","zone":"Plateau","lat":14.694115414387662,"lng":-17.451749892447772},{"id":"N2","zone":"Plateau","lat":14.691200234546953,"lng":-17.44976789261851},{"id":"N3","zone":"Plateau","lat":14.694891769713312,"lng":-17.445233005125772},{"id":"N4","zone":"Plateau","lat":14.696137436541639,"lng":-17.451130611673705},{"id":"N5","zone":"Plateau","lat":14.692375374557482,"lng":-17.45170202780562},{"id":"N6","zone":"Plateau","lat":14.690749103798428,"lng":-17.446946447118965},{"id":"N7","zone":"Plateau","lat":14.68921228775747,"lng":-17.450011623493133},{"id":"N8","zone":"Plateau","lat":14.694199075502235,"lng":-17.446550585193968},{"id":"N9","zone":"Plateau","lat":14.690763524976326,"lng":-17.44610734316124},{"id":"N10","zone":"Plateau","lat":14.695475443653422,"lng":-17.45193501240322},{"id":"N11","zone":"Médina","lat":14.689140734762828,"lng":-17.451216745445105},{"id":"N12","zone":"Médina","lat":14.685881753615625,"lng":-17.456100684501692},{"id":"N13","zone":"Médina","lat":14.690200491505447,"lng":-17.454470649093984},{"id":"N14","zone":"Médina","lat":14.684149220903661,"lng":-17.456629552608497},{"id":"N15","zone":"Médina","lat":14.689432460564431,"lng":-17.452066465717696},{"id":"N16","zone":"Médina","lat":14.68914989791292,"lng":-17.450932413919755},{"id":"N17","zone":"Médina","lat":14.687253596640183,"lng":-17.448741958124184},{"id":"N18","zone":"Médina","lat":14.686149740640458,"lng":-17.45253163431854},{"id":"N19","zone":"Médina","lat":14.68930583264977,"lng":-17.451933322228722},{"id":"N20","zone":"Médina","lat":14.689531948302175,"lng":-17.45230383069269},{"id":"N21","zone":"Fann","lat":14.701432002853505,"lng":-17.466633404930757},{"id":"N22","zone":"Fann","lat":14.69809528792956,"lng":-17.464684896291185},{"id":"N23","zone":"Fann","lat":14.697058543838464,"lng":-17.465137672909112},{"id":"N24","zone":"Fann","lat":14.697207010005867,"lng":-17.46477621117512},{"id":"N25","zone":"Fann","lat":14.70094979110985,"lng":-17.46408134256824},{"id":"N26","zone":"Fann","lat":14.699091266769818,"lng":-17.46532394375383},{"id":"N27","zone":"Fann","lat":14.698368844754343,"lng":-17.4595067632983},{"id":"N28","zone":"Fann","lat":14.701036247696726,"lng":-17.462126951954666},{"id":"N29","zone":"Fann","lat":14.697697970537385,"lng":-17.461166985616398},{"id":"N30","zone":"Fann","lat":14.697643817456333,"lng":-17.46396435646594},{"id":"N31","zone":"HLM","lat":14.709916186805092,"lng":-17.43860000240146},{"id":"N32","zone":"HLM","lat":14.706455597950196,"lng":-17.438153857490104},{"id":"N33","zone":"HLM","lat":14.708742815361518,"lng":-17.43724000088454},{"id":"N34","zone":"HLM","lat":14.703832384575712,"lng":-17.44467899756096},{"id":"N35","zone":"HLM","lat":14.704523624384473,"lng":-17.442322591240245},{"id":"N36","zone":"HLM","lat":14.70368786274869,"lng":-17.43557090285665},{"id":"N37","zone":"HLM","lat":14.709010941011782,"lng":-17.441853221192016},{"id":"N38","zone":"HLM","lat":14.707243509322359,"lng":-17.441043680989395},{"id":"N39","zone":"HLM","lat":14.709316380717924,"lng":-17.440411481474126},{"id":"N40","zone":"HLM","lat":14.704119041331984,"lng":-17.442533724923063},{"id":"N41","zone":"Grand Dakar","lat":14.712552313207468,"lng":-17.43237258391477},{"id":"N42","zone":"Grand Dakar","lat":14.712761273912012,"lng":-17.426021771163974},{"id":"N43","zone":"Grand Dakar","lat":14.711094604546263,"lng":-17.432806792408428},{"id":"N44","zone":"Grand Dakar","lat":14.716477838458456,"lng":-17.429904737063236},{"id":"N45","zone":"Grand Dakar","lat":14.708318184709563,"lng":-17.434528836245754},{"id":"N46","zone":"Grand Dakar","lat":14.708486842173155,"lng":-17.42872553958297},{"id":"N47","zone":"Grand Dakar","lat":14.714628714279266,"lng":-17.430778400332002},{"id":"N48","zone":"Grand Dakar","lat":14.708071749355367,"lng":-17.431183807134936},{"id":"N49","zone":"Grand Dakar","lat":14.71646509242216,"lng":-17.42970885654901},{"id":"N50","zone":"Grand Dakar","lat":14.716239705398522,"lng":-17.426392202977656},{"id":"N51","zone":"Parcelles Assainies","lat":14.728114810219429,"lng":-17.412351338167678},{"id":"N52","zone":"Parcelles Assainies","lat":14.734817103690267,"lng":-17.414556356035092},{"id":"N53","zone":"Parcelles Assainies","lat":14.730668251899527,"lng":-17.413308458417042},{"id":"N54","zone":"Parcelles Assainies","lat":14.72911552173596,"lng":-17.41578281699197},{"id":"N55","zone":"Parcelles Assainies","lat":14.732537237063292,"lng":-17.409554208869746},{"id":"N56","zone":"Parcelles Assainies","lat":14.736758529403783,"lng":-17.417839331390987},{"id":"N57","zone":"Parcelles Assainies","lat":14.733005861130504,"lng":-17.41885617743364},{"id":"N58","zone":"Parcelles Assainies","lat":14.737126278393449,"lng":-17.410553777161958},{"id":"N59","zone":"Parcelles Assainies","lat":14.730984447914487,"lng":-17.41333260606161},{"id":"N60","zone":"Parcelles Assainies","lat":14.734089702114382,"lng":-17.419165928777403},{"id":"N61","zone":"Parcelles Assainies","lat":14.735625108000752,"lng":-17.414527451638563},{"id":"N62","zone":"Parcelles Assainies","lat":14.735786264786306,"lng":-17.414635755933656},{"id":"N63","zone":"Parcelles Assainies","lat":14.72800571896128,"lng":-17.417110127315944},{"id":"N64","zone":"Parcelles Assainies","lat":14.728194767423858,"lng":-17.409850816604823},{"id":"N65","zone":"Parcelles Assainies","lat":14.736787218778232,"lng":-17.411020013647665},{"id":"N66","zone":"Pikine","lat":14.748690169504831,"lng":-17.398631122502586},{"id":"N67","zone":"Pikine","lat":14.755536115190448,"lng":-17.38529575832053},{"id":"N68","zone":"Pikine","lat":14.746027841424814,"lng":-17.39221014305025},{"id":"N69","zone":"Pikine","lat":14.745830550221621,"lng":-17.38809096752114},{"id":"N70","zone":"Pikine","lat":14.754190013151684,"lng":-17.397574128032502},{"id":"N71","zone":"Pikine","lat":14.750703388537184,"lng":-17.391252946097577},{"id":"N72","zone":"Pikine","lat":14.74818067954728,"lng":-17.38641350438372},{"id":"N73","zone":"Pikine","lat":14.75007765528241,"lng":-17.396323026918367},{"id":"N74","zone":"Pikine","lat":14.751471553065352,"lng":-17.38855103396365},{"id":"N75","zone":"Pikine","lat":14.747413812760676,"lng":-17.394824255630486},{"id":"N76","zone":"Pikine","lat":14.75694179227993,"lng":-17.389751829135406},{"id":"N77","zone":"Pikine","lat":14.750257201006974,"lng":-17.391736362384467},{"id":"N78","zone":"Pikine","lat":14.746452050350419,"lng":-17.396129539944525},{"id":"N79","zone":"Pikine","lat":14.749057026745769,"lng":-17.390675369223143},{"id":"N80","zone":"Pikine","lat":14.747761376791159,"lng":-17.396196739233226},{"id":"N81","zone":"Guédiawaye","lat":14.73970993086009,"lng":-17.40342676451276},{"id":"N82","zone":"Guédiawaye","lat":14.74128941783811,"lng":-17.40013495984393},{"id":"N83","zone":"Guédiawaye","lat":14.747596354002537,"lng":-17.41014971180134},{"id":"N84","zone":"Guédiawaye","lat":14.74138004634369,"lng":-17.402972266660445},{"id":"N85","zone":"Guédiawaye","lat":14.741142368073705,"lng":-17.4094122578153},{"id":"N86","zone":"Guédiawaye","lat":14.748355142405806,"lng":-17.4041474828801},{"id":"N87","zone":"Guédiawaye","lat":14.743726710263118,"lng":-17.40158456690851},{"id":"N88","zone":"Guédiawaye","lat":14.747074969977666,"lng":-17.40871508102766},{"id":"N89","zone":"Guédiawaye","lat":14.739969308142287,"lng":-17.405827385811126},{"id":"N90","zone":"Guédiawaye","lat":14.7432357862302,"lng":-17.40539570398356},{"id":"N91","zone":"Guédiawaye","lat":14.746290758494599,"lng":-17.40291962543248},{"id":"N92","zone":"Guédiawaye","lat":14.74884165211366,"lng":-17.409818985546178},{"id":"N93","zone":"Guédiawaye","lat":14.743026212821022,"lng":-17.40692836873526},{"id":"N94","zone":"Guédiawaye","lat":14.747616725363528,"lng":-17.408016123992958},{"id":"N95","zone":"Guédiawaye","lat":14.740902089084408,"lng":-17.405616637426004}]
const PIPES = [{"id":"PIPE-01","from":"R1","to":"P1","diameter_mm":400,"length_m":2006,"material":"fonte","zone":"Plateau-Fann"},{"id":"PIPE-02","from":"P1","to":"J1","diameter_mm":350,"length_m":1828,"material":"PVC","zone":"Plateau"},{"id":"PIPE-03","from":"J1","to":"V1","diameter_mm":300,"length_m":385,"material":"PVC","zone":"Médina"},{"id":"PIPE-04","from":"V1","to":"R2","diameter_mm":300,"length_m":702,"material":"fonte","zone":"Médina"},{"id":"PIPE-05","from":"R2","to":"J2","diameter_mm":350,"length_m":2308,"material":"PVC","zone":"HLM"},{"id":"PIPE-06","from":"J1","to":"J2","diameter_mm":250,"length_m":1804,"material":"amiante-ciment","zone":"Grand Dakar","age_years":35,"risk":"high"},{"id":"PIPE-07","from":"J2","to":"P2","diameter_mm":300,"length_m":779,"material":"PVC","zone":"HLM"},{"id":"PIPE-08","from":"P2","to":"V2","diameter_mm":250,"length_m":1260,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-09","from":"V2","to":"P3","diameter_mm":300,"length_m":2943,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-10","from":"P3","to":"V3","diameter_mm":350,"length_m":1559,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-11","from":"V3","to":"R3","diameter_mm":400,"length_m":1706,"material":"acier","zone":"Pikine"},{"id":"PIPE-12","from":"R3","to":"J3","diameter_mm":350,"length_m":743,"material":"PVC","zone":"Pikine"},{"id":"PIPE-13","from":"J3","to":"J2","diameter_mm":250,"length_m":6629,"material":"fonte","zone":"Pikine-HLM","age_years":28,"risk":"medium"},{"id":"PIPE-014","from":"N1","to":"J1","diameter_mm":100,"length_m":631,"material":"PEHD","zone":"Plateau","age_years":34,"risk":"high"},{"id":"PIPE-015","from":"N2","to":"R1","diameter_mm":200,"length_m":669,"material":"PVC","zone":"Plateau"},{"id":"PIPE-016","from":"N3","to":"R1","diameter_mm":200,"length_m":180,"material":"PEHD","zone":"Plateau"},{"id":"PIPE-017","from":"N4","to":"R1","diameter_mm":100,"length_m":802,"material":"PVC","zone":"Plateau"},{"id":"PIPE-018","from":"N5","to":"J1","diameter_mm":100,"length_m":553,"material":"PEHD","zone":"Plateau"},{"id":"PIPE-019","from":"N6","to":"J1","diameter_mm":100,"length_m":57,"material":"fonte","zone":"Plateau"},{"id":"PIPE-020","from":"N7","to":"R1","diameter_mm":125,"length_m":807,"material":"PEHD","zone":"Plateau"},{"id":"PIPE-021","from":"N8","to":"J1","diameter_mm":250,"length_m":333,"material":"acier","zone":"Plateau"},{"id":"PIPE-022","from":"N9","to":"J1","diameter_mm":100,"length_m":80,"material":"PVC","zone":"Plateau","age_years":23,"risk":"medium"},{"id":"PIPE-023","from":"N10","to":"R1","diameter_mm":80,"length_m":864,"material":"PVC","zone":"Plateau"},{"id":"PIPE-024","from":"N11","to":"V1","diameter_mm":200,"length_m":699,"material":"PVC","zone":"Médina"},{"id":"PIPE-025","from":"N12","to":"R2","diameter_mm":80,"length_m":636,"material":"PEHD","zone":"Médina"},{"id":"PIPE-026","from":"N13","to":"R2","diameter_mm":250,"length_m":372,"material":"PEHD","zone":"Médina","age_years":9},{"id":"PIPE-027","from":"N14","to":"R2","diameter_mm":200,"length_m":801,"material":"PVC","zone":"Médina"},{"id":"PIPE-028","from":"N15","to":"R2","diameter_mm":150,"length_m":100,"material":"acier","zone":"Médina"},{"id":"PIPE-029","from":"N16","to":"V1","diameter_mm":100,"length_m":682,"material":"acier","zone":"Médina"},{"id":"PIPE-030","from":"N17","to":"V1","diameter_mm":100,"length_m":811,"material":"acier","zone":"Médina","age_years":30,"risk":"high"},{"id":"PIPE-031","from":"N18","to":"V1","diameter_mm":80,"length_m":1057,"material":"PVC","zone":"Médina"},{"id":"PIPE-032","from":"N19","to":"V1","diameter_mm":200,"length_m":728,"material":"PVC","zone":"Médina"},{"id":"PIPE-033","from":"N20","to":"R2","diameter_mm":200,"length_m":128,"material":"PVC","zone":"Médina"},{"id":"PIPE-034","from":"N21","to":"P1","diameter_mm":80,"length_m":616,"material":"PVC","zone":"Fann"},{"id":"PIPE-035","from":"N22","to":"P1","diameter_mm":150,"length_m":258,"material":"PEHD","zone":"Fann"},{"id":"PIPE-036","from":"N23","to":"P1","diameter_mm":250,"length_m":316,"material":"fonte","zone":"Fann"},{"id":"PIPE-037","from":"N24","to":"P1","diameter_mm":200,"length_m":274,"material":"PVC","zone":"Fann"},{"id":"PIPE-038","from":"N25","to":"P1","diameter_mm":100,"length_m":399,"material":"PVC","zone":"Fann"},{"id":"PIPE-039","from":"N26","to":"P1","diameter_mm":250,"length_m":355,"material":"fonte","zone":"Fann"},{"id":"PIPE-040","from":"N27","to":"P1","diameter_mm":200,"length_m":306,"material":"PVC","zone":"Fann"},{"id":"PIPE-041","from":"N28","to":"P1","diameter_mm":200,"length_m":360,"material":"fonte","zone":"Fann","age_years":21,"risk":"medium"},{"id":"PIPE-042","from":"N29","to":"P1","diameter_mm":80,"length_m":122,"material":"PVC","zone":"Fann"},{"id":"PIPE-043","from":"N30","to":"P1","diameter_mm":80,"length_m":180,"material":"PVC","zone":"Fann"},{"id":"PIPE-044","from":"N31","to":"J2","diameter_mm":250,"length_m":792,"material":"PVC","zone":"HLM"},{"id":"PIPE-045","from":"N32","to":"P2","diameter_mm":200,"length_m":342,"material":"acier","zone":"HLM"},{"id":"PIPE-046","from":"N33","to":"J2","diameter_mm":80,"length_m":619,"material":"PVC","zone":"HLM"},{"id":"PIPE-047","from":"N34","to":"P2","diameter_mm":125,"length_m":747,"material":"fonte","zone":"HLM"},{"id":"PIPE-048","from":"N35","to":"P2","diameter_mm":80,"length_m":541,"material":"PVC","zone":"HLM"},{"id":"PIPE-049","from":"N36","to":"J2","diameter_mm":80,"length_m":32,"material":"PVC","zone":"HLM"},{"id":"PIPE-050","from":"N37","to":"P2","diameter_mm":250,"length_m":189,"material":"PVC","zone":"HLM"},{"id":"PIPE-051","from":"N38","to":"J2","diameter_mm":150,"length_m":724,"material":"fonte","zone":"HLM"},{"id":"PIPE-052","from":"N39","to":"P2","diameter_mm":100,"length_m":57,"material":"PEHD","zone":"HLM"},{"id":"PIPE-053","from":"N40","to":"P2","diameter_mm":100,"length_m":592,"material":"fonte","zone":"HLM"},{"id":"PIPE-054","from":"N41","to":"V2","diameter_mm":150,"length_m":374,"material":"PEHD","zone":"Grand Dakar","age_years":26,"risk":"medium"},{"id":"PIPE-055","from":"N42","to":"V2","diameter_mm":250,"length_m":313,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-056","from":"N43","to":"V2","diameter_mm":150,"length_m":440,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-057","from":"N44","to":"V2","diameter_mm":150,"length_m":476,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-058","from":"N45","to":"V2","diameter_mm":100,"length_m":749,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-059","from":"N46","to":"V2","diameter_mm":150,"length_m":424,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-060","from":"N47","to":"V2","diameter_mm":125,"length_m":328,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-061","from":"N48","to":"V2","diameter_mm":200,"length_m":530,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-062","from":"N49","to":"V2","diameter_mm":100,"length_m":470,"material":"fonte","zone":"Grand Dakar","age_years":21,"risk":"medium"},{"id":"PIPE-063","from":"N50","to":"V2","diameter_mm":125,"length_m":514,"material":"acier","zone":"Grand Dakar","age_years":32,"risk":"high"},{"id":"PIPE-064","from":"N51","to":"P3","diameter_mm":200,"length_m":587,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-065","from":"N52","to":"P3","diameter_mm":100,"length_m":289,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-066","from":"N53","to":"P3","diameter_mm":80,"length_m":322,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-067","from":"N54","to":"P3","diameter_mm":80,"length_m":605,"material":"acier","zone":"Parcelles Assainies"},{"id":"PIPE-068","from":"N55","to":"P3","diameter_mm":250,"length_m":310,"material":"PEHD","zone":"Parcelles Assainies"},{"id":"PIPE-069","from":"N56","to":"P3","diameter_mm":125,"length_m":702,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-070","from":"N57","to":"P3","diameter_mm":125,"length_m":705,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-071","from":"N58","to":"P3","diameter_mm":100,"length_m":454,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-072","from":"N59","to":"P3","diameter_mm":100,"length_m":290,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-073","from":"N60","to":"P3","diameter_mm":80,"length_m":741,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-074","from":"N61","to":"P3","diameter_mm":150,"length_m":344,"material":"fonte","zone":"Parcelles Assainies","age_years":25,"risk":"medium"},{"id":"PIPE-075","from":"N62","to":"P3","diameter_mm":200,"length_m":365,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-076","from":"N63","to":"P3","diameter_mm":125,"length_m":791,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-077","from":"N64","to":"P3","diameter_mm":250,"length_m":635,"material":"PVC","zone":"Parcelles Assainies","age_years":20,"risk":"medium"},{"id":"PIPE-078","from":"N65","to":"P3","diameter_mm":100,"length_m":400,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-079","from":"N66","to":"R3","diameter_mm":200,"length_m":1060,"material":"PEHD","zone":"Pikine","age_years":35,"risk":"high"},{"id":"PIPE-080","from":"N67","to":"R3","diameter_mm":250,"length_m":631,"material":"fonte","zone":"Pikine"},{"id":"PIPE-081","from":"N68","to":"R3","diameter_mm":150,"length_m":664,"material":"fonte","zone":"Pikine"},{"id":"PIPE-082","from":"N69","to":"J3","diameter_mm":80,"length_m":875,"material":"PEHD","zone":"Pikine","age_years":5},{"id":"PIPE-083","from":"N70","to":"J3","diameter_mm":150,"length_m":624,"material":"PVC","zone":"Pikine","age_years":38,"risk":"high"},{"id":"PIPE-084","from":"N71","to":"R3","diameter_mm":80,"length_m":238,"material":"fonte","zone":"Pikine"},{"id":"PIPE-085","from":"N72","to":"R3","diameter_mm":250,"length_m":442,"material":"fonte","zone":"Pikine"},{"id":"PIPE-086","from":"N73","to":"J3","diameter_mm":150,"length_m":152,"material":"fonte","zone":"Pikine"},{"id":"PIPE-087","from":"N74","to":"J3","diameter_mm":200,"length_m":809,"material":"fonte","zone":"Pikine"},{"id":"PIPE-088","from":"N75","to":"R3","diameter_mm":150,"length_m":744,"material":"fonte","zone":"Pikine"},{"id":"PIPE-089","from":"N76","to":"J3","diameter_mm":250,"length_m":1091,"material":"PVC","zone":"Pikine"},{"id":"PIPE-090","from":"N77","to":"J3","diameter_mm":125,"length_m":441,"material":"fonte","zone":"Pikine"},{"id":"PIPE-091","from":"N78","to":"R3","diameter_mm":100,"length_m":920,"material":"PVC","zone":"Pikine"},{"id":"PIPE-092","from":"N79","to":"J3","diameter_mm":200,"length_m":529,"material":"PVC","zone":"Pikine"},{"id":"PIPE-093","from":"N80","to":"R3","diameter_mm":250,"length_m":852,"material":"PVC","zone":"Pikine","age_years":29,"risk":"medium"},{"id":"PIPE-094","from":"N81","to":"V3","diameter_mm":125,"length_m":532,"material":"fonte","zone":"Guédiawaye","age_years":31,"risk":"high"},{"id":"PIPE-095","from":"N82","to":"V3","diameter_mm":100,"length_m":500,"material":"PEHD","zone":"Guédiawaye"},{"id":"PIPE-096","from":"N83","to":"V3","diameter_mm":200,"length_m":802,"material":"acier","zone":"Guédiawaye"},{"id":"PIPE-097","from":"N84","to":"V3","diameter_mm":200,"length_m":349,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-098","from":"N85","to":"V3","diameter_mm":125,"length_m":745,"material":"PEHD","zone":"Guédiawaye","age_years":27,"risk":"medium"},{"id":"PIPE-099","from":"N86","to":"V3","diameter_mm":150,"length_m":435,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-100","from":"N87","to":"V3","diameter_mm":125,"length_m":213,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-101","from":"N88","to":"V3","diameter_mm":250,"length_m":638,"material":"acier","zone":"Guédiawaye","age_years":26,"risk":"medium"},{"id":"PIPE-102","from":"N89","to":"V3","diameter_mm":150,"length_m":566,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-103","from":"N90","to":"V3","diameter_mm":200,"length_m":256,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-104","from":"N91","to":"V3","diameter_mm":100,"length_m":205,"material":"PEHD","zone":"Guédiawaye","age_years":32,"risk":"high"},{"id":"PIPE-105","from":"N92","to":"V3","diameter_mm":150,"length_m":841,"material":"PVC","zone":"Guédiawaye","age_years":21,"risk":"medium"},{"id":"PIPE-106","from":"N93","to":"V3","diameter_mm":125,"length_m":413,"material":"PEHD","zone":"Guédiawaye"},{"id":"PIPE-107","from":"N94","to":"V3","diameter_mm":150,"length_m":604,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-108","from":"N95","to":"V3","diameter_mm":250,"length_m":465,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-109","from":"N7","to":"N6","diameter_mm":100,"length_m":371,"material":"acier","zone":"Plateau","age_years":27,"risk":"medium"},{"id":"PIPE-110","from":"N6","to":"N9","diameter_mm":80,"length_m":90,"material":"PVC","zone":"Plateau","age_years":7},{"id":"PIPE-111","from":"N9","to":"N2","diameter_mm":200,"length_m":396,"material":"PVC","zone":"Plateau","age_years":6},{"id":"PIPE-112","from":"N2","to":"N5","diameter_mm":250,"length_m":245,"material":"PVC","zone":"Plateau","age_years":35,"risk":"high"},{"id":"PIPE-113","from":"N5","to":"N1","diameter_mm":100,"length_m":193,"material":"fonte","zone":"Plateau"},{"id":"PIPE-114","from":"N1","to":"N8","diameter_mm":125,"length_m":558,"material":"PVC","zone":"Plateau"},{"id":"PIPE-115","from":"N8","to":"N3","diameter_mm":250,"length_m":161,"material":"acier","zone":"Plateau"},{"id":"PIPE-116","from":"N3","to":"N10","diameter_mm":125,"length_m":723,"material":"PVC","zone":"Plateau","age_years":15},{"id":"PIPE-117","from":"N10","to":"N4","diameter_mm":125,"length_m":113,"material":"fonte","zone":"Plateau"},{"id":"PIPE-118","from":"N14","to":"N12","diameter_mm":150,"length_m":201,"material":"fonte","zone":"Médina"},{"id":"PIPE-119","from":"N12","to":"N18","diameter_mm":100,"length_m":384,"material":"PVC","zone":"Médina"},{"id":"PIPE-120","from":"N18","to":"N17","diameter_mm":250,"length_m":425,"material":"PVC","zone":"Médina"},{"id":"PIPE-121","from":"N17","to":"N11","diameter_mm":250,"length_m":338,"material":"fonte","zone":"Médina","age_years":24,"risk":"medium"},{"id":"PIPE-122","from":"N11","to":"N16","diameter_mm":200,"length_m":31,"material":"PEHD","zone":"Médina"},{"id":"PIPE-123","from":"N16","to":"N19","diameter_mm":150,"length_m":109,"material":"acier","zone":"Médina","age_years":39,"risk":"high"},{"id":"PIPE-124","from":"N19","to":"N15","diameter_mm":200,"length_m":20,"material":"acier","zone":"Médina"},{"id":"PIPE-125","from":"N15","to":"N20","diameter_mm":150,"length_m":28,"material":"PEHD","zone":"Médina"},{"id":"PIPE-126","from":"N20","to":"N13","diameter_mm":150,"length_m":244,"material":"PVC","zone":"Médina"},{"id":"PIPE-127","from":"N23","to":"N24","diameter_mm":150,"length_m":42,"material":"acier","zone":"Fann"},{"id":"PIPE-128","from":"N24","to":"N30","diameter_mm":250,"length_m":100,"material":"fonte","zone":"Fann","age_years":16},{"id":"PIPE-129","from":"N30","to":"N29","diameter_mm":125,"length_m":300,"material":"fonte","zone":"Fann"},{"id":"PIPE-130","from":"N29","to":"N22","diameter_mm":200,"length_m":380,"material":"PEHD","zone":"Fann"},{"id":"PIPE-131","from":"N22","to":"N27","diameter_mm":150,"length_m":557,"material":"PEHD","zone":"Fann"},{"id":"PIPE-132","from":"N27","to":"N26","diameter_mm":125,"length_m":630,"material":"PVC","zone":"Fann"},{"id":"PIPE-133","from":"N26","to":"N25","diameter_mm":80,"length_m":246,"material":"PVC","zone":"Fann"},{"id":"PIPE-134","from":"N25","to":"N28","diameter_mm":100,"length_m":210,"material":"PEHD","zone":"Fann"},{"id":"PIPE-135","from":"N28","to":"N21","diameter_mm":200,"length_m":486,"material":"acier","zone":"Fann"},{"id":"PIPE-136","from":"N36","to":"N34","diameter_mm":80,"length_m":978,"material":"fonte","zone":"HLM"},{"id":"PIPE-137","from":"N34","to":"N40","diameter_mm":100,"length_m":233,"material":"fonte","zone":"HLM"},{"id":"PIPE-138","from":"N40","to":"N35","diameter_mm":125,"length_m":50,"material":"PVC","zone":"HLM","age_years":21,"risk":"medium"},{"id":"PIPE-139","from":"N35","to":"N32","diameter_mm":250,"length_m":496,"material":"PVC","zone":"HLM"},{"id":"PIPE-140","from":"N32","to":"N38","diameter_mm":200,"length_m":322,"material":"PVC","zone":"HLM"},{"id":"PIPE-141","from":"N38","to":"N33","diameter_mm":150,"length_m":441,"material":"fonte","zone":"HLM","age_years":31,"risk":"high"},{"id":"PIPE-142","from":"N33","to":"N37","diameter_mm":250,"length_m":496,"material":"fonte","zone":"HLM"},{"id":"PIPE-143","from":"N37","to":"N39","diameter_mm":150,"length_m":158,"material":"fonte","zone":"HLM"},{"id":"PIPE-144","from":"N39","to":"N31","diameter_mm":80,"length_m":206,"material":"PVC","zone":"HLM"},{"id":"PIPE-145","from":"N48","to":"N45","diameter_mm":125,"length_m":360,"material":"acier","zone":"Grand Dakar","age_years":20,"risk":"medium"},{"id":"PIPE-146","from":"N45","to":"N46","diameter_mm":150,"length_m":623,"material":"fonte","zone":"Grand Dakar"},{"id":"PIPE-147","from":"N46","to":"N43","diameter_mm":150,"length_m":525,"material":"acier","zone":"Grand Dakar"},{"id":"PIPE-148","from":"N43","to":"N41","diameter_mm":125,"length_m":168,"material":"acier","zone":"Grand Dakar"},{"id":"PIPE-149","from":"N41","to":"N42","diameter_mm":125,"length_m":682,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-150","from":"N42","to":"N47","diameter_mm":125,"length_m":551,"material":"PVC","zone":"Grand Dakar","age_years":17},{"id":"PIPE-151","from":"N47","to":"N50","diameter_mm":250,"length_m":504,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-152","from":"N50","to":"N49","diameter_mm":125,"length_m":357,"material":"acier","zone":"Grand Dakar","age_years":35,"risk":"high"},{"id":"PIPE-153","from":"N49","to":"N44","diameter_mm":200,"length_m":21,"material":"fonte","zone":"Grand Dakar"},{"id":"PIPE-154","from":"N63","to":"N51","diameter_mm":80,"length_m":511,"material":"PEHD","zone":"Parcelles Assainies"},{"id":"PIPE-155","from":"N51","to":"N64","diameter_mm":125,"length_m":269,"material":"PVC","zone":"Parcelles Assainies","age_years":19},{"id":"PIPE-156","from":"N64","to":"N54","diameter_mm":250,"length_m":645,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-157","from":"N54","to":"N53","diameter_mm":80,"length_m":317,"material":"fonte","zone":"Parcelles Assainies","age_years":7},{"id":"PIPE-158","from":"N53","to":"N59","diameter_mm":100,"length_m":35,"material":"acier","zone":"Parcelles Assainies"},{"id":"PIPE-159","from":"N59","to":"N55","diameter_mm":150,"length_m":441,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-160","from":"N55","to":"N57","diameter_mm":200,"length_m":1000,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-161","from":"N57","to":"N60","diameter_mm":150,"length_m":125,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-162","from":"N60","to":"N52","diameter_mm":125,"length_m":501,"material":"PEHD","zone":"Parcelles Assainies","age_years":8},{"id":"PIPE-163","from":"N52","to":"N61","diameter_mm":80,"length_m":90,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-164","from":"N61","to":"N62","diameter_mm":200,"length_m":21,"material":"acier","zone":"Parcelles Assainies"},{"id":"PIPE-165","from":"N62","to":"N56","diameter_mm":100,"length_m":360,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-166","from":"N56","to":"N65","diameter_mm":125,"length_m":732,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-167","from":"N65","to":"N58","diameter_mm":80,"length_m":63,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-168","from":"N69","to":"N68","diameter_mm":200,"length_m":443,"material":"fonte","zone":"Pikine"},{"id":"PIPE-169","from":"N68","to":"N78","diameter_mm":100,"length_m":423,"material":"PEHD","zone":"Pikine"},{"id":"PIPE-170","from":"N78","to":"N75","diameter_mm":150,"length_m":176,"material":"fonte","zone":"Pikine"},{"id":"PIPE-171","from":"N75","to":"N80","diameter_mm":200,"length_m":152,"material":"fonte","zone":"Pikine"},{"id":"PIPE-172","from":"N80","to":"N72","diameter_mm":200,"length_m":1051,"material":"PVC","zone":"Pikine"},{"id":"PIPE-173","from":"N72","to":"N66","diameter_mm":250,"length_m":1313,"material":"PVC","zone":"Pikine"},{"id":"PIPE-174","from":"N66","to":"N79","diameter_mm":100,"length_m":855,"material":"acier","zone":"Pikine"},{"id":"PIPE-175","from":"N79","to":"N73","diameter_mm":100,"length_m":617,"material":"PVC","zone":"Pikine","age_years":10},{"id":"PIPE-176","from":"N73","to":"N77","diameter_mm":100,"length_m":493,"material":"PVC","zone":"Pikine","age_years":9},{"id":"PIPE-177","from":"N77","to":"N71","diameter_mm":250,"length_m":72,"material":"fonte","zone":"Pikine"},{"id":"PIPE-178","from":"N71","to":"N74","diameter_mm":80,"length_m":302,"material":"PVC","zone":"Pikine"},{"id":"PIPE-179","from":"N74","to":"N70","diameter_mm":125,"length_m":1014,"material":"acier","zone":"Pikine"},{"id":"PIPE-180","from":"N70","to":"N67","diameter_mm":80,"length_m":1326,"material":"acier","zone":"Pikine"},{"id":"PIPE-181","from":"N67","to":"N76","diameter_mm":250,"length_m":503,"material":"fonte","zone":"Pikine","age_years":21,"risk":"medium"},{"id":"PIPE-182","from":"N81","to":"N89","diameter_mm":100,"length_m":259,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-183","from":"N89","to":"N95","diameter_mm":250,"length_m":106,"material":"PVC","zone":"Guédiawaye","age_years":19},{"id":"PIPE-184","from":"N95","to":"N85","diameter_mm":100,"length_m":408,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-185","from":"N85","to":"N82","diameter_mm":200,"length_m":996,"material":"acier","zone":"Guédiawaye","age_years":24,"risk":"medium"},{"id":"PIPE-186","from":"N82","to":"N84","diameter_mm":125,"length_m":305,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-187","from":"N84","to":"N93","diameter_mm":250,"length_m":462,"material":"fonte","zone":"Guédiawaye","age_years":24,"risk":"medium"},{"id":"PIPE-188","from":"N93","to":"N90","diameter_mm":200,"length_m":166,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-189","from":"N90","to":"N87","diameter_mm":80,"length_m":413,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-190","from":"N87","to":"N91","diameter_mm":250,"length_m":319,"material":"PVC","zone":"Guédiawaye","age_years":32,"risk":"high"},{"id":"PIPE-191","from":"N91","to":"N88","diameter_mm":80,"length_m":628,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-192","from":"N88","to":"N83","diameter_mm":250,"length_m":165,"material":"PEHD","zone":"Guédiawaye","age_years":6},{"id":"PIPE-193","from":"N83","to":"N94","diameter_mm":80,"length_m":229,"material":"PEHD","zone":"Guédiawaye"},{"id":"PIPE-194","from":"N94","to":"N86","diameter_mm":150,"length_m":423,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-195","from":"N86","to":"N92","diameter_mm":125,"length_m":611,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-196","from":"N10","to":"N17","diameter_mm":150,"length_m":975,"material":"PVC","zone":"Plateau-Médina"},{"id":"PIPE-197","from":"N18","to":"N36","diameter_mm":125,"length_m":2666,"material":"acier","zone":"Médina-HLM"},{"id":"PIPE-198","from":"N32","to":"N43","diameter_mm":250,"length_m":771,"material":"fonte","zone":"HLM-Grand Dakar"},{"id":"PIPE-199","from":"N45","to":"N61","diameter_mm":200,"length_m":3715,"material":"PVC","zone":"Grand Dakar-Parcelles Assainies"},{"id":"PIPE-200","from":"N58","to":"N67","diameter_mm":125,"length_m":3395,"material":"PVC","zone":"Parcelles Assainies-Pikine"}]
const SENSORS = [{"sensor_id":"S1_acoustic","node_id":"J1","kind":"acoustic","name":"Acoustique Plateau","lat":14.6918,"lng":-17.4459,"zone":"Plateau","value":0.94,"unit":"score","status":"critique"},{"sensor_id":"S2_acoustic","node_id":"J2","kind":"acoustic","name":"Acoustique HLM","lat":14.7028,"lng":-17.4361,"zone":"HLM","value":0.12,"unit":"score","status":"normal"},{"sensor_id":"S3_acoustic","node_id":"J3","kind":"acoustic","name":"Acoustique Pikine","lat":14.7492,"lng":-17.3961,"zone":"Pikine","value":0.08,"unit":"score","status":"normal"},{"sensor_id":"S1_pressure","node_id":"R1","kind":"pressure","name":"Pression Château d'Eau","lat":14.694,"lng":-17.4438,"zone":"Plateau","value":3.4,"unit":"bar","status":"normal"},{"sensor_id":"S2_pressure","node_id":"P1","kind":"pressure","name":"Pression Fann","lat":14.6981,"lng":-17.4619,"zone":"Fann","value":2.1,"unit":"bar","status":"alerte"},{"sensor_id":"S3_pressure","node_id":"V2","kind":"pressure","name":"Pression Grand Dakar","lat":14.712,"lng":-17.4292,"zone":"Grand Dakar","value":1.8,"unit":"bar","status":"critique"},{"sensor_id":"S4_pressure","node_id":"P3","kind":"pressure","name":"Pression Parcelles","lat":14.7337,"lng":-17.412,"zone":"Parcelles Assainies","value":3.2,"unit":"bar","status":"normal"},{"sensor_id":"M1_flow","node_id":"P1","kind":"flow","name":"Débit Fann","lat":14.6975,"lng":-17.4625,"zone":"Fann","value":1360,"unit":"m³/h","status":"alerte"},{"sensor_id":"M2_flow","node_id":"P2","kind":"flow","name":"Débit HLM","lat":14.7086,"lng":-17.4404,"zone":"HLM","value":870,"unit":"m³/h","status":"normal"},{"sensor_id":"M3_flow","node_id":"P3","kind":"flow","name":"Débit Parcelles","lat":14.7331,"lng":-17.4126,"zone":"Parcelles Assainies","value":1050,"unit":"m³/h","status":"normal"},{"sensor_id":"Q1_quality","node_id":"R1","kind":"quality","name":"Qualité Réservoir Nord","lat":14.6934,"lng":-17.4443,"zone":"Plateau","value":7.2,"unit":"pH","status":"normal"},{"sensor_id":"Q2_quality","node_id":"R2","kind":"quality","name":"Qualité Réservoir Médina","lat":14.6888,"lng":-17.4514,"zone":"Médina","value":7.1,"unit":"pH","status":"normal"},{"sensor_id":"R1_level","node_id":"R1","kind":"level","name":"Niveau Château d'Eau","lat":14.6937,"lng":-17.4441,"zone":"Plateau","value":81.3,"unit":"%","status":"normal"},{"sensor_id":"R2_level","node_id":"R2","kind":"level","name":"Niveau Réservoir Médina","lat":14.6891,"lng":-17.4512,"zone":"Médina","value":74.2,"unit":"%","status":"normal"},{"sensor_id":"R3_level","node_id":"R3","kind":"level","name":"Niveau Réservoir Pikine","lat":14.7512,"lng":-17.3891,"zone":"Pikine","value":68.9,"unit":"%","status":"normal"},{"sensor_id":"P1_health","node_id":"P1","kind":"pump_health","name":"Santé Pompe Fann","lat":14.6979,"lng":-17.4622,"zone":"Fann","value":62,"unit":"°C","status":"critique"},{"sensor_id":"P2_health","node_id":"P2","kind":"pump_health","name":"Santé Pompe HLM","lat":14.7091,"lng":-17.4399,"zone":"HLM","value":45,"unit":"°C","status":"normal"},{"sensor_id":"AUTO_001","node_id":"N1","kind":"pressure","name":"Capteur Pressure Plateau 1","lat":14.693652433999008,"lng":-17.45174760129764,"zone":"Plateau","value":3.3,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_002","node_id":"N5","kind":"flow","name":"Capteur Flow Plateau 2","lat":14.692285353177228,"lng":-17.451547246479194,"zone":"Plateau","value":983,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_003","node_id":"N9","kind":"quality","name":"Capteur Quality Plateau 3","lat":14.691115866312892,"lng":-17.445748000977073,"zone":"Plateau","value":7.6,"unit":"pH","status":"alerte"},{"sensor_id":"AUTO_004","node_id":"N13","kind":"acoustic","name":"Capteur Acoustic Médina 4","lat":14.690331652522302,"lng":-17.454049719995204,"zone":"Médina","value":0.76,"unit":"score","status":"normal"},{"sensor_id":"AUTO_005","node_id":"N17","kind":"pressure","name":"Capteur Pressure Médina 5","lat":14.687447597802976,"lng":-17.448338534062135,"zone":"Médina","value":4.0,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_006","node_id":"N21","kind":"flow","name":"Capteur Flow Fann 6","lat":14.701724522327385,"lng":-17.46696342128169,"zone":"Fann","value":917,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_007","node_id":"N25","kind":"pressure","name":"Capteur Pressure Fann 7","lat":14.700703768449262,"lng":-17.46432601586008,"zone":"Fann","value":1.7,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_008","node_id":"N29","kind":"flow","name":"Capteur Flow Fann 8","lat":14.697785542242512,"lng":-17.461028046914038,"zone":"Fann","value":924,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_009","node_id":"N33","kind":"quality","name":"Capteur Quality HLM 9","lat":14.708814738053869,"lng":-17.43716518895436,"zone":"HLM","value":7.5,"unit":"pH","status":"normal"},{"sensor_id":"AUTO_010","node_id":"N37","kind":"acoustic","name":"Capteur Acoustic HLM 10","lat":14.709255609852947,"lng":-17.44230417694124,"zone":"HLM","value":0.66,"unit":"score","status":"normal"},{"sensor_id":"AUTO_011","node_id":"N41","kind":"pressure","name":"Capteur Pressure Grand Dakar 11","lat":14.712688931085474,"lng":-17.432251692751638,"zone":"Grand Dakar","value":3.0,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_012","node_id":"N45","kind":"flow","name":"Capteur Flow Grand Dakar 12","lat":14.708127117593516,"lng":-17.434588013055592,"zone":"Grand Dakar","value":849,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_013","node_id":"N49","kind":"pressure","name":"Capteur Pressure Grand Dakar 13","lat":14.716504500181145,"lng":-17.429237366967797,"zone":"Grand Dakar","value":2.9,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_014","node_id":"N53","kind":"flow","name":"Capteur Flow Parcelles Assainies 14","lat":14.730914811250244,"lng":-17.41346974316324,"zone":"Parcelles Assainies","value":1022,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_015","node_id":"N57","kind":"quality","name":"Capteur Quality Parcelles Assainies 15","lat":14.733473130877805,"lng":-17.41855158978962,"zone":"Parcelles Assainies","value":6.9,"unit":"pH","status":"critique"},{"sensor_id":"AUTO_016","node_id":"N61","kind":"acoustic","name":"Capteur Acoustic Parcelles Assainies 16","lat":14.735709668092404,"lng":-17.414205034337336,"zone":"Parcelles Assainies","value":0.54,"unit":"score","status":"normal"},{"sensor_id":"AUTO_017","node_id":"N65","kind":"pressure","name":"Capteur Pressure Parcelles Assainies 17","lat":14.736508585978306,"lng":-17.411456796606505,"zone":"Parcelles Assainies","value":3.9,"unit":"bar","status":"alerte"},{"sensor_id":"AUTO_018","node_id":"N69","kind":"flow","name":"Capteur Flow Pikine 18","lat":14.745823174840599,"lng":-17.38849377552252,"zone":"Pikine","value":1018,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_019","node_id":"N73","kind":"pressure","name":"Capteur Pressure Pikine 19","lat":14.750319924297177,"lng":-17.396668504015956,"zone":"Pikine","value":3.7,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_020","node_id":"N77","kind":"flow","name":"Capteur Flow Pikine 20","lat":14.750200584093035,"lng":-17.391285807214615,"zone":"Pikine","value":289,"unit":"m³/h","status":"normal"},{"sensor_id":"AUTO_021","node_id":"N81","kind":"quality","name":"Capteur Quality Guédiawaye 21","lat":14.739399739422252,"lng":-17.40380460479367,"zone":"Guédiawaye","value":7.3,"unit":"pH","status":"normal"},{"sensor_id":"AUTO_022","node_id":"N85","kind":"acoustic","name":"Capteur Acoustic Guédiawaye 22","lat":14.74088593697087,"lng":-17.409786333929993,"zone":"Guédiawaye","value":0.64,"unit":"score","status":"normal"},{"sensor_id":"AUTO_023","node_id":"N89","kind":"pressure","name":"Capteur Pressure Guédiawaye 23","lat":14.739616862322228,"lng":-17.405426854775495,"zone":"Guédiawaye","value":2.9,"unit":"bar","status":"normal"},{"sensor_id":"AUTO_024","node_id":"N93","kind":"flow","name":"Capteur Flow Guédiawaye 24","lat":14.742551992970808,"lng":-17.40741350840803,"zone":"Guédiawaye","value":973,"unit":"m³/h","status":"normal"}]

const ALERTS = [
  {"alert_id":"ALT-001","type":"Fuite","location":"Grand Dakar — J1-J2","severity":"Critique","probability":0.94,"lat":14.7023,"lng":-17.4412,"date":"2026-03-04 09:20","status":"En cours","description":"Une fuite a été détectée sur une canalisation de Grand Dakar. Les équipes sont en intervention."},
  {"alert_id":"ALT-002","type":"Panne pompe","location":"Station Fann — P1","severity":"Critique","probability":0.91,"lat":14.6978,"lng":-17.4623,"date":"2026-03-04 10:10","status":"En cours","description":"La station de pompage de Fann est en panne. Cela peut causer une baisse de pression dans le secteur."},
  {"alert_id":"ALT-003","type":"Débit anormal","location":"Fann-Plateau","severity":"Alerte","probability":0.78,"lat":14.6955,"lng":-17.453,"date":"2026-03-04 09:45","status":"Analyse","description":"Une anomalie de débit est détectée. Les équipes analysent la situation."},
  {"alert_id":"ALT-004","type":"Pression basse","location":"Zone Grand Dakar","severity":"Alerte","probability":0.65,"lat":14.7123,"lng":-17.4289,"date":"2026-03-04 09:50","status":"Surveillance","description":"La pression d'eau est basse dans ce secteur. Vous pouvez constater un faible débit au robinet."}
]

const ZONE_STATUS: Record<string,{potable:boolean;message:string;color:string}> = {
  "Plateau":             {potable:true, message:"Eau potable",      color:"#22c55e"},
  "Médina":              {potable:true, message:"Eau potable",      color:"#22c55e"},
  "Fann":                {potable:false,message:"Légère anomalie",  color:"#f59e0b"},
  "HLM":                 {potable:true, message:"Eau potable",      color:"#22c55e"},
  "Grand Dakar":         {potable:false,message:"Problème détecté", color:"#ef4444"},
  "Parcelles Assainies": {potable:true, message:"Eau potable",      color:"#22c55e"},
  "Pikine":              {potable:true, message:"Eau potable",      color:"#22c55e"},
  "Guédiawaye":          {potable:true, message:"Eau potable",      color:"#22c55e"},
}

const SEVERITY_COLORS: Record<string,string> = {
  Critique:"#ef4444", Alerte:"#f59e0b", Moyen:"#a78bfa", Faible:"#94a3b8",
}

declare global { interface Window { L: any } }

export function DakarCitizenMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [clock, setClock] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<string|null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR"))
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  },[])

  useEffect(() => {
    if (mapRef.current) setTimeout(()=>mapRef.current.invalidateSize(),350)
  },[sidebarOpen,expanded])

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return
    const css = document.createElement("link")
    css.rel="stylesheet"; css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(css)
    const script = document.createElement("script")
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => {
      const L = window.L
      const map = L.map(mapContainerRef.current!,{center:[14.71,-17.44],zoom:13,zoomControl:false})
      L.control.zoom({position:"bottomright"}).addTo(map)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(map)
      mapRef.current = map

      // Nœuds map pour les tuyaux
      const nodeMap: Record<string,any> = {}
      NODES.forEach((n:any)=>{nodeMap[n.id]=n})
      INTER_NODES.forEach((n:any)=>{nodeMap[n.id]=n})

      // Tuyaux — version simplifiée pour citoyen
      PIPES.forEach((pipe:any)=>{
        const from = nodeMap[pipe.from]; const to = nodeMap[pipe.to]
        if (!from||!to) return
        const color = pipe.risk==="high"?"#ef4444":pipe.risk==="medium"?"#f59e0b":"#22d3ee"
        const weight = Math.max(1, (pipe.diameter_mm||100)/160)
        L.polyline([[from.lat,from.lng],[to.lat,to.lng]],{
          color, weight, opacity:0.65,
          dashArray:pipe.risk==="high"?"6 4":pipe.risk==="medium"?"4 3":"",
        }).addTo(map)
      })

      // Nœuds backbone visibles
      NODES.forEach((node:any)=>{
        if(node.type==="junction") return
        const colors: Record<string,string> = {reservoir:"#3b82f6",pump:"#22d3ee",valve:"#a78bfa"}
        const symbols: Record<string,string> = {reservoir:"▣",pump:"⚙",valve:"◈"}
        const c = colors[node.type]||"#94a3b8"
        const icon = L.divIcon({
          className:"",
          html:`<div style="width:28px;height:28px;border-radius:6px;background:${c}22;border:1.5px solid ${c}88;display:flex;align-items:center;justify-content:center;font-size:13px;color:${c}">${symbols[node.type]??""}</div>`,
          iconSize:[28,28],iconAnchor:[14,14],
        })
        L.marker([node.lat,node.lng],{icon})
          .bindTooltip(`<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:11px">${node.name}<br/><span style="color:#64748b">${node.zone}</span></div>`,{permanent:false,direction:"top"})
          .addTo(map)
      })

      // Alertes
      ALERTS.forEach((alert:any)=>{
        const color = SEVERITY_COLORS[alert.severity]
        const icon = L.divIcon({
          className:"",
          html:`<div style="position:relative;width:36px;height:36px">
            <div style="position:absolute;inset:0;border-radius:50%;background:${color}33;border:2px solid ${color};animation:cPulse 2s infinite"></div>
            <div style="position:absolute;inset:6px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;color:white;font-weight:bold">⚠</div>
          </div>`,
          iconSize:[36,36],iconAnchor:[18,18],
        })
        L.marker([alert.lat,alert.lng],{icon})
          .on("click",()=>setSelectedAlert((p:any)=>p?.alert_id===alert.alert_id?null:alert))
          .addTo(map)
      })
      setMapReady(true)
    }
    document.head.appendChild(script)
  },[])

  const critiques = ALERTS.filter(a=>a.severity==="Critique").length
  const alertes   = ALERTS.filter(a=>a.severity==="Alerte").length

  return (
    <div style={{position:"relative",fontFamily:"system-ui,sans-serif",width:"100%"}}>
      <style>{`
        @keyframes cPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.4);opacity:.2}}
        .citizen-scroll::-webkit-scrollbar{width:3px}
        .citizen-scroll::-webkit-scrollbar-thumb{background:#22d3ee44;border-radius:2px}
        .citizen-panel{background:#020817;border:1px solid rgba(34,211,238,.18);border-radius:10px;box-shadow:0 4px 32px rgba(0,0,0,.8)}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
        .leaflet-tooltip::before{display:none!important}
        .cit-expanded-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)}
      `}</style>

      {expanded && <div className="cit-expanded-overlay" onClick={()=>setExpanded(false)}/>}

      <div style={{
        position:expanded?"fixed":"relative",
        inset:expanded?"0":"auto",
        zIndex:expanded?9999:1,
        display:"flex",
        width:expanded?"100vw":"100%",
        height:expanded?"100vh":"600px",
        borderRadius:expanded?0:12,
        overflow:"hidden",
        transition:"all .3s ease",
      }}>

        {/* Sidebar */}
        <div style={{
          width:sidebarOpen?230:0, minWidth:sidebarOpen?230:0,
          overflow:"hidden", transition:"width .3s ease,min-width .3s ease",
          background:"#020817", borderRight:"1px solid rgba(34,211,238,.18)",
          display:"flex", flexDirection:"column", zIndex:10, position:"relative",
        }}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{
            position:"absolute",right:-18,top:"50%",transform:"translateY(-50%)",
            width:18,height:60,background:"#020817",
            border:"1px solid rgba(34,211,238,.18)",borderLeft:"none",
            borderRadius:"0 6px 6px 0",
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",zIndex:20,color:"#22d3ee",fontSize:10,
          }}>{sidebarOpen?"‹":"›"}</button>

          <div className="citizen-scroll" style={{
            flex:1,overflowY:"auto",padding:14,
            display:"flex",flexDirection:"column",gap:14,width:230,
          }}>
            <p style={{color:"#94a3b8",fontSize:10,fontWeight:700,letterSpacing:"0.12em",margin:0}}>AQUAPULSE — RÉSEAU</p>

            {/* Statut global */}
            <div style={{
              background:critiques>0?"#ef444418":alertes>0?"#f59e0b18":"#22c55e18",
              border:`1px solid ${critiques>0?"#ef444444":alertes>0?"#f59e0b44":"#22c55e44"}`,
              borderRadius:8,padding:"10px 12px",
            }}>
              <div style={{fontSize:13,fontWeight:700,color:critiques>0?"#ef4444":alertes>0?"#f59e0b":"#22c55e",marginBottom:4}}>
                {critiques>0?"🔴 Problèmes en cours":alertes>0?"⚠️ Sous surveillance":"✅ Fonctionnel"}
              </div>
              <div style={{color:"#64748b",fontSize:10,lineHeight:1.4}}>
                {critiques>0?`${critiques} incident(s) critique(s)`:alertes>0?`${alertes} point(s) en surveillance`:"Aucune perturbation"}
              </div>
            </div>

            {/* Quartiers */}
            <div>
              <p style={{color:"#94a3b8",fontSize:9,fontWeight:700,letterSpacing:"0.12em",marginBottom:8}}>EAU PAR QUARTIER</p>
              <div className="citizen-scroll" style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                {Object.entries(ZONE_STATUS).map(([zone,info])=>(
                  <div key={zone} onClick={()=>setSelectedZone(selectedZone===zone?null:zone)}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"6px 8px",borderRadius:6,cursor:"pointer",
                      background:selectedZone===zone?`${info.color}15`:"transparent",
                      border:`1px solid ${selectedZone===zone?info.color+"44":"transparent"}`,transition:"all .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:info.color,flexShrink:0}}/>
                      <span style={{color:"#cbd5e1",fontSize:11}}>{zone}</span>
                    </div>
                    <span style={{color:info.color,fontSize:10,fontWeight:600}}>{info.potable?"✓":"!"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents */}
            <div>
              <p style={{color:"#ef444499",fontSize:9,fontWeight:700,letterSpacing:"0.12em",marginBottom:8}}>
                INCIDENTS &nbsp;<span style={{background:"#ef444422",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {ALERTS.map((alert:any)=>{
                  const color = SEVERITY_COLORS[alert.severity]
                  return (
                    <div key={alert.alert_id}
                      onClick={()=>{setSelectedAlert((p:any)=>p?.alert_id===alert.alert_id?null:alert);mapRef.current?.setView([alert.lat,alert.lng],15)}}
                      style={{padding:"7px 9px",borderRadius:6,cursor:"pointer",background:`${color}11`,
                        borderLeft:`3px solid ${color}`,borderTop:`1px solid ${color}22`,
                        borderRight:`1px solid ${color}22`,borderBottom:`1px solid ${color}22`,transition:"all .15s"}}>
                      <div style={{color,fontSize:11,fontWeight:700,marginBottom:2}}>{alert.type}</div>
                      <div style={{color:"#64748b",fontSize:10}}>{alert.location}</div>
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

        {/* Carte */}
        <div style={{flex:1,position:"relative"}}>
          <button onClick={()=>setExpanded(e=>!e)} style={{
            position:"absolute",top:12,right:12,zIndex:1000,
            background:"#020817",border:"1px solid rgba(34,211,238,.3)",
            borderRadius:6,padding:"6px 10px",cursor:"pointer",
            color:"#22d3ee",fontSize:12,fontWeight:700,
          }}>{expanded?"⊠ Réduire":"⊞ Plein écran"}</button>

          <div style={{width:"100%",height:"100%",filter:expanded?"none":"blur(0.4px)",transition:"filter .3s"}}>
            <div ref={mapContainerRef} style={{width:"100%",height:"100%"}}/>
          </div>

          {/* Légende */}
          <div className="citizen-panel" style={{position:"absolute",bottom:40,right:12,zIndex:1000,padding:"10px 14px"}}>
            <p style={{color:"#94a3b8",fontSize:9,fontWeight:700,letterSpacing:"0.12em",marginBottom:8}}>LÉGENDE</p>
            {[
              {color:"#22c55e",label:"Eau potable"},
              {color:"#f59e0b",label:"Sous surveillance"},
              {color:"#ef4444",label:"Incident en cours"},
              {color:"#ef4444",label:"Canalisation à risque"},
              {color:"#22d3ee",label:"Réseau normal"},
            ].map(item=>(
              <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:8,height:8,borderRadius:2,background:item.color,flexShrink:0}}/>
                <span style={{color:"#64748b",fontSize:10}}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Panel détail droite */}
          {(selectedAlert||selectedZone) && (
            <div className="citizen-panel" style={{position:"absolute",right:12,top:48,width:240,zIndex:1000,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{color:"#94a3b8",fontSize:9,fontWeight:700,letterSpacing:"0.12em"}}>
                  {selectedAlert?"INCIDENT":"MON QUARTIER"}
                </span>
                <button onClick={()=>{setSelectedAlert(null);setSelectedZone(null)}}
                  style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
              </div>

              {selectedAlert&&(()=>{
                const color = SEVERITY_COLORS[selectedAlert.severity]
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{background:`${color}18`,border:`1px solid ${color}44`,borderRadius:8,padding:"10px 12px"}}>
                      <div style={{color,fontSize:14,fontWeight:700,marginBottom:4}}>
                        {selectedAlert.severity==="Critique"?"🔴":"⚠️"} {selectedAlert.type}
                      </div>
                      <div style={{color:"#94a3b8",fontSize:11}}>{selectedAlert.location}</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,.03)",borderRadius:6,padding:"10px 12px",border:"1px solid rgba(255,255,255,.06)"}}>
                      <p style={{color:"#e2e8f0",fontSize:12,lineHeight:1.6,margin:0}}>{selectedAlert.description}</p>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#64748b"}}>Statut</span>
                      <span style={{color:"#e2e8f0",fontWeight:600}}>{selectedAlert.status}</span>
                    </div>
                    {selectedAlert.severity==="Critique"&&(
                      <div style={{background:"#f59e0b11",border:"1px solid #f59e0b33",borderRadius:6,padding:"8px 10px"}}>
                        <p style={{color:"#f59e0b",fontSize:11,margin:0,lineHeight:1.5}}>💡 Si vous êtes dans ce secteur, conservez de l'eau en bouteille par précaution.</p>
                      </div>
                    )}
                  </div>
                )
              })()}

              {selectedZone&&!selectedAlert&&(()=>{
                const info = ZONE_STATUS[selectedZone]
                const zoneAlerts = ALERTS.filter(a=>a.location.includes(selectedZone))
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{background:`${info.color}18`,border:`1px solid ${info.color}44`,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{info.potable?"✅":"⚠️"}</div>
                      <div style={{color:info.color,fontSize:14,fontWeight:700}}>{info.message}</div>
                      <div style={{color:"#64748b",fontSize:11,marginTop:4}}>{selectedZone}</div>
                    </div>
                    <p style={{color:info.potable?"#64748b":"#94a3b8",fontSize:12,lineHeight:1.6,margin:0}}>
                      {info.potable?"L'eau du robinet est conforme aux normes dans votre quartier.":"Une anomalie a été détectée. Les équipes techniques interviennent."}
                    </p>
                    {zoneAlerts.length>0&&(
                      <div>
                        <p style={{color:"#64748b",fontSize:10,marginBottom:6}}>Incidents en cours :</p>
                        {zoneAlerts.map(a=>(
                          <div key={a.alert_id} style={{padding:"6px 8px",borderRadius:5,background:`${SEVERITY_COLORS[a.severity]}11`,borderLeft:`3px solid ${SEVERITY_COLORS[a.severity]}`,marginBottom:4,color:"#94a3b8",fontSize:11}}>
                            {a.type} — {a.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
