import { checkLicense } from "../js/license-core.js";

window.useBiology = async function () {
  return await checkLicense("biology");
};