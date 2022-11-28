const AfmInfo = require("afm-info2");
const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

document.addEventListener("DOMContentLoaded", function () {
  function validateAfm(afm) {
    //entering the vat number. In Greek 'AFM'
    const vat_number = afm;

    const count_digits = vat_number.length;
    const array = vat_number.split("");

    let sum_of_digits = 0;
    for (i = 0; i < 9; i++) {
      sum_of_digits = sum_of_digits + Number(vat_number[i]);
    }

    if (count_digits != 9 || sum_of_digits === 0) {
      return false;
    } else {
      let m = 256;
      let a1 = 0;
      let i = 1;
      for (i = 0; i < 8; i++) {
        a1 = a1 + Number(array[i]) * m;
        m = m / 2;
      }
      const a2 = a1 % 11;

      if (Number(array[8]) === a2 % 10) {
        return true;
      } else {
        return false;
      }
    }
  }
  function convertDate(inputFormat) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    var d = new Date(inputFormat)
    return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/')
  }
  document.getElementById("submit").addEventListener("click", handleSubmit);
  async function handleSubmit(e) {
    e.preventDefault();
    let afmValue = document.getElementById("afm").value;
    afmValue.trim();

    if (!validateAfm(afmValue)) {
      ipcRenderer.send("alert", "Λάθος μορφή ΑΦΜ");
      return;
    }

    const jsonPath = path.join(__dirname, "config.json");
    const rawData = fs.readFileSync(jsonPath);
    const jsonData = JSON.parse(rawData);
    const userName = jsonData.username;
    const afmFor = jsonData.afm;
    const password = jsonData.password;

    // Last param is the AFM you make requests on behalf of.
    const afmInfo = new AfmInfo(userName, password, afmFor);

    // Get service version.
    afmInfo.version().then(console.log).catch(console.error);

    // Get info about a particular AFM.
    afmInfo
      .info(afmValue)
      .then((data) => handleData(data))
      .catch(console.error);

    function handleData(data) {
      const error = data.pErrorRec_out;
      if (error) {
        const errorMessage = data.pErrorRec_out.errorDescr;
        ipcRenderer.send("alert", errorMessage);
        return;
      }
      const businessData = data.RgWsPublicBasicRt_out;
      const afm = businessData.afm;
      const businessName = businessData.onomasia;
      const doyID = businessData.doy;
      const doy = businessData.doyDescr;
      const postalAddress = businessData.postalAddress;
      const postalAddressNum = businessData.postalAddressNo;
      const postalAddressDesc = businessData.postalAreaDescription;
      const postalZip = businessData.postalZipCode;
      let registrationDate = businessData.registDate;
      registrationDate = convertDate(registrationDate)
      const address = `${postalAddress} ${postalAddressNum}, ${postalAddressDesc}, ${postalZip}`;
      const doyString = `ΔΟΥ:${doy}-(${doyID})`;
      document.getElementById("result").style.display = "flex";
      document.getElementById("doy").innerHTML = doyString;
      document.getElementById("businessTitle").innerHTML = businessName;
      document.getElementById("afmText").innerHTML = `ΑΦΜ:${afm}`;
      document.getElementById("address").innerHTML = address;
      document.getElementById(
        "startDate"
      ).innerHTML = `ΗΜΕΡΟΜΗΝΙΑ ΕΝΑΡΞΗΣ:${registrationDate}`;
     const activityArray = data.arrayOfRgWsPublicFirmActRt_out.RgWsPublicFirmActRtUser;
     activityArray.forEach(element => {
        const itemHTML = `<div class="activity-item">${element.firmActCode} - ${element.firmActDescr} (${element.firmActKindDescr})`
        const activityHTML = document.getElementById('activity').innerHTML
        document.getElementById('activity').innerHTML = activityHTML + itemHTML
     });
    }
  }
});
