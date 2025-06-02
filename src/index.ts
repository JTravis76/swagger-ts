import { IEndpoint, ISwagger } from "./swagger.d";
const fs = require("fs")

const params = {
  input: new Array<string>(),
  header: {},
  strictSSL: true,
  schemaOut: "",
  controllerOut: "",
  mode: "version" // future mode in WIP, version | verb??
};

//============================================================
let swagger = {} as ISwagger;
let endpoints = new Array<IEndpoint>();
const schemas = {} as Record<string, { tag: string, body: string, kind: string }[]>;
const controllers = {} as Record<string, Record<string, string[]>>;
let responseTypes = new Array<string>();

const nonInterfaceTypes = "boolean|number|number[]|string|string[]|object|void|Record<string, boolean>|Record<string, string>";
const queryVerbs = "get|delete|head|options";
const bodyVerbs = "post|put|patch";
const dataTypes = { "integer": "number", "string": "string", "boolean": "boolean", "array": "[]" } as Record<string, string>;
const contentTypes = ["application/json", "application/json; ver=1.0", "application/json; ver=2.0"];
//==== Utilities ======================================================

function generatedMessage() {
  return "/* eslint-disable */\n/* tslint:disable */\n// @ts-nocheck This file is auto-generated\n/*\n* -----------------------------------------------------\n* ## THIS FILE WAS GENERATED VIA SWAGGER-TS          ##\n* ## https://github.com/JTravis76/swagger-ts         ##\n* -----------------------------------------------------\n*/\n";
}

function getReferenceType(value: string) {
  const ref = value.split("/");
  return `${ref[ref.length - 1]}`;
}

function getType(content?: { schema: any }) {
  if (!content) return "";
  let refType = content.schema["$ref"]
    ? getReferenceType(content.schema["$ref"])
    : "void";

  if (content.schema.items) {
    if (content.schema.items["$ref"]) {
      refType = getReferenceType(content.schema.items["$ref"]);
    } else {
      // get items/type
      refType = dataTypes[content.schema.items.type];
    }
  }

  // set either the scalar or object type
  switch (content.schema.type) {
    case "array":
      refType = `${refType}[]`
      break;
    case "integer":
      refType = "number"
      break;
    case "boolean":
      refType = "boolean"
      break;
    case "string":
      refType = "string"
      break;
    case "object":
      if (content.schema.additionalProperties) {
        refType = `Record<string, ${content.schema.additionalProperties.type}>`
      }
      break;
    default:
      //do nothing
      break;
  }
  return refType;
}

function deepMerge(target: any, source: any) {
  // deno-lint-ignore no-explicit-any
  const isObject = (obj: any) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = [...new Set(targetValue.concat(sourceValue))];
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

//==== Schemas ========================================================

/** Build a list of objects that are of type Response */
function collectResponseTypes() {
  const list = new Array<string>();
  const paths = Object.keys(swagger.paths);
  for (const p in paths) {
    const path = paths[p];
    const verbs = Object.keys(swagger.paths[path]);
    for (const v in verbs) {
      const verb = verbs[v];
      if (swagger.paths[path][verb].responses && swagger.paths[path][verb].responses["200"].content) {
        const contentObj = swagger.paths[path][verb].responses["200"].content;
        for (let i = 0; i < contentTypes.length; i++) {
          let content = contentObj[contentTypes[i]];
          if (content) {
            const type = getType(content).replace("[]", "");
            list.push(type);
            // Now we search & check the nested objects
            if (swagger.components.schemas[type]?.properties) {
              const properties = swagger.components.schemas[type].properties;
              Object.keys(properties)
                .forEach((prop: string) => {
                  if (properties[prop]["items"]) {
                    if (properties[prop]["items"]["$ref"]) {
                      // NOTE: This is a single level depth ONLY !!
                      list.push(getReferenceType(properties[prop]["items"]["$ref"]));
                    }
                    // else {
                    //   // a scalar type
                    //   console.log(properties[prop]["items"]["type"])
                    // }
                  }
                });
            }
            break;
          }
        }
      }
    }
  }
  responseTypes = [...new Set(list)];
}

function buildSchema(name: string) {
  const isRespType = responseTypes.includes(name);
  if (!schemas[name]) schemas[name] = [];
  if (swagger.components.schemas[name].properties) {
    let sb = `{\n`;
    const properties = swagger.components.schemas[name].properties;
    Object.keys(properties).forEach((prop: string) => {
      sb += `${properties[prop]["format"] ? `  /** @format ${properties[prop]["format"]} */\n` : ""}`;
      sb += `  ${properties[prop]["readOnly"] ? "readonly " : ""}${prop}${isRespType ? "" : "?"}: `;

      if (properties[prop]["items"]) {
        if (properties[prop]["items"]["$ref"]) {
          const itemRef = properties[prop]["items"]["$ref"] as string;
          const arr = itemRef.split("/");
          sb += `I${arr[arr.length - 1]}`;
        } else {
          sb += `${dataTypes[properties[prop]["items"]["type"]] ?? "any"}`;
        }
      }

      if (properties[prop]["type"]) {
        switch (properties[prop]["type"]) {
          case "array":
            sb += "[]";
            break;
          case "integer":
            sb += "number";
            break;
          default:
            sb += properties[prop]["type"];
            break;
        }
      }

      if (properties[prop]["$ref"]) {
        const ref = properties[prop]["$ref"] as string;
        const arr = ref.split("/");
        sb += `I${arr[arr.length - 1]}`;
      }

      const nullable = properties[prop]["nullable"];
      if (sb.endsWith(": ") && nullable) sb += "any | null";
      else if (nullable) sb += " | null";

      sb += ";\n";
    });

    sb += "}\n\n";
    schemas[name].push({ kind: "interface", tag: swagger.info.version, body: sb });
  } else if (swagger.components.schemas[name]["enum"]) {
    // Convert ENUM to TS Type
    const enumValues = swagger.components.schemas[name]["enum"] as number[];
    schemas[name].push({ kind: "type", tag: swagger.info.version, body: `= ${enumValues.join(" | ")};\n` });
  }
}

/** Builds out the entire schema-first */
function generateSchema() {
  Object.keys(swagger.components.schemas)
    .forEach((name: string) => buildSchema(name));
}

/** Builds the declaration of the schema*/
function createSchema(): string {
  let sb = generatedMessage();
  Object.keys(schemas)
    //.filter((x) => x === "")
    .forEach((s) => {
      const main = schemas[s][0]; // set the initial version for comparison

      // always create main
      sb += `${main.kind} I${s} ${main.body}`;
      // compare against the others
      schemas[s].forEach((x) => {
        if (x.body !== main.body)
          sb += `${x.kind} I${s}_${x.tag} ${x.body}`
      });
    });
  return sb;
}

//==== Endpoints/Controller ===========================================

// /** Merge action together based on verb,controller, & action */
function mergeEndpoints() {
  const eps = new Array<IEndpoint>();
  endpoints.forEach((endpoint) => {
    endpoint.isMerged = true;
    const matches = endpoints.filter((x) =>
      x.verb === endpoint.verb
      && x.controller === endpoint.controller
      && x.action === endpoint.action
      && !x.isMerged);

    for (const m in matches) {
      matches[m].isMerged = true;
      endpoint = deepMerge(endpoint, matches[m]);
      endpoint.isMerged = true;
    }

    if (!eps.some((x) =>
      x.verb === endpoint.verb
      && x.controller === endpoint.controller
      && x.action === endpoint.action)) {
      eps.push(endpoint);
    }
  })
  endpoints = eps;
}

/** Read and process the swagger and create endpoint objects */
function generateEndpoints() {
  const version = swagger.info.version;

  // PRO-TIP! use the filter to assist with debugging
  Object.keys(swagger.paths)
    //.filter(x => x.includes("/Version/"))
    .forEach((path) => {
      const parts = path.split("/");
      let action = parts[parts.length - 1];
      let controller = parts[parts.length - 2];

      if (action.includes("{")) {
        action = parts[parts.length - 2];
        controller = parts[parts.length - 3];
      }

      Object.keys(swagger.paths[path]).forEach((verb) => {
        const pathVerb = swagger.paths[path][verb];

        // == Fetch the parameters and type  == //
        const queryParameters = new Array<{ name: string, type: string }>();
        if (pathVerb.parameters) {
          (pathVerb.parameters as { name: string, in: string, required: boolean, schema: any }[])
            .forEach((parameter) => {
              if (parameter.in === "path" && parameter.required) {
                path = path.replace(`{`, "${");
                const pType = dataTypes[parameter.schema.type] ?? "";
                if (pType != "") queryParameters.push({ name: parameter.name, type: pType });
              }
              else if (parameter.in === "query") {
                const pType = dataTypes[parameter.schema.type] ?? "";
                if (pType != "") queryParameters.push({ name: parameter.name, type: pType });
              }
            });
        }

        // == Fetch the body and type  == //
        let payloadParameter = "";
        if (pathVerb.requestBody) {
          let type = "any";
          for (let i = 0; i < contentTypes.length; i++) {
            const content = pathVerb.requestBody.content[contentTypes[i]];
            if (content) {
              type = getType(content);
              // buildSchema(type);
              break;
            }
          }
          payloadParameter = `payload: ${nonInterfaceTypes.includes(type) ? type : "I" + type}`;
        }

        // == Fetch the return-type for the path/verb == //
        let returnType = "void";
        if (pathVerb.responses) {
          if (pathVerb.responses["200"].content) {
            for (let i = 0; i < contentTypes.length; i++) {
              const contentType = contentTypes[i];
              const content = pathVerb.responses["200"].content[contentType];
              if (content) {
                returnType = getType(content);
                // TODO: This doesn't create the nested objects
                // buildSchema(returnType.replace("[]", ""));
                break;
              }
            }
          }
        }

        returnType = nonInterfaceTypes.includes(returnType) ? returnType : "I" + returnType;

        endpoints.push({
          paths: [{
            tag: version,
            url: [path],
            query: queryParameters,
            payload: payloadParameter,
            returnType: returnType
          }],
          controller,
          action,
          verb,
          isMerged: false
        });
      });
    });
}

/** Build out controller + functions */
function buildControllers() {
  endpoints.forEach((e) => {
    // initialize the controller object
    if (!controllers[e.controller]) controllers[e.controller] = {};

    e.paths.forEach((p, idx) => {
      // look back one to match is path was already created.
      let already = false; // already created flag
      if (idx > 0) {
        const path = e.paths[idx - 1];
        already = (
          path.payload === p.payload
          && path.returnType === p.returnType
          && path.url.toString() === p.url.toString()
          && path.tag === p.tag
        );
      }

      // Is path already created..
      // Sometimes, v1 endpoint bubbles up to v2 when those controller(s)
      // hasn't been created. Let's ingore those too.
      if (p.tag !== "v1" && (p.query.length === 0 || already)) {
        // continue
      }
      else {
        // initialize controller with endpoint-version object
        if (!controllers[e.controller][p.tag]) {
          controllers[e.controller][p.tag] = [];
        }

        let sb = "";
        const url = p.url[0].replace("v\${version}", p.tag);

        // Does v2 match v1 ??
        if (p.tag !== "v1") {
          //request query/payload
          if (p.payload.length > 0) {
            let r = p.payload.replace("payload: I", "");
            let v1 = schemas[r].find((x) => x.tag === "v1");
            if (v1) {
              // making sure there is something to compare.
              let current = schemas[r].find((x) => x.tag === p.tag);
              if (v1.body !== current?.body) p.payload += `_${p.tag}`;
            }
          }
          // return-type
          if (!nonInterfaceTypes.includes(p.returnType)) {
            let r = p.returnType.replace("[]", "").substring(1, p.returnType.length);
            let v1 = schemas[r].find((x) => x.tag === "v1");
            if (v1) {
              // making sure there is something to compare.
              let current = schemas[r].find((x) => x.tag === p.tag);
              if (v1.body !== current?.body) {
                if (p.returnType.includes("[]")) {
                  p.returnType = p.returnType.replace("[]", `_${p.tag}[]`);
                }
                else {
                  p.returnType += `_${p.tag}`
                }
              };
            }
          }
        }

        if (queryVerbs.includes(e.verb)) {
          if (p.query.length === 0) {
            sb += `      ${e.action}: () => httpClient.${e.verb}<${p.returnType}>(\`${url}\`),\n`;
          }
          else {
            // (id: string, sort: string) & { id, sort }
            const payload = p.query.map((x) => `${x.name}: ${x.type}`);
            const params = p.query.map((x) => `${x.name}`);
            sb += `      ${e.action}: (${payload.join(", ")}) => httpClient.${e.verb}<${p.returnType}>(\`${url}\`, { params: { ${params.join(", ")} } }),\n`;
          }
        }
        if (bodyVerbs.includes(e.verb)) {
          if (p.payload.length > 0)
            sb += `      ${e.action}: (${p.payload}) => httpClient.${e.verb}<${p.returnType}>(\`${url}\`, payload),\n`;
          else
            sb += `      ${e.action}: () => httpClient.${e.verb}<${p.returnType}>(\`${url}\`),\n`;
        }

        if (sb.length > 0 && !controllers[e.controller][p.tag].some(x => x.includes(e.action + ":"))) {
          controllers[e.controller][p.tag].push(sb);
        }
      }
    });
  });
}

// function buildController2() {
//   endpoints.forEach((e) => {
//     let sb = "";
//     if (!controllers[e.controller]) controllers[e.controller] = [];

//     // make 'version' optional for backward compatibility
//     const query = e.queryParameters.join(", ").replace("version: string", "version?: string");
//     for (const p in e.path) {
//       e.path[p] = e.path[p].replace("{version}", "${version}");
//     }

//     if (queryVerbs.includes(e.verb)) {
//       if (query.length === 0) {
//         sb += `    ${e.action}: () => httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`),\n`;
//       } else {
//         sb += `    ${e.action}: (${query}) => httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`, { params: { key } }),\n`;
//       }
//     }
//     if (bodyVerbs.includes(e.verb)) {
//       // Pipe 'payload' types together
//       // make 'version' optional for backward compatibility
//       const payload = e.payloadParameter.join(", ").replace(", payload: ", " | ").replace("version: string", "version?: string");

//       if (e.path.length > 1) {
//         sb += `    ${e.action}(${payload}, ${query}) {\n      if (version) return httpClient.${e.verb}<${e.returnType}>(\`${e.path[1]}\`, payload);\n      return httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`, payload);\n    },\n`;
//       }
//       else {
//         if (e.payloadParameter.length === 0) {
//           sb += `    ${e.action}: () => httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`),\n`;
//         }
//         else {
//           if (query.length > 0) {
//             sb += `    ${e.action}: (${payload}, ${query}) => httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`, payload),\n`;
//           } else {
//             sb += `    ${e.action}: (${payload}) => httpClient.${e.verb}<${e.returnType}>(\`${e.path[0]}\`, payload),\n`;
//           }
//         }
//       }
//     }

//     controllers[e.controller].push(sb);
//   })
// }

/** Client Builder */
function createController(): string {
  mergeEndpoints();
  buildControllers();

  // PRO-TIP! use the filter (in the 'generateEndpoints') to assist with debugging
  //console.log(endpoints);
  //endpoints.forEach((e) => console.log(e.paths))

  let sb = generatedMessage()
  sb += "import httpClient from './httpClient';\n";
  sb += "\n// prettier-ignore\nexport default {\n";
  Object.keys(controllers).forEach((c) => {
    let controller = controllers[c];
    sb += `  ${c}: {\n`;
    Object.keys(controller).forEach(v => {
      if (controller[v].length > 0) {
        sb += `    ${v}: {\n`;
        sb += `${controller[v].join("")}`;
        sb += "    },\n"
      }
    })
    sb += "  },\n"
  })
  sb += "}\n";

  return sb;
}

//==== Index ==========================================================

/** Print phrase to either console or file
 * @param phrase text phrase to print
 */
function print(phrase: string, filePath?: string): void {
  if (filePath) fs.writeFileSync(filePath, phrase)
  else console.log(phrase);
}

export const generate = async (opt?: { input: string | string[] }): Promise<void> => {
  if (!opt) return;

  if (typeof opt.input === "string" && opt.input.includes("["))
    opt.input = JSON.parse(opt.input);
  else if (typeof opt.input === "string") opt.input = [opt.input];

  Object.assign(params, opt);

  if (params.input.length === 0) {
    const packageInfo = JSON.parse(fs.readFileSync("package.json", "utf8"));
    if (packageInfo.swagger) {
      Object.assign(params, packageInfo.swagger);
    } else {
      // check for local config
      if (fs.existsSync("swagger.config")) {
        const config = JSON.parse(fs.readFileSync("swagger.config", "utf8"));
        Object.assign(params, config);
      }
    }
  }

  if (Array.isArray(params.input)) {

    for (let idx in params.input) {
      let value = params.input[idx];

      if (value.startsWith("http")) {
        if (!params.strictSSL) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        await fetch(value)
          .then((res) => res.ok ? res.json() : res.text())
          .then((d) => {
            swagger = d as ISwagger;
          })
          .catch((err) => console.error(err));
      }
      else if (value.includes(".json")) {
        swagger = JSON.parse(fs.readFileSync(value, "utf8"));
      }

      if (!swagger.openapi) {
        console.error("Unknown error. Check the swagger.json.");
        return
      }
      collectResponseTypes();
      generateSchema();
      generateEndpoints();
    }

    print(createSchema(), params.schemaOut);
    print(createController(), params.controllerOut);
  }
}
