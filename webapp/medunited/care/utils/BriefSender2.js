sap.ui.define([
    '../../base/control/DataMatrixCode'
], function (DataMatrixCode) {
    'use strict';
    return {

        sendEarztBrief: function (oView, selectedPlans, earztbriefModel) {

            // structure = { Practitioner : { Patient : [ MedicationStatements ]}}
            const structure = this._populateStructure(oView, selectedPlans);

            // generate datamatrices of MedicationStatements in PNG for each Practitioner and their Patients
            for (const practitioner of Object.entries(structure)) {
                const practitionerEmail = this._getPractitionerEmail(oView, practitioner[0]);
                const practitionerFullName = this._getPractitionerFullName(oView, practitioner[0]);
                const patientsOfPractitioner = practitioner[1];
                const allDatamatricesForPractitioner = [];
                const allXMLsForPractitioner = [];

                for (const patientOfPractitioner of Object.entries(patientsOfPractitioner)) {
                    const patient = patientOfPractitioner[0];
                    const patientGivenName = this._getPatientGivenName(oView, patient);
                    const patientFamilyName = this._getPatientFamilyName(oView, patient);
                    const patientBirthDate = this._getPatientBirthDate(oView, patient);
                    const medicationStatementsOfPatient = patientOfPractitioner[1];

                    const xml = this._getMedicationPlanXml(oView, patient, practitioner[0], medicationStatementsOfPatient);
                    const dataMatrixCode = new DataMatrixCode();
                    dataMatrixCode.setMsg(xml);
                    const svg = dataMatrixCode.getSVGXml();

                    this._svgToPng(svg, (imgData) => {
                        const pngImage = document.createElement('img');
                        pngImage.src = imgData;
                        const base64 = this._getBase64String(imgData);
                        console.log(base64);
                        allDatamatricesForPractitioner.push(base64);
                    });

                    this._bindXmlProperties(earztbriefModel, patientGivenName, patientFamilyName, practitionerEmail, patientBirthDate);
                    const oXmlDoc = earztbriefModel.getData();
                    let sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);
                    sXml = sXml.replaceAll("\"", "\\\"");
                    allXMLsForPractitioner.push(sXml);
                }

                console.log(allDatamatricesForPractitioner);

                const templateParams = this._createRequestParams(
                    earztbriefModel,
                    practitionerFullName,
                    practitionerEmail,
                    allXMLsForPractitioner,
                    allDatamatricesForPractitioner);
                
                fetch('https://mail-sender.med-united.health/sendEmail/earztbrief', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateParams)
                });
            }
        },
        _populateStructure(oView, selectedPlans) {
            const structure = {};

            for (const plan of selectedPlans) {
                const patient = oView.getModel().getProperty(plan + '/subject/reference');
                const practitioner = oView.getModel().getProperty(plan + '/informationSource/reference');
                if (practitioner in structure) {
                    if (patient in structure[practitioner]) {
                        structure[practitioner][patient].push(plan);
                    }
                    else {
                        structure[practitioner][patient] = [];
                        structure[practitioner][patient].push(plan);
                    }
                }
                else {
                    structure[practitioner] = {};
                    structure[practitioner][patient] = [];
                    structure[practitioner][patient].push(plan);
                }
            }
            return structure;
        },
        _svgToPng: function (svg, callback) {
            const url = this._getSvgUrl(svg);
            this._svgUrlToPng(url, (imgData) => {
                callback(imgData);
                URL.revokeObjectURL(url);
            });
        },
        _getSvgUrl: function (svg) {
            const blob = new Blob([svg], { type: 'image/svg+xml' })
            return URL.createObjectURL(blob);
        },
        _svgUrlToPng: function (svgUrl, callback) {
            const svgImage = document.createElement('img');
            document.body.appendChild(svgImage);
            const that = this;
            svgImage.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = svgImage.clientWidth;
                canvas.height = svgImage.clientHeight;
                const canvasCtx = canvas.getContext('2d');
                canvasCtx.drawImage(svgImage, 0, 0);
                const imgData = canvas.toDataURL('image/png');
                callback(imgData);
                // that._downloadPNG(imgData);
                document.body.removeChild(svgImage);
            };
            svgImage.src = svgUrl;
        },
        _downloadPNG: function (source) {
            const fileName = source.split('/').pop();
            const link = document.createElement("a");
            link.download = fileName;
            link.href = source;
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        _getBase64String: function (dataURL) {
            var idx = dataURL.indexOf('base64,') + 'base64,'.length;
            return dataURL.substring(idx);
        },
        _getMedicationPlanXml: function (oView, oPatient, oPractitioner, oMedicationStatementsForPatient) {
            const patientGivenName = this._getPatientGivenName(oView, oPatient);
            const patientFamilyName = this._getPatientFamilyName(oView, oPatient);
            const patientBirthDate = this._getPatientBirthDate(oView, oPatient);
            const practitionerFullName = this._getPractitionerFullName(oView, oPractitioner);
            const practitionerAddress = this._getPractitionerAddress(oView, oPractitioner);
            const practitionerPostalCode = this._getPractitionerPostalCode(oView, oPractitioner);
            const practitionerCity = this._getPractitionerCity(oView, oPractitioner);
            const practitionerEmail = this._getPractitionerEmail(oView, oPractitioner);
            const practitionerPhone = this._getPractitionerPhone(oView, oPractitioner);

            // <MP v="025" U="02BD2867FB024401A590D59D94E1FFAE" l="de-DE">
            // 	<P g="Jürgen" f="Wernersen" b="19400324"/>
            // 	<A n="Praxis Dr. Michael Müller" s="Schloßstr. 22" z="10555" c="Berlin" p="030-1234567" e="dr.mueller@kbv-net.de" t="2018-07-01T12:00:00"/>
            // 	<S>
            // 		<M p="230272" m="1" du="1" r="Herz/Blutdruck"/>
            // 		<M p="2223945" m="1" du="1" r="Blutdruck"/>
            // 		<M p="558736" m="20" v="20" du="p" i="Wechseln der Injektionsstellen, unmittelbar vor einer Mahlzeit spritzen" r="Diabetes"/>
            // 		<M p="9900751" v="1" du="1" r="Blutfette"/>
            // 	</S>
            // </MP>

            let sXML = "<MP v=\"025\" U=\"" + [...Array(32)].map(() => 'ABCDEF0123456789'.charAt(Math.floor(Math.random() * 16))).join('') + "\" l=\"de-DE\">\n";
            sXML += "  <P g=\"" + patientGivenName + "\" f=\"" + patientFamilyName + "\" b=\"" + (patientBirthDate ? patientBirthDate.replaceAll("-", "") : "") + "\" />\n";
            sXML += "  <A n=\"" + practitionerFullName + "\" s=\"" + practitionerAddress + "\" z=\"" + practitionerPostalCode + "\" c=\"" + practitionerCity + "\" p=\"" + practitionerPhone + "\" e=\"" + practitionerEmail + "\" t=\"" + new Date().toISOString().substring(0, 19) + "\" />\n";
            sXML += "  <S>\n";
            for (let oMedicationStatement of oMedicationStatementsForPatient) {
                try {
                    const medicationStatementIdentifier = oView.getModel().getProperty(oMedicationStatement + '/identifier/0/value');
                    const medicationStatementDosage = oView.getModel().getProperty(oMedicationStatement + '/dosage/0/text');
                    const medicationStatementNote = oView.getModel().getProperty(oMedicationStatement + '/note/0/text');
                    sXML += "    <M p=\"" + medicationStatementIdentifier + "\" ";
                    if (medicationStatementDosage) {
                        const aDosage = medicationStatementDosage.split(/-/);
                        const mDosage = {
                            0: "m",
                            1: "d",
                            2: "v",
                            3: "h"
                        };
                        for (let i = 0; i < aDosage.length; i++) {
                            sXML += mDosage[i] + "=\"" + aDosage[i] + "\" ";
                        }
                    }
                    const sNote = medicationStatementNote;
                    if (sNote) {
                        const m = sNote.match("Grund: (.*) Hinweis: (.*)");
                        if (m) {
                            sXML += "r=\"" + m.group(1) + "\" i=\"" + m.group(2) + "\" ";
                        } else {
                            sXML += "i=\"" + sNote + "\" ";
                        }
                    }
                    sXML += "/>\n";
                } catch (e) {
                    console.error(e);
                }
            }
            sXML += "   </S>\n";
            sXML += "</MP>";
            return sXML;
        },
        _bindXmlProperties: function (earztbriefModel, patientGivenName, patientFamilyName, practitionerEmail, patientBirthDate) {
            earztbriefModel.setProperty('/recordTarget/patientRole/patient/name/given', patientGivenName);
            earztbriefModel.setProperty('/recordTarget/patientRole/patient/name/family', patientFamilyName);
            earztbriefModel.setProperty('/recordTarget/patientRole/patient/birthTime/@value', patientBirthDate);
        },
        _createRequestParams: function (earztbriefModel, practitionerFullName, practitionerEmail, allXMLsForPractitioner, allDatamatricesForPractitioner) {
            return {
                contactname: practitionerFullName,
                contactemail: 'beatriz.correia@incentergy.de', // Change to variable practitionerEmail
                contactmessage: earztbriefModel.getProperty('/component/structuredBody/component/section').toString(),
                attachment: allXMLsForPractitioner,
                datamatrices: allDatamatricesForPractitioner,
            };
        },
        _getPractitionerFullName: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/name/0/given/0') + ' ' + oView.getModel().getProperty('/' + practitioner + '/name/0/family');
        },
        _getPractitionerAddress: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/address/[use=home]/line/0');
        },
        _getPractitionerPostalCode: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/address/[use=home]/postalCode');
        },
        _getPractitionerCity: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/address/[use=home]/city');
        },
        _getPractitionerEmail: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/telecom/0/value');
        },
        _getPractitionerPhone: function (oView, practitioner) {
            return oView.getModel().getProperty('/' + practitioner + '/telecom/1/value');
        },
        _getPatientGivenName: function (oView, patient) {
            return oView.getModel().getProperty('/' + patient + '/name/0/given/0');
        },
        _getPatientFamilyName: function (oView, patient) {
            return oView.getModel().getProperty('/' + patient + '/name/0/family');
        },
        _getPatientBirthDate: function (oView, patient) {
            return oView.getModel().getProperty('/' + patient + '/birthDate');
        }
    };
}, true);