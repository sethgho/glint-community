// @bun
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// src/db/schema.ts
var exports_schema = {};
__export(exports_schema, {
  getDb: () => getDb,
  closeDb: () => closeDb
});
import { Database } from "bun:sqlite";
import { join as join2 } from "path";
import { mkdirSync } from "fs";
import { dirname as dirname2 } from "path";
function getDbPath() {
  return process.env.GLINT_DB_PATH || join2(process.cwd(), "data", "glint-community.db");
}
function getDb() {
  if (_db)
    return _db;
  const dbPath = getDbPath();
  mkdirSync(dirname2(dbPath), { recursive: true });
  _db = new Database(dbPath);
  _db.run("PRAGMA journal_mode = WAL");
  _db.run("PRAGMA foreign_keys = ON");
  migrate(_db);
  return _db;
}
function migrate(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      github_id INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      scopes TEXT NOT NULL DEFAULT 'publish,read',
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS styles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL,
      readme TEXT,
      preview_path TEXT,
      download_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      yanked_at TEXT,
      UNIQUE(user_id, slug, version)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS style_emotions (
      id TEXT PRIMARY KEY,
      style_id TEXT NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
      emotion TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      UNIQUE(style_id, emotion)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS style_reports (
      id TEXT PRIMARY KEY,
      style_id TEXT NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
      reporter_id TEXT REFERENCES users(id),
      reason TEXT NOT NULL,
      details TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_styles_slug ON styles(slug)");
  db.run("CREATE INDEX IF NOT EXISTS idx_styles_user ON styles(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_style_emotions_style ON style_emotions(style_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash)");
}
function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
var _db = null;
var init_schema = () => {};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || undefined;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== undefined) {
    if (Array.isArray(form[key])) {
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1;i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1;j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (;i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? undefined : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? undefined : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? undefined : nextKeyIndex : valueIndex);
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? undefined : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== undefined) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? undefined;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers;
    if (value === undefined) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map;
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : undefined;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers;
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response;
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = undefined;
      try {
        executionContext = c.executionCtx;
      } catch {}
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, undefined, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== undefined) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some((k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node;
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some((k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node;
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node;
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0;; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1;i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1;j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== undefined) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== undefined) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(path === "*" ? "" : `^${path.replace(/\/\*$|([.\\+*[^\]$()])/g, (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)")}$`);
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie;
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map((route) => [!/\*|\/:/.test(route[0]), ...route]).sort(([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length);
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length;i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (;paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length;i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length;j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length;k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach((p) => re.test(p) && routes[m][p].push([handler, paramCount]));
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length;i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = undefined;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]]));
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
var PreparedRegExpRouter = class {
  name = "PreparedRegExpRouter";
  #matchers;
  #relocateMap;
  constructor(matchers, relocateMap) {
    this.#matchers = matchers;
    this.#relocateMap = relocateMap;
  }
  #addWildcard(method, handlerData) {
    const matcher = this.#matchers[method];
    matcher[1].forEach((list) => list && list.push(handlerData));
    Object.values(matcher[2]).forEach((list) => list[0].push(handlerData));
  }
  #addPath(method, path, handler, indexes, map) {
    const matcher = this.#matchers[method];
    if (!map) {
      matcher[2][path][0].push([handler, {}]);
    } else {
      indexes.forEach((index) => {
        if (typeof index === "number") {
          matcher[1][index].push([handler, map]);
        } else {
          matcher[2][index || path][0].push([handler, map]);
        }
      });
    }
  }
  add(method, path, handler) {
    if (!this.#matchers[method]) {
      const all = this.#matchers[METHOD_NAME_ALL];
      const staticMap = {};
      for (const key in all[2]) {
        staticMap[key] = [all[2][key][0].slice(), emptyParam];
      }
      this.#matchers[method] = [
        all[0],
        all[1].map((list) => Array.isArray(list) ? list.slice() : 0),
        staticMap
      ];
    }
    if (path === "/*" || path === "*") {
      const handlerData = [handler, {}];
      if (method === METHOD_NAME_ALL) {
        for (const m in this.#matchers) {
          this.#addWildcard(m, handlerData);
        }
      } else {
        this.#addWildcard(method, handlerData);
      }
      return;
    }
    const data = this.#relocateMap[path];
    if (!data) {
      throw new Error(`Path ${path} is not registered`);
    }
    for (const [indexes, map] of data) {
      if (method === METHOD_NAME_ALL) {
        for (const m in this.#matchers) {
          this.#addPath(m, path, handler, indexes, map);
        }
      } else {
        this.#addPath(method, path, handler, indexes, map);
      }
    }
  }
  buildAllMatchers() {
    return this.#matchers;
  }
  match = match;
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (;i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length;i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = undefined;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length;i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2;
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length;i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== undefined) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length;i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length;i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length;j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(...this.#getHandlerSets(nextNode.#children["*"], method, node.#params));
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length;k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(...this.#getHandlerSets(child.#children["*"], method, params, node.#params));
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2;
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length;i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter, new TrieRouter]
    });
  }
};

// node_modules/hono/dist/adapter/bun/serve-static.js
import { stat } from "fs/promises";
import { join } from "path";

// node_modules/hono/dist/utils/compress.js
var COMPRESSIBLE_CONTENT_TYPE_REGEX = /^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;

// node_modules/hono/dist/utils/mime.js
var getMimeType = (filename, mimes = baseMimes) => {
  const regexp = /\.([a-zA-Z0-9]+?)$/;
  const match2 = filename.match(regexp);
  if (!match2) {
    return;
  }
  let mimeType = mimes[match2[1]];
  if (mimeType && mimeType.startsWith("text")) {
    mimeType += "; charset=utf-8";
  }
  return mimeType;
};
var _baseMimes = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css",
  csv: "text/csv",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  ics: "text/calendar",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xml: "application/xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
};
var baseMimes = _baseMimes;

// node_modules/hono/dist/middleware/serve-static/path.js
var defaultJoin = (...paths) => {
  let result = paths.filter((p) => p !== "").join("/");
  result = result.replace(/(?<=\/)\/+/g, "");
  const segments = result.split("/");
  const resolved = [];
  for (const segment of segments) {
    if (segment === ".." && resolved.length > 0 && resolved.at(-1) !== "..") {
      resolved.pop();
    } else if (segment !== ".") {
      resolved.push(segment);
    }
  }
  return resolved.join("/") || ".";
};

// node_modules/hono/dist/middleware/serve-static/index.js
var ENCODINGS = {
  br: ".br",
  zstd: ".zst",
  gzip: ".gz"
};
var ENCODINGS_ORDERED_KEYS = Object.keys(ENCODINGS);
var DEFAULT_DOCUMENT = "index.html";
var serveStatic = (options) => {
  const root = options.root ?? "./";
  const optionPath = options.path;
  const join = options.join ?? defaultJoin;
  return async (c, next) => {
    if (c.finalized) {
      return next();
    }
    let filename;
    if (options.path) {
      filename = options.path;
    } else {
      try {
        filename = decodeURIComponent(c.req.path);
        if (/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(filename)) {
          throw new Error;
        }
      } catch {
        await options.onNotFound?.(c.req.path, c);
        return next();
      }
    }
    let path = join(root, !optionPath && options.rewriteRequestPath ? options.rewriteRequestPath(filename) : filename);
    if (options.isDir && await options.isDir(path)) {
      path = join(path, DEFAULT_DOCUMENT);
    }
    const getContent = options.getContent;
    let content = await getContent(path, c);
    if (content instanceof Response) {
      return c.newResponse(content.body, content);
    }
    if (content) {
      const mimeType = options.mimes && getMimeType(path, options.mimes) || getMimeType(path);
      c.header("Content-Type", mimeType || "application/octet-stream");
      if (options.precompressed && (!mimeType || COMPRESSIBLE_CONTENT_TYPE_REGEX.test(mimeType))) {
        const acceptEncodingSet = new Set(c.req.header("Accept-Encoding")?.split(",").map((encoding) => encoding.trim()));
        for (const encoding of ENCODINGS_ORDERED_KEYS) {
          if (!acceptEncodingSet.has(encoding)) {
            continue;
          }
          const compressedContent = await getContent(path + ENCODINGS[encoding], c);
          if (compressedContent) {
            content = compressedContent;
            c.header("Content-Encoding", encoding);
            c.header("Vary", "Accept-Encoding", { append: true });
            break;
          }
        }
      }
      await options.onFound?.(path, c);
      return c.body(content);
    }
    await options.onNotFound?.(path, c);
    await next();
    return;
  };
};

// node_modules/hono/dist/adapter/bun/serve-static.js
var serveStatic2 = (options) => {
  return async function serveStatic22(c, next) {
    const getContent = async (path) => {
      const file = Bun.file(path);
      return await file.exists() ? file : null;
    };
    const isDir = async (path) => {
      let isDir2;
      try {
        const stats = await stat(path);
        isDir2 = stats.isDirectory();
      } catch {}
      return isDir2;
    };
    return serveStatic({
      ...options,
      getContent,
      join,
      isDir
    })(c, next);
  };
};

// node_modules/hono/dist/helper/ssg/middleware.js
var X_HONO_DISABLE_SSG_HEADER_KEY = "x-hono-disable-ssg";
var SSG_DISABLED_RESPONSE = (() => {
  try {
    return new Response("SSG is disabled", {
      status: 404,
      headers: { [X_HONO_DISABLE_SSG_HEADER_KEY]: "true" }
    });
  } catch {
    return null;
  }
})();
// node_modules/hono/dist/adapter/bun/ssg.js
var { write } = Bun;

// node_modules/hono/dist/helper/websocket/index.js
var WSContext = class {
  #init;
  constructor(init) {
    this.#init = init;
    this.raw = init.raw;
    this.url = init.url ? new URL(init.url) : null;
    this.protocol = init.protocol ?? null;
  }
  send(source, options) {
    this.#init.send(source, options ?? {});
  }
  raw;
  binaryType = "arraybuffer";
  get readyState() {
    return this.#init.readyState;
  }
  url;
  protocol;
  close(code, reason) {
    this.#init.close(code, reason);
  }
};
var defineWebSocketHelper = (handler) => {
  return (...args) => {
    if (typeof args[0] === "function") {
      const [createEvents, options] = args;
      return async function upgradeWebSocket(c, next) {
        const events = await createEvents(c);
        const result = await handler(c, events, options);
        if (result) {
          return result;
        }
        await next();
      };
    } else {
      const [c, events, options] = args;
      return (async () => {
        const upgraded = await handler(c, events, options);
        if (!upgraded) {
          throw new Error("Failed to upgrade WebSocket");
        }
        return upgraded;
      })();
    }
  };
};

// node_modules/hono/dist/adapter/bun/server.js
var getBunServer = (c) => ("server" in c.env) ? c.env.server : c.env;

// node_modules/hono/dist/adapter/bun/websocket.js
var upgradeWebSocket = defineWebSocketHelper((c, events) => {
  const server = getBunServer(c);
  if (!server) {
    throw new TypeError("env has to include the 2nd argument of fetch.");
  }
  const upgradeResult = server.upgrade(c.req.raw, {
    data: {
      events,
      url: new URL(c.req.url),
      protocol: c.req.url
    }
  });
  if (upgradeResult) {
    return new Response(null);
  }
  return;
});

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== undefined ? "NO_COLOR" in process2?.env : false;
  return !isNoColor;
}
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== undefined && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}

// node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s"]);
};
var colorStatus = async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// node_modules/hono/dist/middleware/secure-headers/secure-headers.js
var HEADERS_MAP = {
  crossOriginEmbedderPolicy: ["Cross-Origin-Embedder-Policy", "require-corp"],
  crossOriginResourcePolicy: ["Cross-Origin-Resource-Policy", "same-origin"],
  crossOriginOpenerPolicy: ["Cross-Origin-Opener-Policy", "same-origin"],
  originAgentCluster: ["Origin-Agent-Cluster", "?1"],
  referrerPolicy: ["Referrer-Policy", "no-referrer"],
  strictTransportSecurity: ["Strict-Transport-Security", "max-age=15552000; includeSubDomains"],
  xContentTypeOptions: ["X-Content-Type-Options", "nosniff"],
  xDnsPrefetchControl: ["X-DNS-Prefetch-Control", "off"],
  xDownloadOptions: ["X-Download-Options", "noopen"],
  xFrameOptions: ["X-Frame-Options", "SAMEORIGIN"],
  xPermittedCrossDomainPolicies: ["X-Permitted-Cross-Domain-Policies", "none"],
  xXssProtection: ["X-XSS-Protection", "0"]
};
var DEFAULT_OPTIONS = {
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: true,
  crossOriginOpenerPolicy: true,
  originAgentCluster: true,
  referrerPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xDnsPrefetchControl: true,
  xDownloadOptions: true,
  xFrameOptions: true,
  xPermittedCrossDomainPolicies: true,
  xXssProtection: true,
  removePoweredBy: true,
  permissionsPolicy: {}
};
var secureHeaders = (customOptions) => {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const headersToSet = getFilteredHeaders(options);
  const callbacks = [];
  if (options.contentSecurityPolicy) {
    const [callback, value] = getCSPDirectives(options.contentSecurityPolicy);
    if (callback) {
      callbacks.push(callback);
    }
    headersToSet.push(["Content-Security-Policy", value]);
  }
  if (options.contentSecurityPolicyReportOnly) {
    const [callback, value] = getCSPDirectives(options.contentSecurityPolicyReportOnly);
    if (callback) {
      callbacks.push(callback);
    }
    headersToSet.push(["Content-Security-Policy-Report-Only", value]);
  }
  if (options.permissionsPolicy && Object.keys(options.permissionsPolicy).length > 0) {
    headersToSet.push([
      "Permissions-Policy",
      getPermissionsPolicyDirectives(options.permissionsPolicy)
    ]);
  }
  if (options.reportingEndpoints) {
    headersToSet.push(["Reporting-Endpoints", getReportingEndpoints(options.reportingEndpoints)]);
  }
  if (options.reportTo) {
    headersToSet.push(["Report-To", getReportToOptions(options.reportTo)]);
  }
  return async function secureHeaders2(ctx, next) {
    const headersToSetForReq = callbacks.length === 0 ? headersToSet : callbacks.reduce((acc, cb) => cb(ctx, acc), headersToSet);
    await next();
    setHeaders(ctx, headersToSetForReq);
    if (options?.removePoweredBy) {
      ctx.res.headers.delete("X-Powered-By");
    }
  };
};
function getFilteredHeaders(options) {
  return Object.entries(HEADERS_MAP).filter(([key]) => options[key]).map(([key, defaultValue]) => {
    const overrideValue = options[key];
    return typeof overrideValue === "string" ? [defaultValue[0], overrideValue] : defaultValue;
  });
}
function getCSPDirectives(contentSecurityPolicy) {
  const callbacks = [];
  const resultValues = [];
  for (const [directive, value] of Object.entries(contentSecurityPolicy)) {
    const valueArray = Array.isArray(value) ? value : [value];
    valueArray.forEach((value2, i) => {
      if (typeof value2 === "function") {
        const index = i * 2 + 2 + resultValues.length;
        callbacks.push((ctx, values) => {
          values[index] = value2(ctx, directive);
        });
      }
    });
    resultValues.push(directive.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (match2, offset) => offset ? "-" + match2.toLowerCase() : match2.toLowerCase()), ...valueArray.flatMap((value2) => [" ", value2]), "; ");
  }
  resultValues.pop();
  return callbacks.length === 0 ? [undefined, resultValues.join("")] : [
    (ctx, headersToSet) => headersToSet.map((values) => {
      if (values[0] === "Content-Security-Policy" || values[0] === "Content-Security-Policy-Report-Only") {
        const clone = values[1].slice();
        callbacks.forEach((cb) => {
          cb(ctx, clone);
        });
        return [values[0], clone.join("")];
      } else {
        return values;
      }
    }),
    resultValues
  ];
}
function getPermissionsPolicyDirectives(policy) {
  return Object.entries(policy).map(([directive, value]) => {
    const kebabDirective = camelToKebab(directive);
    if (typeof value === "boolean") {
      return `${kebabDirective}=${value ? "*" : "none"}`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${kebabDirective}=()`;
      }
      if (value.length === 1 && (value[0] === "*" || value[0] === "none")) {
        return `${kebabDirective}=${value[0]}`;
      }
      const allowlist = value.map((item) => ["self", "src"].includes(item) ? item : `"${item}"`);
      return `${kebabDirective}=(${allowlist.join(" ")})`;
    }
    return "";
  }).filter(Boolean).join(", ");
}
function camelToKebab(str) {
  return str.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}
function getReportingEndpoints(reportingEndpoints = []) {
  return reportingEndpoints.map((endpoint) => `${endpoint.name}="${endpoint.url}"`).join(", ");
}
function getReportToOptions(reportTo = []) {
  return reportTo.map((option) => JSON.stringify(option)).join(", ");
}
function setHeaders(ctx, headersToSet) {
  headersToSet.forEach(([header, value]) => {
    ctx.res.headers.set(header, value);
  });
}

// src/lib/auth.ts
init_schema();
import { createHash, randomBytes } from "crypto";

// node_modules/nanoid/index.js
import { webcrypto as crypto2 } from "crypto";

// node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// node_modules/nanoid/index.js
var POOL_SIZE_MULTIPLIER = 128;
var pool;
var poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    crypto2.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto2.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool(size |= 0);
  let id = "";
  for (let i = poolOffset - size;i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}

// src/lib/auth.ts
var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function generateToken() {
  return `glint_${randomBytes(32).toString("hex")}`;
}
function upsertUser(githubId, username, displayName, avatarUrl) {
  const db = getDb();
  const id = nanoid();
  const existing = db.query("SELECT * FROM users WHERE github_id = ?").get(githubId);
  if (existing) {
    db.query("UPDATE users SET username = ?, display_name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(username, displayName, avatarUrl, existing.id);
    return { ...existing, username, display_name: displayName, avatar_url: avatarUrl };
  }
  db.query("INSERT INTO users (id, github_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)").run(id, githubId, username, displayName, avatarUrl);
  return { id, github_id: githubId, username, display_name: displayName, avatar_url: avatarUrl };
}
function createApiToken(userId, name, scopes = "publish,read") {
  const db = getDb();
  const token = generateToken();
  const id = nanoid();
  const hash = hashToken(token);
  db.query("INSERT INTO api_tokens (id, user_id, name, token_hash, scopes) VALUES (?, ?, ?, ?, ?)").run(id, userId, name, hash, scopes);
  return { token, id };
}
function verifyToken(token) {
  const db = getDb();
  const hash = hashToken(token);
  const row = db.query(`
    SELECT u.*, t.scopes, t.id as token_id
    FROM api_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token_hash = ? AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))
  `).get(hash);
  if (row) {
    db.query("UPDATE api_tokens SET last_used_at = datetime('now') WHERE id = ?").run(row.token_id);
  }
  return row || null;
}
function listTokens(userId) {
  const db = getDb();
  return db.query("SELECT id, name, scopes, last_used_at, created_at FROM api_tokens WHERE user_id = ?").all(userId);
}
function revokeToken(tokenId, userId) {
  const db = getDb();
  const result = db.query("DELETE FROM api_tokens WHERE id = ? AND user_id = ?").run(tokenId, userId);
  return result.changes > 0;
}
async function startDeviceFlow() {
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: "read:user" })
  });
  return res.json();
}
async function pollDeviceFlow(deviceCode) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    })
  });
  return res.json();
}
async function getGitHubUser(accessToken) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json();
}

// src/middleware/auth.ts
async function requireAuth(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header. Use: Bearer glint_xxx" }, 401);
  }
  const token = authHeader.slice(7);
  const user = verifyToken(token);
  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  c.set("user", user);
  c.set("scopes", (user.scopes || "").split(","));
  await next();
}
async function optionalAuth(c, next) {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) {
      c.set("user", user);
      c.set("scopes", (user.scopes || "").split(","));
    }
  }
  await next();
}
function requireScope(scope) {
  return async (c, next) => {
    const scopes = c.get("scopes") || [];
    if (!scopes.includes(scope)) {
      return c.json({ error: `Missing required scope: ${scope}` }, 403);
    }
    await next();
  };
}

// src/middleware/session.ts
import { randomBytes as randomBytes2, createHmac } from "crypto";
var sessions = new Map;
var SESSION_COOKIE = "glint_session";
var SESSION_SECRET = process.env.SESSION_SECRET || process.env.GITHUB_CLIENT_SECRET || "dev-secret";
var SESSION_MAX_AGE = 30 * 24 * 60 * 60;
function sign(value) {
  const sig = createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
  return `${value}.${sig}`;
}
function unsign(signed) {
  const idx = signed.lastIndexOf(".");
  if (idx < 0)
    return null;
  const value = signed.slice(0, idx);
  if (sign(value) === signed)
    return value;
  return null;
}
function createSession(user) {
  const sessionId = randomBytes2(32).toString("hex");
  sessions.set(sessionId, { userId: user.id, user, createdAt: Date.now() });
  return sessionId;
}
function getSessionFromCookie(c) {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (!cookie)
    return null;
  const sessionId = unsign(cookie);
  if (!sessionId)
    return null;
  const session = sessions.get(sessionId);
  if (!session)
    return null;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}
function getCookie(c, name) {
  const header = c.req.header("Cookie") || "";
  const match2 = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match2 ? decodeURIComponent(match2[1]) : undefined;
}
function setSessionCookie(c, sessionId) {
  const signed = sign(sessionId);
  c.header("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(signed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${isSecure(c) ? "; Secure" : ""}`);
}
function clearSessionCookie(c) {
  c.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
function isSecure(c) {
  return c.req.header("x-forwarded-proto") === "https" || c.req.url.startsWith("https");
}
async function optionalSession(c, next) {
  const session = getSessionFromCookie(c);
  if (session) {
    c.set("sessionUser", session.user);
  }
  await next();
}
async function requireSession(c, next) {
  const session = getSessionFromCookie(c);
  if (!session) {
    return c.redirect("/api/auth/login");
  }
  c.set("sessionUser", session.user);
  await next();
}
var stateStore = new Map;
function createOAuthState() {
  const state = randomBytes2(16).toString("hex");
  stateStore.set(state, Date.now());
  for (const [k, v] of stateStore) {
    if (Date.now() - v > 600000)
      stateStore.delete(k);
  }
  return state;
}
function validateOAuthState(state) {
  const ts = stateStore.get(state);
  if (!ts)
    return false;
  stateStore.delete(state);
  return Date.now() - ts < 600000;
}

// src/routes/api-auth.ts
var auth = new Hono2;
auth.get("/login", async (c) => {
  const state = createOAuthState();
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: "https://glint.sethgholson.com/api/auth/callback",
    scope: "read:user",
    state
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});
auth.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  if (error) {
    return c.redirect("/?error=auth_denied");
  }
  if (!code || !state || !validateOAuthState(state)) {
    return c.redirect("/?error=invalid_state");
  }
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return c.redirect("/?error=token_exchange_failed");
    }
    const ghUser = await getGitHubUser(tokenData.access_token);
    const user = upsertUser(ghUser.id, ghUser.login, ghUser.name, ghUser.avatar_url);
    const sessionId = createSession(user);
    setSessionCookie(c, sessionId);
    return c.redirect("/dashboard");
  } catch (e) {
    console.error("OAuth callback error:", e);
    return c.redirect("/?error=auth_failed");
  }
});
auth.get("/logout", async (c) => {
  clearSessionCookie(c);
  return c.redirect("/");
});
auth.post("/device/code", async (c) => {
  try {
    const result = await startDeviceFlow();
    return c.json(result);
  } catch (e) {
    return c.json({ error: "Failed to start device flow", details: e.message }, 500);
  }
});
auth.post("/device/token", async (c) => {
  const { device_code } = await c.req.json();
  if (!device_code) {
    return c.json({ error: "device_code required" }, 400);
  }
  try {
    const result = await pollDeviceFlow(device_code);
    if (result.error) {
      return c.json(result, result.error === "authorization_pending" ? 200 : 400);
    }
    if (!result.access_token) {
      return c.json({ error: "No access token received" }, 500);
    }
    const ghUser = await getGitHubUser(result.access_token);
    const user = upsertUser(ghUser.id, ghUser.login, ghUser.name, ghUser.avatar_url);
    const { token } = createApiToken(user.id, "cli-auto", "publish,read");
    return c.json({
      token,
      user: {
        username: ghUser.login,
        display_name: ghUser.name,
        avatar_url: ghUser.avatar_url
      }
    });
  } catch (e) {
    return c.json({ error: "Failed to complete auth", details: e.message }, 500);
  }
});
auth.post("/tokens", requireAuth, async (c) => {
  const user = c.get("user");
  const { name, scopes } = await c.req.json();
  if (!name) {
    return c.json({ error: "Token name required" }, 400);
  }
  const result = createApiToken(user.id, name, scopes || "publish,read");
  return c.json({
    id: result.id,
    token: result.token,
    message: "Save this token \u2014 it won't be shown again."
  });
});
auth.get("/tokens", requireAuth, async (c) => {
  const user = c.get("user");
  const tokens = listTokens(user.id);
  return c.json({ tokens });
});
auth.delete("/tokens/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const tokenId = c.req.param("id");
  const revoked = revokeToken(tokenId, user.id);
  if (!revoked) {
    return c.json({ error: "Token not found" }, 404);
  }
  return c.json({ ok: true });
});
auth.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at
  });
});
var api_auth_default = auth;

// src/lib/styles.ts
init_schema();
import { createHash as createHash3 } from "crypto";
import { mkdirSync as mkdirSync2, writeFileSync } from "fs";
import { join as join3 } from "path";
var UPLOADS_DIR = process.env.GLINT_UPLOADS_DIR || join3(process.cwd(), "data", "uploads");
function publishStyle(userId, input) {
  const db = getDb();
  const id = nanoid();
  const existing = db.query("SELECT id FROM styles WHERE user_id = ? AND slug = ? AND version = ? AND yanked_at IS NULL").get(userId, input.slug, input.version);
  if (existing) {
    throw new Error(`Version ${input.version} already exists for ${input.slug}`);
  }
  const user = db.query("SELECT username FROM users WHERE id = ?").get(userId);
  if (!user)
    throw new Error("User not found");
  const stylePath = join3(UPLOADS_DIR, user.username, input.slug, input.version);
  mkdirSync2(stylePath, { recursive: true });
  const emotionRows = [];
  for (const [emotion, buffer] of input.emotions) {
    const filePath = join3(stylePath, `${emotion}.png`);
    writeFileSync(filePath, buffer);
    const hash = createHash3("sha256").update(buffer).digest("hex");
    emotionRows.push({ emotion, filePath, fileHash: hash, fileSize: buffer.length });
  }
  let previewPath = null;
  if (input.previewGif) {
    previewPath = join3(stylePath, "preview.gif");
    writeFileSync(previewPath, input.previewGif);
  }
  if (input.readme) {
    writeFileSync(join3(stylePath, "README.md"), input.readme);
  }
  const insertStyle = db.query(`
    INSERT INTO styles (id, user_id, name, slug, description, version, readme, preview_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEmotion = db.query(`
    INSERT INTO style_emotions (id, style_id, emotion, file_path, file_hash, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    insertStyle.run(id, userId, input.name, input.slug, input.description, input.version, input.readme || null, previewPath);
    for (const row of emotionRows) {
      insertEmotion.run(nanoid(), id, row.emotion, row.filePath, row.fileHash, row.fileSize);
    }
  });
  tx();
  return { id, path: stylePath };
}
function listStyles(opts = {}) {
  const db = getDb();
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 20, 100);
  const offset = (page - 1) * limit;
  let where = "WHERE s.yanked_at IS NULL";
  const params = [];
  if (opts.search) {
    where += " AND (s.name LIKE ? OR s.description LIKE ? OR s.slug LIKE ?)";
    const q = `%${opts.search}%`;
    params.push(q, q, q);
  }
  if (opts.author) {
    where += " AND u.username = ?";
    params.push(opts.author);
  }
  const rows = db.query(`
    SELECT s.*, u.username as author, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM style_emotions WHERE style_id = s.id) as emotion_count
    FROM styles s
    JOIN users u ON s.user_id = u.id
    ${where}
    AND s.version = (
      SELECT MAX(s2.version) FROM styles s2 
      WHERE s2.user_id = s.user_id AND s2.slug = s.slug AND s2.yanked_at IS NULL
    )
    ORDER BY s.download_count DESC, s.published_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  const total = db.query(`
    SELECT COUNT(DISTINCT s.user_id || '/' || s.slug) as count
    FROM styles s
    JOIN users u ON s.user_id = u.id
    ${where}
  `).get(...params);
  return { styles: rows, total: total?.count || 0, page, limit };
}
function getStyle(author, slug, version) {
  const db = getDb();
  let style;
  if (version) {
    style = db.query(`
      SELECT s.*, u.username as author, u.avatar_url as author_avatar
      FROM styles s JOIN users u ON s.user_id = u.id
      WHERE u.username = ? AND s.slug = ? AND s.version = ? AND s.yanked_at IS NULL
    `).get(author, slug, version);
  } else {
    style = db.query(`
      SELECT s.*, u.username as author, u.avatar_url as author_avatar
      FROM styles s JOIN users u ON s.user_id = u.id
      WHERE u.username = ? AND s.slug = ? AND s.yanked_at IS NULL
      ORDER BY s.published_at DESC LIMIT 1
    `).get(author, slug);
  }
  if (!style)
    return null;
  const emotions = db.query("SELECT emotion, file_hash, file_size FROM style_emotions WHERE style_id = ?").all(style.id);
  return { ...style, emotions };
}
function getStyleVersions(author, slug) {
  const db = getDb();
  return db.query(`
    SELECT s.version, s.published_at, s.yanked_at, s.download_count
    FROM styles s JOIN users u ON s.user_id = u.id
    WHERE u.username = ? AND s.slug = ?
    ORDER BY s.published_at DESC
  `).all(author, slug);
}
function incrementDownloads(styleId) {
  const db = getDb();
  db.query("UPDATE styles SET download_count = download_count + 1 WHERE id = ?").run(styleId);
}
function yankStyle(styleId, userId) {
  const db = getDb();
  const result = db.query("UPDATE styles SET yanked_at = datetime('now') WHERE id = ? AND user_id = ?").run(styleId, userId);
  return result.changes > 0;
}
function reportStyle(styleId, reporterId, reason, details) {
  const db = getDb();
  db.query("INSERT INTO style_reports (id, style_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)").run(nanoid(), styleId, reporterId, reason, details || null);
}

// src/lib/package-spec.ts
var REQUIRED_EMOTIONS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "worried",
  "sleepy",
  "excited",
  "confused",
  "focused"
];
var NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;
var SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
var MAX_FILE_SIZE = 500 * 1024;
var MAX_PACKAGE_SIZE = 10 * 1024 * 1024;
function validateManifest(manifest) {
  const errors = [];
  if (manifest.specVersion !== "1.0") {
    errors.push({ field: "specVersion", message: 'Must be "1.0"' });
  }
  if (!manifest.name || !NAME_REGEX.test(manifest.name)) {
    errors.push({ field: "name", message: "Must be 2-40 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphen" });
  }
  if (!manifest.version || !SEMVER_REGEX.test(manifest.version)) {
    errors.push({ field: "version", message: "Must be valid semver (e.g., 1.0.0)" });
  }
  if (!manifest.description || manifest.description.length > 200) {
    errors.push({ field: "description", message: "Required, max 200 chars" });
  }
  if (!Array.isArray(manifest.emotions)) {
    errors.push({ field: "emotions", message: "Must be an array" });
  } else {
    const missing = REQUIRED_EMOTIONS.filter((e) => !manifest.emotions.includes(e));
    if (missing.length > 0) {
      errors.push({ field: "emotions", message: `Missing required emotions: ${missing.join(", ")}` });
    }
  }
  if (!manifest.files || typeof manifest.files !== "object") {
    errors.push({ field: "files", message: "Must be an object mapping filenames to SHA-256 hashes" });
  }
  if (manifest.tags && (!Array.isArray(manifest.tags) || manifest.tags.length > 10)) {
    errors.push({ field: "tags", message: "Must be array of max 10 tags" });
  }
  if (manifest.license && typeof manifest.license !== "string") {
    errors.push({ field: "license", message: "Must be SPDX identifier string" });
  }
  return errors;
}

// src/routes/api-styles.ts
import { createHash as createHash4 } from "crypto";
import { readFileSync as readFileSync2, existsSync as existsSync2 } from "fs";
import { join as join4 } from "path";
var styles = new Hono2;
styles.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const search = c.req.query("search");
  const author = c.req.query("author");
  const result = listStyles({ page, limit, search, author });
  return c.json(result);
});
styles.get("/:author/:slug", async (c) => {
  const { author, slug } = c.req.param();
  const version = c.req.query("version");
  const style = getStyle(author, slug, version || undefined);
  if (!style) {
    return c.json({ error: "Style not found" }, 404);
  }
  return c.json(style);
});
styles.get("/:author/:slug/versions", async (c) => {
  const { author, slug } = c.req.param();
  const versions = getStyleVersions(author, slug);
  return c.json({ versions });
});
styles.get("/:author/:slug/download", async (c) => {
  const { author, slug } = c.req.param();
  const version = c.req.query("version");
  const style = getStyle(author, slug, version || undefined);
  if (!style) {
    return c.json({ error: "Style not found" }, 404);
  }
  incrementDownloads(style.id);
  const baseUrl = new URL(c.req.url).origin;
  const emotions = style.emotions.map((e) => ({
    emotion: e.emotion,
    url: `${baseUrl}/api/styles/${author}/${slug}/emotions/${e.emotion}?version=${style.version}`,
    hash: e.file_hash,
    size: e.file_size
  }));
  return c.json({
    name: style.name,
    slug: style.slug,
    version: style.version,
    author: style.author,
    description: style.description,
    emotions,
    install: `glint style install @${author}/${slug}`
  });
});
styles.get("/:author/:slug/emotions/:emotion", async (c) => {
  const { author, slug, emotion } = c.req.param();
  const version = c.req.query("version");
  const style = getStyle(author, slug, version || undefined);
  if (!style) {
    return c.json({ error: "Style not found" }, 404);
  }
  const emotionData = style.emotions.find((e) => e.emotion === emotion);
  if (!emotionData) {
    return c.json({ error: `Emotion "${emotion}" not found in this style` }, 404);
  }
  const uploadsDir = process.env.GLINT_UPLOADS_DIR || join4(process.cwd(), "data", "uploads");
  const filePath = join4(uploadsDir, author, slug, style.version, `${emotion}.png`);
  if (!existsSync2(filePath)) {
    return c.json({ error: "File not found on disk" }, 500);
  }
  const buffer = readFileSync2(filePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${emotion}.png"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${emotionData.file_hash}"`
    }
  });
});
styles.post("/", requireAuth, requireScope("publish"), async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const manifestRaw = formData.get("manifest");
  if (!manifestRaw || typeof manifestRaw !== "string") {
    return c.json({ error: "Missing manifest field (JSON string)" }, 400);
  }
  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch {
    return c.json({ error: "Invalid manifest JSON" }, 400);
  }
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    return c.json({ error: "Invalid manifest", details: errors }, 400);
  }
  const { getDb: getDb2 } = await Promise.resolve().then(() => (init_schema(), exports_schema));
  const db = getDb2();
  const recentCount = db.prepare("SELECT COUNT(*) as count FROM styles WHERE user_id = ? AND published_at > datetime('now', '-1 day')").get(user.id);
  if (recentCount.count >= 10) {
    return c.json({ error: "Rate limit: max 10 publishes per day" }, 429);
  }
  const emotions = new Map;
  for (const emotionName of manifest.emotions) {
    const file = formData.get(emotionName);
    if (!file || !(file instanceof File)) {
      return c.json({ error: `Missing file for emotion: ${emotionName}` }, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: `File too large for ${emotionName}: ${file.size} > ${MAX_FILE_SIZE}` }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash4("sha256").update(buffer).digest("hex");
    const expectedHash = manifest.files[`${emotionName}.png`];
    if (expectedHash && hash !== expectedHash) {
      return c.json({ error: `Hash mismatch for ${emotionName}: expected ${expectedHash}, got ${hash}` }, 400);
    }
    emotions.set(emotionName, buffer);
  }
  const previewFile = formData.get("preview");
  const previewGif = previewFile instanceof File ? Buffer.from(await previewFile.arrayBuffer()) : undefined;
  const readmeField = formData.get("readme");
  const readme = typeof readmeField === "string" ? readmeField : undefined;
  try {
    const result = publishStyle(user.id, {
      name: manifest.name,
      slug: manifest.name,
      version: manifest.version,
      description: manifest.description,
      readme,
      emotions,
      previewGif
    });
    return c.json({
      id: result.id,
      url: `/styles/${user.username}/${manifest.name}`,
      install: `glint style install @${user.username}/${manifest.name}`
    }, 201);
  } catch (e) {
    return c.json({ error: e.message }, 409);
  }
});
styles.delete("/:author/:slug", requireAuth, async (c) => {
  const user = c.get("user");
  const { author, slug } = c.req.param();
  const version = c.req.query("version");
  if (author !== user.username) {
    return c.json({ error: "You can only yank your own styles" }, 403);
  }
  const style = getStyle(author, slug, version || undefined);
  if (!style) {
    return c.json({ error: "Style not found" }, 404);
  }
  const yanked = yankStyle(style.id, user.id);
  return yanked ? c.json({ ok: true }) : c.json({ error: "Failed to yank" }, 500);
});
styles.post("/:author/:slug/report", optionalAuth, async (c) => {
  const { author, slug } = c.req.param();
  const { reason, details } = await c.req.json();
  if (!reason) {
    return c.json({ error: "Reason required" }, 400);
  }
  const style = getStyle(author, slug);
  if (!style) {
    return c.json({ error: "Style not found" }, 404);
  }
  const user = c.get("user");
  reportStyle(style.id, user?.id || null, reason, details);
  return c.json({ ok: true });
});
var api_styles_default = styles;

// src/views/templates.ts
function layout(title, body, meta, user) {
  const desc = meta?.description || "Emotion packs for your Tidbyt. Expressive eyes on a 64\xD732 pixel display.";
  const url = meta?.url || "https://glint.sethgholson.com";
  const ogImage = meta?.image || "https://glint.sethgholson.com/img/og-image.png";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}">

  <!-- OpenGraph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:url" content="${escHtml(url)}">
  <meta property="og:image" content="${escHtml(ogImage)}">
  <meta property="og:site_name" content="Glint Community">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="${escHtml(ogImage)}">

  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/img/icon-192.png">

  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">${logoSvg("nav-logo")} <strong>Glint</strong> <span class="nav-hide-mobile">Community</span></a>
      <div class="nav-links">
        <a href="/" class="nav-hide-mobile">Gallery</a>
        <a href="/contribute" class="nav-hide-mobile">Contribute</a>
        <a href="https://github.com/sethgho/glint" target="_blank">GitHub</a>
        ${user ? `
          <a href="/dashboard">Dashboard</a>
          <a href="/api/auth/logout" class="nav-user">
            ${user.avatar_url ? `<img src="${escHtml(user.avatar_url)}" class="nav-avatar" alt="${escHtml(user.username)}">` : ""}
            <span>${escHtml(user.username)}</span>
          </a>
        ` : `
          <a href="/api/auth/login" class="btn btn-sm">Sign in</a>
        `}
      </div>
    </div>
  </nav>
  <main>${body}</main>
  <footer class="footer">
    <div class="container">
      <p>Glint \u2014 expressive eyes for your Tidbyt display</p>
    </div>
  </footer>
</body>
</html>`;
}
function homePage(styles2, total, page, search) {
  const hasStyles = styles2.length > 0;
  return `
    <div class="hero">
      <div class="container">
        ${heroLogoSvg()}
        <p id="tilt-hint" style="display:none;font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">Tap the eyes to enable tilt tracking \uD83D\uDC46</p>
        <h1>Emotion packs for your Tidbyt.</h1>
        <p>Glint puts expressive eyes on your display. Pick a style, install it in one command.</p>
        <form class="search-form" action="/" method="get">
          <input type="text" name="search" placeholder="Search styles..." value="${escHtml(search)}" class="search-input">
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
    </div>
    <div class="container">
      ${!hasStyles ? `
        <div class="empty-state">
          <p class="empty-icon">\uD83C\uDFA8</p>
          <h2>No styles yet</h2>
          <p>Be the first to publish a style!</p>
          <a href="/contribute" class="btn btn-primary">Learn How</a>
        </div>
      ` : `
        <div class="stats">
          <span>${total} style${total !== 1 ? "s" : ""} available</span>
        </div>
        <div class="grid">
          ${styles2.map((s) => styleCard(s)).join("")}
        </div>
        ${total > 24 ? pagination(page, Math.ceil(total / 24), search) : ""}
      `}
    </div>`;
}
function styleCard(style) {
  const previewUrl = `/api/styles/${escHtml(style.author)}/${escHtml(style.slug)}/emotions/happy?version=${escHtml(style.version)}`;
  return `
    <a href="/styles/${escHtml(style.author)}/${escHtml(style.slug)}" class="card">
      <div class="card-preview">
        ${previewUrl ? `<img src="${previewUrl}" alt="${escHtml(style.name)} preview" loading="lazy">` : '<div class="card-placeholder">\uD83D\uDC40</div>'}
      </div>
      <div class="card-body">
        <h3 class="card-title">@${escHtml(style.author)}/${escHtml(style.slug)}</h3>
        <p class="card-desc">${escHtml(style.description || "")}</p>
        <div class="card-meta">
          <span>v${escHtml(style.version)}</span>
          <span>\u2B07 ${style.download_count || 0}</span>
        </div>
      </div>
    </a>`;
}
function stylePage(style, versions) {
  const emotions = style.emotions || [];
  return `
    <div class="container style-detail">
      <div class="breadcrumb">
        <a href="/">Gallery</a> / <strong>@${escHtml(style.author)}/${escHtml(style.slug)}</strong>
      </div>
      
      <div class="style-header">
        <div>
          <h1>@${escHtml(style.author)}/${escHtml(style.slug)}</h1>
          <p class="style-desc">${escHtml(style.description || "")}</p>
          <div class="style-meta">
            <span class="badge">v${escHtml(style.version)}</span>
            <span>\u2B07 ${style.download_count || 0} downloads</span>
            <span>Published ${escHtml(style.published_at?.split("T")[0] || "")}</span>
          </div>
        </div>
        ${style.author_avatar ? `<img src="${escHtml(style.author_avatar)}" class="author-avatar" alt="${escHtml(style.author)}">` : ""}
      </div>

      <div class="install-box">
        <h3>Install</h3>
        <code class="install-cmd">glint style install @${escHtml(style.author)}/${escHtml(style.slug)}</code>
        <button onclick="navigator.clipboard.writeText('glint style install @${escHtml(style.author)}/${escHtml(style.slug)}')" class="btn btn-sm">Copy</button>
      </div>

      <h2>Emotions</h2>
      <div class="emotion-grid">
        ${emotions.map((e) => `
          <div class="emotion-card">
            <img src="/api/styles/${escHtml(style.author)}/${escHtml(style.slug)}/emotions/${escHtml(e.emotion)}?version=${escHtml(style.version)}" alt="${escHtml(e.emotion)}" class="emotion-img">
            <code class="emotion-label">${escHtml(e.emotion)}</code>
          </div>
        `).join("")}
      </div>

      ${style.readme ? `<div class="readme"><h2>README</h2><pre>${escHtml(style.readme)}</pre></div>` : ""}

      ${versions.length > 1 ? `
        <h2>Versions</h2>
        <table class="versions-table">
          <thead><tr><th>Version</th><th>Published</th><th>Downloads</th><th>Status</th></tr></thead>
          <tbody>
            ${versions.map((v) => `
              <tr>
                <td>${escHtml(v.version)}</td>
                <td>${escHtml(v.published_at?.split("T")[0] || "")}</td>
                <td>${v.download_count}</td>
                <td>${v.yanked_at ? '<span class="badge badge-warn">Yanked</span>' : '<span class="badge badge-ok">Active</span>'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ""}

      <div class="report-link">
        <a href="#" onclick="alert('Report functionality coming soon')">\uD83D\uDEA9 Report this style</a>
      </div>
    </div>`;
}
function contributePage() {
  return `
    <div class="container contribute">
      <h1>Create & Share Glint Styles</h1>
      <p>Glint styles are sets of 64\xD732 pixel PNG images \u2014 one for each emotion. Here's how to create and publish your own.</p>

      <h2>1. Set Up</h2>
      <pre><code># Install glint CLI
bun install -g glint

# Authenticate with GitHub
glint auth login</code></pre>

      <h2>2. Create a Style</h2>
      <pre><code># Scaffold a new style package
glint style init my-cool-eyes

# This creates:
# ~/.config/glint/styles/my-cool-eyes/
#   glint-style.json    (manifest)
#   neutral.png         (placeholder)
#   happy.png
#   sad.png
#   angry.png
#   surprised.png
#   worried.png
#   sleepy.png
#   excited.png
#   confused.png
#   focused.png</code></pre>

      <h2>3. Design Your Emotions</h2>
      <p>Each emotion is a <strong>64\xD732 pixel PNG</strong>. Use any tool you like:</p>
      <ul>
        <li><strong>Pixel art editors:</strong> Aseprite, Piskel, Lospec</li>
        <li><strong>AI generation:</strong> <code>glint generate my-style --prompt "cyberpunk robot eyes"</code></li>
        <li><strong>Image editors:</strong> Photoshop, GIMP (resize to 64\xD732)</li>
      </ul>
      <p>Required emotions: neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused.</p>

      <h2>4. Validate</h2>
      <pre><code># Check your style meets the spec
glint style validate my-cool-eyes

# Preview locally on your Tidbyt
glint show happy --style my-cool-eyes</code></pre>

      <h2>5. Publish</h2>
      <pre><code># Upload to the community gallery
glint style publish my-cool-eyes</code></pre>
      <p>Your style will be available at <code>@your-username/my-cool-eyes</code> and installable by anyone.</p>

      <h2>Style Package Spec (glint-style.json)</h2>
      <pre><code>{
  "specVersion": "1.0",
  "name": "my-cool-eyes",
  "version": "1.0.0",
  "description": "Cyberpunk robot eyes with neon glow",
  "emotions": [
    "neutral", "happy", "sad", "angry", "surprised",
    "worried", "sleepy", "excited", "confused", "focused"
  ],
  "files": {
    "neutral.png": "sha256:abc123...",
    "happy.png": "sha256:def456...",
    ...
  },
  "tags": ["cyberpunk", "robot", "neon"],
  "license": "MIT"
}</code></pre>

      <h2>Rules</h2>
      <ul>
        <li>All 10 required emotions must be present</li>
        <li>Images must be exactly 64\xD732 pixels (PNG)</li>
        <li>Max 500KB per image, 10MB total package</li>
        <li>Published versions are immutable \u2014 bump version to update</li>
        <li>You can yank (soft-delete) a version, but not overwrite it</li>
        <li>Be kind. No offensive content.</li>
      </ul>

      <h2>Agent / Automation Auth</h2>
      <p>For CI/CD or AI agents, use API tokens instead of the browser flow:</p>
      <pre><code># Create a machine token
glint auth token create --name "my-ci"

# Use it in scripts
GLINT_TOKEN=glint_xxx glint style publish my-style</code></pre>
    </div>`;
}
function dashboardPage(user, styles2) {
  return `
    <div class="container" style="padding-top:2rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        ${user.avatar_url ? `<img src="${escHtml(user.avatar_url)}" style="width:64px;height:64px;border-radius:50%;" alt="">` : ""}
        <div>
          <h1 style="margin:0;">Dashboard</h1>
          <p style="margin:0;color:var(--text-muted);">@${escHtml(user.username)}</p>
        </div>
      </div>

      <div style="display:flex;gap:1rem;margin-bottom:2rem;">
        <a href="/dashboard" class="btn btn-primary">My Styles</a>
        <a href="/dashboard/tokens" class="btn">API Tokens</a>
      </div>

      <h2>Your Published Styles</h2>
      ${styles2.length === 0 ? `
        <div class="empty-state">
          <p class="empty-icon">\uD83D\uDCE6</p>
          <h3>No styles published yet</h3>
          <p>Use the CLI to publish your first style!</p>
          <a href="/contribute" class="btn btn-primary">Learn How</a>
        </div>
      ` : `
        <div class="grid">
          ${styles2.map((s) => styleCard(s)).join("")}
        </div>
      `}
    </div>`;
}
function tokensPage(user, tokens, newToken) {
  return `
    <div class="container" style="padding-top:2rem;">
      <h1>API Tokens</h1>
      <p style="color:var(--text-muted);">Use API tokens to authenticate the Glint CLI or automation scripts.</p>

      <div style="display:flex;gap:1rem;margin-bottom:2rem;">
        <a href="/dashboard" class="btn">My Styles</a>
        <a href="/dashboard/tokens" class="btn btn-primary">API Tokens</a>
      </div>

      ${newToken ? `
        <div style="background:var(--surface);border:1px solid var(--accent);border-radius:8px;padding:1rem;margin-bottom:1.5rem;">
          <strong>\uD83D\uDD11 New token created!</strong> Copy it now \u2014 it won't be shown again.
          <div style="margin-top:0.5rem;">
            <code style="word-break:break-all;font-size:0.85rem;">${escHtml(newToken)}</code>
            <button onclick="navigator.clipboard.writeText('${escHtml(newToken)}')" class="btn btn-sm" style="margin-left:0.5rem;">Copy</button>
          </div>
        </div>
      ` : ""}

      <h2>Create Token</h2>
      <form method="POST" action="/dashboard/tokens" style="display:flex;gap:0.5rem;margin-bottom:2rem;">
        <input type="text" name="name" placeholder="Token name (e.g. my-laptop)" class="search-input" style="max-width:300px;" required>
        <button type="submit" class="btn btn-primary">Create</button>
      </form>

      <h2>Active Tokens</h2>
      ${tokens.length === 0 ? `
        <p style="color:var(--text-muted);">No tokens yet.</p>
      ` : `
        <table class="versions-table">
          <thead><tr><th>Name</th><th>Created</th><th>Last Used</th><th></th></tr></thead>
          <tbody>
            ${tokens.map((t) => `
              <tr>
                <td>${escHtml(t.name)}</td>
                <td>${escHtml(t.created_at?.split("T")[0] || "")}</td>
                <td>${t.last_used_at ? escHtml(t.last_used_at.split("T")[0]) : "Never"}</td>
                <td>
                  <form method="POST" action="/dashboard/tokens/${escHtml(t.id)}/revoke" style="display:inline;" onsubmit="return confirm('Revoke this token?')">
                    <button type="submit" class="btn btn-sm" style="color:var(--danger,#ef4444);">Revoke</button>
                  </form>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </div>`;
}
function pagination(page, totalPages, search) {
  const params = search ? `&search=${encodeURIComponent(search)}` : "";
  let html = '<div class="pagination">';
  if (page > 1)
    html += `<a href="/?page=${page - 1}${params}" class="btn">\u2190 Previous</a>`;
  html += `<span>Page ${page} of ${totalPages}</span>`;
  if (page < totalPages)
    html += `<a href="/?page=${page + 1}${params}" class="btn">Next \u2192</a>`;
  html += "</div>";
  return html;
}
function heroLogoSvg() {
  return `<svg id="hero-logo" class="hero-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 534 275">
  <defs>
    <linearGradient id="sparkle-grad-hero" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <!-- Clip pupils to eye outlines -->
    <clipPath id="left-eye-clip">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z" transform="translate(0,275) scale(0.1,-0.1)"/>
    </clipPath>
    <clipPath id="right-eye-clip">
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z" transform="translate(0,275) scale(0.1,-0.1)"/>
    </clipPath>
  </defs>
  <g transform="translate(0,275) scale(0.1,-0.1)">
    <!-- Eye outlines only (no pupil holes) -->
    <g class="glint-eyes" fill="currentColor">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z"/>
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z"/>
    </g>
    <!-- Sparkle -->
    <path class="glint-sparkle" fill="url(#sparkle-grad-hero)" d="M2651 2698 c-6 -29 -22 -116 -36 -193 -29 -166 -46 -219 -69 -223 -10 -2 -40 6 -68 18 -27 12 -53 19 -56 15 -3 -3 4 -26 16 -50 43 -88 33 -96 -164 -145 -141 -35 -154 -39 -154 -50 0 -6 10 -12 23 -14 217 -46 317 -80 317 -109 0 -8 -11 -40 -25 -71 -14 -31 -25 -59 -25 -61 0 -2 21 5 47 16 26 11 58 19 72 17 35 -4 51 -54 92 -298 43 -256 51 -266 83 -93 40 220 67 347 81 373 16 31 26 31 109 -4 21 -9 40 -16 41 -16 2 0 -10 30 -26 68 l-29 67 21 18 c23 19 178 69 272 87 36 7 57 16 54 23 -2 7 -58 26 -125 43 -145 37 -212 61 -218 79 -3 7 2 27 10 44 9 17 21 42 26 56 l9 25 -52 -20 c-29 -11 -60 -20 -70 -20 -27 0 -44 51 -83 253 -19 100 -37 190 -40 200 -10 31 -22 18 -33 -35z"/>
  </g>
  <!-- Animated pupils clipped to eye shapes -->
  <g clip-path="url(#left-eye-clip)">
    <g id="pupil-left">
      <circle cx="168" cy="142" r="42" fill="var(--bg, #0a0a0b)"/>
    </g>
  </g>
  <g clip-path="url(#right-eye-clip)">
    <g id="pupil-right">
      <circle cx="386" cy="142" r="42" fill="var(--bg, #0a0a0b)"/>
    </g>
  </g>
</svg>
<script>
(function() {
  var svg = document.getElementById('hero-logo');
  var pL = document.getElementById('pupil-left');
  var pR = document.getElementById('pupil-right');
  if (!svg || !pL || !pR) return;

  var maxDrift = 10;
  var cur = { x: 0, y: 0 };
  var tgt = { x: 0, y: 0 };
  var raf = 0;

  function animate() {
    cur.x += (tgt.x - cur.x) * 0.07;
    cur.y += (tgt.y - cur.y) * 0.07;
    var tx = 'translate(' + cur.x + 'px,' + cur.y + 'px)';
    pL.style.transform = tx;
    pR.style.transform = tx;
    if (Math.abs(cur.x - tgt.x) > 0.05 || Math.abs(cur.y - tgt.y) > 0.05) {
      raf = requestAnimationFrame(animate);
    } else { raf = 0; }
  }

  function kick() { if (!raf) raf = requestAnimationFrame(animate); }

  document.addEventListener('mousemove', function(e) {
    var r = svg.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2);
    var dy = e.clientY - (r.top + r.height / 2);
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var s = Math.min(d / 300, 1);
    tgt.x = (dx / d) * maxDrift * s;
    // Asymmetric Y: 4x more movement downward than upward
    var yDrift = dy > 0 ? maxDrift * 4 : maxDrift;
    tgt.y = (dy / d) * yDrift * s;
    kick();
  });

  document.addEventListener('mouseleave', function() {
    tgt.x = 0; tgt.y = 0; kick();
  });

  // Mobile: use device orientation (accelerometer/gyro) for tilt tracking
  function handleOrientation(e) {
    if (e.gamma === null || e.beta === null) return;
    var nx = Math.max(-1, Math.min(1, e.gamma / 30));
    var ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    tgt.x = nx * maxDrift;
    var yDrift = ny > 0 ? maxDrift * 4 : maxDrift;
    tgt.y = ny * yDrift;
    kick();
    // Hide the hint once it's working
    var hint = document.getElementById('tilt-hint');
    if (hint) hint.style.display = 'none';
  }

  function startListening() {
    window.addEventListener('deviceorientation', handleOrientation);
  }

  // Detect touch device
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice && typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ \u2014 needs click handler (not touchstart) on HTTPS
      var hint = document.getElementById('tilt-hint');
      if (hint) hint.style.display = 'block';
      svg.addEventListener('click', function iosTap() {
        DeviceOrientationEvent.requestPermission().then(function(state) {
          if (state === 'granted') startListening();
          if (hint) hint.style.display = 'none';
        }).catch(function(err) {
          console.log('Orientation permission error:', err);
          if (hint) hint.style.display = 'none';
        });
        svg.removeEventListener('click', iosTap);
      });
    } else {
      // Android \u2014 just listen
      startListening();
    }
  }
})();
</script>`;
}
function logoSvg(cssClass) {
  return `<svg class="${cssClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 534 275">
  <defs>
    <linearGradient id="sparkle-grad-${cssClass}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <g transform="translate(0,275) scale(0.1,-0.1)">
    <g class="glint-eyes" fill="currentColor">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z m942 -801 c106 -31 183 -134 183 -242 -1 -226 -274 -348 -434 -195 -110 106 -105 280 12 382 44 39 111 68 163 69 14 1 48 -6 76 -14z"/>
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z m98 -817 c62 -29 118 -94 136 -157 48 -164 -59 -319 -231 -333 -191 -15 -332 190 -250 363 62 132 216 188 345 127z"/>
    </g>
    <path class="glint-sparkle" fill="url(#sparkle-grad-${cssClass})" d="M2651 2698 c-6 -29 -22 -116 -36 -193 -29 -166 -46 -219 -69 -223 -10 -2 -40 6 -68 18 -27 12 -53 19 -56 15 -3 -3 4 -26 16 -50 43 -88 33 -96 -164 -145 -141 -35 -154 -39 -154 -50 0 -6 10 -12 23 -14 217 -46 317 -80 317 -109 0 -8 -11 -40 -25 -71 -14 -31 -25 -59 -25 -61 0 -2 21 5 47 16 26 11 58 19 72 17 35 -4 51 -54 92 -298 43 -256 51 -266 83 -93 40 220 67 347 81 373 16 31 26 31 109 -4 21 -9 40 -16 41 -16 2 0 -10 30 -26 68 l-29 67 21 18 c23 19 178 69 272 87 36 7 57 16 54 23 -2 7 -58 26 -125 43 -145 37 -212 61 -218 79 -3 7 2 27 10 44 9 17 21 42 26 56 l9 25 -52 -20 c-29 -11 -60 -20 -70 -20 -27 0 -44 51 -83 253 -19 100 -37 190 -40 200 -10 31 -22 18 -33 -35z"/>
  </g>
</svg>`;
}
function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// src/routes/web.ts
var web = new Hono2;
web.use("*", optionalSession);
web.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const search = c.req.query("search") || "";
  const result = listStyles({ page, limit: 24, search: search || undefined });
  const user = c.get("sessionUser");
  const html = layout("Glint Community \u2014 Style Gallery", homePage(result.styles, result.total, page, search), undefined, user);
  return c.html(html);
});
web.get("/styles/:author/:slug", async (c) => {
  const { author, slug } = c.req.param();
  const style = getStyle(author, slug);
  const user = c.get("sessionUser");
  if (!style) {
    return c.html(layout("Not Found", '<div class="container"><h1>Style not found</h1></div>', undefined, user), 404);
  }
  const versions = getStyleVersions(author, slug);
  const html = layout(`@${author}/${slug} \u2014 Glint Community`, stylePage(style, versions), {
    description: style.description || `${style.name} emotion style for Glint Tidbyt display`,
    url: `https://glint.sethgholson.com/styles/${author}/${slug}`,
    image: `https://glint.sethgholson.com/api/styles/${author}/${slug}/emotions/happy?version=${style.version}`
  }, user);
  return c.html(html);
});
web.get("/contribute", async (c) => {
  const user = c.get("sessionUser");
  return c.html(layout("Contribute \u2014 Glint Community", contributePage(), undefined, user));
});
web.get("/dashboard", requireSession, async (c) => {
  const user = c.get("sessionUser");
  const userStyles = listStyles({ author: user.username });
  return c.html(layout("Dashboard \u2014 Glint Community", dashboardPage(user, userStyles.styles), undefined, user));
});
web.get("/dashboard/tokens", requireSession, async (c) => {
  const user = c.get("sessionUser");
  const tokens = listTokens(user.id);
  const newToken = c.req.query("newToken");
  return c.html(layout("API Tokens \u2014 Glint Community", tokensPage(user, tokens, newToken || undefined), undefined, user));
});
web.post("/dashboard/tokens", requireSession, async (c) => {
  const user = c.get("sessionUser");
  const body = await c.req.parseBody();
  const name = (body.name || "").trim();
  if (!name) {
    return c.redirect("/dashboard/tokens?error=name_required");
  }
  const { token } = createApiToken(user.id, name, "publish,read");
  return c.redirect(`/dashboard/tokens?newToken=${encodeURIComponent(token)}`);
});
web.post("/dashboard/tokens/:id/revoke", requireSession, async (c) => {
  const user = c.get("sessionUser");
  const tokenId = c.req.param("id");
  revokeToken(tokenId, user.id);
  return c.redirect("/dashboard/tokens");
});
var web_default = web;

// src/middleware/rate-limit.ts
var stores = new Map;
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now)
        store.delete(key);
    }
  }
}, 5 * 60 * 1000);
function rateLimit(opts) {
  const storeId = `${opts.windowMs}-${opts.max}-${Math.random()}`;
  const store = new Map;
  stores.set(storeId, store);
  const keyFn = opts.keyFn || ((c) => c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("cf-connecting-ip") || "unknown");
  return async (c, next) => {
    const key = keyFn(c);
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }
    entry.count++;
    c.header("X-RateLimit-Limit", String(opts.max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.max - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > opts.max) {
      return c.json({ error: opts.message || "Too many requests", retry_after: Math.ceil((entry.resetAt - now) / 1000) }, 429);
    }
    await next();
  };
}

// src/index.ts
var app = new Hono2;
app.use("*", logger());
app.use("*", secureHeaders());
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Authorization", "Content-Type"]
}));
var staticCache = async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=86400");
};
var immutableCache = async (c, next) => {
  await next();
  c.header("Cache-Control", "public, max-age=31536000, immutable");
};
app.use("/css/*", staticCache, serveStatic2({ root: "./public" }));
app.use("/js/*", staticCache, serveStatic2({ root: "./public" }));
app.use("/img/*", immutableCache, serveStatic2({ root: "./public" }));
app.use("/favicon.ico", immutableCache, serveStatic2({ path: "./public/favicon.ico" }));
app.use("/site.webmanifest", staticCache, serveStatic2({ path: "./public/site.webmanifest" }));
app.use("/api/auth/*", rateLimit({ windowMs: 60000, max: 20, message: "Too many auth requests" }));
app.use("/api/styles/*/publish", rateLimit({ windowMs: 60000, max: 5, message: "Too many publish requests" }));
app.use("/api/*", rateLimit({ windowMs: 60000, max: 120 }));
app.route("/api/auth", api_auth_default);
app.route("/api/styles", api_styles_default);
app.route("/", web_default);
app.get("/api/health", (c) => c.json({ status: "ok", version: "0.1.0" }));
var port = parseInt(process.env.PORT || "3000");
var hostname = process.env.HOST || "0.0.0.0";
Bun.serve({
  port,
  hostname,
  fetch: app.fetch
});
console.log(`\uD83D\uDD2E Glint Community running on http://${hostname}:${port}`);
