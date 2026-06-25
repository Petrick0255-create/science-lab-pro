import { checkLicense } from "../js/license-core.js";

window.usePrograms = async function () {
  return await checkLicense("programs");
};