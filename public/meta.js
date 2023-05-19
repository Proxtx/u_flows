import config from "@proxtx/config";
import { genCombine } from "@proxtx/combine-rest/request.js";
import { genModule } from "@proxtx/combine/combine.js";

export const input = await genCombine(config.input, "public/api.js", genModule);
export const apps = await genCombine(config.apps, "public/api.js", genModule);
export const meta = await genCombine(config.apps, "public/meta.js", genModule);

export const auth = async (pwd) => {
  return await meta.auth(pwd);
};
