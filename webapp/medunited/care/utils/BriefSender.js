sap.ui.define([
    '../../base/control/DataMatrixCode',
    'medunited/care/utils/PropertyExtractor'
], function (DataMatrixCode, PropertyExtractor) {
    'use strict';
    return {

        sendEarztBrief: function (oView, structure, earztbriefModel) {

            // generate datamatrices of MedicationStatements in PNG for each Practitioner and their Patients
            for (const practitioner of Object.entries(structure)) {
                const practitionerEmail = PropertyExtractor.extractEmailFromPractitioner(oView, practitioner[0]);
                const practitionerFullName = PropertyExtractor.extractFullNameFromPractitioner(oView, practitioner[0]);
                const patientsOfPractitioner = practitioner[1];
                const allDatamatricesForPractitioner = [];
                const allXMLsForPractitioner = [];
                let oPromises = [];

                for (const patientOfPractitioner of Object.entries(patientsOfPractitioner)) {
                    const patient = patientOfPractitioner[0];
                    const patientGivenName = PropertyExtractor.extractGivenNameFromPatient(oView, patient);
                    const patientFamilyName = PropertyExtractor.extractFamilyNameFromPatient(oView, patient);
                    const patientBirthDate = PropertyExtractor.extractBirthDateFromPatient(oView, patient);
                    const medicationStatementsOfPatient = patientOfPractitioner[1];

                    const xml = this._getMedicationPlanXml(oView, patient, practitioner[0], medicationStatementsOfPatient);
                    const dataMatrixCode = new DataMatrixCode();
                    dataMatrixCode.setMsg(xml);
                    const svg = dataMatrixCode.getSVGXml();

                    const svgToPngPromise = this._base64SvgToBase64Png(svg, allDatamatricesForPractitioner);

                    oPromises.push(svgToPngPromise);

                    this._bindXmlProperties(earztbriefModel, patientGivenName, patientFamilyName, practitionerEmail, patientBirthDate);
                    const oXmlDoc = earztbriefModel.getData();
                    let sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);
                    allXMLsForPractitioner.push(sXml);
                }

                const templateParams = this._createRequestParams(
                    earztbriefModel,
                    practitionerFullName,
                    practitionerEmail,
                    allXMLsForPractitioner,
                    allDatamatricesForPractitioner);

                Promise.all(oPromises).then(function() {
                    fetch('https://mail-sender.med-united.health/sendEmail/earztbrief', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(templateParams)
                    });
                });
            }
        },
        
        _base64SvgToBase64Png: function (svg, allDatamatricesForPractitioner) {
            return new Promise(resolve => {
                this._svgToPng(svg, (imgData) => {
                    const pngImage = document.createElement('img');
                    pngImage.src = imgData;
                    const base64 = this._getBase64String(imgData);
                    resolve(allDatamatricesForPractitioner.push(base64));
                })
            });
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
            let idx = dataURL.indexOf('base64,') + 'base64,'.length;
            return dataURL.substring(idx);
        },
        _getMedicationPlanXml: function (oView, oPatient, oPractitioner, oMedicationStatementsForPatient) {
            const patientGivenName = PropertyExtractor.extractGivenNameFromPatient(oView, oPatient);
            const patientFamilyName = PropertyExtractor.extractFamilyNameFromPatient(oView, oPatient);
            const patientBirthDate = PropertyExtractor.extractBirthDateFromPatient(oView, oPatient);
            const practitionerFullName = PropertyExtractor.extractFullNameFromPractitioner(oView, oPractitioner);
            const practitionerAddress = PropertyExtractor.extractAddressFromPractitioner(oView, oPractitioner);
            const practitionerPostalCode = PropertyExtractor.extractPostalCodeFromPractitioner(oView, oPractitioner);
            const practitionerCity = PropertyExtractor.extractCityFromPractitioner(oView, oPractitioner);
            const practitionerEmail = PropertyExtractor.extractEmailFromPractitioner(oView, oPractitioner);
            const practitionerPhone = PropertyExtractor.extractPhoneFromPractitioner(oView, oPractitioner);

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
            sXML += "  <P g=\"" + patientGivenName + "\" f=\"" + patientFamilyName + "\" b=\"" + patientBirthDate.replaceAll("-", "") + "\" />\n";
            sXML += "  <A n=\"" + practitionerFullName + "\" s=\"" + practitionerAddress + "\" z=\"" + practitionerPostalCode + "\" c=\"" + practitionerCity + "\" p=\"" + practitionerPhone + "\" e=\"" + practitionerEmail + "\" t=\"" + new Date().toISOString().substring(0, 19) + "\" />\n";
            sXML += "  <S>\n";
            for (let oMedicationStatement of oMedicationStatementsForPatient) {
                try {
                    const medicationStatementIdentifier = PropertyExtractor.extractPznFromPlan(oView, oMedicationStatement);
                    const medicationStatementDosage = PropertyExtractor.extractDosageFromPlan(oView, oMedicationStatement);
                    const medicationStatementNote = PropertyExtractor.extractNoteFromPlan(oView, oMedicationStatement);
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
                            if (aDosage[i] !== "0") {
                                sXML += mDosage[i] + "=\"" + aDosage[i] + "\" ";
                            }
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
                contactName: practitionerFullName,
                contactEmail: practitionerEmail,
                contactMessage: earztbriefModel.getProperty('/component/structuredBody/component/section').toString(),
                attachment: allXMLsForPractitioner,
                datamatrices: allDatamatricesForPractitioner,
            };
        }
    };
}, true);