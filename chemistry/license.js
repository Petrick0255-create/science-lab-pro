import { checkLicense } from "../js/license-core.js";

window.useChemistry = async function () {
  return await checkLicense("chemistry");
};