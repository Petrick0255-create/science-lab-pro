import { checkLicense } from "../js/license-core.js";

window.useEarth = async function () {
  return await checkLicense("earth");
};