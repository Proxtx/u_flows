import fs from "fs/promises";
import { auth } from "./meta.js";
import { apps } from "./meta.js";

let flows;
let runningFlows = {};

const loadFlows = async () => {
  flows = JSON.parse(await fs.readFile("flows.json", "utf8")).flows;
};

const saveFlows = async () => {
  let currentFlows = JSON.parse(await fs.readFile("flows.json", "utf8"));
  currentFlows.flows = flows;
  await fs.writeFile("flows.json", JSON.stringify(currentFlows, null, 2));
};

const runFlowId = async (pwd, flow, args, id) => {
  if (!(await auth(pwd))) return;
  try {
    let flowStatus = {
      start: Date.now(),
      flow,
      actions: [],
    };
    runningFlows[id] = flowStatus;

    overwriteArgInputs(flow, args);
    overwriteIdInputs(flow, id);
    for (let action of flow.actions) {
      flowStatus.actions.push(
        await apps.execute(pwd, action.appName, action.method, action.arguments)
      );
    }

    let lastAction = flowStatus.actions[flowStatus.actions.length - 1];
    delete runningFlows[id];
    return lastAction;
  } catch {
    console.log("Run flow Id failed");
  }
};

const overwriteArgInputs = (object, args) => {
  for (let k in object) {
    let o = object[k];
    if (o.flowArgumentOverwrite) {
      o.input = args[o.index];
    } else if (typeof o == "object") {
      overwriteArgInputs(o, args);
    }
  }
};

const overwriteIdInputs = (object, id) => {
  for (let k in object) {
    let o = object[k];
    if (o.flowIdOverwrite) {
      o.id = id;
    } else if (typeof o == "object") {
      overwriteIdInputs(o, id);
    }
  }
};

export const runFlow = async (pwd, name, args = []) => {
  if (!(await auth(pwd))) return;
  let id = Math.floor(Math.random() * 10000);
  runningFlows[id] = {
    start: Date.now(),
    flow: flows[name],
    actions: [],
  };
  runFlowId(pwd, JSON.parse(JSON.stringify(flows[name])), args, id);
  return id;
};

export const runFlowSync = async (pwd, name, args = []) => {
  if (!(await auth(pwd))) return;
  let id = Math.floor(Math.random() * 10000);
  return await runFlowId(
    pwd,
    JSON.parse(JSON.stringify(flows[name])),
    args,
    id
  );
};

export const setFlow = async (pwd, name, flow) => {
  if (!(await auth(pwd))) return;
  flows[name] = flow;
  await saveFlows();
};

export const getFlow = async (pwd, name) => {
  if (!(await auth(pwd))) return;
  return flows[name];
};

export const deleteFlow = async (pwd, name) => {
  if (!(await auth(pwd))) return;
  delete flows[name];
  await saveFlows();
};

export const listFlows = async (pwd) => {
  if (!(await auth(pwd))) return;
  return Object.keys(flows);
};

export const getFlowArguments = async (pwd, name) => {
  if (!(await auth(pwd))) return;
  return flows[name].arguments || [];
};

export const flowStatus = async (pwd, id) => {
  if (!(await auth(pwd))) return;
  return runningFlows[id];
};

await loadFlows();
