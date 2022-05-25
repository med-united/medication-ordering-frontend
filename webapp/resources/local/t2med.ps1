$code= @"
        using System.Net;
        using System.Security.Cryptography.X509Certificates;
        public class TrustAllCertsPolicy : ICertificatePolicy {
            public bool CheckValidationResult(ServicePoint srvPoint, X509Certificate certificate, WebRequest request, int certificateProblem) {
                return true;
            }
        }
"@
Add-Type -TypeDefinition $code -Language CSharp
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

#Arguments
$patientSurname = $args[0]
$patientName = $args[1]

Write-Host "Please enter your username:"
$doctorUsername = Read-Host
Write-Host "Please enter your password:"
$doctorPassword = Read-Host

#----------------------------------------------------------------------------------------------------------------------
#Login into the system

$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Basic " + [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("${doctorUsername}:")))

$response = Invoke-RestMethod 'https://157.90.254.136:16567/aps/rest/benutzer/login/authenticate' -Method 'GET' -Headers $headers

$userReference = $response | Select-Object -ExpandProperty "benutzer" | Select-Object -ExpandProperty "benutzer" | Select-Object -ExpandProperty "ref" | Select-Object -ExpandProperty "objectId" | Select-Object -ExpandProperty "id"
Write-Host $userReference

#----------------------------------------------------------------------------------------------------------------------
#Get Doctor's role
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Basic dDJ1c2VyOg==")
$headers.Add("Content-Type", "application/json")
$headers.Add("Cookie", "JSESSIONID=4F399F364F7DA6C41A1BCBF0DC17F4D4")

$body = "{
`n    `"benutzerRef`": {
`n        `"objectId`": {
`n            `"id`": `"$userReference`"
`n        }
`n    }
`n}"

$response = Invoke-RestMethod 'https://157.90.254.136:16567/aps/rest/praxis/praxisstruktur/kontextauswaehlen/arztrollenFuerBenutzer' -Method 'POST' -Headers $headers -Body $body

$doctorReference = $response | Select-Object -ExpandProperty "arztrollen" | Select-Object -ExpandProperty "ref" | Select-Object -ExpandProperty "objectId" | Select-Object -ExpandProperty "id"
Write-Host $doctorReference

#----------------------------------------------------------------------------------------------------------------------
#Filter patients by surname, name

$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Basic dDJ1c2VyOg==")
$headers.Add("Content-Type", "application/json")
$headers.Add("Cookie", "JSESSIONID=4F399F364F7DA6C41A1BCBF0DC17F4D4")

$body = "{
`n    `"searchString`": `"$patientSurname, $patientName`"
`n}"

$response = Invoke-RestMethod 'https://157.90.254.136:16567/aps/rest/praxis/patient/liste/pagefilter' -Method 'POST' -Headers $headers -Body $body

$patientReference = $response | Select-Object -ExpandProperty "patientSearchResultDTOS" | Select-Object -ExpandProperty "ref" | Select-Object -ExpandProperty "objectId" | Select-Object -ExpandProperty "id"
Write-Host $patientReference

#Get most recent behandlungsfall
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Basic dDJ1c2VyOg==")
$headers.Add("Content-Type", "application/json")
$headers.Add("Cookie", "JSESSIONID=84CD7A70DA8F9AF196515AC16C96D20B")

$body = "{
`n    `"objectId`": {
`n        `"id`": `"$patientReference`"
`n    }
`n}"

$response = Invoke-RestMethod 'https://157.90.254.136:16567/aps/rest/praxis/behandlungsfaelle/faellefuerpatientinkrementell' -Method 'POST' -Headers $headers -Body $body
$caseReference = $response | Select-Object -ExpandProperty "zeilenMaps" | Select-Object -ExpandProperty "AKTUELL" | Select-Object -ExpandProperty "ref" -First 1 | Select-Object -ExpandProperty "objectId" | Select-Object -ExpandProperty "id"
Write-Host $caseReference

#----------------------------------------------------------------------------------------------------------------------
#Create and save prescription

# $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
# $headers.Add("Authorization", "Basic dDJ1c2VyOg==")
# $headers.Add("Content-Type", "application/json")
# $headers.Add("Cookie", "JSESSIONID=3381690A6CCB3A74086BF4AE63A4F430")

# $body = "{
# `n    `"kontext`": {
# `n        `"arztrolleRef`": {
# `n            `"objectId`": {
# `n                `"id`": `"$doctorReference`"
# `n            }
# `n        },
# `n        `"aufrufenderVorgang`": 4,
# `n        `"behandlungsfallRef`": {
# `n            `"objectId`": {
# `n                `"id`": `"$caseReference`"
# `n            }
# `n        },
# `n        `"behandlungsortRef`": {
# `n            `"objectId`": {
# `n                `"id`": `"0034e494b867d10e4c5a92f0e185c2cf29c7`"
# `n            }
# `n        },
# `n        `"benutzerRef`": {
# `n            `"objectId`": {
# `n                `"id`": `"$userReference`"
# `n            }
# `n        },
# `n        `"patientRef`": {
# `n            `"objectId`": {
# `n                `"id`": `"$patientReference`"
# `n            }
# `n        }
# `n    },
# `n    `"rezepteUndVerordnungen`": [
# `n        {
# `n            `"first`": {
# `n                `"ausstellungszeitpunkt`": null,
# `n                `"begruendungspflicht`": false,
# `n                `"bvg`": false,
# `n                `"erezeptInfo`": {
# `n                    `"absenderId`": null,
# `n                    `"accessCode`": null,
# `n                    `"erezeptId`": null,
# `n                    `"ref`": {
# `n                        `"objectId`": null,
# `n                        `"revision`": 0
# `n                    },
# `n                    `"signaturHbaIccsn`": null,
# `n                    `"signaturzeitpunkt`": null,
# `n                    `"signiertesRezeptVerweis`": null,
# `n                    `"taskId`": null,
# `n                    `"versandzeitpunkt`": null
# `n                },
# `n                `"ersatzverordnung`": false,
# `n                `"hilfsmittel`": false,
# `n                `"impfstoff`": false,
# `n                `"informationszeitpunkt`": null,
# `n                `"notdienstgebuehrenfrei`": false,
# `n                `"ref`": {
# `n                    `"objectId`": null,
# `n                    `"revision`": 0
# `n                },
# `n                `"rezeptgebuehrenfrei`": true,
# `n                `"sonstigerKostentraeger`": false,
# `n                `"sprechstundenbedarf`": false,
# `n                `"uebertragungsweg`": 2,
# `n                `"unfallbetrieb`": null,
# `n                `"unfallstatus`": 0,
# `n                `"unfalltag`": null
# `n            },
# `n            `"second`": {
# `n                `"alsERezeptVerordnet`": true,
# `n                `"alternativeDosierangabe`": null,
# `n                `"anzahlEinheiten`": null,
# `n                `"anzahlPackungen`": 1,
# `n                `"arzneimittelKategorie`": null,
# `n                `"autIdem`": false,
# `n                `"benutzeERezept`": true,
# `n                `"benutzeRezeptinformationstyp`": 34,
# `n                `"benutzeSekundaerenRezeptinformationstyp`": false,
# `n                `"btmKennzeichen`": null,
# `n                `"dosierschema`": {
# `n                    `"abends`": `"1`",
# `n                    `"freitext`": null,
# `n                    `"mittags`": `"0`",
# `n                    `"morgens`": `"1`",
# `n                    `"nachts`": `"0`"
# `n                },
# `n                `"dosierungAufRezept`": true,
# `n                `"erezeptZusatzdaten`": {
# `n                    `"abgabehinweis`": null,
# `n                    `"mehrfachverordnungen`": []
# `n                },
# `n                `"erezeptfaehig`": true,
# `n                `"ersatzverordnungGemaessParagraph31`": false,
# `n                `"farbmarkierung`": null,
# `n                `"farbmarkierungZumVerordnungszeitpunkt`": `"#CCCCCC`",
# `n                `"freitext`": null,
# `n                `"hinweis`": `"`",
# `n                `"layerIndex`": 1,
# `n                `"letzterInformationstyp`": 34,
# `n                `"letzterVerordnungszeitpunkt`": 1653224326736,
# `n                `"medikationsplanBestellposition`": null,
# `n                `"mehrfachverordnungId`": null,
# `n                `"packung`": null,
# `n                `"pimPraeparat`": false,
# `n                `"primaererRezeptinformationstyp`": null,
# `n                `"requiresArzneimittelempfehlungenCheck`": false,
# `n                `"sekundaererRezeptinformationstyp`": null,
# `n                `"verordnungsausschluss`": false,
# `n                `"verordnungseinschraenkung`": false,
# `n                `"wirkstoff`": {
# `n                    `"anzahlEinheiten`": 0,
# `n                    `"atcCode`": null,
# `n                    `"darreichungsform`": {
# `n                        `"freitext`": null,
# `n                        `"ifaCode`": `"FTA`"
# `n                    },
# `n                    `"einheitenname`": null,
# `n                    `"packungsgroesse`": `"N3`",
# `n                    `"rezeptWirkstaerke`": null,
# `n                    `"rezeptWirkstoffname`": null,
# `n                    `"rezepttext`": `"Ibuprofen 600 mg FTA N3`",
# `n                    `"wirkstaerke`": {
# `n                        `"einheit`": `"mg`",
# `n                        `"wert`": 600.0
# `n                    },
# `n                    `"wirkstoff`": `"Ibuprofen`"
# `n                }
# `n            }
# `n        }
# `n    ]
# `n}"

# $response = Invoke-RestMethod 'https://157.90.254.136:16567/aps/rest/verordnung/rezept/ausstellen/saveerezepte' -Method 'POST' -Headers $headers -Body $body