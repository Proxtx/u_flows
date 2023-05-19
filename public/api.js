import fs from "fs/promises";
import { input, apps } from "./meta.js";
import { auth } from "./meta.js";

let flows;
let runningFlows = {};

const execute = async (pwd, app, method, args) => {
  for (let argIndex in args) {
    args[argIndex] = await input.resolveInput(pwd, args[argIndex]);
  }

  return await apps.execute(pwd, app, method, args);
};

const loadFlows = async () => {
  flows = JSON.parse(await fs.readFile("flows.json", "utf8")).flows;
};

const saveFlows = async () => {
  let currentFlows = JSON.parse(await fs.readFile("flows.json", "utf8"));
  currentFlows.flows = flows;
  await fs.writeFile("flows.json", JSON.stringify(currentFlows, null, 2));
};

const runFlowId = async (pwd, flow, id) => {
  if (!(await auth(pwd))) return;

  let flowStatus = {
    start: Date.now(),
    flow,
    actions: [],
  };
  runningFlows[id] = flowStatus;
  for (let action of flow.actions) {
    flowStatus.actions.push(
      await execute(pwd, action.appName, action.method, action.arguments)
    );
  }

  delete runningFlows[id];
};

export const runFlow = async (pwd, name) => {
  if (!(await auth(pwd))) return;
  let id = Math.floor(Math.random() * 10000);
  runningFlows[id] = {
    start: Date.now(),
    flow: flows[name],
    actions: [],
  };
  runFlowId(pwd, flows[name], id);
  return id;
};

export const runFlowSync = async (pwd, name) => {
  if (!(await auth(pwd))) return;
  let id = Math.floor(Math.random() * 10000);
  await runFlowId(pwd, flows[name], id);
  return id;
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

export const flowStatus = async (pwd, id) => {
  if (!(await auth(pwd))) return;
  return runningFlows[id];
};

await loadFlows();
