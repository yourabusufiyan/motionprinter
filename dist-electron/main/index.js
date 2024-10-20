"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _tempFilename, _filename, _adapter, _parse, _stringify, _data;
const electron = require("electron");
const os = require("node:os");
const path = require("node:path");
const os$1 = require("os");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const require$$0$1 = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const http = require("http");
const crypto = require("crypto");
const pdfToPrinter = require("pdf-to-printer");
const node_fs = require("node:fs");
require("node:fs/promises");
require("node:url");
const lodash = require("lodash");
const ip = require("ip");
const axios = require("axios");
const fileUpload = require("express-fileupload");
const uuid = require("uuid");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var httpErrors = { exports: {} };
/*!
 * depd
 * Copyright(c) 2014-2018 Douglas Christopher Wilson
 * MIT Licensed
 */
var relative = require$$0$1.relative;
var depd_1 = depd;
var basePath = process.cwd();
function containsNamespace(str, namespace) {
  var vals = str.split(/[ ,]+/);
  var ns = String(namespace).toLowerCase();
  for (var i = 0; i < vals.length; i++) {
    var val = vals[i];
    if (val && (val === "*" || val.toLowerCase() === ns)) {
      return true;
    }
  }
  return false;
}
function convertDataDescriptorToAccessor(obj, prop, message) {
  var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
  var value = descriptor.value;
  descriptor.get = function getter() {
    return value;
  };
  if (descriptor.writable) {
    descriptor.set = function setter(val) {
      return value = val;
    };
  }
  delete descriptor.value;
  delete descriptor.writable;
  Object.defineProperty(obj, prop, descriptor);
  return descriptor;
}
function createArgumentsString(arity) {
  var str = "";
  for (var i = 0; i < arity; i++) {
    str += ", arg" + i;
  }
  return str.substr(2);
}
function createStackString(stack) {
  var str = this.name + ": " + this.namespace;
  if (this.message) {
    str += " deprecated " + this.message;
  }
  for (var i = 0; i < stack.length; i++) {
    str += "\n    at " + stack[i].toString();
  }
  return str;
}
function depd(namespace) {
  if (!namespace) {
    throw new TypeError("argument namespace is required");
  }
  var stack = getStack();
  var site = callSiteLocation(stack[1]);
  var file = site[0];
  function deprecate(message) {
    log.call(deprecate, message);
  }
  deprecate._file = file;
  deprecate._ignored = isignored(namespace);
  deprecate._namespace = namespace;
  deprecate._traced = istraced(namespace);
  deprecate._warned = /* @__PURE__ */ Object.create(null);
  deprecate.function = wrapfunction;
  deprecate.property = wrapproperty;
  return deprecate;
}
function eehaslisteners(emitter, type) {
  var count = typeof emitter.listenerCount !== "function" ? emitter.listeners(type).length : emitter.listenerCount(type);
  return count > 0;
}
function isignored(namespace) {
  if (process.noDeprecation) {
    return true;
  }
  var str = process.env.NO_DEPRECATION || "";
  return containsNamespace(str, namespace);
}
function istraced(namespace) {
  if (process.traceDeprecation) {
    return true;
  }
  var str = process.env.TRACE_DEPRECATION || "";
  return containsNamespace(str, namespace);
}
function log(message, site) {
  var haslisteners = eehaslisteners(process, "deprecation");
  if (!haslisteners && this._ignored) {
    return;
  }
  var caller;
  var callFile;
  var callSite;
  var depSite;
  var i = 0;
  var seen = false;
  var stack = getStack();
  var file = this._file;
  if (site) {
    depSite = site;
    callSite = callSiteLocation(stack[1]);
    callSite.name = depSite.name;
    file = callSite[0];
  } else {
    i = 2;
    depSite = callSiteLocation(stack[i]);
    callSite = depSite;
  }
  for (; i < stack.length; i++) {
    caller = callSiteLocation(stack[i]);
    callFile = caller[0];
    if (callFile === file) {
      seen = true;
    } else if (callFile === this._file) {
      file = this._file;
    } else if (seen) {
      break;
    }
  }
  var key = caller ? depSite.join(":") + "__" + caller.join(":") : void 0;
  if (key !== void 0 && key in this._warned) {
    return;
  }
  this._warned[key] = true;
  var msg = message;
  if (!msg) {
    msg = callSite === depSite || !callSite.name ? defaultMessage(depSite) : defaultMessage(callSite);
  }
  if (haslisteners) {
    var err = DeprecationError(this._namespace, msg, stack.slice(i));
    process.emit("deprecation", err);
    return;
  }
  var format = process.stderr.isTTY ? formatColor : formatPlain;
  var output = format.call(this, msg, caller, stack.slice(i));
  process.stderr.write(output + "\n", "utf8");
}
function callSiteLocation(callSite) {
  var file = callSite.getFileName() || "<anonymous>";
  var line = callSite.getLineNumber();
  var colm = callSite.getColumnNumber();
  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ", " + file;
  }
  var site = [file, line, colm];
  site.callSite = callSite;
  site.name = callSite.getFunctionName();
  return site;
}
function defaultMessage(site) {
  var callSite = site.callSite;
  var funcName = site.name;
  if (!funcName) {
    funcName = "<anonymous@" + formatLocation(site) + ">";
  }
  var context = callSite.getThis();
  var typeName = context && callSite.getTypeName();
  if (typeName === "Object") {
    typeName = void 0;
  }
  if (typeName === "Function") {
    typeName = context.name || typeName;
  }
  return typeName && callSite.getMethodName() ? typeName + "." + funcName : funcName;
}
function formatPlain(msg, caller, stack) {
  var timestamp = (/* @__PURE__ */ new Date()).toUTCString();
  var formatted = timestamp + " " + this._namespace + " deprecated " + msg;
  if (this._traced) {
    for (var i = 0; i < stack.length; i++) {
      formatted += "\n    at " + stack[i].toString();
    }
    return formatted;
  }
  if (caller) {
    formatted += " at " + formatLocation(caller);
  }
  return formatted;
}
function formatColor(msg, caller, stack) {
  var formatted = "\x1B[36;1m" + this._namespace + "\x1B[22;39m \x1B[33;1mdeprecated\x1B[22;39m \x1B[0m" + msg + "\x1B[39m";
  if (this._traced) {
    for (var i = 0; i < stack.length; i++) {
      formatted += "\n    \x1B[36mat " + stack[i].toString() + "\x1B[39m";
    }
    return formatted;
  }
  if (caller) {
    formatted += " \x1B[36m" + formatLocation(caller) + "\x1B[39m";
  }
  return formatted;
}
function formatLocation(callSite) {
  return relative(basePath, callSite[0]) + ":" + callSite[1] + ":" + callSite[2];
}
function getStack() {
  var limit = Error.stackTraceLimit;
  var obj = {};
  var prep = Error.prepareStackTrace;
  Error.prepareStackTrace = prepareObjectStackTrace;
  Error.stackTraceLimit = Math.max(10, limit);
  Error.captureStackTrace(obj);
  var stack = obj.stack.slice(1);
  Error.prepareStackTrace = prep;
  Error.stackTraceLimit = limit;
  return stack;
}
function prepareObjectStackTrace(obj, stack) {
  return stack;
}
function wrapfunction(fn, message) {
  if (typeof fn !== "function") {
    throw new TypeError("argument fn must be a function");
  }
  var args = createArgumentsString(fn.length);
  var stack = getStack();
  var site = callSiteLocation(stack[1]);
  site.name = fn.name;
  var deprecatedfn = new Function(
    "fn",
    "log",
    "deprecate",
    "message",
    "site",
    '"use strict"\nreturn function (' + args + ") {log.call(deprecate, message, site)\nreturn fn.apply(this, arguments)\n}"
  )(fn, log, this, message, site);
  return deprecatedfn;
}
function wrapproperty(obj, prop, message) {
  if (!obj || typeof obj !== "object" && typeof obj !== "function") {
    throw new TypeError("argument obj must be object");
  }
  var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
  if (!descriptor) {
    throw new TypeError("must call property on owner object");
  }
  if (!descriptor.configurable) {
    throw new TypeError("property must be configurable");
  }
  var deprecate = this;
  var stack = getStack();
  var site = callSiteLocation(stack[1]);
  site.name = prop;
  if ("value" in descriptor) {
    descriptor = convertDataDescriptorToAccessor(obj, prop);
  }
  var get = descriptor.get;
  var set = descriptor.set;
  if (typeof get === "function") {
    descriptor.get = function getter() {
      log.call(deprecate, message, site);
      return get.apply(this, arguments);
    };
  }
  if (typeof set === "function") {
    descriptor.set = function setter() {
      log.call(deprecate, message, site);
      return set.apply(this, arguments);
    };
  }
  Object.defineProperty(obj, prop, descriptor);
}
function DeprecationError(namespace, message, stack) {
  var error = new Error();
  var stackString;
  Object.defineProperty(error, "constructor", {
    value: DeprecationError
  });
  Object.defineProperty(error, "message", {
    configurable: true,
    enumerable: false,
    value: message,
    writable: true
  });
  Object.defineProperty(error, "name", {
    enumerable: false,
    configurable: true,
    value: "DeprecationError",
    writable: true
  });
  Object.defineProperty(error, "namespace", {
    configurable: true,
    enumerable: false,
    value: namespace,
    writable: true
  });
  Object.defineProperty(error, "stack", {
    configurable: true,
    enumerable: false,
    get: function() {
      if (stackString !== void 0) {
        return stackString;
      }
      return stackString = createStackString.call(this, stack);
    },
    set: function setter(val) {
      stackString = val;
    }
  });
  return error;
}
var setprototypeof = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? setProtoOf : mixinProperties);
function setProtoOf(obj, proto) {
  obj.__proto__ = proto;
  return obj;
}
function mixinProperties(obj, proto) {
  for (var prop in proto) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
      obj[prop] = proto[prop];
    }
  }
  return obj;
}
const require$$0 = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
};
/*!
 * statuses
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
var codes = require$$0;
var statuses = status;
status.message = codes;
status.code = createMessageToStatusCodeMap(codes);
status.codes = createStatusCodeList(codes);
status.redirect = {
  300: true,
  301: true,
  302: true,
  303: true,
  305: true,
  307: true,
  308: true
};
status.empty = {
  204: true,
  205: true,
  304: true
};
status.retry = {
  502: true,
  503: true,
  504: true
};
function createMessageToStatusCodeMap(codes2) {
  var map = {};
  Object.keys(codes2).forEach(function forEachCode(code) {
    var message = codes2[code];
    var status2 = Number(code);
    map[message.toLowerCase()] = status2;
  });
  return map;
}
function createStatusCodeList(codes2) {
  return Object.keys(codes2).map(function mapCode(code) {
    return Number(code);
  });
}
function getStatusCode(message) {
  var msg = message.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(status.code, msg)) {
    throw new Error('invalid status message: "' + message + '"');
  }
  return status.code[msg];
}
function getStatusMessage(code) {
  if (!Object.prototype.hasOwnProperty.call(status.message, code)) {
    throw new Error("invalid status code: " + code);
  }
  return status.message[code];
}
function status(code) {
  if (typeof code === "number") {
    return getStatusMessage(code);
  }
  if (typeof code !== "string") {
    throw new TypeError("code must be a number or string");
  }
  var n = parseInt(code, 10);
  if (!isNaN(n)) {
    return getStatusMessage(n);
  }
  return getStatusCode(code);
}
var inherits = { exports: {} };
var inherits_browser = { exports: {} };
var hasRequiredInherits_browser;
function requireInherits_browser() {
  if (hasRequiredInherits_browser) return inherits_browser.exports;
  hasRequiredInherits_browser = 1;
  if (typeof Object.create === "function") {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  } else {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
    };
  }
  return inherits_browser.exports;
}
try {
  var util = require("util");
  if (typeof util.inherits !== "function") throw "";
  inherits.exports = util.inherits;
} catch (e) {
  inherits.exports = requireInherits_browser();
}
var inheritsExports = inherits.exports;
/*!
 * toidentifier
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
var toidentifier = toIdentifier;
function toIdentifier(str) {
  return str.split(" ").map(function(token) {
    return token.slice(0, 1).toUpperCase() + token.slice(1);
  }).join("").replace(/[^ _0-9a-z]/gi, "");
}
/*!
 * http-errors
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
(function(module2) {
  var deprecate = depd_1("http-errors");
  var setPrototypeOf = setprototypeof;
  var statuses$1 = statuses;
  var inherits2 = inheritsExports;
  var toIdentifier2 = toidentifier;
  module2.exports = createError2;
  module2.exports.HttpError = createHttpErrorConstructor();
  module2.exports.isHttpError = createIsHttpErrorFunction(module2.exports.HttpError);
  populateConstructorExports(module2.exports, statuses$1.codes, module2.exports.HttpError);
  function codeClass(status2) {
    return Number(String(status2).charAt(0) + "00");
  }
  function createError2() {
    var err;
    var msg;
    var status2 = 500;
    var props = {};
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      var type = typeof arg;
      if (type === "object" && arg instanceof Error) {
        err = arg;
        status2 = err.status || err.statusCode || status2;
      } else if (type === "number" && i === 0) {
        status2 = arg;
      } else if (type === "string") {
        msg = arg;
      } else if (type === "object") {
        props = arg;
      } else {
        throw new TypeError("argument #" + (i + 1) + " unsupported type " + type);
      }
    }
    if (typeof status2 === "number" && (status2 < 400 || status2 >= 600)) {
      deprecate("non-error status code; use only 4xx or 5xx status codes");
    }
    if (typeof status2 !== "number" || !statuses$1.message[status2] && (status2 < 400 || status2 >= 600)) {
      status2 = 500;
    }
    var HttpError = createError2[status2] || createError2[codeClass(status2)];
    if (!err) {
      err = HttpError ? new HttpError(msg) : new Error(msg || statuses$1.message[status2]);
      Error.captureStackTrace(err, createError2);
    }
    if (!HttpError || !(err instanceof HttpError) || err.status !== status2) {
      err.expose = status2 < 500;
      err.status = err.statusCode = status2;
    }
    for (var key in props) {
      if (key !== "status" && key !== "statusCode") {
        err[key] = props[key];
      }
    }
    return err;
  }
  function createHttpErrorConstructor() {
    function HttpError() {
      throw new TypeError("cannot construct abstract class");
    }
    inherits2(HttpError, Error);
    return HttpError;
  }
  function createClientErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ClientError(message) {
      var msg = message != null ? message : statuses$1.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ClientError);
      setPrototypeOf(err, ClientError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits2(ClientError, HttpError);
    nameFunc(ClientError, className);
    ClientError.prototype.status = code;
    ClientError.prototype.statusCode = code;
    ClientError.prototype.expose = true;
    return ClientError;
  }
  function createIsHttpErrorFunction(HttpError) {
    return function isHttpError(val) {
      if (!val || typeof val !== "object") {
        return false;
      }
      if (val instanceof HttpError) {
        return true;
      }
      return val instanceof Error && typeof val.expose === "boolean" && typeof val.statusCode === "number" && val.status === val.statusCode;
    };
  }
  function createServerErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ServerError(message) {
      var msg = message != null ? message : statuses$1.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ServerError);
      setPrototypeOf(err, ServerError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits2(ServerError, HttpError);
    nameFunc(ServerError, className);
    ServerError.prototype.status = code;
    ServerError.prototype.statusCode = code;
    ServerError.prototype.expose = false;
    return ServerError;
  }
  function nameFunc(func, name) {
    var desc = Object.getOwnPropertyDescriptor(func, "name");
    if (desc && desc.configurable) {
      desc.value = name;
      Object.defineProperty(func, "name", desc);
    }
  }
  function populateConstructorExports(exports, codes2, HttpError) {
    codes2.forEach(function forEachCode(code) {
      var CodeError;
      var name = toIdentifier2(statuses$1.message[code]);
      switch (codeClass(code)) {
        case 400:
          CodeError = createClientErrorConstructor(HttpError, name, code);
          break;
        case 500:
          CodeError = createServerErrorConstructor(HttpError, name, code);
          break;
      }
      if (CodeError) {
        exports[code] = CodeError;
        exports[name] = CodeError;
      }
    });
  }
  function toClassName(name) {
    return name.substr(-5) !== "Error" ? name + "Error" : name;
  }
})(httpErrors);
var httpErrorsExports = httpErrors.exports;
const createError = /* @__PURE__ */ getDefaultExportFromCjs(httpErrorsExports);
const expressPort = 9457;
class TextFileSync {
  constructor(filename) {
    __privateAdd(this, _tempFilename);
    __privateAdd(this, _filename);
    __privateSet(this, _filename, filename);
    const f = filename.toString();
    __privateSet(this, _tempFilename, path.join(path.dirname(f), `.${path.basename(f)}.tmp`));
  }
  read() {
    let data;
    try {
      data = node_fs.readFileSync(__privateGet(this, _filename), "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return data;
  }
  write(str) {
    node_fs.writeFileSync(__privateGet(this, _tempFilename), str);
    node_fs.renameSync(__privateGet(this, _tempFilename), __privateGet(this, _filename));
  }
}
_tempFilename = new WeakMap();
_filename = new WeakMap();
class DataFileSync {
  constructor(filename, { parse, stringify }) {
    __privateAdd(this, _adapter);
    __privateAdd(this, _parse);
    __privateAdd(this, _stringify);
    __privateSet(this, _adapter, new TextFileSync(filename));
    __privateSet(this, _parse, parse);
    __privateSet(this, _stringify, stringify);
  }
  read() {
    const data = __privateGet(this, _adapter).read();
    if (data === null) {
      return null;
    } else {
      return __privateGet(this, _parse).call(this, data);
    }
  }
  write(obj) {
    __privateGet(this, _adapter).write(__privateGet(this, _stringify).call(this, obj));
  }
}
_adapter = new WeakMap();
_parse = new WeakMap();
_stringify = new WeakMap();
class JSONFileSync extends DataFileSync {
  constructor(filename) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data) => JSON.stringify(data, null, 2)
    });
  }
}
class MemorySync {
  constructor() {
    __privateAdd(this, _data, null);
  }
  read() {
    return __privateGet(this, _data) || null;
  }
  write(obj) {
    __privateSet(this, _data, obj);
  }
}
_data = new WeakMap();
function checkArgs(adapter, defaultData) {
  if (adapter === void 0)
    throw new Error("lowdb: missing adapter");
  if (defaultData === void 0)
    throw new Error("lowdb: missing default data");
}
class LowSync {
  constructor(adapter, defaultData) {
    __publicField(this, "adapter");
    __publicField(this, "data");
    checkArgs(adapter, defaultData);
    this.adapter = adapter;
    this.data = defaultData;
  }
  read() {
    const data = this.adapter.read();
    if (data)
      this.data = data;
  }
  write() {
    if (this.data)
      this.adapter.write(this.data);
  }
  update(fn) {
    fn(this.data);
    this.write();
  }
}
function JSONFileSyncPreset(filename, defaultData) {
  const adapter = process.env.NODE_ENV === "test" ? new MemorySync() : new JSONFileSync(filename);
  const db = new LowSync(adapter, defaultData);
  db.read();
  return db;
}
const _expressAppClass = class _expressAppClass {
  static startListening() {
    if (!this.isServerRunning) {
      this.isServerRunning = true;
      this.server.listen(this.port);
    }
  }
  static defaultLordData() {
    var _a;
    return {
      id: crypto.randomUUID(),
      ip: this.ip,
      username: "",
      computerName: lodash.toString((_a = process.env) == null ? void 0 : _a.COMPUTERNAME),
      defaultPrinter: null,
      printers: [],
      toPrintsCommands: [],
      lastPrinted: 0,
      ConnectedPCs: [],
      recentlyConnectedPCs: [],
      lastCheckConnectedPC: 0,
      offlineComputers: []
    };
  }
  static reloadDatabase() {
    this.db = JSONFileSyncPreset(this.dbPath, this.defaultLordData());
  }
  static startServer() {
    let o = false;
    console.log("Starting web server for main computer!", this.dbPath, this.db.data.computerName, electron.app.getAppPath());
    this.beforeStartSever();
    process.on("SIGTERM", this.shutdown);
    process.on("SIGINT", this.shutdown);
    this.startListening();
    this.server.on("error", this.handleServerError);
    this.server.on("listening", () => console.log(`Listening on: http//localhost:${this.port}`));
    this.server.on("close", () => console.log("Express server closed."));
    return o;
  }
  static beforeStartSever() {
    this.dir.map((el) => !node_fs.existsSync(el) && node_fs.mkdirSync(el, { recursive: true }));
    this.db.write();
    this.routesInit();
    this.middlewareInit();
    this.server = http.createServer(this.app);
  }
  static handleServerError(error) {
    if (error.syscall !== "listen") throw error;
    const bind = typeof this.port === "string" ? `Pipe ${_expressAppClass.port}` : `Port ${_expressAppClass.port}`;
    switch (error.code) {
      case "EACCES":
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
  static middlewareInit() {
    this.app.set("port", expressPort);
    this.app.use((req, res, next) => {
      this.reloadDatabase();
      next();
    });
    this.app.use(cors());
    this.app.use(logger("dev"));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(fileUpload());
    this.app.use("/public/", express.static(this.dir[1]));
    this.app.use("/upload/", express.static(this.dir[0]));
    this.app.use("/api/v1/", this.router);
    this.app.use((_req, _res, next) => next(createError(404)));
    this.app.use((err, req, res, _next) => {
      res.locals.title = "error";
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status || 500).send("error " + err.status);
    });
  }
  static shutdown() {
    console.log("Shutting down Express server...");
    this.server.close();
  }
  static routesInit() {
    this.router.get("/ping", (req, res) => res.send("pong"));
    this.router.get("/popo", (req, res) => {
      res.send(`<html>
                <body>
                  <form ref='uploadForm'
                    id='uploadForm'
                    action='/api/v1/upload/'
                    method='post'
                    encType="multipart/form-data">
                      <input type="file" name="sampleFile" />
                      <input type='submit' value='Upload!' />
                  </form>
                </body>
              </html>`);
    });
    this.router.post("/upload", this.uploadMethod);
    this.router.post("/print", this.printMethod);
    this.router.get("/printers", async (req, res) => {
      pdfToPrinter.getPrinters().then((printers) => {
        res.json(printers);
      }).catch((err) => {
        res.status(400).send("Something went wrong. Please try again");
      });
    });
    this.router.get("/printers/default", async (req, res) => {
      pdfToPrinter.getDefaultPrinter().then((defaultPrinter) => {
        res.json(defaultPrinter);
      }).catch((err) => {
        res.status(400).send("Something went wrong. Please try again");
      });
    });
    this.router.get("/defaultData", async (req, res) => {
      res.json(this.defaultLordData());
    });
    this.router.get("/data", async (req, res) => {
      res.json(this.db.data);
    });
    this.router.get("/profile", this.profileMethod);
    this.router.get("/connected-pc", this.connectedPCMethod);
    this.router.get("/data", async (req, res) => {
      res.json(this.db.data);
    });
    this.router.delete("/data", async (req, res) => {
      if (req.body) ;
    });
  }
  static async uploadMethod(req, res, next) {
    console.log("uploaded file : ", req == null ? void 0 : req.files);
    let sampleFile = {};
    let uploadPath;
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }
    sampleFile = req.files.sampleFile;
    let newFileName = uuid.v7() + require$$0$1.extname(sampleFile.name);
    uploadPath = _expressAppClass.dir[1] + newFileName;
    sampleFile.mv(uploadPath, function(err) {
      var _a, _b;
      if (err)
        return res.status(500).send(err);
      console.log("File uploaded!");
      console.log("req.file", req.file);
      console.log("req.body", req.body);
      const fileData = {};
      fileData.originalName = sampleFile.name;
      fileData.encoding = sampleFile.encoding;
      fileData.mimetype = sampleFile.mimetype;
      fileData.destination = uploadPath;
      fileData.filename = newFileName;
      fileData.path = _expressAppClass.dir[1];
      fileData.size = sampleFile.size;
      let o = {
        ...fileData,
        ...{
          uploaded: true,
          addedTime: Date.now(),
          isPrinted: false,
          addedBy: ((_a = req.body) == null ? void 0 : _a.addedBy) || null,
          printOptions: ((_b = req.body) == null ? void 0 : _b.printOptions) || null
        }
      };
      console.log(o);
      res.json(o);
      _expressAppClass.db.data.toPrintsCommands.push(o);
      _expressAppClass.db.write();
      return;
    });
  }
  static printMethod(req, res) {
    var _a, _b;
    if ((_a = req.body) == null ? void 0 : _a.filename) {
      let file = lodash.find(_expressAppClass.db.data.toPrintsCommands, ["filename", req.body.filename]);
      let fileIndex = lodash.findIndex(_expressAppClass.db.data.toPrintsCommands, ["filename", req.body.filename]);
      console.log(req.body);
      if (file) {
        let options = (_b = req.body) == null ? void 0 : _b.options;
        console.log(fileIndex, options);
        pdfToPrinter.print(file.destination, options).then(() => {
          file.isPrinted = true;
          res.json({ print: "successful" });
          console.log(`Printed file: ${file.filename} : ${file.originalName}`);
        }).catch((err) => {
          var _a2;
          res.json({ print: "failed" });
          file.isPrinted = false;
          console.error(`Error printing file: ${(_a2 = req.body) == null ? void 0 : _a2.filename}`, err);
        });
        _expressAppClass.db.data.toPrintsCommands[fileIndex] = { ...file, ...{ printOptions: options ? options : null } };
        _expressAppClass.db.write();
      }
    }
  }
  static profileMethod(req, res) {
    var _a;
    let o = {};
    o = { ...o, ...lodash.pick(_expressAppClass.db.data, ["username", "computerName", "ip", "lastPrinted"]) };
    o.id = _expressAppClass.db.data.id;
    o.lastSeen = Date.now();
    o.lastPrinted = (_a = _expressAppClass.db.data) == null ? void 0 : _a.lastPrinted;
    o.isConnected = true;
    res.json(o);
  }
  static async connectedPCMethod(req, res) {
    var _a;
    let ipAddress = ip.address();
    let ipLeft = lodash.dropRight(ipAddress.split("."));
    let ipSeries = lodash.floor(Number(lodash.last(ipAddress.split("."))), -1);
    console.log(ipAddress, ipLeft, ipSeries);
    const query = req.query;
    const numbersToRefresh = (query == null ? void 0 : query.numbersToRefresh) ? +(query == null ? void 0 : query.numbersToRefresh) : 31;
    console.log("query?.numbersToRefresh", query == null ? void 0 : query.numbersToRefresh);
    let computers = [];
    if ((_a = _expressAppClass.db.data) == null ? void 0 : _a.lastCheckConnectedPC) {
      let diff = Date.now() - +_expressAppClass.db.data.lastCheckConnectedPC;
      console.log("diff", diff);
      if (diff < 2 * 60 * 1e3 && query.force != "yes") {
        res.json(_expressAppClass.db.data.recentlyConnectedPCs);
        return;
      }
    }
    for (let i = 0; i < numbersToRefresh; i++) {
      if (ip.address() == "127.0.0.1") break;
      let url2 = `http://${ipLeft.join(".")}.${ipSeries + i}:9457`;
      let ping = url2 + "/api/v1/";
      console.log("getting request to server : ", url2);
      await axios.get(ping + "ping", { timeout: 50 }).then(async (response) => {
        console.log("Found PC at : ", ping);
        let o = {};
        let profile = await axios.get(ping + "profile");
        let printers = await axios.get(ping + "printers");
        let printersDefault = await axios.get(ping + "printers/default");
        o = { ...o, ...profile.data };
        printers.data.sort((a, b) => printersDefault.data.name == a.name ? -1 : 1);
        o.printers = printers.data;
        o.printersDefault = printersDefault.data;
        if (`${ipLeft.join(".")}.${ipSeries + i}` == ipAddress) {
          o.computerName = o.computerName;
        }
        o.isConnected = true;
        o.ip = `${ipLeft.join(".")}.${ipSeries + i}`;
        o.lastSeen = Date.now();
        computers.push(o);
      }).catch((error) => {
      });
    }
    let computerNameList = computers.map((el) => el == null ? void 0 : el.ip);
    console.log("computerNameList", computerNameList);
    let remainingLastOfflinePCs = lodash.uniqBy(_expressAppClass.db.data.recentlyConnectedPCs.filter((el) => !computerNameList.includes(el == null ? void 0 : el.ip)).map((el) => {
      el.isConnected = false;
      return el;
    }), "ip");
    console.log("remainingLastOfflinePCs", remainingLastOfflinePCs);
    _expressAppClass.db.data.ConnectedPCs = computers;
    _expressAppClass.db.data.recentlyConnectedPCs = lodash.sortBy(lodash.uniqBy(lodash.concat(computers, remainingLastOfflinePCs), "ip"), ["lastSeen"]);
    _expressAppClass.db.data.lastCheckConnectedPC = Date.now();
    _expressAppClass.db.write();
    res.json(_expressAppClass.db.data.recentlyConnectedPCs);
  }
};
__publicField(_expressAppClass, "app", express());
__publicField(_expressAppClass, "router", express.Router());
__publicField(_expressAppClass, "port", 9457);
__publicField(_expressAppClass, "server", "");
__publicField(_expressAppClass, "isServerRunning", false);
__publicField(_expressAppClass, "ip", ip.address());
__publicField(_expressAppClass, "dir", [
  require$$0$1.join(os.homedir(), electron.app.getName(), "./public/"),
  require$$0$1.join(os.homedir(), electron.app.getName(), "./upload/"),
  require$$0$1.join(os.homedir(), electron.app.getName(), "./db/")
]);
// crypto.pseudoRandomBytes
__publicField(_expressAppClass, "computerName", process.env.COMPUTERNAME);
__publicField(_expressAppClass, "dbName", `lordPrinter-${_expressAppClass.ip}.json`);
__publicField(_expressAppClass, "dbPath", require$$0$1.join(_expressAppClass.dir[2], _expressAppClass.dbName));
__publicField(_expressAppClass, "db", JSONFileSyncPreset(_expressAppClass.dbPath, _expressAppClass.defaultLordData()));
let expressAppClass = _expressAppClass;
process.env.DIST_ELECTRON = path.join(__dirname, "..");
process.env.DIST = path.join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
if (os.release().startsWith("6.1")) electron.app.disableHardwareAcceleration();
if (process.platform === "win32") electron.app.setAppUserModelId(electron.app.getName());
if (!electron.app.requestSingleInstanceLock()) {
  electron.app.quit();
  process.exit(0);
}
let win = null;
const preload = path.join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, "index.html");
electron.app.getPath("exe");
const dir = [
  path.join(os$1.homedir(), electron.app.getName(), "/public/"),
  path.join(os$1.homedir(), electron.app.getName(), "/upload/pdf/"),
  path.join(os$1.homedir(), electron.app.getName(), "/db/")
];
dir.map((el) => !fs.existsSync(el) && fs.mkdirSync(el, { recursive: true }));
async function createWindow() {
  if (!expressAppClass.isServerRunning) {
    expressAppClass.startServer();
  }
  win = new electron.BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.PUBLIC, "favicon.ico"),
    width: 900,
    height: 600,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
    win.setMenuBarVisibility(false);
  }
  win.on("closed", () => {
    win = null;
    expressAppClass.shutdown();
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:")) electron.shell.openExternal(url2);
    return { action: "deny" };
  });
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
electron.app.on("activate", () => {
  const allWindows = electron.BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
electron.ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new electron.BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
electron.ipcMain.on("ping", () => {
});
electron.ipcMain.handle("version", () => electron.app.getVersion());
//# sourceMappingURL=index.js.map
