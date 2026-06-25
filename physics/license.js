import { checkLicense } from "../js/license-core.js";

window.usePhysics = async function () {
  return await checkLicense("physics");
};